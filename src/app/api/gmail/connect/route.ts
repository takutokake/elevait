import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteHandlerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/gmail/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES.join(' '))
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'select_account')
  url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString())
}
