import { supabase } from '@/lib/supabase'
import type { RencanaTebar, Panen, SamplingPertumbuhan, OperasionalHarian } from '@/types/database'

export interface LaporanData {
  rencana: RencanaTebar & { kolam?: any; komoditas?: any }
  panen: Panen[]
  sampling: SamplingPertumbuhan[]
  operasional: OperasionalHarian[]
  totalProduksi: number
  totalPendapatan: number
  totalPakan: number
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

    return {
      rencana: rencanaRes.data as any,
      panen, sampling, operasional,
      totalProduksi, totalPendapatan, totalPakan, fcrRata,
    }
  },
}
