import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

/**
 * POST /api/bookings/[id]/decline
 * Mentor declines a pending booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const supabase = getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reason } = body

    // Call the decline_booking function
    const { data, error } = await supabase.rpc('decline_booking', {
      p_booking_id: bookingId,
      p_mentor_id: user.id,
      p_decline_reason: reason || null
    })

    if (error) {
      console.error('Decline booking error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to decline booking' },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Failed to decline booking' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: data
    })
  } catch (error) {
    console.error('API /bookings/[id]/decline POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
