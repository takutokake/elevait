import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit, standardRateLimiter } from '@/lib/rateLimit'
import { updateMentorProfileSchema } from '@/lib/validationSchemas'
import { sanitizeText, sanitizeUrl, sanitizeStringArray } from '@/lib/sanitization'
import { createRateLimitResponse, handleValidationError, createSafeErrorResponse, sanitizeDatabaseError } from '@/lib/securityUtils'
import { ZodError } from 'zod'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // SECURITY: Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
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

    // SECURITY: Parse and validate request body
    const body = await request.json()
    
    let validatedData
    try {
      validatedData = updateMentorProfileSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error)
      }
      throw error
    }

    // SECURITY: Sanitize inputs
    const current_title = sanitizeText(validatedData.current_title, 200)
    const current_company = sanitizeText(validatedData.current_company, 200)
    const years_experience = validatedData.years_experience
    const linkedin_url = sanitizeUrl(validatedData.linkedin_url)
    const alumni_school = sanitizeText(validatedData.alumni_school, 200)
    const short_description = sanitizeText(validatedData.short_description, 500)
    const about_me = sanitizeText(validatedData.about_me, 2000)
    const focus_areas = sanitizeStringArray(validatedData.focus_areas)
    const job_type_tags = sanitizeStringArray(validatedData.job_type_tags)
    const key_achievements = sanitizeStringArray(validatedData.key_achievements)
    const successful_companies = sanitizeStringArray(validatedData.successful_companies)
    const companies_got_offers = sanitizeStringArray(validatedData.companies_got_offers)
    const companies_interviewed = sanitizeStringArray(validatedData.companies_interviewed)
    const price_cents = validatedData.price_cents

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
      console.error('[Security] Error updating mentor profile:', error)
      return NextResponse.json(
        { error: sanitizeDatabaseError(error) },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to update mentor profile', 500)
  }
}
