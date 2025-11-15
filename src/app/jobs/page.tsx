import Link from "next/link";
import Layout from "../../components/Layout";

export default function JobsPage() {
  return (
    <Layout variant="landing">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-[#F3F4F6] mb-4">Product Management Jobs</h1>
          <p className="text-lg text-[#64748B] dark:text-[#9CA3AF] max-w-2xl mx-auto">
            Discover exclusive job opportunities from top companies looking for talented product managers.
          </p>
        </div>

        {/* Job Listings */}
        <div className="grid gap-6">
          {[
            {
              title: "Senior Product Manager",
              company: "TechCorp Inc.",
              location: "San Francisco, CA",
              type: "Full-time",
              posted: "2 days ago",
              logo: "T"
            },
            {
              title: "Product Manager, Growth",
              company: "Innovate Solutions",
              location: "New York, NY",
              type: "Full-time",
              posted: "5 days ago",
              logo: "I"
            },
            {
              title: "Associate Product Manager",
              company: "DataStream",
              location: "Remote",
              type: "Full-time",
              posted: "1 week ago",
              logo: "D"
            },
            {
              title: "Lead Product Manager, AI",
              company: "Future Systems",
              location: "Austin, TX",
              type: "Full-time",
              posted: "1 week ago",
              logo: "F"
            }
          ].map((job, index) => (
            <div key={index} className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-transparent hover:border-[#8b5cf6]/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 size-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#0F172A] dark:text-white">{job.logo}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{job.title}</h3>
                    <div className="flex items-center gap-2 text-[#64748B] dark:text-[#9CA3AF] text-sm mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-[#64748B] dark:text-[#9CA3AF] text-sm">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0ea5e9]/10 dark:bg-[#0ea5e9]/20 px-2 py-1 text-xs font-medium text-[#0ea5e9]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{job.location}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8b5cf6]/10 dark:bg-[#8b5cf6]/20 px-2 py-1 text-xs font-medium text-[#8b5cf6]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 002 2h2a2 2 0 002-2V6m0 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012-2h4a2 2 0 012 2h2a2 2 0 012 2z" />
                        </svg>
                        <span>{job.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Posted {job.posted}</p>
                  <button className="text-sm font-bold text-[#f97316] group-hover:underline">
                    View Job <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center items-center py-8">
          <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-[#0ea5e9] text-white text-sm font-bold tracking-wide hover:bg-[#0ea5e9]/90 transition-colors">
            Load More Jobs
          </button>
        </div>
      </main>
    </Layout>
  );
}
