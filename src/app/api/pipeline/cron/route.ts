import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyEmail, extractCompany, STAGE_ORDER, GMAIL_QUERY } from '@/lib/gmailSyncHelpers'

/**
 * Vercel Cron endpoint — runs every 6 hours (see vercel.json).
 * Syncs Gmail for every user who has a connected Gmail token
 * and updates their application pipeline stages.
 *
 * Also callable manually:
 *   curl -X GET https://your-domain.com/api/pipeline/cron \
 *     -H "Authorization: Bearer <CRON_SECRET>"
 */

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const userAgent = request.headers.get('user-agent') || ''
  const cronSecret = process.env.CRON_SECRET
  const syncSecret = process.env.PIPELINE_SYNC_SECRET
  const isDev = process.env.NODE_ENV === 'development'

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isManualSync = syncSecret && authHeader === `Bearer ${syncSecret}`
  const isVercelCronUA = userAgent.includes('vercel-cron')

  if (!isVercelCron && !isManualSync && !isDev && !isVercelCronUA) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  const { data: tokenRows, error: fetchErr } = await supabase
    .from('user_oauth_tokens')
    .select('user_id, access_token, refresh_token, expires_at')
    .eq('provider', 'gmail')

  if (fetchErr) {
    console.error('[Pipeline cron] Failed to fetch tokens:', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  const results: { user_id: string; processed: number; updated: number; total: number }[] = []
  const errors: { user_id: string; error: string }[] = []

  for (const row of tokenRows || []) {
    try {
      let accessToken = row.access_token

      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        if (!row.refresh_token) {
          errors.push({ user_id: row.user_id, error: 'token_expired_no_refresh' })
          continue
        }
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: row.refresh_token,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: 'refresh_token',
          }),
        })
        const refreshed = await refreshRes.json()
        if (!refreshRes.ok) {
          errors.push({ user_id: row.user_id, error: 'token_refresh_failed' })
          continue
        }
        accessToken = refreshed.access_token
        await supabase.from('user_oauth_tokens').update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', row.user_id).eq('provider', 'gmail')
      }

      const result = await syncUserGmail(supabase, row.user_id, accessToken)
      results.push({ user_id: row.user_id, ...result })
    } catch (e) {
      console.error(`[Pipeline cron] Error syncing user ${row.user_id}:`, e)
      errors.push({ user_id: row.user_id, error: String(e) })
    }
  }

  console.log(`[Pipeline cron] Done — synced ${results.length} users, ${errors.length} errors`)
  return NextResponse.json({
    synced_users: results.length,
    total_users: (tokenRows || []).length,
    errors: errors.length,
    results,
    synced_at: new Date().toISOString(),
  })
}

async function syncUserGmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string,
): Promise<{ processed: number; updated: number; total: number }> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(GMAIL_QUERY)}&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  const listData = await listRes.json()
  const messages: { id: string }[] = listData.messages || []

  const { data: apps } = await supabase
    .from('applications')
    .select('id, company, stage')
    .eq('user_id', userId)

  const appMap = new Map<string, { id: string; stage: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apps?.forEach((a: any) => appMap.set(a.company.toLowerCase(), { id: a.id, stage: a.stage }))

  let processed = 0
  let updated = 0

  for (const msg of messages.slice(0, 50)) {
    try {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const detail = await detailRes.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headers: { name: string; value: string }[] = detail.payload?.headers || []
      const subject = headers.find(h => h.name === 'Subject')?.value || ''
      const from = headers.find(h => h.name === 'From')?.value || ''
      const snippet: string = detail.snippet || ''

      const newStage = classifyEmail(subject, snippet)
      if (!newStage) continue

      const company = extractCompany(from, subject)
      if (!company) continue

      const existing = appMap.get(company.toLowerCase())
      processed++

      if (existing) {
        const currentIdx = STAGE_ORDER.indexOf(existing.stage)
        const newIdx = STAGE_ORDER.indexOf(newStage)
        if (newIdx > currentIdx || newStage === 'Rejected') {
          await supabase.from('applications').update({
            stage: newStage,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id)
          updated++
        }
      } else {
        const { data: inserted, error: insertErr } = await supabase.from('applications').insert({
          user_id: userId,
          company,
          role: 'Product Manager',
          stage: newStage,
          source: 'gmail',
          bg_color: '#0ea5e9',
          updated_at: new Date().toISOString(),
        }).select('id').single()
        if (!insertErr && inserted) {
          appMap.set(company.toLowerCase(), { id: inserted.id, stage: newStage })
          updated++
        }
      }
    } catch { /* skip individual message errors */ }
  }

  return { processed, updated, total: messages.length }
}
