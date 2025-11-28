import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'

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

    // Call the approve_booking function
    const { data, error } = await supabase.rpc('approve_booking', {
      p_booking_id: bookingId,
      p_mentor_id: user.id
    })

    if (error) {
      console.error('Approve booking error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to approve booking' },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Failed to approve booking' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: data
    })
  } catch (error) {
    console.error('API /bookings/[id]/approve POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
