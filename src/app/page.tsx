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
      <div className="relative isolate overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-[#101c22]">
           {/* Subtle Grid Pattern overlay */}
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 bg-[radial-gradient(circle,rgba(139,92,246,0.25)_0%,rgba(0,0,0,0)_70%)] blur-3xl"></div>
          <div className="absolute top-[20%] right-0 translate-x-1/3 w-[600px] h-[600px] opacity-20 bg-[radial-gradient(circle,rgba(14,165,233,0.3)_0%,rgba(0,0,0,0)_70%)] blur-3xl"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative">
          <div className="mx-auto max-w-4xl flex flex-col items-center">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-x-2 rounded-full border border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-[#333333] dark:text-[#F5F5F5] shadow-sm mb-8 transition-transform hover:scale-105 cursor-default">
              <span className="flex h-2 w-2 rounded-full bg-[#0ea5e9] animate-pulse"></span>
              <span className="text-[#333333]/80 dark:text-[#F5F5F5]/80">Trusted by leaders at top tech companies</span>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-[#333333] dark:text-white sm:text-7xl mb-6 drop-shadow-sm">
              Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6]">Product Potential</span>
            </h1>
            
            <p className="text-xl leading-8 text-[#333333]/70 dark:text-[#F5F5F5]/70 max-w-2xl mb-10">
              Connect with elite coaches, find exclusive jobs, and accelerate your career journey with personalized guidance from the industry's best.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/coaches" className="w-full sm:w-auto px-8 py-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-base font-bold rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-0.5">
                Find Your Coach
              </Link>
              <Link href="/jobs" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-[#333333] dark:text-white border border-gray-200 dark:border-gray-700 font-bold rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all duration-300 flex items-center justify-center gap-2 group">
                Explore Jobs 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-gray-50/50 dark:bg-[#0d161b]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0ea5e9] mb-2">How It Works</h2>
            <p className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Your Path to Career Growth</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { 
                emoji: "👥", 
                title: "Find Your Coach", 
                desc: "Browse our curated list of expert product management coaches to find the perfect fit.",
                color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
              },
              { 
                emoji: "📅", 
                title: "Book a Session", 
                desc: "Schedule one-on-one sessions at your convenience and get personalized guidance.",
                color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              },
              { 
                emoji: "💼", 
                title: "Land Your Dream Job", 
                desc: "Apply to exclusive job listings and leverage your new skills to get hired faster.",
                color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center p-8 bg-white dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-6 ${step.color}`}>
                  {step.emoji}
                </div>
                <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-3">{step.title}</h3>
                <p className="text-base leading-relaxed text-[#333333]/70 dark:text-[#F5F5F5]/60">{step.desc}</p>
                {/* Step Number Watermark */}
                <div className="absolute top-4 right-6 text-6xl font-black text-gray-50 dark:text-gray-800/50 -z-10 select-none opacity-50">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Coaches Section */}
      <div className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#f97316] mb-2">Mentorship</h2>
              <p className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Featured Coaches</p>
              <p className="mt-4 text-lg text-[#333333]/70 dark:text-[#F5F5F5]/70">Industry experts ready to help you succeed.</p>
            </div>
            <Link href="/coaches" className="hidden md:flex items-center gap-2 text-[#0ea5e9] font-bold hover:text-[#0284c7] transition-colors">
              View all coaches <span>→</span>
            </Link>
          </div>

          {featuredMentors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredMentors.map((mentor) => {
                const mentorData = mentor.mentor_data;
                const displayName = mentor.full_name || 'Anonymous Coach';
                const displayTitle = mentorData?.current_title || 'Product Manager';
                const displayCompany = mentorData?.current_company || 'Tech Company';
                const displayPrice = mentorData?.price_cents ? `$${(mentorData.price_cents / 100).toFixed(0)}/hr` : 'Contact';
                const avatarUrl = mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&size=128`;
                const focusAreas = mentorData?.focus_areas?.slice(0, 2).join(', ') || 'Product Management';

                return (
                  <Link 
                    key={mentor.id} 
                    href={`/coaches/${mentor.id}`}
                    className="group relative flex flex-col bg-white dark:bg-[#16242c] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-[#0ea5e9]/50 transition-all duration-300"
                  >
                    <div className="p-6 flex flex-col items-center text-center h-full">
                      {/* Avatar with Ring */}
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#0ea5e9] to-[#8b5cf6] rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <Image 
                          className="relative w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#16242c] shadow-md group-hover:scale-105 transition-transform duration-300" 
                          alt={`Portrait of ${displayName}`} 
                          src={avatarUrl}
                          width={96}
                          height={96}
                        />
                      </div>

                      <h3 className="text-lg font-bold text-[#333333] dark:text-white group-hover:text-[#0ea5e9] transition-colors line-clamp-1">{displayName}</h3>
                      <p className="text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80 mt-1 line-clamp-1">{displayTitle}</p>
                      <p className="text-xs font-semibold text-[#333333]/50 dark:text-[#F5F5F5]/50 uppercase tracking-wide mt-1 mb-4">{displayCompany}</p>
                      
                      <div className="mt-auto w-full pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#333333] dark:text-white">{displayPrice}</span>
                        <span className="text-xs font-semibold text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-1 rounded-md">View Profile</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 dark:bg-[#16242c] rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-[#333333]/60 dark:text-[#F5F5F5]/60">
                Featured coaches coming soon.
              </p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/coaches" className="inline-flex items-center gap-2 text-[#0ea5e9] font-bold">
              View all coaches <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
