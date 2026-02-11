import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { readRateLimiter, checkRateLimit } from '@/lib/rateLimit'
import { getCompanyRank } from '@/lib/jobParser'

interface JobRow {
  id: string
  company: string
  company_url: string | null
  job_title: string
  job_url: string
  location: string
  work_model: string
  date_posted: string
  date_posted_parsed: string | null
  role_type: 'new_grad' | 'internship'
  is_top_company: boolean
  company_rank: number
  source_repo: string
  created_at: string
}

/**
 * Load the set of company names that have at least one active coach.
 * Used to filter jobs server-side when coach_only=true.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCoachCompanyNames(supabase: any): Promise<Set<string>> {
  const { data: mentors } = await supabase
    .from('mentors')
    .select('current_company, companies_interviewed, companies_got_offers, successful_companies')
    .eq('is_active', true)

  const names = new Set<string>()
  mentors?.forEach((m: Record<string, unknown>) => {
    if (typeof m.current_company === 'string' && m.current_company.trim()) {
      names.add(m.current_company.trim().toLowerCase())
    }
    for (const field of ['companies_interviewed', 'companies_got_offers', 'successful_companies']) {
      const arr = m[field]
      if (Array.isArray(arr)) arr.forEach((c: string) => { if (c?.trim()) names.add(c.trim().toLowerCase()) })
    }
  })
  return names
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 200 requests per 15 minutes per IP
    const { success } = await checkRateLimit(request, readRateLimiter)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Query params
    const search = searchParams.get('search') || ''
    const roleType = searchParams.get('role_type') || ''       // 'new_grad' | 'internship' | ''
    const workModel = searchParams.get('work_model') || ''     // 'Remote' | 'On Site' | 'Hybrid' | ''
    const topOnly = searchParams.get('top_only') === 'true'
    const coachOnly = searchParams.get('coach_only') === 'true'
    const sortBy = searchParams.get('sort') || 'recent'        // 'relevance' | 'recent' | 'company'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    // If coach_only, load coach company names (one extra DB query)
    let coachCompanyNames: Set<string> | null = null
    if (coachOnly) {
      coachCompanyNames = await getCoachCompanyNames(supabase)
    }

    // Fetch all matching jobs (no pagination yet — we deduplicate & re-rank first)
    let query = supabase
      .from('pm_jobs')
      .select('*')
      .limit(5000)

    // Filters (server-side)
    if (roleType && (roleType === 'new_grad' || roleType === 'internship')) {
      query = query.eq('role_type', roleType)
    }

    if (workModel) {
      query = query.eq('work_model', workModel)
    }

    if (search) {
      query = query.or(`company.ilike.%${search}%,job_title.ilike.%${search}%,location.ilike.%${search}%`)
    }

    // Initial sort from DB (helps dedup pick the best row)
    query = query
      .order('date_posted_parsed', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('[Jobs API] Query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let rows = (data || []) as JobRow[]

    // Re-validate is_top_company and company_rank using current TOP_COMPANIES list
    rows = rows.map(job => {
      const { isTop, rank } = getCompanyRank(job.company)
      return { ...job, is_top_company: isTop, company_rank: rank }
    })

    // Apply top_only filter AFTER re-ranking (not from DB flags)
    if (topOnly) {
      rows = rows.filter(job => job.is_top_company)
    }

    // Apply coach_only filter: keep only jobs whose company has a coach
    if (coachOnly && coachCompanyNames) {
      rows = rows.filter(job => coachCompanyNames!.has(job.company.trim().toLowerCase()))
    }

    // Deduplicate: group by company + job_title, combine locations
    const deduped = deduplicateJobs(rows)

    // Sort deduplicated results
    const sorted = sortJobs(deduped, sortBy)

    // Paginate
    const total = sorted.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paged = sorted.slice(offset, offset + limit)

    return NextResponse.json({
      jobs: paged,
      total,
      page,
      limit,
      total_pages: totalPages
    })
  } catch (error) {
    console.error('[Jobs API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

/**
 * Group jobs by (company, job_title, role_type) and merge locations.
 * Keeps the most recent entry's data and combines unique locations.
 */
function deduplicateJobs(jobs: JobRow[]): JobRow[] {
  const map = new Map<string, JobRow & { _locations: Set<string> }>()

  for (const job of jobs) {
    const key = `${job.company.toLowerCase().trim()}||${job.job_title.toLowerCase().trim()}||${job.role_type}`
    const existing = map.get(key)

    if (!existing) {
      map.set(key, { ...job, _locations: new Set([job.location]) })
    } else {
      // Add this location
      existing._locations.add(job.location)
      // Keep the more recent entry's data
      const existingDate = existing.date_posted_parsed ? new Date(existing.date_posted_parsed).getTime() : 0
      const newDate = job.date_posted_parsed ? new Date(job.date_posted_parsed).getTime() : 0
      if (newDate > existingDate) {
        const locs = existing._locations
        Object.assign(existing, job)
        existing._locations = locs
        existing._locations.add(job.location)
      }
    }
  }

  // Flatten locations back into the location field
  return Array.from(map.values()).map(({ _locations, ...job }) => ({
    ...job,
    location: Array.from(_locations).join('; '),
  }))
}

/**
 * Sort jobs in-memory after deduplication.
 */
function sortJobs(jobs: JobRow[], sortBy: string): JobRow[] {
  const sorted = [...jobs]
  switch (sortBy) {
    case 'recent':
      sorted.sort((a, b) => {
        const da = a.date_posted_parsed ? new Date(a.date_posted_parsed).getTime() : 0
        const db = b.date_posted_parsed ? new Date(b.date_posted_parsed).getTime() : 0
        if (db !== da) return db - da
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      break
    case 'company':
      sorted.sort((a, b) => {
        const cmp = a.company.localeCompare(b.company)
        if (cmp !== 0) return cmp
        const da = a.date_posted_parsed ? new Date(a.date_posted_parsed).getTime() : 0
        const db = b.date_posted_parsed ? new Date(b.date_posted_parsed).getTime() : 0
        return db - da
      })
      break
    case 'relevance':
    default:
      // Top companies first (by rank), then recency
      sorted.sort((a, b) => {
        // is_top_company true first
        if (a.is_top_company !== b.is_top_company) return a.is_top_company ? -1 : 1
        // Then by company_rank ascending (lower rank = better)
        if (a.company_rank !== b.company_rank) return a.company_rank - b.company_rank
        // Then by recency
        const da = a.date_posted_parsed ? new Date(a.date_posted_parsed).getTime() : 0
        const db = b.date_posted_parsed ? new Date(b.date_posted_parsed).getTime() : 0
        return db - da
      })
      break
  }
  return sorted
}
