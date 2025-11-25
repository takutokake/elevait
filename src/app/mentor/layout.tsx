'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import Header from '@/components/Header-simple'

interface MentorData {
  user: any
  profile: any
  mentor: any
  availabilitySlots: any[]
  bookings: any[]
}

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mentorData, setMentorData] = useState<MentorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    const checkMentorStatus = async () => {
      // Skip auth check for /mentor/apply route
      if (pathname === '/mentor/apply') {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/mentor/me')
        
        if (response.status === 401) {
          setError('login')
          return
        }
        
        if (response.status === 403) {
          const data = await response.json()
          setErrorDetails(data)
          // Set specific error based on API response
          if (data.error === 'not_applied') {
            setError('not_applied')
          } else if (data.error === 'pending') {
            setError('pending')
          } else if (data.error === 'rejected') {
            setError('rejected')
          } else {
            setError('not_mentor')
          }
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          setMentorData(data)
        } else {
          setError('error')
        }
      } catch (err) {
        console.error('Error checking mentor status:', err)
        setError('error')
      } finally {
        setLoading(false)
      }
    }

    checkMentorStatus()
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9] mx-auto mb-4"></div>
          <p className="text-[#333333] dark:text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (error === 'login') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#333333] dark:text-white mb-4">
              Access Restricted
            </h1>
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              Please log in as an approved coach to access the Mentor Dashboard.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 px-6 transition-colors"
            >
              Go to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error === 'not_applied') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#333333] dark:text-white mb-4">
              Apply to Become a Coach
            </h1>
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              {errorDetails?.message || 'You have not applied to become a coach yet.'}
            </p>
            <Link
              href="/mentor/apply"
              className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 px-6 transition-colors"
            >
              Apply Now
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error === 'pending') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#333333] dark:text-white mb-4">
              Application Pending
            </h1>
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              {errorDetails?.message || 'Your coach application is pending review. We\'ll contact you soon.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 px-6 transition-colors"
            >
              Go to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error === 'rejected') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#333333] dark:text-white mb-4">
              Application Not Approved
            </h1>
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              {errorDetails?.message || 'Your coach application was not approved. Please contact support for more information.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[#333333] dark:text-white font-semibold h-11 px-6 transition-colors"
              >
                Go to Home
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 px-6 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error === 'not_mentor') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#333333] dark:text-white mb-4">
              Mentor Access Required
            </h1>
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              {errorDetails?.message || 'You do not have mentor access.'}
            </p>
            <Link
              href="/mentor/apply"
              className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 px-6 transition-colors"
            >
              Apply to Become a Coach
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error === 'error') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#333333] dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              Unable to load mentor dashboard. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 px-6 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If on /mentor/apply, render without sidebar
  if (pathname === '/mentor/apply') {
    return <>{children}</>
  }

  const navItems = [
    { href: '/mentor/dashboard', label: 'Dashboard' },
    { href: '/mentor/sessions', label: 'Sessions' },
    { href: '/mentor/earnings', label: 'Earnings' },
    { href: '/mentor/availability', label: 'Availability' },
    { href: '/mentor/settings', label: 'Profile Settings' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#101c22]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.2),rgba(16,28,34,0))]"></div>
      
      {/* Header */}
      <Header variant="dashboard" />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="p-6">
            <h1 className="text-xl font-black tracking-tight text-[#333333] dark:text-white mb-8">
              Mentor Dashboard
            </h1>
            
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#0ea5e9] text-white shadow-sm'
                        : 'text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#333333] dark:hover:text-[#F5F5F5]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
