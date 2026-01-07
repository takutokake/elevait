import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit, standardRateLimiter } from '@/lib/rateLimit'
import { mentorOnboardingSchema } from '@/lib/validationSchemas'
import { sanitizeText, sanitizeUrl, sanitizeStringArray, sanitizeTimezone } from '@/lib/sanitization'
import { createRateLimitResponse, handleValidationError, createSafeErrorResponse, sanitizeDatabaseError } from '@/lib/securityUtils'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check if user is authenticated
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      validatedData = mentorOnboardingSchema.parse(body)
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
    const avatarUrl = sanitizeUrl(validatedData.avatarUrl)
    const timezone = sanitizeTimezone(validatedData.timezone)

    // Convert price from dollars to cents
    const priceCents = Math.round(priceDollars * 100)

    const supabase = await getSupabaseServerClient()

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
        timezone: timezone || 'America/Los_Angeles',
        status: 'active'
      })

    if (mentorError) {
      console.error('[Security] Error upserting mentor:', mentorError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(mentorError) },
        { status: 500 }
      )
    }

    // Get current profile to check existing roles
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('roles, role')
      .eq('id', user.id)
      .single()

    // Update profiles table - add 'mentor' to roles array if not already present
    const currentRoles = currentProfile?.roles || []
    const updatedRoles = currentRoles.includes('mentor') 
      ? currentRoles 
      : [...currentRoles, 'mentor']

    const profileUpdates: any = {
      role: 'mentor', // Keep for backward compatibility (primary role)
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
      console.error('[Security] Error updating profile:', profileError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(profileError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to complete mentor onboarding', 500)
  }
}
