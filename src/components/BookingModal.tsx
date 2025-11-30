'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-toastify'
import {
  formatDateDisplay,
  formatTimeRange,
  getAvailableTimeSlots,
  getDurationInMinutes,
  getUserTimezone,
} from '@/lib/dateUtils'

interface SubSlot {
  start: Date
  end: Date
  isAvailable: boolean
}

interface AvailabilitySlot {
  id: string
  start_time: string
  end_time: string
  status: string
  timezone: string
  subSlots?: SubSlot[]
  availableSubSlots?: SubSlot[]
  bookedSubSlots?: SubSlot[]
}

interface BookingModalProps {
  coachId: string
  coachName: string
  hourlyRate?: string
  availabilitySlots: AvailabilitySlot[]
  onClose: () => void
  onBookingComplete: () => void
}

export default function BookingModal({
  coachId,
  coachName,
  hourlyRate,
  availabilitySlots,
  onClose,
  onBookingComplete,
}: BookingModalProps) {
  const [step, setStep] = useState<'date' | 'time' | 'duration' | 'details' | 'confirm'>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60) // minutes
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Get available dates (dates that have at least one open slot)
  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    availabilitySlots.forEach((slot) => {
      // Parse the UTC time and convert to the slot's timezone
      const slotTimezone = slot.timezone || getUserTimezone()
      const date = new Date(slot.start_time)
      
      // Get the date in the slot's timezone (coach's timezone)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: slotTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date)
      const year = parts.find(p => p.type === 'year')?.value
      const month = parts.find(p => p.type === 'month')?.value
      const day = parts.find(p => p.type === 'day')?.value
      
      if (year && month && day) {
        dates.add(`${year}-${month}-${day}`)
      }
    })
    return Array.from(dates).sort()
  }, [availabilitySlots])

  // Get available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return []
    
    // If slots have subSlots computed, use those
    if (availabilitySlots.length > 0 && availabilitySlots[0].availableSubSlots) {
      const allAvailableSlots: Array<{ start: Date; end: Date; label: string; slotId: string }> = []
      
      availabilitySlots.forEach(slot => {
        const slotDate = new Date(slot.start_time)
        const slotTimezone = slot.timezone || getUserTimezone()
        
        // Get the date in the slot's timezone
        const options: Intl.DateTimeFormatOptions = {
          timeZone: slotTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }
        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(slotDate)
        const year = parts.find(p => p.type === 'year')?.value
        const month = parts.find(p => p.type === 'month')?.value
        const day = parts.find(p => p.type === 'day')?.value
        const slotDateStr = `${year}-${month}-${day}`
        
        const selectedDateStr = selectedDate.toISOString().split('T')[0]
        
        // Only include slots from the selected date
        if (slotDateStr === selectedDateStr && slot.availableSubSlots) {
          slot.availableSubSlots.forEach(subSlot => {
            // Convert to Date objects if they're strings
            const startDate = subSlot.start instanceof Date ? subSlot.start : new Date(subSlot.start)
            const endDate = subSlot.end instanceof Date ? subSlot.end : new Date(subSlot.end)
            
            allAvailableSlots.push({
              start: startDate,
              end: endDate,
              label: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              slotId: slot.id
            })
          })
        }
      })
      
      return allAvailableSlots.sort((a, b) => a.start.getTime() - b.start.getTime())
    }
    
    // Fallback to old method
    return getAvailableTimeSlots(availabilitySlots, selectedDate, getUserTimezone())
  }, [selectedDate, availabilitySlots])

  // Get available durations for selected start time
  const availableDurations = useMemo(() => {
    if (!selectedStartTime) return []
    
    // Find the availability slot that contains this start time
    const containingSlot = availabilitySlots.find((slot) => {
      const slotStart = new Date(slot.start_time)
      const slotEnd = new Date(slot.end_time)
      return selectedStartTime >= slotStart && selectedStartTime < slotEnd
    })

    if (!containingSlot) return []

    const slotEnd = new Date(containingSlot.end_time)
    const maxDurationMinutes = Math.floor(
      (slotEnd.getTime() - selectedStartTime.getTime()) / (1000 * 60)
    )

    // Only offer 60, 90, and 120 minute options
    const standardDurations = [60, 90, 120]
    const durations = standardDurations.filter(duration => duration <= maxDurationMinutes)

    return durations
  }, [selectedStartTime, availabilitySlots])

  // Calculate end time based on duration
  const selectedEndTime = useMemo(() => {
    if (!selectedStartTime) return null
    return new Date(selectedStartTime.getTime() + selectedDuration * 60 * 1000)
  }, [selectedStartTime, selectedDuration])

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!hourlyRate) return null
    const rate = parseFloat(hourlyRate.replace(/[^0-9.]/g, ''))
    const hours = selectedDuration / 60
    return `$${(rate * hours).toFixed(2)}`
  }, [hourlyRate, selectedDuration])

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(new Date(dateStr + 'T00:00:00'))
    setStep('time')
  }

  const handleTimeSelect = (time: Date) => {
    setSelectedStartTime(time)
    setStep('duration')
  }

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration)
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!selectedStartTime || !selectedEndTime) {
      toast.error('Please select a time slot')
      return
    }

    // Find the availability slot that contains this time
    const slot = availabilitySlots.find((s) => {
      const slotStart = new Date(s.start_time)
      const slotEnd = new Date(s.end_time)
      return selectedStartTime >= slotStart && selectedEndTime <= slotEnd
    })

    if (!slot) {
      toast.error('Selected time is no longer available')
      return
    }

    setSubmitting(true)
    try {
      // Create Stripe checkout session instead of directly creating booking
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId: coachId,
          slotId: slot.id,
          bookingStartTime: selectedStartTime.toISOString(),
          bookingEndTime: selectedEndTime.toISOString(),
          learnerEmail: formData.email,
          learnerPhone: formData.phone,
          sessionNotes: formData.notes,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        // Redirect to Stripe checkout
        window.location.href = url
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to initiate payment')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('An error occurred while initiating payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Book a Session with {coachName}</CardTitle>
              {hourlyRate && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {hourlyRate}/hour
                </p>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {['date', 'time', 'duration', 'details', 'confirm'].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-blue-500 text-white'
                      : idx < ['date', 'time', 'duration', 'details', 'confirm'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 4 && <div className="w-8 h-0.5 bg-gray-300 mx-1" />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Date */}
          {step === 'date' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select a Date</h3>
              <div className="grid grid-cols-3 gap-3">
                {availableDates.slice(0, 30).map((dateStr) => (
                  <Button
                    key={dateStr}
                    variant="outline"
                    onClick={() => handleDateSelect(dateStr)}
                    className="h-auto py-3"
                  >
                    {formatDateDisplay(new Date(dateStr + 'T00:00:00'))}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 'time' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Session Start Time on {selectedDate && formatDateDisplay(selectedDate)}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setStep('date')}>
                  Back
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {availableTimeSlots.map((slot, idx) => {
                  // Find the parent availability slot
                  const containingSlot = availabilitySlots.find((s) => {
                    const slotStart = new Date(s.start_time)
                    const slotEnd = new Date(s.end_time)
                    return slot.start >= slotStart && slot.start < slotEnd
                  })
                  
                  if (!containingSlot) return null
                  
                  // Calculate available duration from this start time
                  // by counting contiguous available sub-slots
                  let availableMinutes = 0
                  if (containingSlot.availableSubSlots) {
                    // Find contiguous available slots starting from this time
                    const sortedSubSlots = [...containingSlot.availableSubSlots]
                      .map(s => ({
                        start: s.start instanceof Date ? s.start : new Date(s.start),
                        end: s.end instanceof Date ? s.end : new Date(s.end),
                        isAvailable: s.isAvailable
                      }))
                      .sort((a, b) => a.start.getTime() - b.start.getTime())
                    
                    let currentTime = slot.start.getTime()
                    for (const subSlot of sortedSubSlots) {
                      if (subSlot.start.getTime() === currentTime) {
                        availableMinutes += 30
                        currentTime += 30 * 60 * 1000
                      } else if (subSlot.start.getTime() > currentTime) {
                        break
                      }
                    }
                  } else {
                    // Fallback: calculate from parent slot end time
                    const slotEnd = new Date(containingSlot.end_time)
                    availableMinutes = Math.floor(
                      (slotEnd.getTime() - slot.start.getTime()) / (1000 * 60)
                    )
                  }
                  
                  // Only show slots with at least 60 minutes available
                  if (availableMinutes < 60) return null
                  
                  return (
                    <Button
                      key={idx}
                      variant="outline"
                      onClick={() => handleTimeSelect(slot.start)}
                      className="h-auto py-2"
                    >
                      <span className="font-semibold">{slot.label}</span>
                    </Button>
                  )
                })}
              </div>
              {availableTimeSlots.length === 0 && (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                  No available times for this date
                </p>
              )}
            </div>
          )}

          {/* Step 3: Select Duration */}
          {step === 'duration' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Session Duration</h3>
                <Button variant="outline" size="sm" onClick={() => setStep('time')}>
                  Back
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Starting at {selectedStartTime && new Date(selectedStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
              {availableDurations.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500">
                    Select how long you'd like your session to be (minimum 60 minutes)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {availableDurations.map((duration) => {
                      const endTime = new Date(selectedStartTime!.getTime() + duration * 60 * 1000)
                      return (
                        <Button
                          key={duration}
                          variant="outline"
                          onClick={() => handleDurationSelect(duration)}
                          className="h-auto py-4 flex flex-col items-center"
                        >
                          <span className="text-lg font-semibold">{duration} min</span>
                          <span className="text-xs text-gray-500">
                            Until {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {hourlyRate && (
                            <span className="text-sm text-gray-600 font-semibold mt-1">
                              ${(parseFloat(hourlyRate.replace(/[^0-9.]/g, '')) * (duration / 60)).toFixed(2)}
                            </span>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                  Not enough time available at this slot. Please select a different time.
                </p>
              )}
            </div>
          )}

          {/* Step 4: Enter Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Contact Information</h3>
                <Button variant="outline" size="sm" onClick={() => setStep('duration')}>
                  Back
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Session Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="What would you like to discuss?"
                  />
                </div>
              </div>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!formData.email}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Continue to Confirmation
              </Button>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Confirm Your Booking</h3>
                <Button variant="outline" size="sm" onClick={() => setStep('details')}>
                  Back
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coach</p>
                  <p className="font-semibold">{coachName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                  <p className="font-semibold">
                    {selectedDate && formatDateDisplay(selectedDate)}
                  </p>
                  <p className="font-semibold">
                    {selectedStartTime &&
                      selectedEndTime &&
                      formatTimeRange(selectedStartTime, selectedEndTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-semibold">{selectedDuration} minutes</p>
                </div>
                {totalCost && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                    <p className="text-xl font-bold text-blue-600">{totalCost}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-semibold">{formData.email}</p>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg"
              >
                {submitting ? 'Creating Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
