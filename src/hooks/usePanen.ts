'use client'

import { useCallback, useEffect, useState } from 'react'
import { panenRepository, distribusiRepository, type PanenWithRencana } from '@/lib/repositories/panen.repository'
import type { Panen, Distribusi } from '@/types/database'

export function usePanen() {
  const [panen, setPanen]   = useState<PanenWithRencana[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await panenRepository.getAll()
      setPanen(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data panen')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: Omit<Panen, 'id_panen' | 'total_pendapatan' | 'foto_url'>) => {
    const created = await panenRepository.create(data)
    await fetch()
    return created
  }

  return { panen, loading, error, refresh: fetch, create }
}

export function usePanenByRencana(idRencana: string) {
  const [panen, setPanen]   = useState<Panen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const data = await panenRepository.getByRencana(idRencana)
      setPanen(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat panen')
    } finally {
      setLoading(false)
    }
  }, [idRencana])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: Omit<Panen, 'id_panen' | 'total_pendapatan' | 'foto_url'>) => {
    const created = await panenRepository.create(data)
    setPanen(prev => [created, ...prev])
    return created
  }

  const setFoto = async (id: string, fotoUrl: string) => {
    await panenRepository.updateFoto(id, fotoUrl)
    setPanen(prev => prev.map(p => p.id_panen === id ? { ...p, foto_url: fotoUrl } : p))
  }

  return { panen, loading, error, refresh: fetch, create, setFoto }
}

export function useDistribusi(idPanen: string) {
  const [distribusi, setDistribusi] = useState<Distribusi[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!idPanen) return
    try {
      setLoading(true)
      const data = await distribusiRepository.getByPanen(idPanen)
      setDistribusi(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat distribusi')
    } finally {
      setLoading(false)
    }
  }, [idPanen])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: Omit<Distribusi, 'id_distribusi'>) => {
    const created = await distribusiRepository.create(data)
    setDistribusi(prev => [created, ...prev])
    return created
  }

  const updateStatus = async (id: string, status: Distribusi['status']) => {
    await distribusiRepository.updateStatus(id, status)
    setDistribusi(prev => prev.map(d => d.id_distribusi === id ? { ...d, status } : d))
  }

  return { distribusi, loading, error, refresh: fetch, create, updateStatus }
}
