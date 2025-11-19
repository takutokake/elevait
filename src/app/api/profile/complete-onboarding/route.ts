import { NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST() {
  try {
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseServerClient()

    // Update profile to mark onboarding as complete
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error completing onboarding:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
