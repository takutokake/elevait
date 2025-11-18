import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('[API /profile/create] Starting profile creation...')
    
    // Check if user is authenticated
    const { user } = await getSessionUser()
    if (!user) {
      console.log('[API /profile/create] No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API /profile/create] User ID:', user.id)

    // Parse request body
    const body = await request.json()
    const { full_name, desired_role } = body

    console.log('[API /profile/create] Creating profile with:', { full_name, desired_role })

    const supabase = getSupabaseServerClient()

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      console.log('[API /profile/create] Profile already exists')
      return NextResponse.json({ success: true, message: 'Profile already exists' })
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: full_name || user.user_metadata?.full_name || '',
        desired_role: desired_role || 'student',
        role: null,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[API /profile/create] Error creating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      )
    }

    console.log('[API /profile/create] Profile created successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /profile/create] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
