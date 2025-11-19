import Layout from "../../components/Layout";

export default function CoachesLoading() {
  return (
    <Layout variant="landing">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-1/4 xl:w-1/5">
            <div className="sticky top-28">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
              <div className="bg-[#ffffff] dark:bg-[#1F2937] p-4 rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#374151]">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="w-full lg:w-3/4 xl:w-4/5">
            <div className="mb-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            </div>

            {/* Search and Sort Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
              <div className="w-full sm:flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="w-40 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>

            {/* Coach Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex flex-col bg-[#ffffff] dark:bg-[#1F2937] rounded-xl border border-[#E2E8F0] dark:border-[#374151] p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="size-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4 animate-pulse" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
