import Link from "next/link";
import Layout from "../../components/Layout";

export default function CoachesPage() {
  return (
    <Layout variant="landing">

          <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Sidebar Filters */}
              <aside className="w-full lg:w-1/4 xl:w-1/5">
                <div className="sticky top-28">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Filter By</h3>
                    <button className="text-sm font-medium text-[#0ea5e9] transition-colors hover:text-[#0ea5e9]/80">Reset</button>
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
                      <div className="space-y-3 pt-2 pb-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" type="checkbox" defaultChecked />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Google</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" type="checkbox" />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Meta</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" type="checkbox" />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Amazon</span>
                        </label>
                      </div>
                    </details>

                    {/* Specialization Filter */}
                    <details className="flex flex-col border-b border-[#E2E8F0] dark:border-[#374151] py-2 group" open>
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Specialization</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="space-y-3 pt-2 pb-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" type="checkbox" defaultChecked />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">B2B SaaS</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" type="checkbox" />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Growth PM</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input className="form-checkbox rounded border-[#E2E8F0] dark:border-[#374151] bg-transparent text-[#0ea5e9] focus:ring-[#0ea5e9]/50" type="checkbox" />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">AI/ML Products</span>
                        </label>
                      </div>
                    </details>

                    {/* Price Range */}
                    <div className="border-b border-[#E2E8F0] dark:border-[#374151] py-4">
                      <p className="text-sm font-medium mb-3">Price Range</p>
                      <input className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" max="500" min="50" type="range" defaultValue="150" />
                      <div className="flex justify-between text-xs text-[#64748B] dark:text-[#9CA3AF] mt-2">
                        <span>$50</span>
                        <span>$500</span>
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <details className="flex flex-col border-b border-[#E2E8F0] dark:border-[#374151] py-2 group">
                      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                        <p className="text-sm font-medium">Rating</p>
                        <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="flex items-center gap-1 pt-2 pb-2">
                        {[1,2,3,4].map((star) => (
                          <svg key={star} className="w-4 h-4 text-[#f97316] fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                        <svg className="w-4 h-4 text-[#E2E8F0] dark:text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-sm text-[#64748B] dark:text-[#9CA3AF] ml-2">4 stars & up</span>
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
                          <input className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" name="availability" type="radio" />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Available Now</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input className="form-radio text-[#0ea5e9] focus:ring-[#0ea5e9]/50 bg-transparent border-[#E2E8F0] dark:border-[#374151]" name="availability" type="radio" />
                          <span className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Within a week</span>
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
                      <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-sm focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-[#64748B] dark:placeholder:text-[#9CA3AF] pl-2" placeholder="Search by coach name or keyword..." />
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
                  {[
                    { name: "Sarah Chen", rating: "4.9", reviews: "120", price: "$150", specialties: ["B2B SaaS", "Growth PM"], avatar: "SC" },
                    { name: "David Lee", rating: "4.8", reviews: "95", price: "$180", specialties: ["E-commerce", "Marketplaces"], avatar: "DL" },
                    { name: "Maria Garcia", rating: "5.0", reviews: "210", price: "$200", specialties: ["AI/ML", "B2C", "Startups"], avatar: "MG" },
                    { name: "John Smith", rating: "4.7", reviews: "88", price: "$160", specialties: ["Fintech", "Mobile"], avatar: "JS" },
                    { name: "Emily Brown", rating: "4.9", reviews: "156", price: "$175", specialties: ["Consumer Tech", "Growth"], avatar: "EB" },
                    { name: "Alex Johnson", rating: "4.8", reviews: "92", price: "$190", specialties: ["Enterprise", "B2B"], avatar: "AJ" }
                  ].map((coach, index) => (
                    <div key={index} className="group flex flex-col bg-[#ffffff] dark:bg-[#1F2937] rounded-xl border border-[#E2E8F0] dark:border-[#374151] p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#0ea5e9]">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-[#0ea5e9]">
                          {coach.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{coach.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4 text-[#f97316] fill-current" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <p className="text-sm font-medium">{coach.rating} <span className="text-[#64748B] dark:text-[#9CA3AF] font-normal">({coach.reviews})</span></p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mb-4 line-clamp-2">Product Leader with 10+ years of experience at top tech companies.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {coach.specialties.map((specialty, i) => (
                          <span key={i} className="text-xs font-medium bg-sky-100/80 dark:bg-sky-900/40 text-[#0ea5e9] px-2.5 py-1 rounded-full">{specialty}</span>
                        ))}
                      </div>
                      <div className="mt-auto flex justify-between items-center">
                        <p className="text-lg font-bold">{coach.price}<span className="text-sm font-normal text-[#64748B] dark:text-[#9CA3AF]">/hr</span></p>
                        <Link href={`/coaches/${index + 1}`} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0ea5e9] text-white text-sm font-bold leading-normal transition-opacity hover:opacity-90">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <nav aria-label="Pagination" className="flex items-center justify-between border-t border-[#E2E8F0] dark:border-[#374151] mt-10 pt-6">
                  <div className="hidden sm:block">
                    <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">
                      Showing <span className="font-medium text-[#0F172A] dark:text-[#F3F4F6]">1</span> to <span className="font-medium text-[#0F172A] dark:text-[#F3F4F6]">9</span> of <span className="font-medium text-[#0F172A] dark:text-[#F3F4F6]">27</span> results
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
