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
        const supabase = getSupabaseBrowserClient()
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('No user found:', userError)
          // Short delay before redirecting to login
          setTimeout(() => {
            router.replace('/login')
          }, 1000)
          return
        }

        // Call /api/me to get user profile data
        const response = await fetch('/api/me')
        
        if (!response.ok) {
          console.error('Failed to fetch user data')
          setTimeout(() => {
            router.replace('/login')
          }, 1000)
          return
        }

        const data = await response.json()
        const { profile } = data

        if (!profile) {
          console.error('No profile found')
          setTimeout(() => {
            router.replace('/login')
          }, 1000)
          return
        }

        // Routing logic based on onboarding status
        if (!profile.onboarding_complete) {
          if (profile.desired_role === 'mentor') {
            router.replace('/onboarding/mentor')
          } else {
            router.replace('/onboarding/student')
          }
        } else {
          // Onboarding complete - route to appropriate dashboard
          if (profile.role === 'mentor') {
            router.replace('/coach/dashboard')
          } else {
            router.replace('/student/dashboard')
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setTimeout(() => {
          router.replace('/login')
        }, 1000)
      } finally {
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
