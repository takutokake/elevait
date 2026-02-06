import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

interface WeeklySlot {
  day: number
  hour: number
  minute?: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get('mentorId') || user.id

    const { data, error } = await supabase
      .from('weekly_availability')
      .select('day_of_week, hour, minute, timezone')
      .eq('mentor_id', mentorId)

    if (error) {
      console.error('Error fetching weekly availability:', error)
      return NextResponse.json({ error: 'Failed to fetch weekly availability' }, { status: 500 })
    }

    const slots = data?.map(slot => ({
      day: slot.day_of_week,
      hour: slot.hour,
      minute: slot.minute || 0
    })) || []

    // Get the timezone from the first slot (they should all be the same)
    const timezone = data?.[0]?.timezone || null

    return NextResponse.json({ slots, timezone })
  } catch (error) {
    console.error('Error in weekly availability GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slots, timezone } = body as { slots: WeeklySlot[], timezone: string }

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'Invalid slots format' }, { status: 400 })
    }

    // Delete existing weekly availability for this mentor
    const { error: deleteError } = await supabase
      .from('weekly_availability')
      .delete()
      .eq('mentor_id', user.id)

    if (deleteError) {
      console.error('Error deleting existing weekly availability:', deleteError)
      return NextResponse.json({ error: 'Failed to update weekly availability' }, { status: 500 })
    }

    // Insert new weekly availability slots
    if (slots.length > 0) {
      const slotsToInsert = slots.map(slot => ({
        mentor_id: user.id,
        day_of_week: slot.day,
        hour: slot.hour,
        minute: slot.minute || 0,
        timezone: timezone || 'UTC'
      }))

      const { error: insertError } = await supabase
        .from('weekly_availability')
        .insert(slotsToInsert)

      if (insertError) {
        console.error('Error inserting weekly availability:', insertError)
        return NextResponse.json({ error: 'Failed to save weekly availability' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, count: slots.length })
  } catch (error) {
    console.error('Error in weekly availability POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('weekly_availability')
      .delete()
      .eq('mentor_id', user.id)

    if (error) {
      console.error('Error deleting weekly availability:', error)
      return NextResponse.json({ error: 'Failed to delete weekly availability' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in weekly availability DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
