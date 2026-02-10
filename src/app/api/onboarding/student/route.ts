import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit, standardRateLimiter } from '@/lib/rateLimit'
import { studentOnboardingSchema } from '@/lib/validationSchemas'
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
      validatedData = studentOnboardingSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error)
      }
      throw error
    }

    // SECURITY: Sanitize inputs
    const currentInterest = sanitizeText(validatedData.currentInterest, 200)
    const currentSchool = sanitizeText(validatedData.currentSchool, 200)
    const alumniSchool = sanitizeText(validatedData.alumniSchool, 200)
    const track = sanitizeText(validatedData.track, 100)
    const pmFocusAreas = sanitizeStringArray(validatedData.pmFocusAreas)
    const sessionTypes = sanitizeStringArray(validatedData.sessionTypes)
    const avatarUrl = sanitizeUrl(validatedData.avatarUrl)
    const referredBy = sanitizeText(validatedData.referredBy, 200)

    const supabase = await getSupabaseServerClient()

    // Get referred_by from profile (set during signup) or use the one from onboarding form
    const { data: profileData } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', user.id)
      .single()

    // Use referredBy from form if provided, otherwise use the one from profile (signup)
    const finalReferredBy = referredBy || profileData?.referred_by || null

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
        session_types: sessionTypes,
        referred_by: finalReferredBy
      })

    if (studentError) {
      console.error('[Security] Error upserting student:', studentError)
      return NextResponse.json(
        { error: sanitizeDatabaseError(studentError) },
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

    // Update referred_by if provided during onboarding (allows users to add it later)
    if (referredBy) {
      profileUpdates.referred_by = referredBy
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
    return createSafeErrorResponse(error, 'Failed to complete student onboarding', 500)
  }
}
