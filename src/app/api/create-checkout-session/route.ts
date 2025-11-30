import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSessionUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      mentorId,
      slotId,
      bookingStartTime,
      bookingEndTime,
      learnerEmail,
      learnerPhone,
      sessionNotes,
    } = body

    // Validate required fields
    if (!mentorId || !slotId || !bookingStartTime || !bookingEndTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Fetch mentor details to get the price
    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select('price_cents')
      .eq('id', mentorId)
      .single()

    if (mentorError || !mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      )
    }

    // Fetch mentor profile for name
    const { data: mentorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', mentorId)
      .single()

    // Calculate duration in hours
    const startTime = new Date(bookingStartTime)
    const endTime = new Date(bookingEndTime)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    // Calculate total price (price_cents is per hour)
    const totalPriceCents = Math.round(mentor.price_cents * durationHours)

    // Create Stripe checkout session
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Coaching Session with ${mentorProfile?.full_name || 'Coach'}`,
              description: `${durationHours} hour session on ${startTime.toLocaleDateString()}`,
            },
            unit_amount: totalPriceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/booking-cancelled`,
      metadata: {
        userId: user.id,
        mentorId,
        slotId,
        bookingStartTime,
        bookingEndTime,
        learnerEmail: learnerEmail || user.email || '',
        learnerPhone: learnerPhone || '',
        sessionNotes: sessionNotes || '',
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
