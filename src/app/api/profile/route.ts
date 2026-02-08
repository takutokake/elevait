import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit, standardRateLimiter } from '@/lib/rateLimit'
import { updateProfileSchema } from '@/lib/validationSchemas'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitization'
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
      validatedData = updateProfileSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error)
      }
      throw error
    }

    // SECURITY: Sanitize inputs
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (validatedData.full_name !== undefined) {
      updateData.full_name = sanitizeText(validatedData.full_name, 200)
    }
    
    if (validatedData.avatar_url !== undefined) {
      const sanitizedUrl = sanitizeUrl(validatedData.avatar_url)
      if (sanitizedUrl !== null) {
        updateData.avatar_url = sanitizedUrl
      }
    }

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[Security] Error updating profile:', error)
      return NextResponse.json(
        { error: sanitizeDatabaseError(error) },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to update profile', 500)
  }
}
