import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

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
    if (patterns.some(p => p.test(text))) return stage
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
