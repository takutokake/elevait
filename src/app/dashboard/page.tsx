import Layout from "../../components/Layout";
import { DashboardIcon, CalendarIcon, ClockIcon, BookmarkIcon, UserIcon, SettingsIcon } from "../../components/Icons";

const sidebarItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <DashboardIcon />
  },
  {
    href: "/dashboard/sessions",
    label: "Upcoming Sessions",
    icon: <CalendarIcon />
  },
  {
    href: "/dashboard/history",
    label: "Past Sessions",
    icon: <ClockIcon />
  },
  {
    href: "/dashboard/jobs",
    label: "Saved Jobs",
    icon: <BookmarkIcon />
  }
];

const sidebarBottomItems = [
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: <UserIcon />
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: <SettingsIcon />
  }
];

export default function StudentDashboard() {
  return (
    <Layout 
      variant="dashboard" 
      sidebarItems={sidebarItems}
      sidebarBottomItems={sidebarBottomItems}
      user={{ name: "Alex Taylor", initials: "AT" }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] dark:text-[#F8FAFC]">Dashboard</h1>
        </div>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
              {/* Welcome Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-72 flex-col gap-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] dark:text-[#F8FAFC]">Welcome back, Alex!</h1>
                  <p className="text-base font-normal text-[#64748B] dark:text-[#94A3B8]">Here&apos;s a summary of your progress and upcoming activities.</p>
                </div>
                <button className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#0ea5e9] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0ea5e9]/90">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="truncate">Book a Session</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Content Column */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                  {/* Next Session Card */}
                  <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#0f172a]">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC]">Your Next Session</h2>
                      <div className="flex items-center gap-2 text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
                        <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[#0f172a] dark:text-[#F8FAFC]">Tomorrow, 10:00 AM</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 rounded-lg bg-[#F8FAFC] p-4 dark:bg-[#020617] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 flex items-center justify-center text-sm font-bold text-[#0ea5e9]">SC</div>
                        <div className="flex flex-col">
                          <p className="text-base font-semibold text-[#0f172a] dark:text-[#F8FAFC]">PM Interview Prep</p>
                          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">with Sarah Chen</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button className="flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#0ea5e9] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0ea5e9]/90 sm:w-auto">
                          <span className="truncate">Join Now</span>
                        </button>
                        <button className="flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-transparent px-4 text-sm font-bold text-[#64748B] ring-1 ring-inset ring-[#E2E8F0] transition-colors hover:bg-slate-100 dark:text-[#94A3B8] dark:ring-[#1e293b] dark:hover:bg-slate-800 sm:w-auto">
                          <span className="truncate">Reschedule</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#0f172a]">
                      <p className="text-base font-medium text-[#64748B] dark:text-[#94A3B8]">Sessions Completed</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold tracking-tight text-[#0f172a] dark:text-[#F8FAFC]">12</p>
                        <p className="text-sm font-medium text-sky-500 dark:text-sky-400">+1 this week</p>
                      </div>
                    </div>
                    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#0f172a]">
                      <p className="text-base font-medium text-[#64748B] dark:text-[#94A3B8]">Jobs Saved</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold tracking-tight text-[#0f172a] dark:text-[#F8FAFC]">5</p>
                        <p className="text-sm font-medium text-sky-500 dark:text-sky-400">+2 this week</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Jobs */}
                  <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC]">Recommended Job Postings</h2>
                    <div className="flex flex-col gap-3">
                      {[
                        { title: "Product Manager II", company: "Google", location: "Mountain View, CA", logo: "G" },
                        { title: "Senior Product Manager, Growth", company: "Meta", location: "Remote", logo: "M" }
                      ].map((job, index) => (
                        <div key={index} className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#1e293b] dark:bg-[#0f172a] sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 text-lg font-bold text-[#f97316]">
                              {job.logo}
                            </div>
                            <div>
                              <p className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{job.title}</p>
                              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{job.company} • {job.location}</p>
                            </div>
                          </div>
                          <button className="flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-transparent px-4 text-sm font-bold text-[#64748B] ring-1 ring-inset ring-[#E2E8F0] transition-colors hover:bg-slate-100 dark:text-[#94A3B8] dark:ring-[#1e293b] dark:hover:bg-slate-800 sm:w-auto">
                            <span className="truncate">View Job</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                  {/* Progress Card */}
                  <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#0f172a]">
                    <h2 className="text-lg font-bold text-[#0f172a] dark:text-[#F8FAFC]">Your Progress</h2>
                    <div className="flex flex-col items-center justify-center gap-4 py-4">
                      <div className="relative size-40">
                        <svg className="absolute inset-0 size-full" height="160" viewBox="0 0 160 160" width="160" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                              <stop offset="0%" stopColor="#0ea5e9"></stop>
                              <stop offset="100%" stopColor="#8b5cf6"></stop>
                            </linearGradient>
                          </defs>
                          <circle className="stroke-current text-slate-200 dark:text-slate-700" cx="80" cy="80" fill="none" r="70" strokeWidth="20"></circle>
                          <circle className="origin-center -rotate-90" cx="80" cy="80" fill="none" r="70" stroke="url(#progressGradient)" strokeDasharray="439.8" strokeDashoffset="153.9" strokeLinecap="round" strokeWidth="20"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold text-[#0f172a] dark:text-[#F8FAFC]">65%</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-center">
                        <p className="text-sm text-[#0f172a] dark:text-[#F8FAFC]">You&apos;ve completed 12 of 18 sessions</p>
                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Keep up the great work!</p>
                      </div>
                    </div>
                    <button className="flex h-10 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#0ea5e9] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0ea5e9]/90">
                      <span className="truncate">View Full Plan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
      </div>
    </Layout>
  );
}
