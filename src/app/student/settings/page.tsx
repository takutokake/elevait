'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { uploadAvatar } from '@/lib/avatarUpload'

interface UserData {
  user: any
  profile: any
  student: any
  mentor: any
  bookings: any[]
}

export default function StudentSettings() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    currentInterest: '',
    currentSchool: '',
    alumniSchool: '',
    track: 'product' as 'product' | 'eng' | 'design',
    pmFocusAreas: [] as string[],
    priceRangeMinDollars: 50,
    priceRangeMaxDollars: 200
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
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/me')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        
        // Populate form with existing data
        const { profile, student } = data
        if (student) {
          setFormData({
            fullName: profile.full_name || '',
            currentInterest: student.current_interest || '',
            currentSchool: student.current_school || '',
            alumniSchool: student.alumni_school || '',
            track: student.track || 'product',
            pmFocusAreas: student.pm_focus_areas || [],
            priceRangeMinDollars: student.price_range_min_dollars || 50,
            priceRangeMaxDollars: student.price_range_max_dollars || 200
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      let avatarUrl = userData?.profile.avatar_url

      // Upload avatar if file is selected
      if (avatarFile && userData?.user) {
        try {
          avatarUrl = await uploadAvatar(avatarFile, userData.user.id)
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

      // Update student data via existing onboarding endpoint
      const studentResponse = await fetch('/api/onboarding/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentInterest: formData.currentInterest,
          currentSchool: formData.currentSchool,
          alumniSchool: formData.alumniSchool,
          track: formData.track,
          pmFocusAreas: formData.pmFocusAreas,
          priceRangeMinDollars: formData.priceRangeMinDollars,
          priceRangeMaxDollars: formData.priceRangeMaxDollars
        })
      })

      if (profileResponse.ok && studentResponse.ok) {
        setMessage('Settings updated successfully!')
        setAvatarFile(null)
        // Refresh data
        await fetchUserData()
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      pmFocusAreas: checked 
        ? [...prev.pmFocusAreas, area]
        : prev.pmFocusAreas.filter(a => a !== area)
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

  if (!userData) {
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
          Update your student profile and learning preferences
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
                />
              </div>
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
                />
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
