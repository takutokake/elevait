import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side PKCE code exchange.
 *
 * The login page uses this URL as the OAuth redirectTo so that the
 * authorization code is exchanged here — on the server — rather than
 * in the browser. This avoids the GoTrueClient auto-exchange that
 * fires during _initialize() on every page load, which was causing
 * duplicate /auth/v1/token?grant_type=pkce requests and triggering
 * Supabase's rate limit.
 *
 * After exchanging the code (which sets the session cookies), we
 * redirect to /auth/callback (the client-side page) WITHOUT the ?code=
 * param, so the browser client never tries to exchange it again.
 *
 * Required configuration (do this once):
 *   Supabase Dashboard → Auth → URL Configuration → Redirect URLs:
 *     add  http://localhost:3000/api/auth/callback
 *     add  https://<your-production-domain>/api/auth/callback
 *
 *   Google Cloud Console → OAuth 2.0 Credentials → Authorized redirect URIs:
 *     add  http://localhost:3000/api/auth/callback
 *     add  https://<your-production-domain>/api/auth/callback
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const returnUrl = url.searchParams.get('returnUrl') || ''

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore as any,
    })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[API Auth Callback] Code exchange failed:', error.message)
      const loginUrl = new URL('/login', url.origin)
      loginUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect to the client-side callback page WITHOUT the ?code= param.
  // The session is now stored in HTTP-only cookies; the client page just
  // needs to call getUser() to pick it up.
  const callbackUrl = new URL('/auth/callback', url.origin)
  if (returnUrl) callbackUrl.searchParams.set('returnUrl', returnUrl)

  return NextResponse.redirect(callbackUrl)
}
