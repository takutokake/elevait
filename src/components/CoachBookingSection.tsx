'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false)
  const [noAvailability, setNoAvailability] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          setIsAuthenticated(!!data.user)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

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
    // Check if user is authenticated first
    if (isAuthenticated === false) {
      // Redirect to signup page with student role
      toast.info('Please sign up to book a session')
      router.push('/signup?role=student')
      return
    }

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
        
        setHasCheckedAvailability(true)
        
        // Only open modal if there are available slots
        if (slots.length > 0) {
          setNoAvailability(false)
          setShowBookingModal(true)
        } else {
          setNoAvailability(true)
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
      
      {/* No availability message - positioned clearly below the booking section */}
      {hasCheckedAvailability && noAvailability && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">📅</span>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">No Available Time Slots</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                This coach currently has no available time slots in the next 30 days. Please check back later or contact them directly.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Button
        onClick={handleOpenBooking}
        disabled={loading}
        className="w-full bg-white text-[#0ea5e9] py-3 rounded-lg font-bold hover:bg-white/90 transition-colors shadow-md"
      >
        {loading ? 'Loading...' : noAvailability ? 'Check Again →' : 'View Available Times →'}
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
