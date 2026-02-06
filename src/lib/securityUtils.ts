import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Security Utilities
 * OWASP Best Practice: Don't leak internal information in error messages
 */

/**
 * Create a safe error response that doesn't leak internal details
 * Logs the actual error for debugging but returns generic message to client
 */
export function createSafeErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  statusCode: number = 500
): NextResponse {
  // Log the actual error for debugging (server-side only)
  console.error('[Security] Error occurred:', error)
  
  // Return generic error to client
  return NextResponse.json(
    { error: defaultMessage },
    { status: statusCode }
  )
}

/**
 * Handle Zod validation errors with user-friendly messages
 * Sanitizes error messages to prevent information leakage
 */
export function handleValidationError(error: ZodError): NextResponse {
  // Format validation errors in a user-friendly way with field-specific codes
  const formattedErrors = error.issues.map((err: any) => {
    const field = err.path.join('.')
    let code = 'invalid'
    let message = err.message
    
    // Determine error code based on validation type
    if (err.code === 'too_small') {
      code = err.type === 'string' ? 'too_short' : 'too_small'
      if (err.minimum !== undefined) {
        message = `${field} must be at least ${err.minimum} ${err.type === 'string' ? 'characters' : ''}`
      }
    } else if (err.code === 'too_big') {
      code = err.type === 'string' ? 'too_long' : 'too_big'
      if (err.maximum !== undefined) {
        message = `${field} must be at most ${err.maximum} ${err.type === 'string' ? 'characters' : ''}`
      }
    } else if (err.code === 'invalid_type') {
      code = 'invalid_type'
      message = `${field} has invalid type`
    } else if (err.code === 'invalid_string') {
      code = 'invalid_format'
      message = `${field} has invalid format`
    }
    
    return {
      field,
      code,
      message,
    }
  })
  
  console.error('[Validation] Validation failed:', formattedErrors)
  
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: formattedErrors,
    },
    { status: 400 }
  )
}

/**
 * Create rate limit exceeded response with proper headers
 */
export function createRateLimitResponse(
  remaining: number,
  reset: number
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    { status: 429 }
  )
  
  // Add rate limit headers (IETF standard)
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())
  response.headers.set('Retry-After', Math.ceil((reset - Date.now()) / 1000).toString())
  
  return response
}

/**
 * Validate that request body size is within acceptable limits
 * Prevents DoS attacks via large payloads
 */
export async function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<{ valid: true; body: any } | { valid: false; error: NextResponse }> {
  try {
    const contentLength = request.headers.get('content-length')
    
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        ),
      }
    }
    
    const body = await request.json()
    
    // Double-check actual size
    const bodySize = JSON.stringify(body).length
    if (bodySize > maxSizeBytes) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        ),
      }
    }
    
    return { valid: true, body }
  } catch (error) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Check if user is authorized to access a resource
 * Generic authorization check helper
 */
export function isAuthorized(
  userId: string | undefined,
  resourceOwnerId: string
): boolean {
  return userId === resourceOwnerId
}

/**
 * Sanitize database error messages
 * Prevents leaking database schema or sensitive information
 */
export function sanitizeDatabaseError(error: any): string {
  // Map common database errors to user-friendly messages
  const errorMap: Record<string, string> = {
    '23505': 'This record already exists',
    '23503': 'Related record not found',
    '23502': 'Required field is missing',
    '42P01': 'Service temporarily unavailable',
    '42703': 'Invalid field specified',
  }
  
  if (error?.code && errorMap[error.code]) {
    return errorMap[error.code]
  }
  
  // Default generic message
  return 'Database operation failed'
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com;"
  )
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )
  
  return response
}
