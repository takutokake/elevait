import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || profile.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Not a mentor' },
        { status: 403 }
      )
    }

    // Fetch mentor
    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (mentorError || !mentor) {
      return NextResponse.json(
        { error: 'Mentor not active' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { slots } = body

    if (!slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: 'Invalid slots data' },
        { status: 400 }
      )
    }

    // Insert availability slots
    const slotsToInsert = slots.map(slot => ({
      mentor_id: user.id,
      start_time: slot.startTime,
      end_time: slot.endTime
    }))

    const { data: insertedSlots, error: insertError } = await supabase
      .from('availability_slots')
      .insert(slotsToInsert)
      .select()

    if (insertError) {
      console.error('Insert slots error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create availability slots' },
        { status: 500 }
      )
    }

    return NextResponse.json(insertedSlots)
  } catch (error) {
    console.error('API /availability POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get('mentorId')

    if (!mentorId) {
      return NextResponse.json(
        { error: 'mentorId parameter is required' },
        { status: 400 }
      )
    }

    // Fetch availability slots
    const { data: slots, error: slotsError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('is_booked', false)
      .order('start_time', { ascending: true })

    if (slotsError) {
      console.error('Fetch slots error:', slotsError)
      return NextResponse.json(
        { error: 'Failed to fetch availability slots' },
        { status: 500 }
      )
    }

    return NextResponse.json(slots || [])
  } catch (error) {
    console.error('API /availability GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
