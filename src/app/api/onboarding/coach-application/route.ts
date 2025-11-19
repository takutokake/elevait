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
      shortDescription,
      aboutMe,
      jobTypeTags,
      specialties,
      keyAchievements,
      successfulCompanies,
      avatarUrl
    } = body

    // Convert price from dollars to cents
    const priceCents = Math.round(priceDollars * 100)

    const supabase = getSupabaseServerClient()

    // Insert into mentor_applications table with ALL new fields
    const { error: applicationError } = await supabase
      .from('mentor_applications')
      .insert({
        user_id: user.id,
        status: 'pending',
        current_title: currentTitle,
        current_company: currentCompany,
        years_experience: yearsExperience,
        linkedin_url: linkedinUrl,
        focus_areas: focusAreas,
        price_cents: priceCents,
        alumni_school: alumniSchool,
        short_description: shortDescription,
        about_me: aboutMe,
        job_type_tags: jobTypeTags,
        specialties: specialties,
        key_achievements: keyAchievements,
        successful_companies: successfulCompanies
      })

    if (applicationError) {
      console.error('Error inserting mentor application:', applicationError)
      return NextResponse.json(
        { error: 'Failed to submit coach application' },
        { status: 500 }
      )
    }

    // Update profiles table
    const profileUpdates: any = {
      desired_role: 'mentor'
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
    console.error('Unexpected error in coach application:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
