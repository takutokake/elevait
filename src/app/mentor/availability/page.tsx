'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MentorData {
  user: any
  profile: any
  mentor: any
  availabilitySlots: any[]
  bookings: any[]
}

export default function MentorAvailability() {
  const [mentorData, setMentorData] = useState<MentorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: ''
  })

  useEffect(() => {
    fetchMentorData()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: [{
            startTime: formData.startTime,
            endTime: formData.endTime
          }]
        })
      })

      if (response.ok) {
        setMessage('Availability slot added successfully!')
        setFormData({ startTime: '', endTime: '' })
        // Refetch data to update the list
        await fetchMentorData()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to add availability slot')
      }
    } catch (error) {
      console.error('Error adding availability slot:', error)
      setMessage('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
              Unable to load availability data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { availabilitySlots } = mentorData
  const sortedSlots = availabilitySlots.sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          Availability
        </h1>
        <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
          Manage your available time slots for coaching sessions
        </p>
      </div>

      {/* Add New Slot Form */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-black text-[#333333] dark:text-white">
            Add New Availability Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="startTime" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Start Date & Time
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="endTime" className="block text-sm font-medium text-[#333333] dark:text-white">
                  End Date & Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 rounded-lg transition-colors"
            >
              {submitting ? 'Adding Slot...' : 'Add Availability Slot'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Slots */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-black text-[#333333] dark:text-white">
            Your Availability Slots ({sortedSlots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSlots.length > 0 ? (
            <div className="space-y-4">
              {sortedSlots.map((slot, index) => {
                const startDateTime = formatDateTime(slot.start_time)
                const endDateTime = formatDateTime(slot.end_time)
                const isBooked = slot.is_booked

                return (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div>
                      <p className="font-semibold text-[#333333] dark:text-white">
                        {startDateTime.date} • {startDateTime.time} - {endDateTime.time}
                      </p>
                      <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                        Duration: {Math.round((new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / (1000 * 60))} minutes
                      </p>
                    </div>
                    <Badge 
                      className={isBooked 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }
                    >
                      {isBooked ? 'Booked' : 'Available'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-4">
                No availability slots added yet.
              </p>
              <p className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60">
                Add your first availability slot above to start accepting bookings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
