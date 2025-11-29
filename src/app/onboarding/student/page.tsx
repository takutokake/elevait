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
    priceRangeMaxDollars: 200,
    referredBy: ''
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
    // Updated: Match hero section background with radial gradient
    <div className="min-h-screen bg-white dark:bg-[#101c22] py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.2),rgba(16,28,34,0))]"></div>
      
      <div className="max-w-2xl mx-auto">
        {/* Updated: Enhanced Card styling with better shadows and borders */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-black tracking-tight text-[#333333] dark:text-white">
              Complete Your Student Profile
            </CardTitle>
            <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Tell us about yourself to get matched with the perfect coach
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Updated: Enhanced error display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Updated: Enhanced form fields with proper labels and styling */}
              <div className="space-y-2">
                <label htmlFor="currentInterest" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Current Interest
                </label>
                <textarea
                  id="currentInterest"
                  name="currentInterest"
                  required
                  value={formData.currentInterest}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors resize-none"
                  placeholder="Tell us about your current interests in product management..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="currentSchool" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Current School
                  </label>
                  <input
                    id="currentSchool"
                    name="currentSchool"
                    type="text"
                    required
                    value={formData.currentSchool}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="Enter your current school"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="alumniSchool" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Alumni School <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Optional)</span>
                  </label>
                  <input
                    id="alumniSchool"
                    name="alumniSchool"
                    type="text"
                    value={formData.alumniSchool}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="Enter your alumni school"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="referredBy" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Referral <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Optional)</span>
                </label>
                <input
                  id="referredBy"
                  name="referredBy"
                  type="text"
                  value={formData.referredBy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  placeholder="Who referred you to Elevait?"
                />
                <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
                  If someone referred you, please enter their name
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="track" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Track
                </label>
                <select
                  id="track"
                  name="track"
                  value={formData.track}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                >
                  <option value="product">Product</option>
                  <option value="eng">Engineering</option>
                  <option value="design">Design</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#333333] dark:text-white">
                  PM Focus Areas
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {focusAreaOptions.map((area) => (
                    <div key={area} className="flex items-center space-x-3">
                      <input
                        id={area}
                        type="checkbox"
                        checked={formData.pmFocusAreas.includes(area)}
                        onChange={(e) => handleFocusAreaChange(area, e.target.checked)}
                        className="h-4 w-4 text-[#0ea5e9] focus:ring-[#8b5cf6] border-gray-300 dark:border-gray-600 rounded transition-colors"
                      />
                      <label htmlFor={area} className="text-sm text-[#333333] dark:text-white">
                        {area}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="priceRangeMinDollars" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Min Budget <span className="text-[#f97316]">($)</span>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="priceRangeMaxDollars" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Max Budget <span className="text-[#f97316]">($)</span>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="avatar" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Profile Picture <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Optional)</span>
                </label>
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#0ea5e9] file:text-white hover:file:bg-[#0ea5e9]/90"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 rounded-lg transition-colors"
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
