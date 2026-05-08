import { getSupabaseRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await getSupabaseRouteHandlerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_oauth_tokens')
    .select('gmail_email, expires_at, access_token')
    .eq('user_id', user.id)
    .eq('provider', 'gmail')
    .single()

  if (error || !data) {
    return NextResponse.json({ connected: false })
  }

  const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false

  return NextResponse.json({
    connected: !!data.access_token && !expired,
    gmailEmail: data.gmail_email || null,
    expired,
  })
}
