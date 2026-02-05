import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit, standardRateLimiter } from '@/lib/rateLimit'
import { coachApplicationSchema } from '@/lib/validationSchemas'
import { sanitizeText, sanitizeUrl, sanitizeStringArray } from '@/lib/sanitization'
import { createRateLimitResponse, handleValidationError, createSafeErrorResponse, sanitizeDatabaseError } from '@/lib/securityUtils'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check if user is authenticated
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Apply rate limiting (100 requests per 15 minutes)
    const rateLimitResult = await checkRateLimit(request, standardRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    // SECURITY: Parse and validate request body
    const body = await request.json()
    
    let validatedData
    try {
      validatedData = coachApplicationSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error)
      }
      throw error
    }

    // SECURITY: Sanitize inputs
    const currentTitle = sanitizeText(validatedData.currentTitle, 200)
    const currentCompany = sanitizeText(validatedData.currentCompany, 200)
    const yearsExperience = validatedData.yearsExperience
    const linkedinUrl = sanitizeUrl(validatedData.linkedinUrl)
    const focusAreas = sanitizeStringArray(validatedData.focusAreas)
    const priceDollars = validatedData.priceDollars
    const alumniSchool = sanitizeText(validatedData.alumniSchool, 200)
    const shortDescription = sanitizeText(validatedData.shortDescription, 500)
    const aboutMe = sanitizeText(validatedData.aboutMe, 2000)
    const jobTypeTags = sanitizeStringArray(validatedData.jobTypeTags)
    const successfulCompanies = sanitizeStringArray(validatedData.successfulCompanies)
    const companiesGotOffers = sanitizeStringArray(validatedData.companiesGotOffers)
    const companiesInterviewed = sanitizeStringArray(validatedData.companiesInterviewed)
    const avatarUrl = sanitizeUrl(validatedData.avatarUrl)
    // Pricing fields
    const pricingModel = validatedData.pricingModel || 'free'
    const sessionPrice = validatedData.sessionPrice
    const freeSessionDuration = validatedData.freeSessionDuration || 30
    const sessionDuration = validatedData.sessionDuration || 45
    const paymentTitle = sanitizeText(validatedData.paymentTitle, 100)
    const paymentDescription = sanitizeText(validatedData.paymentDescription, 500)
    // Filter metadata fields
    const specializations = sanitizeStringArray(validatedData.specializations)
    const sessionTypes = sanitizeStringArray(validatedData.sessionTypes)
    const offersReferrals = validatedData.offersReferrals || false
    const hiredDate = validatedData.hiredDate

    // Convert price from dollars to cents
    const priceCents = Math.round(priceDollars * 100)

    const supabase = await getSupabaseServerClient()

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
        successful_companies: successfulCompanies,
        companies_got_offers: companiesGotOffers,
        companies_interviewed: companiesInterviewed,
        // Pricing fields
        pricing_model: pricingModel,
        session_price: sessionPrice,
        free_session_duration: freeSessionDuration,
        session_duration: sessionDuration,
        payment_title: paymentTitle,
        payment_description: paymentDescription,
        // Filter metadata fields
        specializations: specializations,
        session_types: sessionTypes,
        offers_referrals: offersReferrals,
        hired_date: hiredDate
      })

    if (applicationError) {
      console.error('[Security] Error inserting mentor application:', applicationError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(applicationError) },
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
      console.error('[Security] Error updating profile:', profileError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(profileError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to submit coach application', 500)
  }
}
