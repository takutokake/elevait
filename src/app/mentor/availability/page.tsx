'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getUserTimezone } from '@/lib/dateUtils'

interface AvailabilitySlot {
  id: string
  mentor_id: string
  start_time: string
  end_time: string
  status: 'open' | 'booked' | 'blocked'
  timezone: string
  created_at: string
  updated_at: string
}

export default function MentorAvailability() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState({ total: 0, open: 0, booked: 0 })

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = useCallback(async () => {
    try {
      // Get current user first
      const userResponse = await fetch('/api/me')
      if (!userResponse.ok) {
        toast.error('Failed to authenticate')
        return
      }
      const userData = await userResponse.json()

      if (!userData.user) {
        toast.error('Please log in to view availability')
        return
      }

      // Fetch availability for next 60 days
      const now = new Date()
      const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

      const response = await fetch(
        `/api/availability?mentorId=${userData.user.id}&from=${now.toISOString()}&to=${futureDate.toISOString()}&status=all`
      )

      if (response.ok) {
        const data = await response.json()
        setSlots(data.slots || [])

        // Calculate stats
        const total = data.slots?.length || 0
        const open = data.slots?.filter((s: AvailabilitySlot) => s.status === 'open').length || 0
        const booked = data.slots?.filter((s: AvailabilitySlot) => s.status === 'booked').length || 0
        setStats({ total, open, booked })
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch availability:', errorData)
        
        if (errorData.code === 'TABLE_NOT_FOUND') {
          toast.error('⚠️ Database not set up. Please run the migration first. See MIGRATION_INSTRUCTIONS.md', {
            autoClose: 10000
          })
        } else {
          toast.error(errorData.error || 'Failed to fetch availability')
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('An error occurred while fetching availability')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreateSlot = useCallback(async (start: Date, end: Date) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: [{
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          }],
          timezone: getUserTimezone(),
        }),
      })

      if (response.ok) {
        await fetchAvailability()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create slot')
      }
    } catch (error: any) {
      throw error
    } finally {
      setSubmitting(false)
    }
  }, [fetchAvailability])

  const handleDeleteSlot = useCallback(async (slotId: string) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/availability?slotId=${slotId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAvailability()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete slot')
      }
    } catch (error: any) {
      throw error
    } finally {
      setSubmitting(false)
    }
  }, [fetchAvailability])


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


  return (
    <div className="p-8 space-y-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          Availability Management
        </h1>
        <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
          Manage your coaching availability with 30-minute time slots
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#333333] dark:text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Booked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.booked}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <AvailabilityCalendar
        slots={slots}
        onCreateSlot={handleCreateSlot}
        onDeleteSlot={handleDeleteSlot}
        isLoading={submitting}
      />
    </div>
  )
}
