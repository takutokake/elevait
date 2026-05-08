import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

const STAGE_PATTERNS: { stage: string; patterns: RegExp[] }[] = [
  { stage: 'Offer', patterns: [/offer letter/i, /we.*like to offer/i, /congratulations.*offer/i, /pleased to offer/i] },
  { stage: 'Rejected', patterns: [/not moving forward/i, /unfortunately.*not selected/i, /regret to inform/i, /decided to pursue other/i, /will not be moving/i] },
  { stage: 'Interview', patterns: [/interview/i, /schedule.*call/i, /phone screen/i, /technical screen/i, /hiring manager/i] },
  { stage: 'Applied', patterns: [/thank you for applying/i, /application received/i, /we received your application/i, /we'll review/i] },
]

function classifyEmail(subject: string, snippet: string): string | null {
  const text = `${subject} ${snippet}`
  for (const { stage, patterns } of STAGE_PATTERNS) {
    if (patterns.some(p => p.test(text))) return stage
  }
  return null
}

function extractCompany(from: string, subject: string): string | null {
  const emailMatch = from.match(/@([^.>]+)\.[a-z]+/i)
  if (emailMatch) {
    const domain = emailMatch[1].replace(/-/g, ' ')
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  const subjectMatch = subject.match(/(?:from|at|@)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:is|has|we|regarding|re:|your))/i)
  return subjectMatch?.[1]?.trim() || null
}

export async function POST() {
  const supabase = await getSupabaseRouteHandlerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: tokenRow } = await supabase
    .from('user_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'gmail')
    .single()

  if (!tokenRow?.access_token) {
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })
  }

  let accessToken = tokenRow.access_token

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    if (!tokenRow.refresh_token) {
      return NextResponse.json({ error: 'Token expired and no refresh token' }, { status: 400 })
    }
    try {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: tokenRow.refresh_token,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: 'refresh_token',
        }),
      })
      const refreshed = await refreshRes.json()
      if (!refreshRes.ok) return NextResponse.json({ error: 'Token refresh failed' }, { status: 400 })
      accessToken = refreshed.access_token
      await supabase.from('user_oauth_tokens').update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id).eq('provider', 'gmail')
    } catch {
      return NextResponse.json({ error: 'Token refresh error' }, { status: 500 })
    }
  }

  try {
    const query = 'subject:(application OR interview OR offer OR hired OR rejected) newer_than:90d'
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    const { data: apps } = await supabase
      .from('applications')
      .select('id, company, stage')
      .eq('user_id', user.id)

    const appMap = new Map<string, { id: string; stage: string }>()
    apps?.forEach(a => appMap.set(a.company.toLowerCase(), { id: a.id, stage: a.stage }))

    let processed = 0
    let updated = 0

    for (const msg of messages.slice(0, 20)) {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        const detail = await detailRes.json()
        const headers = detail.payload?.headers || []
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
        const from = headers.find((h: any) => h.name === 'From')?.value || ''
        const snippet = detail.snippet || ''

        const newStage = classifyEmail(subject, snippet)
        if (!newStage) continue

        const company = extractCompany(from, subject)
        if (!company) continue

        const existing = appMap.get(company.toLowerCase())
        processed++

        const STAGE_ORDER = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']
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
        }
      } catch { /* skip individual message errors */ }
    }

    return NextResponse.json({ processed, updated, total: messages.length })
  } catch (err) {
    console.error('[Gmail sync] Error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
