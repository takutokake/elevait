'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface AuthRequiredModalProps {
  onClose: () => void
  action?: string
  returnUrl?: string
}

export default function AuthRequiredModal({
  onClose,
  action = 'do this',
  returnUrl,
}: AuthRequiredModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const encodedReturn = returnUrl ? encodeURIComponent(returnUrl) : ''
  const loginHref = encodedReturn ? `/login?returnUrl=${encodedReturn}` : '/login'
  const signupHref = encodedReturn ? `/signup?returnUrl=${encodedReturn}` : '/signup'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#16242c] rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center border border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-[#333333] dark:text-white mb-2">
          Create a free account
        </h2>
        <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70 mb-6 leading-relaxed">
          Log in or create an account to {action} and unlock your personal pipeline — track every application in one place.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={signupHref}
            className="w-full px-6 py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-xl transition-colors text-sm"
          >
            Create free account
          </Link>
          <Link
            href={loginHref}
            className="w-full px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-[#333333] dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            Log in
          </Link>
          <button
            onClick={onClose}
            className="text-sm text-[#333333]/50 dark:text-[#F5F5F5]/50 hover:text-[#333333] dark:hover:text-[#F5F5F5] transition-colors mt-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
