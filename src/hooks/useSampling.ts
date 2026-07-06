'use client'

import { useCallback, useEffect, useState } from 'react'
import { samplingRepository } from '@/lib/repositories/sampling.repository'
import type { SamplingPertumbuhan } from '@/types/database'

export function useSampling(idRencana: string) {
  const [entries, setEntries] = useState<SamplingPertumbuhan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await samplingRepository.getByRencana(idRencana)
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data sampling')
    } finally {
      setLoading(false)
    }
  }, [idRencana])

  useEffect(() => { fetch() }, [fetch])

  const add = async (entry: Omit<SamplingPertumbuhan, 'id_sampling'>) => {
    const created = await samplingRepository.create(entry)
    setEntries(prev => [...prev, created].sort((a, b) => a.minggu_ke - b.minggu_ke))
    return created
  }

  const remove = async (id: string) => {
    await samplingRepository.delete(id)
    setEntries(prev => prev.filter(e => e.id_sampling !== id))
  }

  return { entries, loading, error, refresh: fetch, add, remove }
}
