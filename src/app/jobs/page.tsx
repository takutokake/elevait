'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Layout from "../../components/Layout"
import { useRouter } from 'next/navigation'

interface Job {
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

interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  limit: number
  total_pages: number
}

interface CoachCompanyInfo {
  count: number
  types: ('current' | 'interviewed' | 'offer' | 'coached')[]
}

const WORK_MODEL_OPTIONS = ['', 'Remote', 'On Site', 'Hybrid']
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Top Companies First' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'company', label: 'Company A-Z' },
]

export default function JobsPage() {
  // ── State: filters and page are separate pieces of state ──
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleType, setRoleType] = useState('')
  const [workModel, setWorkModel] = useState('')
  const [topOnly, setTopOnly] = useState(false)
  const [coachOnly, setCoachOnly] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [isEmpty, setIsEmpty] = useState(false)
  const [coachCompanies, setCoachCompanies] = useState<Record<string, CoachCompanyInfo>>({})
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // ── Filter updaters: always reset page to 1 before re-fetch ──
  const updateRoleType = (v: string) => { setRoleType(v); setPage(1) }
  const updateWorkModel = (v: string) => { setWorkModel(v); setPage(1) }
  const updateTopOnly = (v: boolean) => { setTopOnly(v); setPage(1) }
  const updateCoachOnly = (v: boolean) => { setCoachOnly(v); setPage(1) }
  const updateSortBy = (v: string) => { setSortBy(v); setPage(1) }

  const clearFilters = () => {
    setSearch('')
    setRoleType('')
    setWorkModel('')
    setTopOnly(false)
    setCoachOnly(false)
    setSortBy('recent')
    setPage(1)
  }

  // Debounce search — reset page inside the debounce callback
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // ── Fetch jobs: depends on filters + page ──
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (roleType) params.set('role_type', roleType)
      if (workModel) params.set('work_model', workModel)
      if (topOnly) params.set('top_only', 'true')
      if (coachOnly) params.set('coach_only', 'true')
      params.set('sort', sortBy)
      params.set('page', page.toString())
      params.set('limit', '50')

      const res = await fetch(`/api/jobs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')

      const data: JobsResponse = await res.json()
      setJobs(data.jobs)
      setTotal(data.total)
      setTotalPages(data.total_pages)
      setIsEmpty(data.total === 0 && !debouncedSearch && !roleType && !workModel && !topOnly && !coachOnly)
    } catch (err) {
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, roleType, workModel, topOnly, coachOnly, sortBy, page])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Fetch coach companies once on mount
  useEffect(() => {
    fetch('/api/jobs/coach-companies')
      .then(res => res.json())
      .then(data => setCoachCompanies(data.companies || {}))
      .catch(() => {})
  }, [])

  const hasActiveFilters = debouncedSearch || roleType || workModel || topOnly || coachOnly

  // Helper: find coach match for a company name
  const findCoachMatch = useCallback((jobCompany: string): CoachCompanyInfo | null => {
    if (coachCompanies[jobCompany]) return coachCompanies[jobCompany]
    const normalized = jobCompany.toLowerCase().trim()
    for (const [name, info] of Object.entries(coachCompanies)) {
      if (name.toLowerCase().trim() === normalized) return info
    }
    return null
  }, [coachCompanies])

  // Jobs are now filtered server-side (including coach_only), so displayedJobs = jobs
  const displayedJobs = jobs

  // Compute unique companies on current page that have coaches
  const coachCompaniesOnPage = useMemo(() => {
    const seen = new Set<string>()
    const matches: { company: string; count: number }[] = []
    for (const job of displayedJobs) {
      const key = job.company.toLowerCase().trim()
      if (seen.has(key)) continue
      seen.add(key)
      const match = findCoachMatch(job.company)
      if (match) matches.push({ company: job.company, count: match.count })
    }
    return matches
  }, [displayedJobs, findCoachMatch])

  return (
    <Layout variant="landing">
      <div className="min-h-[80vh] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-[#333333] dark:text-[#F5F5F5] shadow-sm mb-4">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[#333333]/80 dark:text-[#F5F5F5]/80">Updated regularly with new roles</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#333333] dark:text-white mb-3">
              Product Management <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6]">Job Board</span>
            </h1>
            <p className="text-base sm:text-lg text-[#333333]/70 dark:text-[#F5F5F5]/70 max-w-2xl mx-auto">
              Lightning-fast PM internships and new grad roles at top companies, always updated with the latest openings on the market.
            </p>
          </div>

          {/* Empty state */}
          {isEmpty && !loading && (
            <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-[#333333] dark:text-white mb-2">No roles available yet</h2>
              <p className="text-[#333333]/60 dark:text-[#F5F5F5]/60">
                New PM roles are synced automatically. Check back soon!
              </p>
            </div>
          )}

          {/* Filters & Controls */}
          {!isEmpty && (
            <>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 shadow-sm">
                {/* Search */}
                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by company, title, or location..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] transition-colors"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Role Type */}
                  <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => updateRoleType('')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        !roleType
                          ? 'bg-[#0ea5e9] text-white'
                          : 'bg-white dark:bg-gray-800 text-[#333333] dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      All Roles
                    </button>
                    <button
                      onClick={() => updateRoleType('new_grad')}
                      className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                        roleType === 'new_grad'
                          ? 'bg-[#0ea5e9] text-white'
                          : 'bg-white dark:bg-gray-800 text-[#333333] dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      New Grad
                    </button>
                    <button
                      onClick={() => updateRoleType('internship')}
                      className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                        roleType === 'internship'
                          ? 'bg-[#0ea5e9] text-white'
                          : 'bg-white dark:bg-gray-800 text-[#333333] dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Internship
                    </button>
                  </div>
                  {/* Work Model */}
                  <select
                    value={workModel}
                    onChange={(e) => updateWorkModel(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
                  >
                    <option value="">All Work Models</option>
                    {WORK_MODEL_OPTIONS.filter(Boolean).map(wm => (
                      <option key={wm} value={wm}>{wm}</option>
                    ))}
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => updateSortBy(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {/* Top Companies Toggle */}
                  <button
                    onClick={() => updateTopOnly(!topOnly)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      topOnly
                        ? 'border-[#f97316] bg-[#f97316]/10 text-[#f97316]'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#333333] dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>⭐</span>
                    <span className="hidden xs:inline">Top</span> Companies
                  </button>

                  {/* Has Coach Toggle */}
                  <button
                    onClick={() => updateCoachOnly(!coachOnly)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      coachOnly
                        ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-[#8b5cf6]'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#333333] dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Has Coach
                  </button>
                </div>

                {/* Results count + Clear */}
                <div className="mt-3 flex items-center justify-between text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60">
                  <span>{total.toLocaleString()} {total === 1 ? 'role' : 'roles'} found</span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Coach Promotion Banner */}
              {!loading && coachCompaniesOnPage.length > 0 && !coachOnly && (
                <Link
                  href={`/coaches`}
                  className="flex items-start gap-3 bg-violet-50 dark:bg-violet-900/10 border border-violet-200/60 dark:border-violet-800/30 rounded-xl p-4 mb-4 hover:bg-violet-100/60 dark:hover:bg-violet-900/20 transition-colors group"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-300">
                      Coaches available for {coachCompaniesOnPage.length === 1
                        ? coachCompaniesOnPage[0].company
                        : coachCompaniesOnPage.length <= 3
                          ? coachCompaniesOnPage.map(c => c.company).join(', ')
                          : `${coachCompaniesOnPage.slice(0, 2).map(c => c.company).join(', ')} + ${coachCompaniesOnPage.length - 2} more`
                      } + More [Filter by Has Coach]
                    </p>
                    <p className="text-xs text-violet-700/70 dark:text-violet-400/70 mt-0.5">
                      Get help with mock interviews, resume reviews, and application strategy from people who&apos;ve been through the process.
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-violet-400 group-hover:text-violet-600 dark:group-hover:text-violet-300 flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {/* Job Cards */}
              {loading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2">No roles match your filters</h3>
                  <p className="text-[#333333]/60 dark:text-[#F5F5F5]/60 mb-4">Try adjusting your search or filters</p>
                  <button onClick={clearFilters} className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayedJobs.map((job) => (
                    <JobCard key={job.id} job={job} coachMatch={findCoachMatch(job.company)} onSelect={setSelectedJob} />
                  ))}
                </div>
              )}

              {/* Job Details Modal */}
              {selectedJob && (
                <JobDetailsModal
                  job={selectedJob}
                  coachMatch={findCoachMatch(selectedJob.company)}
                  onClose={() => setSelectedJob(null)}
                />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#333333] dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#333333] dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Footer attribution */}
          <div className="text-center mt-12 text-xs text-[#333333]/40 dark:text-[#F5F5F5]/40">
            Roles are curated and refreshed automatically. Listings link directly to application pages.
          </div>
        </div>
      </div>
    </Layout>
  )
}

// ─── Job Card Component ────────────────────────────────────────────

function JobCard({ job, coachMatch, onSelect }: { job: Job; coachMatch: CoachCompanyInfo | null; onSelect: (job: Job) => void }) {
  const workModelColors: Record<string, string> = {
    'Remote': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Hybrid': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'On Site': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }

  const roleTypeLabel = job.role_type === 'new_grad' ? 'New Grad' : 'Internship'
  const roleTypeColor = job.role_type === 'new_grad'
    ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
    : 'bg-[#0ea5e9]/10 text-[#0ea5e9]'

  const initial = job.company
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div
      onClick={() => onSelect(job)}
      className="group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:border-[#0ea5e9]/50 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Company Avatar */}
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-sm sm:text-base font-bold ${
          job.is_top_company 
            ? 'bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 text-[#0ea5e9]' 
            : 'bg-gray-100 dark:bg-gray-700 text-[#333333]/60 dark:text-[#F5F5F5]/60'
        }`}>
          {initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-[#333333] dark:text-white group-hover:text-[#0ea5e9] transition-colors line-clamp-2 sm:truncate">
                {job.job_title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
                  {job.company}
                </span>
              </div>
            </div>

            {/* View details arrow */}
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0ea5e9] transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleTypeColor}`}>
              {roleTypeLabel}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${workModelColors[job.work_model] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
              {job.work_model}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 max-w-[140px] sm:max-w-none truncate">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
            </span>
            {job.date_posted && (
              <span className="text-xs text-[#333333]/40 dark:text-[#F5F5F5]/40 sm:ml-auto">
                {job.date_posted}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Coach match badge */}
      {coachMatch && (
        <div className="mt-2.5 ml-[52px] sm:ml-[64px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">{coachMatch.count === 1 ? '1 coach' : `${coachMatch.count} coaches`} with {job.company} experience</span>
            <span className="sm:hidden">Coach available</span>
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Job Details Modal ─────────────────────────────────────────────

function JobDetailsModal({ job, coachMatch, onClose }: { job: Job; coachMatch: CoachCompanyInfo | null; onClose: () => void }) {
  const workModelColors: Record<string, string> = {
    'Remote': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    'Hybrid': 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
    'On Site': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  }

  const roleTypeLabel = job.role_type === 'new_grad' ? 'New Grad' : 'Internship'
  const roleTypeColor = job.role_type === 'new_grad'
    ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400'
    : 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400'

  const initial = job.company
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-[#1c2a36] rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-7">
          {/* Company avatar + name */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
              job.is_top_company
                ? 'bg-gradient-to-br from-violet-100 to-sky-100 text-violet-600 dark:from-violet-900/30 dark:to-sky-900/30 dark:text-violet-400'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
            }`}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{job.company}</p>
              {job.company_url && (
                <a href={job.company_url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-500 hover:text-violet-600 hover:underline">
                  Visit website →
                </a>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-8 mb-3 leading-snug">
            {job.job_title}
          </h2>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${roleTypeColor}`}>
              {roleTypeLabel}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${workModelColors[job.work_model] || 'bg-gray-50 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400'}`}>
              {job.work_model}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400">
              {job.location}
            </span>
            {job.date_posted && (
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400">
                Posted {job.date_posted}
              </span>
            )}
            {job.is_top_company && (
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                ⭐ Top Company
              </span>
            )}
          </div>

          {/* Context description */}
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 mb-5 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This {roleTypeLabel.toLowerCase()} role at <span className="font-medium text-gray-800 dark:text-gray-200">{job.company}</span> is a {job.work_model.toLowerCase()} position based in {job.location}.
            </p>
            {coachMatch && coachMatch.count > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Our {job.company} coaches can help with mock interviews, resume reviews, and application strategy.
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Listings link directly to official application pages.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Apply Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {coachMatch && coachMatch.count > 0 && (
              <Link
                href={`/coaches?company=${encodeURIComponent(job.company)}`}
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-semibold rounded-xl transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Find {coachMatch.count === 1 ? '1 Coach' : `${coachMatch.count} Coaches`} from {job.company}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
