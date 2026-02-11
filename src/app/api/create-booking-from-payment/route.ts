import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { sendBookingRequestEmails, sendAdminBookingNotification, sendSlackBookingNotification } from '@/lib/emailService'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
}

export async function POST(request: NextRequest) {
  console.log('📞 Create booking from payment endpoint called')
  
  try {
    const { user } = await getSessionUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Retrieving Stripe session:', sessionId)

    // Retrieve the checkout session from Stripe
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      console.error('❌ Payment not completed')
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    console.log('✅ Payment verified as paid')

    // Extract booking data from metadata
    const metadata = session.metadata
    if (!metadata) {
      console.error('❌ No metadata in session')
      return NextResponse.json({ error: 'No metadata' }, { status: 400 })
    }

    const {
      userId,
      mentorId,
      slotId,
      bookingStartTime,
      bookingEndTime,
      learnerEmail,
      learnerPhone,
      sessionNotes,
      timezone: userTimezone,
    } = metadata as any

    console.log('📦 Booking metadata:', { userId, mentorId, slotId, learnerEmail })

    // Check if booking already exists for this payment
    const supabase = await getSupabaseServerClient()
    
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('stripe_payment_intent_id', session.payment_intent as string)
      .single()

    if (existingBooking) {
      console.log('✅ Booking already exists:', existingBooking.id)
      return NextResponse.json({ 
        success: true, 
        bookingId: existingBooking.id,
        alreadyExists: true 
      })
    }

    console.log('🔄 Creating new booking...')

    const startTime = new Date(bookingStartTime)
    const endTime = new Date(bookingEndTime)

    const bookingParams = {
      p_availability_slot_id: slotId,
      p_learner_id: userId,
      p_booking_start_time: startTime.toISOString(),
      p_booking_end_time: endTime.toISOString(),
      p_learner_email: learnerEmail,
      p_learner_phone: learnerPhone || null,
      p_session_notes: sessionNotes || null,
      p_timezone: userTimezone || 'UTC'
    }

    console.log('📋 Booking params:', bookingParams)

    const { data: bookingId, error: bookingError } = await supabase.rpc('create_booking', bookingParams)

    if (bookingError) {
      console.error('❌ Failed to create booking:', bookingError)
      console.error('❌ Error details:', {
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint,
        code: bookingError.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to create booking', 
          details: bookingError.message,
          hint: bookingError.hint,
          code: bookingError.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Booking created with ID:', bookingId)

    // Update booking with Stripe payment intent ID
    await supabase
      .from('bookings')
      .update({ 
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'pending'
      })
      .eq('id', bookingId)

    console.log('💳 Payment intent ID saved')

    // Fetch profiles for email
    const { data: mentorProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', mentorId)
      .single()

    const { data: learnerProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    console.log('👥 Profiles fetched for emails')

    // Send confirmation emails
    if (mentorProfile && learnerProfile) {
      try {
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
        
        console.log('📬 Sending booking confirmation emails...')
        
        const emailData = {
          studentName: learnerProfile.full_name || 'Student',
          studentEmail: learnerEmail,
          coachName: mentorProfile.full_name || 'Coach',
          coachEmail: mentorProfile.email || '',
          bookingDate: startTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric',
            timeZone: userTimezone || 'UTC'
          }),
          bookingTime: startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: userTimezone || 'UTC'
          }),
          duration: `${durationMinutes} minutes`,
          sessionNotes: sessionNotes || undefined
        }
        
        await sendBookingRequestEmails(emailData)
        await sendAdminBookingNotification(emailData)
        await sendSlackBookingNotification(emailData)

        console.log('✅ Booking confirmation emails and Slack notification sent')
      } catch (emailError) {
        console.error('❌ Failed to send emails:', emailError)
        // Don't fail the request if emails fail
      }
    }

    return NextResponse.json({ 
      success: true, 
      bookingId,
      emailsSent: true 
    })
  } catch (error: any) {
    console.error('❌ Create booking from payment error:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to create booking from payment',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
