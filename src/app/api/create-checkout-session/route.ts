import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { getPostHogClient } from '@/lib/posthog-server'
import { checkRateLimit, paymentRateLimiter } from '@/lib/rateLimit'
import { createCheckoutSessionSchema } from '@/lib/validationSchemas'
import { sanitizeEmail, sanitizePhone, sanitizeText, sanitizeUuid } from '@/lib/sanitization'
import { createRateLimitResponse, handleValidationError, createSafeErrorResponse } from '@/lib/securityUtils'
import { ZodError } from 'zod'

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

    // SECURITY: Apply strict payment rate limiting (5 checkout sessions per hour)
    const rateLimitResult = await checkRateLimit(request, paymentRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    // SECURITY: Parse and validate request body
    const body = await request.json()
    
    let validatedData
    try {
      validatedData = createCheckoutSessionSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error)
      }
      throw error
    }

    // SECURITY: Sanitize inputs
    const mentorId = sanitizeUuid(validatedData.mentorId)
    // Slot ID can be a UUID or a weekly slot ID (weekly-YYYY-MM-DD-HH-MM)
    const slotId = validatedData.slotId
    const isWeeklySlot = slotId && slotId.startsWith('weekly-')
    const bookingStartTime = validatedData.bookingStartTime
    const bookingEndTime = validatedData.bookingEndTime
    const learnerEmail = sanitizeEmail(validatedData.learnerEmail || user.email || '')
    const learnerPhone = sanitizePhone(validatedData.learnerPhone)
    const sessionNotes = sanitizeText(validatedData.sessionNotes, 1000)
    const userTimezone = validatedData.timezone || 'UTC'

    if (!mentorId) {
      return NextResponse.json(
        { error: 'Invalid mentor ID format' },
        { status: 400 }
      )
    }

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
        timezone: userTimezone,
      },
    })

    // Capture checkout session created event (server-side)
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: user.id,
      event: 'checkout_session_created',
      properties: {
        mentor_id: mentorId,
        duration_hours: durationHours,
        total_price_cents: totalPriceCents,
        stripe_session_id: session.id,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to create checkout session', 500)
  }
}
