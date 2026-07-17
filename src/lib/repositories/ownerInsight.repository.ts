import { supabase } from '@/lib/supabase'
import type { KategoriRisiko } from '@/types/database'

export interface TrenBulanan {
  bulan: string       // label tampil, mis. "Mei 26"
  key: string         // "2026-05" buat sorting
  pendapatan: number
  biaya: number
}

export interface RoiPerKategori {
  kategori: KategoriRisiko
  roiRata: number
  jumlahSiklus: number
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

export const ownerInsightRepository = {
  // Tren pendapatan (dari panen) vs biaya (dari biaya_operasional) per
  // bulan kalender, 6 bulan terakhir — dasar untuk chart tren & delta
  // month-over-month di dashboard Owner.
  async getTrenBulanan(months = 6): Promise<TrenBulanan[]> {
    const since = new Date()
    since.setMonth(since.getMonth() - (months - 1))
    since.setDate(1)
    const sinceStr = since.toISOString().split('T')[0]

    const [panenRes, biayaRes] = await Promise.all([
      supabase.from('panen').select('tanggal_panen, total_pendapatan').gte('tanggal_panen', sinceStr),
      supabase.from('biaya_operasional').select('tanggal, jumlah_rp').gte('tanggal', sinceStr),
    ])

    const map = new Map<string, { pendapatan: number; biaya: number }>()
    // pre-fill supaya bulan tanpa data tetap muncul di chart (bukan bolong)
    for (let i = 0; i < months; i++) {
      const d = new Date(since)
      d.setMonth(d.getMonth() + i)
      map.set(monthKey(d.toISOString()), { pendapatan: 0, biaya: 0 })
    }

    for (const p of (panenRes.data ?? []) as { tanggal_panen: string; total_pendapatan: number }[]) {
      const k = monthKey(p.tanggal_panen)
      if (map.has(k)) map.get(k)!.pendapatan += Number(p.total_pendapatan ?? 0)
    }
    for (const b of (biayaRes.data ?? []) as { tanggal: string; jumlah_rp: number }[]) {
      const k = monthKey(b.tanggal)
      if (map.has(k)) map.get(k)!.biaya += Number(b.jumlah_rp ?? 0)
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ key, bulan: monthLabel(key), ...v }))
  },

  // Rata-rata ROI per kategori risiko dari siklus yang SUDAH SELESAI —
  // validasi ringan: apakah kategori risiko yang lebih tinggi memang
  // berkorelasi dengan hasil lebih buruk (atau belum, kalau data historis
  // masih sedikit).
  async getRoiPerKategori(): Promise<RoiPerKategori[]> {
    const { data: rencanaRows } = await supabase
      .from('rencana_tebar')
      .select('id_rencana, modal_rp, skoring_risiko(kategori)')
      .eq('status', 'selesai')

    const rows = (rencanaRows ?? []) as { id_rencana: string; modal_rp: number; skoring_risiko: { kategori: KategoriRisiko }[] | { kategori: KategoriRisiko } | null }[]
    if (rows.length === 0) return []

    const ids = rows.map(r => r.id_rencana)
    const { data: panenRows } = await supabase
      .from('panen')
      .select('id_rencana, total_pendapatan')
      .in('id_rencana', ids)

    const pendapatanMap = new Map<string, number>()
    for (const p of (panenRows ?? []) as { id_rencana: string; total_pendapatan: number }[]) {
      pendapatanMap.set(p.id_rencana, (pendapatanMap.get(p.id_rencana) ?? 0) + Number(p.total_pendapatan ?? 0))
    }

    const byKategori = new Map<KategoriRisiko, { roiSum: number; count: number }>()
    for (const r of rows) {
      const skoring = Array.isArray(r.skoring_risiko) ? r.skoring_risiko[0] : r.skoring_risiko
      if (!skoring) continue
      const modal = Number(r.modal_rp ?? 0)
      if (modal <= 0) continue
      const pendapatan = pendapatanMap.get(r.id_rencana) ?? 0
      const roi = ((pendapatan - modal) / modal) * 100
      const entry = byKategori.get(skoring.kategori) ?? { roiSum: 0, count: 0 }
      entry.roiSum += roi
      entry.count += 1
      byKategori.set(skoring.kategori, entry)
    }

    return (['best', 'middle', 'worst'] as KategoriRisiko[])
      .map(kategori => {
        const e = byKategori.get(kategori)
        return { kategori, roiRata: e ? e.roiSum / e.count : 0, jumlahSiklus: e?.count ?? 0 }
      })
      .filter(r => r.jumlahSiklus > 0)
  },
}
