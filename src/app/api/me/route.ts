import { NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

export async function GET() {
  try {
    console.log('[API /me] Starting request...')
    const supabase = getSupabaseServerClient()
    const { user } = await getSessionUser()

    console.log('[API /me] User:', user ? `ID: ${user.id}, Email: ${user.email}` : 'No user')

    if (!user) {
      console.log('[API /me] No user session found, returning null')
      return NextResponse.json({ user: null })
    }

    // Fetch profile
    console.log('[API /me] Fetching profile for user:', user.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[API /me] Profile fetch error:', profileError)
      console.error('[API /me] Profile error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
    } else {
      console.log('[API /me] Profile found:', {
        id: profile?.id,
        role: profile?.role,
        desired_role: profile?.desired_role,
        onboarding_complete: profile?.onboarding_complete
      })
    }

    // Fetch student row (if any)
    console.log('[API /me] Fetching student data...')
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single()

    if (studentError && studentError.code !== 'PGRST116') {
      console.error('[API /me] Student fetch error:', studentError)
    } else if (student) {
      console.log('[API /me] Student data found')
    } else {
      console.log('[API /me] No student data (expected for mentors)')
    }

    // Fetch mentor row (if any)
    console.log('[API /me] Fetching mentor data...')
    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select('*')
      .eq('id', user.id)
      .single()

    if (mentorError && mentorError.code !== 'PGRST116') {
      console.error('[API /me] Mentor fetch error:', mentorError)
    } else if (mentor) {
      console.log('[API /me] Mentor data found')
    } else {
      console.log('[API /me] No mentor data (expected for students)')
    }

    // Fetch bookings (basic select where user is either student_id or mentor_id)
    console.log('[API /me] Fetching bookings...')
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)

    if (bookingsError) {
      console.error('[API /me] Bookings fetch error:', bookingsError)
    } else {
      console.log('[API /me] Bookings found:', bookings?.length || 0)
    }

    // Fetch mentor application status (if any)
    console.log('[API /me] Fetching mentor application status...')
    const { data: mentorApplication, error: applicationError } = await supabase
      .from('mentor_applications')
      .select('id, status, created_at, reviewed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (applicationError && applicationError.code !== 'PGRST116') {
      console.error('[API /me] Mentor application fetch error:', applicationError)
    } else if (mentorApplication) {
      console.log('[API /me] Mentor application found:', {
        id: mentorApplication.id,
        status: mentorApplication.status
      })
    } else {
      console.log('[API /me] No mentor application found')
    }

    const responseData = {
      user,
      profile: profile || null,
      student: student || null,
      mentor: mentor || null,
      mentorApplication: mentorApplication || null,
      bookings: bookings || []
    }

    console.log('[API /me] Returning response:', {
      hasUser: !!responseData.user,
      hasProfile: !!responseData.profile,
      hasStudent: !!responseData.student,
      hasMentor: !!responseData.mentor,
      bookingsCount: responseData.bookings.length
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[API /me] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
