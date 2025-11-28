import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { sendCancellationEmails } from '@/lib/emailService'

/**
 * POST /api/bookings/[id]/cancel
 * Cancel a confirmed booking (can be done by mentor or student)
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
    const { reason, cancelledBy } = body

    // Fetch booking to verify ownership and status
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Fetch mentor and learner profiles for emails
    const { data: mentorProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', booking.mentor_id)
      .single()

    const { data: learnerProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', booking.learner_id)
      .single()

    // Check if user has permission to cancel
    const isLearner = booking.learner_id === user.id
    const isMentor = booking.mentor_id === user.id

    if (!isLearner && !isMentor) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Can only cancel pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot cancel a booking with status: ${booking.status}` },
        { status: 400 }
      )
    }

    // Update booking to cancelled
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Cancel booking error:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    // Send cancellation email notifications
    try {
      const bookingStart = new Date(booking.booking_start_time)
      
      await sendCancellationEmails({
        studentName: learnerProfile?.full_name || 'Student',
        studentEmail: booking.learner_email,
        coachName: mentorProfile?.full_name || 'Coach',
        coachEmail: mentorProfile?.email || '',
        bookingDate: bookingStart.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        }),
        bookingTime: bookingStart.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        cancellationReason: reason || 'No reason provided',
        cancelledBy: cancelledBy || (isMentor ? 'coach' : 'student')
      })
    } catch (emailError) {
      console.error('Failed to send cancellation emails:', emailError)
      // Don't fail the cancellation if emails fail
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: 'Booking cancelled successfully'
    })
  } catch (error) {
    console.error('API /bookings/[id]/cancel POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
