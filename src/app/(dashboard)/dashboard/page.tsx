'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '@/hooks/useDashboard'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  IconPond, IconCycle, IconApproval, IconScale,
  IconPlanning, IconOperational, IconSampling,
  IconHarvest, IconDistribution, IconReport, IconUsers,
  IconChevronRight,
} from '@/components/ui/Icon'

gsap.registerPlugin(useGSAP)

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function getFormattedDate() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Stat Card ─────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number
  unit: string
  icon: React.ReactNode
  accentColor: string
  accentBg: string
  loading: boolean
  format?: (v: number) => string
}

function StatCard({ label, value, unit, icon, accentColor, accentBg, loading, format }: StatCardProps) {
  const numRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (loading || !numRef.current) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: value,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate() {
        if (numRef.current)
          numRef.current.textContent = format
            ? format(Math.round(obj.val))
            : Math.round(obj.val).toLocaleString('id-ID')
      },
    })
  }, { dependencies: [loading, value] })

  return (
    <div className="card p-5 flex flex-col justify-between gap-4" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accentBg, color: accentColor }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: accentBg, color: accentColor }}
        >
          {unit}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-1.5">
          <Skeleton height={28} width={48} />
          <Skeleton height={11} width={90} rounded="rounded" />
        </div>
      ) : (
        <div>
          <div className="text-3xl font-bold tracking-tight leading-none mb-1" style={{ color: 'var(--color-text-primary)' }}>
            <span ref={numRef}>0</span>
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
        </div>
      )}

      {/* bottom accent bar */}
      <div className="h-0.5 rounded-full" style={{ background: `linear-gradient(to right, ${accentColor}40, transparent)` }} />
    </div>
  )
}

// ── Module Card ───────────────────────────────────────────────
interface ModuleCardProps {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
  tag?: string
}

function ModuleCard({ href, title, desc, icon, tag }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-3.5 p-4 group"
      style={{
        textDecoration: 'none',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'var(--shadow-card-hover)'
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = 'var(--color-ocean-200)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'var(--shadow-card)'
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'var(--color-border)'
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-ocean-100"
        style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-800)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{title}</span>
          {tag && (
            <span className="text-xs px-1.5 py-px rounded-full font-semibold" style={{ background: 'var(--color-ocean-100)', color: 'var(--color-ocean-700)' }}>
              {tag}
            </span>
          )}
        </div>
        <p className="text-xs leading-snug truncate" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
      </div>
      <IconChevronRight size={14} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'var(--color-text-muted)' } as React.CSSProperties} />
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, role } = useAuth()
  const { stats, loading } = useDashboard()
  const pageRef = useRef<HTMLDivElement>(null)

  const userName = user?.user_metadata?.nama ?? user?.email?.split('@')[0] ?? 'Pengguna'

  useGSAP(() => {
    gsap.from('.dash-header', { y: -10, opacity: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' })
    gsap.from('.stat-card', {
      y: 18, opacity: 0, duration: 0.5, stagger: 0.07,
      ease: 'power2.out', delay: 0.15, clearProps: 'all',
    })
  }, { scope: pageRef })

  const STATS: StatCardProps[] = [
    {
      label: 'Kolam aktif',
      value: stats?.kolamAktif ?? 0,
      unit: 'kolam',
      icon: <IconPond size={17} />,
      accentColor: 'var(--color-ocean-700)',
      accentBg: 'var(--color-ocean-50)',
      loading,
    },
    {
      label: 'Siklus berjalan',
      value: stats?.siklusBerjalan ?? 0,
      unit: 'siklus',
      icon: <IconCycle size={17} />,
      accentColor: '#0284c7',
      accentBg: '#e0f2fe',
      loading,
    },
    {
      label: 'Menunggu approval',
      value: stats?.menungguApproval ?? 0,
      unit: 'rencana',
      icon: <IconApproval size={17} />,
      accentColor: '#b45309',
      accentBg: '#fef3c7',
      loading,
    },
    {
      label: 'Panen bulan ini',
      value: stats?.panenBulanIni ?? 0,
      unit: 'kg',
      icon: <IconScale size={17} />,
      accentColor: '#15803d',
      accentBg: '#dcfce7',
      loading,
      format: v => v.toLocaleString('id-ID'),
    },
  ]

  const MODULES = [
    { href: '/perencanaan', title: 'Perencanaan & Skoring Risiko', desc: 'Buat rencana tebar, simulasi risiko, approval', icon: <IconPlanning size={17} />, tag: 'Inti' },
    { href: '/operasional',  title: 'Operasional Harian',          desc: 'Log pakan, kualitas air, catatan hama',     icon: <IconOperational size={17} /> },
    { href: '/sampling',     title: 'Sampling Pertumbuhan',        desc: 'Catat bobot mingguan, populasi, FCR',       icon: <IconSampling size={17} /> },
    { href: '/panen',        title: 'Panen & Pasca Panen',         desc: 'Hasil panen, grade produk, pendapatan',     icon: <IconHarvest size={17} /> },
    { href: '/distribusi',   title: 'Distribusi',                  desc: 'Kirim ke pengepul, pasar, atau mitra',      icon: <IconDistribution size={17} /> },
    { href: '/laporan',      title: 'Laporan & Evaluasi',          desc: 'Generate laporan keuangan & produksi',      icon: <IconReport size={17} /> },
    ...(role === 'admin' ? [{ href: '/pengguna', title: 'Manajemen Pengguna', desc: 'Kelola akun, role, dan akses sistem', icon: <IconUsers size={17} /> }] : []),
  ]

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-screen-xl mx-auto">

      {/* ── Header ── */}
      <div className="dash-header flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {getGreeting()},{' '}
            <span style={{ color: 'var(--color-ocean-800)' }}>{userName}</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {getFormattedDate()}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="grid lg:grid-cols-[1fr_260px] gap-5">

        {/* Module grid */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Modul Sistem
          </p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {MODULES.map(m => <ModuleCard key={m.href} {...m} />)}
          </div>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">

          {/* Risk categories */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Kategori Risiko
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Best Case',   range: '≤ 10',  color: 'var(--color-risk-best)',   bg: 'var(--color-risk-best-bg)' },
                { label: 'Middle Case', range: '11–20', color: 'var(--color-risk-middle)', bg: 'var(--color-risk-middle-bg)' },
                { label: 'Worst Case',  range: '> 20',  color: 'var(--color-risk-worst)',  bg: 'var(--color-risk-worst-bg)' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: r.bg, color: r.color }}
                  >
                    {r.label}
                  </span>
                  <span className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {r.range}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 pt-3 text-xs leading-relaxed"
              style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              Skor = Σ (Potensi × Dampak) dari 4 faktor risiko.
            </div>
          </div>

          {/* Quick start */}
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Panduan Mulai
            </p>
            <div className="flex flex-col">
              {[
                { step: '1', text: 'Daftarkan kolam',        href: '/pengguna' },
                { step: '2', text: 'Buat rencana tebar',     href: '/perencanaan' },
                { step: '3', text: 'Simulasi skoring risiko', href: '/perencanaan' },
                { step: '4', text: 'Log operasional harian', href: '/operasional' },
              ].map((s, i, arr) => (
                <Link
                  key={s.step}
                  href={s.href}
                  className="flex items-center gap-3 py-2.5 text-xs transition-colors hover:opacity-80"
                  style={{
                    color: 'var(--color-text-secondary)',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ background: 'var(--color-ocean-900)', color: '#fff' }}
                  >
                    {s.step}
                  </span>
                  {s.text}
                  <IconChevronRight size={12} className="ml-auto" style={{ color: 'var(--color-text-muted)' } as React.CSSProperties} />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
