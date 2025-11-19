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

    // If not a mentor, check application status
    if (profile.role !== 'mentor') {
      // Check for mentor application
      const { data: application, error: appError } = await supabase
        .from('mentor_applications')
        .select('id, status, created_at, reviewed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (appError && appError.code !== 'PGRST116') {
        console.error('Application fetch error:', appError)
      }

      // Return specific status based on application state
      if (!application) {
        return NextResponse.json(
          { 
            error: 'not_applied',
            message: 'You have not applied to become a coach yet.',
            action: 'apply'
          },
          { status: 403 }
        )
      }

      if (application.status === 'pending') {
        return NextResponse.json(
          { 
            error: 'pending',
            message: 'Your coach application is pending review.',
            applicationDate: application.created_at,
            action: 'wait'
          },
          { status: 403 }
        )
      }

      if (application.status === 'rejected') {
        return NextResponse.json(
          { 
            error: 'rejected',
            message: 'Your coach application was not approved. Please contact support for more information.',
            reviewedDate: application.reviewed_at,
            action: 'contact'
          },
          { status: 403 }
        )
      }

      // Generic not a mentor response
      return NextResponse.json(
        { 
          error: 'not_mentor',
          message: 'You do not have mentor access.',
          action: 'apply'
        },
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
