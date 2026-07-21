'use client'

import { useEffect, useState } from 'react'
import { jadwalRepository, type JadwalHariIni } from '@/lib/repositories/jadwal.repository'

const KOSONG: JadwalHariIni = { tugas: [], selesai: 0, total: 0 }

export function useJadwalHariIni() {
  const [jadwal, setJadwal] = useState<JadwalHariIni>(KOSONG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    jadwalRepository.getHariIni()
      .then(res => { if (active) setJadwal(res) })
      .catch(() => { if (active) setJadwal(KOSONG) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const persen = jadwal.total > 0 ? Math.round((jadwal.selesai / jadwal.total) * 100) : 0
  return { jadwal, loading, persen }
}
