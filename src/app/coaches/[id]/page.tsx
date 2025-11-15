import Link from "next/link";

interface CoachProfileProps {
  params: {
    id: string;
  };
}

export default function CoachProfile({ params }: CoachProfileProps) {
  // Mock coach data - in real app this would come from API
  const coach = {
    name: "Sarah Chen",
    title: "Senior Product Manager",
    company: "Ex-Google, Meta",
    rating: "4.9",
    reviews: "120",
    price: "$150",
    bio: "I'm a seasoned Product Manager with over 8 years of experience at top tech companies including Google and Meta. I specialize in B2B SaaS products and have helped launch multiple products that reached millions of users. My passion is helping aspiring PMs break into the field and current PMs level up their careers.",
    experience: "8+ years",
    specialties: ["B2B SaaS", "Growth PM", "Product Strategy", "User Research"],
    achievements: [
      "Led product team that increased user engagement by 40%",
      "Launched 3 successful products with 10M+ users",
      "Mentored 50+ product managers",
      "Speaker at ProductCon 2023"
    ],
    availability: [
      { day: "Monday", time: "2:00 PM - 3:00 PM", available: true },
      { day: "Tuesday", time: "10:00 AM - 11:00 AM", available: true },
      { day: "Wednesday", time: "4:00 PM - 5:00 PM", available: false },
      { day: "Thursday", time: "1:00 PM - 2:00 PM", available: true },
      { day: "Friday", time: "3:00 PM - 4:00 PM", available: true }
    ]
  };

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
              <span className="text-[#0f172a] dark:text-[#F8FAFC]">{coach.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Coach Header */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center text-4xl font-bold text-[#0ea5e9] flex-shrink-0">
                      SC
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <h1 className="text-3xl font-bold text-[#0f172a] dark:text-[#F8FAFC]">{coach.name}</h1>
                          <p className="text-lg text-[#0ea5e9] font-semibold mt-1">{coach.title}</p>
                          <p className="text-[#64748B] dark:text-[#94A3B8] mt-1">{coach.company}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <svg className="w-5 h-5 text-[#f97316] fill-current" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              <span className="font-semibold">{coach.rating}</span>
                              <span className="text-[#64748B] dark:text-[#94A3B8]">({coach.reviews} reviews)</span>
                            </div>
                            <div className="text-2xl font-bold text-[#0f172a] dark:text-[#F8FAFC]">
                              {coach.price}<span className="text-base font-normal text-[#64748B] dark:text-[#94A3B8]">/session</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">About</h2>
                  <p className="text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{coach.bio}</p>
                </div>

                {/* Specialties */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((specialty, index) => (
                      <span key={index} className="bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1.5 rounded-full text-sm font-medium">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Achievements */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Key Achievements</h2>
                  <ul className="space-y-3">
                    {coach.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[#64748B] dark:text-[#94A3B8]">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Experience</span>
                      <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{coach.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Sessions</span>
                      <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{coach.reviews}+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Response Time</span>
                      <span className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">&lt; 2 hours</span>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Available Times</h3>
                  <div className="space-y-3">
                    {coach.availability.map((slot, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                        slot.available 
                          ? 'border-[#10b981]/20 bg-[#10b981]/5' 
                          : 'border-[#E2E8F0] dark:border-[#1e293b] bg-[#F8FAFC] dark:bg-[#1e293b]/50'
                      }`}>
                        <div>
                          <p className="font-medium text-[#0f172a] dark:text-[#F8FAFC]">{slot.day}</p>
                          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{slot.time}</p>
                        </div>
                        {slot.available ? (
                          <button className="bg-[#0ea5e9] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0ea5e9]/90 transition-colors">
                            Book
                          </button>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] text-sm">Booked</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 bg-[#0ea5e9] text-white py-3 rounded-lg font-semibold hover:bg-[#0ea5e9]/90 transition-colors">
                    View All Available Times
                  </button>
                </div>

                {/* Contact */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4">Get in Touch</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-[#0ea5e9] text-white py-3 rounded-lg font-semibold hover:bg-[#0ea5e9]/90 transition-colors">
                      Send Message
                    </button>
                    <button className="w-full border border-[#E2E8F0] dark:border-[#1e293b] text-[#0f172a] dark:text-[#F8FAFC] py-3 rounded-lg font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#1e293b] transition-colors">
                      View LinkedIn
                    </button>
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
