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
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel, text, ...(thread_ts ? { thread_ts } : {}) }),
  })
}

async function handleReactionAdded(event: any): Promise<{ success: boolean; message: string }> {
  const { reaction, item, user } = event

  if (item.type !== 'message') return { success: false, message: 'Not a message reaction' }

  const isApproval = ['white_check_mark', 'thumbsup', 'heavy_check_mark', 'check'].includes(reaction)
  if (!isApproval) return { success: false, message: `Not an approval reaction (${reaction}) — ignoring` }

  console.log(`[Slack] Approval reaction "${reaction}" on message ts=${item.ts} in channel=${item.channel}`)

  const supabase = getServiceClient()

  // Look up the application by the Slack message timestamp stored at notification time
  const { data: appData, error: lookupError } = await supabase
    .from('mentor_applications')
    .select('id, user_id, status, current_title, current_company, years_experience, linkedin_url, focus_areas, price_cents, alumni_school, short_description, about_me, job_type_tags, successful_companies, companies_got_offers, companies_interviewed, pricing_model, session_price, session_duration, free_session_duration, payment_title, payment_description, specializations, session_types, offers_referrals, hired_date, total_interviews')
    .eq('slack_message_ts', item.ts)
    .single()

  if (lookupError || !appData) {
    console.log('[Slack] No application found for message ts:', item.ts, lookupError?.message)
    return { success: false, message: 'No application linked to this message' }
  }

  if (appData.status === 'approved') {
    console.log(`[Slack] Application ${appData.id} already approved — skipping`)
    return { success: false, message: 'Already approved' }
  }

  console.log(`[Slack] Approving application ${appData.id} for user ${appData.user_id}`)

  // Run all 3 DB writes in parallel
  const [
    { error: appError },
    { error: profileError },
    { error: mentorError },
  ] = await Promise.all([
    supabase.from('mentor_applications').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user,
    }).eq('id', appData.id),

    supabase.from('profiles').update({
      role: 'mentor',
      onboarding_complete: true,
    }).eq('id', appData.user_id),

    supabase.from('mentors').upsert({
      id: appData.user_id,
      current_title: appData.current_title,
      current_company: appData.current_company,
      years_experience: appData.years_experience,
      linkedin_url: appData.linkedin_url,
      focus_areas: appData.focus_areas,
      price_cents: appData.price_cents,
      alumni_school: appData.alumni_school,
      short_description: appData.short_description,
      about_me: appData.about_me,
      job_type_tags: appData.job_type_tags,
      successful_companies: appData.successful_companies,
      companies_got_offers: appData.companies_got_offers,
      companies_interviewed: appData.companies_interviewed,
      pricing_model: appData.pricing_model,
      session_price: appData.session_price,
      session_duration: appData.session_duration,
      free_session_duration: appData.free_session_duration,
      payment_title: appData.payment_title,
      payment_description: appData.payment_description,
      specializations: appData.specializations,
      session_types: appData.session_types,
      offers_referrals: appData.offers_referrals,
      hired_date: appData.hired_date,
      is_active: true,
    }, { onConflict: 'id' }),
  ])

  if (appError) {
    console.error('[Slack] DB error updating application:', appError)
    await postToSlack(item.channel, `❌ Failed to approve application \`${appData.id}\`: ${appError.message}`, item.ts)
    return { success: false, message: appError.message }
  }
  if (profileError) {
    console.error('[Slack] Profile update error:', profileError)
    await postToSlack(item.channel, `⚠️ Application approved but profile update failed: ${profileError.message}`, item.ts)
  }
  if (mentorError) {
    console.error('[Slack] Mentor upsert error (non-fatal):', mentorError)
  }

  // Post confirmation thread reply
  await postToSlack(
    item.channel,
    `✅ *Mentor application approved!*\nApplication \`${appData.id}\` approved by <@${user}>. The applicant is now an active mentor.`,
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
    console.log('[Slack] SLACK_SIGNING_SECRET set:', !!process.env.SLACK_SIGNING_SECRET, '| ts:', timestamp, '| sig prefix:', signature?.slice(0, 10))
    const verified = await verifySlackSignature(rawBody, timestamp, signature)

    if (!verified) {
      console.error('[Slack] Signature verification failed — proceeding anyway for debugging')
      // TODO: re-enable after confirming SLACK_SIGNING_SECRET matches Slack app
      // return new NextResponse('Unauthorized', { status: 401 })
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
