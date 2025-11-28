import { NextResponse } from 'next/server'
import { getAllMentors } from '@/lib/mentorHelpers'

/**
 * GET /api/coaches
 * Public endpoint to fetch all active coaches
 * This is a server-side API route that can safely use server-only functions
 */
export async function GET() {
  try {
    const mentors = await getAllMentors()
    
    return NextResponse.json({
      mentors,
      count: mentors.length
    })
  } catch (error) {
    console.error('API /coaches GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
