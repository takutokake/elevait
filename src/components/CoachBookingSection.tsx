'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import BookingModal from './BookingModal'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface AvailabilitySlot {
  id: string
  start_time: string
  end_time: string
  status: string
  timezone: string
}

interface CoachBookingSectionProps {
  coachId: string
  coachName: string
  hourlyRate?: string
  pricingModel?: 'free' | 'paid' | 'both'
  paidPrice?: string
  freeDuration?: number
  paidDuration?: number
}

export default function CoachBookingSection({
  coachId,
  coachName,
  hourlyRate,
  pricingModel = 'free',
  paidPrice,
  freeDuration = 30,
  paidDuration = 60,
}: CoachBookingSectionProps) {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      // Fetch availability for next 30 days
      const now = new Date()
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const response = await fetch(
        `/api/coaches/${coachId}/availability?from=${now.toISOString()}&to=${futureDate.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        setAvailabilitySlots(data.slots || [])
      } else {
        toast.error('Failed to load availability')
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('An error occurred while loading availability')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBooking = async () => {
    setLoading(true)
    try {
      // Fetch availability for next 30 days
      const now = new Date()
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const response = await fetch(
        `/api/coaches/${coachId}/availability?from=${now.toISOString()}&to=${futureDate.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        const slots = data.slots || []
        setAvailabilitySlots(slots)
        
        // Only open modal if there are available slots
        if (slots.length > 0) {
          setShowBookingModal(true)
        } else {
          toast.error('This coach has no availability in the next 30 days. Please check back later.')
        }
      } else {
        toast.error('Failed to load availability')
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('An error occurred while loading availability')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingComplete = () => {
    // Refresh availability after booking
    fetchAvailability()
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Button
        onClick={handleOpenBooking}
        disabled={loading}
        className="w-full bg-white text-[#0ea5e9] py-3 rounded-lg font-bold hover:bg-white/90 transition-colors shadow-md"
      >
        {loading ? 'Loading...' : 'View Available Times →'}
      </Button>

      {showBookingModal && (
        <BookingModal
          coachId={coachId}
          coachName={coachName}
          hourlyRate={hourlyRate}
          pricingModel={pricingModel}
          paidPrice={paidPrice}
          freeDuration={freeDuration}
          paidDuration={paidDuration}
          availabilitySlots={availabilitySlots}
          onClose={() => setShowBookingModal(false)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </>
  )
}
