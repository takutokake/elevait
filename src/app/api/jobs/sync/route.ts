import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseJobsFromReadme, enrichJobsWithRanking, GITHUB_SOURCES } from '@/lib/jobParser'

// Use service role key for write operations
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

export async function POST(request: NextRequest) {
  try {
    // Always require secret key — sync is admin-only
    const authHeader = request.headers.get('authorization')
    const syncSecret = process.env.JOBS_SYNC_SECRET
    if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const results: { source: string; fetched: number; upserted: number; errors: number }[] = []

    // Fetch and parse both repos
    for (const [key, source] of Object.entries(GITHUB_SOURCES)) {
      try {
        console.log(`[Jobs Sync] Fetching ${key} from ${source.url}`)
        
        const response = await fetch(source.url, {
          headers: { 'Accept': 'text/plain' },
          next: { revalidate: 0 }
        })

        if (!response.ok) {
          console.error(`[Jobs Sync] Failed to fetch ${key}: ${response.status}`)
          results.push({ source: key, fetched: 0, upserted: 0, errors: 1 })
          continue
        }

        const markdown = await response.text()
        const parsed = parseJobsFromReadme(markdown, source.roleType, source.repo)
        const enriched = enrichJobsWithRanking(parsed)

        console.log(`[Jobs Sync] Parsed ${enriched.length} jobs from ${key}`)

        // Upsert in batches of 100
        let upserted = 0
        let errors = 0
        const batchSize = 100

        for (let i = 0; i < enriched.length; i += batchSize) {
          const batch = enriched.slice(i, i + batchSize).map(job => ({
            company: job.company,
            company_url: job.company_url,
            job_title: job.job_title,
            job_url: job.job_url,
            location: job.location,
            work_model: job.work_model,
            date_posted: job.date_posted,
            date_posted_parsed: job.date_posted_parsed,
            role_type: job.role_type,
            is_top_company: job.is_top_company,
            company_rank: job.company_rank,
            source_repo: job.source_repo,
            external_id: job.external_id,
            updated_at: new Date().toISOString()
          }))

          const { data, error } = await supabase
            .from('pm_jobs')
            .upsert(batch, { 
              onConflict: 'job_url',
              ignoreDuplicates: false 
            })
            .select('id')

          if (error) {
            console.error(`[Jobs Sync] Batch upsert error for ${key}:`, error.message)
            errors += batch.length
          } else {
            upserted += data?.length ?? batch.length
          }
        }

        results.push({
          source: key,
          fetched: enriched.length,
          upserted,
          errors
        })
      } catch (err) {
        console.error(`[Jobs Sync] Error processing ${key}:`, err)
        results.push({ source: key, fetched: 0, upserted: 0, errors: 1 })
      }
    }

    // Clean up jobs older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('pm_jobs')
      .delete()
      .lt('created_at', ninetyDaysAgo)

    return NextResponse.json({
      success: true,
      synced_at: new Date().toISOString(),
      results,
      cleaned_up: true
    })
  } catch (error) {
    console.error('[Jobs Sync] Fatal error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status — also requires secret key
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const syncSecret = process.env.JOBS_SYNC_SECRET
  if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  
  const { count: totalJobs } = await supabase
    .from('pm_jobs')
    .select('*', { count: 'exact', head: true })

  const { count: newGradCount } = await supabase
    .from('pm_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('role_type', 'new_grad')

  const { count: internCount } = await supabase
    .from('pm_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('role_type', 'internship')

  const { data: lastUpdated } = await supabase
    .from('pm_jobs')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    total_jobs: totalJobs ?? 0,
    new_grad_count: newGradCount ?? 0,
    internship_count: internCount ?? 0,
    last_synced: lastUpdated?.updated_at ?? null
  })
}
