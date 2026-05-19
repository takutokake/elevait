export const STAGE_PATTERNS: { stage: string; patterns: RegExp[] }[] = [
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

export const BLOCKED_DOMAINS = new Set([
  'tryexponent', 'exponent', 'leetcode', 'hackerrank', 'glassdoor',
  'linkedin', 'indeed', 'productmanagementexercises', 'levels', 'levelsfyi',
  'teamblind', 'blind', 'coursera', 'udemy', 'dice', 'ziprecruiter',
  'monster', 'careerbuilder', 'simplyhired', 'builtinnyc', 'builtin',
  'wellfound', 'angel', 'otta', 'pave', 'candor', 'remoteok',
  'noreply', 'notifications', 'newsletter', 'no-reply',
])

export const ATS_DOMAINS = new Set([
  'greenhouse', 'lever', 'workday', 'myworkday', 'taleo', 'icims',
  'smartrecruiters', 'jobvite', 'bamboohr', 'successfactors',
  'ultipro', 'jazzhr', 'breezy', 'recruitee', 'ashby', 'rippling',
  'apply', 'careers', 'recruiting', 'talent',
])

export const STAGE_ORDER = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

export const GMAIL_QUERY = [
  '(',
  'interview OR "take-home" OR "take home" OR "next step" OR "next steps" OR',
  '"phone screen" OR "offer letter" OR "not moving forward" OR',
  '"application received" OR "thank you for applying" OR',
  '"technical assessment" OR "coding challenge" OR "as a next step" OR',
  '"invite you to" OR "we would like to" OR assignment OR assessment OR',
  'unfortunately OR "we have decided" OR "move forward" OR "moving forward"',
  ') newer_than:90d -category:promotions',
].join(' ')

export function classifyEmail(subject: string, snippet: string): string | null {
  const text = `${subject} ${snippet}`
  for (const { stage, patterns } of STAGE_PATTERNS) {
    if (patterns.some(p => p.test(text))) return stage
  }
  return null
}

export function extractCompany(from: string, subject: string): string | null {
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
