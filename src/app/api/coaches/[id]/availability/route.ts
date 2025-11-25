import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { computeSubSlots } from '@/lib/dateUtils'

/**
 * GET /api/coaches/[id]/availability
 * Public endpoint to fetch a coach's available time slots
 * Query params: from (optional, default: today), to (optional, default: +30 days)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: coachId } = await params
    const supabase = getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Default date range: today to +30 days
    const now = new Date()
    const defaultTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const from = searchParams.get('from') || now.toISOString()
    const to = searchParams.get('to') || defaultTo.toISOString()

    // Verify coach exists and is active
    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select('id, is_active')
      .eq('id', coachId)
      .eq('is_active', true)
      .single()

    if (mentorError || !mentor) {
      return NextResponse.json(
        { error: 'Coach not found or not active' },
        { status: 404 }
      )
    }

    // Fetch availability ranges (including partially booked ones)
    const { data: availabilityRanges, error: slotsError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('mentor_id', coachId)
      .in('status', ['open', 'partially_booked']) // Include partially booked
      .gte('start_time', new Date(from).toISOString())
      .lte('start_time', new Date(to).toISOString())
      .gte('end_time', now.toISOString()) // Only ranges that haven't ended yet
      .order('start_time', { ascending: true })

    if (slotsError) {
      console.error('Fetch availability error:', slotsError)
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      )
    }

    if (!availabilityRanges || availabilityRanges.length === 0) {
      return NextResponse.json({
        coachId,
        slots: [],
        count: 0,
        dateRange: { from, to },
      })
    }

    // Fetch all active bookings for these availability ranges
    const availabilityIds = availabilityRanges.map(slot => slot.id)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('availability_slot_id, booking_start_time, booking_end_time, status')
      .in('availability_slot_id', availabilityIds)
      .in('status', ['pending', 'confirmed'])

    if (bookingsError) {
      console.error('Fetch bookings error:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // Compute available sub-slots for each availability range
    const slotsWithSubSlots = availabilityRanges.map(range => {
      // Get bookings for this specific range
      const rangeBookings = (bookings || []).filter(
        b => b.availability_slot_id === range.id
      )

      // Compute 30-minute sub-slots
      const subSlots = computeSubSlots(
        new Date(range.start_time),
        new Date(range.end_time),
        rangeBookings.map(b => ({
          start: new Date(b.booking_start_time),
          end: new Date(b.booking_end_time)
        }))
      )

      // Filter out past sub-slots
      const futureSubSlots = subSlots.filter(slot => slot.start >= now)

      return {
        ...range,
        subSlots: futureSubSlots,
        availableSubSlots: futureSubSlots.filter(s => s.isAvailable),
        bookedSubSlots: futureSubSlots.filter(s => !s.isAvailable)
      }
    })

    // Filter out ranges with no available sub-slots
    const slotsWithAvailability = slotsWithSubSlots.filter(
      slot => slot.availableSubSlots.length > 0
    )

    return NextResponse.json({
      coachId,
      slots: slotsWithAvailability,
      count: slotsWithAvailability.length,
      dateRange: { from, to },
    })
  } catch (error) {
    console.error('API /coaches/[id]/availability GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
