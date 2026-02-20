/**
 * Helper functions for form handling and validation
 */

/**
 * Prepares form data for the coach application by ensuring proper types
 */
export function prepareCoachApplicationData(formData: Record<string, any>) {
  return {
    ...formData,
    // Ensure numeric fields are numbers
    yearsExperience: Number(formData.yearsExperience),
    priceDollars: Number(formData.priceDollars || 0),
    freeSessionDuration: Number(formData.freeSessionDuration || 30),
    sessionDuration: Number(formData.sessionDuration || 45),
    totalInterviews: formData.totalInterviews ? Number(formData.totalInterviews) : 0,
    
    // Ensure array fields are arrays
    focusAreas: ensureArray(formData.focusAreas),
    jobTypeTags: ensureArray(formData.jobTypeTags),
    specializations: ensureArray(formData.specializations),
    sessionTypes: ensureArray(formData.sessionTypes),
    successfulCompanies: ensureArray(formData.successfulCompanies),
    companiesGotOffers: ensureArray(formData.companiesGotOffers),
    companiesInterviewed: ensureArray(formData.companiesInterviewed),
    
    // Handle optional fields
    offersReferrals: Boolean(formData.offersReferrals),
  }
}

/**
 * Ensures a value is an array
 */
function ensureArray(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
}

/**
 * Validates a URL string
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
