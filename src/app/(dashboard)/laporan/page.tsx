'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencana } from '@/hooks/useRencana'
import { usePerbandinganSiklus } from '@/hooks/useLaporan'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { BarChart } from '@/components/ui/Charts'
import type { NamaKomoditas } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng: 'Ikan Bandeng', nila: 'Ikan Nila', udang_vaname: 'Udang Vaname',
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function rupiahCompact(n: number) {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)} M`
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)} jt`
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`
  return `${sign}${formatRupiah(abs)}`
}

// ── Perbandingan antar siklus (Owner/Admin) ────────────────────
// Bar chart, bukan pie/line — soalnya ini perbandingan kategori
// diskrit (per siklus), sesuai kaidah pemilihan chart untuk MIS.
function PerbandinganSection() {
  const { data, loading } = usePerbandinganSiklus()
  if (loading) return <Skeleton height={180} rounded="rounded-2xl" />
  if (data.length < 2) return null // perbandingan butuh minimal 2 siklus

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Perbandingan Kinerja Antar Siklus
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Profit per Siklus</div>
          <BarChart
            data={data.map(d => ({
              label: d.label,
              value: d.profit,
              color: d.profit >= 0 ? 'var(--color-risk-best)' : 'var(--color-risk-worst)',
            }))}
            formatValue={rupiahCompact}
          />
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>FCR Rata-rata per Siklus</div>
          <BarChart
            data={data.map(d => ({ label: d.label, value: Number(d.fcrRata.toFixed(2)) }))}
            formatValue={v => v.toFixed(2)}
          />
        </div>
      </div>
    </div>
  )
}

export default function LaporanPage() {
  const { rencana, loading, updateStatus } = useRencana()
  const { role } = useAuth()
  const pageRef = useRef<HTMLDivElement>(null)

  // Laporan mencakup siklus aktif (bisa di-selesaikan) dan yang sudah selesai
  const aktif   = rencana.filter(r => r.status === 'aktif')
  const selesai = rencana.filter(r => r.status === 'selesai')

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.report-card', { y: 16, opacity: 0, stagger: 0.07, duration: 0.4, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [loading] })

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Laporan & Evaluasi
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Ringkasan kinerja siklus budidaya — produksi, pendapatan, dan FCR
        </p>
      </div>

      {(role === 'admin' || role === 'owner') && <PerbandinganSection />}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} height={130} rounded="rounded-2xl" />)}
        </div>
      ) : rencana.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Belum ada data siklus</p>
        </div>
      ) : (
        <>
          {/* Siklus aktif — bisa diselesaikan */}
          {aktif.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Siklus Aktif — Tandai Selesai untuk Buat Laporan
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {aktif.map(r => {
                  const kmd = r.komoditas?.nama ? KOMODITAS_LABEL[r.komoditas.nama] : '—'
                  return (
                    <div key={r.id_rencana} className="report-card card p-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {r.kolam?.nama_kolam ?? '—'}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {kmd} · mulai {formatTanggal(r.tanggal_rencana)}
                        </div>
                      </div>
                      {(role === 'admin' || role === 'owner') && (
                        <button
                          onClick={() => updateStatus(r.id_rencana, 'selesai')}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Siklus selesai */}
          {selesai.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Laporan Siklus Selesai
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {selesai.map(r => {
                  const kmd = r.komoditas?.nama ? KOMODITAS_LABEL[r.komoditas.nama] : '—'
                  return (
                    <Link key={r.id_rencana} href={`/laporan/${r.id_rencana}`}
                      className="report-card card card-hover block p-5" style={{ textDecoration: 'none' }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {r.kolam?.nama_kolam ?? '—'}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{kmd}</div>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: '#dcfce7', color: '#166534' }}>
                          Selesai
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {formatTanggal(r.tanggal_rencana)}
                      </div>
                      <div className="flex items-center justify-end mt-3 gap-1"
                        style={{ color: 'var(--color-ocean-600)' }}>
                        <span className="text-xs font-medium">Lihat Laporan</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {selesai.length === 0 && aktif.length > 0 && (
            <div className="card p-5 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
              Tandai siklus sebagai selesai untuk membuka laporan lengkap
            </div>
          )}
        </>
      )}
    </div>
  )
}
