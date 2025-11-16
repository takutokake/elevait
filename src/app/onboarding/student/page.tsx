'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uploadAvatar } from '@/lib/avatarUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  id: string
  email: string
}

export default function StudentOnboardingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    currentInterest: '',
    currentSchool: '',
    alumniSchool: '',
    track: 'product' as 'product' | 'eng' | 'design',
    pmFocusAreas: [] as string[],
    priceRangeMinDollars: 50,
    priceRangeMaxDollars: 200
  })

  const focusAreaOptions = [
    'Product sense',
    'Product analytics',
    'Product design',
    'Product strategy',
    'Product leadership',
    'Behavioral',
    'Others'
  ]

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/debug-user')
        const data = await response.json()
        
        if (data.user) {
          setUser(data.user)
        }
      } catch (err) {
        console.error('Error checking user:', err)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: parseFloat(e.target.value) || 0
    }))
  }

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      pmFocusAreas: checked
        ? [...prev.pmFocusAreas, area]
        : prev.pmFocusAreas.filter(a => a !== area)
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError('')

    try {
      let avatarUrl = ''

      // Upload avatar if file is selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile, user.id)
      }

      // Submit onboarding data
      const response = await fetch('/api/onboarding/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          avatarUrl: avatarUrl || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete onboarding')
      }

      // Success - redirect to dashboard or home
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-lg mb-4">Please log in to continue</p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Complete Your Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="currentInterest" className="block text-sm font-medium text-gray-700">
                  Current Interest
                </label>
                <textarea
                  id="currentInterest"
                  name="currentInterest"
                  required
                  value={formData.currentInterest}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about your current interests in product management..."
                />
              </div>

              <div>
                <label htmlFor="currentSchool" className="block text-sm font-medium text-gray-700">
                  Current School
                </label>
                <input
                  id="currentSchool"
                  name="currentSchool"
                  type="text"
                  required
                  value={formData.currentSchool}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="alumniSchool" className="block text-sm font-medium text-gray-700">
                  Alumni School (Optional)
                </label>
                <input
                  id="alumniSchool"
                  name="alumniSchool"
                  type="text"
                  value={formData.alumniSchool}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="track" className="block text-sm font-medium text-gray-700">
                  Track
                </label>
                <select
                  id="track"
                  name="track"
                  value={formData.track}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="product">Product</option>
                  <option value="eng">Engineering</option>
                  <option value="design">Design</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  PM Focus Areas
                </label>
                <div className="space-y-2">
                  {focusAreaOptions.map((area) => (
                    <div key={area} className="flex items-center">
                      <input
                        id={area}
                        type="checkbox"
                        checked={formData.pmFocusAreas.includes(area)}
                        onChange={(e) => handleFocusAreaChange(area, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={area} className="ml-3 block text-sm text-gray-700">
                        {area}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priceRangeMinDollars" className="block text-sm font-medium text-gray-700">
                    Min Price Range ($)
                  </label>
                  <input
                    id="priceRangeMinDollars"
                    name="priceRangeMinDollars"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.priceRangeMinDollars}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="priceRangeMaxDollars" className="block text-sm font-medium text-gray-700">
                    Max Price Range ($)
                  </label>
                  <input
                    id="priceRangeMaxDollars"
                    name="priceRangeMaxDollars"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.priceRangeMaxDollars}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                  Profile Picture (Optional)
                </label>
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Completing Profile...' : 'Complete Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
