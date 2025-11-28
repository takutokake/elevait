import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
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
