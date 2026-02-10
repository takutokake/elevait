import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { getPostHogClient } from '@/lib/posthog-server'
import { checkRateLimit, standardRateLimiter } from '@/lib/rateLimit'
import { createRateLimitResponse, createSafeErrorResponse, sanitizeDatabaseError } from '@/lib/securityUtils'

/**
 * POST /api/bookings/[id]/approve
 * Mentor approves a pending booking
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

    // SECURITY: Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, standardRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    // Call the approve_booking function
    const { data, error } = await supabase.rpc('approve_booking', {
      p_booking_id: bookingId,
      p_mentor_id: user.id
    })

    if (error) {
      console.error('[Security] Approve booking error:', error)
      return NextResponse.json(
        { error: sanitizeDatabaseError(error) },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Failed to approve booking' },
        { status: 400 }
      )
    }

    // Capture booking approved event (server-side)
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: user.id,
      event: 'booking_approved',
      properties: {
        booking_id: bookingId,
        mentor_id: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      booking: data
    })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to approve booking', 500)
  }
}
