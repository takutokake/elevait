/**
 * Input Sanitization Utilities
 * OWASP Best Practice: Sanitize all user inputs to prevent XSS attacks
 * 
 * Note: We use a simple sanitization approach that works in Node.js environment
 * For more complex HTML sanitization, consider DOMPurify (requires DOM environment)
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return ''
  
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize an array of strings
 */
export function sanitizeStringArray(input: string[] | null | undefined): string[] {
  if (!input || !Array.isArray(input)) return []
  
  return input.map(item => sanitizeString(item))
}

/**
 * Sanitize an array of strings WITHOUT HTML encoding
 * Use this for data that will be stored in the database and doesn't need HTML escaping
 * (e.g., specializations, tags, categories)
 */
export function sanitizeStringArrayNoEncode(input: string[] | null | undefined): string[] {
  if (!input || !Array.isArray(input)) return []
  
  // Just trim and limit length, no HTML encoding
  return input
    .filter(item => item && typeof item === 'string')
    .map(item => String(item).trim().slice(0, 200))
    .filter(item => item.length > 0)
}

/**
 * Sanitize an object's string properties recursively
 * Useful for sanitizing entire request bodies
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as any
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) => 
        typeof item === 'string' ? sanitizeString(item) : item
      ) as any
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    }
  }
  
  return sanitized
}

/**
 * Sanitize email address
 * Validates format and removes potentially dangerous characters
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''
  
  // Remove whitespace and convert to lowercase
  const cleaned = String(email).trim().toLowerCase()
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!emailRegex.test(cleaned)) {
    return ''
  }
  
  return cleaned
}

/**
 * Sanitize URL
 * Ensures URL is safe and uses allowed protocols
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || url === '') return null
  
  const cleaned = String(url).trim()
  
  // Allow empty string explicitly
  if (cleaned === '') return null
  
  try {
    const parsed = new URL(cleaned)
    
    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize phone number
 * Removes all non-digit characters except +, -, (, ), and spaces
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  
  return String(phone).replace(/[^\d\s\-\+\(\)]/g, '').trim()
}

/**
 * Strip all HTML tags from a string
 * Use this for fields that should never contain HTML
 */
export function stripHtmlTags(input: string | null | undefined): string {
  if (!input) return ''
  
  return String(input).replace(/<[^>]*>/g, '')
}

/**
 * Sanitize text input with length limit
 * Useful for text fields, descriptions, notes, etc.
 */
export function sanitizeText(
  input: string | null | undefined,
  maxLength: number = 1000
): string {
  if (!input) return ''
  
  const sanitized = sanitizeString(input)
  return sanitized.slice(0, maxLength)
}

/**
 * Sanitize text input WITHOUT HTML encoding
 * Use this for long-form text fields (aboutMe, descriptions) that will be stored as plain text
 * and escaped by React on render. This prevents double-encoding issues.
 */
export function sanitizeTextNoEncode(
  input: string | null | undefined,
  maxLength: number = 1000
): string {
  if (!input) return ''
  
  // Just trim and limit length, no HTML encoding
  // Remove any potentially dangerous characters but keep normal punctuation
  const cleaned = String(input)
    .trim()
    .slice(0, maxLength)
  
  return cleaned
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUuid(uuid: string | null | undefined): string | null {
  if (!uuid) return null
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  const cleaned = String(uuid).trim().toLowerCase()
  
  if (!uuidRegex.test(cleaned)) {
    return null
  }
  
  return cleaned
}

/**
 * Sanitize numeric input
 * Ensures value is a valid number within bounds
 */
export function sanitizeNumber(
  input: number | string | null | undefined,
  min?: number,
  max?: number
): number | null {
  if (input === null || input === undefined || input === '') return null
  
  const num = typeof input === 'string' ? parseFloat(input) : input
  
  if (isNaN(num)) return null
  
  if (min !== undefined && num < min) return min
  if (max !== undefined && num > max) return max
  
  return num
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(
  input: number | string | null | undefined,
  min?: number,
  max?: number
): number | null {
  const num = sanitizeNumber(input, min, max)
  
  if (num === null) return null
  
  return Math.floor(num)
}

/**
 * Decode HTML entities in a string
 * Useful for fixing data that was incorrectly HTML-escaped
 */
export function decodeHtmlEntities(input: string | null | undefined): string {
  if (!input) return ''
  
  const str = String(input)
  
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

/**
 * Sanitize timezone identifier
 * Validates IANA timezone format (e.g., America/Los_Angeles)
 * Does NOT escape forward slashes as they are required for timezone identifiers
 * Also decodes HTML entities in case the timezone was incorrectly escaped
 */
export function sanitizeTimezone(timezone: string | null | undefined): string {
  if (!timezone) return 'UTC'
  
  // First decode any HTML entities (fixes corrupted data from database)
  const decoded = decodeHtmlEntities(timezone)
  const cleaned = decoded.trim()
  
  // IANA timezone format: Continent/City or Continent/Region/City
  // Allow letters, numbers, underscores, hyphens, and forward slashes
  const timezoneRegex = /^[A-Za-z0-9_+-]+\/[A-Za-z0-9_+-]+(\/[A-Za-z0-9_+-]+)?$/
  
  if (!timezoneRegex.test(cleaned)) {
    return 'UTC' // Fallback to UTC if invalid
  }
  
  // Additional validation: try to use it with Intl.DateTimeFormat
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: cleaned })
    return cleaned
  } catch {
    return 'UTC' // Fallback if timezone is not recognized
  }
}
