import Link from "next/link";
import Header from "@/components/Header-simple";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#101c22]">
      <Header variant="landing" />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-[#101c22]">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
          </div>
          <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4 w-[600px] h-[600px] opacity-20 bg-[radial-gradient(circle,rgba(14,165,233,0.3)_0%,rgba(0,0,0,0)_70%)] blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/3 translate-y-1/4 w-[600px] h-[600px] opacity-20 bg-[radial-gradient(circle,rgba(139,92,246,0.25)_0%,rgba(0,0,0,0)_70%)] blur-3xl"></div>


          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center relative">
            <div className="inline-flex items-center gap-x-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/5 dark:bg-[#0ea5e9]/10 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-[#0ea5e9] mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#0ea5e9] animate-pulse"></span>
              <span>About Elevait</span>
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight text-[#333333] dark:text-white sm:text-7xl mb-6 drop-shadow-sm">
              Your Career Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6]">Personalized Coaching</span>
            </h1>
            
            <p className="mt-6 text-xl leading-8 text-[#333333]/70 dark:text-[#F5F5F5]/70 max-w-2xl mx-auto">
              We're dedicated to supporting students and new grads in landing their first PM roles and internships through tailored, expert guidance.
            </p>
          </div>
        </div>

        {/* What is Elevait Section */}
        <div className="py-24 bg-gray-50/50 dark:bg-[#0d161b] relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[#333333] dark:text-white sm:text-4xl mb-4">What is Elevait?</h2>
              <p className="text-lg text-[#333333]/70 dark:text-[#F5F5F5]/70 max-w-3xl mx-auto">
                Elevait is a <span className="font-semibold text-[#0ea5e9]">personalized coaching platform</span> designed specifically for students and new graduates pursuing product management.
              </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "🎯", title: "Tailored Guidance", desc: "Company-specific interview prep tailored to your target role.", color: "text-[#0ea5e9]", border: "hover:border-[#0ea5e9]/50" },
                { icon: "👥", title: "Expert Mentors", desc: "Learn directly from industry professionals who have been in your shoes.", color: "text-[#8b5cf6]", border: "hover:border-[#8b5cf6]/50" },
                { icon: "💼", title: "First PM Role", desc: "Strategic advice designed to help you land your dream position.", color: "text-[#f97316]", border: "hover:border-[#f97316]/50" }
              ].map((item, idx) => (
                <div key={idx} className={`group p-8 rounded-2xl bg-white dark:bg-[#16242c] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${item.border}`}>
                  <div className={`w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-3">{item.title}</h3>
                  <p className="text-[#333333]/70 dark:text-[#F5F5F5]/60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Origin Story Section (Problem/Solution) */}
        <div className="py-24 bg-white dark:bg-[#101c22] relative overflow-hidden">
          <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center mb-16">
              <div className="w-16 h-16 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center text-3xl mb-6 border border-[#8b5cf6]/20 text-[#8b5cf6]">
                💡
              </div>
              <h2 className="text-3xl font-bold text-[#333333] dark:text-white text-center">Why was Elevait born?</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              {/* The Problem */}
              <div className="relative p-8 rounded-3xl bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-colors duration-300">
                <div className="absolute top-0 right-0 p-6 text-red-200 dark:text-red-900/20 text-9xl font-black leading-none -z-10 select-none opacity-50">?</div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">!</span>
                  <h3 className="text-xl font-bold text-[#333333] dark:text-white">The Problem</h3>
                </div>
                <p className="text-lg text-[#333333]/80 dark:text-[#F5F5F5]/80 leading-relaxed">
                  The recruitment process for PM roles is often <span className="font-semibold text-red-600 dark:text-red-400 decoration-red-300 underline underline-offset-2">hidden and inaccessible</span> to students. Generic resources fail to address the specific hurdles of landing that crucial first internship or full-time role.
                </p>
              </div>
              
              {/* The Solution */}
              <div className="relative p-8 rounded-3xl bg-[#0ea5e9]/5 dark:bg-[#0ea5e9]/5 border border-[#0ea5e9]/10 hover:border-[#0ea5e9]/30 transition-colors duration-300">
                 <div className="absolute top-0 right-0 p-6 text-blue-100 dark:text-blue-900/20 text-9xl font-black leading-none -z-10 select-none opacity-50">✓</div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] font-bold">✓</span>
                  <h3 className="text-xl font-bold text-[#333333] dark:text-white">The Solution</h3>
                </div>
                <p className="text-lg text-[#333333]/80 dark:text-[#F5F5F5]/80 leading-relaxed">
                  Founded by a <span className="font-semibold text-[#0ea5e9]">USC student</span> who experienced this gap firsthand. Elevait democratizes access to insider knowledge, offering personalized coaching that turns generic prep into <span className="font-semibold text-[#333333] dark:text-white">winning offers</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Principles */}
        <div className="py-24 bg-gray-50 dark:bg-[#0d161b]">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[#333333] dark:text-white mb-4">Our Mission & Principles</h2>
              <p className="text-lg text-[#333333]/70 dark:text-[#F5F5F5]/70 max-w-2xl mx-auto">
                Helping you transition from interview to offer through a philosophy of deep personalization.
              </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: "🎯", 
                  title: "Personalized Approach", 
                  desc: "Every coaching session is customized to your target company and role based on real interview experiences.",
                  color: "bg-[#0ea5e9]"
                },
                { 
                  icon: "🤝", 
                  title: "Continuous Support", 
                  desc: "We guide you through every step of the process until you land your offer—not just one-off advice.",
                  color: "bg-[#8b5cf6]"
                },
                { 
                  icon: "🎓", 
                  title: "Student-Focused", 
                  desc: "Built specifically for students and new grads seeking PM roles and internships.",
                  color: "bg-[#f97316]"
                }
              ].map((item, idx) => (
                <div key={idx} className="group relative bg-white dark:bg-[#16242c] p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-t-4 border-transparent hover:border-t-4" style={{borderColor: item.color.replace('bg-[', '').replace(']', '')}}>
                  <div className={`w-12 h-12 rounded-lg ${item.color}/10 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-3">{item.title}</h3>
                  <p className="text-[#333333]/70 dark:text-[#F5F5F5]/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why use Elevait (Accordion/List style replacement) */}
        <div className="py-24 bg-white dark:bg-[#101c22]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[#333333] dark:text-white mb-6">Why choose Elevait?</h2>
                <p className="text-lg text-[#333333]/70 dark:text-[#F5F5F5]/70 mb-8">
                  We don't do "generic". Our platform is built on the belief that specificity wins offers.
                </p>
                <div className="space-y-4">
                  {[
                    { title: "Company-Specific Prep", desc: "Insights tailored to specific companies, not general advice.", color: "border-[#0ea5e9]" },
                    { title: "Experienced Mentors", desc: "Work with mentors who have successfully navigated the PM path.", color: "border-[#8b5cf6]" },
                    { title: "New Grad Focus", desc: "Specialized in helping you break into PM early in your career.", color: "border-[#f97316]" },
                    { title: "End-to-End Support", desc: "From resume reviews to offer negotiations, we're with you.", color: "border-[#0ea5e9]" },
                  ].map((item, idx) => (
                    <div key={idx} className={`group p-6 rounded-xl border-l-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-[#16242c] shadow-sm hover:shadow-md transition-all duration-300 ${item.color}`}>
                      <h3 className="text-lg font-bold text-[#333333] dark:text-white mb-1">{item.title}</h3>
                      <p className="text-[#333333]/70 dark:text-[#F5F5F5]/60 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Visual Side for "Who We Serve" */}
              <div className="relative lg:pl-10">
                <div className="relative rounded-3xl bg-gradient-to-br from-[#101c22] to-[#1a2c35] p-8 sm:p-12 text-white shadow-2xl overflow-hidden">
                  {/* Decorative blobs */}
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#0ea5e9]/30 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[#8b5cf6]/30 rounded-full blur-3xl"></div>
                  
                  <h3 className="text-2xl font-bold mb-8 relative z-10">Who We Serve</h3>
                  <ul className="space-y-6 relative z-10">
                    {[
                      "Students seeking PM internships",
                      "New graduates pursuing full-time roles",
                      "Early career switchers into Product"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-4 group">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                          ✓
                        </div>
                        <span className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
                    <p className="text-white/60 italic">"The best investment in your career is the one that gets you the offer."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 relative overflow-hidden">
           <div className="absolute inset-0 bg-white dark:bg-[#101c22]">
             <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
           </div>
           
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl font-black tracking-tight text-[#333333] dark:text-white sm:text-5xl mb-6">
              Ready to Land Your First PM Role?
            </h2>
            <p className="text-xl text-[#333333]/70 dark:text-[#F5F5F5]/70 mb-10 max-w-2xl mx-auto">
              Join students and new graduates who are breaking into product management with personalized coaching.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/coaches" className="w-full sm:w-auto px-8 py-4 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-base font-bold rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5">
                Find Your Coach
              </Link>
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-transparent text-[#333333] dark:text-white border border-gray-200 dark:border-gray-700 font-bold rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
