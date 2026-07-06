'use client'

import { useEffect, useState, useCallback } from 'react'
import { kolamRepository, type KolamWithPengguna } from '@/lib/repositories/kolam.repository'
import type { Kolam } from '@/types/database'

export function useKolam() {
  const [kolam, setKolam] = useState<KolamWithPengguna[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await kolamRepository.getAll()
      setKolam(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data kolam')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: Omit<Kolam, 'id_kolam' | 'created_at'>) => {
    const created = await kolamRepository.create(data)
    await fetch()
    return created
  }

  const update = async (id: string, data: Partial<Omit<Kolam, 'id_kolam' | 'created_at'>>) => {
    const updated = await kolamRepository.update(id, data)
    setKolam(prev => prev.map(k => k.id_kolam === id ? { ...k, ...updated } : k))
    return updated
  }

  const toggleStatus = async (id: string, current: Kolam['status']) => {
    await kolamRepository.toggleStatus(id, current)
    const next = current === 'aktif' ? 'tidak_aktif' : 'aktif'
    setKolam(prev => prev.map(k => k.id_kolam === id ? { ...k, status: next } : k))
  }

  return { kolam, loading, error, refresh: fetch, create, update, toggleStatus }
}
