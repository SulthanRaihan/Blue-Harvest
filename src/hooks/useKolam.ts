'use client'

import { useEffect, useState, useCallback } from 'react'
import { kolamRepository } from '@/lib/repositories/kolam.repository'
import type { Kolam } from '@/types/database'

export function useKolam() {
  const [kolam, setKolam] = useState<Kolam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const data = await kolamRepository.getAll()
      setKolam(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data kolam')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { kolam, loading, error, refresh: fetch }
}
