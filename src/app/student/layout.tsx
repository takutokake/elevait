'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface UserData {
  user: any
  profile: any
  student: any
  mentor: any
  bookings: any[]
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/me')
        
        if (response.ok) {
          const data = await response.json()
          
          if (!data.user) {
            setError('login')
            return
          }
          
          if (data.profile?.role === 'mentor') {
            setError('mentor')
            return
          }
          
          setUserData(data)
        } else {
          setError('error')
        }
      } catch (err) {
        console.error('Error checking user status:', err)
        setError('error')
      } finally {
        setLoading(false)
      }
    }

    checkUserStatus()
  }, [])

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
              Please log in to view your student dashboard.
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

  if (error === 'mentor') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#333333] dark:text-white mb-4">
              Wrong Dashboard
            </h1>
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              You are a coach. Use the Mentor Dashboard instead.
            </p>
            <Link
              href="/mentor/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 px-6 transition-colors"
            >
              Go to Mentor Dashboard
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
              Unable to load student dashboard. Please try again later.
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

  const navItems = [
    { href: '/student/dashboard', label: 'Dashboard' },
    { href: '/student/sessions', label: 'Sessions' },
    { href: '/student/saved', label: 'Saved' },
    { href: '/student/settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#101c22]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.2),rgba(16,28,34,0))]"></div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="p-6">
            <h1 className="text-xl font-black tracking-tight text-[#333333] dark:text-white mb-8">
              Student Dashboard
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
