export default function CoachProfileLoading() {
  return (
    <div className="font-display bg-[#F8FAFC] dark:bg-[#020617] text-[#0f172a] dark:text-[#F8FAFC]">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        {/* Header Skeleton */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#E2E8F0] dark:border-[#1e293b] px-4 sm:px-6 lg:px-10 py-4 bg-[#FFFFFF] dark:bg-[#0f172a] sticky top-0 z-50">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb Skeleton */}
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Skeleton */}
              <div className="lg:col-span-2 space-y-8">
                {/* Coach Header Skeleton */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                      <div className="flex gap-4 mt-3">
                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section Skeleton */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                  </div>
                </div>

                {/* Specialties Skeleton */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="space-y-6">
                {/* Quick Stats Skeleton */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Skeleton */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 animate-pulse" />
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>

                {/* Contact Skeleton */}
                <div className="bg-[#FFFFFF] dark:bg-[#0f172a] rounded-xl border border-[#E2E8F0] dark:border-[#1e293b] p-6 shadow-sm">
                  <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
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
