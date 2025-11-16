'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { uploadAvatar } from '@/lib/avatarUpload'

interface MentorData {
  user: any
  profile: any
  mentor: any
  availabilitySlots: any[]
  bookings: any[]
}

export default function MentorSettings() {
  const [mentorData, setMentorData] = useState<MentorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    currentTitle: '',
    currentCompany: '',
    linkedinUrl: '',
    alumniSchool: '',
    focusAreas: [] as string[],
    priceDollars: 0
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const focusAreaOptions = [
    'Product sense',
    'Product analytics', 
    'Product design',
    'Product strategy',
    'Product leadership',
    'Behavioral',
    'Others'
  ]

  useEffect(() => {
    fetchMentorData()
  }, [])

  const fetchMentorData = async () => {
    try {
      const response = await fetch('/api/mentor/me')
      if (response.ok) {
        const data = await response.json()
        setMentorData(data)
        
        // Populate form with existing data
        const { profile, mentor } = data
        setFormData({
          fullName: profile.full_name || '',
          currentTitle: mentor.current_title || '',
          currentCompany: mentor.current_company || '',
          linkedinUrl: mentor.linkedin_url || '',
          alumniSchool: mentor.alumni_school || '',
          focusAreas: mentor.focus_areas || [],
          priceDollars: mentor.price_cents ? mentor.price_cents / 100 : 0
        })
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      let avatarUrl = mentorData?.profile.avatar_url

      // Upload avatar if file is selected
      if (avatarFile && mentorData?.user) {
        try {
          avatarUrl = await uploadAvatar(avatarFile, mentorData.user.id)
        } catch (error) {
          console.error('Avatar upload error:', error)
          setMessage('Failed to upload avatar, but other settings were saved.')
        }
      }

      // Update profile (you'll need to create this API endpoint)
      const profileResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          avatar_url: avatarUrl
        })
      })

      // Update mentor data (you'll need to create this API endpoint)
      const mentorResponse = await fetch('/api/mentor/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_title: formData.currentTitle,
          current_company: formData.currentCompany,
          linkedin_url: formData.linkedinUrl,
          alumni_school: formData.alumniSchool,
          focus_areas: formData.focusAreas,
          price_cents: formData.priceDollars * 100
        })
      })

      if (profileResponse.ok && mentorResponse.ok) {
        setMessage('Settings updated successfully!')
        setAvatarFile(null)
        // Refresh data
        await fetchMentorData()
      } else {
        setMessage('Failed to update some settings. Please try again.')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      setMessage('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: parseInt(e.target.value) || 0
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
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
              Unable to load settings. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          Profile Settings
        </h1>
        <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
          Update your coaching profile and preferences
        </p>
      </div>

      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-black text-[#333333] dark:text-white">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`mb-6 p-3 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="avatar" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Profile Picture
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
            </div>

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
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
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
                  value={formData.alumniSchool}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                />
              </div>
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
              />
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

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 rounded-lg transition-colors"
            >
              {submitting ? 'Updating Settings...' : 'Update Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
