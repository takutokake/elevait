import Link from "next/link";
import { notFound } from "next/navigation";
import { getMentorById, getMentorInitials, formatHourlyRate } from "@/lib/mentorHelpers";
import CoachBookingSection from "@/components/CoachBookingSection";
import Header from "@/components/Header-simple";
import BookmarkButton from "@/components/BookmarkButton";

interface CoachProfileProps {
  params: Promise<{
    id: string;
  }>;
}

// Helper to calculate months since hired
function getMonthsSinceHired(hiredDate: string | null | undefined): number | null {
  if (!hiredDate) return null;
  const hired = new Date(hiredDate);
  const now = new Date();
  const months = (now.getFullYear() - hired.getFullYear()) * 12 + (now.getMonth() - hired.getMonth());
  return months;
}

export default async function CoachProfile({ params }: CoachProfileProps) {
  const { id } = await params;
  const mentor = await getMentorById(id);

  if (!mentor) {
    notFound();
  }

  const initials = getMentorInitials(mentor.full_name);
  const hourlyRate = formatHourlyRate(mentor.mentor_data?.price_cents);
  const priceCents = mentor.mentor_data?.price_cents;
  const pricingModel = mentor.mentor_data?.pricing_model || 'free';
  const isFree = pricingModel === 'free';
  const isBoth = pricingModel === 'both' && priceCents && priceCents > 0;
  const isPaid = pricingModel === 'paid' && priceCents && priceCents > 0;
  const paidPrice = priceCents ? `$${(priceCents / 100).toFixed(0)}` : null;
  const freeDuration = mentor.mentor_data?.free_session_duration || 30;
  const paidDuration = mentor.mentor_data?.session_duration || 60;
  const rating = 0; // Will be implemented later
  const reviewCount = 0; // Will be implemented later
  
  // Get all the new fields from mentor_data
  const shortDescription = mentor.mentor_data?.short_description;
  const aboutMe = mentor.mentor_data?.about_me;
  const jobTypeTags = mentor.mentor_data?.job_type_tags || [];
  const focusAreas = mentor.mentor_data?.focus_areas || [];
  const successfulCompanies = mentor.mentor_data?.successful_companies || [];
  const companiesGotOffers = mentor.mentor_data?.companies_got_offers || [];
  const companiesInterviewed = mentor.mentor_data?.companies_interviewed || [];
  const yearsExperience = mentor.mentor_data?.years_experience;
  const totalSessions = 0; // Will be implemented later
  
  // New filter metadata fields
  const specializations = mentor.mentor_data?.specializations || [];
  const sessionTypes = mentor.mentor_data?.session_types || [];
  const offersReferrals = mentor.mentor_data?.offers_referrals || false;
  const hiredDate = mentor.mentor_data?.hired_date;
  const monthsSinceHired = getMonthsSinceHired(hiredDate);
  
  // Get total interviews from the database field
  const totalInterviews = mentor.mentor_data?.total_interviews || 0;

  return (
    <div className="font-display bg-[#F8FAFC] dark:bg-[#020617] text-[#0f172a] dark:text-[#F8FAFC]">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        {/* Header */}
        <Header variant="landing" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">
              <Link href="/coaches" className="hover:text-[#0ea5e9]">Coaches</Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[#0f172a] dark:text-[#F8FAFC]">{mentor.full_name || "Coach"}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Left Column (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Coach Header Card */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {mentor.avatar_url ? (
                      <img
                        src={mentor.avatar_url}
                        alt={mentor.full_name || "Coach"}
                        className="w-32 h-32 rounded-full object-cover flex-shrink-0 ring-4 ring-[#0ea5e9]/20"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center text-4xl font-bold text-[#0ea5e9] flex-shrink-0 ring-4 ring-[#0ea5e9]/20">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-[#F8FAFC] break-words">{mentor.full_name || "Anonymous Coach"}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {mentor.mentor_data?.current_title && (
                                <span className="text-lg text-[#0ea5e9] font-semibold">{mentor.mentor_data.current_title}</span>
                              )}
                              {mentor.mentor_data?.current_title && mentor.mentor_data?.current_company && (
                                <span className="text-[#64748B] dark:text-[#94A3B8]">@</span>
                              )}
                              {mentor.mentor_data?.current_company && (
                                <span className="text-lg text-[#64748B] dark:text-[#94A3B8] font-medium">{mentor.mentor_data.current_company}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <BookmarkButton mentorId={id} size="md" variant="profile" />
                          </div>
                        </div>
                        
                        {/* Badges Row */}
                        <div className="flex flex-wrap gap-2">
                          {monthsSinceHired !== null && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Hired {monthsSinceHired === 0 ? 'this month' : `${monthsSinceHired} month${monthsSinceHired === 1 ? '' : 's'} ago`}
                            </span>
                          )}
                          {totalInterviews > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                              🎯 {totalInterviews} interview{totalInterviews === 1 ? '' : 's'}
                            </span>
                          )}
                          {offersReferrals && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
                              🤝 Provides referrals
                            </span>
                          )}
                          {isFree ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold">
                              🎁 FREE Sessions
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-bold">
                              💰 {hourlyRate}/session
                            </span>
                          )}
                        </div>
                        
                        {shortDescription && (
                          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 italic border-l-2 border-[#0ea5e9] pl-3">"{shortDescription}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {aboutMe && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                      <span className="text-2xl">📖</span> About My Journey
                    </h2>
                    <p className="text-[#64748B] dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">{aboutMe}</p>
                  </div>
                )}

                {/* What I Can Help With - Session Types */}
                {sessionTypes.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                      <span className="text-2xl">✅</span> What I Can Help With
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sessionTypes.map((type, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                          <span className="text-[#0f172a] dark:text-[#F8FAFC] font-medium">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specializations */}
                {specializations.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                      <span className="text-2xl">🎯</span> My Specializations
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec, index) => (
                        <span key={index} className="bg-[#8b5cf6]/10 text-[#8b5cf6] px-4 py-2 rounded-full text-sm font-semibold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Journey - Combined Section */}
                {(companiesGotOffers.length > 0 || companiesInterviewed.length > 0) && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-6 flex items-center gap-2">
                      <span className="text-2xl">🚀</span> My Interview Journey
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Got Offers */}
                      {companiesGotOffers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-green-500 text-lg">✅</span>
                            <h3 className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">Got Offers From</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {companiesGotOffers.map((company, index) => (
                              <span key={index} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-200 dark:border-green-800">
                                {company}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Interviewed At */}
                      {companiesInterviewed.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-blue-500 text-lg">📝</span>
                            <h3 className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">Interviewed At</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {companiesInterviewed.map((company, index) => (
                              <span key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800">
                                {company}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Student Success Stories */}
                {successfulCompanies.length > 0 && (
                  <div className="bg-gradient-to-r from-[#0ea5e9]/5 to-[#8b5cf6]/5 dark:from-[#0ea5e9]/10 dark:to-[#8b5cf6]/10 rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                      <span className="text-2xl">🏆</span> Student Success Stories
                    </h2>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
                      I've helped students land offers or interviews at these companies:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {successfulCompanies.map((company, index) => (
                        <span key={index} className="bg-white dark:bg-[#0f172a] text-[#0ea5e9] px-4 py-2 rounded-lg text-sm font-semibold border border-[#0ea5e9]/30 shadow-sm">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Sticky on Desktop */}
              <div className="lg:sticky lg:top-8 space-y-6 h-fit">
                {/* Book a Session - Primary CTA */}
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-6 shadow-lg text-white border border-slate-600/50">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    📅 Book a Session
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    Get personalized 1-on-1 coaching to accelerate your career.
                  </p>
                  
                  {/* Pricing Display */}
                  {isBoth ? (
                    <div className="space-y-3 mb-4">
                      <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <span className="font-bold">Free Session</span>
                          <p className="text-white/70 text-xs">{freeDuration} minutes</p>
                        </div>
                        <span className="text-lg font-bold text-green-300">FREE</span>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <span className="font-bold">Paid Session</span>
                          <p className="text-white/70 text-xs">{paidDuration} minutes</p>
                        </div>
                        <span className="text-lg font-bold text-yellow-300">{paidPrice}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/10 rounded-lg p-4 mb-4">
                      {isFree ? (
                        <div className="text-center">
                          <span className="text-3xl font-bold">FREE</span>
                          <p className="text-white/70 text-sm mt-1">{freeDuration}-minute session</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-3xl font-bold">{hourlyRate}</span>
                          <span className="text-white/70">/session</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CoachBookingSection
                    coachId={id}
                    coachName={mentor.full_name || "Coach"}
                    hourlyRate={isBoth ? 'BOTH' : hourlyRate}
                    pricingModel={pricingModel}
                    paidPrice={paidPrice || undefined}
                    freeDuration={freeDuration}
                    paidDuration={paidDuration}
                  />
                </div>

                {/* Quick Stats */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    {yearsExperience && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                          <span>💼</span> Experience
                        </span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{yearsExperience} years</span>
                      </div>
                    )}
                    {totalInterviews > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                          <span>🎯</span> Interviews
                        </span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{totalInterviews}+</span>
                      </div>
                    )}
                    {companiesGotOffers.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                          <span>✅</span> Offers
                        </span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{companiesGotOffers.length}</span>
                      </div>
                    )}
                    {mentor.mentor_data?.alumni_school && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                          <span>🎓</span> School
                        </span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC] text-right text-sm">{mentor.mentor_data.alumni_school}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                {mentor.mentor_data?.linkedin_url && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Connect</h3>
                    <a
                      href={mentor.mentor_data.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border border-[#0077b5] text-[#0077b5] py-3 rounded-lg font-semibold hover:bg-[#0077b5] hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      View LinkedIn
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
