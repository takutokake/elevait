'use client'

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

/* ─────────────────────────────────────────────────────────────
   Animated hero pipeline preview (from UI kit HeroAppPreview)
───────────────────────────────────────────────────────────── */
function HeroPreview() {
  const [active, setActive] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % 4), 2800);
    return () => clearInterval(t);
  }, []);
  const cols = [
    { k: 'Saved',     n: 12, c: '#94a3b8' },
    { k: 'Applied',   n: 8,  c: '#0ea5e9' },
    { k: 'Interview', n: 3,  c: '#f97316' },
    { k: 'Offer',     n: 1,  c: '#10b981' },
  ];
  return (
    <Link href="/student/dashboard?tab=pipeline"
      className="block bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/80 overflow-hidden"
      style={{ transform: 'rotate(-0.5deg)' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="ml-3 text-[11px] text-gray-400 font-mono">elevait.app / pipeline</span>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold text-gray-800 mb-3">Your pipeline</p>
        <div className="grid grid-cols-4 gap-2">
          {cols.map((c, i) => (
            <div key={c.k} className="rounded-xl p-2.5 transition-all duration-300"
              style={{ background: i === active ? '#F8FAFC' : '#fff', border: `1.5px solid ${i === active ? c.c : '#F3F4F6'}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.c }} />
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{c.k}</span>
                <span className="ml-auto text-[10px] font-bold text-gray-800">{c.n}</span>
              </div>
              <div className="flex flex-col gap-1">
                {Array.from({ length: Math.min(3, c.n) }).map((_, j) => (
                  <div key={j} className="h-5 rounded flex items-center gap-1 px-1.5"
                    style={{ background: i === active ? '#fff' : '#fafafa', border: '1px solid #F3F4F6' }}>
                    <div className="w-3 h-3 rounded" style={{ background: ['#F1F5F9','#FEF3C7','#DBEAFE'][j%3] }} />
                    <div className="flex-1 h-1.5 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 items-center px-2.5 py-2 rounded-lg text-[11px] text-blue-800 font-medium"
          style={{ background: 'linear-gradient(90deg,#EFF6FF,#F5F3FF)', border: '1px solid #E0E7FF' }}>
          <span>✨</span>
          <span><b>Maya K.</b> (Stripe APM) just accepted your prep session</span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────
   Product UI Snippets for sticky scroll
───────────────────────────────────────────────────────────── */
function ProductPreview({ index, coaches = [] }: { index: number; coaches?: any[] }) {
  const chrome = (
    <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100 bg-gray-50/80">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
    </div>
  );

  if (index === 0) {
    return (
      <div
        className="rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-2xl"
        style={{ transform: 'perspective(900px) rotateY(-4deg) rotateX(2deg)', boxShadow: '0 32px 80px -12px rgba(14,165,233,0.18), 0 8px 32px -8px rgba(0,0,0,0.12)' }}
      >
        {/* App top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Image src="/images/Elevait_logo.png" alt="Elevait" width={90} height={28} className="h-7 w-auto object-contain" />
          </div>
        </div>
        {/* Kanban */}
        <div className="p-3 bg-gray-50/60">
          <div className="flex gap-2">
            {[
              { label: 'Saved',     color: '#64748b', cards: [['Stripe','APM'],['Linear','APM']] },
              { label: 'Applied',   color: '#0ea5e9', cards: [['Figma','PM'],['Notion','APM']] },
              { label: 'Interview', color: '#f97316', cards: [['Google','APM']] },
              { label: 'Offer',     color: '#10b981', cards: [['Vercel','PM']] },
            ].map(col => (
              <div key={col.label} className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1.5" style={{ borderLeft: `2px solid ${col.color}`, paddingLeft: 4 }}>
                  <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: col.color }}>{col.label}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {col.cards.map(([co, role]) => (
                    <div key={co} className="bg-white rounded-lg border border-gray-100 px-2 py-1.5 shadow-sm">
                      <p className="text-[9px] font-bold text-gray-800">{co}</p>
                      <p className="text-[8px] text-gray-400">{role}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div
        className="rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-2xl"
        style={{ transform: 'perspective(900px) rotateY(-4deg) rotateX(2deg)', boxShadow: '0 32px 80px -12px rgba(249,115,22,0.18), 0 8px 32px -8px rgba(0,0,0,0.12)' }}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          {chrome.props.children}
          <span className="text-xs font-bold text-gray-700 ml-3">PM Jobs</span>
          <div className="flex items-center gap-1.5 ml-auto px-2.5 py-1 bg-gray-100 rounded-lg">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-[10px] text-gray-400">Search roles...</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          {[
            { domain: 'google.com', co: 'Google',  role: 'Associate PM',  loc: 'New York',  saved: true },
            { domain: 'stripe.com', co: 'Stripe',   role: 'APM',           loc: 'Remote',    saved: false },
            { domain: 'figma.com',  co: 'Figma',    role: 'PM Intern',     loc: 'SF',        saved: false },
          ].map((job) => (
            <div key={job.co} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-gray-100 bg-white flex-shrink-0 flex items-center justify-center">
                <img src={`https://www.google.com/s2/favicons?domain=${job.domain}&sz=64`} alt={job.co} width={28} height={28} className="w-5 h-5 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-800">{job.role} · {job.co}</p>
                <p className="text-[9px] text-gray-400">{job.loc}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                job.saved ? 'bg-[#0ea5e9] text-white' : 'bg-gray-100 text-gray-500'
              }`}>{job.saved ? 'Saved ✓' : 'Save →'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div
        className="rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-2xl"
        style={{ transform: 'perspective(900px) rotateY(-4deg) rotateX(2deg)', boxShadow: '0 32px 80px -12px rgba(139,92,246,0.18), 0 8px 32px -8px rgba(0,0,0,0.12)' }}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">Coaches</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Matched → Google Interview</span>
        </div>
        <div className="p-3 space-y-2">
          {(coaches.length >= 3 ? coaches.slice(0, 3).map((c: any) => ({
            name: c.full_name || 'Coach',
            title: `${c.mentor_data?.current_title || 'PM'}${c.mentor_data?.current_company ? ' @ ' + c.mentor_data.current_company : ''}`,
            avatar: c.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || 'Coach')}&background=0ea5e9&color=fff&size=128`,
            free: (c.mentor_data?.pricing_model || 'free') === 'free',
            price: c.mentor_data?.price_cents ? `$${Math.round(c.mentor_data.price_cents / 100)}` : null,
          })) : [
            { name: 'Maya K.',   title: 'APM @ Google', avatar: 'https://ui-avatars.com/api/?name=Maya+K&background=0ea5e9&color=fff&size=128', free: true,  price: null },
            { name: 'Jordan R.', title: 'PM @ Google',  avatar: 'https://ui-avatars.com/api/?name=Jordan+R&background=8b5cf6&color=fff&size=128', free: false, price: '$50' },
            { name: 'Alex L.',   title: 'APM @ Google', avatar: 'https://ui-avatars.com/api/?name=Alex+L&background=10b981&color=fff&size=128', free: true,  price: null },
          ]).map((m: any) => (
            <div key={m.name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
              <img src={m.avatar} alt={m.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-800">{m.name}</p>
                <p className="text-[9px] text-gray-400">{m.title}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${ m.free ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600' }`}>{m.free ? 'FREE' : m.price}</span>
                <span className="text-[9px] font-semibold text-[#0ea5e9]">Book →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-2xl"
      style={{ transform: 'perspective(900px) rotateY(-4deg) rotateX(2deg)', boxShadow: '0 32px 80px -12px rgba(16,185,129,0.18), 0 8px 32px -8px rgba(0,0,0,0.12)' }}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">Gmail</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
        </span>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50">
          <p className="text-[9px] text-gray-400 mb-0.5">From: talent@google.com</p>
          <p className="text-[10px] font-semibold text-gray-800 leading-relaxed">&ldquo;Congrats! We&rsquo;d like to move you to the next round...&rdquo;</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-px h-3 bg-gray-200" />
          <span className="text-[9px] text-gray-400 font-medium">auto-detected</span>
          <div className="w-px h-3 bg-gray-200" />
          <svg className="w-3 h-3 text-gray-300" viewBox="0 0 10 10" fill="currentColor"><path d="M5 9L0.669873 1.5L9.33013 1.5L5 9Z"/></svg>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 border border-orange-100">
          <span className="text-[9px] font-bold px-2 py-0.5 bg-sky-100 text-sky-700 rounded">Applied</span>
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-200 text-orange-700 rounded">Interview</span>
          <span className="text-[9px] text-gray-400 truncate">· Google APM</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   How it’s Different — Sticky Scroll (Apple-style)
───────────────────────────────────────────────────────────── */
function HowItsDifferentSection({ coaches = [] }: { coaches?: any[] }) {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const available = el.offsetHeight - window.innerHeight;
      if (available <= 0) return;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(0.9999, scrolled / available));
      setActive(Math.floor(pct * 4));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: '📋', color: '#0ea5e9', bg: '#EFF9FF', num: '01',
      title: 'Applications are the center',
      body: 'Every mentor, job, and resource lives around your applications. Drag cards, update stages, and see your whole hunt at a glance.',
      link: '/student/dashboard?tab=pipeline', linkText: 'Open my pipeline →',
    },
    {
      icon: '🎯', color: '#f97316', bg: '#FFF7ED', num: '02',
      title: 'Jobs flow straight into your tracker',
      body: 'One click saves a PM role from the job board into your pipeline as “Saved.” No copy pasting, no spreadsheet rows, no lost tabs.',
      link: '/jobs', linkText: 'Browse PM jobs →',
    },
    {
      icon: '🤝', color: '#8b5cf6', bg: '#F5F3FF', num: '03',
      title: 'Mentors matched to your interviews',
      body: 'When you move a card to Interview, we show coaches who were recently hired at that exact company. Your prep stays fresh and relevant.',
      link: '/coaches', linkText: 'Find a coach →',
    },
    {
      icon: '✉️', color: '#10b981', bg: '#ECFDF5', num: '04',
      title: 'Gmail keeps your stages updated',
      body: 'Connect Gmail once and we pick up recruiter emails for you. Cards move from Applied to Interview automatically, and rejections get flagged.',
      link: '/student/dashboard?tab=settings', linkText: 'Set it up →',
    },
  ];

  const f = features[active];

  return (
    <div ref={sectionRef} style={{ height: '400vh' }}>
      <div
        className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden transition-colors duration-700"
        style={{ background: f.bg }}
      >
        {/* Top label */}
        <div className="absolute top-7 left-0 right-0 text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">How it's different</span>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Left: animated content */}
          <div key={active} className="animate-slide-right">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: f.color }}>
              {f.num} / 04
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5 tracking-tight">
              {f.title}
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">{f.body}</p>
            <Link
              href={f.link}
              className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full text-white transition-all hover:scale-105"
              style={{ background: f.color, boxShadow: `0 8px 24px -8px ${f.color}80` }}
            >
              {f.linkText}
            </Link>
          </div>

          {/* Right: product preview (desktop) */}
          <div key={`prev-${active}`} className="hidden lg:block animate-slide-right">
            <ProductPreview index={active} coaches={coaches} />
          </div>

          {/* Mobile dot nav */}
          <div className="flex lg:hidden justify-center gap-2.5">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 20 : 8,
                  height: 8,
                  background: i === active ? f.color : '#CBD5E1',
                }}
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${(active + 1) * 25}%`, background: f.color }}
          />
        </div>

        {/* Scroll hint */}
        {active === 0 && (
          <div className="absolute bottom-5 right-8 flex items-center gap-1.5 text-gray-400 text-xs animate-pulse pointer-events-none">
            <span>scroll</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Interactive Journey section (from UI kit Journey)
───────────────────────────────────────────────────────────── */
function JourneySection() {
  const [step, setStep] = useState(0);
  const steps = [
    { t: 'Discover & Apply', sub: 'Step 1', body: 'Browse our PM job board and save roles directly to your tracker. They land as “Saved” with one click — no tabs, no spreadsheets.' },
    { t: 'Track Interviews',  sub: 'Step 2', body: 'Drag cards through stages as you progress. We surface relevant mentors and resources at each stage to keep you prepared.' },
    { t: 'Get Mentorship',    sub: 'Step 3', body: 'Connect with coaches who were recently hired at your target companies. Book a session, access prep resources, and nail the interview.' },
    { t: 'Offer',             sub: 'Step 4', body: 'Negotiate with confidence using guidance from a peer who received the same offer. Compare competing offers side-by-side.' },
  ];
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 4500);
    return () => clearInterval(t);
  }, []);
  const colors = ['#94a3b8', '#0ea5e9', '#f97316', '#10b981'];
  const stages = ['Saved', 'Applied', 'Interview', 'Offer'];
  return (
    <section className="py-20 sm:py-24 bg-gray-50/80 dark:bg-[#0d161b]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="text-xs font-bold uppercase tracking-widest text-[#0ea5e9] mb-2">The journey</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">One tool, whole hunt.</h2>
        </div>
        {/* Tab strip */}
        <div className="grid grid-cols-4 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden mb-4">
          {steps.map((s, i) => (
            <button key={s.t} onClick={() => setStep(i)}
              className="relative px-3 py-4 text-left transition-colors"
              style={{ background: step === i ? '#fff' : '#fafbfc' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full transition-colors"
                  style={{ background: step === i ? colors[i] : '#CBD5E1' }} />
                <span className="text-[10px] text-gray-400 font-medium">{s.sub}</span>
              </div>
              <div className="text-sm font-bold" style={{ color: step === i ? '#111' : 'rgba(51,51,51,0.65)' }}>{s.t}</div>
              {step === i && <div className="absolute left-0 right-0 bottom-0 h-0.5" style={{ background: colors[i] }} />}
            </button>
          ))}
        </div>
        {/* Body */}
        <div className="bg-white dark:bg-[#16242c] border border-gray-200 dark:border-gray-700 rounded-2xl p-7 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center min-h-[180px]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors[step] }}>
              {steps[step].sub} · step {step + 1} of 4
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{steps[step].t}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{steps[step].body}</p>
          </div>
          {/* Mini kanban viz */}
          <div className="grid grid-cols-4 gap-1.5">
            {stages.map((s, i) => (
              <div key={s} className="rounded-xl p-2 transition-all duration-300"
                style={{
                  background: i === step ? '#fff' : '#fafbfc',
                  border: `1.5px solid ${i === step ? colors[i] : '#F1F5F9'}`,
                  transform: i === step ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: i === step ? `0 12px 24px -12px ${colors[i]}40` : 'none',
                }}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[i] }} />
                  <span className="text-[8px] font-bold uppercase tracking-wide text-gray-700">{s}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-4 rounded flex items-center gap-1 px-1"
                      style={{ background: '#fff', border: '1px solid #F3F4F6', opacity: i === step ? 1 : 0.45 }}>
                      <div className="w-2 h-2 rounded" style={{ background: ['#F1F5F9','#FEF3C7','#DBEAFE'][j%3] }} />
                      <div className="flex-1 h-1 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Coach Face Carousel (auto-scrolling marquee)
───────────────────────────────────────────────────────────── */
function CoachCarousel({ coaches }: { coaches: any[] }) {
  if (coaches.length === 0) return null;
  const minItems = Math.max(coaches.length, Math.ceil(3000 / 104));
  const repeats = Math.ceil(minItems / coaches.length);
  const base = Array.from({ length: repeats }, () => coaches).flat();
  const doubled = [...base, ...base];
  return (
    <section className="py-10 bg-white dark:bg-[#101c22] overflow-hidden border-y border-gray-100 dark:border-gray-800">
      <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-8">
        Coaches ready to help you land your PM role
      </p>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-[#101c22] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-[#101c22] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-8 animate-marquee-slow" style={{ width: 'max-content' }}>
          {doubled.map((coach, i) => {
            const name = coach.full_name || 'Coach';
            const company = coach.mentor_data?.current_company || coach.mentor_data?.current_title || '';
            const avatar = coach.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&size=128`;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 72 }}>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm flex-shrink-0">
                  <img src={avatar} alt={name} width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-200 text-center leading-tight">{name.split(' ')[0]}</p>
                <p className="text-[9px] text-gray-400 text-center leading-tight">{company}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [featuredMentors, setFeaturedMentors] = useState<any[]>([]);

  // Redirect logged-in users straight to their pipeline
  useEffect(() => {
    fetch('/api/me').then(r => {
      if (r.ok) return r.json();
    }).then(data => {
      if (data?.user) {
        if (data.profile?.role === 'mentor') {
          router.replace('/mentor/dashboard');
        } else {
          router.replace('/student/dashboard?tab=pipeline');
        }
      }
    }).catch(() => {});
  }, [router]);

  // Fetch featured coaches
  useEffect(() => {
    fetch('/api/coaches?limit=16').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.mentors) {
        const shuffled = [...data.mentors].sort(() => 0.5 - Math.random());
        setFeaturedMentors(shuffled.slice(0, 12));
      }
    }).catch(() => {});
  }, []);

  // Sample testimonials
  const testimonials = [
    {
      quote: "The coaching sessions were incredibly helpful in preparing me for the Capital One interview process. My coach provided detailed insights and practice that made all the difference.",
      name: "Anonymous",
      role: "PDP @ Capital One",
      hiredDate: "October 2025"
    },
    {
      quote: "I knew nothing about PM interviews and had never interviewed before. After working with my coach, I gained the confidence and skills needed to succeed. The transformation was incredible.",
      name: "Anonymous",
      role: "Product Management Intern @ Roblox",
      hiredDate: "November 2025"
    },
    {
      quote: "The personalized coaching and real-world interview experience shared by my coach helped me navigate the Amazon interview process successfully.",
      name: "Anonymous",
      role: "Program Management Intern @ Amazon",
      hiredDate: "December 2025"
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "Why are most coaches interns or recent grads?",
      answer: "Because they have the freshest interview experience! They remember the exact questions, the current formats, and what hiring managers are looking for RIGHT NOW. A PM who interviewed 5 years ago is less helpful than someone who interviewed 3 months ago."
    },
    {
      question: "How is this different from paid coaching platforms?",
      answer: "Traditional platforms charge $200-500 per session with senior coaches. We believe peer coaching works better—and it should be free or low-cost. Our coaches are giving back to the community that helped them."
    },
    {
      question: "Why would coaches work for free?",
      answer: "Many of our coaches got help from others during their job search and want to pay it forward. Others charge $20-40 to make coaching sustainable. Everyone sets their own rate."
    },
    {
      question: "Can I trust advice from someone who just got hired?",
      answer: "Absolutely. In fact, recent hires often give better interview prep because they remember every detail. They're also more realistic about what it takes to get hired in today's market."
    },
    {
      question: "What if I want to coach too?",
      answer: "Amazing! If you've been hired as a PM in the last 2 years, apply to become a coach. It takes 5 minutes to set up your profile and availability."
    }
  ];

  return (
    <Layout variant="landing">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#101c22] pt-20 pb-16 sm:pt-28 sm:pb-20">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-20 bg-[radial-gradient(circle,rgba(139,92,246,0.3)_0%,transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute top-20 -right-40 w-[500px] h-[500px] rounded-full opacity-15 bg-[radial-gradient(circle,rgba(14,165,233,0.35)_0%,transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="text-sm font-semibold text-[#0ea5e9] tracking-wide mb-4">Your personal recruitment OS</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-gray-900 dark:text-white mb-5">
              One place for every{' '}
              <span className="bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] bg-clip-text text-transparent">
                application
              </span>
              , mentor, and job.
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg mb-8">
              Elevait lives alongside you through the whole PM job hunt. Track every role, prep with peers who just got hired, and never lose track of where you are.
            </p>
            <div className="flex flex-wrap gap-3 mb-7">
              <Link href="/student/dashboard?tab=pipeline"
                className="px-7 py-3.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-full shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-200 hover:-translate-y-0.5">
                Open My Pipeline →
              </Link>
              <Link href="/mentor/apply"
                className="px-7 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold rounded-full hover:border-[#8b5cf6]/60 hover:text-[#8b5cf6] transition-all duration-200">
                Become a mentor →
              </Link>
            </div>
            <div className="flex gap-6 text-sm text-gray-400 flex-wrap">
              <span>✓ Free peer coaching</span>
              <span>✓ No credit card</span>
              <span>✓ 100+ PMs hired</span>
            </div>
          </div>
          {/* Right: animated preview */}
          <div className="w-full max-w-lg mx-auto lg:mx-0">
            <HeroPreview />
          </div>
        </div>
      </div>

      {/* ── COACH CAROUSEL ────────────────────────────────────── */}
      <CoachCarousel coaches={featuredMentors} />

      {/* ── HOW IT'S DIFFERENT ─────────────────────────────────── */}
      <HowItsDifferentSection coaches={featuredMentors} />

      {/* ── JOURNEY ───────────────────────────────────────────── */}
      <JourneySection />

      {/* ── COACHES ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white dark:bg-[#101c22]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-bold uppercase tracking-widest text-[#f97316] mb-2">Meet Our Coaches</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Recent PM hires ready to help.</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">They just went through what you&apos;re preparing for.</p>
          </div>

          {featuredMentors.length > 0 ? (
            <div className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-[#101c22] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-[#101c22] to-transparent z-10 pointer-events-none" />
              <div className="flex gap-4 animate-marquee-slow" style={{ width: 'max-content' }}>
                {[...featuredMentors, ...featuredMentors].map((mentor, i) => {
                  const md = mentor.mentor_data;
                  const name = mentor.full_name || 'Anonymous Coach';
                  const title = md?.current_title || 'Product Manager';
                  const company = md?.current_company || '';
                  const isFree = (md?.pricing_model || 'free') === 'free';
                  const price = md?.price_cents ? `$${Math.round(md.price_cents / 100)}` : null;
                  const avatar = mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&size=128`;
                  return (
                    <Link key={`${mentor.id}-${i}`} href={`/coaches/${mentor.id}`}
                      className="flex-shrink-0 w-52 flex flex-col bg-white dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:border-[#0ea5e9]/40 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Image src={avatar} alt={name} width={40} height={40} className="rounded-full object-cover flex-shrink-0 w-10 h-10" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{title}</p>
                        </div>
                      </div>
                      {company && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] whitespace-nowrap">@ {company}</span>
                        </div>
                      )}
                      <div className="mt-auto pt-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFree ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>{isFree ? 'FREE' : `${price}/session`}</span>
                        <span className="text-[11px] font-semibold text-[#0ea5e9]">Book →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-400 text-sm">
                Coaches coming soon.{' '}
                <Link href="/mentor/apply" className="text-[#0ea5e9] font-medium hover:underline">Apply to be a coach →</Link>
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <Link href="/coaches" className="text-[#0ea5e9] font-semibold text-sm">View all coaches →</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-gray-50/60 dark:bg-[#0d161b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-12">
            Join 100+ PMs who got coached and hired.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="flex flex-col bg-white dark:bg-[#16242c] rounded-2xl border border-gray-100 dark:border-gray-800 p-7">
                <p className="flex-1 text-base text-gray-600 dark:text-gray-300 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-[#0ea5e9] font-medium mt-0.5">{t.role}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Hired {t.hiredDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white dark:bg-[#101c22]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-12">Common Questions</h2>
          <div className="flex flex-col gap-3">
            {faqItems.map((item, i) => (
              <details key={i} className="group bg-gray-50 dark:bg-[#16242c] rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none gap-4">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{item.question}</span>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-white text-xs group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>

        </div>
      </section>
    </Layout>
  )
}
