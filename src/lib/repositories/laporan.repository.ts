import { supabase } from '@/lib/supabase'
import type { RencanaTebar, Panen, SamplingPertumbuhan, OperasionalHarian } from '@/types/database'

export interface SiklusSebelumnya {
  tanggal_rencana: string
  fcrRata: number
  profit: number
}

export interface LaporanData {
  rencana: RencanaTebar & { kolam?: any; komoditas?: any }
  panen: Panen[]
  sampling: SamplingPertumbuhan[]
  operasional: OperasionalHarian[]
  totalProduksi: number
  totalPendapatan: number
  totalPakan: number
  fcrRata: number
  siklusSebelumnya: SiklusSebelumnya | null
}

export interface PerbandinganSiklus {
  id_rencana: string
  label: string
  komoditas: string
  modal: number
  totalPendapatan: number
  profit: number
  roi: number
  fcrRata: number
}

export const laporanRepository = {
  async getSiklusSelesai() {
    const { data, error } = await supabase
      .from('rencana_tebar')
      .select('*, kolam(nama_kolam, luas_ha), komoditas(nama, fcr_standar)')
      .eq('status', 'selesai')
      .order('tanggal_rencana', { ascending: false })
    if (error) throw error
    return data
  },

  // Agregasi per siklus selesai — dipakai buat bar chart perbandingan
  // kinerja antar kolam/siklus (use case "Lihat Analisis dan Grafik" Owner).
  async getPerbandinganSiklus(): Promise<PerbandinganSiklus[]> {
    const { data: rencanaRows, error } = await supabase
      .from('rencana_tebar')
      .select('id_rencana, modal_rp, tanggal_rencana, kolam(nama_kolam), komoditas(nama)')
      .eq('status', 'selesai')
      .order('tanggal_rencana', { ascending: false })
      .limit(8)
    if (error) throw error
    if (!rencanaRows || rencanaRows.length === 0) return []

    const ids = rencanaRows.map((r: any) => r.id_rencana)
    const [panenRes, operasionalRes] = await Promise.all([
      supabase.from('panen').select('id_rencana, total_bobot_kg, total_pendapatan').in('id_rencana', ids),
      supabase.from('operasional_harian').select('id_rencana, jumlah_pakan_kg').in('id_rencana', ids),
    ])

    const panenRows = (panenRes.data ?? []) as { id_rencana: string; total_bobot_kg: number; total_pendapatan: number }[]
    const operasionalRows = (operasionalRes.data ?? []) as { id_rencana: string; jumlah_pakan_kg: number }[]

    return rencanaRows.map((r: any) => {
      const panenForR = panenRows.filter(p => p.id_rencana === r.id_rencana)
      const totalProduksi = panenForR.reduce((s, p) => s + Number(p.total_bobot_kg ?? 0), 0)
      const totalPendapatan = panenForR.reduce((s, p) => s + Number(p.total_pendapatan ?? 0), 0)
      const totalPakan = operasionalRows.filter(o => o.id_rencana === r.id_rencana).reduce((s, o) => s + Number(o.jumlah_pakan_kg ?? 0), 0)
      const modal = Number(r.modal_rp ?? 0)
      const profit = totalPendapatan - modal
      return {
        id_rencana: r.id_rencana,
        label: `${r.kolam?.nama_kolam ?? '—'} (${new Date(r.tanggal_rencana).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })})`,
        komoditas: r.komoditas?.nama ?? '—',
        modal,
        totalPendapatan,
        profit,
        roi: modal > 0 ? (profit / modal) * 100 : 0,
        fcrRata: totalProduksi > 0 ? totalPakan / totalProduksi : 0,
      }
    })
  },

  async getLaporanData(idRencana: string): Promise<LaporanData> {
    const [rencanaRes, panenRes, samplingRes, operasionalRes] = await Promise.all([
      supabase.from('rencana_tebar').select('*, kolam(*), komoditas(*)').eq('id_rencana', idRencana).single(),
      supabase.from('panen').select('*').eq('id_rencana', idRencana),
      supabase.from('sampling_pertumbuhan').select('*').eq('id_rencana', idRencana).order('minggu_ke'),
      supabase.from('operasional_harian').select('*').eq('id_rencana', idRencana),
    ])

    if (rencanaRes.error) throw rencanaRes.error

    const panen      = (panenRes.data ?? []) as Panen[]
    const sampling   = (samplingRes.data ?? []) as SamplingPertumbuhan[]
    const operasional = (operasionalRes.data ?? []) as OperasionalHarian[]

    const totalProduksi   = panen.reduce((s, p) => s + p.total_bobot_kg, 0)
    const totalPendapatan = panen.reduce((s, p) => s + p.total_pendapatan, 0)
    const totalPakan      = operasional.reduce((s, o) => s + o.jumlah_pakan_kg, 0)
    const fcrRata         = totalProduksi > 0 ? totalPakan / totalProduksi : 0

    // Cari siklus selesai sebelumnya di kolam yang sama — buat insight
    // perbandingan otomatis (bukan panggilan AI, murni agregasi data nyata).
    const rencana = rencanaRes.data as any
    let siklusSebelumnya: SiklusSebelumnya | null = null
    if (rencana?.id_kolam) {
      const { data: prevRows } = await supabase
        .from('rencana_tebar')
        .select('id_rencana, tanggal_rencana, modal_rp')
        .eq('id_kolam', rencana.id_kolam)
        .eq('status', 'selesai')
        .lt('tanggal_rencana', rencana.tanggal_rencana)
        .neq('id_rencana', idRencana)
        .order('tanggal_rencana', { ascending: false })
        .limit(1)

      const prev = prevRows?.[0]
      if (prev) {
        const [prevPanenRes, prevOpRes] = await Promise.all([
          supabase.from('panen').select('total_bobot_kg, total_pendapatan').eq('id_rencana', prev.id_rencana),
          supabase.from('operasional_harian').select('jumlah_pakan_kg').eq('id_rencana', prev.id_rencana),
        ])
        const prevPanen = (prevPanenRes.data ?? []) as { total_bobot_kg: number; total_pendapatan: number }[]
        const prevOp = (prevOpRes.data ?? []) as { jumlah_pakan_kg: number }[]
        const prevProduksi = prevPanen.reduce((s, p) => s + Number(p.total_bobot_kg ?? 0), 0)
        const prevPendapatan = prevPanen.reduce((s, p) => s + Number(p.total_pendapatan ?? 0), 0)
        const prevPakan = prevOp.reduce((s, o) => s + Number(o.jumlah_pakan_kg ?? 0), 0)
        siklusSebelumnya = {
          tanggal_rencana: prev.tanggal_rencana,
          fcrRata: prevProduksi > 0 ? prevPakan / prevProduksi : 0,
          profit: prevPendapatan - Number(prev.modal_rp ?? 0),
        }
      }
    }

    return {
      rencana,
      panen, sampling, operasional,
      totalProduksi, totalPendapatan, totalPakan, fcrRata,
      siklusSebelumnya,
    }
  },

  // Estimasi omset buat siklus AKTIF (belum panen) — dari biomassa
  // sampling terakhir × harga acuan komoditas (atau fallback ke harga
  // panen terakhir untuk komoditas yang sama kalau harga acuan kosong).
  // Selalu label jelas "Estimasi", bukan angka final.
  async getEstimasiOmset(idRencana: string): Promise<{ estimasiBiomassaKg: number; hargaPerKg: number | null; estimasiOmset: number | null; sumberHarga: 'acuan' | 'histori' | null } | null> {
    const rencanaRes = await supabase
      .from('rencana_tebar')
      .select('id_komoditas, komoditas(harga_acuan_per_kg)')
      .eq('id_rencana', idRencana)
      .single()
    if (rencanaRes.error) throw rencanaRes.error
    const idKomoditas = rencanaRes.data.id_komoditas as string
    const hargaAcuan = (rencanaRes.data.komoditas as any)?.harga_acuan_per_kg as number | null

    const samplingRes = await supabase
      .from('sampling_pertumbuhan')
      .select('estimasi_populasi, rata_berat_gram')
      .eq('id_rencana', idRencana)
      .order('minggu_ke', { ascending: false })
      .limit(1)
    if (samplingRes.error) throw samplingRes.error
    const latest = samplingRes.data?.[0]
    if (!latest) return null

    const estimasiBiomassaKg = (Number(latest.estimasi_populasi) * Number(latest.rata_berat_gram)) / 1000

    let hargaPerKg = hargaAcuan
    let sumberHarga: 'acuan' | 'histori' | null = hargaAcuan ? 'acuan' : null

    if (!hargaPerKg) {
      const histRes = await supabase
        .from('panen')
        .select('harga_per_kg, rencana_tebar!inner(id_komoditas)')
        .eq('rencana_tebar.id_komoditas', idKomoditas)
        .order('tanggal_panen', { ascending: false })
        .limit(1)
      const histPrice = histRes.data?.[0]?.harga_per_kg as number | undefined
      if (histPrice) {
        hargaPerKg = histPrice
        sumberHarga = 'histori'
      }
    }

    return {
      estimasiBiomassaKg,
      hargaPerKg,
      estimasiOmset: hargaPerKg ? estimasiBiomassaKg * hargaPerKg : null,
      sumberHarga,
    }
  },
}
