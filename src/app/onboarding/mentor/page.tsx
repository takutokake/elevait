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

export default function MentorOnboardingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    currentTitle: '',
    currentCompany: '',
    yearsExperience: 1,
    linkedinUrl: '',
    focusAreas: [] as string[],
    priceDollars: 100,
    alumniSchool: ''
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
      focusAreas: checked
        ? [...prev.focusAreas, area]
        : prev.focusAreas.filter(a => a !== area)
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
      const response = await fetch('/api/onboarding/mentor', {
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

      // Success - redirect to mentor dashboard
      router.push('/mentor/dashboard')
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
            <p className="text-lg mb-4">Please log in to complete your mentor profile</p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#101c22] py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.2),rgba(16,28,34,0))]"></div>
      
      <div className="max-w-2xl mx-auto">
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-black tracking-tight text-[#333333] dark:text-white">
              Complete Your Mentor Profile
            </CardTitle>
            <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Share your expertise and help students unlock their potential
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="currentTitle" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Current Title
                  </label>
                  <input
                    id="currentTitle"
                    name="currentTitle"
                    type="text"
                    required
                    value={formData.currentTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="Senior Product Manager"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="currentCompany" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Current Company
                  </label>
                  <input
                    id="currentCompany"
                    name="currentCompany"
                    type="text"
                    required
                    value={formData.currentCompany}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="yearsExperience" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Years of Experience
                  </label>
                  <input
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.yearsExperience}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="priceDollars" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Price per Session <span className="text-[#f97316]">($)</span>
                  </label>
                  <input
                    id="priceDollars"
                    name="priceDollars"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.priceDollars}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-[#333333] dark:text-white">
                    LinkedIn URL
                  </label>
                  <input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    required
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="alumniSchool" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Alumni School
                  </label>
                  <input
                    id="alumniSchool"
                    name="alumniSchool"
                    type="text"
                    required
                    value={formData.alumniSchool}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="University name"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#333333] dark:text-white">
                  Focus Areas
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {focusAreaOptions.map((area) => (
                    <div key={area} className="flex items-center space-x-3">
                      <input
                        id={area}
                        type="checkbox"
                        checked={formData.focusAreas.includes(area)}
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
