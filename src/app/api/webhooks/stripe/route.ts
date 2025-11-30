import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { sendBookingRequestEmails } from '@/lib/emailService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received!')
  
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    console.log('📝 Webhook signature present:', !!signature)

    if (!signature) {
      console.error('❌ No signature in webhook request')
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified, event type:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      console.log('💳 Processing checkout.session.completed event')
      const session = event.data.object as Stripe.Checkout.Session

      // Extract booking data from metadata
      const metadata = session.metadata
      if (!metadata) {
        console.error('No metadata in session')
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
      } = metadata

      console.log('📦 Booking metadata:', { userId, mentorId, slotId, learnerEmail })

      // Create the booking in Supabase
      const supabase = await getSupabaseServerClient()

      // Check if booking already exists for this payment
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('stripe_payment_intent_id', session.payment_intent as string)
        .single()

      if (existingBooking) {
        console.log('✅ Booking already exists (created by success page):', existingBooking.id)
        return NextResponse.json({ received: true, bookingId: existingBooking.id })
      }

      const startTime = new Date(bookingStartTime)
      const endTime = new Date(bookingEndTime)

      console.log('🔄 Creating booking in Supabase...')
      const { data: bookingId, error: bookingError } = await supabase.rpc('create_booking', {
        p_availability_slot_id: slotId,
        p_learner_id: userId,
        p_booking_start_time: startTime.toISOString(),
        p_booking_end_time: endTime.toISOString(),
        p_learner_email: learnerEmail,
        p_learner_phone: learnerPhone || null,
        p_session_notes: sessionNotes || null,
        p_timezone: 'UTC'
      })

      if (bookingError) {
        console.error('❌ Failed to create booking:', bookingError)
        return NextResponse.json(
          { error: 'Failed to create booking' },
          { status: 500 }
        )
      }

      console.log('✅ Booking created with ID:', bookingId)

      // Update booking with Stripe payment intent ID
      console.log('💳 Updating booking with payment intent ID...')
      await supabase
        .from('bookings')
        .update({ 
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'pending' // Keep as pending until coach approves
        })
        .eq('id', bookingId)

      // Fetch booking details for email
      console.log('📧 Fetching booking and profile details for emails...')
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      // Fetch mentor and learner profiles
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

      console.log('👥 Profiles fetched:', {
        mentor: mentorProfile?.full_name,
        mentorEmail: mentorProfile?.email,
        learner: learnerProfile?.full_name,
        learnerEmail: learnerEmail
      })

      // Send confirmation emails
      if (booking && mentorProfile && learnerProfile) {
        console.log('📬 Sending booking confirmation emails...')
        try {
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
          
          const emailData = {
            studentName: learnerProfile.full_name || 'Student',
            studentEmail: learnerEmail,
            coachName: mentorProfile.full_name || 'Coach',
            coachEmail: mentorProfile.email || '',
            bookingDate: startTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            }),
            bookingTime: startTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            duration: `${durationMinutes} minutes`,
            sessionNotes: sessionNotes || undefined
          }

          console.log('📨 Email data prepared:', emailData)
          
          await sendBookingRequestEmails(emailData)

          console.log('✅ Booking confirmation emails sent after payment')
        } catch (emailError) {
          console.error('❌ Failed to send booking emails:', emailError)
          // Don't fail the webhook if emails fail
        }
      } else {
        console.error('⚠️ Missing data for emails:', {
          hasBooking: !!booking,
          hasMentorProfile: !!mentorProfile,
          hasLearnerProfile: !!learnerProfile
        })
      }

      console.log('✅ Booking created successfully after payment:', bookingId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
