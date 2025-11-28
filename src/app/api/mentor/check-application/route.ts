import { NextResponse } from 'next/server'
import { getSessionUser, getSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET() {
  try {
    // Check if user is authenticated
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ hasPendingApplication: false })
    }

    const supabase = await getSupabaseServerClient()

    // Check if user has any pending or approved applications
    const { data: applications, error } = await supabase
      .from('mentor_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .limit(1)

    if (error) {
      console.error('Error checking mentor application:', error)
      return NextResponse.json({ hasPendingApplication: false })
    }

    // If there's any pending or approved application, return true
    const hasPendingApplication = applications && applications.length > 0

    return NextResponse.json({ 
      hasPendingApplication,
      status: applications?.[0]?.status || null
    })
  } catch (error) {
    console.error('Unexpected error checking application:', error)
    return NextResponse.json({ hasPendingApplication: false })
  }
}
