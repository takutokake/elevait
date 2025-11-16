'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

interface MentorData {
  user: any
  profile: any
  mentor: any
  availabilitySlots: any[]
  bookings: any[]
}

export default function MentorDashboard() {
  const [mentorData, setMentorData] = useState<MentorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMentorData = async () => {
      try {
        const response = await fetch('/api/mentor/me')
        if (response.ok) {
          const data = await response.json()
          setMentorData(data)
        }
      } catch (error) {
        console.error('Error fetching mentor data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMentorData()
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

  if (!mentorData) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Unable to load mentor data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, mentor, bookings } = mentorData
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.session_time || booking.start_time) > new Date()
  )
  const totalEarnings = bookings
    .filter(booking => booking.status === 'confirmed')
    .reduce((sum, booking) => sum + (mentor.price_cents || 0), 0) / 100

  return (
    <div className="p-8 space-y-8">
      {/* Header Card */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[#0ea5e9] flex items-center justify-center text-white text-2xl font-bold">
                  {profile.full_name?.charAt(0) || 'M'}
                </div>
              )}
            </Avatar>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white">
                Welcome back, {profile.full_name}
              </h1>
              <div className="space-y-1 mt-2">
                <p className="text-lg text-[#333333] dark:text-white font-semibold">
                  {mentor.current_title} at {mentor.current_company}
                </p>
                <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                  {mentor.alumni_school}
                </p>
              </div>
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
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#8b5cf6]">
              {bookings.length}
            </div>
            <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Estimated Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#f97316]">
              ${totalEarnings.toFixed(0)}
            </div>
            <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">
              Confirmed sessions
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
              href="/mentor/availability"
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-[#333333] dark:text-white mb-1">
                Manage Availability
              </h3>
              <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Add or update your available time slots
              </p>
            </a>
            <a
              href="/mentor/sessions"
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-[#333333] dark:text-white mb-1">
                View Sessions
              </h3>
              <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Check your upcoming and past sessions
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
