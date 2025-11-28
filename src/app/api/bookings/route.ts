import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { isValidBookingDuration, isPastDate, validateLeadTime } from '@/lib/dateUtils'
import { sendBookingRequestEmails } from '@/lib/emailService'

/**
 * POST /api/bookings
 * Create a new booking
 * Body: { slotId, bookingStartTime, bookingEndTime, learnerEmail, learnerPhone, sessionNotes }
 */
export async function POST(request: NextRequest) {
  try {
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
      slotId,
      bookingStartTime,
      bookingEndTime,
      learnerEmail,
      learnerPhone,
      sessionNotes,
    } = body

    // Validate required fields
    if (!slotId || !bookingStartTime || !bookingEndTime) {
      return NextResponse.json(
        { error: 'slotId, bookingStartTime, and bookingEndTime are required' },
        { status: 400 }
      )
    }

    const startTime = new Date(bookingStartTime)
    const endTime = new Date(bookingEndTime)

    // Validate booking is not in the past
    if (isPastDate(startTime)) {
      return NextResponse.json(
        { error: 'Cannot book a time slot in the past' },
        { status: 400 }
      )
    }

    // Validate minimum duration (60 minutes)
    if (!isValidBookingDuration(startTime, endTime)) {
      return NextResponse.json(
        { error: 'Booking must be at least 60 minutes (1 hour)' },
        { status: 400 }
      )
    }

    // Validate 30-minute alignment
    if (startTime.getMinutes() % 30 !== 0 || endTime.getMinutes() % 30 !== 0) {
      return NextResponse.json(
        { error: 'Booking times must be aligned to 30-minute intervals' },
        { status: 400 }
      )
    }

    // Validate lead time (24 hours in advance)
    if (!validateLeadTime(startTime, 24)) {
      return NextResponse.json(
        { error: 'Bookings must be made at least 24 hours in advance' },
        { status: 400 }
      )
    }

    // Use the Supabase function to create booking with proper locking
    const { data, error } = await supabase.rpc('create_booking', {
      p_availability_slot_id: slotId,
      p_learner_id: user.id,
      p_booking_start_time: startTime.toISOString(),
      p_booking_end_time: endTime.toISOString(),
      p_learner_email: learnerEmail || user.email || '',
      p_learner_phone: learnerPhone || null,
      p_session_notes: sessionNotes || null,
      p_timezone: 'UTC'
    })

    if (error) {
      console.error('Create booking error:', error)

      // Handle specific error messages from the function
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Availability slot not found' },
          { status: 404 }
        )
      }

      if (error.message.includes('not available')) {
        return NextResponse.json(
          { error: 'This time slot is no longer available' },
          { status: 409 }
        )
      }

      if (error.message.includes('overlaps')) {
        return NextResponse.json(
          { error: 'This time slot overlaps with an existing booking' },
          { status: 409 }
        )
      }

      if (error.message.includes('at least 1 hour')) {
        return NextResponse.json(
          { error: 'Booking must be at least 1 hour' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create booking', details: error.message },
        { status: 500 }
      )
    }

    // Fetch the created booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, availability_slots(*)')
      .eq('id', data)
      .single()

    if (fetchError) {
      console.error('Fetch booking error:', fetchError)
      return NextResponse.json(
        { error: 'Booking created but failed to fetch details' },
        { status: 500 }
      )
    }

    // Fetch mentor and learner details separately
    const { data: mentorProfile, error: mentorError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', booking.mentor_id)
      .single()

    const { data: learnerProfile, error: learnerError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', booking.learner_id)
      .single()

    console.log('[Booking] Mentor profile:', mentorProfile)
    console.log('[Booking] Learner profile:', learnerProfile)
    console.log('[Booking] Mentor error:', mentorError)
    console.log('[Booking] Learner error:', learnerError)

    // Send email notifications (don't block on this)
    try {
      const bookingStart = new Date(booking.booking_start_time)
      const bookingEnd = new Date(booking.booking_end_time)
      const durationMinutes = Math.round((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60))
      
      console.log('[Booking] Sending emails to:', {
        student: booking.learner_email,
        coach: mentorProfile?.email,
        admin: 'tryelevait@gmail.com'
      })
      
      await sendBookingRequestEmails({
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
        duration: `${durationMinutes} minutes`,
        sessionNotes: booking.session_notes || undefined
      })
    } catch (emailError) {
      console.error('Failed to send booking emails:', emailError)
      // Don't fail the booking if emails fail
    }

    return NextResponse.json({ booking, bookingId: data })
  } catch (error) {
    console.error('API /bookings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings
 * Fetch bookings for the authenticated user (as learner or mentor)
 * Query params: role (learner|mentor), status (optional), from (optional), to (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'learner'
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build query based on role
    let query = supabase
      .from('bookings')
      .select('*, availability_slots(*)')

    if (role === 'mentor') {
      query = query.eq('mentor_id', user.id)
    } else {
      query = query.eq('learner_id', user.id)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by date range if provided
    if (from) {
      query = query.gte('booking_start_time', new Date(from).toISOString())
    }

    if (to) {
      query = query.lte('booking_start_time', new Date(to).toISOString())
    }

    query = query.order('booking_start_time', { ascending: true })

    const { data: bookings, error: bookingsError } = await query

    if (bookingsError) {
      console.error('Fetch bookings error:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bookings: bookings || [], count: bookings?.length || 0 })
  } catch (error) {
    console.error('API /bookings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bookings
 * Update a booking (cancel, complete, etc.)
 * Body: { bookingId, status, cancellationReason }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, status, cancellationReason } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'bookingId and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch booking to verify ownership
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

    // Check if user has permission to update
    const isLearner = booking.learner_id === user.id
    const isMentor = booking.mentor_id === user.id

    if (!isLearner && !isMentor) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = { status }

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancelled_by = user.id
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason
      }
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select('*, availability_slots(*)')
      .single()

    if (updateError) {
      console.error('Update booking error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('API /bookings PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
