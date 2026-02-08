import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSessionUser } from '@/lib/supabaseServer'
import { checkRateLimit, standardRateLimiter } from '@/lib/rateLimit'
import { createRateLimitResponse, createSafeErrorResponse } from '@/lib/securityUtils'
import { z } from 'zod'

const saveMentorSchema = z.object({
  mentorId: z.string().uuid(),
  action: z.enum(['save', 'unsave'])
})

/**
 * POST /api/students/saved-mentors
 * Save or unsave a mentor for a student
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getSessionUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, standardRateLimiter, user.id)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset)
    }

    const body = await request.json()
    const { mentorId, action } = saveMentorSchema.parse(body)

    const supabase = await getSupabaseServerClient()

    // Get current student record
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('saved_mentors')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('[API] Error fetching student:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch student data' },
        { status: 500 }
      )
    }

    // Update saved mentors array
    let savedMentors = student?.saved_mentors || []
    
    if (action === 'save') {
      // Add mentor if not already saved
      if (!savedMentors.includes(mentorId)) {
        savedMentors = [...savedMentors, mentorId]
      }
    } else {
      // Remove mentor
      savedMentors = savedMentors.filter((id: string) => id !== mentorId)
    }

    // Update student record
    const { error: updateError } = await supabase
      .from('students')
      .update({ saved_mentors: savedMentors })
      .eq('id', user.id)

    if (updateError) {
      console.error('[API] Error updating saved mentors:', updateError)
      return NextResponse.json(
        { error: 'Failed to update saved mentors' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      savedMentors 
    })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to save mentor', 500)
  }
}

/**
 * GET /api/students/saved-mentors
 * Get list of saved mentors for current student
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getSessionUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await getSupabaseServerClient()

    const { data: student, error } = await supabase
      .from('students')
      .select('saved_mentors')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[API] Error fetching saved mentors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch saved mentors' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      savedMentors: student?.saved_mentors || [] 
    })
  } catch (error) {
    return createSafeErrorResponse(error, 'Failed to fetch saved mentors', 500)
  }
}
