import Link from "next/link";
import Image from "next/image";
import Layout from "../components/Layout";
import { getAllMentors } from "@/lib/mentorHelpers";

export default async function Home() {
  // Fetch all mentors and randomly select 4
  const allMentors = await getAllMentors();
  const shuffled = [...allMentors].sort(() => 0.5 - Math.random());
  const featuredMentors = shuffled.slice(0, 4);

  return (
    <Layout variant="landing">

              {/* Hero Section */}
              <div className="relative isolate overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
                <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-[#101c22]"></div>
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.2),rgba(16,28,34,0))]"></div>
                <div aria-hidden="true" className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu overflow-hidden opacity-30 blur-3xl">
                  <div className="ml-[max(50%,38rem)] aspect-[1.2/1] w-[115.1875rem] bg-gradient-to-tr from-[#f97316] to-[#0ea5e9]" style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}}></div>
                </div>
                <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
                  <div className="mx-auto max-w-3xl">
                    <div className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
                      <span className="text-[#0ea5e9] font-semibold">Trusted By</span>
                      <span className="h-4 w-px bg-gray-300 dark:bg-gray-600"></span>
                      <span>Product leaders at top companies</span>
                    </div>
                    <h1 className="mt-6 text-4xl font-black tracking-tight text-[#333333] dark:text-white sm:text-6xl">Unlock Your Product Management Potential</h1>
                    <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">Connect with elite coaches, find exclusive jobs, and accelerate your career journey with personalized guidance.</p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                      <Link href="/coaches" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-[#f97316] hover:bg-[#f97316]/90 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors">
                        <span className="truncate">Find Your Coach</span>
                      </Link>
                      <Link className="text-sm font-semibold leading-6 text-[#333333] dark:text-[#F5F5F5] group" href="/jobs">
                        Explore Jobs <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* How It Works Section */}
              <div className="py-16 sm:py-24">
                <div className="mx-auto max-w-5xl px-6 lg:px-8">
                  <div className="text-center">
                    <h2 className="text-base font-semibold leading-7 text-[#0ea5e9]">How It Works</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">A Simple Path to Career Growth</p>
                    <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">Everything you need to level up, in three easy steps.</p>
                  </div>
                  <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="group relative flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[#8b5cf6]/30">
                      <div className="absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-[#f5f7f8] dark:bg-[#101c22] text-lg font-bold text-[#8b5cf6]">1</div>
                      <div className="text-[#8b5cf6]"><span className="text-4xl">👥</span></div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-[#333333] dark:text-white">Find Your Coach</h3>
                        <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">Browse our curated list of expert product management coaches to find the perfect fit for your goals.</p>
                      </div>
                    </div>
                    <div className="group relative flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[#8b5cf6]/30">
                      <div className="absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-[#f5f7f8] dark:bg-[#101c22] text-lg font-bold text-[#8b5cf6]">2</div>
                      <div className="text-[#8b5cf6]"><span className="text-4xl">📅</span></div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-[#333333] dark:text-white">Book a Session</h3>
                        <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">Schedule one-on-one sessions at your convenience and get personalized guidance.</p>
                      </div>
                    </div>
                    <div className="group relative flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[#8b5cf6]/30">
                      <div className="absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-[#f5f7f8] dark:bg-[#101c22] text-lg font-bold text-[#8b5cf6]">3</div>
                      <div className="text-[#f97316]"><span className="text-4xl">💼</span></div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-[#333333] dark:text-white">Land Your Dream Job</h3>
                        <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">Apply to exclusive job listings and leverage your new skills to get hired faster.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Coaches Section */}
              <div className="py-16 sm:py-24">
                <div className="text-center mb-12">
                  <h2 className="text-base font-semibold leading-7 text-[#0ea5e9]">World-Class Mentors</h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Featured Coaches</p>
                  <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">Industry experts ready to help you succeed.</p>
                </div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  {featuredMentors.length > 0 ? (
                    <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth justify-center" style={{scrollbarWidth: "none", msOverflowStyle: "none"}}>
                      {featuredMentors.map((mentor) => {
                        const mentorData = mentor.mentor_data;
                        const displayName = mentor.full_name || 'Anonymous Coach';
                        const displayTitle = mentorData?.current_title || 'Product Manager';
                        const displayCompany = mentorData?.current_company || 'Tech Company';
                        const displayPrice = mentorData?.price_cents ? `$${(mentorData.price_cents / 100).toFixed(0)}/hr` : 'Contact for pricing';
                        const avatarUrl = mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&size=96`;
                        const focusAreas = mentorData?.focus_areas?.slice(0, 2).join(', ') || 'Product Management';

                        return (
                          <Link 
                            key={mentor.id} 
                            href={`/coaches/${mentor.id}`}
                            className="flex-shrink-0 w-72 snap-center rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden group border border-gray-200 dark:border-gray-700 transform transition-transform duration-300 hover:-translate-y-2"
                          >
                            <div className="h-40 bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 relative">
                              <Image 
                                className="w-24 h-24 rounded-full object-cover absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-4 border-white dark:border-gray-800" 
                                alt={`Portrait of ${displayName}`} 
                                src={avatarUrl}
                                width={96}
                                height={96}
                              />
                            </div>
                            <div className="p-6 pt-16 flex flex-col items-center text-center">
                              <h3 className="text-lg font-bold text-[#333333] dark:text-white">{displayName}</h3>
                              <p className="text-sm text-[#0ea5e9] font-medium">{displayTitle}</p>
                              <p className="text-xs text-[#333333]/60 dark:text-[#F5F5F5]/60 mt-1">{displayCompany}</p>
                              <p className="text-xs text-[#333333]/70 dark:text-[#F5F5F5]/70 mt-2">{focusAreas}</p>
                              <div className="flex items-center gap-1 text-[#f97316] mt-3">
                                <span className="text-sm font-bold">{displayPrice}</span>
                              </div>
                              <div className="w-full mt-4 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#f97316]/10 dark:bg-[#f97316]/20 text-[#f97316] text-sm font-bold leading-normal tracking-[0.015em] group-hover:bg-[#f97316] group-hover:text-white transition-colors duration-300">
                                <span className="truncate">View Profile</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                        Featured coaches coming soon! Check out our{' '}
                        <Link href="/coaches" className="text-[#0ea5e9] font-semibold hover:underline">
                          full coaches page
                        </Link>
                        .
                      </p>
                    </div>
                  )}
                </div>
              </div>
    </Layout>
  )
}
