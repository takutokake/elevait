import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { fromZonedTime } from 'date-fns-tz'

interface WeeklySlot {
  day_of_week: number
  hour: number
  minute: number
  timezone: string
}

/**
 * Generate availability slots from weekly recurring availability
 * This converts weekly_availability entries into concrete date/time slots
 */
function generateSlotsFromWeeklyAvailability(
  weeklySlots: WeeklySlot[],
  fromDate: Date,
  toDate: Date,
  timezone: string
): Array<{ id: string; start_time: string; end_time: string; timezone: string }> {
  const slots: Array<{ id: string; start_time: string; end_time: string; timezone: string }> = []
  
  if (weeklySlots.length === 0) return slots

  // Group slots by day and sort by time to find contiguous blocks
  const slotsByDay: Map<number, Array<{ hour: number; minute: number }>> = new Map()
  
  weeklySlots.forEach(slot => {
    if (!slotsByDay.has(slot.day_of_week)) {
      slotsByDay.set(slot.day_of_week, [])
    }
    slotsByDay.get(slot.day_of_week)!.push({ hour: slot.hour, minute: slot.minute })
  })

  // Sort each day's slots by time
  slotsByDay.forEach((daySlots, day) => {
    daySlots.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
  })

  // Iterate through each day in the date range
  const currentDate = new Date(fromDate)
  currentDate.setHours(0, 0, 0, 0)
  
  while (currentDate <= toDate) {
    const dayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daySlots = slotsByDay.get(dayOfWeek)
    
    if (daySlots && daySlots.length > 0) {
      // Group contiguous 30-minute slots into larger blocks
      let blockStart: { hour: number; minute: number } | null = null
      let blockEnd: { hour: number; minute: number } | null = null
      
      for (let i = 0; i < daySlots.length; i++) {
        const slot = daySlots[i]
        
        if (blockStart === null) {
          blockStart = slot
          blockEnd = { hour: slot.hour, minute: slot.minute + 30 }
          if (blockEnd.minute >= 60) {
            blockEnd.hour += 1
            blockEnd.minute -= 60
          }
        } else {
          // Check if this slot is contiguous with the current block
          const expectedHour: number = blockEnd!.hour
          const expectedMinute: number = blockEnd!.minute
          
          if (slot.hour === expectedHour && slot.minute === expectedMinute) {
            // Extend the block
            blockEnd = { hour: slot.hour, minute: slot.minute + 30 }
            if (blockEnd.minute >= 60) {
              blockEnd.hour += 1
              blockEnd.minute -= 60
            }
          } else {
            // Save current block and start a new one
            // Create date in the mentor's timezone, then convert to UTC
            const localStartTime = new Date(currentDate)
            localStartTime.setHours(blockStart.hour, blockStart.minute, 0, 0)
            const startTime = fromZonedTime(localStartTime, timezone)
            
            const localEndTime = new Date(currentDate)
            localEndTime.setHours(blockEnd!.hour, blockEnd!.minute, 0, 0)
            const endTime = fromZonedTime(localEndTime, timezone)
            
            // Only add if the slot is in the future
            if (startTime > new Date()) {
              slots.push({
                id: `weekly-${currentDate.toISOString().split('T')[0]}-${blockStart.hour}-${blockStart.minute}`,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                timezone: timezone
              })
            }
            
            // Start new block
            blockStart = slot
            blockEnd = { hour: slot.hour, minute: slot.minute + 30 }
            if (blockEnd.minute >= 60) {
              blockEnd.hour += 1
              blockEnd.minute -= 60
            }
          }
        }
      }
      
      // Don't forget the last block
      if (blockStart !== null && blockEnd !== null) {
        // Create date in the mentor's timezone, then convert to UTC
        const localStartTime = new Date(currentDate)
        localStartTime.setHours(blockStart.hour, blockStart.minute, 0, 0)
        const startTime = fromZonedTime(localStartTime, timezone)
        
        const localEndTime = new Date(currentDate)
        localEndTime.setHours(blockEnd.hour, blockEnd.minute, 0, 0)
        const endTime = fromZonedTime(localEndTime, timezone)
        
        // Only add if the slot is in the future
        if (startTime > new Date()) {
          slots.push({
            id: `weekly-${currentDate.toISOString().split('T')[0]}-${blockStart.hour}-${blockStart.minute}`,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            timezone: timezone
          })
        }
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return slots
}

/**
 * GET /api/coaches/[id]/availability
 * Public endpoint to fetch a coach's available time slots
 * Query params: from (optional, default: today), to (optional, default: +30 days)
 * 
 * This endpoint now uses weekly_availability to generate recurring slots
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: coachId } = await params
    const supabase = await getSupabaseServerClient()
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

    // Fetch weekly recurring availability
    const { data: weeklyAvailability, error: weeklyError } = await supabase
      .from('weekly_availability')
      .select('day_of_week, hour, minute, timezone')
      .eq('mentor_id', coachId)

    if (weeklyError) {
      console.error('Fetch weekly availability error:', weeklyError)
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      )
    }

    if (!weeklyAvailability || weeklyAvailability.length === 0) {
      return NextResponse.json({
        coachId,
        slots: [],
        count: 0,
        dateRange: { from, to },
      })
    }

    // Get the timezone from the first slot (they should all be the same)
    const timezone = weeklyAvailability[0]?.timezone || 'UTC'

    // Generate concrete slots from weekly availability
    const generatedSlots = generateSlotsFromWeeklyAvailability(
      weeklyAvailability,
      new Date(from),
      new Date(to),
      timezone
    )

    // Fetch existing bookings to filter out booked times
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('booking_start_time, booking_end_time, status')
      .eq('mentor_id', coachId)
      .in('status', ['pending', 'confirmed'])
      .gte('booking_start_time', from)
      .lte('booking_end_time', to)

    if (bookingsError) {
      console.error('Fetch bookings error:', bookingsError)
      // Continue without filtering - better to show all slots than none
    }

    // Add sub-slots to each generated slot and filter out booked times
    const slotsWithSubSlots = generatedSlots.map(slot => {
      const slotStart = new Date(slot.start_time)
      const slotEnd = new Date(slot.end_time)
      
      // Generate 30-minute sub-slots
      const subSlots: Array<{ start: Date; end: Date; isAvailable: boolean }> = []
      let currentTime = new Date(slotStart)
      
      while (currentTime < slotEnd) {
        const subSlotEnd = new Date(currentTime.getTime() + 30 * 60 * 1000)
        
        // Check if this sub-slot overlaps with any booking
        const isBooked = (bookings || []).some(booking => {
          const bookingStart = new Date(booking.booking_start_time)
          const bookingEnd = new Date(booking.booking_end_time)
          return currentTime < bookingEnd && subSlotEnd > bookingStart
        })
        
        subSlots.push({
          start: new Date(currentTime),
          end: subSlotEnd,
          isAvailable: !isBooked && currentTime > now
        })
        
        currentTime = subSlotEnd
      }
      
      return {
        ...slot,
        subSlots,
        availableSubSlots: subSlots.filter(s => s.isAvailable),
        bookedSubSlots: subSlots.filter(s => !s.isAvailable)
      }
    })

    // Filter out slots with no available sub-slots
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
