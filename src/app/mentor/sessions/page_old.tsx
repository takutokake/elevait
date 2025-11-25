'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import PostSessionSurveyModal from '@/components/PostSessionSurveyModal'

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
  created_at: string
  updated_at: string
}

interface MentorData {
  user: any
  profile: any
  mentor: any
}

export default function MentorSessions() {
  const [mentorData, setMentorData] = useState<MentorData | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null)
  const [surveyBookingId, setSurveyBookingId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      // Fetch mentor data
      const mentorResponse = await fetch('/api/mentor/me')
      if (mentorResponse.ok) {
        const data = await mentorResponse.json()
        setMentorData(data)

        // Fetch bookings as mentor
        const bookingsResponse = await fetch('/api/bookings?role=mentor')
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

  useEffect(() => {
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

  if (!mentorData) {
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
    new Date(booking.booking_end_time) > now && 
    booking.status === 'confirmed'
  ).sort((a, b) => 
    new Date(a.booking_start_time).getTime() - new Date(b.booking_start_time).getTime()
  )
  
  const pastBookings = bookings.filter(booking => 
    (new Date(booking.booking_end_time) <= now && booking.status === 'confirmed') ||
    booking.status === 'completed' ||
    booking.status === 'cancelled'
  ).sort((a, b) => 
    new Date(b.booking_start_time).getTime() - new Date(a.booking_start_time).getTime()
  )

  const handleApproveBooking = async (bookingId: string) => {
    setProcessingBookingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Booking approved!')
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve booking')
      }
    } catch (error) {
      console.error('Error approving booking:', error)
      toast.error('Failed to approve booking')
    } finally {
      setProcessingBookingId(null)
    }
  }

  const handleDeclineBooking = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for declining (optional):')
    
    setProcessingBookingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || null })
      })

      if (response.ok) {
        toast.success('Booking declined')
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to decline booking')
      }
    } catch (error) {
      console.error('Error declining booking:', error)
      toast.error('Failed to decline booking')
    } finally {
      setProcessingBookingId(null)
    }
  }

  const handleOpenSurvey = (bookingId: string) => {
    setSurveyBookingId(bookingId)
  }

  const handleSurveySuccess = async () => {
    await fetchData()
  }

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

  const SessionCard = ({ booking, isPast = false }: { booking: Booking, isPast?: boolean }) => {
    const { date, time } = formatDateTime(booking.booking_start_time)
    const startTime = new Date(booking.booking_start_time)
    const endTime = new Date(booking.booking_end_time)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    const canComplete = isPast && endTime < now && booking.status !== 'completed' && booking.status !== 'cancelled'
    
    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
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
                  <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    Learner: {booking.learner_email}
                  </p>
                  {booking.session_notes && (
                    <p className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">
                      Notes: {booking.session_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
              {canComplete && (
                <button
                  onClick={() => handleCompleteSession(booking.id)}
                  disabled={completingBookingId === booking.id}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {completingBookingId === booking.id ? 'Completing...' : 'Mark Complete'}
                </button>
              )}
            </div>
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
          Manage your upcoming and past coaching sessions
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
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                No upcoming sessions scheduled.
              </p>
              <a 
                href="/mentor/availability" 
                className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium mt-2 inline-block"
              >
                Add availability slots →
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
