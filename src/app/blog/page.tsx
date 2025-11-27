import Link from "next/link";
import Header from "@/components/Header-simple";
import Footer from "@/components/Footer";

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#101c22]">
      <Header variant="landing" />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-16 pb-12 sm:pt-20 sm:pb-16 bg-gradient-to-b from-[#8b5cf6]/5 to-white dark:from-[#8b5cf6]/10 dark:to-[#101c22]">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-x-2 rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 dark:bg-[#8b5cf6]/20 px-4 py-2 text-sm font-semibold text-[#8b5cf6] mb-6">
                <span>Blog</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#333333] dark:text-white sm:text-5xl">
                Insights & <span className="text-[#8b5cf6]">Resources</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#333333]/80 dark:text-[#F5F5F5]/80 max-w-2xl mx-auto">
                Tips, strategies, and stories to help you succeed in your PM career journey.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="text-center space-y-8">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0ea5e9]/20 via-[#8b5cf6]/20 to-[#f97316]/20 flex items-center justify-center">
                  <span className="text-5xl">📝</span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-[#333333] dark:text-white">
                  Coming Soon
                </h2>
                <p className="text-lg text-[#333333]/80 dark:text-[#F5F5F5]/80 max-w-xl mx-auto">
                  We're working on bringing you valuable content about PM interviews, career advice, and success stories from students and new grads who've landed their dream roles.
                </p>
              </div>

              {/* Preview Topics */}
              <div className="pt-8">
                <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-6">
                  What to expect:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#0ea5e9]/50 hover:bg-[#0ea5e9]/5 transition-all duration-300">
                    <div className="text-3xl mb-3">🎯</div>
                    <h4 className="font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#0ea5e9] transition-colors">
                      Interview Strategies
                    </h4>
                    <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                      Company-specific tips and frameworks for acing PM interviews
                    </p>
                  </div>

                  <div className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#8b5cf6]/50 hover:bg-[#8b5cf6]/5 transition-all duration-300">
                    <div className="text-3xl mb-3">💼</div>
                    <h4 className="font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#8b5cf6] transition-colors">
                      Career Advice
                    </h4>
                    <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                      Guidance on breaking into PM as a student or new grad
                    </p>
                  </div>

                  <div className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#f97316]/50 hover:bg-[#f97316]/5 transition-all duration-300">
                    <div className="text-3xl mb-3">🌟</div>
                    <h4 className="font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#f97316] transition-colors">
                      Success Stories
                    </h4>
                    <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                      Real experiences from students who landed PM offers
                    </p>
                  </div>

                  <div className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#0ea5e9]/50 hover:bg-[#0ea5e9]/5 transition-all duration-300">
                    <div className="text-3xl mb-3">📚</div>
                    <h4 className="font-semibold text-[#333333] dark:text-white mb-2 group-hover:text-[#0ea5e9] transition-colors">
                      Industry Insights
                    </h4>
                    <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                      Trends and updates in the PM job market
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-8">
                <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 mb-6">
                  In the meantime, start your journey with personalized coaching
                </p>
                <Link 
                  href="/coaches" 
                  className="inline-flex items-center justify-center rounded-full h-12 px-8 bg-[#8b5cf6] text-white text-base font-semibold hover:bg-[#8b5cf6]/90 transition-colors"
                >
                  Find Your Coach
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
