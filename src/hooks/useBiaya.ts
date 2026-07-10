'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { biayaRepository } from '@/lib/repositories/biaya.repository'
import type { BiayaOperasional, KategoriBiaya } from '@/types/database'

export const KATEGORI_BIAYA_LABEL: Record<KategoriBiaya, string> = {
  benih: 'Benih',
  pakan: 'Pakan',
  listrik: 'Listrik',
  tenaga_kerja: 'Tenaga Kerja',
  obat_probiotik: 'Obat / Probiotik',
  lainnya: 'Lainnya',
}

export function useBiaya(idRencana: string) {
  const [entries, setEntries] = useState<BiayaOperasional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!idRencana) return
    try {
      setLoading(true)
      setError(null)
      const data = await biayaRepository.getByRencana(idRencana)
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data biaya')
    } finally {
      setLoading(false)
    }
  }, [idRencana])

  useEffect(() => { fetch() }, [fetch])

  const add = async (entry: Omit<BiayaOperasional, 'id_biaya' | 'created_at'>) => {
    const created = await biayaRepository.create(entry)
    setEntries(prev => [created, ...prev])
    return created
  }

  const remove = async (id: string) => {
    await biayaRepository.delete(id)
    setEntries(prev => prev.filter(e => e.id_biaya !== id))
  }

  const total = useMemo(() => entries.reduce((s, e) => s + Number(e.jumlah_rp), 0), [entries])

  const breakdown = useMemo(() => {
    const map = new Map<KategoriBiaya, number>()
    for (const e of entries) map.set(e.kategori, (map.get(e.kategori) ?? 0) + Number(e.jumlah_rp))
    return [...map.entries()].map(([kategori, jumlah]) => ({ kategori, jumlah }))
  }, [entries])

  return { entries, loading, error, refresh: fetch, add, remove, total, breakdown }
}
