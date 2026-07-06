'use client'

import { useCallback, useEffect, useState } from 'react'
import { laporanRepository, type LaporanData } from '@/lib/repositories/laporan.repository'

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
