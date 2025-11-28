import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { getUserTimezone } from '@/lib/dateUtils'

/**
 * POST /api/availability
 * Create new availability slots (30-minute increments)
 * Requires: mentor role, authenticated user
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

    // Verify mentor role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Only mentors can create availability slots' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { slots, timezone } = body

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: 'Invalid slots data. Expected array of slots.' },
        { status: 400 }
      )
    }

    // Validate and prepare slots
    const userTimezone = timezone || getUserTimezone()
    const slotsToInsert = []

    for (const slot of slots) {
      const { startTime, endTime } = slot

      if (!startTime || !endTime) {
        return NextResponse.json(
          { error: 'Each slot must have startTime and endTime' },
          { status: 400 }
        )
      }

      const start = new Date(startTime)
      const end = new Date(endTime)

      // Validate time range
      if (start >= end) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        )
      }

      // Validate not in the past
      if (start < new Date()) {
        return NextResponse.json(
          { error: 'Cannot create availability slots in the past' },
          { status: 400 }
        )
      }

      // Validate 30-minute alignment
      if (start.getMinutes() % 30 !== 0 || end.getMinutes() % 30 !== 0) {
        return NextResponse.json(
          { error: 'Times must be aligned to 30-minute intervals' },
          { status: 400 }
        )
      }

      slotsToInsert.push({
        mentor_id: user.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        timezone: userTimezone,
        status: 'open',
      })
    }

    // Insert slots
    const { data: insertedSlots, error: insertError } = await supabase
      .from('availability_slots')
      .insert(slotsToInsert)
      .select()

    if (insertError) {
      console.error('Insert slots error:', insertError)
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      
      // Check if table doesn't exist
      if (insertError.code === '42P01') {
        return NextResponse.json(
          { error: 'Database tables not set up. Please run the migration first.', code: 'TABLE_NOT_FOUND' },
          { status: 503 }
        )
      }
      
      // Check for overlap constraint violation
      if (insertError.code === '23P01') {
        return NextResponse.json(
          { error: 'Slot overlaps with existing availability', code: 'OVERLAP' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create availability slots', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ slots: insertedSlots, count: insertedSlots.length })
  } catch (error) {
    console.error('API /availability POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/availability
 * Fetch availability slots for a mentor
 * Query params: mentorId (required), from (optional), to (optional), status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get('mentorId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const status = searchParams.get('status') || 'open'

    if (!mentorId) {
      return NextResponse.json(
        { error: 'mentorId parameter is required' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('availability_slots')
      .select('*')
      .eq('mentor_id', mentorId)

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by date range if provided
    if (from) {
      query = query.gte('start_time', new Date(from).toISOString())
    } else {
      // Default: only future slots
      query = query.gte('start_time', new Date().toISOString())
    }

    if (to) {
      query = query.lte('start_time', new Date(to).toISOString())
    }

    query = query.order('start_time', { ascending: true })

    const { data: slots, error: slotsError } = await query

    if (slotsError) {
      console.error('Fetch slots error:', slotsError)
      console.error('Error details:', {
        code: slotsError.code,
        message: slotsError.message,
        details: slotsError.details,
        hint: slotsError.hint
      })
      
      // Check if table doesn't exist
      if (slotsError.code === '42P01') {
        return NextResponse.json(
          { error: 'Database tables not set up. Please run the migration first.', code: 'TABLE_NOT_FOUND' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch availability slots', details: slotsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ slots: slots || [], count: slots?.length || 0 })
  } catch (error) {
    console.error('API /availability GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/availability
 * Delete an availability slot (only if not booked)
 * Query params: slotId (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { user } = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const slotId = searchParams.get('slotId')

    if (!slotId) {
      return NextResponse.json(
        { error: 'slotId parameter is required' },
        { status: 400 }
      )
    }

    // Check if slot exists and belongs to user
    const { data: slot, error: fetchError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('id', slotId)
      .eq('mentor_id', user.id)
      .single()

    if (fetchError || !slot) {
      return NextResponse.json(
        { error: 'Slot not found or access denied' },
        { status: 404 }
      )
    }

    // Check if slot is booked
    if (slot.status === 'booked') {
      return NextResponse.json(
        { error: 'Cannot delete a booked slot' },
        { status: 400 }
      )
    }

    // Delete slot
    const { error: deleteError } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slotId)

    if (deleteError) {
      console.error('Delete slot error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete slot' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Slot deleted successfully' })
  } catch (error) {
    console.error('API /availability DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
