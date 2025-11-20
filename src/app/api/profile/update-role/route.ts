import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('[API /profile/update-role] Starting role update...')
    
    // Check if user is authenticated
    const { user } = await getSessionUser()
    if (!user) {
      console.log('[API /profile/update-role] No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API /profile/update-role] User ID:', user.id)

    // Parse request body
    const body = await request.json()
    const { desired_role } = body

    if (!desired_role || !['student', 'mentor'].includes(desired_role)) {
      return NextResponse.json(
        { error: 'Invalid desired_role. Must be "student" or "mentor"' },
        { status: 400 }
      )
    }

    console.log('[API /profile/update-role] Updating desired_role to:', desired_role)

    const supabase = getSupabaseServerClient()

    // Update profile's desired_role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        desired_role: desired_role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[API /profile/update-role] Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('[API /profile/update-role] Profile updated successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /profile/update-role] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
