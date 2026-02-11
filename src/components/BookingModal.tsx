'use client'

import { useState, useEffect, useMemo } from 'react'
import posthog from 'posthog-js'
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
  getTimezoneFriendlyName,
} from '@/lib/dateUtils'

/**
 * SECURITY FIX: Decode HTML entities in timezone strings
 * Fixes corrupted timezone data from database (e.g., America&#x2F;Los_Angeles)
 */
function decodeTimezone(timezone: string): string {
  if (!timezone) return 'UTC'
  
  return timezone
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
}

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
  pricingModel?: 'free' | 'paid' | 'both'
  paidPrice?: string
  freeDuration?: number
  paidDuration?: number
  availabilitySlots: AvailabilitySlot[]
  onClose: () => void
  onBookingComplete: () => void
}

export default function BookingModal({
  coachId,
  coachName,
  hourlyRate,
  pricingModel = 'free',
  paidPrice,
  freeDuration = 30,
  paidDuration = 60,
  availabilitySlots,
  onClose,
  onBookingComplete,
}: BookingModalProps) {
  // For 'both' pricing model, user must choose session type first
  const isBothPricing = pricingModel === 'both'
  const [step, setStep] = useState<'type' | 'date' | 'time' | 'duration' | 'details' | 'confirm'>(isBothPricing ? 'type' : 'date')
  const [selectedSessionType, setSelectedSessionType] = useState<'free' | 'paid' | null>(isBothPricing ? null : (pricingModel === 'paid' ? 'paid' : 'free'))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null)
  // Duration based on selected session type
  const defaultDuration = selectedSessionType === 'paid' ? paidDuration : freeDuration
  const [selectedDuration, setSelectedDuration] = useState<number>(defaultDuration)
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
      // SECURITY FIX: Decode HTML entities in timezone (fixes corrupted data from database)
      const rawTimezone = slot.timezone || getUserTimezone()
      const slotTimezone = decodeTimezone(rawTimezone)
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
        // SECURITY FIX: Decode HTML entities in timezone
        const rawTimezone = slot.timezone || getUserTimezone()
        const slotTimezone = decodeTimezone(rawTimezone)
        
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

  // Check if this is a free session based on selected session type
  const isFreeSession = selectedSessionType === 'free'

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

    // For free sessions: ONLY 30 minute option
    // For paid sessions: offer 60, 90, and 120 minute options
    const standardDurations = isFreeSession ? [30] : [60, 90, 120]
    const durations = standardDurations.filter(duration => duration <= maxDurationMinutes)

    return durations
  }, [selectedStartTime, availabilitySlots, isFreeSession])

  // Calculate end time based on duration
  const selectedEndTime = useMemo(() => {
    if (!selectedStartTime) return null
    return new Date(selectedStartTime.getTime() + selectedDuration * 60 * 1000)
  }, [selectedStartTime, selectedDuration])

  // Calculate total cost based on session type
  const totalCost = useMemo(() => {
    if (isFreeSession) return 'FREE'
    
    // For paid sessions, use paidPrice if available, otherwise parse hourlyRate
    let rate = 0
    if (paidPrice) {
      rate = parseFloat(paidPrice.replace(/[^0-9.]/g, ''))
    } else if (hourlyRate && hourlyRate !== 'BOTH') {
      rate = parseFloat(hourlyRate.replace(/[^0-9.]/g, ''))
    }
    
    if (!rate || isNaN(rate)) return null
    
    const hours = selectedDuration / 60
    return `$${(rate * hours).toFixed(2)}`
  }, [isFreeSession, paidPrice, hourlyRate, selectedDuration])

  const handleDateSelect = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    setSelectedDate(date)
    
    // Check if this date has any available time slots
    const slotsForDate = availabilitySlots.filter(slot => {
      const slotDate = new Date(slot.start_time)
      return slotDate.toDateString() === date.toDateString()
    })
    
    // Check if any of these slots have available sub-slots
    const hasAvailableTimes = slotsForDate.some(slot => {
      if (slot.availableSubSlots && slot.availableSubSlots.length > 0) {
        return true
      }
      return false
    })
    
    if (!hasAvailableTimes) {
      toast.error('No available times for this date. All slots are booked.')
      return
    }
    
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
      if (isFreeSession) {
        // For free sessions, create booking directly without Stripe
        const response = await fetch('/api/bookings', {
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
            isFreeSession: true,
            timezone: getUserTimezone(),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Free booking success:', data)

          // Capture free booking confirmed event
          posthog.capture('booking_confirmed_free', {
            coach_id: coachId,
            duration: selectedDuration,
            booking_id: data.bookingId,
          })

          toast.success('🎉 Booking confirmed! Check your email for details.')
          onBookingComplete()
          onClose()
        } else {
          const errorData = await response.json()
          console.error('Free booking error:', errorData)
          toast.error(errorData.error || 'Failed to create booking')
        }
      } else {
        // For paid sessions, create Stripe checkout session
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
            timezone: getUserTimezone(),
          }),
        })

        if (response.ok) {
          const { url } = await response.json()

          // Capture payment initiated event
          posthog.capture('booking_payment_initiated', {
            coach_id: coachId,
            duration: selectedDuration,
            total_cost: totalCost,
          })

          // Redirect to Stripe checkout
          window.location.href = url
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to initiate payment')
        }
      }
    } catch (error) {
      console.error('Booking error:', error)
      posthog.captureException(error)
      toast.error('An error occurred while processing your booking')
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
              {isBothPricing ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Free & Paid Options Available
                </p>
              ) : hourlyRate && hourlyRate !== 'BOTH' ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {hourlyRate}/hour
                </p>
              ) : null}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {(isBothPricing ? ['type', 'date', 'time', 'duration', 'details', 'confirm'] : ['date', 'time', 'duration', 'details', 'confirm']).map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === s
                      ? 'bg-blue-500 text-white'
                      : idx < (isBothPricing ? ['type', 'date', 'time', 'duration', 'details', 'confirm'] : ['date', 'time', 'duration', 'details', 'confirm']).indexOf(step)
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

          {/* Step 0: Select Session Type (only for 'both' pricing) */}
          {step === 'type' && isBothPricing && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Session Type</h3>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => {
                    setSelectedSessionType('free')
                    setSelectedDuration(freeDuration)
                    // Capture session type selection event
                    posthog.capture('booking_session_type_selected', {
                      coach_id: coachId,
                      session_type: 'free',
                      duration: freeDuration,
                    })
                    setStep('date')
                  }}
                  className="p-6 border-2 border-green-200 dark:border-green-800 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-green-700 dark:text-green-400">Free Session</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{freeDuration} minute introductory call</p>
                      <p className="text-xs text-gray-500 mt-2">Great for getting to know each other</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">FREE</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedSessionType('paid')
                    setSelectedDuration(paidDuration)
                    // Capture session type selection event
                    posthog.capture('booking_session_type_selected', {
                      coach_id: coachId,
                      session_type: 'paid',
                      duration: paidDuration,
                      price: paidPrice,
                    })
                    setStep('date')
                  }}
                  className="p-6 border-2 border-orange-200 dark:border-orange-800 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-orange-700 dark:text-orange-400">Paid Session</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{paidDuration} minute in-depth coaching</p>
                      <p className="text-xs text-gray-500 mt-2">Full interview prep & career guidance</p>
                    </div>
                    <span className="text-2xl font-bold text-orange-600">{paidPrice}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Select Date */}
          {step === 'date' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select a Date</h3>
                {isBothPricing && (
                  <Button variant="outline" size="sm" onClick={() => setStep('type')}>
                    Back
                  </Button>
                )}
              </div>
              {selectedSessionType && (
                <p className="text-sm text-gray-500">
                  {selectedSessionType === 'free' ? '🎁 Free Session' : `💰 Paid Session (${paidPrice})`}
                </p>
              )}
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
              {availableDates.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No availability in the next 30 days</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">This coach's calendar is fully booked. Please check back later.</p>
                </div>
              )}
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
              {/* Timezone indicator for students */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <span>🌐</span>
                <span>Times shown in <strong>{getTimezoneFriendlyName(getUserTimezone())}</strong></span>
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
                  
                  // For free sessions: show slots with at least 30 minutes available
                  // For paid sessions: show slots with at least 60 minutes available
                  const minRequiredMinutes = isFreeSession ? 30 : 60
                  if (availableMinutes < minRequiredMinutes) return null
                  
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
                  <p className="text-xs text-gray-500 mt-1">
                    🌐 {getTimezoneFriendlyName(getUserTimezone())}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-semibold">{selectedDuration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cost</p>
                  {isFreeSession ? (
                    <p className="text-xl font-bold text-green-600">FREE</p>
                  ) : totalCost ? (
                    <p className="text-xl font-bold text-blue-600">{totalCost}</p>
                  ) : (
                    <p className="text-xl font-bold text-blue-600">Contact for pricing</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-semibold">{formData.email}</p>
                </div>
              </div>
              {isFreeSession && (
                <p className="text-sm text-gray-500 text-center">
                  This is a free session. No payment required.
                </p>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full h-12 text-lg ${
                  isFreeSession 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {submitting 
                  ? 'Creating Booking...' 
                  : isFreeSession 
                    ? 'Confirm Free Session' 
                    : 'Proceed to Payment'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
