/**
 * Helper functions for multi-role support
 */

export type UserRole = 'student' | 'mentor'

export interface ProfileWithRoles {
  id: string
  role: string | null // Legacy single role field
  roles: string[] | null // New multi-role field
  [key: string]: any
}

/**
 * Check if a user has a specific role
 */
export function hasRole(profile: ProfileWithRoles | null, role: UserRole): boolean {
  if (!profile) return false
  
  // Check new roles array first
  if (profile.roles && Array.isArray(profile.roles)) {
    return profile.roles.includes(role)
  }
  
  // Fallback to legacy role field
  return profile.role === role
}

/**
 * Get all roles for a user
 */
export function getUserRoles(profile: ProfileWithRoles | null): UserRole[] {
  if (!profile) return []
  
  // Use new roles array if available
  if (profile.roles && Array.isArray(profile.roles)) {
    return profile.roles.filter(r => r === 'student' || r === 'mentor') as UserRole[]
  }
  
  // Fallback to legacy role field
  if (profile.role === 'student' || profile.role === 'mentor') {
    return [profile.role]
  }
  
  return []
}

/**
 * Check if user can access student features
 */
export function canAccessStudentFeatures(profile: ProfileWithRoles | null): boolean {
  return hasRole(profile, 'student')
}

/**
 * Check if user can access mentor features
 */
export function canAccessMentorFeatures(profile: ProfileWithRoles | null): boolean {
  return hasRole(profile, 'mentor')
}

/**
 * Get primary role (for backward compatibility)
 */
export function getPrimaryRole(profile: ProfileWithRoles | null): UserRole | null {
  if (!profile) return null
  
  const roles = getUserRoles(profile)
  
  // If user has mentor role, prioritize it as primary
  if (roles.includes('mentor')) return 'mentor'
  if (roles.includes('student')) return 'student'
  
  return null
}

/**
 * Check if user has multiple roles
 */
export function hasMultipleRoles(profile: ProfileWithRoles | null): boolean {
  return getUserRoles(profile).length > 1
}
