import { supabase } from '@/lib/supabase'

export type JenisTugas = 'pakan' | 'kualitas_air' | 'sampling'

export interface TugasHarian {
  id: string
  jenis: JenisTugas
  idRencana: string
  namaKolam: string
  selesai: boolean
  keterangan: string
  href: string
}

export interface JadwalHariIni {
  tugas: TugasHarian[]
  selesai: number
  total: number
}

const LABEL: Record<JenisTugas, { judul: string; belum: string; sudah: string }> = {
  pakan: {
    judul: 'Catat pakan harian',
    belum: 'Belum dicatat hari ini',
    sudah: 'Sudah dicatat hari ini',
  },
  kualitas_air: {
    judul: 'Cek kualitas air',
    belum: 'Belum diukur hari ini',
    sudah: 'Sudah diukur hari ini',
  },
  sampling: {
    judul: 'Sampling mingguan',
    belum: 'Belum ada sampling minggu ini',
    sudah: 'Sampling minggu ini sudah masuk',
  },
}

// Daftar tugas dibentuk dari apa yang BELUM ada, bukan dari tabel jadwal
// terpisah. Jadi tidak perlu entitas baru: cukup bandingkan siklus aktif
// dengan catatan yang sudah masuk hari ini atau minggu ini.
export const jadwalRepository = {
  async getHariIni(): Promise<JadwalHariIni> {
    const hariIni = new Date().toISOString().split('T')[0]

    const { data: rencanaRows, error } = await supabase
      .from('rencana_tebar')
      .select('id_rencana, id_kolam, tanggal_rencana, kolam(nama_kolam)')
      .eq('status', 'aktif')
    if (error) throw error

    const rencana = (rencanaRows ?? []) as any[]
    if (rencana.length === 0) return { tugas: [], selesai: 0, total: 0 }

    const idRencana = rencana.map(r => r.id_rencana)
    const idKolam = rencana.map(r => r.id_kolam)

    const [pakanRes, airRes, samplingRes] = await Promise.all([
      supabase.from('operasional_harian').select('id_rencana').in('id_rencana', idRencana).eq('tanggal', hariIni),
      supabase.from('kualitas_air').select('id_kolam').in('id_kolam', idKolam).eq('tanggal', hariIni),
      supabase.from('sampling_pertumbuhan').select('id_rencana, minggu_ke').in('id_rencana', idRencana),
    ])

    const pakanHariIni = new Set((pakanRes.data ?? []).map((r: any) => r.id_rencana))
    const airHariIni = new Set((airRes.data ?? []).map((r: any) => r.id_kolam))
    const samplingRows = (samplingRes.data ?? []) as { id_rencana: string; minggu_ke: number }[]

    const tugas: TugasHarian[] = []

    for (const r of rencana) {
      const nama = r.kolam?.nama_kolam ?? 'Kolam'

      const adaPakan = pakanHariIni.has(r.id_rencana)
      tugas.push({
        id: `pakan-${r.id_rencana}`,
        jenis: 'pakan',
        idRencana: r.id_rencana,
        namaKolam: nama,
        selesai: adaPakan,
        keterangan: adaPakan ? LABEL.pakan.sudah : LABEL.pakan.belum,
        href: `/operasional/${r.id_rencana}`,
      })

      const adaAir = airHariIni.has(r.id_kolam)
      tugas.push({
        id: `air-${r.id_rencana}`,
        jenis: 'kualitas_air',
        idRencana: r.id_rencana,
        namaKolam: nama,
        selesai: adaAir,
        keterangan: adaAir ? LABEL.kualitas_air.sudah : LABEL.kualitas_air.belum,
        href: `/operasional/${r.id_rencana}`,
      })

      // Minggu ke berapa siklus ini sedang berjalan
      const mulai = new Date(r.tanggal_rencana).getTime()
      const selisihHari = Math.floor((Date.now() - mulai) / 86400000)
      const mingguBerjalan = Math.floor(selisihHari / 7) + 1
      if (mingguBerjalan >= 1) {
        const adaSampling = samplingRows.some(s => s.id_rencana === r.id_rencana && s.minggu_ke >= mingguBerjalan)
        tugas.push({
          id: `sampling-${r.id_rencana}`,
          jenis: 'sampling',
          idRencana: r.id_rencana,
          namaKolam: nama,
          selesai: adaSampling,
          keterangan: adaSampling ? LABEL.sampling.sudah : `${LABEL.sampling.belum} (minggu ke-${mingguBerjalan})`,
          href: `/sampling/${r.id_rencana}`,
        })
      }
    }

    return {
      tugas,
      selesai: tugas.filter(t => t.selesai).length,
      total: tugas.length,
    }
  },
}

export const JUDUL_TUGAS = LABEL
