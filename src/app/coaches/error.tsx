'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CoachesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Coaches page error:', error);
  }, [error]);

  return (
    <div className="font-display bg-[#F8FAFC] dark:bg-[#020617] text-[#0f172a] dark:text-[#F8FAFC]">
      <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-x-hidden px-4">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Something Went Wrong</h1>
            <p className="text-lg text-[#64748B] dark:text-[#94A3B8] mb-8">
              We encountered an error while loading the coaches. Please try again.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center px-6 py-3 bg-[#0ea5e9] text-white rounded-lg font-semibold hover:bg-[#0ea5e9]/90 transition-colors"
            >
              Try Again
            </button>
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
