'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { WeeklyAvailabilityGrid } from '@/components/coach-dashboard/WeeklyAvailabilityGrid'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getUserTimezone } from '@/lib/dateUtils'

interface TimeSlot {
  day: number
  hour: number
  minute?: number
}

export default function MentorAvailability() {
  const [loading, setLoading] = useState(true)
  const [weeklyAvailability, setWeeklyAvailability] = useState<TimeSlot[]>([])
  const [savedTimezone, setSavedTimezone] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchWeeklyAvailability()
  }, [])

  const fetchWeeklyAvailability = useCallback(async () => {
    try {
      const response = await fetch('/api/availability/weekly')
      if (response.ok) {
        const data = await response.json()
        setWeeklyAvailability(data.slots || [])
        // Get saved timezone from the API response
        if (data.timezone) {
          setSavedTimezone(data.timezone)
        }
      }
    } catch (error) {
      console.error('Error fetching weekly availability:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#333333] dark:text-white mb-1">
          Weekly Availability
        </h1>
        <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70">
          Set your recurring weekly schedule with 30-minute time slots
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <WeeklyAvailabilityGrid
            initialAvailability={weeklyAvailability}
            initialTimezone={savedTimezone}
            onSave={async (availability, timezone) => {
              try {
                const response = await fetch('/api/availability/weekly', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    slots: availability,
                    timezone: timezone
                  })
                })
                if (response.ok) {
                  setWeeklyAvailability(availability)
                  setSavedTimezone(timezone)
                  toast.success('Weekly availability saved!')
                } else {
                  const error = await response.json()
                  toast.error(error.message || 'Failed to save weekly availability')
                }
              } catch (error) {
                toast.error('Failed to save weekly availability')
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
