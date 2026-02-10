import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { readRateLimiter, checkRateLimit } from '@/lib/rateLimit'

/**
 * Returns a map of company names that have at least one matching coach.
 * This is fetched once by the job board UI and used to show
 * "Coach available" badges on matching job cards.
 * 
 * Response: { companies: { "Google": { count: 2, types: ["interviewed", "offer"] }, ... } }
 */

type CoachMatchType = 'current' | 'interviewed' | 'offer' | 'coached'

interface CompanyCoachInfo {
  count: number
  types: CoachMatchType[]
}

export async function GET(request: NextRequest) {
  try {
    const { success } = await checkRateLimit(request, readRateLimiter)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests.' },
        { status: 429 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Fetch all active mentors with their company-related fields
    const { data: mentors, error } = await supabase
      .from('mentors')
      .select('current_company, companies_interviewed, companies_got_offers, successful_companies')
      .eq('is_active', true)

    if (error) {
      console.error('[Coach Companies] Query error:', error)
      return NextResponse.json({ companies: {} })
    }

    // Build a map of company → coach info
    const companyMap: Record<string, { count: Set<string>; types: Set<CoachMatchType> }> = {}

    function addCompany(name: string | null, type: CoachMatchType, mentorId: string) {
      if (!name || !name.trim()) return
      const normalized = name.trim()
      if (!companyMap[normalized]) {
        companyMap[normalized] = { count: new Set(), types: new Set() }
      }
      companyMap[normalized].count.add(mentorId)
      companyMap[normalized].types.add(type)
    }

    mentors?.forEach((mentor, idx) => {
      const id = String(idx) // Just for dedup counting
      
      if (mentor.current_company) {
        addCompany(mentor.current_company, 'current', id)
      }
      
      if (mentor.companies_interviewed && Array.isArray(mentor.companies_interviewed)) {
        mentor.companies_interviewed.forEach((c: string) => addCompany(c, 'interviewed', id))
      }
      
      if (mentor.companies_got_offers && Array.isArray(mentor.companies_got_offers)) {
        mentor.companies_got_offers.forEach((c: string) => addCompany(c, 'offer', id))
      }
      
      if (mentor.successful_companies && Array.isArray(mentor.successful_companies)) {
        mentor.successful_companies.forEach((c: string) => addCompany(c, 'coached', id))
      }
    })

    // Convert sets to serializable format
    const result: Record<string, CompanyCoachInfo> = {}
    for (const [company, info] of Object.entries(companyMap)) {
      result[company] = {
        count: info.count.size,
        types: Array.from(info.types)
      }
    }

    return NextResponse.json({ companies: result }, {
      headers: {
        // Cache for 10 minutes — this data doesn't change often
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error('[Coach Companies] Error:', error)
    return NextResponse.json({ companies: {} })
  }
}
