'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found')
      setLoading(false)
      return
    }

    // Verify payment and create booking
    const verifyAndCreateBooking = async () => {
      try {
        // First verify the payment
        const verifyResponse = await fetch(`/api/verify-payment?session_id=${sessionId}`)
        const verifyData = await verifyResponse.json()

        if (!verifyResponse.ok) {
          setError(verifyData.error || 'Payment verification failed')
          setLoading(false)
          return
        }

        console.log('✅ Payment verified, creating booking...')

        // Create the booking from the payment session
        const bookingResponse = await fetch('/api/create-booking-from-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        const bookingData = await bookingResponse.json()

        if (!bookingResponse.ok) {
          console.error('❌ Booking creation failed:', bookingData)
          const errorMsg = bookingData.details 
            ? `${bookingData.error}: ${bookingData.details}` 
            : bookingData.error || 'Failed to create booking'
          setError(errorMsg)
        } else {
          console.log('✅ Booking created:', bookingData.bookingId)
        }
      } catch (err) {
        console.error('Payment verification error:', err)
        setError('Failed to verify payment and create booking')
      } finally {
        setLoading(false)
      }
    }

    verifyAndCreateBooking()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#0ea5e9]" />
              <p className="text-lg text-center">Verifying payment and creating booking...</p>
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={() => router.push('/student/sessions')} className="w-full">
              Go to My Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">
              Your payment was successful and your coaching session has been booked!
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✅ Payment processed successfully</p>
            <p>✅ Booking request sent to your coach</p>
            <p>✅ Confirmation email sent</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Next Steps:</strong> Your coach will review and approve your booking request. 
              You'll receive an email notification once it's confirmed.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => router.push('/student/sessions')} 
              className="flex-1 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90"
            >
              View My Sessions
            </Button>
            <Button 
              onClick={() => router.push('/coaches')} 
              variant="outline"
              className="flex-1"
            >
              Browse Coaches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#0ea5e9]" />
              <p className="text-lg text-center">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
