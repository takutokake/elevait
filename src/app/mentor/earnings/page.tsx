'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MentorData {
  user: any
  profile: any
  mentor: any
  availabilitySlots: any[]
  bookings: any[]
}

export default function MentorEarnings() {
  const [mentorData, setMentorData] = useState<MentorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

    fetchMentorData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
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
              Unable to load earnings data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { mentor, bookings } = mentorData
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed')
  const totalSessions = confirmedBookings.length
  const totalEarningsDollars = confirmedBookings.reduce((sum, booking) => {
    return sum + (mentor.price_cents || 0)
  }, 0) / 100

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          Earnings
        </h1>
        <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
          Track your coaching session earnings and payments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-[#8b5cf6] mb-2">
              {totalSessions}
            </div>
            <p className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60">
              Confirmed sessions completed
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-[#f97316] mb-2">
              ${totalEarningsDollars.toFixed(0)}
            </div>
            <p className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60">
              From confirmed sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-black text-[#333333] dark:text-white">
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-[#333333] dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#333333] dark:text-white">
                      Student
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[#333333] dark:text-white">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedBookings
                    .sort((a, b) => new Date(b.session_time || b.start_time).getTime() - new Date(a.session_time || a.start_time).getTime())
                    .map((booking, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-[#333333] dark:text-white">
                        {formatDateTime(booking.session_time || booking.start_time)}
                      </td>
                      <td className="py-3 px-4 text-[#333333] dark:text-white">
                        {booking.student_name || 'Student Name'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#f97316]">
                        ${((mentor.price_cents || 0) / 100).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-4">
                No confirmed sessions yet.
              </p>
              <a 
                href="/mentor/availability" 
                className="text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-medium"
              >
                Add availability slots to start earning →
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#0ea5e9] rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#333333] dark:text-white mb-1">
                Payout Information
              </h3>
              <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Payouts are processed manually. You'll receive payment details via email after each confirmed session. 
                For questions about payments, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
