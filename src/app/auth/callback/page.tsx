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
          hasMentor: !!data.mentor
        })
        const { profile, user: apiUser } = data

        if (!profile) {
          console.error('[Callback] No profile found in response:', data)
          
          // If profile doesn't exist but user does, try to create it
          if (apiUser) {
            console.log('[Callback] User exists but no profile - attempting to create profile')
            
            // Get desired_role from user metadata
            const desiredRole = user?.user_metadata?.desired_role || 'student'
            console.log('[Callback] Creating profile with desired_role:', desiredRole)
            
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

        // Routing logic based on onboarding status
        console.log('[Callback] Routing decision:', {
          onboarding_complete: profile.onboarding_complete,
          desired_role: profile.desired_role,
          role: profile.role
        })
        
        if (!profile.onboarding_complete) {
          if (profile.desired_role === 'mentor') {
            console.log('[Callback] Redirecting to /onboarding/mentor')
            router.replace('/onboarding/mentor')
          } else {
            console.log('[Callback] Redirecting to /onboarding/student')
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
