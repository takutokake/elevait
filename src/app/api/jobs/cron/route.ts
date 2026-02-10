import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseJobsFromReadme, enrichJobsWithRanking, GITHUB_SOURCES } from '@/lib/jobParser'

/**
 * Cron endpoint called by Vercel Cron every 5 hours.
 * Also callable manually with the correct Authorization header.
 */

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request or has correct secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET // Vercel sets this automatically
    const syncSecret = process.env.JOBS_SYNC_SECRET

    const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`
    const isManualSync = syncSecret && authHeader === `Bearer ${syncSecret}`

    // In development, allow unauthenticated calls
    const isDev = process.env.NODE_ENV === 'development'
    
    // Also allow if it's a vercel-cron user agent (fallback if CRON_SECRET not set)
    const userAgent = request.headers.get('user-agent') || ''
    const isVercelCronUserAgent = userAgent.includes('vercel-cron')

    if (!isVercelCron && !isManualSync && !isDev && !isVercelCronUserAgent) {
      console.error('[Jobs Cron] Unauthorized request', { 
        hasAuthHeader: !!authHeader, 
        hasCronSecret: !!cronSecret,
        hasSyncSecret: !!syncSecret,
        userAgent 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const results: { source: string; fetched: number; upserted: number }[] = []

    for (const [key, source] of Object.entries(GITHUB_SOURCES)) {
      try {
        console.log(`[Jobs Cron] Fetching ${key}...`)

        const response = await fetch(source.url, {
          headers: { 'Accept': 'text/plain' },
          cache: 'no-store'
        })

        if (!response.ok) {
          console.error(`[Jobs Cron] Failed to fetch ${key}: ${response.status}`)
          continue
        }

        const markdown = await response.text()
        const parsed = parseJobsFromReadme(markdown, source.roleType, source.repo)
        const enriched = enrichJobsWithRanking(parsed)

        console.log(`[Jobs Cron] Parsed ${enriched.length} jobs from ${key}`)

        // Upsert in batches
        let upserted = 0
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

          const { error } = await supabase
            .from('pm_jobs')
            .upsert(batch, { onConflict: 'job_url', ignoreDuplicates: false })

          if (error) {
            console.error(`[Jobs Cron] Batch error for ${key}:`, error.message)
          } else {
            upserted += batch.length
          }
        }

        results.push({ source: key, fetched: enriched.length, upserted })
      } catch (err) {
        console.error(`[Jobs Cron] Error processing ${key}:`, err)
      }
    }

    // Cleanup old jobs (90+ days)
    await supabase
      .from('pm_jobs')
      .delete()
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({
      success: true,
      synced_at: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error('[Jobs Cron] Fatal error:', error)
    return NextResponse.json(
      { error: 'Cron sync failed' },
      { status: 500 }
    )
  }
}
