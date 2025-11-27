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
    yearsExperience: 0,
    linkedinUrl: '',
    alumniSchool: '',
    shortDescription: '',
    aboutMe: '',
    focusAreas: [] as string[],
    specialties: [] as string[],
    jobTypeTags: [] as string[],
    successfulCompanies: [] as string[],
    companiesGotOffers: [] as string[],
    companiesInterviewed: [] as string[],
    priceDollars: 0
  })
  const [newSuccessCompany, setNewSuccessCompany] = useState('')
  const [newOfferCompany, setNewOfferCompany] = useState('')
  const [newInterviewCompany, setNewInterviewCompany] = useState('')
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

  const specialtyOptions = [
    'B2B SaaS',
    'Consumer Tech',
    'Fintech',
    'E-commerce',
    'AI/ML Products',
    'Growth PM',
    'Platform PM',
    'Technical PM'
  ]

  const jobTypeOptions = [
    'Full-time',
    'Internship',
    'New Grad',
    'Mid-level',
    'Senior'
  ]

  const companyOptions = [
    // FAANG/Big Tech
    'Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft',
    // Other Major Tech
    'Salesforce', 'Oracle', 'Adobe', 'IBM', 'SAP', 'Cisco', 'Intel', 'NVIDIA',
    'AMD', 'Qualcomm', 'VMware', 'ServiceNow', 'Workday', 'Snowflake',
    // Social/Consumer
    'TikTok', 'Snap', 'Twitter/X', 'LinkedIn', 'Pinterest', 'Reddit', 'Discord',
    'Spotify', 'Uber', 'Lyft', 'Airbnb', 'DoorDash', 'Instacart', 'Robinhood',
    // E-commerce/Retail
    'Shopify', 'eBay', 'Etsy', 'Wayfair', 'Chewy', 'Target', 'Walmart',
    // Fintech
    'Stripe', 'Square', 'PayPal', 'Coinbase', 'Plaid', 'Affirm', 'Chime',
    'Brex', 'Ramp', 'Wise', 'Revolut',
    // Enterprise SaaS
    'Atlassian', 'Asana', 'Monday.com', 'Notion', 'Slack', 'Zoom', 'Dropbox',
    'Box', 'DocuSign', 'HubSpot', 'Zendesk', 'Twilio', 'Datadog', 'Splunk',
    // Cloud/Infrastructure
    'AWS', 'Google Cloud', 'Azure', 'DigitalOcean', 'Cloudflare', 'MongoDB',
    // Startups/Unicorns
    'OpenAI', 'Anthropic', 'Databricks', 'Figma', 'Canva', 'Miro', 'Airtable',
    'Webflow', 'Vercel', 'GitLab', 'GitHub', 'HashiCorp',
    // Consulting/Professional Services
    'McKinsey', 'BCG', 'Bain', 'Deloitte', 'Accenture', 'PwC', 'EY', 'KPMG',
    // Finance
    'Goldman Sachs', 'JPMorgan', 'Morgan Stanley', 'Citadel', 'Blackstone',
    // Other Notable
    'Tesla', 'SpaceX', 'Palantir', 'Roblox', 'Unity', 'Epic Games', 'Riot Games',
    'Activision Blizzard', 'EA', 'Zynga', 'Peloton', 'Zillow', 'Redfin', 'Warner Bros Discovery', 'Disney',
    'Capital One', 'LUCID'
  ].sort()

  const universityOptions = [
    // Ivy League
    'Harvard University', 'Yale University', 'Princeton University', 
    'Columbia University', 'University of Pennsylvania', 'Cornell University',
    'Brown University', 'Dartmouth College',
    // Top Public Universities
    'UC Berkeley', 'UCLA', 'UC San Diego', 'UC Irvine', 'UC Davis', 'UC Santa Barbara',
    'University of Michigan', 'University of Virginia', 'University of North Carolina',
    'University of Texas at Austin', 'University of Washington', 'University of Wisconsin',
    'University of Illinois', 'Georgia Tech', 'Purdue University',
    // Top Private Universities
    'Stanford University', 'MIT', 'Caltech', 'Carnegie Mellon University',
    'Duke University', 'Northwestern University', 'Johns Hopkins University',
    'Rice University', 'Vanderbilt University', 'Emory University',
    'University of Notre Dame', 'Georgetown University', 'USC',
    'NYU', 'Boston University', 'Tufts University', 'Wake Forest University',
    // Tech-focused
    'Georgia Institute of Technology', 'University of Waterloo', 'RPI',
    'Worcester Polytechnic Institute', 'Rochester Institute of Technology',
    // West Coast
    'University of Southern California', 'Santa Clara University', 'Pepperdine University',
    'University of San Diego', 'San Diego State University', 'San Jose State University',
    // East Coast
    'Boston College', 'Northeastern University', 'Brandeis University',
    'University of Rochester', 'Syracuse University', 'Lehigh University',
    // Midwest
    'University of Chicago', 'Washington University in St. Louis',
    'Case Western Reserve University', 'Ohio State University',
    // South
    'University of Florida', 'University of Miami', 'Florida State University',
    'University of Georgia', 'Clemson University', 'Virginia Tech',
    // International
    'University of Toronto', 'McGill University', 'University of British Columbia',
    'Oxford University', 'Cambridge University', 'Imperial College London',
    'National University of Singapore', 'IIT Bombay', 'IIT Delhi',
    // State Schools
    'Penn State University', 'Arizona State University', 'Indiana University',
    'University of Minnesota', 'University of Colorado', 'University of Arizona',
    'Rutgers University', 'University of Maryland', 'University of Massachusetts',
    // Liberal Arts
    'Williams College', 'Amherst College', 'Swarthmore College', 'Pomona College',
    'Claremont McKenna College', 'Bowdoin College', 'Middlebury College',
    // Business Schools (for MBA)
    'Wharton School', 'Harvard Business School', 'Stanford GSB', 'MIT Sloan',
    'Kellogg School of Management', 'Booth School of Business', 'Haas School of Business'
  ].sort()

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
          yearsExperience: mentor.years_experience || 0,
          linkedinUrl: mentor.linkedin_url || '',
          alumniSchool: mentor.alumni_school || '',
          shortDescription: mentor.short_description || '',
          aboutMe: mentor.about_me || '',
          focusAreas: mentor.focus_areas || [],
          specialties: mentor.specialties || [],
          jobTypeTags: mentor.job_type_tags || [],
          successfulCompanies: mentor.successful_companies || [],
          companiesGotOffers: mentor.companies_got_offers || [],
          companiesInterviewed: mentor.companies_interviewed || [],
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
          years_experience: formData.yearsExperience,
          linkedin_url: formData.linkedinUrl,
          alumni_school: formData.alumniSchool,
          short_description: formData.shortDescription,
          about_me: formData.aboutMe,
          focus_areas: formData.focusAreas,
          specialties: formData.specialties,
          job_type_tags: formData.jobTypeTags,
          successful_companies: formData.successfulCompanies,
          companies_got_offers: formData.companiesGotOffers,
          companies_interviewed: formData.companiesInterviewed,
          price_cents: formData.priceDollars * 100
        })
      })

      if (profileResponse.ok && mentorResponse.ok) {
        setMessage('Settings updated successfully!')
        setAvatarFile(null)
        // Refresh data
        await fetchMentorData()
      } else {
        // Get detailed error message
        let errorMsg = 'Failed to update some settings. '
        
        if (!profileResponse.ok) {
          const profileError = await profileResponse.json()
          errorMsg += `Profile error: ${profileError.error || profileError.details || 'Unknown'}. `
          console.error('Profile update error:', profileError)
        }
        
        if (!mentorResponse.ok) {
          const mentorError = await mentorResponse.json()
          errorMsg += `Mentor error: ${mentorError.error || mentorError.details || 'Unknown'}.`
          console.error('Mentor update error:', mentorError)
        }
        
        setMessage(errorMsg)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      setMessage('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialties: checked 
        ? [...prev.specialties, specialty]
        : prev.specialties.filter(s => s !== specialty)
    }))
  }

  const handleJobTypeChange = (jobType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      jobTypeTags: checked 
        ? [...prev.jobTypeTags, jobType]
        : prev.jobTypeTags.filter(j => j !== jobType)
    }))
  }

  const addSuccessCompany = () => {
    if (newSuccessCompany.trim()) {
      setFormData(prev => ({
        ...prev,
        successfulCompanies: [...prev.successfulCompanies, newSuccessCompany.trim()]
      }))
      setNewSuccessCompany('')
    }
  }

  const removeSuccessCompany = (index: number) => {
    setFormData(prev => ({
      ...prev,
      successfulCompanies: prev.successfulCompanies.filter((_, i) => i !== index)
    }))
  }

  const addOfferCompany = () => {
    if (newOfferCompany.trim()) {
      setFormData(prev => ({
        ...prev,
        companiesGotOffers: [...prev.companiesGotOffers, newOfferCompany.trim()]
      }))
      setNewOfferCompany('')
    }
  }

  const removeOfferCompany = (index: number) => {
    setFormData(prev => ({
      ...prev,
      companiesGotOffers: prev.companiesGotOffers.filter((_, i) => i !== index)
    }))
  }

  const addInterviewCompany = () => {
    if (newInterviewCompany.trim()) {
      setFormData(prev => ({
        ...prev,
        companiesInterviewed: [...prev.companiesInterviewed, newInterviewCompany.trim()]
      }))
      setNewInterviewCompany('')
    }
  }

  const removeInterviewCompany = (index: number) => {
    setFormData(prev => ({
      ...prev,
      companiesInterviewed: prev.companiesInterviewed.filter((_, i) => i !== index)
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
                  list="company-list"
                  value={formData.currentCompany}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  placeholder="Start typing to see suggestions..."
                />
                <datalist id="company-list">
                  {companyOptions.map((company) => (
                    <option key={company} value={company} />
                  ))}
                </datalist>
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
                  required
                  value={formData.yearsExperience}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
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
                  list="university-list"
                  value={formData.alumniSchool}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  placeholder="Start typing to see suggestions..."
                />
                <datalist id="university-list">
                  {universityOptions.map((university) => (
                    <option key={university} value={university} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="shortDescription" className="block text-sm font-medium text-[#333333] dark:text-white">
                Short Description <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(1-2 sentences)</span>
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                rows={2}
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors resize-none"
                placeholder="Brief introduction about your coaching expertise..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="aboutMe" className="block text-sm font-medium text-[#333333] dark:text-white">
                About Me <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Detailed bio)</span>
              </label>
              <textarea
                id="aboutMe"
                name="aboutMe"
                rows={5}
                value={formData.aboutMe}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors resize-none"
                placeholder="Share your background, experience, and coaching philosophy..."
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

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#333333] dark:text-white">
                Specialties
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specialtyOptions.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-3">
                    <input
                      id={`specialty-${specialty}`}
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                      className="h-4 w-4 text-[#0ea5e9] focus:ring-[#8b5cf6] border-gray-300 dark:border-gray-600 rounded transition-colors"
                    />
                    <label htmlFor={`specialty-${specialty}`} className="text-sm text-[#333333] dark:text-white">
                      {specialty}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#333333] dark:text-white">
                Job Types You Help With
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {jobTypeOptions.map((jobType) => (
                  <div key={jobType} className="flex items-center space-x-3">
                    <input
                      id={`jobtype-${jobType}`}
                      type="checkbox"
                      checked={formData.jobTypeTags.includes(jobType)}
                      onChange={(e) => handleJobTypeChange(jobType, e.target.checked)}
                      className="h-4 w-4 text-[#0ea5e9] focus:ring-[#8b5cf6] border-gray-300 dark:border-gray-600 rounded transition-colors"
                    />
                    <label htmlFor={`jobtype-${jobType}`} className="text-sm text-[#333333] dark:text-white">
                      {jobType}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#333333] dark:text-white">
                Companies You've Helped Students Get Into
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  list="company-list"
                  value={newSuccessCompany}
                  onChange={(e) => setNewSuccessCompany(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSuccessCompany())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  placeholder="e.g., Google"
                />
                <button
                  type="button"
                  onClick={addSuccessCompany}
                  className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
              {formData.successfulCompanies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.successfulCompanies.map((company, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-full">
                      <span className="text-sm font-medium">{company}</span>
                      <button
                        type="button"
                        onClick={() => removeSuccessCompany(index)}
                        className="hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#333333] dark:text-white">
                Companies I Got Offers From
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  list="company-list"
                  value={newOfferCompany}
                  onChange={(e) => setNewOfferCompany(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOfferCompany())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  placeholder="e.g., Meta"
                />
                <button
                  type="button"
                  onClick={addOfferCompany}
                  className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
              {formData.companiesGotOffers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.companiesGotOffers.map((company, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-full">
                      <span className="text-sm font-medium">{company}</span>
                      <button
                        type="button"
                        onClick={() => removeOfferCompany(index)}
                        className="hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#333333] dark:text-white">
                Companies I've Interviewed At
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  list="company-list"
                  value={newInterviewCompany}
                  onChange={(e) => setNewInterviewCompany(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterviewCompany())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  placeholder="e.g., Amazon"
                />
                <button
                  type="button"
                  onClick={addInterviewCompany}
                  className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
              {formData.companiesInterviewed.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.companiesInterviewed.map((company, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-[#f97316]/10 text-[#f97316] rounded-full">
                      <span className="text-sm font-medium">{company}</span>
                      <button
                        type="button"
                        onClick={() => removeInterviewCompany(index)}
                        className="hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
