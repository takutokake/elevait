'use client'

import { useState, useEffect } from 'react'
import Layout from "../../components/Layout";
import CoachCard from "@/components/CoachCard";
import { MentorWithDetails } from "@/types/mentor";

export default function CoachesPage() {
  const [mentors, setMentors] = useState<MentorWithDetails[]>([])
  const [filteredMentors, setFilteredMentors] = useState<MentorWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState(50)
  const [maxPrice, setMaxPrice] = useState(500)
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'this_week' | 'next_week'>('all')
  const [mentorAvailability, setMentorAvailability] = useState<Record<string, boolean>>({})
  
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
    
    // Price range filter
    filtered = filtered.filter(mentor => {
      const priceCents = mentor.mentor_data?.price_cents
      if (!priceCents) return false
      const priceDollars = priceCents / 100
      return priceDollars >= minPrice && priceDollars <= maxPrice
    })
    
    // Availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(mentor => mentorAvailability[mentor.id] === true)
    }
    
    setFilteredMentors(filtered)
  }, [searchQuery, selectedCompanies, minPrice, maxPrice, availabilityFilter, mentors, mentorAvailability])
  
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
    setMinPrice(50)
    setMaxPrice(500)
    setAvailabilityFilter('all')
  }
  
  const allCompanies = getAllCompanies()
  const topCompanies = allCompanies.slice(0, 10) // Show top 10 companies
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
                      <div className="space-y-3 pt-2 pb-2 max-h-64 overflow-y-auto">
                        {topCompanies.map(company => (
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
                      </div>
                    </details>

                    {/* Price Range */}
                    <div className="border-b border-[#E2E8F0] dark:border-[#374151] py-4">
                      <p className="text-sm font-medium mb-3">Price Range</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-[#64748B] dark:text-[#9CA3AF]">Min: ${minPrice}</label>
                          <input 
                            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                            max="500" 
                            min="50" 
                            type="range" 
                            value={minPrice}
                            onChange={(e) => setMinPrice(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#64748B] dark:text-[#9CA3AF]">Max: ${maxPrice}</label>
                          <input 
                            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                            max="500" 
                            min="50" 
                            type="range" 
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-[#64748B] dark:text-[#9CA3AF] mt-2">
                        <span>$50</span>
                        <span>$500</span>
                      </div>
                    </div>

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
                  <div className="shrink-0">
                    <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#ffffff] dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-[#374151] pl-4 pr-3 transition-colors hover:border-[#0ea5e9]">
                      <p className="text-sm font-medium">Sort by: Relevance</p>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
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
