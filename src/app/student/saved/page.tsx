'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StudentSaved() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          Saved Items
        </h1>
        <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
          Your bookmarked mentors and job opportunities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Saved Mentors */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-black text-[#333333] dark:text-white flex items-center">
              <div className="w-8 h-8 bg-[#8b5cf6] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Saved Mentors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2">
                Coming Soon
              </h3>
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Mentors you bookmark will appear here. Save your favorite coaches to easily find them later.
              </p>
            </div>
            <a 
              href="/mentors" 
              className="inline-flex items-center justify-center rounded-lg bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white font-semibold h-10 px-4 transition-colors"
            >
              Browse Mentors
            </a>
          </CardContent>
        </Card>

        {/* Saved Jobs */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-black text-[#333333] dark:text-white flex items-center">
              <div className="w-8 h-8 bg-[#f97316] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              Saved Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-2">
                Coming Soon
              </h3>
              <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
                Your saved opportunities will appear here. Bookmark jobs you're interested in to apply later.
              </p>
            </div>
            <a 
              href="/jobs" 
              className="inline-flex items-center justify-center rounded-lg bg-[#f97316] hover:bg-[#f97316]/90 text-white font-semibold h-10 px-4 transition-colors"
            >
              Browse Jobs
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#0ea5e9] rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#333333] dark:text-white mb-1">
                Feature Coming Soon
              </h3>
              <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
                We're working on building the saved mentors and jobs functionality. 
                In the meantime, you can browse available mentors and job opportunities using the links above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
