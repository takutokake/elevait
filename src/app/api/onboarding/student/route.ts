import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      currentInterest,
      currentSchool,
      alumniSchool,
      track,
      pmFocusAreas,
      priceRangeMinDollars,
      priceRangeMaxDollars,
      avatarUrl
    } = body

    // Convert price range from dollars to cents
    const priceRangeMinCents = Math.round(priceRangeMinDollars * 100)
    const priceRangeMaxCents = Math.round(priceRangeMaxDollars * 100)

    const supabase = await getSupabaseServerClient()

    // Upsert into students table
    const { error: studentError } = await supabase
      .from('students')
      .upsert({
        id: user.id,
        current_interest: currentInterest,
        current_school: currentSchool,
        alumni_school: alumniSchool || null,
        track,
        pm_focus_areas: pmFocusAreas,
        price_range_min_cents: priceRangeMinCents,
        price_range_max_cents: priceRangeMaxCents
      })

    if (studentError) {
      console.error('Error upserting student:', studentError)
      return NextResponse.json(
        { error: 'Failed to save student information' },
        { status: 500 }
      )
    }

    // Get current profile to check existing roles
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('roles, role')
      .eq('id', user.id)
      .single()

    // Update profiles table - add 'student' to roles array if not already present
    const currentRoles = currentProfile?.roles || []
    const updatedRoles = currentRoles.includes('student') 
      ? currentRoles 
      : [...currentRoles, 'student']

    const profileUpdates: any = {
      role: 'student', // Keep for backward compatibility
      roles: updatedRoles, // Multi-role support
      onboarding_complete: true
    }

    if (avatarUrl) {
      profileUpdates.avatar_url = avatarUrl
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in student onboarding:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
