import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// OWASP recommended rate limits for different endpoint types
// Using in-memory fallback if Upstash not configured (for development)

// Get client IP address from request
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to a default for local development
  return 'anonymous'
}

// In-memory rate limiter for development (when Upstash not configured)
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  async limit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now()
    const record = this.requests.get(identifier)
    
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return { success: true, remaining: this.maxRequests - 1, reset: now + this.windowMs }
    }
    
    if (record.count >= this.maxRequests) {
      return { success: false, remaining: 0, reset: record.resetTime }
    }
    
    record.count++
    return { success: true, remaining: this.maxRequests - record.count, reset: record.resetTime }
  }
}

// Create Redis client only if credentials are available
let redis: Redis | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// Rate limiters for different endpoint categories
// OWASP Best Practice: Different limits for different risk levels

// Strict rate limiter for authentication and sensitive operations (10 requests per 15 minutes)
export const strictRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : new InMemoryRateLimiter(10, 15 * 60 * 1000)

// Standard rate limiter for general API endpoints (100 requests per 15 minutes)
export const standardRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      analytics: true,
      prefix: 'ratelimit:standard',
    })
  : new InMemoryRateLimiter(100, 15 * 60 * 1000)

// Booking rate limiter (10 bookings per hour to prevent spam)
export const bookingRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 m'),
      analytics: true,
      prefix: 'ratelimit:booking',
    })
  : new InMemoryRateLimiter(10, 60 * 60 * 1000)

// Payment rate limiter (5 checkout sessions per hour)
export const paymentRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 m'),
      analytics: true,
      prefix: 'ratelimit:payment',
    })
  : new InMemoryRateLimiter(5, 60 * 60 * 1000)

// Read-only endpoints (200 requests per 15 minutes)
export const readRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '15 m'),
      analytics: true,
      prefix: 'ratelimit:read',
    })
  : new InMemoryRateLimiter(200, 15 * 60 * 1000)

/**
 * Apply rate limiting to a request
 * Returns true if request should be allowed, false if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  limiter: Ratelimit | InMemoryRateLimiter,
  userId?: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  // Use user ID if authenticated, otherwise use IP
  const identifier = userId || getClientIp(request)
  
  const result = await limiter.limit(identifier)
  
  return result
}
