import { NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

export async function GET() {
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

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'mentor') {
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

    // Fetch availability slots
    const { data: availabilitySlots, error: slotsError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('mentor_id', user.id)
      .order('start_time', { ascending: true })

    if (slotsError) {
      console.error('Availability slots fetch error:', slotsError)
    }

    // Fetch bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('mentor_id', user.id)

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError)
    }

    return NextResponse.json({
      user,
      profile,
      mentor,
      availabilitySlots: availabilitySlots || [],
      bookings: bookings || []
    })
  } catch (error) {
    console.error('API /mentor/me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
