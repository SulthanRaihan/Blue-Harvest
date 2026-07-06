'use client'

import { useCallback, useEffect, useState } from 'react'
import { rencanaRepository } from '@/lib/repositories/rencana.repository'
import type { RencanaTebar, Kolam, Komoditas } from '@/types/database'

export type RencanaWithRelations = RencanaTebar & {
  kolam: Kolam | null
  komoditas: Komoditas | null
}

export function useRencana() {
  const [rencana, setRencana] = useState<RencanaWithRelations[]>([])
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await rencanaRepository.getAll()
      setRencana(data as RencanaWithRelations[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data rencana')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: Omit<RencanaTebar, 'id_rencana'>) => {
    const created = await rencanaRepository.create(data)
    await fetch()
    return created
  }

  const approve = async (id: string, userId: string) => {
    await rencanaRepository.approve(id, userId)
    setRencana(prev => prev.map(r =>
      r.id_rencana === id ? { ...r, status: 'approved', id_approved_by: userId } : r
    ))
  }

  const updateStatus = async (id: string, status: RencanaTebar['status']) => {
    await rencanaRepository.updateStatus(id, status)
    setRencana(prev => prev.map(r =>
      r.id_rencana === id ? { ...r, status } : r
    ))
  }

  return { rencana, loading, error, refresh: fetch, create, approve, updateStatus }
}

export function useRencanaDetail(id: string) {
  const [rencana, setRencana] = useState<RencanaWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const data = await rencanaRepository.getById(id)
      setRencana(data as RencanaWithRelations | null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat detail rencana')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  const approve = async (userId: string) => {
    await rencanaRepository.approve(id, userId)
    setRencana(prev => prev ? { ...prev, status: 'approved', id_approved_by: userId } : null)
  }

  const updateStatus = async (status: RencanaTebar['status']) => {
    await rencanaRepository.updateStatus(id, status)
    setRencana(prev => prev ? { ...prev, status } : null)
  }

  return { rencana, loading, error, refresh: fetch, approve, updateStatus }
}
