import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { getUserTimezone } from '@/lib/dateUtils'
import { checkRateLimit, standardRateLimiter, readRateLimiter } from '@/lib/rateLimit'
import { createAvailabilitySchema } from '@/lib/validationSchemas'
import { sanitizeText, sanitizeUuid, sanitizeTimezone } from '@/lib/sanitization'
import { createRateLimitResponse, handleValidationError, createSafeErrorResponse, sanitizeDatabaseError } from '@/lib/securityUtils'
import { ZodError } from 'zod'

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

    // SECURITY: Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, standardRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
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

    // SECURITY: Parse and validate request body
    const body = await request.json()
    
    let validatedData
    try {
      validatedData = createAvailabilitySchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error)
      }
      throw error
    }

    const slots = validatedData.slots
    const timezone = sanitizeTimezone(validatedData.timezone)

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
      console.error('[Security] Insert slots error:', insertError)
      
      // SECURITY: Check for specific errors without leaking details
      if (insertError.code === '42P01') {
        return NextResponse.json(
          { error: 'Database tables not set up. Please run the migration first.', code: 'TABLE_NOT_FOUND' },
          { status: 503 }
        )
      }
      
      if (insertError.code === '23P01') {
        return NextResponse.json(
          { error: 'Slot overlaps with existing availability', code: 'OVERLAP' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: sanitizeDatabaseError(insertError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ slots: insertedSlots, count: insertedSlots.length })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to create availability slots', 500)
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

    // SECURITY: Apply read rate limiting
    const rateLimitResult = await checkRateLimit(request, readRateLimiter)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    const { searchParams } = new URL(request.url)
    const mentorId = sanitizeUuid(searchParams.get('mentorId'))
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
      console.error('[Security] Fetch slots error:', slotsError)
      
      // SECURITY: Check for specific errors without leaking details
      if (slotsError.code === '42P01') {
        return NextResponse.json(
          { error: 'Database tables not set up. Please run the migration first.', code: 'TABLE_NOT_FOUND' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: sanitizeDatabaseError(slotsError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ slots: slots || [], count: slots?.length || 0 })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to fetch availability slots', 500)
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

    // SECURITY: Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, standardRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    const { searchParams } = new URL(request.url)
    const slotId = sanitizeUuid(searchParams.get('slotId'))

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
      console.error('[Security] Delete slot error:', deleteError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(deleteError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Slot deleted successfully' })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to delete availability slot', 500)
  }
}
