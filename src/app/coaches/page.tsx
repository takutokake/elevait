'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from "../../components/Layout";
import CoachCard from "@/components/CoachCard";
import { MentorWithDetails } from "@/types/mentor";

export default function CoachesPage() {
  const [mentors, setMentors] = useState<MentorWithDetails[]>([])
  const [filteredMentors, setFilteredMentors] = useState<MentorWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const searchParams = useSearchParams()
  const companyParam = searchParams.get('company')
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(companyParam ? [companyParam] : [])
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'this_week' | 'next_week'>('all')
  const [mentorAvailability, setMentorAvailability] = useState<Record<string, boolean>>({})
  
  // New filter states
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid' | 'under50'>('all')
  const [hiredWithinFilter, setHiredWithinFilter] = useState<'all' | '3months' | '6months' | '1year' | '2years'>('all')
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'sessions' | 'price_low' | 'price_high' | 'newest'>('relevance')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Fetch mentors on mount
  useEffect(() => {
    fetchMentors()
  }, [])
  
  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/coaches')
      const data = await response.json()
      setMentors(data.mentors || [])
      setFilteredMentors(data.mentors || [])
      
      // Fetch availability for each mentor
      if (data.mentors && data.mentors.length > 0) {
        checkMentorAvailability(data.mentors, 'all')
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const checkMentorAvailability = async (mentorList: MentorWithDetails[], filter: 'all' | 'this_week' | 'next_week') => {
    const availabilityMap: Record<string, boolean> = {}
    
    for (const mentor of mentorList) {
      try {
        const now = new Date()
        const endDate = filter === 'this_week' 
          ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        
        const response = await fetch(
          `/api/coaches/${mentor.id}/availability?from=${now.toISOString()}&to=${endDate.toISOString()}`
        )
        const data = await response.json()
        availabilityMap[mentor.id] = data.count > 0
      } catch (error) {
        console.error(`Error checking availability for mentor ${mentor.id}:`, error)
        availabilityMap[mentor.id] = false
      }
    }
    
    setMentorAvailability(availabilityMap)
  }
  
  // Get all unique companies from mentors
  const getAllCompanies = () => {
    const companiesSet = new Set<string>()
    
    mentors.forEach(mentor => {
      const mentorData = mentor.mentor_data
      if (!mentorData) return
      
      // Add current company
      if (mentorData.current_company) companiesSet.add(mentorData.current_company)
      
      // Add successful companies
      if (mentorData.successful_companies) {
        mentorData.successful_companies.forEach(c => companiesSet.add(c))
      }
      
      // Add companies got offers
      if (mentorData.companies_got_offers) {
        mentorData.companies_got_offers.forEach(c => companiesSet.add(c))
      }
      
      // Add companies interviewed
      if (mentorData.companies_interviewed) {
        mentorData.companies_interviewed.forEach(c => companiesSet.add(c))
      }
    })
    
    return Array.from(companiesSet).sort()
  }
  
  // Apply filters
  useEffect(() => {
    let filtered = [...mentors]
    
    // Search filter (coach name or company)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(mentor => {
        const name = mentor.full_name?.toLowerCase() || ''
        const company = mentor.mentor_data?.current_company?.toLowerCase() || ''
        return name.includes(query) || company.includes(query)
      })
    }
    
    // Company expertise filter
    if (selectedCompanies.length > 0) {
      filtered = filtered.filter(mentor => {
        const mentorData = mentor.mentor_data
        if (!mentorData) return false
        
        const mentorCompanies = [
          mentorData.current_company,
          ...(mentorData.successful_companies || []),
          ...(mentorData.companies_got_offers || []),
          ...(mentorData.companies_interviewed || [])
        ].filter(Boolean).map(c => c?.toLowerCase())
        
        return selectedCompanies.some(selectedCompany => 
          mentorCompanies.includes(selectedCompany.toLowerCase())
        )
      })
    }
    
    // Price filter - based on pricing_model (source of truth)
    if (priceFilter === 'free') {
      // Show coaches who offer free sessions (pricing_model is 'free' or 'both')
      filtered = filtered.filter(mentor => {
        const pricingModel = mentor.mentor_data?.pricing_model
        return pricingModel === 'free' || pricingModel === 'both'
      })
    } else if (priceFilter === 'paid') {
      // Show coaches who offer paid sessions (pricing_model is 'paid' or 'both')
      filtered = filtered.filter(mentor => {
        const pricingModel = mentor.mentor_data?.pricing_model
        return pricingModel === 'paid' || pricingModel === 'both'
      })
    } else if (priceFilter === 'under50') {
      // Show coaches with price under $50 or free
      filtered = filtered.filter(mentor => {
        const pricingModel = mentor.mentor_data?.pricing_model
        const priceCents = mentor.mentor_data?.price_cents
        if (pricingModel === 'free') return true
        if (pricingModel === 'both') return true // Has free option
        return priceCents && priceCents < 5000
      })
    }
    
    // Hired within filter - use hired_date field
    if (hiredWithinFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(mentor => {
        const hiredDate = mentor.mentor_data?.hired_date
        if (!hiredDate) return false // Exclude if no hired date
        
        const hired = new Date(hiredDate)
        const diffMonths = Math.floor((now.getTime() - hired.getTime()) / (1000 * 60 * 60 * 24 * 30))
        
        switch (hiredWithinFilter) {
          case '3months': return diffMonths <= 3
          case '6months': return diffMonths <= 6
          case '1year': return diffMonths <= 12
          case '2years': return diffMonths <= 24
          default: return true
        }
      })
    }
    
    // Specialization filter - use specializations field (source of truth)
    if (selectedSpecializations.length > 0) {
      filtered = filtered.filter(mentor => {
        const specializations = mentor.mentor_data?.specializations || []
        const normalizedSpecs = specializations.map(s => s.toLowerCase())
        return selectedSpecializations.some(spec => 
          normalizedSpecs.some(s => s.includes(spec.toLowerCase()) || spec.toLowerCase().includes(s))
        )
      })
    }
    
    // Session type filter - use session_types field and offers_referrals
    if (selectedSessionTypes.length > 0) {
      filtered = filtered.filter(mentor => {
        const sessionTypes = mentor.mentor_data?.session_types || []
        const offersReferrals = mentor.mentor_data?.offers_referrals || false
        const normalizedTypes = sessionTypes.map(t => t.toLowerCase())
        
        return selectedSessionTypes.some(type => {
          // Special handling for referrals
          if (type.toLowerCase().includes('referral')) {
            return offersReferrals
          }
          return normalizedTypes.some(t => t.includes(type.toLowerCase()) || type.toLowerCase().includes(t))
        })
      })
    }
    
    // Availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(mentor => mentorAvailability[mentor.id] === true)
    }
    
    // Apply sorting
    filtered = sortMentors(filtered, sortBy)
    
    setFilteredMentors(filtered)
  }, [searchQuery, selectedCompanies, priceFilter, hiredWithinFilter, selectedSpecializations, selectedSessionTypes, availabilityFilter, mentors, mentorAvailability, sortBy])
  
  // Sorting function
  const sortMentors = (mentorList: MentorWithDetails[], sort: string) => {
    const sorted = [...mentorList]
    switch (sort) {
      case 'sessions':
        return sorted.sort((a, b) => {
          const sessionsA = a.mentor_data?.review_count || 0
          const sessionsB = b.mentor_data?.review_count || 0
          return sessionsB - sessionsA
        })
      case 'price_low':
        return sorted.sort((a, b) => {
          const priceA = a.mentor_data?.price_cents || 0
          const priceB = b.mentor_data?.price_cents || 0
          return priceA - priceB
        })
      case 'price_high':
        return sorted.sort((a, b) => {
          const priceA = a.mentor_data?.price_cents || 0
          const priceB = b.mentor_data?.price_cents || 0
          return priceB - priceA
        })
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.mentor_data?.hired_date || a.mentor_data?.created_at || 0).getTime()
          const dateB = new Date(b.mentor_data?.hired_date || b.mentor_data?.created_at || 0).getTime()
          return dateB - dateA
        })
      case 'relevance':
      default:
        return sorted // Keep original order for relevance
    }
  }
  
  // Re-check availability when filter changes
  useEffect(() => {
    if (availabilityFilter !== 'all' && mentors.length > 0) {
      checkMentorAvailability(mentors, availabilityFilter)
    }
  }, [availabilityFilter, mentors])
  
  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies(prev => 
      prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company]
    )
  }
  
  const handleReset = () => {
    setSearchQuery('')
    setSelectedCompanies([])
    setCompanySearchQuery('')
    setPriceFilter('all')
    setHiredWithinFilter('all')
    setSelectedSpecializations([])
    setSelectedSessionTypes([])
    setAvailabilityFilter('all')
    setSortBy('relevance')
  }
  
  // Get all unique specializations from mentors
  const getAllSpecializations = () => {
    const specsSet = new Set<string>()
    mentors.forEach(mentor => {
      const specs = mentor.mentor_data?.specializations || []
      specs.forEach(s => specsSet.add(s))
    })
    return Array.from(specsSet).sort()
  }
  
  // Get all unique session types from mentors
  const getAllSessionTypes = () => {
    const typesSet = new Set<string>()
    mentors.forEach(mentor => {
      const types = mentor.mentor_data?.session_types || []
      types.forEach(t => typesSet.add(t))
      // Add referrals if any mentor offers them
      if (mentor.mentor_data?.offers_referrals) {
        typesSet.add('Referrals available')
      }
    })
    return Array.from(typesSet).sort()
  }
  
  // Get sort label for display
  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'sessions': return 'Most Sessions'
      case 'price_low': return 'Lowest Price'
      case 'price_high': return 'Highest Price'
      case 'newest': return 'Newest Coaches'
      default: return 'Relevance'
    }
  }
  
  // Decode HTML entities in strings - handles multiple levels of encoding
  const decodeHtmlEntities = (str: string) => {
    if (!str) return str
    
    let decoded = str
    let previousDecoded = ''
    
    // Keep decoding until no more changes occur (handles multiple encoding levels)
    while (decoded !== previousDecoded) {
      previousDecoded = decoded
      
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea')
        textarea.innerHTML = decoded
        decoded = textarea.value
      } else {
        // Server-side fallback: handle common entities
        decoded = decoded
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x2F;/g, '/')
          .replace(/&#47;/g, '/')
          .replace(/&apos;/g, "'")
      }
    }
    
    return decoded
  }
  
  const handleSpecializationToggle = (spec: string) => {
    setSelectedSpecializations(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    )
  }
  
  const handleSessionTypeToggle = (type: string) => {
    setSelectedSessionTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }
  
  const allCompanies = getAllCompanies()
  // Filter companies by search query and limit display
  const filteredCompanies = companySearchQuery.trim()
    ? allCompanies.filter(c => c.toLowerCase().includes(companySearchQuery.toLowerCase()))
    : allCompanies
  const displayedCompanies = filteredCompanies.slice(0, 15) // Show top 15 companies
  
  const allSpecializations = getAllSpecializations()
  const allSessionTypes = getAllSessionTypes()
  return (
    <Layout variant="landing">

          <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Sidebar Filters */}
              <aside className="w-full lg:w-1/4 xl:w-1/5">
                <div className="sticky top-28">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Filter By</h3>
                    <button 
                      onClick={handleReset}
                      className="text-sm font-medium text-[#0ea5e9] transition-colors hover:text-[#0ea5e9]/80"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex flex-col bg-[#ffffff] dark:bg-[#1F2937] p-4 rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#374151]">
                    {/* Company Expertise Filter */}
                    <details className="flex flex-col border-b border-[#E2E8F0] dark:border-[#374151] py-2 group" open>
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Company Expertise</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="pt-2 pb-2">
                        {/* Company search input */}
                        <input
                          type="text"
                          placeholder="Search companies..."
                          value={companySearchQuery}
                          onChange={(e) => setCompanySearchQuery(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-[#E2E8F0] dark:border-[#374151] rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-[#0ea5e9] mb-3"
                        />
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {displayedCompanies.map((company: string) => (
                            <label key={company} className="flex items-center gap-3 cursor-pointer">
                              <input 
                                className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" 
                                type="checkbox"
                                checked={selectedCompanies.includes(company)}
                                onChange={() => handleCompanyToggle(company)}
                              />
                              <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">{company}</span>
                            </label>
                          ))}
                          {filteredCompanies.length > 15 && (
                            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] pt-2">
                              +{filteredCompanies.length - 15} more companies. Use search to find specific ones.
                            </p>
                          )}
                          {displayedCompanies.length === 0 && (
                            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">No companies found</p>
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Price Filter */}
                    <details className="flex flex-col border-b border-[#E2E8F0] dark:border-[#374151] py-2 group" open>
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Price</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="space-y-3 pt-2 pb-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" 
                            name="priceFilter" 
                            type="radio"
                            checked={priceFilter === 'all'}
                            onChange={() => setPriceFilter('all')}
                          />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Any price</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" 
                            name="priceFilter" 
                            type="radio"
                            checked={priceFilter === 'free'}
                            onChange={() => setPriceFilter('free')}
                          />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Free sessions only</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" 
                            name="priceFilter" 
                            type="radio"
                            checked={priceFilter === 'paid'}
                            onChange={() => setPriceFilter('paid')}
                          />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Paid sessions only</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" 
                            name="priceFilter" 
                            type="radio"
                            checked={priceFilter === 'under50'}
                            onChange={() => setPriceFilter('under50')}
                          />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Under $50</span>
                        </label>
                      </div>
                    </details>

                    {/* Hired Within Filter */}
                    <details className="flex flex-col border-b border-[#E2E8F0] dark:border-[#374151] py-2 group">
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Hired Within</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="space-y-3 pt-2 pb-2">
                        {[
                          { value: '3months', label: 'Last 3 months' },
                          { value: '6months', label: 'Last 6 months' },
                          { value: '1year', label: 'Last year' },
                          { value: '2years', label: 'Last 2 years' },
                        ].map(option => (
                          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                            <input 
                              className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" 
                              type="checkbox"
                              checked={hiredWithinFilter === option.value}
                              onChange={() => setHiredWithinFilter(hiredWithinFilter === option.value ? 'all' : option.value as any)}
                            />
                            <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </details>

                    {/* Specialization Filter */}
                    <details className="flex flex-col border-b border-[#E2E8F0] dark:border-[#374151] py-2 group">
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Specialization</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="space-y-3 pt-2 pb-2 max-h-48 overflow-y-auto">
                        {allSpecializations.length > 0 ? (
                          allSpecializations.map((spec: string) => (
                            <label key={spec} className="flex items-center gap-3 cursor-pointer">
                              <input 
                                className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" 
                                type="checkbox"
                                checked={selectedSpecializations.includes(spec)}
                                onChange={() => handleSpecializationToggle(spec)}
                              />
                              <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">{decodeHtmlEntities(spec)}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">No specializations available</p>
                        )}
                      </div>
                    </details>

                    {/* Session Type Filter */}
                    <details className="flex flex-col border-b border-[#E2E8F0] dark:border-[#374151] py-2 group">
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Session Type</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="space-y-3 pt-2 pb-2 max-h-48 overflow-y-auto">
                        {allSessionTypes.length > 0 ? (
                          allSessionTypes.map((type: string) => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer">
                              <input 
                                className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" 
                                type="checkbox"
                                checked={selectedSessionTypes.includes(type)}
                                onChange={() => handleSessionTypeToggle(type)}
                              />
                              <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">{type}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">No session types available</p>
                        )}
                      </div>
                    </details>

                    {/* Availability Filter */}
                    <details className="flex flex-col py-2 group">
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Availability</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="space-y-3 pt-2 pb-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" 
                            name="availability" 
                            type="radio"
                            checked={availabilityFilter === 'all'}
                            onChange={() => setAvailabilityFilter('all')}
                          />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Any Time</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" 
                            name="availability" 
                            type="radio"
                            checked={availabilityFilter === 'this_week'}
                            onChange={() => setAvailabilityFilter('this_week')}
                          />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">This Week</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" 
                            name="availability" 
                            type="radio"
                            checked={availabilityFilter === 'next_week'}
                            onChange={() => setAvailabilityFilter('next_week')}
                          />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Next Week</span>
                        </label>
                      </div>
                    </details>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="w-full lg:w-3/4 xl:w-4/5">
                <div className="mb-6">
                  <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">Find Your PM Coach</h1>
                </div>

                {/* Search and Sort */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                  <div className="w-full sm:w-auto sm:flex-1">
                    <div className="flex w-full flex-1 items-stretch rounded-lg h-12 bg-[#ffffff] dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-[#374151] transition-all duration-300 focus-within:ring-2 focus-within:ring-[#0ea5e9] focus-within:border-[#0ea5e9]">
                      <div className="text-[#64748B] dark:text-[#9CA3AF] flex items-center justify-center pl-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input 
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-sm focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-[#64748B] dark:placeholder:text-[#9CA3AF] pl-2" 
                        placeholder="Search by coach name or company..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 relative">
                    <button 
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#ffffff] dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-[#374151] pl-4 pr-3 transition-colors hover:border-[#0ea5e9]"
                    >
                      <p className="text-sm font-medium">Sort by: {getSortLabel(sortBy)}</p>
                      <svg className={`w-5 h-5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showSortDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-[#374151] rounded-lg shadow-lg z-50">
                        {[
                          { value: 'relevance', label: 'Relevance' },
                          { value: 'sessions', label: 'Most Sessions' },
                          { value: 'price_low', label: 'Lowest Price' },
                          { value: 'price_high', label: 'Highest Price' },
                          { value: 'newest', label: 'Newest Coaches' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value as typeof sortBy)
                              setShowSortDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F7F9FB] dark:hover:bg-[#374151] first:rounded-t-lg last:rounded-b-lg ${
                              sortBy === option.value ? 'text-[#0ea5e9] font-medium' : 'text-[#64748B] dark:text-[#9CA3AF]'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Coach Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {loading ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-[#64748B] dark:text-[#9CA3AF] text-lg">
                        Loading coaches...
                      </p>
                    </div>
                  ) : filteredMentors.length > 0 ? (
                    filteredMentors.map((mentor) => (
                      <CoachCard key={mentor.id} mentor={mentor} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-[#64748B] dark:text-[#9CA3AF] text-lg">
                        {mentors.length === 0 
                          ? 'No coaches available at the moment. Check back soon!'
                          : 'No coaches match your filters. Try adjusting your search criteria.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                <nav aria-label="Pagination" className="flex items-center justify-between border-t border-[#E2E8F0] dark:border-[#374151] mt-10 pt-6">
                  <div className="hidden sm:block">
                    <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">
                      Showing <span className="font-medium text-[#0F172A] dark:text-[#F3F4F6]">{filteredMentors.length}</span> of <span className="font-medium text-[#0F172A] dark:text-[#F3F4F6]">{mentors.length}</span> coaches
                    </p>
                  </div>
                  <div className="flex-1 flex justify-between sm:justify-end">
                    <button className="relative inline-flex items-center px-4 py-2 border border-[#E2E8F0] dark:border-[#374151] text-sm font-medium rounded-md text-[#64748B] dark:text-[#9CA3AF] transition-colors hover:bg-[#F7F9FB] dark:hover:bg-[#1F2937] hover:text-[#0ea5e9] hover:border-[#0ea5e9]">
                      Previous
                    </button>
                    <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-[#E2E8F0] dark:border-[#374151] text-sm font-medium rounded-md text-[#64748B] dark:text-[#9CA3AF] transition-colors hover:bg-[#F7F9FB] dark:hover:bg-[#1F2937] hover:text-[#0ea5e9] hover:border-[#0ea5e9]">
                      Next
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </main>
    </Layout>
  );
}
