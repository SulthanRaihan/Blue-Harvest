'use client'

import { useCallback, useEffect, useState } from 'react'
import { komoditasRepository } from '@/lib/repositories/komoditas.repository'
import type { Komoditas, NamaKomoditas } from '@/types/database'

export const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng:      'Ikan Bandeng',
  nila:         'Ikan Nila',
  udang_vaname: 'Udang Vaname',
}

export function useKomoditas() {
  const [komoditas, setKomoditas] = useState<Komoditas[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await komoditasRepository.getAll()
      setKomoditas(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat komoditas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = async (id: string, updates: Partial<Omit<Komoditas, 'id_komoditas' | 'nama'>>) => {
    const updated = await komoditasRepository.update(id, updates)
    setKomoditas(prev => prev.map(k => k.id_komoditas === id ? updated : k))
    return updated
  }

  return { komoditas, loading, error, refresh, update }
}
