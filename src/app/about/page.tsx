import Link from "next/link";
import Header from "@/components/Header-simple";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#101c22]">
      <Header variant="landing" />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-16 pb-12 sm:pt-20 sm:pb-16 bg-gradient-to-b from-[#0ea5e9]/5 to-white dark:from-[#0ea5e9]/10 dark:to-[#101c22]">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-x-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 dark:bg-[#0ea5e9]/20 px-4 py-2 text-sm font-semibold text-[#0ea5e9] mb-6">
                <span>About Elevait</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-5xl">
                Your Career Through <span className="text-[#0ea5e9]">Personalized Coaching</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80 max-w-2xl mx-auto">
                Supporting students and new grads in landing their first PM roles and internships through tailored guidance.
              </p>
            </div>
          </div>
        </div>

        {/* What is Elevait */}
        <div className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-[#0ea5e9]/5 to-gray-50 dark:from-gray-900/20 dark:via-[#0ea5e9]/10 dark:to-gray-900/20">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="relative">
              {/* Decorative element */}
              <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-[#0ea5e9] via-[#8b5cf6] to-[#f97316] rounded-full"></div>
              
              <div className="pl-8">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#333333] dark:text-white">
                    What is Elevait?
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <p className="text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    Elevait is a <span className="font-semibold text-[#0ea5e9]">personalized coaching platform</span> designed specifically for students and new graduates pursuing product management roles and internships.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="group p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-[#0ea5e9]/20 hover:border-[#0ea5e9] hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl mb-2">🎯</div>
                      <p className="text-sm font-semibold text-[#333333] dark:text-white mb-1">Tailored Guidance</p>
                      <p className="text-xs text-[#333333]/70 dark:text-[#F5F5F5]/70">Company-specific interview prep</p>
                    </div>
                    
                    <div className="group p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-[#8b5cf6]/20 hover:border-[#8b5cf6] hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl mb-2">👥</div>
                      <p className="text-sm font-semibold text-[#333333] dark:text-white mb-1">Expert Mentors</p>
                      <p className="text-xs text-[#333333]/70 dark:text-[#F5F5F5]/70">Industry professionals</p>
                    </div>
                    
                    <div className="group p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-[#f97316]/20 hover:border-[#f97316] hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl mb-2">💼</div>
                      <p className="text-sm font-semibold text-[#333333] dark:text-white mb-1">First PM Role</p>
                      <p className="text-xs text-[#333333]/70 dark:text-[#F5F5F5]/70">Land your dream position</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why was Elevait born */}
        <div className="py-16 sm:py-20 bg-white dark:bg-[#101c22] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.05),transparent_50%)]"></div>
          
          <div className="mx-auto max-w-4xl px-6 lg:px-8 relative">
            <div className="flex items-start gap-6">
              {/* Icon column */}
              <div className="hidden md:flex flex-col items-center gap-4 pt-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#8b5cf6]/5 flex items-center justify-center border-2 border-[#8b5cf6]/30">
                  <span className="text-2xl">💡</span>
                </div>
                <div className="w-0.5 h-full bg-gradient-to-b from-[#8b5cf6]/30 to-transparent"></div>
              </div>
              
              {/* Content column */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-6 flex items-center gap-3">
                  <span className="md:hidden text-2xl">💡</span>
                  Why was Elevait born?
                </h2>
                
                {/* Problem card */}
                <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-200/50 dark:border-red-800/30">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xl">⚠️</span>
                    <h3 className="font-semibold text-[#333333] dark:text-white">The Problem</h3>
                  </div>
                  <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 leading-relaxed">
                    The recruitment process for PM roles is often <span className="font-semibold text-red-600 dark:text-red-400">hidden and inaccessible</span> to students and new grads. Most interview preparation resources are generic and don't address the specific challenges faced by those seeking their first PM role or internship.
                  </p>
                </div>
                
                {/* Solution card */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-[#8b5cf6]/5 to-[#0ea5e9]/5 dark:from-[#8b5cf6]/10 dark:to-[#0ea5e9]/10 border border-[#8b5cf6]/20 hover:border-[#8b5cf6]/40 transition-colors duration-300">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xl">✨</span>
                    <h3 className="font-semibold text-[#333333] dark:text-white">The Solution</h3>
                  </div>
                  <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80 leading-relaxed mb-4">
                    Elevait was founded by a <span className="font-semibold text-[#8b5cf6]">USC student</span> who experienced this gap firsthand. After successfully helping classmates prepare for PM interviews at various companies, he realized the power of personalized, company-specific coaching.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70">
                    <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
                    <span>Making expert coaching accessible to all students and new graduates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Principles */}
        <div className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/20 dark:to-[#101c22]">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-4">
              Our Mission & Principles
            </h2>
            <p className="text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-8">
              Our mission is to help students and new graduates successfully transition from interview to offer through personalized coaching that's tailored to each company's specific interview style.
            </p>
            <div className="space-y-6">
              <div className="group flex gap-4 p-4 rounded-xl hover:bg-[#0ea5e9]/5 transition-all duration-300 cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#0ea5e9]/10 group-hover:bg-[#0ea5e9]/20 flex items-center justify-center transition-colors">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#0ea5e9] transition-colors">Personalized Approach</h3>
                  <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    Every coaching session is customized to your target company and role, based on real interview experiences.
                  </p>
                </div>
              </div>
              <div className="group flex gap-4 p-4 rounded-xl hover:bg-[#8b5cf6]/5 transition-all duration-300 cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#8b5cf6]/10 group-hover:bg-[#8b5cf6]/20 flex items-center justify-center transition-colors">
                  <span className="text-2xl">🤝</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#8b5cf6] transition-colors">Continuous Support</h3>
                  <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    We guide you through every step of the process until you land your offer—not just one-off advice.
                  </p>
                </div>
              </div>
              <div className="group flex gap-4 p-4 rounded-xl hover:bg-[#f97316]/5 transition-all duration-300 cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#f97316]/10 group-hover:bg-[#f97316]/20 flex items-center justify-center transition-colors">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#f97316] transition-colors">Student-Focused</h3>
                  <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                    Built specifically for students and new grads seeking PM roles and internships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why use Elevait */}
        <div className="py-16 sm:py-20 bg-gradient-to-b from-white to-[#0ea5e9]/5 dark:from-[#101c22] dark:to-[#0ea5e9]/10">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-4">
              Why use Elevait?
            </h2>
            <div className="space-y-4">
              <div className="group border-l-4 border-[#0ea5e9] pl-4 py-3 hover:pl-6 transition-all duration-300">
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#0ea5e9] transition-colors">Company-Specific Preparation</h3>
                <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                  Get insights and strategies tailored to the specific companies you're interviewing with, not generic advice.
                </p>
              </div>
              <div className="group border-l-4 border-[#8b5cf6] pl-4 py-3 hover:pl-6 transition-all duration-300">
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#8b5cf6] transition-colors">Experienced Mentors</h3>
                <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                  Work with mentors who have successfully navigated PM interviews and understand what it takes to land offers.
                </p>
              </div>
              <div className="group border-l-4 border-[#f97316] pl-4 py-3 hover:pl-6 transition-all duration-300">
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#f97316] transition-colors">New Grad & Internship Focus</h3>
                <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                  Unlike other platforms, we specialize in helping students and new grads break into PM—whether for internships or full-time roles.
                </p>
              </div>
              <div className="group border-l-4 border-[#0ea5e9] pl-4 py-3 hover:pl-6 transition-all duration-300">
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#0ea5e9] transition-colors">End-to-End Support</h3>
                <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                  From resume reviews to mock interviews to offer negotiations—we're with you throughout your entire journey.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Who We Serve */}
        <div className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900/20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-4">
              Who We Serve
            </h2>
            <p className="text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
              Elevait is built for:
            </p>
            <ul className="space-y-3 text-lg text-[#333333]/80 dark:text-[#F5F5F5]/80">
              <li className="flex items-start gap-3">
                <span className="text-[#0ea5e9] mt-1">✓</span>
                <span><strong className="text-[#333333] dark:text-white">Students</strong> seeking PM internships at top companies</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0ea5e9] mt-1">✓</span>
                <span><strong className="text-[#333333] dark:text-white">New graduates</strong> pursuing their first full-time PM role</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0ea5e9] mt-1">✓</span>
                <span><strong className="text-[#333333] dark:text-white">Career switchers</strong> transitioning into product management early in their career</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">
              Ready to Land Your First PM Role?
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Join students and new graduates who are breaking into product management with personalized coaching.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/coaches" className="w-full sm:w-auto flex items-center justify-center rounded-full h-12 px-8 bg-[#0ea5e9] text-white text-base font-semibold hover:bg-[#0ea5e9]/90 transition-colors">
                <span>Find Your Coach</span>
              </Link>
              <Link href="/signup" className="w-full sm:w-auto flex items-center justify-center rounded-full h-12 px-8 border-2 border-[#0ea5e9] text-[#0ea5e9] text-base font-semibold hover:bg-[#0ea5e9]/5 transition-colors">
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
