import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerComponentClient({ 
    cookies: () => cookieStore as any
  })
}

export async function getSupabaseRouteHandlerClient() {
  const cookieStore = await cookies()
  return createRouteHandlerClient({ 
    cookies: () => cookieStore as any
  })
}

export async function getSessionUser() {
  const supabase = await getSupabaseServerClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { user: null }
    }
    
    return { user }
  } catch (error) {
    return { user: null }
  }
}
