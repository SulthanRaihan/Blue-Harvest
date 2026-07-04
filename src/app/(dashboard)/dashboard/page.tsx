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

// ── Greeting ──────────────────────────────────────────────────
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
  unit?: string
  icon: React.ReactNode
  accent: string
  loading: boolean
  format?: (v: number) => string
}

function StatCard({ label, value, unit, icon, accent, loading, format }: StatCardProps) {
  const numRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (loading || !numRef.current) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: value,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate() {
        if (numRef.current) {
          numRef.current.textContent = format
            ? format(Math.round(obj.val))
            : Math.round(obj.val).toLocaleString('id-ID')
        }
      },
    })
  }, { dependencies: [loading, value] })

  return (
    <div
      className="card card-hover p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ '--accent': accent } as React.CSSProperties}
    >
      {/* top accent line */}
      <div className="absolute top-0 left-5 right-5 h-px" style={{ background: accent, opacity: 0.4 }} />

      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${accent}12`, color: accent }}>
          {unit ?? 'total'}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-1.5">
          <Skeleton height={32} width={64} rounded="rounded-md" />
          <Skeleton height={12} width={100} rounded="rounded" />
        </div>
      ) : (
        <div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            <span ref={numRef}>0</span>
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
        </div>
      )}
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
      className="module-card card flex items-center gap-4 p-4 group transition-all duration-200"
      style={{ textDecoration: 'none' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-ocean-200)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
        style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{title}</span>
          {tag && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-sky-100)', color: 'var(--color-ocean-700)' }}>
              {tag}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
      </div>
      <IconChevronRight size={15} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'var(--color-text-muted)' } as React.CSSProperties} />
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
    const tl = gsap.timeline()
    tl.from('.dash-header', { y: -12, autoAlpha: 0, duration: 0.5, ease: 'power2.out' })
      .from('.stat-card', { y: 20, autoAlpha: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }, '-=0.2')
      .from('.module-card', { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, '-=0.2')
      .from('.side-panel', { x: 16, autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, '-=0.4')
  }, { scope: pageRef })

  const STATS = [
    {
      label: 'Kolam aktif',
      value: stats?.kolamAktif ?? 0,
      unit: 'kolam',
      icon: <IconPond size={18} />,
      accent: '#0b2d4e',
    },
    {
      label: 'Siklus berjalan',
      value: stats?.siklusBerjalan ?? 0,
      unit: 'siklus',
      icon: <IconCycle size={18} />,
      accent: '#0ea5e9',
    },
    {
      label: 'Menunggu approval',
      value: stats?.menungguApproval ?? 0,
      unit: 'rencana',
      icon: <IconApproval size={18} />,
      accent: '#d97706',
    },
    {
      label: 'Panen bulan ini',
      value: stats?.panenBulanIni ?? 0,
      unit: 'kg',
      icon: <IconScale size={18} />,
      accent: '#16a34a',
      format: (v: number) => v.toLocaleString('id-ID'),
    },
  ]

  const MODULES = [
    { href: '/perencanaan', title: 'Perencanaan & Skoring Risiko', desc: 'Buat rencana tebar, simulasi risiko, approval Owner', icon: <IconPlanning size={18} />, tag: 'Inti' },
    { href: '/operasional', title: 'Operasional Harian', desc: 'Log pakan, kualitas air, catatan hama tiap hari', icon: <IconOperational size={18} /> },
    { href: '/sampling',    title: 'Sampling Pertumbuhan', desc: 'Input mingguan bobot, estimasi populasi, FCR', icon: <IconSampling size={18} /> },
    { href: '/panen',       title: 'Panen & Pasca Panen', desc: 'Catat hasil panen, grade, dan pendapatan', icon: <IconHarvest size={18} /> },
    { href: '/distribusi',  title: 'Distribusi', desc: 'Kirim produk ke pengepul, pasar, atau mitra', icon: <IconDistribution size={18} /> },
    { href: '/laporan',     title: 'Laporan & Evaluasi', desc: 'Generate laporan keuangan dan produksi otomatis', icon: <IconReport size={18} /> },
    ...(role === 'admin' ? [{ href: '/pengguna', title: 'Manajemen Pengguna', desc: 'Kelola akun, role, dan akses sistem', icon: <IconUsers size={18} /> }] : []),
  ]

  return (
    <div ref={pageRef} className="px-6 py-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="dash-header mb-7">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {getGreeting()},{' '}
          <span style={{ color: 'var(--color-ocean-900)' }}>{userName}</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {getFormattedDate()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card">
            <StatCard {...s} loading={loading} />
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        {/* Module grid */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Modul Sistem
          </h2>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {MODULES.map(m => <ModuleCard key={m.href} {...m} />)}
          </div>
        </div>

        {/* Side panel */}
        <div className="side-panel flex flex-col gap-4">
          {/* Risk legend */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Kategori Risiko
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Best Case', range: '≤ 10', cls: 'badge-best' },
                { label: 'Middle Case', range: '11–20', cls: 'badge-middle' },
                { label: 'Worst Case', range: '> 20', cls: 'badge-worst' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.cls}`}>{r.label}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{r.range}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Skor = Σ (Potensi × Dampak) untuk 4 faktor risiko.
            </p>
          </div>

          {/* Quick start */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Mulai dari sini
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { step: '1', text: 'Daftarkan kolam di Pengguna', href: '/pengguna' },
                { step: '2', text: 'Buat rencana tebar baru', href: '/perencanaan' },
                { step: '3', text: 'Hitung skor risiko', href: '/perencanaan' },
                { step: '4', text: 'Mulai log operasional', href: '/operasional' },
              ].map(s => (
                <Link
                  key={s.step}
                  href={s.href}
                  className="flex items-center gap-2.5 text-xs py-1 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}
                  >
                    {s.step}
                  </span>
                  {s.text}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
