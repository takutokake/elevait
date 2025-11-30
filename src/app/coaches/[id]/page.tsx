import Link from "next/link";
import { notFound } from "next/navigation";
import { getMentorById, getMentorInitials, formatHourlyRate } from "@/lib/mentorHelpers";
import CoachBookingSection from "@/components/CoachBookingSection";
import Header from "@/components/Header-simple";

interface CoachProfileProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CoachProfile({ params }: CoachProfileProps) {
  const { id } = await params;
  const mentor = await getMentorById(id);

  if (!mentor) {
    notFound();
  }

  const initials = getMentorInitials(mentor.full_name);
  const hourlyRate = formatHourlyRate(mentor.mentor_data?.price_cents);
  const rating = 0; // Will be implemented later
  const reviewCount = 0; // Will be implemented later
  
  // Get all the new fields from mentor_data
  const shortDescription = mentor.mentor_data?.short_description;
  const aboutMe = mentor.mentor_data?.about_me;
  const jobTypeTags = mentor.mentor_data?.job_type_tags || [];
  const specialties = mentor.mentor_data?.specialties || mentor.mentor_data?.focus_areas || [];
  const successfulCompanies = mentor.mentor_data?.successful_companies || [];
  const companiesGotOffers = mentor.mentor_data?.companies_got_offers || [];
  const companiesInterviewed = mentor.mentor_data?.companies_interviewed || [];
  const yearsExperience = mentor.mentor_data?.years_experience;
  const totalSessions = 0; // Will be implemented later

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
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Coach Header */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {mentor.avatar_url ? (
                      <img
                        src={mentor.avatar_url}
                        alt={mentor.full_name || "Coach"}
                        className="w-32 h-32 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center text-4xl font-bold text-[#0ea5e9] flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <h1 className="text-3xl font-bold text-[#0f172a] dark:text-[#F8FAFC]">{mentor.full_name || "Anonymous Coach"}</h1>
                          {mentor.mentor_data?.current_title && (
                            <p className="text-lg text-[#0ea5e9] font-semibold mt-1">{mentor.mentor_data.current_title}</p>
                          )}
                          {mentor.mentor_data?.current_company && (
                            <p className="text-[#64748B] dark:text-[#94A3B8] mt-1">{mentor.mentor_data.current_company}</p>
                          )}
                          {shortDescription && (
                            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 italic">"{shortDescription}"</p>
                          )}
                          <div className="flex items-center gap-4 mt-3">
                            <div className="text-2xl font-bold text-[#0f172a] dark:text-[#F8FAFC]">
                              {hourlyRate}{mentor.mentor_data?.price_cents && <span className="text-base font-normal text-[#64748B] dark:text-[#94A3B8]">/hr</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section - use about_me */}
                {aboutMe && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">About Me</h2>
                    <p className="text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{aboutMe}</p>
                  </div>
                )}

                {/* Job Type Tags */}
                {jobTypeTags.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Role Types</h2>
                    <div className="flex flex-wrap gap-2">
                      {jobTypeTags.map((tag, index) => (
                        <span key={index} className="bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full text-sm font-medium capitalize">
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Specialties</h2>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty, index) => (
                        <span key={index} className="bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1.5 rounded-full text-sm font-medium capitalize">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies Helped Students Get Into */}
                {successfulCompanies.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Student Success Stories</h2>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-3">
                      Helped students get offers or interviews at:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {successfulCompanies.map((company, index) => (
                        <span key={index} className="bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1.5 rounded-full text-sm font-medium">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies Got Offers From */}
                {companiesGotOffers.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">My Offers</h2>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-3">
                      Received offers from:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {companiesGotOffers.map((company, index) => (
                        <span key={index} className="bg-[#8b5cf6]/10 text-[#8b5cf6] px-3 py-1.5 rounded-full text-sm font-medium">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies Interviewed At */}
                {companiesInterviewed.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">My Interview Experience</h2>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-3">
                      Interviewed at:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {companiesInterviewed.map((company, index) => (
                        <span key={index} className="bg-[#f97316]/10 text-[#f97316] px-3 py-1.5 rounded-full text-sm font-medium">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    {yearsExperience && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Experience</span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{yearsExperience} years</span>
                      </div>
                    )}
                    {totalSessions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Sessions</span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{totalSessions}+</span>
                      </div>
                    )}
                    {mentor.mentor_data?.alumni_school && (
                      <div className="flex justify-between">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Current School/Alumni</span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{mentor.mentor_data.alumni_school}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <CoachBookingSection
                  coachId={id}
                  coachName={mentor.full_name || "Coach"}
                  hourlyRate={hourlyRate}
                />

                {/* Contact */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Get in Touch</h3>
                  <div className="space-y-3">
                    {mentor.mentor_data?.linkedin_url && (
                      <a
                        href={mentor.mentor_data.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full border border-[#E2E8F0] dark:border-[#1e293b] text-[#0f172a] dark:text-[#F8FAFC] py-3 rounded-lg font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#1e293b] transition-colors flex items-center justify-center"
                      >
                        View LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
