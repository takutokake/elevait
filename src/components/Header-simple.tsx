"use client"

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

interface HeaderProps {
  variant?: "landing" | "dashboard" | "admin";
  user?: {
    name: string;
    avatar?: string;
    initials?: string;
  };
}

export default function Header({ variant = "landing", user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (variant === "dashboard" || variant === "admin") {
    return (
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-6 bg-[#FFFFFF]/95 dark:bg-[#1E293B]/95 border-b border-solid border-[#E2E8F0] dark:border-[#334155] backdrop-blur-sm w-full">
        <Logo size="lg" href="/" />
        
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 flex items-center justify-center text-sm font-bold text-[#0ea5e9]">
            {user?.initials || "U"}
          </div>
        </div>
      </header>
    );
  }

  // Landing page header
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#E2E8F0] dark:border-[#374151] px-6 py-2 bg-[#ffffff]/95 dark:bg-[#1F2937]/95 backdrop-blur-sm">
      <Logo size="lg" href="/" />
      
      <div className="hidden lg:flex flex-1 justify-center items-center">
        <nav className="flex items-center gap-8">
          <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#9CA3AF] transition-colors hover:text-[#0ea5e9]" href="/coaches">
            Coaches
          </Link>
          <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#9CA3AF] transition-colors hover:text-[#0ea5e9]" href="/jobs">
            Jobs
          </Link>
          <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#9CA3AF] transition-colors hover:text-[#0ea5e9]" href="/about">
            About
          </Link>
          <Link className="text-sm font-medium leading-normal text-[#64748B] dark:text-[#9CA3AF] transition-colors hover:text-[#0ea5e9]" href="/blog">
            Blog
          </Link>
        </nav>
      </div>
      
      <div className="hidden lg:flex gap-2">
        <Link href="/login" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] transition-colors text-[#0ea5e9] hover:bg-[#0ea5e9]/10">
          <span className="truncate">Log In</span>
        </Link>
        <Link href="/signup" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0ea5e9] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-opacity hover:opacity-90">
          <span className="truncate">Get Started</span>
        </Link>
      </div>
      
      <div className="lg:hidden">
        <button 
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6 text-[#333333] dark:text-[#F5F5F5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg lg:hidden">
          <nav className="flex flex-col p-4 gap-2">
            <Link className="px-4 py-2 text-[#333333] dark:text-[#F5F5F5] text-sm font-medium hover:text-[#0ea5e9] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700" href="/coaches">
              Coaches
            </Link>
            <Link className="px-4 py-2 text-[#333333] dark:text-[#F5F5F5] text-sm font-medium hover:text-[#0ea5e9] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700" href="/jobs">
              Jobs
            </Link>
            <Link className="px-4 py-2 text-[#333333] dark:text-[#F5F5F5] text-sm font-medium hover:text-[#0ea5e9] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700" href="/about">
              About
            </Link>
            <Link className="px-4 py-2 text-[#333333] dark:text-[#F5F5F5] text-sm font-medium hover:text-[#0ea5e9] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700" href="/blog">
              Blog
            </Link>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/login" className="flex items-center justify-center rounded-full h-10 px-4 bg-[#f0f3f5] dark:bg-gray-700 text-[#333333] dark:text-white text-sm font-medium transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="flex items-center justify-center rounded-full h-10 px-5 bg-[#f97316] hover:bg-[#f97316]/90 text-white text-sm font-bold transition-colors">
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
