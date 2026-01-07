import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabaseServer'
import { checkRateLimit, strictRateLimiter } from '@/lib/rateLimit'
import { createRateLimitResponse } from '@/lib/securityUtils'

/**
 * DEBUG ENDPOINT - Should only be used in development
 * SECURITY: Rate limited and requires authentication
 * TODO: Remove this endpoint in production or add IP whitelist
 */
export async function GET(request: NextRequest) {
  // SECURITY: Check authentication first
  const { user } = await getSessionUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // SECURITY: Apply strict rate limiting (10 requests per 15 minutes)
  const rateLimitResult = await checkRateLimit(request, strictRateLimiter, user.id)
  
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
  }
  
  // Only return safe user information (no sensitive data)
  return NextResponse.json({ 
    user: {
      id: user.id,
      email: user.email,
      // Add only non-sensitive fields as needed
    }
  })
}
