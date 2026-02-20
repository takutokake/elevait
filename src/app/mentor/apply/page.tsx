'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { uploadAvatar } from '@/lib/avatarUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PricingSettings, PricingData } from '@/components/settings/PricingSettings'

interface User {
  id: string
  email: string
}

interface Profile {
  full_name: string
  role: string
}

export default function CoachApplicationPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasPendingApplication, setHasPendingApplication] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentTitle: '',
    currentCompany: '',
    yearsExperience: 1,
    linkedinUrl: '',
    focusAreas: [] as string[],
    priceDollars: 0,
    alumniSchool: '',
    shortDescription: '',
    aboutMe: '',
    jobTypeTags: [] as string[],
    specialties: [] as string[],
    successfulCompanies: [] as string[],
    companiesGotOffers: [] as string[],
    companiesInterviewed: [] as string[],
    // Pricing fields
    pricingModel: 'free' as 'free' | 'paid' | 'both',
    sessionPrice: null as number | null,
    freeSessionDuration: 30,
    sessionDuration: 45,
    paymentTitle: '',
    paymentDescription: '',
    // Filter metadata fields
    specializations: [] as string[],
    sessionTypes: [] as string[],
    offersReferrals: false,
    hiredDate: '',
    // Interview experience
    totalInterviews: 0
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

  const jobTypeOptions = [
    'product_management',
    'program_manager',
    'product_designer',
    'software_engineer',
    'data_analyst',
    'business_analyst'
  ]

  const specialtyOptions = [
    'growth',
    'leadership',
    'analytics',
    'experiments',
    'design',
    'strategy',
    'technical',
    'user_research',
    'roadmapping',
    'stakeholder_management'
  ]

  const specializationOptions = [
    'APM programs',
    'Technical PM',
    'Consumer products',
    'B2B/Enterprise',
    'Data/Analytics PM'
  ]

  const sessionTypeOptions = [
    'Resume review',
    'Mock interview',
    'Career advice'
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

  // Check if user is logged in and get profile
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Use /api/me to get proper user data including application status
        const response = await fetch('/api/me')
        const data = await response.json()
        
        if (data.user) {
          setUser(data.user)
          
          // Autofill from profile, user metadata, or existing mentor application
          const fullName = data.profile?.full_name || 
                          data.user.user_metadata?.full_name || 
                          data.user.user_metadata?.name || ''
          
          setFormData(prev => ({
            ...prev,
            email: data.user.email,
            fullName: fullName
          }))

          // Set profile data
          if (data.profile) {
            setProfile({
              full_name: data.profile.full_name || '',
              role: data.profile.role || 'student'
            })
          }

          // Check if user has a pending or approved application
          if (data.mentorApplication) {
            const status = data.mentorApplication.status
            // If status is 'pending' or 'approved', block access to form
            if (status === 'pending' || status === 'approved') {
              setHasPendingApplication(true)
            }
          }
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


  const handleCompanyAdd = (field: 'successfulCompanies' | 'companiesGotOffers' | 'companiesInterviewed', company: string) => {
    if (company.trim() && !formData[field].includes(company.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], company.trim()]
      }))
    }
  }

  const handleCompanyRemove = (field: 'successfulCompanies' | 'companiesGotOffers' | 'companiesInterviewed', company: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(c => c !== company)
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
    }
  }

  const handlePricingChange = (pricingData: PricingData) => {
    setFormData(prev => ({
      ...prev,
      pricingModel: pricingData.pricing_model,
      sessionPrice: pricingData.session_price,
      freeSessionDuration: pricingData.free_session_duration,
      sessionDuration: pricingData.session_duration,
      paymentTitle: pricingData.payment_title,
      paymentDescription: pricingData.payment_description,
      // Also update priceDollars for backward compatibility
      priceDollars: pricingData.session_price || 0
    }))
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

      // Submit coach application with all new fields including pricing
      const response = await fetch('/api/onboarding/coach-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentTitle: formData.currentTitle,
          currentCompany: formData.currentCompany,
          yearsExperience: formData.yearsExperience,
          linkedinUrl: formData.linkedinUrl,
          focusAreas: formData.focusAreas,
          priceDollars: formData.priceDollars,
          alumniSchool: formData.alumniSchool,
          shortDescription: formData.shortDescription,
          aboutMe: formData.aboutMe,
          jobTypeTags: formData.jobTypeTags,
          successfulCompanies: formData.successfulCompanies,
          companiesGotOffers: formData.companiesGotOffers,
          companiesInterviewed: formData.companiesInterviewed,
          avatarUrl: avatarUrl || undefined,
          // Pricing fields
          pricingModel: formData.pricingModel,
          sessionPrice: formData.sessionPrice,
          freeSessionDuration: formData.freeSessionDuration,
          sessionDuration: formData.sessionDuration,
          paymentTitle: formData.paymentTitle,
          paymentDescription: formData.paymentDescription,
          // Filter metadata fields
          specializations: formData.specializations,
          sessionTypes: formData.sessionTypes,
          offersReferrals: formData.offersReferrals,
          hiredDate: formData.hiredDate || undefined,
          // Interview experience
          totalInterviews: formData.totalInterviews || 0
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      // Capture coach application submitted event
      posthog.capture('coach_application_submitted', {
        current_company: formData.currentCompany,
        years_experience: formData.yearsExperience,
        pricing_model: formData.pricingModel,
        session_price: formData.sessionPrice,
        specializations: formData.specializations,
        session_types: formData.sessionTypes,
        offers_referrals: formData.offersReferrals,
        has_avatar: !!avatarFile,
      })

      // Success - set both success and pending application state
      setSuccess(true)
      setHasPendingApplication(true)
    } catch (err) {
      posthog.captureException(err)
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
            <p className="text-lg mb-4">Please log in to apply as a coach</p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profile?.role === 'mentor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-lg mb-4">You are already an approved coach.</p>
            <Button onClick={() => router.push('/mentor/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasPendingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-lg mb-4">Your coach application is still pending or not yet approved. We'll contact you soon.</p>
            <Button onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-lg mb-4">Your coach application has been submitted and is pending review. We'll contact you soon.</p>
            <Button onClick={() => router.push('/')}>
              Go to Home
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
              Apply to be a Coach
            </CardTitle>
            <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Share your expertise and help students unlock their potential
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
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 text-[#333333]/60 dark:text-[#F5F5F5]/60"
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
                    list="company-options"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="Company name"
                  />
                  <datalist id="company-options">
                    {companyOptions.map(company => (
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
                    step="1"
                    required
                    value={formData.yearsExperience}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="totalInterviews" className="block text-sm font-medium text-[#333333] dark:text-white">
                    Number of Interviews
                  </label>
                  <input
                    id="totalInterviews"
                    name="totalInterviews"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalInterviews}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="10"
                  />
                  <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
                    Approximate number of interviews you've done for this role/company
                  </p>
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
                    list="university-options"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    placeholder="University name"
                  />
                  <datalist id="university-options">
                    {universityOptions.map(university => (
                      <option key={university} value={university} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="shortDescription" className="block text-sm font-medium text-[#333333] dark:text-white">
                  Short Description <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(100 characters max)</span>
                </label>
                <input
                  id="shortDescription"
                  name="shortDescription"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  placeholder="Ex: Helping PMs break into FAANG companies"
                />
                <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
                  {formData.shortDescription.length}/100 characters
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="aboutMe" className="block text-sm font-medium text-[#333333] dark:text-white">
                  About Me <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(500 characters max)</span>
                </label>
                <textarea
                  id="aboutMe"
                  name="aboutMe"
                  required
                  maxLength={500}
                  rows={4}
                  value={formData.aboutMe}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors resize-none"
                  placeholder="Tell us about your background, experience, and what makes you a great mentor..."
                />
                <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
                  {formData.aboutMe.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333] dark:text-white">
                  Companies You've Helped Students Get Into <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="successCompanyInput"
                    list="company-options"
                    placeholder="Add company name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        handleCompanyAdd('successfulCompanies', input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('successCompanyInput') as HTMLInputElement
                      handleCompanyAdd('successfulCompanies', input.value)
                      input.value = ''
                    }}
                    className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.successfulCompanies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.successfulCompanies.map((company, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1 rounded-full text-sm"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => handleCompanyRemove('successfulCompanies', company)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333] dark:text-white">
                  Companies I Got Offers From <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="offerCompanyInput"
                    list="company-options"
                    placeholder="Add company name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        handleCompanyAdd('companiesGotOffers', input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('offerCompanyInput') as HTMLInputElement
                      handleCompanyAdd('companiesGotOffers', input.value)
                      input.value = ''
                    }}
                    className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.companiesGotOffers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.companiesGotOffers.map((company, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-[#8b5cf6]/10 text-[#8b5cf6] px-3 py-1 rounded-full text-sm"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => handleCompanyRemove('companiesGotOffers', company)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#333333] dark:text-white">
                  Companies I Interviewed With <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="interviewCompanyInput"
                    list="company-options"
                    placeholder="Add company name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        handleCompanyAdd('companiesInterviewed', input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('interviewCompanyInput') as HTMLInputElement
                      handleCompanyAdd('companiesInterviewed', input.value)
                      input.value = ''
                    }}
                    className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.companiesInterviewed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.companiesInterviewed.map((company, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-[#f97316]/10 text-[#f97316] px-3 py-1 rounded-full text-sm"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => handleCompanyRemove('companiesInterviewed', company)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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

              {/* Pricing Settings Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <PricingSettings
                  currentPricingModel={formData.pricingModel}
                  currentSessionPrice={formData.sessionPrice}
                  currentFreeDuration={formData.freeSessionDuration}
                  currentPaidDuration={formData.sessionDuration}
                  paymentTitle={formData.paymentTitle}
                  paymentDescription={formData.paymentDescription}
                  onChange={handlePricingChange}
                  showPreview={true}
                />
              </div>

              {/* Specialization & Session Types Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white">Coaching Details</h3>
                
                {/* When were you hired? */}
                <div className="space-y-2">
                  <label htmlFor="hiredDate" className="block text-sm font-medium text-[#333333] dark:text-white">
                    When were you hired at your current company?
                  </label>
                  <input
                    id="hiredDate"
                    name="hiredDate"
                    type="month"
                    value={formData.hiredDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hiredDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] transition-colors"
                  />
                  <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
                    This helps students find coaches with recent interview experience
                  </p>
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white">
                    Your Specializations <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {specializationOptions.map(spec => (
                      <label key={spec} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, specializations: [...prev.specializations, spec] }))
                            } else {
                              setFormData(prev => ({ ...prev, specializations: prev.specializations.filter(s => s !== spec) }))
                            }
                          }}
                          className="form-checkbox rounded border-gray-300 dark:border-gray-600 text-[#0ea5e9] focus:ring-[#0ea5e9]/50"
                        />
                        <span className="text-sm text-[#333333] dark:text-white">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Session Types */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#333333] dark:text-white">
                    What can you help with? <span className="text-[#333333]/60 dark:text-[#F5F5F5]/60">(Select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {sessionTypeOptions.map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <input
                          type="checkbox"
                          checked={formData.sessionTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, sessionTypes: [...prev.sessionTypes, type] }))
                            } else {
                              setFormData(prev => ({ ...prev, sessionTypes: prev.sessionTypes.filter(t => t !== type) }))
                            }
                          }}
                          className="form-checkbox rounded border-gray-300 dark:border-gray-600 text-[#0ea5e9] focus:ring-[#0ea5e9]/50"
                        />
                        <span className="text-sm text-[#333333] dark:text-white">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Offers Referrals */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#0ea5e9] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.offersReferrals}
                      onChange={(e) => setFormData(prev => ({ ...prev, offersReferrals: e.target.checked }))}
                      className="form-checkbox rounded border-gray-300 dark:border-gray-600 text-[#0ea5e9] focus:ring-[#0ea5e9]/50 w-5 h-5"
                    />
                    <div>
                      <span className="text-sm font-medium text-[#333333] dark:text-white">I can offer referrals</span>
                      <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60">
                        Check this if you're willing to refer qualified candidates to your company
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-semibold h-11 rounded-lg transition-colors"
              >
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
