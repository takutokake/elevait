import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to handle route protection and redirects
 */
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Block access to the Google auth settings page (if it exists)
  // This prevents users from manually accessing token management
  if (path === '/settings/google-auth') {
    // Redirect to homepage or dashboard
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Continue with the request for all other paths
  return NextResponse.next()
}

export const config = {
  matcher: ['/settings/google-auth'],
}
