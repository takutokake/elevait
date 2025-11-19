import Link from "next/link";

export default function CoachNotFound() {
  return (
    <div className="font-display bg-[#F8FAFC] dark:bg-[#020617] text-[#0f172a] dark:text-[#F8FAFC]">
      <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-x-hidden px-4">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#0ea5e9]/10 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-[#0ea5e9]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Coach Not Found</h1>
            <p className="text-lg text-[#64748B] dark:text-[#94A3B8] mb-8">
              We couldn't find the coach you're looking for. They may have been removed or the link might be incorrect.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/coaches"
              className="flex items-center justify-center px-6 py-3 bg-[#0ea5e9] text-white rounded-lg font-semibold hover:bg-[#0ea5e9]/90 transition-colors"
            >
              Browse All Coaches
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center px-6 py-3 border border-[#E2E8F0] dark:border-[#1e293b] text-[#0f172a] dark:text-[#F8FAFC] rounded-lg font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#1e293b] transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
