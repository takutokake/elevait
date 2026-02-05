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
    const successful_companies = sanitizeStringArray(validatedData.successful_companies)
    const companies_got_offers = sanitizeStringArray(validatedData.companies_got_offers)
    const companies_interviewed = sanitizeStringArray(validatedData.companies_interviewed)
    const price_cents = validatedData.price_cents
    // Pricing fields
    const pricing_model = validatedData.pricing_model
    const session_price = validatedData.session_price
    const free_session_duration = validatedData.free_session_duration
    const session_duration = validatedData.session_duration
    const payment_title = sanitizeText(validatedData.payment_title, 100)
    const payment_description = sanitizeText(validatedData.payment_description, 500)
    // Filter metadata fields
    const specializations = sanitizeStringArray(validatedData.specializations)
    const session_types = sanitizeStringArray(validatedData.session_types)
    const offers_referrals = validatedData.offers_referrals
    // Convert YYYY-MM format to YYYY-MM-01 for PostgreSQL date type
    let hired_date = validatedData.hired_date
    if (hired_date && hired_date.length === 7) {
      hired_date = `${hired_date}-01`
    }

    // First check if mentor record exists
    const { data: existingMentor } = await supabase
      .from('mentors')
      .select('id')
      .eq('id', user.id)
      .single()

    let data, error

    if (existingMentor) {
      // Update existing mentor - only include defined fields
      const updateData: any = {}
      if (current_title !== undefined) updateData.current_title = current_title
      if (current_company !== undefined) updateData.current_company = current_company
      if (years_experience !== undefined) updateData.years_experience = years_experience
      if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url
      if (alumni_school !== undefined) updateData.alumni_school = alumni_school
      if (short_description !== undefined) updateData.short_description = short_description
      if (about_me !== undefined) updateData.about_me = about_me
      if (focus_areas !== undefined) updateData.focus_areas = focus_areas
      if (job_type_tags !== undefined) updateData.job_type_tags = job_type_tags
      if (successful_companies !== undefined) updateData.successful_companies = successful_companies
      if (companies_got_offers !== undefined) updateData.companies_got_offers = companies_got_offers
      if (companies_interviewed !== undefined) updateData.companies_interviewed = companies_interviewed
      if (price_cents !== undefined) updateData.price_cents = price_cents
      // Pricing fields
      if (pricing_model !== undefined) updateData.pricing_model = pricing_model
      if (session_price !== undefined) updateData.session_price = session_price
      if (free_session_duration !== undefined) updateData.free_session_duration = free_session_duration
      if (session_duration !== undefined) updateData.session_duration = session_duration
      if (payment_title !== undefined) updateData.payment_title = payment_title
      if (payment_description !== undefined) updateData.payment_description = payment_description
      // Filter metadata fields (only if columns exist in DB)
      if (specializations !== undefined) updateData.specializations = specializations
      if (session_types !== undefined) updateData.session_types = session_types
      if (offers_referrals !== undefined) updateData.offers_referrals = offers_referrals
      if (hired_date !== undefined) updateData.hired_date = hired_date

      const result = await supabase
        .from('mentors')
        .update(updateData)
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
          successful_companies,
          companies_got_offers,
          companies_interviewed,
          price_cents,
          is_active: true,
          // Pricing fields
          pricing_model,
          session_price,
          free_session_duration,
          session_duration,
          payment_title,
          payment_description,
          // Filter metadata fields
          specializations,
          session_types,
          offers_referrals,
          hired_date
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('[Security] Error updating mentor profile:', error)
      console.error('[Security] Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: sanitizeDatabaseError(error), details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to update mentor profile', 500)
  }
}
