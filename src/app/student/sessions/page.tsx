'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Booking {
  id: string
  availability_slot_id: string
  mentor_id: string
  learner_id: string
  booking_start_time: string
  booking_end_time: string
  status: string
  learner_email: string
  learner_phone?: string
  session_notes?: string
  cancellation_reason?: string
  cancelled_at?: string
  cancelled_by?: string
  created_at: string
  updated_at: string
}

interface UserData {
  user: any
  profile: any
}

export default function StudentSessions() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserData(userData)

          // Fetch bookings as learner
          const bookingsResponse = await fetch('/api/bookings?role=learner')
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json()
            setBookings(bookingsData.bookings || [])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const now = new Date()
  
  const pendingBookings = bookings.filter(booking => 
    booking.status === 'pending'
  ).sort((a, b) => 
    new Date(a.booking_start_time).getTime() - new Date(b.booking_start_time).getTime()
  )
  
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.booking_start_time) > now &&
    booking.status === 'confirmed'
  ).sort((a, b) => 
    new Date(a.booking_start_time).getTime() - new Date(b.booking_start_time).getTime()
  )
  
  const cancelledBookings = bookings.filter(booking => 
    booking.status === 'cancelled'
  ).sort((a, b) => 
    new Date(b.booking_start_time).getTime() - new Date(a.booking_start_time).getTime()
  )
  
  const pastBookings = bookings.filter(booking => 
    new Date(booking.booking_start_time) <= now &&
    booking.status !== 'cancelled' &&
    booking.status !== 'pending'
  ).sort((a, b) => 
    new Date(b.booking_start_time).getTime() - new Date(a.booking_start_time).getTime()
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
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Mentor Approval'
      case 'confirmed': return 'Confirmed'
      case 'cancelled': return 'Cancelled'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  const SessionCard = ({ booking, isPast = false }: { booking: Booking, isPast?: boolean }) => {
    const { date, time } = formatDateTime(booking.booking_start_time)
    const startTime = new Date(booking.booking_start_time)
    const endTime = new Date(booking.booking_end_time)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    const isCancelled = booking.status === 'cancelled'
    
    return (
      <Card className={`border ${isCancelled ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="font-semibold text-[#333333] dark:text-white">
                    {date} at {time}
                  </p>
                  <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    Duration: {durationMinutes} minutes
                  </p>
                  {booking.session_notes && (
                    <p className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">
                      Notes: {booking.session_notes}
                    </p>
                  )}
                  {isCancelled && booking.cancellation_reason && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 p-2 bg-white dark:bg-gray-800 rounded">
                      <span className="font-medium">Cancellation Reason:</span> {booking.cancellation_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {getStatusLabel(booking.status)}
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

      {/* Pending Approval */}
      {pendingBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[#333333] dark:text-white mb-4">
            Pending Approval ({pendingBookings.length})
          </h2>
          <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70 mb-4">
            These bookings are awaiting mentor approval
          </p>
          <div className="space-y-4">
            {pendingBookings.map((booking, index) => (
              <SessionCard key={index} booking={booking} />
            ))}
          </div>
        </div>
      )}

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

      {/* Cancelled Sessions */}
      {cancelledBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[#333333] dark:text-white mb-4">
            Cancelled Sessions ({cancelledBookings.length})
          </h2>
          <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70 mb-4">
            These sessions were cancelled by you or your mentor
          </p>
          <div className="space-y-4">
            {cancelledBookings.map((booking, index) => (
              <SessionCard key={index} booking={booking} />
            ))}
          </div>
        </div>
      )}

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
