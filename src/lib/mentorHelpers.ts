import 'server-only'
import { getSupabaseServerClient } from './supabaseServer'
import type { MentorProfile, MentorData, MentorWithDetails } from '@/types/mentor'

// Re-export types for backward compatibility
export type { MentorProfile, MentorData, MentorWithDetails }

/**
 * Fetch all active mentors from Supabase
 * Joins profiles with mentors table to get complete mentor information
 */
export async function getAllMentors(): Promise<MentorWithDetails[]> {
  const supabase = await getSupabaseServerClient()
  
  try {
    // Fetch all profiles where role is 'mentor'
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'mentor')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('[mentorHelpers] Error fetching mentor profiles:', profilesError)
      return []
    }

    if (!profiles || profiles.length === 0) {
      return []
    }

    // Fetch corresponding mentor data for each profile with ALL new fields
    const mentorIds = profiles.map(p => p.id)
    const { data: mentors, error: mentorsError } = await supabase
      .from('mentors')
      .select(`
        id,
        current_title,
        current_company,
        years_experience,
        linkedin_url,
        focus_areas,
        price_cents,
        alumni_school,
        short_description,
        about_me,
        job_type_tags,
        specialties,
        successful_companies,
        companies_got_offers,
        companies_interviewed,
        is_active,
        created_at
      `)
      .in('id', mentorIds)
      .eq('is_active', true)

    if (mentorsError) {
      console.error('[mentorHelpers] Error fetching mentors data:', mentorsError)
    }

    // Combine profile and mentor data
    const mentorsMap = new Map(mentors?.map(m => [m.id, m]) || [])
    
    const combinedData: MentorWithDetails[] = profiles.map(profile => ({
      ...profile,
      mentor_data: mentorsMap.get(profile.id) || undefined
    }))

    return combinedData
  } catch (error) {
    console.error('[mentorHelpers] Unexpected error fetching mentors:', error)
    return []
  }
}

/**
 * Fetch a single mentor by ID
 * Returns complete profile and mentor information
 */
export async function getMentorById(mentorId: string): Promise<MentorWithDetails | null> {
  const supabase = await getSupabaseServerClient()
  
  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', mentorId)
      .eq('role', 'mentor')
      .single()

    if (profileError || !profile) {
      console.error('[mentorHelpers] Error fetching mentor profile:', profileError)
      return null
    }

    // Fetch mentor data with ALL new fields
    const { data: mentor, error: mentorError } = await supabase
      .from('mentors')
      .select(`
        id,
        current_title,
        current_company,
        years_experience,
        linkedin_url,
        focus_areas,
        price_cents,
        alumni_school,
        short_description,
        about_me,
        job_type_tags,
        specialties,
        successful_companies,
        companies_got_offers,
        companies_interviewed,
        is_active,
        created_at
      `)
      .eq('id', mentorId)
      .single()

    if (mentorError && mentorError.code !== 'PGRST116') {
      console.error('[mentorHelpers] Error fetching mentor data:', mentorError)
    }

    return {
      ...profile,
      mentor_data: mentor || undefined
    }
  } catch (error) {
    console.error('[mentorHelpers] Unexpected error fetching mentor:', error)
    return null
  }
}

// Re-export utility functions for backward compatibility
export { getMentorInitials, formatHourlyRate } from './mentorUtils'
