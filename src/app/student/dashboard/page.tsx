'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

interface UserData {
  user: any
  profile: any
  student: any
  mentor: any
  bookings: any[]
}

export default function StudentDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Unable to load dashboard data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, bookings } = userData
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.session_time || booking.start_time) > new Date()
  )

  return (
    <div className="p-8 space-y-8">
      {/* Greeting Card */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-6">
            <Avatar className="h-16 w-16">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[#0ea5e9] flex items-center justify-center text-white text-xl font-bold">
                  {profile.full_name?.charAt(0) || 'S'}
                </div>
              )}
            </Avatar>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white">
                Welcome back, {profile.full_name}
              </h1>
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mt-1">
                Ready to accelerate your product management journey?
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#0ea5e9]">
              {upcomingBookings.length}
            </div>
            <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">
              Next 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Saved Mentors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#8b5cf6]">
              0
            </div>
            <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Saved Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#f97316]">
              0
            </div>
            <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-black text-[#333333] dark:text-white">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/mentors"
              className="block p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-[#333333] dark:text-white mb-2">
                Find Mentors
              </h3>
              <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Connect with experienced product managers and accelerate your career growth
              </p>
              <div className="mt-3 text-[#0ea5e9] font-medium text-sm">
                Browse mentors →
              </div>
            </a>
            
            <a
              href="/jobs"
              className="block p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-[#333333] dark:text-white mb-2">
                Browse Jobs
              </h3>
              <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Discover exclusive product management opportunities from top companies
              </p>
              <div className="mt-3 text-[#0ea5e9] font-medium text-sm">
                View opportunities →
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {upcomingBookings.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-black text-[#333333] dark:text-white">
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.slice(0, 3).map((booking, index) => {
                const sessionDate = new Date(booking.session_time || booking.start_time)
                return (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-[#333333] dark:text-white">
                        Session with {booking.mentor_name || 'Mentor'}
                      </p>
                      <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                        {sessionDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-sm text-[#0ea5e9] font-medium">
                      {booking.status || 'Confirmed'}
                    </div>
                  </div>
                )
              })}
              {upcomingBookings.length > 3 && (
                <div className="text-center pt-4">
                  <a href="/student/sessions" className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium">
                    View all sessions →
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
