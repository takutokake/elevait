'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { generateRecommendation } from '@/lib/emailIntelExtractor'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import AuthRequiredModal from '@/components/AuthRequiredModal'

// ─── Types ────────────────────────────────────────────────────────────────
interface Application {
  id: string
  company: string
  role: string
  stage: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
  next_action?: string | null
  deadline?: string | null
  notes?: string | null
  logo?: string | null
  bg_color?: string
  job_url?: string | null
  source?: string
  created_at: string
  interview_date?: string | null
  interview_type?: string | null
  action_items?: Array<{ text: string; due?: string | null }> | null
  ai_summary?: string | null
}

interface Job {
  id: string
  company: string
  company_url: string | null
  job_title: string
  job_url: string
  location: string
  work_model: string
  date_posted_parsed: string | null
  role_type: 'new_grad' | 'internship'
  is_top_company: boolean
}

interface Mentor {
  id: string
  full_name: string
  avatar_url?: string
  mentor_data?: {
    current_title?: string
    current_company?: string
    pricing_model?: string
    price_cents?: number
    focus_areas?: string[]
  }
}

// ─── Constants & Demo Data ─────────────────────────────────────────────────
const STAGES: Application['stage'][] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

const STAGE_META: Record<string, { color: string; dot: string; label: string }> = {
  Saved:     { color: 'bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-700',    dot: 'bg-slate-400',  label: 'Saved' },
  Applied:   { color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',        dot: 'bg-[#0ea5e9]',  label: 'Applied' },
  Interview: { color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',    dot: 'bg-amber-500',  label: 'Interview' },
  Offer:     { color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', dot: 'bg-emerald-500', label: 'Offer' },
  Rejected:  { color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',            dot: 'bg-red-400',    label: 'Rejected' },
}

const DEMO_APPS: Application[] = [
  { id: 'd1', company: 'Stripe', role: 'APM', stage: 'Interview', bg_color: '#635BFF', next_action: 'Loop round Fri', created_at: '' },
  { id: 'd2', company: 'Figma', role: 'PM Intern', stage: 'Applied', bg_color: '#F24E1E', next_action: 'Applied 4d ago', created_at: '' },
  { id: 'd3', company: 'Linear', role: 'APM', stage: 'Saved', bg_color: '#5E6AD2', next_action: 'Deadline Apr 30', created_at: '' },
  { id: 'd4', company: 'Notion', role: 'APM', stage: 'Applied', bg_color: '#111', next_action: 'Recruiter call Thu', created_at: '' },
  { id: 'd5', company: 'Vercel', role: 'APM', stage: 'Offer', bg_color: '#000', next_action: 'Respond by May 2', created_at: '' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────
function companyInitial(name: string) {
  return name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getCompanyDomain(companyUrl: string | null, companyName: string): string | null {
  if (companyUrl) {
    try { return new URL(companyUrl).hostname.replace(/^www\./, '') } catch { /* ignore */ }
  }
  const n = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const map: Record<string, string> = { google: 'google.com', meta: 'meta.com', apple: 'apple.com', amazon: 'amazon.com', microsoft: 'microsoft.com', stripe: 'stripe.com', figma: 'figma.com', notion: 'notion.so', vercel: 'vercel.com', linear: 'linear.app', openai: 'openai.com', anthropic: 'anthropic.com', netflix: 'netflix.com', uber: 'uber.com', airbnb: 'airbnb.com', shopify: 'shopify.com', roblox: 'roblox.com', canva: 'canva.com', discord: 'discord.com', reddit: 'reddit.com', coinbase: 'coinbase.com', ramp: 'ramp.com', brex: 'brex.com', databricks: 'databricks.com', snowflake: 'snowflake.com', palantir: 'palantir.com', lyft: 'lyft.com' }
  return map[n] || null
}

function relativeTime(d: string | null) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const hrs = Math.max(1, Math.round(diff / 3600000))
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

// ─── Company Logo ──────────────────────────────────────────────────────────
function CompanyLogo({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const [err, setErr] = useState(false)
  const domain = getCompanyDomain(url || null, name)
  const sz = `w-9 h-9`
  if (domain && !err) {
    return (
      <div className={`${sz} rounded-lg overflow-hidden flex-shrink-0 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600`}>
        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt={name} width={size} height={size} className="w-full h-full object-contain p-0.5" onError={() => setErr(true)} loading="lazy" />
      </div>
    )
  }
  return (
    <div className={`${sz} rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 text-[#0ea5e9]`}>
      {companyInitial(name)}
    </div>
  )
}

// ─── Add Application Modal ─────────────────────────────────────────────────
function AddApplicationModal({ onClose, onAdd, initialStage = 'Saved' }: { onClose: () => void; onAdd: (app: Partial<Application>) => void; initialStage?: Application['stage'] }) {
  const [form, setForm] = useState({ company: '', role: '', stage: initialStage as Application['stage'], next_action: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = 'unset'; window.removeEventListener('keydown', esc) }
  }, [onClose])

  const handle = async () => {
    if (!form.company.trim() || !form.role.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) {
        const data = await res.json()
        onAdd(data.application)
        onClose()
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#16242c] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[#333333] dark:text-white mb-4">Add Application</h2>
        <div className="space-y-3">
          <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company *" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
          <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Role / Title *" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
          <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value as Application['stage'] }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={form.next_action} onChange={e => setForm(p => ({ ...p, next_action: e.target.value }))} placeholder="Next action (optional)" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] resize-none" />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#333333] dark:text-[#F5F5F5]">Cancel</button>
          <button onClick={handle} disabled={saving || !form.company.trim() || !form.role.trim()} className="flex-1 px-4 py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">
            {saving ? 'Saving...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

const STAGE_STYLE: Record<string, { color: string; countBg: string; countText: string; dropBg: string; dropBorder: string }> = {
  Saved:     { color: '#64748b', countBg: '#F1F5F9', countText: '#475569', dropBg: '#F8FAFC',   dropBorder: '#94a3b8' },
  Applied:   { color: '#0ea5e9', countBg: '#E0F2FE', countText: '#0369A1', dropBg: '#F0F9FF',   dropBorder: '#0ea5e9' },
  Interview: { color: '#f97316', countBg: '#FFEDD5', countText: '#C2410C', dropBg: '#FFF7ED',   dropBorder: '#f97316' },
  Offer:     { color: '#10b981', countBg: '#DCFCE7', countText: '#065F46', dropBg: '#F0FDF4',   dropBorder: '#10b981' },
  Rejected:  { color: '#ef4444', countBg: '#FEE2E2', countText: '#B91C1C', dropBg: '#FEF2F2',   dropBorder: '#ef4444' },
}

const STAGE_EMPTY: Record<string, string> = {
  Saved:     'Save a role from the job board',
  Applied:   "Move here when you've submitted",
  Interview: 'Move here when invited to interview',
  Offer:     'Move here when you get the offer 🎉',
  Rejected:  'Move here to track rejections',
}

// ─── Pipeline Tab ──────────────────────────────────────────────────────────
function PipelineTab({ user }: { user: any }) {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpenStage, setAddOpenStage] = useState<Application['stage'] | null>(null)
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; gmailEmail?: string | null } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetch('/api/applications').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setApps(d.applications || [])
    }).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    fetch('/api/gmail/status').then(r => r.ok ? r.json() : null).then(d => { if (d) setGmailStatus(d) })
  }, [user])

  const moveApp = useCallback(async (id: string, stage: Application['stage']) => {
    if (!user) { setShowAuthModal(true); return }
    setApps(prev => prev.map(a => a.id === id ? { ...a, stage } : a))
    await fetch('/api/applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, stage }) })
  }, [user])

  const deleteApp = useCallback(async (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/applications?id=${id}`, { method: 'DELETE' })
  }, [])

  const saveEdit = useCallback(async (updated: Partial<Application> & { id: string }) => {
    setApps(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
    await fetch('/api/applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
    setEditApp(null)
  }, [])

  const handleGmailSync = async () => {
    setSyncing(true); setSyncMsg('')
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' })
      const d = await res.json()
      if (res.ok) {
        setSyncMsg(`${d.updated || 0} application${d.updated === 1 ? '' : 's'} updated`)
        const r = await fetch('/api/applications')
        const data = await r.json()
        if (data) setApps(data.applications || [])
      } else {
        setSyncMsg(d.error || 'Sync failed')
      }
    } finally { setSyncing(false) }
  }

  const displayApps = user ? apps : DEMO_APPS

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
    </div>
  )

  return (
    <div className="relative">
      {showAuthModal && <AuthRequiredModal onClose={() => setShowAuthModal(false)} action="manage your pipeline" returnUrl="/student/dashboard?tab=pipeline" />}

      {/* Guest overlay */}
      {!user && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-[#101c22]/80 backdrop-blur-sm rounded-xl">
          <div className="text-center max-w-sm mx-4 p-8 bg-white dark:bg-[#16242c] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-2">Your Personal Pipeline</h3>
            <p className="text-sm text-[#333333]/70 dark:text-[#F5F5F5]/70 mb-5 leading-relaxed">Log in or create a free account to track your own applications, move cards, add notes, and never lose track of where you stand.</p>
            <div className="flex flex-col gap-2">
              <Link href="/signup?returnUrl=/student/dashboard?tab=pipeline" className="w-full px-5 py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-xl transition-colors text-sm">Create free account</Link>
              <Link href="/login?returnUrl=/student/dashboard?tab=pipeline" className="w-full px-5 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-[#333333] dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">Log in</Link>
            </div>
          </div>
        </div>
      )}

      {/* Gmail banner */}
      {user && gmailStatus !== null && (
        gmailStatus.connected ? (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <p className="flex-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium">Gmail connected{gmailStatus.gmailEmail ? ` · ${gmailStatus.gmailEmail}` : ''}</p>
            {syncMsg && <span className="text-xs text-emerald-600 dark:text-emerald-400">{syncMsg}</span>}
            <button onClick={handleGmailSync} disabled={syncing}
              className="flex-shrink-0 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
              {syncing ? 'Syncing...' : 'Sync emails'}
            </button>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <p className="flex-1 text-xs text-amber-800 dark:text-amber-200">Connect Gmail to auto-detect interview invites and rejections.</p>
            <a href="/api/gmail/connect"
              className="flex-shrink-0 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors">
              Connect Gmail
            </a>
          </div>
        )
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-5 px-1">
        <p className="text-sm text-gray-400">
          {user ? <><span className="font-bold text-gray-700 dark:text-white">{apps.length}</span> applications</> : 'Preview — log in to track your own hunt'}
        </p>
        {user && (
          <button
            onClick={() => setAddOpenStage('Saved')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New application
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-6" style={{ minHeight: 520 }}>
        {STAGES.map(stage => {
          const ss = STAGE_STYLE[stage]
          const items = displayApps.filter(a => a.stage === stage)
          const isOver = dragOver === stage
          return (
            <div
              key={stage}
              className="flex-shrink-0 flex flex-col"
              style={{ width: 224 }}
              onDragOver={e => { e.preventDefault(); setDragOver(stage) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null) }}
              onDrop={e => { e.preventDefault(); if (dragId) moveApp(dragId, stage as Application['stage']); setDragId(null); setDragOver(null) }}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2.5 px-1" style={{ borderLeft: `3px solid ${ss.color}`, paddingLeft: 8 }}>
                <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wide">{stage}</span>
                <span
                  className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: ss.countBg, color: ss.countText }}
                >{items.length}</span>
              </div>

              {/* Drop zone */}
              <div
                className="flex flex-col gap-2 flex-1 p-2 rounded-xl border transition-all duration-150"
                style={{
                  borderColor: isOver ? ss.dropBorder : items.length === 0 ? '#E5E7EB' : 'transparent',
                  background: isOver ? ss.dropBg : 'transparent',
                  borderStyle: items.length === 0 || isOver ? 'dashed' : 'solid',
                }}
              >
                {items.map(app => (
                  <div
                    key={app.id}
                    draggable={!!user}
                    onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragId(app.id) }}
                    onDragEnd={() => { setDragId(null); setDragOver(null) }}
                    onClick={() => user && setEditApp(app)}
                    className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/60 p-3 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-150 select-none ${
                      dragId === app.id ? 'opacity-40 rotate-1 scale-95 shadow-lg' : ''
                    } ${!user ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <CompanyLogo name={app.company} url={null} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">{app.company}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{app.role}</p>
                      </div>
                      {/* Drag grip */}
                      <svg
                        className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                        fill="currentColor" viewBox="0 0 16 16"
                      >
                        <circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>
                        <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
                        <circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
                      </svg>
                    </div>
                    {app.next_action && (
                      <p className="mt-2 text-[11px] text-gray-400 truncate flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        {app.next_action}
                      </p>
                    )}
                    {app.interview_date && (
                      <p className="mt-1 text-[11px] text-amber-500 truncate flex items-center gap-1">
                        📅 {new Date(app.interview_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {app.source === 'job_board' && (
                      <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wide text-[#0ea5e9] bg-[#0ea5e9]/10 px-1.5 py-0.5 rounded">Job board</span>
                    )}
                  </div>
                ))}

                {items.length === 0 && !isOver && (
                  <p className="text-[11px] text-center text-gray-300 dark:text-gray-600 py-5 px-2 leading-relaxed">
                    {STAGE_EMPTY[stage]}
                  </p>
                )}
              </div>

              {/* Inline add */}
              {user && (
                <button
                  onClick={() => setAddOpenStage(stage as Application['stage'])}
                  className="mt-1.5 w-full py-2 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  New
                </button>
              )}
            </div>
          )
        })}
      </div>

      {addOpenStage && <AddApplicationModal initialStage={addOpenStage} onClose={() => setAddOpenStage(null)} onAdd={app => { if (app) setApps(prev => [app as Application, ...prev]) }} />}
      {editApp && <EditApplicationDrawer app={editApp} onClose={() => setEditApp(null)} onSave={saveEdit} onDelete={deleteApp} />}
    </div>
  )
}

// ─── Edit Drawer ───────────────────────────────────────────────────────────
function EditApplicationDrawer({ app, onClose, onSave, onDelete }: { app: Application; onClose: () => void; onSave: (a: Partial<Application> & { id: string }) => void; onDelete: (id: string) => void }) {
  const [form, setForm] = useState({ stage: app.stage, next_action: app.next_action || '', notes: app.notes || '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = 'unset'; window.removeEventListener('keydown', esc) }
  }, [onClose])

  const handle = async () => {
    setSaving(true)
    await onSave({ id: app.id, ...form })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#16242c] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#333333] dark:text-white">{app.company}</h2>
            <p className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60">{app.role}</p>
          </div>
          {app.job_url && <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0ea5e9] hover:underline font-medium">View job →</a>}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#333333]/60 dark:text-[#F5F5F5]/60 uppercase tracking-wide mb-1 block">Stage</label>
            <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value as Application['stage'] }))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]">
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {app.ai_summary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">✨ AI Assistant</p>
              <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed">{app.ai_summary}</p>
              {(app.interview_date || app.interview_type) && (
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  📅{app.interview_date ? ` ${new Date(app.interview_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
                  {app.interview_type ? ` · ${app.interview_type.replace(/_/g, ' ')}` : ''}
                </p>
              )}
              {app.action_items && app.action_items.length > 0 && (
                <ul className="space-y-1">
                  {app.action_items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200">
                      <input type="checkbox" className="mt-0.5 flex-shrink-0 accent-blue-500" readOnly />
                      <span>{item.text}{item.due ? ` (by ${item.due})` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-blue-500 dark:text-blue-400 italic leading-relaxed">
                {generateRecommendation(app.stage, app.interview_type ?? null, app.company, app.interview_date ?? null, app.deadline ?? null)}
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-[#333333]/60 dark:text-[#F5F5F5]/60 uppercase tracking-wide mb-1 block">Next Action</label>
            <input value={form.next_action} onChange={e => setForm(p => ({ ...p, next_action: e.target.value }))} placeholder="e.g. Send thank you email" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#333333]/60 dark:text-[#F5F5F5]/60 uppercase tracking-wide mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#333333] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] resize-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          {confirmDelete ? (
            <>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#333333] dark:text-[#F5F5F5]">Cancel</button>
              <button onClick={() => { onDelete(app.id); onClose() }} className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold">Confirm Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors">Delete</button>
              <button onClick={onClose} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#333333] dark:text-[#F5F5F5]">Cancel</button>
              <button onClick={handle} disabled={saving} className="flex-1 px-3 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Gmail Connect Modal ─────────────────────────────────────────────────
function GmailConnectModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#16242c] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#0ea5e9]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-center text-gray-900 dark:text-white mb-2">
          Connect Gmail to auto-detect interview invites and rejections
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 leading-relaxed">
          Elevait scans recruiter emails to automatically update your application stages — moving cards from Applied → Interview or flagging rejections without you lifting a finger.
        </p>
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 mb-5 space-y-2">
          {[
            'Detects "You\'re moving to the next round" emails',
            'Flags rejection emails automatically',
            'Read-only access — we never send on your behalf',
            'Works with any Google account, not just your sign-in',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#0ea5e9] font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>
        <a href="/api/gmail/connect"
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-xl transition-colors text-sm mb-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
          </svg>
          Connect Gmail
        </a>
        <button onClick={onClose}
          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  )
}

// ─── Jobs Tab ──────────────────────────────────────────────────────────────
function JobsTab({ user }: { user: any }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleType, setRoleType] = useState('internship')
  const [workModel, setWorkModel] = useState('')
  const [topOnly, setTopOnly] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [toast, setToast] = useState('')

  const SORT_OPTIONS = [
    { value: 'relevance', label: 'Top Companies First' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'company', label: 'Company A-Z' },
  ]
  const WORK_MODELS = ['Remote', 'Hybrid', 'On Site']

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [roleType, workModel, topOnly, sortBy])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '30', sort: sortBy, role_type: roleType })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (workModel) params.set('work_model', workModel)
    if (topOnly) params.set('top_only', 'true')
    fetch(`/api/jobs?${params}`).then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setJobs(d.jobs || []); setTotal(d.total || 0); setTotalPages(d.total_pages || 1) }
    }).finally(() => setLoading(false))
  }, [page, debouncedSearch, roleType, workModel, topOnly, sortBy])

  useEffect(() => {
    if (!user) return
    fetch('/api/saved-jobs').then(r => r.ok ? r.json() : null).then(d => { if (d) setSavedIds(new Set(d.savedJobs || [])) })
  }, [user])

  const toggleSave = useCallback(async (job: Job) => {
    if (!user) { setShowAuthModal(true); return }
    const isSaved = savedIds.has(job.id)
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(job.id) : n.add(job.id); return n })
    try {
      if (isSaved) {
        await fetch(`/api/saved-jobs?jobId=${encodeURIComponent(job.id)}`, { method: 'DELETE' })
      } else {
        await fetch('/api/saved-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, company: job.company, role: job.job_title, job_url: job.job_url, company_url: job.company_url }) })
        setToast(`Saved: ${job.company} → Pipeline`)
        setTimeout(() => setToast(''), 2500)
      }
    } catch { setSavedIds(prev => { const n = new Set(prev); isSaved ? n.add(job.id) : n.delete(job.id); return n }) }
  }, [user, savedIds])

  const clearFilters = () => { setSearch(''); setRoleType('internship'); setWorkModel(''); setTopOnly(false); setSortBy('recent'); setPage(1) }
  const hasFilters = debouncedSearch || workModel || topOnly || sortBy !== 'recent'

  return (
    <div>
      {showAuthModal && <AuthRequiredModal onClose={() => setShowAuthModal(false)} action="save jobs to your pipeline" returnUrl="/student/dashboard?tab=jobs" />}
      {toast && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50 bg-[#0ea5e9] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium">{toast}</div>
      )}

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-5 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company, title, or location..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-[#333333] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {[['internship', 'Internship'], ['new_grad', 'New Grad']].map(([v, l]) => (
              <button key={v} onClick={() => { setRoleType(v); setPage(1) }}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  roleType === v ? 'bg-[#0ea5e9] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                {l}
              </button>
            ))}
          </div>
          <select value={workModel} onChange={e => setWorkModel(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]">
            <option value="">All Locations</option>
            {WORK_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]">
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => setTopOnly(v => !v)}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              topOnly ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}>
            ⭐ Top Companies
          </button>
          {hasFilters && <button onClick={clearFilters} className="text-xs text-[#0ea5e9] font-medium hover:underline ml-auto">Clear all</button>}
        </div>
        <p className="text-xs text-gray-400">{total.toLocaleString()} roles found</p>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-400 mb-2">No roles match your filters.</p>
          <button onClick={clearFilters} className="text-xs text-[#0ea5e9] font-medium hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => {
            const recent = job.date_posted_parsed && (Date.now() - new Date(job.date_posted_parsed).getTime() < 48 * 3600000)
            const saved = savedIds.has(job.id)
            return (
              <div key={job.id} className="flex items-center gap-3 p-3.5 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#0ea5e9]/30 hover:shadow-sm transition-all">
                <CompanyLogo name={job.company} url={job.company_url} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={job.job_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-bold text-[#333333] dark:text-white hover:text-[#0ea5e9] transition-colors">
                      {job.job_title}
                    </a>
                    {job.is_top_company && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded flex-shrink-0">TOP</span>}
                    {recent && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded flex-shrink-0">NEW</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {job.company} · {job.location} · {job.work_model}{job.date_posted_parsed ? ` · ${relativeTime(job.date_posted_parsed)}` : ''}
                  </p>
                </div>
                <button onClick={() => toggleSave(job)}
                  className={`flex-shrink-0 p-2 rounded-lg border transition-colors ${
                    saved ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/30 text-[#0ea5e9]' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-[#0ea5e9]/50 hover:text-[#0ea5e9]'
                  }`}>
                  <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            ← Previous
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Next →
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        <Link href="/jobs" className="text-[#0ea5e9] hover:underline font-medium">Open full job board →</Link>
      </p>
    </div>
  )
}

// ─── Mentors Tab ──────────────────────────────────────────────────────────────
function MentorsTab({ user }: { user: any }) {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    fetch('/api/coaches').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setMentors(d.mentors || [])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = mentors
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        m.full_name?.toLowerCase().includes(q) ||
        m.mentor_data?.current_company?.toLowerCase().includes(q) ||
        m.mentor_data?.current_title?.toLowerCase().includes(q) ||
        m.mentor_data?.focus_areas?.some(f => f.toLowerCase().includes(q))
      )
    }
    if (priceFilter === 'free') list = list.filter(m => !m.mentor_data?.pricing_model || m.mentor_data.pricing_model === 'free' || m.mentor_data.pricing_model === 'both')
    if (priceFilter === 'paid') list = list.filter(m => m.mentor_data?.pricing_model === 'paid' || m.mentor_data?.pricing_model === 'both')
    return list
  }, [mentors, search, priceFilter])

  return (
    <div>
      {showAuthModal && <AuthRequiredModal onClose={() => setShowAuthModal(false)} action="book a mentor session" returnUrl="/student/dashboard?tab=mentors" />}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, or focus area..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-[#333333] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
        </div>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
          {(['all', 'free', 'paid'] as const).map(f => (
            <button key={f} onClick={() => setPriceFilter(f)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                priceFilter === f ? 'bg-[#0ea5e9] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {f === 'all' ? 'All' : f === 'free' ? 'Free' : 'Paid'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-16">No mentors match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(mentor => {
            const md = mentor.mentor_data
            const isFree = !md?.pricing_model || md.pricing_model === 'free' || md.pricing_model === 'both'
            const price = md?.price_cents ? `$${Math.round(md.price_cents / 100)}` : null
            const avatarUrl = mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.full_name || 'M')}&background=0ea5e9&color=fff&size=64`
            return (
              <div key={mentor.id} className="flex flex-col bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 hover:border-[#0ea5e9]/40 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <Image src={avatarUrl} alt={mentor.full_name || 'Mentor'} width={44} height={44} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#333333] dark:text-white truncate">{mentor.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{md?.current_title || 'PM'}{md?.current_company ? ` @ ${md.current_company}` : ''}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
                    isFree ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {isFree ? 'FREE' : (price ? `${price}/hr` : 'PAID')}
                  </span>
                </div>
                {md?.focus_areas && md.focus_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {md.focus_areas.slice(0, 3).map((f, i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">{f}</span>)}
                  </div>
                )}
                <div className="mt-auto">
                  <button
                    onClick={() => user ? window.open(`/coaches/${mentor.id}`, '_blank') : setShowAuthModal(true)}
                    className="w-full py-2 bg-[#0ea5e9]/10 hover:bg-[#0ea5e9] text-[#0ea5e9] hover:text-white rounded-lg text-xs font-bold border border-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-all">
                    {user ? 'Book Session →' : 'Log in to Book →'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-gray-400">
        <Link href="/coaches" className="text-[#0ea5e9] hover:underline font-medium">Open full coaches directory →</Link>
      </p>
    </div>
  )
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ user, profile }: { user: any; profile: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gmailError = searchParams.get('gmail_error')
  const supabase = getSupabaseBrowserClient()
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; gmailEmail?: string | null } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [form, setForm] = useState({ full_name: '', looking_for: 'internship', target_companies: '' })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (!user) return
    fetch('/api/gmail/status').then(r => r.ok ? r.json() : null).then(d => { if (d) setGmailStatus(d) })
  }, [user])

  useEffect(() => {
    if (searchParams.get('gmail_connected') === '1' && user) {
      fetch('/api/gmail/status').then(r => r.ok ? r.json() : null).then(d => { if (d) setGmailStatus(d) })
    }
  }, [searchParams, user])

  useEffect(() => {
    if (profile) setForm(prev => ({
      ...prev,
      full_name: profile.full_name || '',
      looking_for: profile.looking_for || 'internship',
      target_companies: profile.target_companies || '',
    }))
  }, [profile])

  const handleSync = async () => {
    setSyncing(true); setSyncMsg('')
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' })
      const d = await res.json()
      setSyncMsg(res.ok ? `Synced ${d.processed || 0} emails, updated ${d.updated || 0} applications.` : (d.error || 'Sync failed'))
    } finally { setSyncing(false) }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true); setSavedMsg('')
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        looking_for: form.looking_for,
        target_companies: form.target_companies,
      }).eq('id', user.id)
      if (error) {
        await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', user.id)
      }
      setSavedMsg('Saved!')
      setTimeout(() => setSavedMsg(''), 2500)
    } finally { setSaving(false) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (!user) return (
    <div className="text-center py-16">
      <p className="text-sm text-gray-400 mb-4">Log in to manage your settings.</p>
      <Link href="/login?returnUrl=/student/dashboard?tab=settings" className="px-5 py-2.5 bg-[#0ea5e9] text-white font-bold rounded-xl text-sm">Log in</Link>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Profile</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {(form.full_name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white">{form.full_name || 'Your Name'}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Full Name</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Your full name"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Email</label>
            <input value={user.email} disabled
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-400 cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">What I&apos;m Looking For</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Role Type</label>
            <div className="flex gap-2 flex-wrap">
              {[{ v: 'internship', l: 'Internship' }, { v: 'new_grad', l: 'New Grad' }, { v: 'both', l: 'Both' }].map(({ v, l }) => (
                <button key={v} onClick={() => setForm(p => ({ ...p, looking_for: v }))}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    form.looking_for === v ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#0ea5e9]/40'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">Target Companies</label>
            <input value={form.target_companies} onChange={e => setForm(p => ({ ...p, target_companies: e.target.value }))}
              placeholder="e.g. Google, Stripe, Figma (comma-separated)"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-[#333333] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]" />
            <p className="text-[11px] text-gray-400 mt-1">We&apos;ll highlight coaches and jobs from these companies.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {savedMsg && <span className="text-sm text-emerald-500 font-medium">{savedMsg}</span>}
        </div>
      </div>

      {/* Gmail Integration */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Gmail Integration</h3>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">Auto-detect interview invites and rejections from recruiter emails. Read-only — we never send on your behalf.</p>
        {gmailStatus?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Connected{gmailStatus.gmailEmail ? ` · ${gmailStatus.gmailEmail}` : ''}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={handleSync} disabled={syncing}
                className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors">
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <a href="/api/gmail/connect"
                className="text-xs text-gray-400 hover:text-[#0ea5e9] hover:underline transition-colors">
                Connect a different account
              </a>
            </div>
            {syncMsg && <p className="text-xs text-gray-400">{syncMsg}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {gmailError && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Connection failed (<code className="font-mono">{gmailError}</code>
                  {searchParams.get('detail') && <> · <code className="font-mono">{searchParams.get('detail')}</code></>}
                  )
                </p>
              </div>
            )}
            <a href="/api/gmail/connect"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-white hover:border-[#0ea5e9] transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" /></svg>
              {gmailError ? 'Try with a different account' : 'Connect Gmail'}
            </a>
          </div>
        )}
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Account</h3>
        <button onClick={handleLogout}
          className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-semibold transition-colors">
          Sign out
        </button>
      </div>
    </div>
  )
}

// ─── Nav Items ─────────────────────────────────────────────────────────────
function IconPipeline({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  )
}
function IconJobs({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
function IconMentors({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
const NAV_ITEMS = [
  { key: 'pipeline', label: 'Pipeline', Icon: IconPipeline },
  { key: 'jobs',     label: 'Jobs',     Icon: IconJobs },
  { key: 'mentors',  label: 'Mentors',  Icon: IconMentors },
  { key: 'settings', label: 'Settings', Icon: IconSettings },
]
const PAGE_META: Record<string, { h: string; sub: string }> = {
  pipeline: { h: 'Application Pipeline', sub: 'Track every application. Drag cards to update stages.' },
  jobs:     { h: 'Job Board',            sub: 'Browse PM roles and save them directly to your pipeline.' },
  mentors:  { h: 'Mentors',              sub: 'Connect with PM coaches who recently got hired.' },
  settings: { h: 'Settings',             sub: 'Manage your account and integrations.' },
}

// ─── Sidebar Component ─────────────────────────────────────────────────────
function AppSidebar({
  user, profile, tab, gmailStatus, onTabChange, onLogout, onClose,
}: {
  user: any; profile: any; tab: string
  gmailStatus: { connected: boolean; gmailEmail?: string | null } | null
  onTabChange: (t: string) => void
  onLogout: () => void
  onClose?: () => void
}) {
  const initials = user
    ? (profile?.full_name || user.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'
  return (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image src="/images/Elevait_logo.png" alt="Elevait" width={140} height={40} className="h-10 w-auto object-contain" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* User card */}
      <div className="px-3 pb-3 flex-shrink-0">
        {user ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{profile?.full_name || 'User'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <Link href={`/login?returnUrl=/student/dashboard?tab=${tab}`}
            className="flex items-center justify-center w-full py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold transition-colors">
            Log in to save progress
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto py-1">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = tab === key
          return (
            <button key={key} onClick={() => { onTabChange(key); onClose?.() }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active
                  ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0ea5e9] rounded-r-full" />}
              <Icon active={active} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Bottom: Gmail status + logout */}
      <div className="px-3 pt-3 pb-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 space-y-1">
        {user && (
          gmailStatus?.connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)] flex-shrink-0" />
              <span className="truncate">Gmail synced{gmailStatus.gmailEmail ? ` · ${gmailStatus.gmailEmail.split('@')[0]}` : ''}</span>
            </div>
          ) : (
            <a href="/api/gmail/connect"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-gray-500 dark:text-gray-400 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/5 transition-all">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" /></svg>
              Connect Gmail →
            </a>
          )
        )}
        {user && (
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard Shell ───────────────────────────────────────────────────────
function DashboardShell() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(undefined)
  const [profile, setProfile] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; gmailEmail?: string | null } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showGmailModal, setShowGmailModal] = useState(false)
  const tab = (searchParams.get('tab') || 'pipeline') as string

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) {
        setUser(d.user)
        setProfile(d.profile)
        if (d.profile?.role === 'mentor') router.replace('/mentor/dashboard')
      } else {
        setUser(null)
      }
    }).catch(() => setUser(null)).finally(() => setAuthLoading(false))
  }, [router])

  useEffect(() => {
    if (!user) return
    fetch('/api/gmail/status').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setGmailStatus(d)
        if (!d.connected && typeof window !== 'undefined' && !sessionStorage.getItem('gmail_modal_dismissed')) {
          setShowGmailModal(true)
        }
      }
    })
  }, [user])

  const setTab = (t: string) => router.push(`/student/dashboard?tab=${t}`, { scroll: false })

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (authLoading) return (
    <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
    </div>
  )

  const initials = user
    ? (profile?.full_name || user.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="min-h-screen flex bg-[#f6f7f9] dark:bg-[#101c22]">
      {showGmailModal && <GmailConnectModal onClose={() => { setShowGmailModal(false); sessionStorage.setItem('gmail_modal_dismissed', '1') }} />}

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 sticky top-0 h-screen bg-white dark:bg-[#16242c] border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
        <AppSidebar user={user} profile={profile} tab={tab} gmailStatus={gmailStatus} onTabChange={setTab} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile Drawer ───────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative ml-auto w-[260px] bg-white dark:bg-[#16242c] h-full overflow-y-auto shadow-2xl">
            <AppSidebar user={user} profile={profile} tab={tab} gmailStatus={gmailStatus} onTabChange={setTab} onLogout={handleLogout} onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-[#16242c] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 h-14 flex-shrink-0">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/images/Elevait_logo.png" alt="Elevait" width={130} height={36} className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            ) : (
              <Link href={`/login?returnUrl=/student/dashboard?tab=${tab}`} className="px-3 py-1.5 text-xs font-bold bg-[#0ea5e9] text-white rounded-lg">
                Log in
              </Link>
            )}
            <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>


        {/* Page content */}
        <div className="flex-1 px-4 sm:px-6 py-6 pb-24 md:pb-8 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{PAGE_META[tab]?.h}</h1>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{PAGE_META[tab]?.sub}</p>
          </div>
          {tab === 'pipeline' && <PipelineTab user={user} />}
          {tab === 'jobs'     && <JobsTab user={user} />}
          {tab === 'mentors'  && <MentorsTab user={user} />}
          {tab === 'settings' && <SettingsTab user={user} profile={profile} />}
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#16242c] border-t border-gray-100 dark:border-gray-800 flex safe-area-bottom">
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
                  active ? 'text-[#0ea5e9]' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon active={active} />
                {label}
              </button>
            )
          })}
        </nav>
      </main>
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#101c22] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ea5e9]" />
      </div>
    }>
      <DashboardShell />
    </Suspense>
  )
}
