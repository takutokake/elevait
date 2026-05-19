// @ts-nocheck — Deno Edge Function (not compiled by Next.js tsconfig)
// Supabase Edge Function: pipeline-sync
// Runs every 6 hours (scheduled via pg_cron) to sync Gmail for all users
// with a connected Gmail token and update their application pipeline stages.
//
// Deploy: supabase functions deploy pipeline-sync
// Secrets: supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
//          supabase secrets set GOOGLE_AI_API_KEY=...
//   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Email body extraction ───────────────────────────────────────────────────

function extractBodyText(payload: any): string {
  function decode(data: string): string {
    try {
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
      const binaryStr = atob(base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      return new TextDecoder('utf-8').decode(bytes)
    } catch {
      return ''
    }
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  function walk(part: any): { plain: string | null; html: string | null } {
    if (!part) return { plain: null, html: null }
    if (part.mimeType === 'text/plain' && part.body?.data) return { plain: decode(part.body.data), html: null }
    if (part.mimeType === 'text/html' && part.body?.data) return { plain: null, html: decode(part.body.data) }
    if (Array.isArray(part.parts)) {
      let plain: string | null = null
      let html: string | null = null
      for (const child of part.parts) {
        const r = walk(child)
        if (r.plain && !plain) plain = r.plain
        if (r.html && !html) html = r.html
      }
      return { plain, html }
    }
    return { plain: null, html: null }
  }

  const { plain, html } = walk(payload)
  const text = plain || (html ? stripHtml(html) : '')
  return text.slice(0, 1500)
}

// ─── Gemini extraction via REST API ─────────────────────────────────────────

interface EmailIntel {
  stage: string | null
  role: string | null
  company: string | null
  interview_date: string | null
  interview_type: string | null
  deadline: string | null
  action_items: Array<{ text: string; due: string | null }>
  summary: string | null
  confidence: 'high' | 'medium' | 'low'
}

async function extractEmailIntelDeno(params: {
  subject: string
  body: string
  from: string
  receivedDate: string
  apiKey: string
}): Promise<EmailIntel | null> {
  try {
    const schema = {
      type: 'OBJECT',
      properties: {
        stage: { type: 'STRING', format: 'enum', nullable: true, enum: ['Applied', 'Interview', 'Offer', 'Rejected'], description: 'Set Rejected ONLY if explicitly rejected.' },
        role: { type: 'STRING', nullable: true },
        company: { type: 'STRING', nullable: true },
        interview_date: { type: 'STRING', nullable: true, description: 'ISO8601 datetime. Only set if specific day AND time mentioned.' },
        interview_type: { type: 'STRING', format: 'enum', nullable: true, enum: ['phone_screen', 'technical', 'hiring_manager', 'panel', 'onsite', 'take_home'] },
        deadline: { type: 'STRING', nullable: true, description: 'ISO8601 date for application or response deadline.' },
        action_items: {
          type: 'ARRAY',
          description: 'Up to 3 candidate-actionable items.',
          items: {
            type: 'OBJECT',
            properties: { text: { type: 'STRING' }, due: { type: 'STRING', nullable: true } },
            required: ['text'],
          },
        },
        summary: { type: 'STRING', nullable: true, description: 'Max 20-word summary addressed to the candidate.' },
        confidence: { type: 'STRING', format: 'enum', enum: ['high', 'medium', 'low'], description: 'Set low if ambiguous or not clearly a job application.' },
      },
      required: ['confidence', 'action_items'],
    }

    const prompt = `You are an assistant that extracts structured information from job application emails.

Email details:
From: ${params.from}
Date: ${params.receivedDate}
Subject: ${params.subject}
Body (first 1500 chars):
${params.body}

Rules:
- stage: Set to "Rejected" ONLY if the email explicitly rejects the candidate. Set to "Interview" ONLY if the email is personally scheduling/inviting the candidate to an interview, phone screen, or technical assessment for a specific role — NOT for general events, webinars, or networking sessions. Set to "Offer" only if a formal offer is extended. Set to "Applied" if it is an application confirmation. Leave null if unclear.
- interview_date: Only set if a specific day AND time are mentioned for a personal interview. Use ISO8601 format.
- action_items: Only include items the CANDIDATE must act on. Max 3.
- confidence: Set to "low" if the email is: a company event invitation, career fair, open house, webinar, networking event, newsletter, promotional email, or not clearly about a specific personal job application. Also set to "low" if the email addresses multiple recipients or uses generic language like "check out", "join us", "upcoming events".
- summary: Address the candidate directly. Max 20 words.

Extract the information now.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${params.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
        }),
      },
    )

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null

    const parsed = JSON.parse(text) as EmailIntel
    if (!Array.isArray(parsed.action_items)) parsed.action_items = []
    parsed.action_items = parsed.action_items.slice(0, 3)
    return parsed
  } catch {
    return null
  }
}

// ─── Stage classification ────────────────────────────────────────────────────

const STAGE_PATTERNS: { stage: string; patterns: RegExp[] }[] = [
  {
    stage: 'Offer',
    patterns: [
      /offer letter/i, /we.*like to offer/i, /congratulations.*offer/i,
      /pleased to offer/i, /excited to offer/i, /extend.*offer/i,
      /we are thrilled/i, /we are delighted.*join/i, /welcome to the team/i,
      /pleased to inform.*joining/i, /you.*been selected.*offer/i,
    ],
  },
  {
    stage: 'Rejected',
    patterns: [
      /not moving forward/i, /unfortunately.*not selected/i, /regret to inform/i,
      /decided to pursue other/i, /will not be moving/i, /not.*proceed/i,
      /after careful consideration/i, /decided to move forward with other/i,
      /not.*fit.*at this time/i, /pursued other candidates/i,
      /position has been filled/i, /no longer consider/i, /cannot move forward/i,
      /not.*opportunity at this time/i, /we won't be moving/i,
      /not.*advance/i, /not.*progress/i, /we have decided not/i,
      /unfortunately.*filled/i, /update.*status.*not/i,
    ],
  },
  {
    stage: 'Interview',
    patterns: [
      /interview/i, /schedule.*call/i, /phone screen/i, /technical screen/i,
      /hiring manager/i, /take.?home/i, /take home assignment/i,
      /coding.*challenge/i, /technical.*challenge/i, /technical.*assessment/i,
      /online.*assessment/i, /virtual.*assessment/i,
      /case study/i, /next step/i, /next round/i, /advance.*round/i,
      /move.*forward/i, /moving.*forward/i, /invite you to/i,
      /as a next step/i, /as the next step/i, /we.*invite/i,
      /we.*like to schedule/i, /would like to schedule/i,
      /assignment/i, /assessment/i, /we.*like to invite/i,
      /follow.?up.*call/i, /virtual.*interview/i, /onsite/i,
      /video.*call/i, /zoom.*interview/i, /meet.*team/i,
      /we.*move.*process/i, /continue.*process/i, /progress.*next/i,
    ],
  },
  {
    stage: 'Applied',
    patterns: [
      /thank you for applying/i, /application received/i,
      /we received your application/i, /we.ll review/i,
      /under review/i, /being reviewed/i, /application.*submitted/i,
      /successfully applied/i, /we.*review.*application/i,
      /application.*under consideration/i, /application.*confirmed/i,
    ],
  },
]

const BLOCKED_DOMAINS = new Set([
  'tryexponent', 'exponent', 'leetcode', 'hackerrank', 'glassdoor',
  'linkedin', 'indeed', 'productmanagementexercises', 'levels', 'levelsfyi',
  'teamblind', 'blind', 'coursera', 'udemy', 'dice', 'ziprecruiter',
  'monster', 'careerbuilder', 'simplyhired', 'builtinnyc', 'builtin',
  'wellfound', 'angel', 'otta', 'pave', 'candor', 'remoteok',
  'noreply', 'notifications', 'newsletter', 'no-reply',
])

const ATS_DOMAINS = new Set([
  'greenhouse', 'lever', 'workday', 'myworkday', 'taleo', 'icims',
  'smartrecruiters', 'jobvite', 'bamboohr', 'successfactors',
  'ultipro', 'jazzhr', 'breezy', 'recruitee', 'ashby', 'rippling',
  'apply', 'careers', 'recruiting', 'talent',
])

function classifyEmail(subject: string, snippet: string): string | null {
  const text = `${subject} ${snippet}`
  for (const { stage, patterns } of STAGE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return stage
  }
  return null
}

function extractCompany(from: string, subject: string): string | null {
  const emailMatch = from.match(/@([^.>\s]+)\./i)
  const domain = emailMatch?.[1]?.toLowerCase()
  if (!domain) return null
  if (BLOCKED_DOMAINS.has(domain)) return null
  if (ATS_DOMAINS.has(domain)) {
    const displayMatch = from.match(/^"?([^"<\n]+?)"?\s*</i)
    if (displayMatch) {
      const name = displayMatch[1]
        .replace(/\s*(recruiting|talent|careers|hr|hiring|team|people|ops|notifications?)\s*/gi, '')
        .trim()
      if (name.length > 1) return name
    }
    const subjectCompany = subject.match(/\b(?:at|with|from|@)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i)
    return subjectCompany?.[1]?.trim() || null
  }
  const pretty = domain.replace(/-/g, ' ')
  return pretty.charAt(0).toUpperCase() + pretty.slice(1)
}

// ─── Gmail sync for a single user ───────────────────────────────────────────

async function syncUserGmail(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  accessToken: string,
  googleAiApiKey: string,
): Promise<{ processed: number; updated: number; total: number }> {
  const query = [
    '(',
    'interview OR "take-home" OR "take home" OR "next step" OR "next steps" OR',
    '"phone screen" OR "offer letter" OR "not moving forward" OR',
    '"application received" OR "thank you for applying" OR',
    '"technical assessment" OR "coding challenge" OR "as a next step" OR',
    '"invite you to" OR "we would like to" OR assignment OR assessment OR',
    'unfortunately OR "we have decided" OR "move forward" OR "moving forward"',
    ') newer_than:90d -category:promotions',
  ].join(' ')

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  const listData = await listRes.json()
  const messages: { id: string }[] = listData.messages || []

  const batch = messages.slice(0, 50)

  // Pre-fetch already-processed message IDs
  const batchIds = batch.map((m) => m.id)
  const { data: existingEvents } = await supabase
    .from('application_email_events')
    .select('gmail_message_id')
    .in('gmail_message_id', batchIds)
    .eq('user_id', userId)
  // deno-lint-ignore no-explicit-any
  const processedIds = new Set(existingEvents?.map((e: any) => e.gmail_message_id) || [])

  const { data: apps } = await supabase
    .from('applications')
    .select('id, company, stage, next_action_source')
    .eq('user_id', userId)

  const appMap = new Map<string, { id: string; stage: string; next_action_source?: string | null }>()
  // deno-lint-ignore no-explicit-any
  apps?.forEach((a: any) => appMap.set(a.company.toLowerCase(), { id: a.id, stage: a.stage, next_action_source: a.next_action_source }))

  let processed = 0
  let updated = 0
  const STAGE_ORDER = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

  for (const msg of batch) {
    try {
      if (processedIds.has(msg.id)) continue

      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const detail = await detailRes.json()
      const headers: { name: string; value: string }[] = detail.payload?.headers || []
      const subject = headers.find((h) => h.name === 'Subject')?.value || ''
      const from = headers.find((h) => h.name === 'From')?.value || ''
      const threadId: string = detail.threadId || ''
      const internalDate: string = detail.internalDate || String(Date.now())
      const snippet: string = detail.snippet || ''

      const body = extractBodyText(detail.payload)
      const receivedDate = new Date(Number(internalDate)).toISOString()

      const intel = googleAiApiKey
        ? await extractEmailIntelDeno({ subject, body, from, receivedDate, apiKey: googleAiApiKey })
        : null

      // Use Gemini result when confident; fall back to regex
      const useIntel = intel && intel.confidence !== 'low'
      const newStage = useIntel && intel.stage ? intel.stage : classifyEmail(subject, snippet)
      if (!newStage) continue

      const company = useIntel && intel.company ? intel.company : extractCompany(from, subject)
      if (!company) continue

      const existing = appMap.get(company.toLowerCase())
      processed++

      let applicationId: string | null = null

      if (existing) {
        const currentIdx = STAGE_ORDER.indexOf(existing.stage)
        const newIdx = STAGE_ORDER.indexOf(newStage)
        if (newIdx > currentIdx || newStage === 'Rejected') {
          // deno-lint-ignore no-explicit-any
          const updateData: any = {
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
        const role = useIntel && intel.role ? intel.role : 'Product Manager'
        const { data: inserted, error: insertErr } = await supabase
          .from('applications')
          .insert({
            user_id: userId,
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
          })
          .select('id')
          .single()
        if (!insertErr && inserted) {
          appMap.set(company.toLowerCase(), { id: inserted.id, stage: newStage, next_action_source: 'auto' })
          applicationId = inserted.id
          updated++
        }
      }

      if (applicationId) {
        await supabase.from('application_email_events').upsert(
          {
            application_id: applicationId,
            user_id: userId,
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
          },
          { onConflict: 'gmail_message_id', ignoreDuplicates: true },
        )
      }
    } catch {
      // skip individual message errors
    }
  }

  return { processed, updated, total: messages.length }
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow both service role key and a dedicated PIPELINE_SYNC_SECRET
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const syncSecret = Deno.env.get('PIPELINE_SYNC_SECRET') || ''

  const isAuthorized =
    (serviceRoleKey && token === serviceRoleKey) ||
    (syncSecret && token === syncSecret)

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') || ''
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
  const googleAiApiKey = Deno.env.get('GOOGLE_AI_API_KEY') || ''

  // Fetch all users with a connected Gmail token
  const { data: tokenRows, error: fetchErr } = await supabase
    .from('user_oauth_tokens')
    .select('user_id, access_token, refresh_token, expires_at')
    .eq('provider', 'gmail')

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results: { user_id: string; processed: number; updated: number; total: number }[] = []
  const errors: { user_id: string; error: string }[] = []

  for (const row of tokenRows || []) {
    try {
      let accessToken: string = row.access_token

      // Refresh token if expired
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
            client_id: googleClientId,
            client_secret: googleClientSecret,
            grant_type: 'refresh_token',
          }),
        })
        const refreshed = await refreshRes.json()
        if (!refreshRes.ok) {
          errors.push({ user_id: row.user_id, error: 'token_refresh_failed' })
          continue
        }
        accessToken = refreshed.access_token
        await supabase
          .from('user_oauth_tokens')
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', row.user_id)
          .eq('provider', 'gmail')
      }

      const result = await syncUserGmail(supabase, row.user_id, accessToken, googleAiApiKey)
      results.push({ user_id: row.user_id, ...result })

      // Small delay between users to avoid Gmail API rate limits
      await new Promise((r) => setTimeout(r, 200))
    } catch (e) {
      errors.push({ user_id: row.user_id, error: String(e) })
    }
  }

  return new Response(
    JSON.stringify({
      synced_users: results.length,
      total_users: (tokenRows || []).length,
      errors: errors.length,
      results,
      errors_detail: errors,
      synced_at: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
