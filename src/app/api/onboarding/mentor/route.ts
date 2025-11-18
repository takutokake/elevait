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
      currentTitle,
      currentCompany,
      yearsExperience,
      linkedinUrl,
      focusAreas,
      priceDollars,
      alumniSchool,
      avatarUrl
    } = body

    // Convert price from dollars to cents
    const priceCents = Math.round(priceDollars * 100)

    const supabase = getSupabaseServerClient()

    // Upsert into mentors table
    const { error: mentorError } = await supabase
      .from('mentors')
      .upsert({
        id: user.id,
        current_title: currentTitle,
        current_company: currentCompany,
        years_experience: yearsExperience,
        linkedin_url: linkedinUrl,
        focus_areas: focusAreas,
        price_cents: priceCents,
        alumni_school: alumniSchool,
        status: 'active'
      })

    if (mentorError) {
      console.error('Error upserting mentor:', mentorError)
      return NextResponse.json(
        { error: 'Failed to save mentor information' },
        { status: 500 }
      )
    }

    // Update profiles table
    const profileUpdates: any = {
      role: 'mentor',
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
    console.error('Unexpected error in mentor onboarding:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
