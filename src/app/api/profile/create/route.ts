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

    const supabase = await getSupabaseServerClient()

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

    // Create profile with email from user object
    // Initialize with empty roles array - user will add roles during onboarding
    // Set role to desired_role but rely on onboarding_complete flag for access control
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: full_name || user.user_metadata?.full_name || '',
      desired_role: desired_role || 'student',
      role: desired_role || 'student', // Set to desired role - access controlled by onboarding_complete
      roles: [], // New multi-role support - will be populated during onboarding
      onboarding_complete: false // This is the key - prevents dashboard access until onboarding done
    }
    
    console.log('[API /profile/create] Inserting profile data:', profileData)
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      console.error('[API /profile/create] Error creating profile:', profileError)
      console.error('[API /profile/create] Error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message, code: profileError.code },
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
