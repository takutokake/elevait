import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { classifyEmail, extractCompany, STAGE_ORDER, GMAIL_QUERY } from '@/lib/gmailSyncHelpers'
import { extractBodyText, extractEmailIntel } from '@/lib/emailIntelExtractor'

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
    const messages: { id: string }[] = listData.messages || []

    const batch = messages.slice(0, 50)

    // Pre-fetch already-processed message IDs to skip duplicates
    const batchIds = batch.map(m => m.id)
    const { data: existingEvents } = await supabase
      .from('application_email_events')
      .select('gmail_message_id')
      .in('gmail_message_id', batchIds)
      .eq('user_id', user.id)
    const processedIds = new Set(existingEvents?.map((e: any) => e.gmail_message_id) || [])

    const { data: apps } = await supabase
      .from('applications')
      .select('id, company, stage, next_action_source')
      .eq('user_id', user.id)

    const appMap = new Map<string, { id: string; stage: string; next_action_source?: string | null }>()
    apps?.forEach(a => appMap.set(a.company.toLowerCase(), { id: a.id, stage: a.stage, next_action_source: a.next_action_source }))

    let processed = 0
    let updated = 0

    for (const msg of batch) {
      try {
        if (processedIds.has(msg.id)) continue

        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        const detail = await detailRes.json()
        const headers: { name: string; value: string }[] = detail.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || ''
        const from = headers.find(h => h.name === 'From')?.value || ''
        const threadId: string = detail.threadId || ''
        const internalDate: string = detail.internalDate || String(Date.now())
        const snippet: string = detail.snippet || ''

        const body = extractBodyText(detail.payload)
        const receivedDate = new Date(Number(internalDate)).toISOString()

        const intel = await extractEmailIntel({ subject, body, from, receivedDate })

        // Use Gemini result when confident; fall back to regex
        const useIntel = intel && intel.confidence !== 'low'
        const newStage = useIntel && intel.stage ? intel.stage : classifyEmail(subject, snippet)
        if (!newStage) continue

        const company = (useIntel && intel.company) ? intel.company : extractCompany(from, subject)
        if (!company) continue

        const existing = appMap.get(company.toLowerCase())
        processed++

        let applicationId: string | null = null

        if (existing) {
          const currentIdx = STAGE_ORDER.indexOf(existing.stage)
          const newIdx = STAGE_ORDER.indexOf(newStage)
          if (newIdx > currentIdx || newStage === 'Rejected') {
            const updateData: Record<string, unknown> = {
              stage: newStage,
              interview_date: intel?.interview_date ?? null,
              interview_type: intel?.interview_type ?? null,
              action_items: intel?.action_items ?? [],
              ai_summary: intel?.summary ?? null,
              ai_confidence: intel?.confidence ?? null,
              last_email_at: receivedDate,
              updated_at: new Date().toISOString(),
            }
            if (existing.next_action_source !== 'manual') {
              updateData.next_action = intel?.summary ?? null
              updateData.next_action_source = 'auto'
            }
            await supabase.from('applications').update(updateData).eq('id', existing.id)
            applicationId = existing.id
            updated++
          } else {
            applicationId = existing.id
          }
        } else {
          const role = (useIntel && intel.role) ? intel.role : 'Product Manager'
          const insertData: Record<string, unknown> = {
            user_id: user.id,
            company,
            role,
            stage: newStage,
            source: 'gmail',
            bg_color: '#0ea5e9',
            interview_date: intel?.interview_date ?? null,
            interview_type: intel?.interview_type ?? null,
            action_items: intel?.action_items ?? [],
            ai_summary: intel?.summary ?? null,
            ai_confidence: intel?.confidence ?? null,
            last_email_at: receivedDate,
            next_action_source: 'auto',
            next_action: intel?.summary ?? null,
            updated_at: new Date().toISOString(),
          }
          const { data: inserted, error: insertErr } = await supabase
            .from('applications')
            .insert(insertData)
            .select('id')
            .single()
          if (!insertErr && inserted) {
            appMap.set(company.toLowerCase(), { id: inserted.id, stage: newStage, next_action_source: 'auto' })
            applicationId = inserted.id
            updated++
          }
        }

        if (applicationId) {
          await supabase.from('application_email_events').upsert({
            application_id: applicationId,
            user_id: user.id,
            gmail_message_id: msg.id,
            gmail_thread_id: threadId,
            received_at: receivedDate,
            subject,
            from_address: from,
            extracted_stage: newStage,
            extracted_role: intel?.role ?? null,
            extracted_interview_date: intel?.interview_date ?? null,
            extracted_interview_type: intel?.interview_type ?? null,
            extracted_action_items: intel?.action_items ?? null,
            ai_summary: intel?.summary ?? null,
            ai_confidence: intel?.confidence ?? null,
          }, { onConflict: 'gmail_message_id', ignoreDuplicates: true })
        }
      } catch { /* skip individual message errors */ }
    }

    return NextResponse.json({ processed, updated, total: messages.length })
  } catch (err) {
    console.error('[Gmail sync] Error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
