import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { classifyEmail, extractCompany, STAGE_ORDER, GMAIL_QUERY } from '@/lib/gmailSyncHelpers'

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
    const query = GMAIL_QUERY
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`,
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

    for (const msg of messages.slice(0, 50)) {
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
            user_id: user.id,
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

    return NextResponse.json({ processed, updated, total: messages.length })
  } catch (err) {
    console.error('[Gmail sync] Error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
