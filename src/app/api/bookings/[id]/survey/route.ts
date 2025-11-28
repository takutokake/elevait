import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

/**
 * POST /api/bookings/[id]/survey
 * Mentor submits post-session survey
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const supabase = await getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      sessionRating, 
      mentorAttended, 
      topicsCovered, 
      additionalNotes 
    } = body

    // Validate required fields
    if (!sessionRating || mentorAttended === undefined || !topicsCovered) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionRating, mentorAttended, topicsCovered' },
        { status: 400 }
      )
    }

    if (sessionRating < 1 || sessionRating > 5) {
      return NextResponse.json(
        { error: 'Session rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Call the submit_session_survey function
    const { data, error } = await supabase.rpc('submit_session_survey', {
      p_booking_id: bookingId,
      p_mentor_id: user.id,
      p_session_rating: sessionRating,
      p_mentor_attended: mentorAttended,
      p_session_topics_covered: topicsCovered,
      p_mentor_additional_notes: additionalNotes || null
    })

    if (error) {
      console.error('Submit survey error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to submit survey' },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Failed to submit survey' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: data
    })
  } catch (error) {
    console.error('API /bookings/[id]/survey POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
