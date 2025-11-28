import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      current_title,
      current_company,
      years_experience,
      linkedin_url,
      alumni_school,
      short_description,
      about_me,
      focus_areas,
      specialties,
      job_type_tags,
      key_achievements,
      successful_companies,
      companies_got_offers,
      companies_interviewed,
      price_cents
    } = body

    // First check if mentor record exists
    const { data: existingMentor } = await supabase
      .from('mentors')
      .select('id')
      .eq('id', user.id)
      .single()

    let data, error

    if (existingMentor) {
      // Update existing mentor
      const result = await supabase
        .from('mentors')
        .update({
          current_title,
          current_company,
          years_experience,
          linkedin_url,
          alumni_school,
          short_description,
          about_me,
          focus_areas,
          specialties,
          job_type_tags,
          key_achievements,
          successful_companies,
          companies_got_offers,
          companies_interviewed,
          price_cents
        })
        .eq('id', user.id)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Create new mentor record
      const result = await supabase
        .from('mentors')
        .insert({
          id: user.id,
          current_title,
          current_company,
          years_experience,
          linkedin_url,
          alumni_school,
          short_description,
          about_me,
          focus_areas,
          specialties,
          job_type_tags,
          key_achievements,
          successful_companies,
          companies_got_offers,
          companies_interviewed,
          price_cents,
          is_active: true
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error updating mentor profile:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to update mentor profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
