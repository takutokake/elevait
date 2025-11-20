'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[Callback] Starting auth callback...')
        const supabase = getSupabaseBrowserClient()
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('[Callback] User from Supabase:', user ? `User ID: ${user.id}` : 'No user', userError)
        
        if (userError || !user) {
          console.error('[Callback] No user found:', userError)
          // Short delay before redirecting to login
          setTimeout(() => {
            router.replace('/login')
          }, 1000)
          return
        }

        // Call /api/me to get user profile data
        console.log('[Callback] Fetching /api/me...')
        const response = await fetch('/api/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        console.log('[Callback] /api/me response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('[Callback] Failed to fetch user data:', response.status, errorText)
          setTimeout(() => {
            router.replace('/login')
          }, 1000)
          return
        }

        const data = await response.json()
        console.log('[Callback] /api/me data:', {
          hasUser: !!data.user,
          hasProfile: !!data.profile,
          profile: data.profile,
          hasStudent: !!data.student,
          hasMentor: !!data.mentor,
          mentorStatus: data.mentor?.is_active
        })
        const { profile, user: apiUser, mentor } = data

        if (!profile) {
          console.error('[Callback] No profile found in response:', data)
          
          // If profile doesn't exist but user does, try to create it
          if (apiUser) {
            console.log('[Callback] User exists but no profile - attempting to create profile')
            
            // Get desired_role from localStorage (for OAuth) or user metadata
            const storedRole = localStorage.getItem('signup_role_choice')
            const desiredRole = storedRole || user?.user_metadata?.desired_role || 'student'
            console.log('[Callback] Creating profile with desired_role:', desiredRole, 'from:', storedRole ? 'localStorage' : 'user_metadata')
            
            // Create profile via API
            const createProfileResponse = await fetch('/api/profile/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                full_name: user?.user_metadata?.full_name || '',
                desired_role: desiredRole
              })
            })
            
            if (createProfileResponse.ok) {
              console.log('[Callback] Profile created, retrying /api/me')
              // Clear localStorage after using it
              localStorage.removeItem('signup_role_choice')
              // Retry the callback after a short delay
              setTimeout(() => {
                window.location.reload()
              }, 500)
              return
            } else {
              console.error('[Callback] Failed to create profile')
            }
          }
          
          setTimeout(() => {
            router.replace('/login')
          }, 1000)
          return
        }

        // Auto-complete onboarding for approved mentors
        const needsAutoComplete = !profile.onboarding_complete &&
                                  mentor?.is_active === true &&
                                  profile.role === 'mentor'
        
        if (needsAutoComplete) {
          console.log('[Callback] Auto-completing onboarding for approved mentor')
          try {
            const completeResponse = await fetch('/api/profile/complete-onboarding', {
              method: 'POST',
              credentials: 'include'
            })
            
            if (completeResponse.ok) {
              console.log('[Callback] Onboarding auto-completed successfully')
              // Update local profile object
              profile.onboarding_complete = true
            } else {
              console.error('[Callback] Failed to auto-complete onboarding')
            }
          } catch (err) {
            console.error('[Callback] Error auto-completing onboarding:', err)
          }
        }

        // Routing logic based on onboarding status
        // Check localStorage for fresh signup role choice (overrides profile.desired_role)
        const storedRole = localStorage.getItem('signup_role_choice')
        const effectiveRole = storedRole || profile.desired_role
        
        // If localStorage has a different role than profile, update the profile
        if (storedRole && storedRole !== profile.desired_role && !profile.onboarding_complete) {
          console.log('[Callback] Updating profile.desired_role from', profile.desired_role, 'to', storedRole)
          try {
            const updateResponse = await fetch('/api/profile/update-role', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ desired_role: storedRole }),
              credentials: 'include'
            })
            if (updateResponse.ok) {
              console.log('[Callback] Profile desired_role updated successfully')
              profile.desired_role = storedRole
            }
          } catch (err) {
            console.error('[Callback] Failed to update profile desired_role:', err)
          }
        }
        
        console.log('[Callback] Routing decision:', {
          onboarding_complete: profile.onboarding_complete,
          desired_role: profile.desired_role,
          role: profile.role,
          storedRole,
          effectiveRole,
          needsAutoComplete
        })
        
        if (!profile.onboarding_complete) {
          if (effectiveRole === 'mentor') {
            console.log('[Callback] Redirecting to /mentor/apply for coach signup')
            // Clear localStorage after using it
            localStorage.removeItem('signup_role_choice')
            router.replace('/mentor/apply')
          } else {
            console.log('[Callback] Redirecting to /onboarding/student')
            // Clear localStorage after using it
            localStorage.removeItem('signup_role_choice')
            router.replace('/onboarding/student')
          }
        } else {
          // Onboarding complete - route to appropriate dashboard
          if (profile.role === 'mentor') {
            console.log('[Callback] Redirecting to /mentor/dashboard')
            router.replace('/mentor/dashboard')
          } else {
            console.log('[Callback] Redirecting to /student/dashboard')
            router.replace('/student/dashboard')
          }
        }
      } catch (error) {
        console.error('[Callback] Auth callback error:', error)
        setTimeout(() => {
          router.replace('/login')
        }, 1000)
      } finally {
        console.log('[Callback] Callback complete, setting loading to false')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.2),rgba(16,28,34,0))]"></div>
      
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0ea5e9] mx-auto mb-6"></div>
        <h1 className="text-xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          Signing you in…
        </h1>
        <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  )
}
