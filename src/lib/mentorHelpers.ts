import { getSupabaseServerClient } from './supabaseServer'

export interface MentorProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  bio: string | null
  linkedin_url: string | null
  company: string | null
  job_title: string | null
  years_of_experience: number | null
  hourly_rate: number | null
  specialties: string[] | null
  focus_areas: string[] | null
  created_at: string
  updated_at: string
}

export interface MentorData {
  id: string
  current_title: string | null
  current_company: string | null
  years_experience: number | null
  linkedin_url: string | null
  focus_areas: string[] | null
  price_cents: number | null
  alumni_school: string | null
  short_description: string | null
  about_me: string | null
  job_type_tags: string[] | null
  specialties: string[] | null
  key_achievements: string[] | null
  successful_companies: string[] | null
  is_active: boolean | null
  created_at: string
}

export interface MentorWithDetails extends MentorProfile {
  mentor_data?: MentorData
}

/**
 * Fetch all active mentors from Supabase
 * Joins profiles with mentors table to get complete mentor information
 */
export async function getAllMentors(): Promise<MentorWithDetails[]> {
  const supabase = getSupabaseServerClient()
  
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
        key_achievements,
        successful_companies,
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
  const supabase = getSupabaseServerClient()
  
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
        key_achievements,
        successful_companies,
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

/**
 * Get mentor initials for avatar fallback
 */
export function getMentorInitials(fullName: string | null): string {
  if (!fullName) return '?'
  
  const names = fullName.trim().split(' ')
  if (names.length === 1) {
    return names[0][0]?.toUpperCase() || '?'
  }
  
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

/**
 * Format hourly rate for display from price_cents
 */
export function formatHourlyRate(priceCents: number | null | undefined): string {
  if (!priceCents) return 'Contact for pricing'
  return `$${(priceCents / 100).toFixed(0)}`
}
