import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function getSupabaseServerClient() {
  return createRouteHandlerClient({ cookies })
}

export async function getSessionUser() {
  const supabase = getSupabaseServerClient()
  
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
