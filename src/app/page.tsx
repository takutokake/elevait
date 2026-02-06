import Link from "next/link";
import Image from "next/image";
import Layout from "../components/Layout";
import { getAllMentors } from "@/lib/mentorHelpers";

export default async function Home() {
  // Fetch all mentors and randomly select 4
  const allMentors = await getAllMentors();
  const shuffled = [...allMentors].sort(() => 0.5 - Math.random());
  const featuredMentors = shuffled.slice(0, 4);

  // Company logos for "Our coaches recently interviewed at"
  const companyLogos = [
    { name: 'Google', logo: '/logos/google.svg' },
    { name: 'Meta', logo: '/logos/meta.svg' },
    { name: 'Amazon', logo: '/logos/amazon.svg' },
    { name: 'Apple', logo: '/logos/apple.svg' },
    { name: 'Microsoft', logo: '/logos/microsoft.svg' },
    { name: 'Stripe', logo: '/logos/stripe.svg' },
  ];

  // Sample testimonials
  const testimonials = [
    {
      quote: "The coaching sessions were incredibly helpful in preparing me for the Capital One interview process. My coach provided detailed insights and practice that made all the difference.",
      name: "Anonymous",
      role: "Product Manager @ Capital One",
      hiredDate: "October 2025"
    },
    {
      quote: "I knew nothing about PM interviews and had never interviewed before. After working with my coach, I gained the confidence and skills needed to succeed. The transformation was incredible.",
      name: "Anonymous",
      role: "Product Management Intern @ Roblox",
      hiredDate: "November 2025"
    },
    {
      quote: "The personalized coaching and real-world interview experience shared by my coach helped me navigate the Amazon interview process successfully.",
      name: "Anonymous",
      role: "Product Management Intern @ Amazon",
      hiredDate: "December 2025"
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "Why are most coaches interns or recent grads?",
      answer: "Because they have the freshest interview experience! They remember the exact questions, the current formats, and what hiring managers are looking for RIGHT NOW. A PM who interviewed 5 years ago is less helpful than someone who interviewed 3 months ago."
    },
    {
      question: "How is this different from paid coaching platforms?",
      answer: "Traditional platforms charge $200-500 per session with senior coaches. We believe peer coaching works better—and it should be free or low-cost. Our coaches are giving back to the community that helped them."
    },
    {
      question: "Why would coaches work for free?",
      answer: "Many of our coaches got help from others during their job search and want to pay it forward. Others charge $20-40 to make coaching sustainable. Everyone sets their own rate."
    },
    {
      question: "Can I trust advice from someone who just got hired?",
      answer: "Absolutely. In fact, recent hires often give better interview prep because they remember every detail. They're also more realistic about what it takes to get hired in today's market."
    },
    {
      question: "What if I want to coach too?",
      answer: "Amazing! If you've been hired as a PM in the last 2 years, apply to become a coach. It takes 5 minutes to set up your profile and availability."
    }
  ];

  return (
    <Layout variant="landing">
      {/* Hero Section - Redesigned */}
      <div className="relative isolate overflow-hidden min-h-screen flex items-center pt-24 pb-20 sm:pt-32 sm:pb-28">

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-[#101c22]">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 bg-[radial-gradient(circle,rgba(139,92,246,0.25)_0%,rgba(0,0,0,0)_70%)] blur-3xl"></div>
          <div className="absolute top-[20%] right-0 translate-x-1/3 w-[600px] h-[600px] opacity-20 bg-[radial-gradient(circle,rgba(14,165,233,0.3)_0%,rgba(0,0,0,0)_70%)] blur-3xl"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative">
          <div className="mx-auto max-w-4xl flex flex-col items-center">

            <h1 className="text-5xl font-extrabold tracking-tight text-[#333333] dark:text-white sm:text-7xl mb-6 drop-shadow-sm">
              Learn from People Who <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6]">Just Went Through It</span>
            </h1>
            
            <p className="text-xl leading-8 text-[#333333]/70 dark:text-[#F5F5F5]/70 max-w-2xl mb-10">
              Free peer coaching from recent PM hires at top tech companies. Get real interview prep from coaches who remember every detail—because they just lived it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
              <Link href="/coaches" className="w-full sm:w-auto px-8 py-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-base font-bold rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-0.5">
                Find a Peer Coach
              </Link>
              <Link href="/mentor/apply" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-[#333333] dark:text-white border-2 border-[#0ea5e9] font-bold rounded-full hover:bg-[#0ea5e9]/10 transition-all duration-300 flex items-center justify-center gap-2 group">
                Become a Coach
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* Company Logos Section */}
            <div className="w-full max-w-3xl">
              <p className="text-sm font-medium text-[#333333]/60 dark:text-[#F5F5F5]/60 mb-4">
                Our coaches recently interviewed at:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-70">
                {companyLogos.map((company) => (
                  <div key={company.name} className="h-8 flex items-center grayscale hover:grayscale-0 transition-all">
                    <span className="text-lg font-bold text-[#333333]/50 dark:text-[#F5F5F5]/50">{company.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-3">
                All coaches hired within the last 2 years
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Peer Coaching Works Better - Value Proposition Section */}
      <div className="py-24 bg-gray-50/50 dark:bg-[#0d161b]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Why Peer Coaching Works Better</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative flex flex-col items-center text-center p-8 bg-white dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-6 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                🎯
              </div>
              <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-3">Fresh Perspective</h3>
              <p className="text-base leading-relaxed text-[#333333]/70 dark:text-[#F5F5F5]/60">
                Our coaches just went through the same interviews you're prepping for. They remember the exact questions, the panel dynamics, and what actually worked—not outdated advice from 5 years ago.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-8 bg-white dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-6 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                💰
              </div>
              <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-3">Actually Affordable</h3>
              <p className="text-base leading-relaxed text-[#333333]/70 dark:text-[#F5F5F5]/60">
                Most sessions are completely free. Coaches set their own rates, with the majority choosing to give back by coaching for free. When there is a fee, it's usually $20-40, not $200+.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-8 bg-white dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-6 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                🤝
              </div>
              <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-3">Peer-to-Peer Connection</h3>
              <p className="text-base leading-relaxed text-[#333333]/70 dark:text-[#F5F5F5]/60">
                Talk to someone who was in your shoes last year. No intimidating senior directors—just real conversations with people who get the anxiety, the rejections, and the breakthrough moments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Detailed Journey */}
      <div className="py-24 bg-white dark:bg-[#101c22]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0ea5e9] mb-2">How It Works</h2>
            <p className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Your Path to PM Interviews</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="relative flex flex-col p-8 bg-gray-50 dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="absolute top-4 right-6 text-6xl font-black text-gray-100 dark:text-gray-800/50 select-none">1</div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                🔍
              </div>
              <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-4">Find Your Peer Coach</h3>
              <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/60 mb-4">Browse coaches by:</p>
              <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-[#F5F5F5]/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Company they recently joined (Google, Meta, Stripe, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Interview timeline (hired in last 6 months, last year, last 2 years)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Specialization (APM programs, rotational roles, IC roles)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Free vs. paid sessions
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col p-8 bg-gray-50 dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="absolute top-4 right-6 text-6xl font-black text-gray-100 dark:text-gray-800/50 select-none">2</div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                📅
              </div>
              <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-4">Book a Free Session</h3>
              <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-[#F5F5F5]/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Most coaches offer free 30-45 minute sessions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Some offer paid deep-dives for $20-40
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Flexible scheduling—find times that work for you
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Video call or phone, your choice
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col p-8 bg-gray-50 dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="absolute top-4 right-6 text-6xl font-black text-gray-100 dark:text-gray-800/50 select-none">3</div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                🚀
              </div>
              <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-4">Get Real Interview Prep</h3>
              <ul className="space-y-2 text-sm text-[#333333]/70 dark:text-[#F5F5F5]/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Practice the exact case questions they were asked
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Review their actual interview notes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Learn the frameworks that got them hired
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0ea5e9]">•</span>
                  Get intros to their teams (when possible)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Meet Our Coaches Section */}
      <div className="py-24 bg-gray-50/50 dark:bg-[#0d161b]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#f97316] mb-2">Meet Our Coaches</h2>
              <p className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Recent PM Hires Ready to Help</p>
              <p className="mt-4 text-lg text-[#333333]/70 dark:text-[#F5F5F5]/70">Coaches who just went through what you're preparing for.</p>
            </div>
            <Link href="/coaches" className="hidden md:flex items-center gap-2 text-[#0ea5e9] font-bold hover:text-[#0284c7] transition-colors">
              View all coaches <span>→</span>
            </Link>
          </div>

          {featuredMentors.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {featuredMentors.map((mentor) => {
                const mentorData = mentor.mentor_data;
                const displayName = mentor.full_name || 'Anonymous Coach';
                const displayTitle = mentorData?.current_title || 'Product Manager';
                const displayCompany = mentorData?.current_company || 'Tech Company';
                const priceCents = mentorData?.price_cents;
                const pricingModel = mentorData?.pricing_model || 'free';
                const isFree = pricingModel === 'free';
                const isBoth = pricingModel === 'both' && priceCents && priceCents > 0;
                const paidPrice = priceCents ? `$${(priceCents / 100).toFixed(0)}` : null;
                const avatarUrl = mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&size=128`;
                const focusAreas = mentorData?.focus_areas?.slice(0, 3) || ['PM Interviews'];

                return (
                  <Link 
                    key={mentor.id} 
                    href={`/coaches/${mentor.id}`}
                    className="group flex-shrink-0 w-72 snap-start flex flex-col bg-white dark:bg-[#16242c] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-[#0ea5e9]/50 transition-all duration-300"
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <Image 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-[#16242c] shadow-md" 
                            alt={`Portrait of ${displayName}`} 
                            src={avatarUrl}
                            width={64}
                            height={64}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-[#333333] dark:text-white group-hover:text-[#0ea5e9] transition-colors truncate">{displayName}</h3>
                          <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 truncate">{displayTitle} @ {displayCompany}</p>
                          <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">Hired recently</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {focusAreas.map((area, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-[#333333]/70 dark:text-[#F5F5F5]/70 rounded-md">
                            {area}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                        {isBoth ? (
                          <div className="flex gap-1.5">
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              FREE
                            </span>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              {paidPrice}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${isFree ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                            {isFree ? 'FREE' : `${paidPrice}/session`}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-[#0ea5e9] group-hover:underline">
                          {isBoth ? 'View Options →' : isFree ? 'Book Free →' : 'Book Session →'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-[#16242c] rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-[#333333]/60 dark:text-[#F5F5F5]/60">
                Coaches coming soon. <Link href="/mentor/apply" className="text-[#0ea5e9] font-medium hover:underline">Apply to be a coach →</Link>
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

      {/* Social Proof / Testimonials Section */}
      <div className="py-24 bg-white dark:bg-[#101c22]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Join 500+ PMs Who Got Coached (and Hired)</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="flex flex-col p-8 bg-gray-50 dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex-1">
                  <p className="text-lg text-[#333333]/80 dark:text-[#F5F5F5]/80 italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-bold text-[#333333] dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-[#0ea5e9] font-medium">{testimonial.role}</p>
                  <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">Hired {testimonial.hiredDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-gray-50/50 dark:bg-[#0d161b]">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Common Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <details key={idx} className="group bg-white dark:bg-[#16242c] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white pr-4">{item.question}</h3>
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[#333333] dark:text-white group-open:rotate-180 transition-transform">
                    ↓
                  </span>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-[#333333]/70 dark:text-[#F5F5F5]/70 leading-relaxed">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[#333333]/70 dark:text-[#F5F5F5]/70 mb-4">Ready to get started?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/coaches" className="px-8 py-4 bg-[#f97316] hover:bg-[#ea580c] text-white text-base font-bold rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300">
                Find a Peer Coach
              </Link>
              <Link href="/mentor/apply" className="px-8 py-4 bg-white dark:bg-gray-800 text-[#333333] dark:text-white border-2 border-[#0ea5e9] font-bold rounded-full hover:bg-[#0ea5e9]/10 transition-all duration-300">
                Become a Coach
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
