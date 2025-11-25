import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

/**
 * Health check endpoint to verify database setup
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    const checks = {
      supabase_connected: false,
      availability_slots_exists: false,
      bookings_exists: false,
      functions_exist: false,
      migration_needed: false,
    }

    // Check if we can connect to Supabase
    try {
      const { error: connectionError } = await supabase.from('profiles').select('id').limit(1)
      checks.supabase_connected = !connectionError
    } catch (e) {
      checks.supabase_connected = false
    }

    // Check if availability_slots table exists
    try {
      const { error: slotsError } = await supabase
        .from('availability_slots')
        .select('id')
        .limit(1)
      checks.availability_slots_exists = !slotsError || slotsError.code !== '42P01'
    } catch (e) {
      checks.availability_slots_exists = false
    }

    // Check if bookings table exists
    try {
      const { error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .limit(1)
      checks.bookings_exists = !bookingsError || bookingsError.code !== '42P01'
    } catch (e) {
      checks.bookings_exists = false
    }

    // Check if create_booking function exists
    try {
      const { error: funcError } = await supabase.rpc('create_booking', {
        p_slot_id: '00000000-0000-0000-0000-000000000000',
        p_learner_id: '00000000-0000-0000-0000-000000000000',
        p_booking_start_time: new Date().toISOString(),
        p_booking_end_time: new Date().toISOString(),
        p_learner_email: null,
        p_learner_phone: null,
        p_session_notes: null,
      })
      // Function exists if we get any error other than "does not exist"
      checks.functions_exist = !funcError || !funcError.message.includes('does not exist')
    } catch (e: any) {
      checks.functions_exist = !e.message?.includes('does not exist')
    }

    // Determine if migration is needed
    checks.migration_needed = 
      !checks.availability_slots_exists || 
      !checks.bookings_exists || 
      !checks.functions_exist

    const status = checks.migration_needed ? 'migration_required' : 'ready'

    return NextResponse.json({
      status,
      checks,
      message: checks.migration_needed
        ? '⚠️ Migration required. Please run supabase_booking_migration.sql'
        : '✅ Booking system is ready',
      instructions: checks.migration_needed
        ? 'See MIGRATION_INSTRUCTIONS.md for setup steps'
        : null,
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to perform health check',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
