'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserData {
  user: any
  profile: any
  student: any
  mentor: any
  bookings: any[]
}

export default function StudentSessions() {
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
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
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
              Unable to load session data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { bookings } = userData
  const now = new Date()
  
  // Filter bookings where current user is the student
  const studentBookings = bookings.filter(booking => booking.student_id === userData.user.id)
  
  const upcomingBookings = studentBookings.filter(booking => 
    new Date(booking.session_time || booking.start_time) > now
  ).sort((a, b) => 
    new Date(a.session_time || a.start_time).getTime() - new Date(b.session_time || b.start_time).getTime()
  )
  
  const pastBookings = studentBookings.filter(booking => 
    new Date(booking.session_time || booking.start_time) <= now
  ).sort((a, b) => 
    new Date(b.session_time || b.start_time).getTime() - new Date(a.session_time || a.start_time).getTime()
  )

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const SessionCard = ({ booking, isPast = false }: { booking: any, isPast?: boolean }) => {
    const { date, time } = formatDateTime(booking.session_time || booking.start_time)
    
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-semibold text-[#333333] dark:text-white">
                    {date} at {time}
                  </p>
                  <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    Coach: {booking.mentor_name || 'Coach Name'}
                  </p>
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status || 'pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          My Sessions
        </h1>
        <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
          View your upcoming and past coaching sessions
        </p>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-xl font-bold text-[#333333] dark:text-white mb-4">
          Upcoming Sessions ({upcomingBookings.length})
        </h2>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking, index) => (
              <SessionCard key={index} booking={booking} />
            ))}
          </div>
        ) : (
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
            <CardContent className="p-8 text-center">
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-4">
                No upcoming sessions scheduled.
              </p>
              <a 
                href="/mentors" 
                className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium"
              >
                Find a mentor to book your first session →
              </a>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="text-xl font-bold text-[#333333] dark:text-white mb-4">
          Past Sessions ({pastBookings.length})
        </h2>
        {pastBookings.length > 0 ? (
          <div className="space-y-4">
            {pastBookings.slice(0, 10).map((booking, index) => (
              <SessionCard key={index} booking={booking} isPast={true} />
            ))}
            {pastBookings.length > 10 && (
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                <CardContent className="p-4 text-center">
                  <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    Showing 10 most recent sessions. {pastBookings.length - 10} more sessions in history.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
            <CardContent className="p-8 text-center">
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                No past sessions yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
