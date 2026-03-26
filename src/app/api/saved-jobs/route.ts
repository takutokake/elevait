import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/saved-jobs - Get all saved jobs for current user
export async function GET() {
  const supabase = await getSupabaseRouteHandlerClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch saved job IDs array for this user
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_ids')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // If no row exists yet, return empty array
    if (error.code === 'PGRST116') {
      return NextResponse.json({ savedJobs: [], count: 0 })
    }
    console.error('[Saved Jobs API] Error fetching saved jobs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const jobIds = (data?.job_ids as string[]) || []
  return NextResponse.json({ 
    savedJobs: jobIds,
    count: jobIds.length
  })
}

// POST /api/saved-jobs - Save a job
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteHandlerClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { jobId } = body

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  // Fetch current saved jobs
  const { data: existing } = await supabase
    .from('saved_jobs')
    .select('job_ids')
    .eq('user_id', user.id)
    .single()

  let jobIds: string[] = []
  if (existing?.job_ids) {
    jobIds = existing.job_ids as string[]
    // Check if already saved
    if (jobIds.includes(jobId)) {
      return NextResponse.json({ message: 'Job already saved' })
    }
  }

  // Add new job ID
  jobIds.push(jobId)

  // Upsert (insert or update)
  const { error } = await supabase
    .from('saved_jobs')
    .upsert({ 
      user_id: user.id, 
      job_ids: jobIds,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('[Saved Jobs API] Error saving job:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Job saved successfully' })
}

// DELETE /api/saved-jobs - Unsave a job
export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseRouteHandlerClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  // Fetch current saved jobs
  const { data: existing } = await supabase
    .from('saved_jobs')
    .select('job_ids')
    .eq('user_id', user.id)
    .single()

  if (!existing?.job_ids) {
    return NextResponse.json({ message: 'No saved jobs found' })
  }

  let jobIds = existing.job_ids as string[]
  // Remove the job ID
  jobIds = jobIds.filter(id => id !== jobId)

  // Update with filtered array
  const { error } = await supabase
    .from('saved_jobs')
    .update({ 
      job_ids: jobIds,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('[Saved Jobs API] Error unsaving job:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Job unsaved successfully' })
}
