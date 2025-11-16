'use client'

import { useEffect, useState } from 'react'

interface MeResponse {
  user: any
  profile: any
  student: any
  mentor: any
  bookings: any[]
}

interface UseMeResult extends MeResponse {
  isLoading: boolean
  error: string | null
}

export function useMe(): UseMeResult {
  const [data, setData] = useState<MeResponse>({
    user: null,
    profile: null,
    student: null,
    mentor: null,
    bookings: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchMe = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' })
        if (!res.ok) {
          throw new Error('Failed to fetch user data')
        }

        const json = await res.json()

        if (isMounted) {
          setData({
            user: json.user || null,
            profile: json.profile || null,
            student: json.student || null,
            mentor: json.mentor || null,
            bookings: json.bookings || []
          })
          setError(null)
        }
      } catch (err) {
        console.error('useMe error:', err)
        if (isMounted) {
          setError('Unable to load user data')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchMe()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    ...data,
    isLoading,
    error
  }
}
