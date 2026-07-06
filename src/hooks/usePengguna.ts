'use client'

import { useCallback, useEffect, useState } from 'react'
import { penggunaRepository } from '@/lib/repositories/pengguna.repository'
import type { Pengguna, UserRole } from '@/types/database'

export function usePengguna() {
  const [pengguna, setPengguna] = useState<Pengguna[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await penggunaRepository.getAll()
      setPengguna(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const updateRole = async (id: string, role: UserRole) => {
    await penggunaRepository.updateRole(id, role)
    setPengguna(prev => prev.map(p => p.id_pengguna === id ? { ...p, role } : p))
  }

  const updateNama = async (id: string, nama: string) => {
    await penggunaRepository.updateNama(id, nama)
    setPengguna(prev => prev.map(p => p.id_pengguna === id ? { ...p, nama } : p))
  }

  return { pengguna, loading, error, refresh: fetch, updateRole, updateNama }
}
