/**
 * Parser for Jobright.ai GitHub README markdown tables.
 * Extracts PM job listings from curated GitHub repositories.
 */

export interface ParsedJob {
  company: string
  company_url: string | null
  job_title: string
  job_url: string
  location: string
  work_model: string
  date_posted: string
  role_type: 'new_grad' | 'internship'
  external_id: string | null
  source_repo: string
}

// Top companies for ranking — widely recognized brands candidates look for
const TOP_COMPANIES: Record<string, number> = {
  'google': 1,
  'meta': 2,
  'apple': 3,
  'amazon': 4,
  'microsoft': 5,
  'netflix': 6,
  'nvidia': 7,
  'openai': 8,
  'stripe': 9,
  'airbnb': 10,
  'uber': 11,
  'salesforce': 12,
  'adobe': 13,
  'spotify': 14,
  'twitter': 15,
  'x': 15,
  'twitter/x': 15,
  'snap': 16,
  'snapchat': 16,
  'tiktok': 17,
  'bytedance': 17,
  'linkedin': 18,
  'pinterest': 19,
  'reddit': 20,
  'discord': 21,
  'shopify': 22,
  'doordash': 23,
  'instacart': 24,
  'robinhood': 25,
  'coinbase': 26,
  'databricks': 27,
  'figma': 28,
  'notion': 29,
  'slack': 30,
  'zoom': 31,
  'dropbox': 32,
  'atlassian': 33,
  'datadog': 34,
  'cloudflare': 35,
  'mongodb': 36,
  'snowflake': 37,
  'palantir': 38,
  'plaid': 39,
  'square': 40,
  'block': 40,
  'paypal': 41,
  'intuit': 42,
  'capital one': 43,
  'jpmorgan': 44,
  'jpmorgan chase': 44,
  'goldman sachs': 45,
  'morgan stanley': 46,
  'deutsche bank': 47,
  'samsung': 48,
  'intel': 49,
  'qualcomm': 50,
  'amd': 51,
  'tesla': 52,
  'spacex': 53,
  'lyft': 54,
  'ebay': 55,
  'etsy': 56,
  'wayfair': 57,
  'gap': 58,
  'walmart': 59,
  'target': 60,
  'oracle': 61,
  'sap': 62,
  'cisco': 63,
  'ibm': 64,
  'vmware': 65,
  'servicenow': 66,
  'workday': 67,
  'hubspot': 68,
  'twilio': 69,
  'zendesk': 70,
  'asana': 71,
  'docusign': 72,
  'box': 73,
  'roblox': 74,
  'unity': 75,
  'epic games': 76,
  'ea': 77,
  'electronic arts': 77,
  'riot games': 78,
  'disney': 79,
  'warner bros': 80,
  'warner bros discovery': 80,
  'thermo fisher scientific': 81,
  'coty': 82,
  'deloitte': 83,
  'mckinsey': 84,
  'bcg': 85,
  'bain': 86,
  'accenture': 87,
  'anthropic': 88,
  'vercel': 89,
  'github': 90,
  'gitlab': 91,
  'canva': 92,
  'affirm': 93,
  'chime': 94,
  'brex': 95,
  'ramp': 96,
  'wise': 97,
  'revolut': 98,
  'harman international': 99,
  'thredup': 100,
}

/**
 * Check if a company is a "top company" and return its rank.
 */
export function getCompanyRank(companyName: string): { isTop: boolean; rank: number } {
  const normalized = companyName.toLowerCase().trim()
  
  // Direct match
  if (TOP_COMPANIES[normalized] !== undefined) {
    return { isTop: true, rank: TOP_COMPANIES[normalized] }
  }
  
  // Word-boundary match: split company name into words and check if any
  // word or multi-word segment matches a key exactly. This avoids false
  // positives like "TekniPlex" matching "x" or "Leap" matching "ea".
  const words = normalized.split(/[\s,.\-/&]+/).filter(Boolean)
  for (const [key, rank] of Object.entries(TOP_COMPANIES)) {
    const keyWords = key.split(/\s+/)
    // For single-word keys shorter than 4 chars, require exact full match only
    if (keyWords.length === 1 && key.length < 4) continue
    // Check if the key appears as a complete word sequence in the company name
    if (keyWords.length === 1) {
      if (words.includes(key)) return { isTop: true, rank }
    } else {
      // Multi-word key: check if the company name contains the full key as a substring
      if (normalized.includes(key)) return { isTop: true, rank }
    }
  }
  
  return { isTop: false, rank: 999 }
}

/**
 * Extract external job ID from a Jobright URL.
 */
function extractExternalId(url: string): string | null {
  const match = url.match(/jobs\/info\/([a-f0-9]+)/)
  return match ? match[1] : null
}

/**
 * Parse a date string like "Feb 09" into a Date object.
 * Assumes current year unless posting seems to be from the future.
 */
function parseDatePosted(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  
  const currentYear = new Date().getFullYear()
  const parsed = new Date(`${dateStr.trim()}, ${currentYear}`)
  
  if (isNaN(parsed.getTime())) return null
  
  // If parsed date is more than 30 days in the future, assume previous year
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (parsed > thirtyDaysFromNow) {
    return new Date(`${dateStr.trim()}, ${currentYear - 1}`)
  }
  
  return parsed
}

/**
 * Parse a markdown link like **[Text](url)** or [Text](url)
 */
function parseMarkdownLink(cell: string): { text: string; url: string | null } {
  // Match **[Text](url)** or [Text](url)
  const match = cell.match(/\*?\*?\[([^\]]+)\]\(([^)]+)\)\*?\*?/)
  if (match) {
    return { text: match[1].trim(), url: match[2].trim() }
  }
  return { text: cell.replace(/\*\*/g, '').trim(), url: null }
}

/**
 * Parse the full README markdown content and extract job listings.
 */
export function parseJobsFromReadme(
  markdown: string,
  roleType: 'new_grad' | 'internship',
  sourceRepo: string
): ParsedJob[] {
  const jobs: ParsedJob[] = []
  const lines = markdown.split('\n')
  
  let inTable = false
  let headerParsed = false
  let lastCompany = ''
  let lastCompanyUrl: string | null = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect table start
    if (trimmed.startsWith('| Company') || trimmed.startsWith('| **Company')) {
      inTable = true
      headerParsed = false
      continue
    }
    
    // Skip separator row
    if (inTable && !headerParsed && trimmed.startsWith('| -')) {
      headerParsed = true
      continue
    }
    
    // Parse data rows
    if (inTable && headerParsed && trimmed.startsWith('|')) {
      // Split by | and clean up
      const cells = trimmed
        .split('|')
        .map(c => c.trim())
        .filter(c => c !== '')
      
      if (cells.length < 5) continue
      
      const [companyCell, titleCell, locationCell, workModelCell, dateCell] = cells
      
      // Handle ↳ (same company as previous row)
      let company: string
      let companyUrl: string | null
      
      if (companyCell === '↳') {
        company = lastCompany
        companyUrl = lastCompanyUrl
      } else {
        const parsed = parseMarkdownLink(companyCell)
        company = parsed.text
        companyUrl = parsed.url
        lastCompany = company
        lastCompanyUrl = companyUrl
      }
      
      // Parse job title
      const titleParsed = parseMarkdownLink(titleCell)
      const jobTitle = titleParsed.text
      const jobUrl = titleParsed.url
      
      if (!jobUrl) continue // Skip if no job URL
      
      // Extract external ID
      const externalId = extractExternalId(jobUrl)
      
      // Clean location
      const location = locationCell.replace(/\*\*/g, '').trim() || 'Unknown'
      
      // Clean work model
      const workModel = workModelCell.replace(/\*\*/g, '').trim() || 'Unknown'
      
      // Date posted
      const datePosted = dateCell.replace(/\*\*/g, '').trim()
      
      jobs.push({
        company,
        company_url: companyUrl,
        job_title: jobTitle,
        job_url: jobUrl,
        location,
        work_model: workModel,
        date_posted: datePosted,
        role_type: roleType,
        external_id: externalId,
        source_repo: sourceRepo
      })
    }
    
    // Detect table end
    if (inTable && headerParsed && !trimmed.startsWith('|') && trimmed !== '') {
      // Could be end of table, but keep going in case of blank lines
      if (!trimmed.startsWith('<!--')) {
        // Don't break on HTML comments
      }
    }
  }
  
  return jobs
}

/**
 * Enrich parsed jobs with ranking data.
 */
export function enrichJobsWithRanking(jobs: ParsedJob[]): (ParsedJob & { is_top_company: boolean; company_rank: number; date_posted_parsed: string | null })[] {
  return jobs.map(job => {
    const { isTop, rank } = getCompanyRank(job.company)
    const parsedDate = parseDatePosted(job.date_posted)
    
    return {
      ...job,
      is_top_company: isTop,
      company_rank: rank,
      date_posted_parsed: parsedDate ? parsedDate.toISOString() : null
    }
  })
}

// GitHub raw URLs for the two repos
export const GITHUB_SOURCES = {
  new_grad: {
    url: 'https://raw.githubusercontent.com/jobright-ai/2026-Product-Management-New-Grad/master/README.md',
    repo: 'jobright-ai/2026-Product-Management-New-Grad',
    roleType: 'new_grad' as const
  },
  internship: {
    url: 'https://raw.githubusercontent.com/jobright-ai/2026-Product-Management-Internship/master/README.md',
    repo: 'jobright-ai/2026-Product-Management-Internship',
    roleType: 'internship' as const
  }
}
