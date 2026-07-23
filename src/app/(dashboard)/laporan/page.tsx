'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencana } from '@/hooks/useRencana'
import { useKolamPerformance, useAnalitikProduksi } from '@/hooks/useLaporan'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { PerbandinganBarChart, KomposisiDonut, TrenLineChart } from '@/components/charts/RechartsKit'
import { EmptyState } from '@/components/ui/EmptyState'
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

// ── Selector performa per kolam (Owner/Admin) ──────────────────
// Deret chip nama kolam; pilih satu, panel di bawah menampilkan
// performa kolam itu. Eksploratif satu per satu, bukan semua kolam
// ditumpuk sekaligus.
function KpiMini({ label, value, accent }: { label: string; value: string; accent?: 'good' | 'bad' }) {
  const color = accent === 'good' ? 'var(--color-risk-best)' : accent === 'bad' ? 'var(--color-risk-worst)' : 'var(--color-ocean-800)'
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--color-surface-muted)' }}>
      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div className="text-base font-bold mt-0.5 truncate" style={{ color }}>{value}</div>
    </div>
  )
}

function KolamSelector() {
  const { data, loading } = useKolamPerformance()
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!selected && data.length > 0) setSelected(data[0].id_kolam)
  }, [data, selected])

  if (loading) return <div className="mb-6"><Skeleton height={200} rounded="rounded-2xl" /></div>
  if (data.length === 0) return null

  const aktifKolam = data.find(k => k.id_kolam === selected) ?? data[0]

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Performa per Kolam
      </h2>

      {/* Chips kolam */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {data.map(k => {
          const on = k.id_kolam === aktifKolam.id_kolam
          return (
            <button
              key={k.id_kolam}
              onClick={() => setSelected(k.id_kolam)}
              className="shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: on ? 'var(--color-notion-500)' : 'var(--color-surface-card)',
                color: on ? '#fff' : 'var(--color-text-secondary)',
                border: `1px solid ${on ? 'var(--color-notion-500)' : 'var(--color-border)'}`,
                boxShadow: on ? '0 1px 2px rgba(16,24,40,0.08)' : 'none',
              }}
            >
              {k.nama_kolam}
              <span className="ml-1.5 text-xs" style={{ opacity: 0.75 }}>{k.jumlahSiklus} siklus</span>
            </button>
          )
        })}
      </div>

      {/* Panel performa kolam terpilih */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{aktifKolam.nama_kolam}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {aktifKolam.komoditasTerakhir ? KOMODITAS_LABEL[aktifKolam.komoditasTerakhir as NamaKomoditas] : '—'}
              {aktifKolam.siklusTerakhirTanggal ? ` · siklus terakhir ${formatTanggal(aktifKolam.siklusTerakhirTanggal)}` : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <KpiMini label="Total Produksi" value={`${aktifKolam.totalProduksi.toFixed(0)} kg`} />
          <KpiMini label="Total Pendapatan" value={rupiahCompact(aktifKolam.totalPendapatan)} />
          <KpiMini label="Profit" value={rupiahCompact(aktifKolam.profit)} accent={aktifKolam.profit >= 0 ? 'good' : 'bad'} />
          <KpiMini label="ROI" value={`${aktifKolam.roi.toFixed(0)}%`} accent={aktifKolam.roi >= 0 ? 'good' : 'bad'} />
        </div>

        {aktifKolam.perSiklus.length >= 2 ? (
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Profit per Siklus di Kolam Ini</div>
            <PerbandinganBarChart
              data={aktifKolam.perSiklus.map(s => ({ label: s.label, value: s.profit, fill: s.profit >= 0 ? '#16a34a' : '#dc2626' }))}
              formatValue={rupiahCompact}
              height={180}
            />
          </div>
        ) : (
          <div className="text-xs rounded-xl p-3" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
            Baru {aktifKolam.jumlahSiklus} siklus selesai. Tren antar siklus muncul setelah minimal 2 siklus.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Analitik produksi lintas siklus (Owner/Admin) ──────────────
function AnalitikSection() {
  const { data, loading } = useAnalitikProduksi()
  if (loading) return <div className="mb-6"><Skeleton height={220} rounded="rounded-2xl" /></div>
  if (data.komposisiKomoditas.length === 0) return null

  const komposisi = data.komposisiKomoditas.map(k => ({
    label: KOMODITAS_LABEL[k.komoditas as NamaKomoditas] ?? k.komoditas,
    value: Number(k.totalKg.toFixed(0)),
  }))
  const punyaTren = data.trenSiklus.length >= 2

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Analitik Produksi
      </h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Komposisi Produksi per Komoditas</div>
          <KomposisiDonut data={komposisi} formatValue={v => `${v.toLocaleString('id-ID')} kg`} />
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Tren Survival Rate per Siklus</div>
          {punyaTren ? (
            <TrenLineChart
              data={data.trenSiklus.map(s => ({ label: s.label, value: Number(s.survivalRate.toFixed(1)) }))}
              color="#0f766e" unit="%"
              formatValue={v => `${v}%`}
            />
          ) : (
            <div className="text-xs rounded-xl p-3" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
              Tren muncul setelah minimal 2 siklus selesai.
            </div>
          )}
        </div>
        {punyaTren && (
          <div className="card p-4 lg:col-span-2">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Tren FCR per Siklus (makin rendah makin efisien)</div>
            <TrenLineChart
              data={data.trenSiklus.map(s => ({ label: s.label, value: Number(s.fcrRata.toFixed(2)) }))}
              color="#d97706"
              formatValue={v => v.toFixed(2)}
            />
          </div>
        )}
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

      {(role === 'admin' || role === 'owner') && <KolamSelector />}
      {(role === 'admin' || role === 'owner') && <AnalitikSection />}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} height={130} rounded="rounded-2xl" />)}
        </div>
      ) : rencana.length === 0 ? (
        <EmptyState
          judul="Belum ada data siklus"
          deskripsi="Laporan terbentuk otomatis dari siklus budidaya yang berjalan. Mulai dengan membuat rencana tebar, lalu catat operasional sampai panen."
          aksi={{ href: '/perencanaan', label: 'Buka Perencanaan' }}
        />
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
