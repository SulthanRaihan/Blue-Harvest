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

export interface SiklusExportRow {
  kolam: string
  komoditas: string
  tanggalTebar: string
  jumlahBenih: number
  modal: number
  produksiKg: number
  pendapatan: number
  profit: number
  roiPersen: number
  fcr: number
  survivalPersen: number
}

export interface AnalitikProduksi {
  komposisiKomoditas: { komoditas: string; totalKg: number }[]
  trenSiklus: { label: string; survivalRate: number; fcrRata: number }[]
}

export interface KolamPerformance {
  id_kolam: string
  nama_kolam: string
  jumlahSiklus: number
  totalProduksi: number
  totalPendapatan: number
  totalModal: number
  profit: number
  roi: number
  fcrRata: number
  komoditasTerakhir: string | null
  siklusTerakhirTanggal: string | null
  perSiklus: { label: string; profit: number; fcrRata: number }[]
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

  // Agregasi performa PER KOLAM dari seluruh siklus selesai — untuk
  // selector kolam di halaman Laporan (pilih kolam, lihat performanya).
  async getKolamPerformance(): Promise<KolamPerformance[]> {
    const { data: rencanaRows, error } = await supabase
      .from('rencana_tebar')
      .select('id_rencana, id_kolam, modal_rp, tanggal_rencana, kolam(nama_kolam), komoditas(nama)')
      .eq('status', 'selesai')
      .order('tanggal_rencana', { ascending: false })
    if (error) throw error
    if (!rencanaRows || rencanaRows.length === 0) return []

    const ids = rencanaRows.map((r: any) => r.id_rencana)
    const [panenRes, operasionalRes] = await Promise.all([
      supabase.from('panen').select('id_rencana, total_bobot_kg, total_pendapatan').in('id_rencana', ids),
      supabase.from('operasional_harian').select('id_rencana, jumlah_pakan_kg').in('id_rencana', ids),
    ])
    const panenRows = (panenRes.data ?? []) as { id_rencana: string; total_bobot_kg: number; total_pendapatan: number }[]
    const opRows = (operasionalRes.data ?? []) as { id_rencana: string; jumlah_pakan_kg: number }[]

    const bulan = (t: string) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })

    const byKolam = new Map<string, KolamPerformance>()
    // rencanaRows sudah urut terbaru dulu, jadi entri pertama tiap kolam = siklus terakhir
    for (const r of rencanaRows as any[]) {
      const produksi = panenRows.filter(p => p.id_rencana === r.id_rencana).reduce((s, p) => s + Number(p.total_bobot_kg ?? 0), 0)
      const pendapatan = panenRows.filter(p => p.id_rencana === r.id_rencana).reduce((s, p) => s + Number(p.total_pendapatan ?? 0), 0)
      const pakan = opRows.filter(o => o.id_rencana === r.id_rencana).reduce((s, o) => s + Number(o.jumlah_pakan_kg ?? 0), 0)
      const modal = Number(r.modal_rp ?? 0)
      const fcr = produksi > 0 ? pakan / produksi : 0

      const existing = byKolam.get(r.id_kolam)
      if (!existing) {
        byKolam.set(r.id_kolam, {
          id_kolam: r.id_kolam,
          nama_kolam: r.kolam?.nama_kolam ?? 'Kolam',
          jumlahSiklus: 1,
          totalProduksi: produksi,
          totalPendapatan: pendapatan,
          totalModal: modal,
          profit: pendapatan - modal,
          roi: 0,
          fcrRata: fcr,
          komoditasTerakhir: r.komoditas?.nama ?? null,
          siklusTerakhirTanggal: r.tanggal_rencana,
          perSiklus: [{ label: bulan(r.tanggal_rencana), profit: pendapatan - modal, fcrRata: fcr }],
        })
      } else {
        existing.jumlahSiklus += 1
        existing.totalProduksi += produksi
        existing.totalPendapatan += pendapatan
        existing.totalModal += modal
        existing.profit += pendapatan - modal
        existing.perSiklus.push({ label: bulan(r.tanggal_rencana), profit: pendapatan - modal, fcrRata: fcr })
      }
    }

    // finalisasi: ROI kumulatif, FCR rata-rata tertimbang, urut perSiklus lama→baru
    const list = [...byKolam.values()].map(k => {
      const fcrValues = k.perSiklus.map(s => s.fcrRata).filter(v => v > 0)
      return {
        ...k,
        roi: k.totalModal > 0 ? (k.profit / k.totalModal) * 100 : 0,
        fcrRata: fcrValues.length ? fcrValues.reduce((a, b) => a + b, 0) / fcrValues.length : 0,
        perSiklus: [...k.perSiklus].reverse(),
      }
    })
    return list.sort((a, b) => b.profit - a.profit)
  },

  // Analitik lintas siklus untuk halaman Laporan (Owner/Admin):
  // komposisi produksi per komoditas + tren survival rate & FCR.
  async getAnalitikProduksi(): Promise<AnalitikProduksi> {
    const { data: rencanaRows, error } = await supabase
      .from('rencana_tebar')
      .select('id_rencana, jumlah_benih, tanggal_rencana, komoditas(nama)')
      .eq('status', 'selesai')
      .order('tanggal_rencana', { ascending: true })
    if (error) throw error
    const rencana = (rencanaRows ?? []) as any[]
    if (rencana.length === 0) return { komposisiKomoditas: [], trenSiklus: [] }

    const ids = rencana.map(r => r.id_rencana)
    const [panenRes, opRes, samplingRes] = await Promise.all([
      supabase.from('panen').select('id_rencana, total_bobot_kg').in('id_rencana', ids),
      supabase.from('operasional_harian').select('id_rencana, jumlah_pakan_kg').in('id_rencana', ids),
      supabase.from('sampling_pertumbuhan').select('id_rencana, minggu_ke, estimasi_populasi').in('id_rencana', ids),
    ])
    const panenRows = (panenRes.data ?? []) as { id_rencana: string; total_bobot_kg: number }[]
    const opRows = (opRes.data ?? []) as { id_rencana: string; jumlah_pakan_kg: number }[]
    const samplingRows = (samplingRes.data ?? []) as { id_rencana: string; minggu_ke: number; estimasi_populasi: number }[]

    const bulan = (t: string) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })

    // Komposisi produksi per komoditas (total kg panen)
    const komMap = new Map<string, number>()
    // Tren per siklus (survival rate + FCR)
    const trenSiklus: AnalitikProduksi['trenSiklus'] = []

    for (const r of rencana) {
      const produksi = panenRows.filter(p => p.id_rencana === r.id_rencana).reduce((s, p) => s + Number(p.total_bobot_kg ?? 0), 0)
      const pakan = opRows.filter(o => o.id_rencana === r.id_rencana).reduce((s, o) => s + Number(o.jumlah_pakan_kg ?? 0), 0)
      const kom = r.komoditas?.nama ?? 'lainnya'
      komMap.set(kom, (komMap.get(kom) ?? 0) + produksi)

      // survival = populasi sampling terakhir / jumlah benih
      const samplingForR = samplingRows.filter(s => s.id_rencana === r.id_rencana)
      const terakhir = samplingForR.sort((a, b) => b.minggu_ke - a.minggu_ke)[0]
      const benih = Number(r.jumlah_benih ?? 0)
      const survivalRate = terakhir && benih > 0 ? (Number(terakhir.estimasi_populasi) / benih) * 100 : 0
      const fcrRata = produksi > 0 ? pakan / produksi : 0

      trenSiklus.push({ label: bulan(r.tanggal_rencana), survivalRate, fcrRata })
    }

    return {
      komposisiKomoditas: [...komMap.entries()].filter(([, kg]) => kg > 0).map(([komoditas, totalKg]) => ({ komoditas, totalKg })),
      trenSiklus,
    }
  },

  // Data per siklus selesai untuk diekspor ke Excel/CSV.
  async getSiklusExport(): Promise<SiklusExportRow[]> {
    const { data: rencanaRows, error } = await supabase
      .from('rencana_tebar')
      .select('id_rencana, jumlah_benih, modal_rp, tanggal_rencana, kolam(nama_kolam), komoditas(nama)')
      .eq('status', 'selesai')
      .order('tanggal_rencana', { ascending: false })
    if (error) throw error
    const rencana = (rencanaRows ?? []) as any[]
    if (rencana.length === 0) return []

    const ids = rencana.map(r => r.id_rencana)
    const [panenRes, opRes, samplingRes] = await Promise.all([
      supabase.from('panen').select('id_rencana, total_bobot_kg, total_pendapatan').in('id_rencana', ids),
      supabase.from('operasional_harian').select('id_rencana, jumlah_pakan_kg').in('id_rencana', ids),
      supabase.from('sampling_pertumbuhan').select('id_rencana, minggu_ke, estimasi_populasi').in('id_rencana', ids),
    ])
    const panenRows = (panenRes.data ?? []) as { id_rencana: string; total_bobot_kg: number; total_pendapatan: number }[]
    const opRows = (opRes.data ?? []) as { id_rencana: string; jumlah_pakan_kg: number }[]
    const samplingRows = (samplingRes.data ?? []) as { id_rencana: string; minggu_ke: number; estimasi_populasi: number }[]

    return rencana.map(r => {
      const produksi = panenRows.filter(p => p.id_rencana === r.id_rencana).reduce((s, p) => s + Number(p.total_bobot_kg ?? 0), 0)
      const pendapatan = panenRows.filter(p => p.id_rencana === r.id_rencana).reduce((s, p) => s + Number(p.total_pendapatan ?? 0), 0)
      const pakan = opRows.filter(o => o.id_rencana === r.id_rencana).reduce((s, o) => s + Number(o.jumlah_pakan_kg ?? 0), 0)
      const modal = Number(r.modal_rp ?? 0)
      const benih = Number(r.jumlah_benih ?? 0)
      const terakhir = samplingRows.filter(s => s.id_rencana === r.id_rencana).sort((a, b) => b.minggu_ke - a.minggu_ke)[0]
      const profit = pendapatan - modal
      return {
        kolam: r.kolam?.nama_kolam ?? '-',
        komoditas: r.komoditas?.nama ?? '-',
        tanggalTebar: r.tanggal_rencana,
        jumlahBenih: benih,
        modal,
        produksiKg: produksi,
        pendapatan,
        profit,
        roiPersen: modal > 0 ? (profit / modal) * 100 : 0,
        fcr: produksi > 0 ? pakan / produksi : 0,
        survivalPersen: terakhir && benih > 0 ? (Number(terakhir.estimasi_populasi) / benih) * 100 : 0,
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
