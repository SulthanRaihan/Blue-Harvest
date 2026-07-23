'use client'

import { Document, Page, Text, View, Image, StyleSheet, Svg, Path, Circle, Font } from '@react-pdf/renderer'
import type { LaporanData } from '@/lib/repositories/laporan.repository'
import type { KategoriBiaya, NamaKomoditas, GradePanen } from '@/types/database'
import { KATEGORI_BIAYA_LABEL } from '@/hooks/useBiaya'

const PALETTE = ['#0284c7', '#7c3aed', '#0f766e', '#d97706', '#3d8fd1', '#dc2626']
const INK = '#0f172a'
const MUTED = '#64748b'
const BORDER = '#e2e8f0'

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng: 'Ikan Bandeng', nila: 'Ikan Nila', udang_vaname: 'Udang Vaname',
}

const GRADE_COLOR: Record<GradePanen, string> = { A: '#166534', B: '#92400e', C: '#991b1b' }

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: INK },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: `1pt solid ${BORDER}` },
  logo: { width: 110, height: 26 },
  headerRight: { alignItems: 'flex-end' },
  titleBlock: { marginBottom: 14 },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 9, color: MUTED },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 6, marginTop: 14 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  kpiCard: { flex: 1, borderRadius: 6, border: `1pt solid ${BORDER}`, padding: 8, alignItems: 'center' },
  kpiLabel: { fontSize: 7.5, color: MUTED, marginBottom: 3, textAlign: 'center' },
  kpiValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  kpiSub: { fontSize: 7, color: MUTED, marginTop: 2 },
  box: { borderRadius: 6, border: `1pt solid ${BORDER}`, padding: 10, marginBottom: 4 },
  boxTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  boxText: { fontSize: 8.5, lineHeight: 1.4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 4 },
  tableHeaderCell: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MUTED, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottom: `0.5pt solid ${BORDER}` },
  tableCell: { fontSize: 8.5 },
  biayaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
  biayaLabel: { width: 110, fontSize: 8 },
  biayaBarBg: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4 },
  biayaBarFill: { height: 8, borderRadius: 4 },
  biayaValue: { width: 80, fontSize: 8, textAlign: 'right' },
  summaryBox: { backgroundColor: '#0b2d4e', borderRadius: 8, padding: 14, marginTop: 14 },
  summaryTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#7dd3fc', marginBottom: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryItem: { width: '50%', marginBottom: 8 },
  summaryLabel: { fontSize: 7.5, color: '#93c5fd' },
  summaryValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 1 },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: MUTED, paddingTop: 6, borderTop: `0.5pt solid ${BORDER}` },
})

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  )
}

function GrowthTrendSvg({ sampling }: { sampling: LaporanData['sampling'] }) {
  const sorted = [...sampling].sort((a, b) => a.minggu_ke - b.minggu_ke)
  const w = 500, h = 90, padX = 20, padY = 14
  const values = sorted.map(s => s.rata_berat_gram)
  const max = Math.max(...values, 0.001)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const stepX = (w - padX * 2) / Math.max(sorted.length - 1, 1)

  const points = sorted.map((s, i) => ({
    x: padX + i * stepX,
    y: h - padY - ((s.rata_berat_gram - min) / range) * (h - padY * 2),
  }))
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <View>
      <Svg width="100%" height={100} viewBox={`0 0 ${w} ${h}`}>
        <Path d={d} stroke="#0284c7" strokeWidth={2} fill="none" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#0284c7" />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        {sorted.map(s => (
          <Text key={s.id_sampling} style={{ fontSize: 7, color: MUTED }}>M{s.minggu_ke}</Text>
        ))}
      </View>
    </View>
  )
}

export interface LaporanPdfProps {
  data: LaporanData
  biayaBreakdown: { kategori: KategoriBiaya; jumlah: number }[]
  biayaTotal: number
  insightPerbandingan: string | null
}

export function LaporanPdfDocument({ data, biayaBreakdown, biayaTotal, insightPerbandingan }: LaporanPdfProps) {
  const { rencana, panen, sampling, totalProduksi, totalPendapatan, totalPakan, fcrRata } = data
  const fcrStandar = rencana.komoditas?.fcr_standar ?? null
  const fcrOk = fcrStandar ? fcrRata <= fcrStandar : true
  const modal = rencana.modal_rp ?? 0
  const profit = totalPendapatan - modal
  const roi = modal > 0 ? ((profit / modal) * 100).toFixed(1) : '—'
  const komoditas = rencana.komoditas?.nama ? KOMODITAS_LABEL[rencana.komoditas.nama as NamaKomoditas] : '—'
  const hamaEntries = data.operasional.filter(o => o.catatan_hama_penyakit)
  const maxBiaya = Math.max(...biayaBreakdown.map(b => b.jumlah), 1)

  return (
    <Document title={`Laporan - ${rencana.kolam?.nama_kolam ?? 'Siklus'}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 7.5, color: MUTED }}>Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Laporan Siklus Budidaya — {rencana.kolam?.nama_kolam ?? '—'}</Text>
          <Text style={styles.subtitle}>{komoditas} · Siklus mulai {formatTanggal(rencana.tanggal_rencana)}</Text>
        </View>

        {/* KPI */}
        <View style={styles.kpiRow}>
          <KpiCard label="TOTAL PRODUKSI" value={`${totalProduksi.toFixed(1)} kg`} sub={`${panen.length} kali panen`} />
          <KpiCard label="TOTAL PENDAPATAN" value={formatRupiah(totalPendapatan)} />
          <KpiCard label="PROFIT / RUGI" value={formatRupiah(profit)} sub={`ROI ${roi}%`} />
          <KpiCard label="FCR RATA-RATA" value={fcrRata.toFixed(2)} sub={fcrStandar ? `Standar: ${fcrStandar}` : 'Aktual'} />
        </View>

        {/* FCR assessment */}
        {fcrStandar && (
          <View style={[styles.box, { marginTop: 8 }]}>
            <Text style={[styles.boxTitle, { color: fcrOk ? '#166534' : '#991b1b' }]}>
              {fcrOk ? 'Efisiensi Pakan Baik' : 'Efisiensi Pakan Perlu Ditingkatkan'}
            </Text>
            <Text style={styles.boxText}>
              FCR aktual {fcrRata.toFixed(2)} vs standar {fcrStandar} —{' '}
              {fcrOk
                ? `lebih efisien ${((fcrStandar - fcrRata) * 100 / fcrStandar).toFixed(0)}% dari standar.`
                : 'perlu reduksi pakan atau evaluasi jenis pakan.'}
            </Text>
          </View>
        )}

        {/* Insight perbandingan siklus */}
        {insightPerbandingan && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Dibanding Siklus Sebelumnya</Text>
            <Text style={styles.boxText}>{insightPerbandingan}</Text>
          </View>
        )}

        {/* Biaya operasional */}
        {biayaBreakdown.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Rincian Biaya Operasional</Text>
            {biayaBreakdown.map((b, i) => (
              <View key={b.kategori} style={styles.biayaRow}>
                <Text style={styles.biayaLabel}>{KATEGORI_BIAYA_LABEL[b.kategori]}</Text>
                <View style={styles.biayaBarBg}>
                  <View style={[styles.biayaBarFill, { width: `${(b.jumlah / maxBiaya) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length] }]} />
                </View>
                <Text style={styles.biayaValue}>{formatRupiah(b.jumlah)}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>
              Total biaya tercatat: {formatRupiah(biayaTotal)} — di luar modal awal ({formatRupiah(modal)})
            </Text>
          </View>
        )}

        {/* Rincian panen */}
        {panen.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Rincian Panen</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Tanggal</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Grade</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Bobot</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Harga/kg</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Pendapatan</Text>
            </View>
            {panen.map(p => (
              <View key={p.id_panen} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{formatTanggal(p.tanggal_panen)}</Text>
                <Text style={[styles.tableCell, { flex: 1, color: GRADE_COLOR[p.grade], fontFamily: 'Helvetica-Bold' }]}>Grade {p.grade}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{p.total_bobot_kg} kg</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatRupiah(p.harga_per_kg)}</Text>
                <Text style={[styles.tableCell, { flex: 1.4, fontFamily: 'Helvetica-Bold' }]}>{formatRupiah(p.total_pendapatan)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Dokumentasi foto panen */}
        {panen.some(p => p.foto_url) && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Dokumentasi Panen</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {panen.filter(p => p.foto_url).map(p => (
                <Image key={p.id_panen} src={p.foto_url as string} style={{ width: 120, height: 90, borderRadius: 4, objectFit: 'cover', border: `0.5pt solid ${BORDER}` }} />
              ))}
            </View>
          </View>
        )}

        {/* Pertumbuhan */}
        {sampling.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Tren Pertumbuhan (bobot rata-rata per minggu, gram)</Text>
            <View style={[styles.box, { paddingTop: 12 }]}>
              <GrowthTrendSvg sampling={sampling} />
            </View>
          </View>
        )}

        {/* Catatan hama */}
        {hamaEntries.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Catatan Hama & Penyakit ({hamaEntries.length} kejadian)</Text>
            {hamaEntries.map(o => (
              <View key={o.id_operasional} style={[styles.tableRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Text style={{ fontSize: 7.5, color: MUTED, marginBottom: 2 }}>{formatTanggal(o.tanggal)}</Text>
                <Text style={{ fontSize: 8.5, color: '#991b1b' }}>{o.catatan_hama_penyakit}</Text>
                {o.tindakan && <Text style={{ fontSize: 8, color: MUTED, marginTop: 1 }}>Tindakan: {o.tindakan}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Ringkasan siklus */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>RINGKASAN SIKLUS</Text>
          <View style={styles.summaryGrid}>
            {[
              { label: 'Modal Awal', val: formatRupiah(modal) },
              { label: 'Total Pakan', val: `${totalPakan.toFixed(1)} kg` },
              { label: 'Total Produksi', val: `${totalProduksi.toFixed(1)} kg` },
              { label: 'Harga Rata-rata', val: panen.length > 0 ? `${formatRupiah(totalPendapatan / totalProduksi)}/kg` : '—' },
              { label: 'Total Pendapatan', val: formatRupiah(totalPendapatan) },
              { label: 'Profit / Rugi', val: `${formatRupiah(profit)} (ROI ${roi}%)` },
            ].map(item => (
              <View key={item.label} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Blue Harvest — Data operasional diinput manual oleh petambak</Text>
          <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
