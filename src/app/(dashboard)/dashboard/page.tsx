'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard, type DashboardData, type RencanaRingkas } from '@/hooks/useDashboard'
import { useRecentActivity } from '@/hooks/useRecentActivity'
import { useTrenBulanan, useRoiPerKategori, useDashboardInsight, type DashboardInsightPayload } from '@/hooks/useOwnerInsight'
import type { ActivityType } from '@/lib/repositories/activity.repository'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import {
  IconPond, IconCycle, IconApproval, IconScale,
  IconPlanning, IconOperational, IconSampling, IconHarvest,
  IconReport, IconUsers, IconChevronRight,
} from '@/components/ui/Icon'
import { BubbleBackground } from '@/components/ui/BubbleBackground'
import { RiskDonut, BarChart, DeltaBadge } from '@/components/ui/Charts'
import { TrenAreaChart } from '@/components/charts/RechartsKit'
import { InfoHint } from '@/components/ui/InfoHint'
import { EmptyState } from '@/components/ui/EmptyState'
import type { UserRole, NamaKomoditas } from '@/types/database'

gsap.registerPlugin(useGSAP)

// ── Helpers ───────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}
function getFormattedDate() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function rupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}
function rupiahCompact(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`
  return rupiah(n)
}
function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng: 'Bandeng', nila: 'Nila', udang_vaname: 'Udang Vaname',
}

const ROLE_THEME: Record<UserRole, { accent: string; accentSoft: string; label: string; tagline: string }> = {
  petambak: { accent: '#0284c7', accentSoft: 'rgba(2,132,199,0.12)',  label: 'Petambak / Operator', tagline: 'Kelola siklus budidaya harian di lapangan' },
  admin:    { accent: '#7c3aed', accentSoft: 'rgba(124,58,237,0.12)', label: 'Admin',                tagline: 'Kelola data master, kolam, dan pengguna' },
  owner:    { accent: '#0f766e', accentSoft: 'rgba(15,118,110,0.12)', label: 'Manajemen / Owner',    tagline: 'Persetujuan rencana & evaluasi finansial' },
}

// ── Animated stat card ────────────────────────────────────────
interface StatProps {
  label: React.ReactNode
  value: number
  unit: string
  icon: React.ReactNode
  color: string
  bg: string
  loading: boolean
  format?: (v: number) => string
  href?: string
  delta?: React.ReactNode
}
function StatCard({ label, value, unit, icon, color, bg, loading, format, href, delta }: StatProps) {
  const numRef = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    if (loading || !numRef.current) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: value, duration: 1.2, ease: 'power3.out',
      onUpdate() {
        if (numRef.current)
          numRef.current.textContent = format ? format(Math.round(obj.val)) : Math.round(obj.val).toLocaleString('id-ID')
      },
    })
  }, { dependencies: [loading, value] })

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>{icon}</div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{unit}</span>
      </div>
      {loading ? (
        <div className="flex flex-col gap-1.5"><Skeleton height={28} width={56} /><Skeleton height={11} width={90} /></div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl font-bold tracking-tight leading-none" style={{ color: 'var(--color-text-primary)' }}>
              <span ref={numRef}>0</span>
            </div>
            {delta}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
        </div>
      )}
    </>
  )

  if (href) return (
    <Link href={href} className="stat-card card p-4 flex flex-col gap-3 card-hover" style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  )
  return <div className="stat-card card p-4 flex flex-col gap-3">{inner}</div>
}

// ── Hero banner ───────────────────────────────────────────────
function Hero({ nama, role, headline, cta }: { nama: string; role: UserRole; headline: React.ReactNode; cta?: { href: string; label: string } }) {
  const theme = ROLE_THEME[role]
  return (
    <div
      className="dash-hero relative overflow-hidden rounded-2xl p-6 lg:p-7 mb-5"
      style={{ background: 'linear-gradient(135deg, var(--color-ocean-950) 0%, var(--color-ocean-800) 100%)' }}
    >
      <BubbleBackground />
      {/* accent orb */}
      <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${theme.accent}55 0%, transparent 70%)` }} />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{theme.label}</span>
            <span className="text-xs" style={{ color: 'var(--color-ocean-300)' }}>{getFormattedDate()}</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold mb-1" style={{ color: '#fff' }}>
            {getGreeting()}, {nama}
          </h1>
          <p className="text-sm max-w-md" style={{ color: 'var(--color-ocean-200)' }}>{headline}</p>
        </div>
        {cta && (
          <Link href={cta.href}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start"
            style={{ background: '#fff', color: 'var(--color-ocean-900)' }}>
            {cta.label} <IconChevronRight size={15} />
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────
function SectionTitle({ children, action }: { children: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{children}</p>
      {action && (
        <Link href={action.href} className="text-xs font-semibold inline-flex items-center gap-0.5 hover:underline" style={{ color: 'var(--color-accent)' }}>
          {action.label} <IconChevronRight size={12} />
        </Link>
      )}
    </div>
  )
}

// ── Rencana row (reusable) ────────────────────────────────────
function RencanaRow({ r, accent }: { r: RencanaRingkas; accent: string }) {
  return (
    <Link href={`/perencanaan/${r.id_rencana}`}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = accent)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
        <IconPond size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{r.nama_kolam ?? '—'}</div>
        <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
          {r.komoditas ? KOMODITAS_LABEL[r.komoditas] : '—'} · {r.jumlah_benih.toLocaleString('id-ID')} ekor · {formatTanggal(r.tanggal_rencana)}
        </div>
      </div>
      <StatusBadge status={r.status} />
      <IconChevronRight size={14} className="shrink-0" style={{ color: 'var(--color-text-muted)' } as React.CSSProperties} />
    </Link>
  )
}

// ── Quick action tile ─────────────────────────────────────────
function QuickTile({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="card p-4 flex items-start gap-3 group"
      style={{ textDecoration: 'none', transition: 'transform .18s, box-shadow .18s, border-color .18s' }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = 'var(--shadow-card-hover)'; el.style.borderColor = 'var(--color-ocean-200)' }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'var(--shadow-card)'; el.style.borderColor = 'var(--color-border)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-800)' }}>{icon}</div>
      <div className="min-w-0">
        <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{title}</div>
        <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
      </div>
    </Link>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="card p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>{text}</div>
  )
}

// ════════════════════════════════════════════════════════════
//  PETAMBAK VIEW
// ════════════════════════════════════════════════════════════
function PetambakDashboard({ nama, data, loading }: { nama: string; data: DashboardData; loading: boolean }) {
  return (
    <>
      <Hero nama={nama} role="petambak"
        headline={data.siklusAktif > 0
          ? `${data.siklusAktif} siklus sedang berjalan. Jangan lupa catat operasional hari ini.`
          : 'Belum ada siklus aktif. Mulai dengan membuat rencana tebar.'}
        cta={{ href: '/operasional', label: 'Catat Operasional' }} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard label="Kolam aktif"       value={data.kolamAktif}       unit="kolam"   icon={<IconPond size={17} />}     color="#0284c7" bg="#e0f2fe" loading={loading} />
        <StatCard label="Siklus berjalan"   value={data.siklusAktif}      unit="siklus"  icon={<IconCycle size={17} />}    color="#0369a1" bg="#e0f2fe" loading={loading} href="/operasional" />
        <StatCard label="Menunggu approval" value={data.menungguApproval} unit="rencana" icon={<IconApproval size={17} />} color="#b45309" bg="#fef3c7" loading={loading} href="/perencanaan" />
        <StatCard label="Panen bulan ini"   value={data.panenBulanIniKg}  unit="kg"      icon={<IconScale size={17} />}    color="#15803d" bg="#dcfce7" loading={loading} format={v => v.toLocaleString('id-ID')} href="/panen" />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div>
          <SectionTitle action={{ href: '/perencanaan', label: 'Semua rencana' }}>Siklus Berjalan</SectionTitle>
          {loading ? (
            <div className="flex flex-col gap-2">{[1, 2].map(i => <Skeleton key={i} height={64} rounded="rounded-xl" />)}</div>
          ) : data.siklusAktifList.length === 0 ? (
            <EmptyState
              judul="Belum ada siklus berjalan"
              deskripsi="Mulai dengan membuat rencana tebar. Setelah Owner menyetujui, siklus bisa diaktifkan dan Anda mulai mencatat operasional harian."
              aksi={{ href: '/perencanaan', label: 'Buat Rencana Tebar' }}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {data.siklusAktifList.map(r => <RencanaRow key={r.id_rencana} r={r} accent="#0284c7" />)}
            </div>
          )}

          <div className="mt-6">
            <SectionTitle>Aksi Cepat</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-2.5">
              <QuickTile href="/operasional" title="Log Pakan & Air"  desc="Catat pakan harian dan kualitas air" icon={<IconOperational size={17} />} />
              <QuickTile href="/sampling"    title="Sampling"         desc="Input bobot & populasi mingguan"    icon={<IconSampling size={17} />} />
              <QuickTile href="/panen"       title="Catat Panen"      desc="Hasil panen, grade, distribusi"     icon={<IconHarvest size={17} />} />
              <QuickTile href="/perencanaan" title="Rencana Baru"     desc="Buat rencana tebar + skoring risiko" icon={<IconPlanning size={17} />} />
            </div>
          </div>
        </div>

        <RiskSidebar risikoBreakdown={data.risikoBreakdown} />
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
//  ADMIN VIEW
// ════════════════════════════════════════════════════════════
function AdminDashboard({ nama, data, loading }: { nama: string; data: DashboardData; loading: boolean }) {
  return (
    <>
      <Hero nama={nama} role="admin"
        headline={`${data.totalPengguna} pengguna dan ${data.totalKolam} kolam terdaftar dalam sistem.`}
        cta={{ href: '/pengguna', label: 'Kelola Pengguna' }} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total pengguna"   value={data.totalPengguna}    unit="akun"   icon={<IconUsers size={17} />}    color="#7c3aed" bg="#ede9fe" loading={loading} href="/pengguna" />
        <StatCard label="Total kolam"      value={data.totalKolam}       unit="kolam"  icon={<IconPond size={17} />}     color="#0284c7" bg="#e0f2fe" loading={loading} />
        <StatCard label="Kolam aktif"      value={data.kolamAktif}       unit="aktif"  icon={<IconCycle size={17} />}    color="#15803d" bg="#dcfce7" loading={loading} href="/operasional" />
        <StatCard label="Perlu verifikasi" value={data.menungguApproval} unit="draft"  icon={<IconApproval size={17} />} color="#b45309" bg="#fef3c7" loading={loading} href="/perencanaan" />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div>
          <SectionTitle>Manajemen Data Master</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
            <QuickTile href="/pengguna" title="Kelola Pengguna" desc="Tambah akun, ubah role & akses" icon={<IconUsers size={17} />} />
            <QuickTile href="/pengguna" title="Kelola Kolam"    desc="Data kolam, luas, status aktif" icon={<IconPond size={17} />} />
            <QuickTile href="/perencanaan" title="Verifikasi Rencana" desc="Tinjau rencana tebar masuk" icon={<IconPlanning size={17} />} />
            <QuickTile href="/laporan"  title="Laporan Sistem" desc="Rekap produksi & keuangan"     icon={<IconReport size={17} />} />
          </div>

          <SectionTitle action={{ href: '/perencanaan', label: 'Lihat semua' }}>Rencana Terbaru (Draft)</SectionTitle>
          {loading ? (
            <div className="flex flex-col gap-2">{[1, 2].map(i => <Skeleton key={i} height={64} rounded="rounded-xl" />)}</div>
          ) : data.rencanaDraft.length === 0 ? (
            <EmptyHint text="Tidak ada rencana draft yang perlu ditinjau." />
          ) : (
            <div className="flex flex-col gap-2">
              {data.rencanaDraft.map(r => <RencanaRow key={r.id_rencana} r={r} accent="#7c3aed" />)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <RecentActivity />
          <SystemSummary data={data} loading={loading} />
        </div>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
//  OWNER VIEW
// ════════════════════════════════════════════════════════════
function OwnerDashboard({ nama, data, loading }: { nama: string; data: DashboardData; loading: boolean }) {
  const profit = data.totalPendapatan - data.totalModal
  const roi = data.totalModal > 0 ? (profit / data.totalModal) * 100 : 0

  const [periodeBulan, setPeriodeBulan] = useState(6)
  const { tren, loading: loadingTren, deltaPendapatanPct } = useTrenBulanan(periodeBulan)
  const { data: roiPerKategori, loading: loadingRoi } = useRoiPerKategori()

  const insightPayload: DashboardInsightPayload | null = (loading || loadingTren || loadingRoi) ? null : {
    deltaPendapatanPct,
    totalPendapatan: data.totalPendapatan,
    totalModal: data.totalModal,
    menungguApproval: data.menungguApproval,
    siklusAktif: data.siklusAktif,
    roiPerKategori,
    komoditasBreakdown: data.komoditasBreakdown.map(k => ({ komoditas: k.komoditas, jumlah: k.jumlah })),
  }
  const { insight, loading: loadingInsight, error: insightError } = useDashboardInsight(insightPayload)

  return (
    <>
      <Hero nama={nama} role="owner"
        headline={data.menungguApproval > 0
          ? `${data.menungguApproval} rencana menunggu persetujuan Anda.`
          : 'Tidak ada rencana yang menunggu persetujuan saat ini.'}
        cta={data.menungguApproval > 0 ? { href: '/perencanaan', label: 'Tinjau Approval' } : undefined} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard label="Menunggu approval" value={data.menungguApproval} unit="rencana" icon={<IconApproval size={17} />} color="#b45309" bg="#fef3c7" loading={loading} href="/perencanaan" />
        <StatCard label="Siklus berjalan"   value={data.siklusAktif}      unit="siklus"  icon={<IconCycle size={17} />}    color="#0f766e" bg="#ccfbf1" loading={loading} href="/operasional" />
        <StatCard label="Total pendapatan"  value={data.totalPendapatan}  unit="Rp"      icon={<IconScale size={17} />}    color="#15803d" bg="#dcfce7" loading={loading || loadingTren} format={rupiahCompact}
          delta={<DeltaBadge pct={deltaPendapatanPct} />} />
        <StatCard label={<>ROI kumulatif<InfoHint istilah="roi" /></>} value={Math.round(roi)} unit="%" icon={<IconReport size={17} />}   color={roi >= 0 ? '#15803d' : '#b91c1c'} bg={roi >= 0 ? '#dcfce7' : '#fee2e2'} loading={loading} format={v => `${v}%`} />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Tren Pendapatan vs Biaya</p>
            <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--color-surface-muted)' }}>
              {[3, 6, 12].map(m => (
                <button
                  key={m}
                  onClick={() => setPeriodeBulan(m)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-md transition-all"
                  style={{
                    background: periodeBulan === m ? 'var(--color-surface-card)' : 'transparent',
                    color: periodeBulan === m ? 'var(--color-ocean-800)' : 'var(--color-text-muted)',
                    boxShadow: periodeBulan === m ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  {m} bln
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4 mb-6">
            {loadingTren ? (
              <Skeleton height={220} />
            ) : (
              <TrenAreaChart
                data={tren.map(t => ({ bulan: t.bulan, pendapatan: t.pendapatan, biaya: t.biaya }))}
                formatValue={rupiahCompact}
              />
            )}
          </div>

          <SectionTitle action={{ href: '/perencanaan', label: 'Semua rencana' }}>Perlu Persetujuan Anda</SectionTitle>
          {loading ? (
            <div className="flex flex-col gap-2">{[1, 2].map(i => <Skeleton key={i} height={64} rounded="rounded-xl" />)}</div>
          ) : data.rencanaDraft.length === 0 ? (
            <EmptyHint text="Semua rencana sudah ditinjau. 🎉" />
          ) : (
            <div className="flex flex-col gap-2">
              {data.rencanaDraft.map(r => <RencanaRow key={r.id_rencana} r={r} accent="#0f766e" />)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <InsightCard insight={insight} error={insightError} loading={loadingInsight || !insightPayload} />
          <RiskHealthCard risikoBreakdown={data.risikoBreakdown} roiPerKategori={roiPerKategori} loading={loading || loadingRoi} />
          <SystemSummary data={data} loading={loading} />
        </div>
      </div>
    </>
  )
}

// ── Groq Insight card ──────────────────────────────────────────
function InsightCard({ insight, error, loading }: { insight: string | null; error?: string | null; loading: boolean }) {
  return (
    <div className="card p-4" style={{ background: 'linear-gradient(160deg, var(--color-ocean-950), var(--color-ocean-800))' }}>
      <div className="flex items-center gap-1.5 mb-2.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-sky-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-ocean-300)' }}>Insight AI</p>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2"><Skeleton height={12} /><Skeleton height={12} width="80%" /></div>
      ) : error ? (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-risk-worst)' }}>
          Insight AI sedang tidak tersedia ({error}). Data chart di atas tetap akurat, hanya ringkasan naratifnya yang gagal dimuat.
        </p>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>
          {insight ?? 'Belum cukup data untuk menghasilkan insight.'}
        </p>
      )}
    </div>
  )
}

// ── Risk Health card (donut + ROI per kategori) ───────────────
function RiskHealthCard({ risikoBreakdown, roiPerKategori, loading }: {
  risikoBreakdown: DashboardData['risikoBreakdown']
  roiPerKategori: { kategori: string; roiRata: number; jumlahSiklus: number }[]
  loading: boolean
}) {
  const total = risikoBreakdown.reduce((s, r) => s + r.jumlah, 0)
  const RISK_LABEL: Record<string, string> = { best: 'Best Case', middle: 'Middle Case', worst: 'Worst Case' }
  const RISK_COLOR: Record<string, string> = { best: 'var(--color-risk-best)', middle: 'var(--color-risk-middle)', worst: 'var(--color-risk-worst)' }

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Kesehatan Portofolio Risiko</p>
      {loading ? (
        <Skeleton height={100} />
      ) : total === 0 ? (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum ada rencana yang dinilai.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <RiskDonut data={risikoBreakdown} size={64} />
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Distribusi <b style={{ color: 'var(--color-text-primary)' }}>{total}</b> rencana yang pernah dinilai.
            </div>
          </div>
          {roiPerKategori.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum cukup siklus selesai untuk hitung ROI per kategori.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Rata-rata ROI per Kategori</p>
              {roiPerKategori.map(r => (
                <div key={r.kategori} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: RISK_COLOR[r.kategori], display: 'inline-block' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{RISK_LABEL[r.kategori]}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>({r.jumlahSiklus}x)</span>
                  </span>
                  <span className="font-bold" style={{ color: r.roiRata >= 0 ? 'var(--color-risk-best)' : 'var(--color-risk-worst)' }}>
                    {r.roiRata >= 0 ? '+' : ''}{r.roiRata.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}


// ── Recent Activity (Admin) ────────────────────────────────────
// Bukan raw event stream — agregasi created_at dari beberapa tabel
// (pengguna, kolam, skoring, biaya, persiapan) diurutkan waktu.
// Cocok buat Admin (audit trail teknis), bukan Owner (butuh insight
// yang sudah diolah, bukan log mentah).
function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'Baru saja'
  if (min < 60) return `${min} menit lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const ACTIVITY_ICON: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  user:      { icon: <IconUsers size={14} />,    color: '#7c3aed', bg: '#ede9fe' },
  kolam:     { icon: <IconPond size={14} />,     color: '#0284c7', bg: '#e0f2fe' },
  skoring:   { icon: <IconScale size={14} />,    color: '#b45309', bg: '#fef3c7' },
  biaya:     { icon: <IconReport size={14} />,   color: '#15803d', bg: '#dcfce7' },
  persiapan: { icon: <IconApproval size={14} />, color: '#0f766e', bg: '#ccfbf1' },
}

function RecentActivity() {
  const { activities, loading } = useRecentActivity(8)
  const listRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (loading) return
    gsap.from('.activity-item', { x: -10, opacity: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out', clearProps: 'opacity,transform' })
  }, { scope: listRef, dependencies: [loading, activities.length] })

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Recent Activity</p>
      <div ref={listRef} className="flex flex-col gap-1">
        {loading ? (
          <div className="flex flex-col gap-2">{[1, 2, 3].map(i => <Skeleton key={i} height={40} rounded="rounded-lg" />)}</div>
        ) : activities.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>Belum ada aktivitas tercatat.</p>
        ) : (
          activities.map(a => {
            const meta = ACTIVITY_ICON[a.type]
            return (
              <div key={a.id} className="activity-item flex items-start gap-2.5 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: meta.bg, color: meta.color }}>
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs leading-snug" style={{ color: 'var(--color-text-primary)' }}>{a.message}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{relativeTime(a.timestamp)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Shared: komoditas breakdown + risk legend ─────────────────
function SystemSummary({ data, loading }: { data: DashboardData; loading: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Komoditas Aktif</p>
      {loading ? (
        <Skeleton height={60} />
      ) : data.komoditasBreakdown.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum ada siklus aktif.</p>
      ) : (
        // Bar chart, bukan list teks — perbandingan antar kategori diskrit
        // (jumlah siklus per komoditas) sesuai kaidah pemilihan chart MIS.
        <BarChart
          data={data.komoditasBreakdown.map(k => ({ label: KOMODITAS_LABEL[k.komoditas], value: k.jumlah }))}
          unit=" siklus"
        />
      )}
    </div>
  )
}

function RiskSidebar({ risikoBreakdown }: { risikoBreakdown: DashboardData['risikoBreakdown'] }) {
  const total = risikoBreakdown.reduce((s, r) => s + r.jumlah, 0)
  const LEGEND: Record<string, { label: string; range: string }> = {
    best:   { label: 'Best Case',   range: '≤ 10' },
    middle: { label: 'Middle Case', range: '11–20' },
    worst:  { label: 'Worst Case',  range: '> 20' },
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Kategori Risiko</p>

        {total > 0 && (
          <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <RiskDonut data={risikoBreakdown} size={72} />
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Distribusi skor risiko dari <b style={{ color: 'var(--color-text-primary)' }}>{total}</b> rencana yang pernah dinilai.
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {risikoBreakdown.map(r => (
            <div key={r.kategori} className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `var(--color-risk-${r.kategori}-bg)`, color: `var(--color-risk-${r.kategori})` }}
              >
                {LEGEND[r.kategori].label}
              </span>
              <span className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {total > 0 ? `${r.jumlah} rencana` : LEGEND[r.kategori].range}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 text-xs leading-relaxed" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          Skor = Σ (Potensi × Dampak) dari 4 faktor risiko.
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  PAGE — pilih view berdasarkan role
// ════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { role, nama, loading: authLoading } = useAuth()
  const { data, loading } = useDashboard()
  const pageRef = useRef<HTMLDivElement>(null)
  const displayName = nama ?? 'Pengguna'

  useGSAP(() => {
    if (authLoading || loading) return
    gsap.from('.dash-hero', { y: -12, opacity: 0, duration: 0.5, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.stat-card', { y: 16, opacity: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out', delay: 0.12, clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [role, loading, authLoading] })

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
      {authLoading ? (
        <Skeleton height={140} rounded="rounded-2xl" />
      ) : role === 'admin' ? (
        <AdminDashboard nama={displayName} data={data} loading={loading} />
      ) : role === 'owner' ? (
        <OwnerDashboard nama={displayName} data={data} loading={loading} />
      ) : (
        <PetambakDashboard nama={displayName} data={data} loading={loading} />
      )}
    </div>
  )
}
