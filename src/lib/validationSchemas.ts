import { z } from 'zod'

/**
 * OWASP Input Validation Schemas
 * - Type checking
 * - Length limits
 * - Format validation
 * - Reject unexpected fields with .strict()
 */

// Common field validators
const emailSchema = z.string().email().max(255).trim()
const phoneSchema = z.string().max(20).regex(/^[\d\s\-\+\(\)]+$/).optional().or(z.literal(''))
const urlSchema = z.string().url().max(500)
const uuidSchema = z.string().uuid()
const timestampSchema = z.string().datetime()

// Booking validation schemas
export const createBookingSchema = z.object({
  slotId: uuidSchema,
  bookingStartTime: timestampSchema,
  bookingEndTime: timestampSchema,
  learnerEmail: emailSchema.optional(),
  learnerPhone: phoneSchema.nullable().optional(),
  sessionNotes: z.string().max(1000).trim().optional(),
}).strict()

export const updateBookingSchema = z.object({
  bookingId: uuidSchema,
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  cancellationReason: z.string().max(500).trim().optional(),
}).strict()

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).trim().optional(),
  cancelledBy: z.enum(['coach', 'student']).optional(),
}).strict()

// Availability validation schemas
export const createAvailabilitySchema = z.object({
  slots: z.array(z.object({
    startTime: timestampSchema,
    endTime: timestampSchema,
  })).min(1).max(100), // Limit bulk creation to 100 slots
  timezone: z.string().max(50).optional(),
}).strict()

// Student onboarding validation
export const studentOnboardingSchema = z.object({
  currentInterest: z.string().max(200).trim(),
  currentSchool: z.string().max(200).trim(),
  alumniSchool: z.string().max(200).trim().optional(),
  track: z.string().max(100).trim(),
  pmFocusAreas: z.array(z.string().max(100)).max(10),
  priceRangeMinDollars: z.number().min(0).max(10000),
  priceRangeMaxDollars: z.number().min(0).max(10000),
  avatarUrl: urlSchema.optional(),
  referredBy: z.string().max(200).trim().optional(),
}).strict().refine(
  (data) => data.priceRangeMaxDollars >= data.priceRangeMinDollars,
  { message: 'Max price must be greater than or equal to min price' }
)

// Coach application validation
export const coachApplicationSchema = z.object({
  currentTitle: z.string().min(2).max(200).trim(),
  currentCompany: z.string().min(2).max(200).trim(),
  yearsExperience: z.number().int().min(0).max(70),
  linkedinUrl: urlSchema,
  focusAreas: z.array(z.string().max(100)).min(1).max(10),
  priceDollars: z.number().min(0).max(10000),
  alumniSchool: z.string().max(200).trim().optional(),
  shortDescription: z.string().min(10).max(500).trim(),
  aboutMe: z.string().min(50).max(2000).trim(),
  jobTypeTags: z.array(z.string().max(50)).max(10),
  specialties: z.array(z.string().max(100)).max(10),
  successfulCompanies: z.array(z.string().max(100)).max(20).optional(),
  companiesGotOffers: z.array(z.string().max(100)).max(20).optional(),
  companiesInterviewed: z.array(z.string().max(100)).max(20).optional(),
  avatarUrl: urlSchema.optional(),
}).strict()

// Mentor onboarding validation
export const mentorOnboardingSchema = z.object({
  currentTitle: z.string().min(2).max(200).trim(),
  currentCompany: z.string().min(2).max(200).trim(),
  yearsExperience: z.number().int().min(0).max(70),
  linkedinUrl: urlSchema,
  focusAreas: z.array(z.string().max(100)).min(1).max(10),
  priceDollars: z.number().min(0).max(10000),
  alumniSchool: z.string().max(200).trim().optional(),
  avatarUrl: urlSchema.optional(),
  timezone: z.string().max(50).optional(),
}).strict()

// Profile update validation
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(200).trim().optional(),
  avatar_url: urlSchema.optional(),
}).strict()

// Mentor profile update validation
export const updateMentorProfileSchema = z.object({
  current_title: z.string().min(2).max(200).trim().optional(),
  current_company: z.string().min(2).max(200).trim().optional(),
  years_experience: z.number().int().min(0).max(70).optional(),
  linkedin_url: urlSchema.optional(),
  alumni_school: z.string().max(200).trim().optional(),
  short_description: z.string().min(10).max(500).trim().optional(),
  about_me: z.string().min(50).max(2000).trim().optional(),
  focus_areas: z.array(z.string().max(100)).max(10).optional(),
  specialties: z.array(z.string().max(100)).max(10).optional(),
  job_type_tags: z.array(z.string().max(50)).max(10).optional(),
  key_achievements: z.array(z.string().max(200)).max(10).optional(),
  successful_companies: z.array(z.string().max(100)).max(20).optional(),
  companies_got_offers: z.array(z.string().max(100)).max(20).optional(),
  companies_interviewed: z.array(z.string().max(100)).max(20).optional(),
  price_cents: z.number().int().min(0).max(1000000).optional(),
}).strict()

// Checkout session validation
export const createCheckoutSessionSchema = z.object({
  mentorId: uuidSchema,
  slotId: uuidSchema,
  bookingStartTime: timestampSchema,
  bookingEndTime: timestampSchema,
  learnerEmail: emailSchema.optional(),
  learnerPhone: phoneSchema.nullable().optional(),
  sessionNotes: z.string().max(1000).trim().optional(),
}).strict()

// Survey submission validation
export const submitSurveySchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).trim().optional(),
  wouldRecommend: z.boolean().optional(),
}).strict()

/**
 * Validate request body against a schema
 * Returns parsed data if valid, throws ZodError if invalid
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Safe validation that returns success/error object instead of throwing
 */
export function safeValidateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}
