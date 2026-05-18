import { getSupabaseAdminClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const error = searchParams.get('error')

  const baseUrl = new URL(request.url).origin

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/student/dashboard?tab=settings&gmail_error=${error || 'no_code'}`)
  }

  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(stateParam || '', 'base64').toString())
    userId = decoded.userId
  } catch {
    return NextResponse.redirect(`${baseUrl}/student/dashboard?tab=settings&gmail_error=invalid_state`)
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${baseUrl}/api/gmail/callback`

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('[Gmail callback] Token exchange failed:', tokens)
      return NextResponse.redirect(`${baseUrl}/student/dashboard?tab=settings&gmail_error=token_exchange`)
    }

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const userInfo = await userInfoRes.json()

    const supabase = getSupabaseAdminClient()

    await supabase.from('user_oauth_tokens').delete().eq('user_id', userId).eq('provider', 'gmail')

    const { error: storeErr } = await supabase.from('user_oauth_tokens').insert({
      user_id: userId,
      provider: 'gmail',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      gmail_email: userInfo.email || null,
      provider_scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      updated_at: new Date().toISOString(),
    })

    if (storeErr) {
      console.error('[Gmail callback] Store error:', storeErr)
      const detail = encodeURIComponent(storeErr.message || storeErr.code || 'unknown')
      return NextResponse.redirect(`${baseUrl}/student/dashboard?tab=settings&gmail_error=store_failed&detail=${detail}`)
    }

    return NextResponse.redirect(`${baseUrl}/student/dashboard?tab=settings&gmail_connected=1`)
  } catch (err) {
    console.error('[Gmail callback] Error:', err)
    return NextResponse.redirect(`${baseUrl}/student/dashboard?tab=settings&gmail_error=server_error`)
  }
}
