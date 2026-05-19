'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Store OAuth tokens from the current session to the database
 * This should be called after a successful OAuth sign-in
 */
export async function storeOAuthTokens(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[OAuth Handler] Checking for OAuth tokens to store')
    const supabase = createClientComponentClient()

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.log('[OAuth Handler] No active session found')
      return { success: false, error: 'No active session' }
    }

    // Check if this was an OAuth sign-in with Google
    const provider = session.user?.app_metadata?.provider
    if (provider !== 'google') {
      console.log('[OAuth Handler] Not a Google OAuth session, provider:', provider)
      return { success: false, error: 'Not a Google OAuth session' }
    }

    // Get the OAuth tokens from the session
    const { provider_token, provider_refresh_token } = session

    if (!provider_token) {
      console.log('[OAuth Handler] No provider token found in session')
      return { success: false, error: 'No provider token found' }
    }

    console.log('[OAuth Handler] Found Google OAuth token, storing in database')
    console.log('[OAuth Handler] Has refresh token:', !!provider_refresh_token)

    // Get the scopes from the session - try multiple locations
    let providerScopes: string[] = []
    
    // Try to get scopes from different possible locations in the session
    if (session.user?.app_metadata?.provider_scopes) {
      providerScopes = session.user.app_metadata.provider_scopes
    } else if (session.user?.user_metadata?.provider_scopes) {
      providerScopes = session.user.user_metadata.provider_scopes
    }
    
    // If scopes is a string, split it
    if (typeof providerScopes === 'string') {
      providerScopes = (providerScopes as string).split(' ')
    }

    console.log('[OAuth Handler] Provider scopes:', providerScopes)

    // Check if token already exists for this user and provider
    const { data: existingTokens } = await supabase
      .from('user_oauth_tokens')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('provider', 'google')
      .limit(1)

    // Prepare token data
    const tokenData = {
      user_id: session.user.id,
      provider: 'google',
      access_token: provider_token,
      refresh_token: provider_refresh_token || null,
      provider_scopes: providerScopes.length > 0 ? providerScopes : null,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // Default 1 hour expiry
      updated_at: new Date().toISOString(),
    }

    let error

    // Update existing token or insert new one
    if (existingTokens && existingTokens.length > 0) {
      console.log('[OAuth Handler] Updating existing token')
      const { error: updateError } = await supabase
        .from('user_oauth_tokens')
        .update(tokenData)
        .eq('id', existingTokens[0].id)
      error = updateError
    } else {
      console.log('[OAuth Handler] Inserting new token')
      const { error: insertError } = await supabase
        .from('user_oauth_tokens')
        .insert(tokenData)
      error = insertError
    }

    if (error) {
      console.error('[OAuth Handler] Error storing OAuth tokens:', error)
      return { success: false, error: error.message }
    }

    console.log('[OAuth Handler] Successfully stored OAuth tokens')

    // Auto-register Gmail using the same Google token so users don't need a
    // separate connect step.  The login page always requests gmail.readonly,
    // so provider_token already carries that scope.
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${provider_token}` },
      })

      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json()
        const gmailEmail = userInfo.email || session.user.email || null

        const { data: existingGmail } = await supabase
          .from('user_oauth_tokens')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('provider', 'gmail')
          .limit(1)

        const gmailData = {
          user_id: session.user.id,
          provider: 'gmail',
          access_token: provider_token,
          refresh_token: provider_refresh_token || null,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          gmail_email: gmailEmail,
          provider_scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
          updated_at: new Date().toISOString(),
        }

        if (existingGmail && existingGmail.length > 0) {
          await supabase
            .from('user_oauth_tokens')
            .update(gmailData)
            .eq('id', existingGmail[0].id)
        } else {
          await supabase
            .from('user_oauth_tokens')
            .insert(gmailData)
        }

        console.log('[OAuth Handler] Auto-registered Gmail for:', gmailEmail)
      }
    } catch (gmailErr) {
      console.error('[OAuth Handler] Gmail auto-registration failed (non-fatal):', gmailErr)
    }

    return { success: true }
  } catch (error) {
    console.error('[OAuth Handler] Unexpected error storing OAuth tokens:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Check if the current user has valid Google OAuth tokens with calendar scopes
 */
export async function hasValidGoogleCalendarToken(): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return false
    }

    const { data: tokens } = await supabase
      .from('user_oauth_tokens')
      .select('access_token, expires_at, provider_scopes')
      .eq('user_id', session.user.id)
      .eq('provider', 'google')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!tokens?.access_token) {
      return false
    }

    // Check if token is expired
    const expiresAt = new Date(tokens.expires_at)
    if (expiresAt < new Date()) {
      console.log('[OAuth Handler] Token is expired')
      return false
    }

    return true
  } catch (error) {
    console.error('[OAuth Handler] Error checking token:', error)
    return false
  }
}
