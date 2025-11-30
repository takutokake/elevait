'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function BookingCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-orange-500" />
            <CardTitle className="text-2xl">Booking Cancelled</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-orange-800 dark:text-orange-200">
              Your booking was cancelled and no payment was processed.
            </p>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No worries! You can try booking again whenever you're ready. Your selected time slot 
            may still be available.
          </p>

          <div className="flex gap-3">
            <Button 
              onClick={() => router.push('/coaches')} 
              className="flex-1 bg-[#0ea5e9] hover:bg-[#0ea5e9]/90"
            >
              Browse Coaches
            </Button>
            <Button 
              onClick={() => router.push('/')} 
              variant="outline"
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
