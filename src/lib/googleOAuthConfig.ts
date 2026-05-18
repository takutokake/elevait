'use client'

/**
 * Google OAuth Configuration
 * Required scopes for calendar integration with Google Meet
 */

export const GOOGLE_OAUTH_SCOPES = {
  OPENID: 'openid',
  EMAIL: 'email',
  PROFILE: 'profile',
  CALENDAR: 'https://www.googleapis.com/auth/calendar',
  CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events',
  MEETINGS_SPACE: 'https://www.googleapis.com/auth/meetings.space.created',
  GMAIL_READONLY: 'https://www.googleapis.com/auth/gmail.readonly',
}

/**
 * Get all scopes as a space-separated string for OAuth requests
 */
export function getFullScopeString(): string {
  return Object.values(GOOGLE_OAUTH_SCOPES).join(' ')
}

/**
 * Check if the required calendar scopes are present
 */
export function hasCalendarScopes(scopes: string[] | undefined): boolean {
  if (!scopes || scopes.length === 0) return false
  
  const requiredScopes = [
    GOOGLE_OAUTH_SCOPES.CALENDAR,
    GOOGLE_OAUTH_SCOPES.CALENDAR_EVENTS
  ]
  
  return requiredScopes.every(scope => scopes.includes(scope))
}
