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
}

export default function CoachBookingSection({
  coachId,
  coachName,
  hourlyRate,
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

  const handleOpenBooking = () => {
    fetchAvailability()
    setShowBookingModal(true)
  }

  const handleBookingComplete = () => {
    // Refresh availability after booking
    fetchAvailability()
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">
          Book a Session
        </h3>
        <p className="text-[#64748B] dark:text-[#94A3B8] mb-4 text-sm">
          Schedule a 1-on-1 mentoring session to discuss your career goals and get personalized
          guidance.
        </p>
        <Button
          onClick={handleOpenBooking}
          disabled={loading}
          className="w-full bg-[#0ea5e9] text-white py-3 rounded-lg font-semibold hover:bg-[#0ea5e9]/90 transition-colors"
        >
          {loading ? 'Loading Availability...' : 'View Available Times'}
        </Button>
      </div>

      {showBookingModal && (
        <BookingModal
          coachId={coachId}
          coachName={coachName}
          hourlyRate={hourlyRate}
          availabilitySlots={availabilitySlots}
          onClose={() => setShowBookingModal(false)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </>
  )
}
