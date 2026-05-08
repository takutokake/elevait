'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  booking_start_time: string
  booking_end_time: string
  status: string
  google_meet_link?: string
}

export default function MentorDashboard() {
  const [mentorData, setMentorData] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [crmEnabled, setCrmEnabled] = useState(false)
  const [crmSaving, setCrmSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      fetch('/api/mentor/me').then(r => r.ok ? r.json() : null),
      fetch('/api/bookings?role=mentor').then(r => r.ok ? r.json() : null),
    ]).then(([mentor, bookingsData]) => {
      if (mentor) {
        setMentorData(mentor)
        setCrmEnabled(mentor.mentor?.crm_context_enabled === true)
      }
      if (bookingsData) setBookings(bookingsData.bookings || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleCrmToggle = async () => {
    const next = !crmEnabled
    setCrmEnabled(next)
    setCrmSaving(true)
    try {
      await fetch('/api/mentor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crm_context_enabled: next }),
      })
    } finally {
      setCrmSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="p-8 space-y-5 max-w-5xl">
        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!mentorData) {
    return (
      <div className="p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500">Unable to load dashboard. Please try again.</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-[#0ea5e9] hover:underline">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { profile, mentor } = mentorData
  const now = new Date()
  const pending   = bookings.filter(b => b.status === 'pending')
  const upcoming  = bookings.filter(b => new Date(b.booking_end_time) > now && b.status === 'confirmed')
  const completed = bookings.filter(b => b.status === 'completed')
  const earnings  = completed.reduce((sum, b) => {
    const hrs = (new Date(b.booking_end_time).getTime() - new Date(b.booking_start_time).getTime()) / 3_600_000
    return sum + hrs * (mentor.price_cents || 0) / 100 * 0.8
  }, 0)

  const firstName = (profile.full_name || 'Coach').split(' ')[0]
  const initials  = (profile.full_name || 'M').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="p-6 sm:p-8 space-y-5 max-w-5xl">

      {/* ── Welcome header ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Hey, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400">{mentor.current_title} · {mentor.current_company}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/mentor/settings" className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            Edit profile →
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending',   value: pending.length,          color: '#f97316', sub: 'Need response'  },
          { label: 'Upcoming',  value: upcoming.length,         color: '#0ea5e9', sub: 'Next 30 days'   },
          { label: 'Completed', value: completed.length,        color: '#8b5cf6', sub: 'All time'       },
          { label: 'Earnings',  value: `$${earnings.toFixed(0)}`, color: '#10b981', sub: 'Your 80% share' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-3xl font-black" style={{ color }}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── CRM Toggle ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">CRM Mode</p>
              {crmSaving && <span className="text-[10px] text-gray-400 animate-pulse">Saving…</span>}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm">
              Enable to access student pipeline views and additional coaching context about your mentees.
            </p>
          </div>
          {/* Toggle switch */}
          <button
            role="switch"
            aria-checked={crmEnabled}
            onClick={handleCrmToggle}
            className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/40"
            style={{ background: crmEnabled ? '#8b5cf6' : '#D1D5DB' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
              style={{ transform: crmEnabled ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
        {crmEnabled && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#8b5cf6]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
            Active — students can share their pipeline with you
          </div>
        )}
      </div>

      {/* ── Pending requests ────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              Pending Requests ({pending.length})
            </p>
            <Link href="/mentor/sessions" className="text-xs font-semibold text-orange-500 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 2).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-orange-100 dark:border-orange-800">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-black text-sm">!</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Session request</p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(b.booking_start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Link href="/mentor/sessions" className="text-xs font-semibold text-orange-500 hover:underline flex-shrink-0">
                  Review →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming sessions ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Upcoming Sessions</p>
          <Link href="/mentor/sessions" className="text-xs font-semibold text-[#0ea5e9] hover:underline">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No upcoming sessions</p>
            <Link href="/mentor/availability" className="text-xs text-[#0ea5e9] font-semibold hover:underline mt-1 inline-block">
              Update availability →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcoming.slice(0, 4).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                <div className="w-9 h-9 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Coaching session</p>
                  <p className="text-xs text-gray-400">
                    {new Date(b.booking_start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {b.google_meet_link && (
                  <a href={b.google_meet_link} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold text-[#0ea5e9] hover:underline flex-shrink-0">
                    Join →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/mentor/availability"
          className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#0ea5e9]/40 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Manage Availability</p>
            <p className="text-xs text-gray-400 mt-0.5">Add or update your open slots</p>
          </div>
        </Link>
        <Link href="/mentor/sessions"
          className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#8b5cf6]/40 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">View Sessions</p>
            <p className="text-xs text-gray-400 mt-0.5">Check upcoming &amp; past sessions</p>
          </div>
        </Link>
      </div>

    </div>
  )
}
