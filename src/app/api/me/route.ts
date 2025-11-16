import { NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    // Fetch student row (if any)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single()

    if (studentError && studentError.code !== 'PGRST116') {
      console.error('Student fetch error:', studentError)
    }

    // Fetch mentor row (if any)
    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select('*')
      .eq('id', user.id)
      .single()

    if (mentorError && mentorError.code !== 'PGRST116') {
      console.error('Mentor fetch error:', mentorError)
    }

    // Fetch bookings (basic select where user is either student_id or mentor_id)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError)
    }

    return NextResponse.json({
      user,
      profile: profile || null,
      student: student || null,
      mentor: mentor || null,
      bookings: bookings || []
    })
  } catch (error) {
    console.error('API /me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
