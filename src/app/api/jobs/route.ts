import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { readRateLimiter, checkRateLimit } from '@/lib/rateLimit'

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
    const sortBy = searchParams.get('sort') || 'relevance'     // 'relevance' | 'recent' | 'company'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('pm_jobs')
      .select('*', { count: 'exact' })

    // Filters
    if (roleType && (roleType === 'new_grad' || roleType === 'internship')) {
      query = query.eq('role_type', roleType)
    }

    if (workModel) {
      query = query.eq('work_model', workModel)
    }

    if (topOnly) {
      query = query.eq('is_top_company', true)
    }

    if (search) {
      query = query.or(`company.ilike.%${search}%,job_title.ilike.%${search}%,location.ilike.%${search}%`)
    }

    // Sorting
    switch (sortBy) {
      case 'recent':
        query = query
          .order('date_posted_parsed', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
        break
      case 'company':
        query = query
          .order('company', { ascending: true })
          .order('date_posted_parsed', { ascending: false, nullsFirst: false })
        break
      case 'relevance':
      default:
        // Top companies first, then by recency
        query = query
          .order('is_top_company', { ascending: false })
          .order('company_rank', { ascending: true })
          .order('date_posted_parsed', { ascending: false, nullsFirst: false })
        break
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[Jobs API] Query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      jobs: data || [],
      total: count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit)
    })
  } catch (error) {
    console.error('[Jobs API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
