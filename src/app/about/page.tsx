import Link from "next/link";
import Layout from "../../components/Layout";

export default function AboutPage() {
  return (
    <Layout variant="landing">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-[#101c22]"></div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(40%_100%_at_50%_0%,rgba(139,92,246,0.2),rgba(16,28,34,0))]"></div>
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
              <span className="text-[#0ea5e9] font-semibold">About</span>
              <span className="h-4 w-px bg-gray-300 dark:bg-gray-600"></span>
              <span>Bridging the gap to your first PM role</span>
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-[#333333] dark:text-white sm:text-6xl">Unlocking Hidden Opportunities for New Grads</h1>
            <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">Most recruitment processes are hidden and inaccessible to students and new graduates. We're changing that by providing personalized interview coaching and direct access to product management opportunities.</p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-base font-semibold leading-7 text-[#0ea5e9]">Our Mission</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Smooth Integration Into Your Early Career</p>
            <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">
              We believe every student and new graduate deserves access to the hidden job market. Our mission is to help you quickly transition from interview to offer by providing personalized coaching that holds your hand through the entire process, customized to each company's specific interview style.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-[#0ea5e9]">Our Values</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">What Drives Us Forward</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-[#0ea5e9]/10">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#333333] dark:text-white">Personalized Coaching</h3>
              <p className="mt-2 text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Every coaching session is customized to the specific company and role you're interviewing for, based on real interview experiences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-[#8b5cf6]/10">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#333333] dark:text-white">Hand-Holding Support</h3>
              <p className="mt-2 text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                We don't just give advice and leave you alone. Our coaches guide you through every step until you land the offer.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-[#f97316]/10">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#333333] dark:text-white">Quick Results</h3>
              <p className="mt-2 text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Our proven methods help you transition from interview to offer quickly, with strategies that work in today's competitive market.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <h2 className="text-base font-semibold leading-7 text-[#0ea5e9]">Our Story</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Started by a USC Student</p>
              <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Elevait began as an idea by a USC student who was helping fellow students with interview preparation. After successfully coaching others through product management interviews at various companies, he realized the power of customized, company-specific interview strategies.
              </p>
              <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">
                What started as informal help between classmates has grown into a platform dedicated to providing that same personalized, hand-holding approach to students and new graduates everywhere who want to break into product management.
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0ea5e9]/10">
                    <span className="text-xl">🎓</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#333333] dark:text-white">The Beginning</h3>
                  <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">USC student starts helping classmates with PM interview prep, developing company-specific strategies</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6]/10">
                    <span className="text-xl">🚀</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#333333] dark:text-white">2025</h3>
                  <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">Elevait officially established to scale personalized interview coaching to students nationwide</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f97316]/10">
                    <span className="text-xl">🎯</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#333333] dark:text-white">Today</h3>
                  <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">Helping students and new grads land their first PM roles through personalized, hand-holding coaching</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-24 bg-[#0ea5e9]/5">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-4xl">Ready to Land Your First PM Role?</h2>
          <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            Join students and new graduates who are breaking into product management with personalized coaching that gets results.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/coaches" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-[#f97316] hover:bg-[#f97316]/90 text-white text-base font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Find Your Coach</span>
            </Link>
            <Link href="/jobs" className="text-sm font-semibold leading-6 text-[#333333] dark:text-[#F5F5F5] group">
              Explore Jobs <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
