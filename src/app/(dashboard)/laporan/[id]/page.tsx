'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLaporanDetail } from '@/hooks/useLaporan'
import { useBiaya, KATEGORI_BIAYA_LABEL } from '@/hooks/useBiaya'
import { Skeleton } from '@/components/ui/Skeleton'
import { GrowthChart, PondGauge, CategoryDonut, CATEGORY_DONUT_COLORS } from '@/components/ui/Charts'
import { InfoHint } from '@/components/ui/InfoHint'
import type { NamaKomoditas, GradePanen } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng: 'Ikan Bandeng', nila: 'Ikan Nila', udang_vaname: 'Udang Vaname',
}

const GRADE_COLOR: Record<GradePanen, { bg: string; color: string }> = {
  A: { bg: '#dcfce7', color: '#166534' },
  B: { bg: '#fef3c7', color: '#92400e' },
  C: { bg: '#fee2e2', color: '#991b1b' },
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Insight perbandingan siklus (rule-based, bukan panggilan AI) ──
// Bandingkan performa siklus ini dengan siklus selesai sebelumnya di
// kolam yang sama — bagian dari lapisan MIS/DSS evaluasi antar siklus.
function buatInsightPerbandingan(
  fcrSekarang: number, profitSekarang: number,
  prev: { fcrRata: number; profit: number } | null
): string | null {
  if (!prev) return null

  const parts: string[] = []
  const deltaFcr = fcrSekarang - prev.fcrRata
  if (Math.abs(deltaFcr) >= 0.05) {
    parts.push(deltaFcr < 0
      ? `FCR membaik ${Math.abs(deltaFcr).toFixed(2)} poin dibanding siklus sebelumnya (efisiensi pakan naik)`
      : `FCR memburuk ${deltaFcr.toFixed(2)} poin dibanding siklus sebelumnya (efisiensi pakan turun)`)
  }

  const deltaProfit = profitSekarang - prev.profit
  if (Math.abs(deltaProfit) >= 1) {
    const jt = (n: number) => `Rp ${(Math.abs(n) / 1_000_000).toFixed(1)} jt`
    parts.push(deltaProfit >= 0
      ? `profit naik ${jt(deltaProfit)} dibanding siklus sebelumnya`
      : `profit turun ${jt(deltaProfit)} dibanding siklus sebelumnya`)
  }

  if (parts.length === 0) return 'Kinerja siklus ini setara dengan siklus sebelumnya di kolam yang sama.'
  return parts.join(', ') + '.'
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: React.ReactNode; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="card p-5 text-center min-w-0">
      <div className="text-xs mb-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div
        className="font-black leading-tight break-words"
        style={{
          color: accent ? 'var(--color-teal-600)' : 'var(--color-ocean-800)',
          fontSize: value.length > 10 ? '1.125rem' : '1.5rem',
        }}
      >
        {value}
      </div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </h2>
  )
}

export default function LaporanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error } = useLaporanDetail(id)
  const { breakdown: biayaBreakdown, total: biayaTotal } = useBiaya(id)
  const pageRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const handleExportPdf = async () => {
    if (!data) return
    setExporting(true)
    try {
      const [{ pdf }, { LaporanPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf/LaporanPdf'),
      ])
      const insight = buatInsightPerbandingan(data.fcrRata, data.totalPendapatan - (data.rencana.modal_rp ?? 0), data.siklusSebelumnya)
      const blob = await pdf(
        <LaporanPdfDocument data={data} biayaBreakdown={biayaBreakdown} biayaTotal={biayaTotal} insightPerbandingan={insight} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan-${(data.rencana.kolam?.nama_kolam ?? 'siklus').replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  useGSAP(() => {
    if (loading) return
    gsap.from('.report-section', {
      y: 14, opacity: 0, stagger: 0.1, duration: 0.45,
      ease: 'power2.out', clearProps: 'opacity,transform',
    })
  }, { scope: pageRef, dependencies: [loading] })

  if (loading) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-3xl mx-auto flex flex-col gap-5">
        <Skeleton height={28} width={220} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={90} rounded="rounded-2xl" />)}
        </div>
        <Skeleton height={200} rounded="rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-5 py-6 max-w-3xl mx-auto">
        <div className="card p-5 text-sm" style={{ color: 'var(--color-risk-worst)' }}>
          {error ?? 'Laporan tidak ditemukan.'}
        </div>
      </div>
    )
  }

  const { rencana, panen, sampling, operasional, totalProduksi, totalPendapatan, totalPakan, fcrRata, siklusSebelumnya } = data
  const fcrStandar = rencana.komoditas?.fcr_standar ?? null
  const fcrOk      = fcrStandar ? fcrRata <= fcrStandar : true
  const modal      = rencana.modal_rp ?? 0
  const profit     = totalPendapatan - modal
  const roi        = modal > 0 ? ((profit / modal) * 100).toFixed(1) : '—'
  const komoditas  = rencana.komoditas?.nama ? KOMODITAS_LABEL[rencana.komoditas.nama as NamaKomoditas] : '—'

  const hamaEntries = operasional.filter(o => o.catatan_hama_penyakit)
  const insightPerbandingan = buatInsightPerbandingan(fcrRata, profit, siklusSebelumnya)

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 max-w-3xl mx-auto">
      {/* Back + title */}
      <div className="report-section mb-6">
        <Link href="/laporan"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ocean-700)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali ke Laporan
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {rencana.kolam?.nama_kolam ?? 'Laporan'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {komoditas} · Siklus mulai {formatTanggal(rencana.tanggal_rencana)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: '#dcfce7', color: '#166534' }}>
              Selesai
            </span>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--color-ocean-900)', color: '#fff' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? 'Membuat PDF...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="report-section grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Produksi" value={`${totalProduksi.toFixed(1)} kg`} sub={`${panen.length} panen`} />
        <StatCard label="Total Pendapatan" value={formatRupiah(totalPendapatan)} />
        <StatCard label={<>Profit / Rugi<InfoHint istilah="roi" /></>} value={formatRupiah(profit)}
          sub={`ROI ${roi}%`} accent={profit >= 0} />
        <StatCard label={<>FCR Rata-rata<InfoHint istilah="fcr" /></>} value={fcrRata.toFixed(2)}
          sub={fcrStandar ? `Standar: ${fcrStandar}` : 'Aktual'} accent={fcrOk} />
      </div>

      {/* FCR assessment */}
      {fcrStandar && (
        <div className="report-section mb-5">
          <div className="rounded-2xl p-4" style={{
            background: fcrOk ? 'var(--color-risk-best-bg)' : 'var(--color-risk-worst-bg)',
            border: `1px solid ${fcrOk ? '#bbf7d0' : '#fca5a5'}`,
          }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{fcrOk ? '✓' : '!'}</span>
              <div>
                <div className="text-sm font-bold" style={{ color: fcrOk ? 'var(--color-risk-best)' : 'var(--color-risk-worst)' }}>
                  {fcrOk ? 'Efisiensi Pakan Baik' : 'Efisiensi Pakan Perlu Ditingkatkan'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: fcrOk ? '#166534' : '#991b1b' }}>
                  FCR aktual {fcrRata.toFixed(2)} vs standar {fcrStandar} —{' '}
                  {fcrOk
                    ? `lebih efisien ${((fcrStandar - fcrRata) * 100 / fcrStandar).toFixed(0)}% dari standar`
                    : `perlu reduksi pakan atau evaluasi jenis pakan`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insight perbandingan siklus — rule-based, dari data siklus sebelumnya */}
      {insightPerbandingan && (
        <div className="report-section mb-5">
          <div className="rounded-2xl p-4" style={{ background: 'var(--color-ocean-50)', border: '1px solid var(--color-ocean-100)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M7 16l4-5 4 3 4-6" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-ocean-700)' }}>
                Dibanding Siklus Sebelumnya
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{insightPerbandingan}</p>
          </div>
        </div>
      )}

      {/* Breakdown biaya operasional */}
      {biayaBreakdown.length > 0 && (
        <div className="report-section mb-5">
          <SectionTitle>Rincian Biaya Operasional</SectionTitle>
          <div className="card p-4">
            <div className="flex items-center gap-4 mb-3">
              <CategoryDonut data={biayaBreakdown.map(b => ({ label: b.kategori, jumlah: b.jumlah }))} size={72} />
              <div className="flex flex-col gap-1.5 text-xs">
                {biayaBreakdown.map((b, i) => (
                  <div key={b.kategori} className="flex items-center gap-1.5">
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: CATEGORY_DONUT_COLORS[i % CATEGORY_DONUT_COLORS.length], display: 'inline-block' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{KATEGORI_BIAYA_LABEL[b.kategori]}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>· {formatRupiah(b.jumlah)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 text-xs" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              Total biaya tercatat: <b style={{ color: 'var(--color-text-primary)' }}>{formatRupiah(biayaTotal)}</b> — di luar modal awal ({formatRupiah(modal)})
            </div>
          </div>
        </div>
      )}

      {/* Rincian panen */}
      {panen.length > 0 && (
        <div className="report-section mb-5">
          <SectionTitle>Rincian Panen</SectionTitle>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide grid grid-cols-4 gap-2"
              style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <span>Tanggal</span><span>Bobot</span><span>Harga/kg</span><span>Pendapatan</span>
            </div>
            {panen.map(p => {
              const g = GRADE_COLOR[p.grade]
              return (
                <div key={p.id_panen} className="grid grid-cols-4 gap-2 px-5 py-3.5 text-sm items-center divide-y-0"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ color: 'var(--color-text-primary)' }}>{formatTanggal(p.tanggal_panen)}</div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold mt-0.5 inline-block"
                      style={{ background: g.bg, color: g.color }}>Grade {p.grade}</span>
                  </div>
                  <span style={{ color: 'var(--color-text-primary)' }}>{p.total_bobot_kg} kg</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{formatRupiah(p.harga_per_kg)}</span>
                  <span className="font-semibold" style={{ color: 'var(--color-ocean-800)' }}>
                    {formatRupiah(p.total_pendapatan)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sampling summary */}
      {sampling.length > 0 && (
        <div className="report-section mb-5">
          <SectionTitle>Ringkasan Pertumbuhan</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4 text-center">
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Bobot Awal</div>
              <div className="text-xl font-black" style={{ color: 'var(--color-ocean-800)' }}>
                {sampling[0].rata_berat_gram} g
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Minggu ke-{sampling[0].minggu_ke}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Bobot Akhir</div>
              <div className="text-xl font-black" style={{ color: 'var(--color-ocean-800)' }}>
                {sampling[sampling.length - 1].rata_berat_gram} g
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Minggu ke-{sampling[sampling.length - 1].minggu_ke}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Durasi Sampling</div>
              <div className="text-xl font-black" style={{ color: 'var(--color-ocean-800)' }}>
                {sampling.length} minggu
              </div>
            </div>
            {rencana.jumlah_benih > 0 && (
              <div className="card p-4 flex items-center justify-center">
                <PondGauge
                  percent={(sampling[sampling.length - 1].estimasi_populasi / rencana.jumlah_benih) * 100}
                  label="Kelangsungan Hidup"
                />
              </div>
            )}
          </div>

          {sampling.length >= 2 && (
            <div className="card p-4 mt-3">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Tren Bobot Rata-rata per Minggu (gram)
              </div>
              <GrowthChart data={sampling} />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {[...sampling].sort((a, b) => a.minggu_ke - b.minggu_ke).map(s => (
                  <span key={s.id_sampling}>M{s.minggu_ke}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insiden hama */}
      {hamaEntries.length > 0 && (
        <div className="report-section mb-5">
          <SectionTitle>Catatan Hama & Penyakit ({hamaEntries.length} kejadian)</SectionTitle>
          <div className="card overflow-hidden">
            {hamaEntries.map(o => (
              <div key={o.id_operasional} className="px-5 py-3.5 text-sm"
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatTanggal(o.tanggal)}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{o.catatan_hama_penyakit}</p>
                {o.tindakan && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Tindakan: {o.tindakan}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary box */}
      <div className="report-section">
        <div className="card p-5" style={{ background: 'var(--color-ocean-950)', borderColor: 'var(--color-ocean-800)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ocean-300)' }}>
            Ringkasan Siklus
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Modal Awal', val: formatRupiah(modal) },
              { label: 'Total Pakan', val: `${totalPakan.toFixed(1)} kg` },
              { label: 'Total Produksi', val: `${totalProduksi.toFixed(1)} kg` },
              { label: 'Harga Rata-rata', val: panen.length > 0 ? formatRupiah(totalPendapatan / totalProduksi) + '/kg' : '—' },
              { label: 'Total Pendapatan', val: formatRupiah(totalPendapatan) },
              { label: 'Profit / Rugi', val: `${formatRupiah(profit)} (ROI ${roi}%)` },
            ].map(item => (
              <div key={item.label}>
                <div className="text-xs" style={{ color: 'var(--color-ocean-400)' }}>{item.label}</div>
                <div className="font-semibold mt-0.5" style={{ color: '#fff' }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
