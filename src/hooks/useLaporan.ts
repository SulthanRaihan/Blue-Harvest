'use client'

import { useCallback, useEffect, useState } from 'react'
import { laporanRepository, type LaporanData, type PerbandinganSiklus, type KolamPerformance } from '@/lib/repositories/laporan.repository'

export function useLaporanList() {
  const [list, setList]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await laporanRepository.getSiklusSelesai()
      setList(data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { list, loading, error }
}

export function usePerbandinganSiklus() {
  const [data, setData]     = useState<PerbandinganSiklus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    let active = true
    laporanRepository.getPerbandinganSiklus()
      .then(res => { if (active) setData(res) })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Gagal memuat perbandingan') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { data, loading, error }
}

export function useKolamPerformance() {
  const [data, setData]     = useState<KolamPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    laporanRepository.getKolamPerformance()
      .then(res => { if (active) setData(res) })
      .catch(() => { if (active) setData([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { data, loading }
}

export function useLaporanDetail(idRencana: string) {
  const [data, setData]     = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!idRencana) return
    try {
      setLoading(true)
      setError(null)
      const result = await laporanRepository.getLaporanData(idRencana)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat detail laporan')
    } finally {
      setLoading(false)
    }
  }, [idRencana])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error }
}

export function useEstimasiOmset(idRencana: string) {
  const [data, setData] = useState<Awaited<ReturnType<typeof laporanRepository.getEstimasiOmset>>>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idRencana) return
    let active = true
    laporanRepository.getEstimasiOmset(idRencana)
      .then(res => { if (active) setData(res) })
      .catch(() => { if (active) setData(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [idRencana])

  return { data, loading }
}
