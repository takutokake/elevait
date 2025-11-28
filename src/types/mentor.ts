/**
 * Shared type definitions for mentor/coach data
 * Can be imported in both client and server components
 */

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
  successful_companies: string[] | null
  companies_got_offers: string[] | null
  companies_interviewed: string[] | null
  is_active: boolean | null
  created_at: string
}

export interface MentorWithDetails extends MentorProfile {
  mentor_data?: MentorData
}
