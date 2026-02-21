import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { getPostHogClient } from '@/lib/posthog-server'
import { isValidBookingDuration, isPastDate, validateLeadTime } from '@/lib/dateUtils'
import { sendBookingRequestEmails, sendAdminBookingNotification, sendSlackBookingNotification } from '@/lib/emailService'
import { checkRateLimit, bookingRateLimiter, readRateLimiter } from '@/lib/rateLimit'
import { createBookingSchema, updateBookingSchema } from '@/lib/validationSchemas'
import { sanitizeEmail, sanitizePhone, sanitizeText, sanitizeUuid } from '@/lib/sanitization'
import { createRateLimitResponse, handleValidationError, createSafeErrorResponse, sanitizeDatabaseError } from '@/lib/securityUtils'
import { ZodError } from 'zod'

/**
 * POST /api/bookings
 * Create a new booking
 * Body: { slotId, mentorId, bookingStartTime, bookingEndTime, learnerEmail, learnerPhone, sessionNotes, isFreeSession }
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

    // SECURITY: Apply booking rate limiting (10 bookings per hour)
    const rateLimitResult = await checkRateLimit(request, bookingRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    // SECURITY: Parse request body
    const body = await request.json()
    
    // Check if this is a free session booking (from weekly availability)
    const isFreeSession = body.isFreeSession === true
    const mentorId = body.mentorId
    
    // For free sessions with weekly availability, we don't need a real slot ID
    const slotId = body.slotId
    const isWeeklySlot = slotId && slotId.startsWith('weekly-')
    
    // Sanitize inputs
    const bookingStartTime = body.bookingStartTime
    const bookingEndTime = body.bookingEndTime
    const learnerEmail = sanitizeEmail(body.learnerEmail || user.email || '')
    const learnerPhone = sanitizePhone(body.learnerPhone)
    const sessionNotes = sanitizeText(body.sessionNotes, 1000)
    const userTimezone = body.timezone || 'UTC'

    // Validate required fields
    if (!bookingStartTime || !bookingEndTime) {
      return NextResponse.json(
        { error: 'bookingStartTime and bookingEndTime are required' },
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

    // Validate minimum duration (60 minutes) - skip for free sessions which may be 30 min
    if (!isFreeSession && !isValidBookingDuration(startTime, endTime)) {
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

    // For free sessions, reduce lead time requirement to 1 hour
    const requiredLeadTime = isFreeSession ? 1 : 24
    if (!validateLeadTime(startTime, requiredLeadTime)) {
      return NextResponse.json(
        { error: isFreeSession 
          ? 'Bookings must be made at least 1 hour in advance' 
          : 'Bookings must be made at least 24 hours in advance' },
        { status: 400 }
      )
    }

    let data, error

    if (isFreeSession && isWeeklySlot && mentorId) {
      // For free sessions from weekly availability, create booking directly
      // First verify the mentor exists
      const { data: mentor, error: mentorError } = await supabase
        .from('mentors')
        .select('id, is_active')
        .eq('id', mentorId)
        .eq('is_active', true)
        .single()

      if (mentorError || !mentor) {
        return NextResponse.json(
          { error: 'Coach not found or not active' },
          { status: 404 }
        )
      }

      // Check for overlapping bookings
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('mentor_id', mentorId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(booking_start_time.lt.${endTime.toISOString()},booking_end_time.gt.${startTime.toISOString()})`)

      if (checkError) {
        console.error('Error checking existing bookings:', checkError)
      }

      if (existingBookings && existingBookings.length > 0) {
        return NextResponse.json(
          { error: 'This time slot is no longer available' },
          { status: 409 }
        )
      }

      // For free sessions from weekly availability, we MUST have an availability slot
      // because availability_slot_id is NOT NULL in the bookings table
      
      // First, check if a slot already exists for this time range
      const { data: existingSlot } = await supabase
        .from('availability_slots')
        .select('id')
        .eq('mentor_id', mentorId)
        .gte('start_time', startTime.toISOString())
        .lte('end_time', endTime.toISOString())
        .limit(1)
        .single()

      let tempSlot = existingSlot

      // If no slot exists, create one
      if (!existingSlot) {
        const { data: newSlot, error: slotError } = await supabase
          .from('availability_slots')
          .insert({
            mentor_id: mentorId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          })
          .select()
          .single()

        if (slotError || !newSlot) {
          console.error('Error creating temp slot:', slotError)
          return NextResponse.json(
            { error: 'Failed to create availability slot', details: slotError?.message },
            { status: 500 }
          )
        }
        
        tempSlot = newSlot
      }

      if (!tempSlot) {
        return NextResponse.json(
          { error: 'Failed to get availability slot' },
          { status: 500 }
        )
      }

      // Create the booking with the temp slot ID
      const bookingData: any = {
        mentor_id: mentorId,
        learner_id: user.id,
        availability_slot_id: tempSlot.id,
        booking_start_time: startTime.toISOString(),
        booking_end_time: endTime.toISOString(),
        learner_email: learnerEmail || user.email || '',
        learner_phone: learnerPhone || null,
        session_notes: sessionNotes || null,
        status: 'confirmed',
        timezone: userTimezone,
      }

      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()

      if (insertError) {
        console.error('Free booking error:', insertError)
        console.error('Free booking error message:', insertError.message)
        console.error('Free booking error details:', insertError.details)
        console.error('Free booking error hint:', insertError.hint)
        console.error('Free booking error code:', insertError.code)
        return NextResponse.json(
          { error: 'Failed to create booking', details: insertError.message, hint: insertError.hint, code: insertError.code },
          { status: 500 }
        )
      }

      data = newBooking.id
      error = null
    } else {
      // For paid sessions or sessions with real availability slots, use the RPC function
      const sanitizedSlotId = sanitizeUuid(slotId)
      
      if (!sanitizedSlotId) {
        return NextResponse.json(
          { error: 'Invalid slot ID format' },
          { status: 400 }
        )
      }

      // Use the Supabase function to create booking with proper locking
      const result = await supabase.rpc('create_booking', {
        p_availability_slot_id: sanitizedSlotId,
        p_learner_id: user.id,
        p_booking_start_time: startTime.toISOString(),
        p_booking_end_time: endTime.toISOString(),
        p_learner_email: learnerEmail || user.email || '',
        p_learner_phone: learnerPhone || null,
        p_session_notes: sessionNotes || null,
        p_timezone: userTimezone
      })
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('[Security] Create booking error:', error)

      // SECURITY: Handle specific error messages without leaking internal details
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

      // SECURITY: Don't leak database error details
      return NextResponse.json(
        { error: sanitizeDatabaseError(error) },
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
      console.error('[Security] Fetch booking error:', fetchError)
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
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      
      console.log('[Booking] Sending emails to:', {
        student: booking.learner_email,
        coach: mentorProfile?.email,
        admin: 'tryelevait@gmail.com'
      })
      
      const emailData = {
        studentName: learnerProfile?.full_name || 'Student',
        studentEmail: learnerProfile?.email || '',
        coachName: mentorProfile?.full_name || 'Coach',
        coachEmail: mentorProfile?.email || '',
        bookingDate: startTime.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric',
          timeZone: userTimezone
        }),
        bookingTime: startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone
        }),
        duration: `${durationMinutes} minutes`,
        sessionNotes: booking.session_notes || undefined
      }
      
      const notificationResults = await Promise.allSettled([
        sendBookingRequestEmails(emailData),
        sendAdminBookingNotification(emailData),
        sendSlackBookingNotification(emailData)
      ])

      notificationResults.forEach((result, i) => {
        const labels = ['booking emails', 'admin email', 'Slack notification']
        if (result.status === 'rejected') {
          console.error(`❌ Failed to send ${labels[i]}:`, result.reason)
        }
      })
    } catch (emailError) {
      console.error('Failed to send booking notifications:', emailError)
      // Don't fail the booking if notifications fail
    }

    // Capture free booking created event (server-side) if this was a free session
    if (isFreeSession) {
      const posthog = getPostHogClient()
      posthog.capture({
        distinctId: user.id,
        event: 'free_booking_created',
        properties: {
          booking_id: data,
          mentor_id: booking.mentor_id,
          duration_minutes: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
        },
      })
    }

    return NextResponse.json({ booking, bookingId: data })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to create booking', 500)
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

    // SECURITY: Apply read rate limiting (200 requests per 15 minutes)
    const rateLimitResult = await checkRateLimit(request, readRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
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
      console.error('[Security] Fetch bookings error:', bookingsError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(bookingsError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ bookings: bookings || [], count: bookings?.length || 0 })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to fetch bookings', 500)
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

    // SECURITY: Apply standard rate limiting
    const rateLimitResult = await checkRateLimit(request, bookingRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    // SECURITY: Parse and validate request body
    const body = await request.json()
    
    let validatedData
    try {
      validatedData = updateBookingSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error)
      }
      throw error
    }

    // SECURITY: Sanitize inputs
    const bookingId = sanitizeUuid(validatedData.bookingId)
    const status = validatedData.status
    const cancellationReason = sanitizeText(validatedData.cancellationReason, 500)

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      )
    }

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
      console.error('[Security] Update booking error:', updateError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(updateError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to update booking', 500)
  }
}
