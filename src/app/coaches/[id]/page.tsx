import Link from "next/link";
import { notFound } from "next/navigation";
import { getMentorById, getMentorInitials, formatHourlyRate } from "@/lib/mentorHelpers";

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
  const keyAchievements = mentor.mentor_data?.key_achievements || [];
  const successfulCompanies = mentor.mentor_data?.successful_companies || [];
  const yearsExperience = mentor.mentor_data?.years_experience;
  const totalSessions = 0; // Will be implemented later

  return (
    <div className="font-display bg-[#F8FAFC] dark:bg-[#020617] text-[#0f172a] dark:text-[#F8FAFC]">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#E2E8F0] dark:border-[#1e293b] px-4 sm:px-6 lg:px-10 py-4 bg-[#FFFFFF] dark:bg-[#0f172a] sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link className="text-2xl font-bold text-[#0ea5e9]" href="/">ELEVAIT</Link>
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#94A3B8] transition-colors hover:text-[#0ea5e9]" href="/coaches">Coaches</Link>
            <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#94A3B8] transition-colors hover:text-[#0ea5e9]" href="/jobs">Jobs</Link>
            <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#94A3B8] transition-colors hover:text-[#0ea5e9]" href="/about">About</Link>
            <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#94A3B8] transition-colors hover:text-[#0ea5e9]" href="/blog">Blog</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] transition-colors text-[#0ea5e9] hover:bg-[#0ea5e9]/10">
              Log In
            </button>
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0ea5e9] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-opacity hover:opacity-90">
              Get Started
            </button>
          </div>
        </header>

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

                {/* Key Achievements */}
                {keyAchievements.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Key Achievements</h2>
                    <ul className="space-y-3">
                      {keyAchievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[#64748B] dark:text-[#94A3B8]">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Successful Companies */}
                {successfulCompanies.length > 0 && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Interview Success</h2>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-3">
                      Helped students get offers or interviews at:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {successfulCompanies.map((company, index) => (
                        <span key={index} className="bg-green-100/80 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Info */}
                {yearsExperience && (
                  <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Experience</h2>
                    <p className="text-[#64748B] dark:text-[#94A3B8]">
                      {yearsExperience} years of professional experience in product management and mentoring.
                    </p>
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
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Alumni</span>
                        <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{mentor.mentor_data.alumni_school}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Book a Session</h3>
                  <p className="text-[#64748B] dark:text-[#94A3B8] mb-4 text-sm">
                    Schedule a 1-on-1 mentoring session to discuss your career goals and get personalized guidance.
                  </p>
                  <button className="w-full bg-[#0ea5e9] text-white py-3 rounded-lg font-semibold hover:bg-[#0ea5e9]/90 transition-colors">
                    View Available Times
                  </button>
                </div>

                {/* Contact */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Get in Touch</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-[#0ea5e9] text-white py-3 rounded-lg font-semibold hover:bg-[#0ea5e9]/90 transition-colors">
                      Send Message
                    </button>
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
