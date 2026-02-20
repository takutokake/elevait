import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Verify Slack HMAC signature.
 * We receive rawBody as a string so we can verify before parsing.
 */
async function verifySlackSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.SLACK_SIGNING_SECRET
  if (!secret) {
    console.error('[Slack] SLACK_SIGNING_SECRET not set — rejecting request')
    return false
  }
  if (!timestamp || !signature) {
    console.error('[Slack] Missing x-slack-request-timestamp or x-slack-signature headers')
    return false
  }

  // Reject requests older than 5 minutes to prevent replay attacks
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    console.error('[Slack] Request timestamp too old')
    return false
  }

  const sigBaseString = `v0:${timestamp}:${rawBody}`
  const hmac = createHmac('sha256', secret).update(sigBaseString).digest('hex')
  const computedSig = `v0=${hmac}`

  try {
    return timingSafeEqual(Buffer.from(computedSig), Buffer.from(signature))
  } catch {
    return false
  }
}

async function postToSlack(channel: string, text: string, thread_ts?: string) {
  return fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text, ...(thread_ts ? { thread_ts } : {}) }),
  })
}

async function fetchSlackMessage(channel: string, ts: string) {
  const res = await fetch(
    `https://slack.com/api/conversations.history?channel=${channel}&latest=${ts}&limit=1&inclusive=true`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
    }
  )
  const data = await res.json()
  if (!data.ok || !data.messages?.length) return null
  // Flatten blocks into plain text for ID extraction
  const msg = data.messages[0]
  const blockText = (msg.blocks ?? [])
    .flatMap((b: any) => [b.text?.text, ...(b.fields ?? []).map((f: any) => f.text)])
    .filter(Boolean)
    .join('\n')
  return { text: msg.text || '', blockText, raw: msg }
}

async function handleReactionAdded(event: any): Promise<{ success: boolean; message: string }> {
  const { reaction, item, user } = event

  if (item.type !== 'message') return { success: false, message: 'Not a message reaction' }

  const isApproval = ['white_check_mark', 'thumbsup', 'heavy_check_mark', 'check'].includes(reaction)
  if (!isApproval) return { success: false, message: 'Not an approval reaction — ignoring' }

  const msg = await fetchSlackMessage(item.channel, item.ts)
  if (!msg) return { success: false, message: 'Could not fetch Slack message' }

  // Search both plain text and block text for the application ID
  const combined = `${msg.text}\n${msg.blockText}`
  const match = combined.match(/Application ID[:\*\s]+([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)

  if (!match) {
    console.log('[Slack] No application ID found in message — not a mentor application message')
    return { success: false, message: 'No application ID in message' }
  }

  const applicationId = match[1]
  console.log(`[Slack] Approving application ${applicationId} by Slack user ${user}`)

  const supabase = getServiceClient()

  // 1. Update application status
  const { data: appData, error: appError } = await supabase
    .from('mentor_applications')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user,
    })
    .eq('id', applicationId)
    .select('user_id')
    .single()

  if (appError || !appData) {
    console.error('[Slack] DB error updating application:', appError)
    await postToSlack(item.channel, `❌ Failed to approve application \`${applicationId}\`: ${appError?.message ?? 'not found'}`, item.ts)
    return { success: false, message: appError?.message ?? 'Application not found' }
  }

  // 2. Promote user to mentor role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'mentor', onboarding_completed: true })
    .eq('id', appData.user_id)

  if (profileError) {
    console.error('[Slack] Profile update error:', profileError)
    await postToSlack(item.channel, `⚠️ Application approved but profile update failed: ${profileError.message}`, item.ts)
    return { success: false, message: profileError.message }
  }

  // 3. Upsert mentor record
  const { error: mentorError } = await supabase
    .from('mentors')
    .upsert({ id: appData.user_id, is_active: true }, { onConflict: 'id' })

  if (mentorError) {
    console.error('[Slack] Mentor upsert error:', mentorError)
  }

  // 4. Post confirmation thread reply
  await postToSlack(
    item.channel,
    `✅ *Mentor application approved!*\nApplication \`${applicationId}\` approved by <@${user}>. The applicant is now an active mentor.`,
    item.ts
  )

  return { success: true, message: 'Application approved successfully' }
}

/**
 * POST /api/slack/interactions
 *
 * Handles all Slack events for Elevait:
 * - URL verification challenge (required for setup)
 * - reaction_added → approve mentor application
 */
export async function POST(request: NextRequest) {
  try {
    // Read body as text ONCE so we can both verify the signature and parse JSON
    const rawBody = await request.text()

    // Parse JSON
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // ── URL verification challenge ──────────────────────────────────────────
    // Slack sends this when you first save the Request URL.
    // Must respond with the challenge value immediately — no auth needed.
    if (body.type === 'url_verification') {
      console.log('[Slack] Responding to URL verification challenge')
      return NextResponse.json({ challenge: body.challenge })
    }

    // ── Verify signature for all other requests ─────────────────────────────
    const timestamp = request.headers.get('x-slack-request-timestamp')
    const signature = request.headers.get('x-slack-signature')
    const verified = await verifySlackSignature(rawBody, timestamp, signature)

    if (!verified) {
      console.error('[Slack] Signature verification failed')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // ── Event callbacks ─────────────────────────────────────────────────────
    if (body.type === 'event_callback') {
      const event = body.event

      if (event.type === 'reaction_added') {
        // Process async — Slack requires a 200 within 3 seconds
        handleReactionAdded(event).catch((err) =>
          console.error('[Slack] Unhandled error in handleReactionAdded:', err)
        )
      }
    }

    // Always return 200 quickly so Slack doesn't retry
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[Slack] Unexpected error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
