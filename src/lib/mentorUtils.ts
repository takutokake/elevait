/**
 * Utility functions for mentor/coach data formatting
 * These are pure functions with no server dependencies
 */

/**
 * Get mentor initials for avatar fallback
 */
export function getMentorInitials(fullName: string | null): string {
  if (!fullName) return '?'
  
  const names = fullName.trim().split(' ')
  if (names.length === 1) {
    return names[0][0]?.toUpperCase() || '?'
  }
  
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

/**
 * Format hourly rate for display from price_cents
 */
export function formatHourlyRate(priceCents: number | null | undefined): string {
  if (!priceCents) return 'Contact for pricing'
  return `$${(priceCents / 100).toFixed(0)}`
}
