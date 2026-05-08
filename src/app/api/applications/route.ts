import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await getSupabaseRouteHandlerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Applications API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applications: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteHandlerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { company, role, stage = 'Saved', next_action, deadline, notes, logo, bg_color, job_url, company_url, source = 'manual' } = body

  if (!company || !role) {
    return NextResponse.json({ error: 'company and role are required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('applications')
    .select('id, stage')
    .eq('user_id', user.id)
    .eq('company', company)
    .eq('role', role)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Already in pipeline', application: existing })
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company,
      role,
      stage,
      next_action: next_action || null,
      deadline: deadline || null,
      notes: notes || null,
      logo: logo || null,
      bg_color: bg_color || '#0ea5e9',
      job_url: job_url || null,
      company_url: company_url || null,
      source,
    })
    .select()
    .single()

  if (error) {
    console.error('[Applications API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ application: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseRouteHandlerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  delete updates.user_id
  delete updates.created_at

  const { data, error } = await supabase
    .from('applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[Applications API] PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ application: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseRouteHandlerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[Applications API] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Application deleted' })
}
