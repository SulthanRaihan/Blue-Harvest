'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { persiapanRepository, PERSIAPAN_ITEMS } from '@/lib/repositories/persiapan.repository'
import type { PersiapanKolam, ItemPersiapan } from '@/types/database'

export const PERSIAPAN_LABEL: Record<ItemPersiapan, string> = {
  pengeringan: 'Pengeringan Tambak',
  pengapuran: 'Pengapuran',
  perbaikan_pematang: 'Perbaikan Pematang & Pintu Air',
  pengisian_air: 'Pengisian Air Bertahap',
  pemupukan: 'Pemupukan',
  cek_kualitas_air: 'Cek Kualitas Air Awal',
}

export function usePersiapan(idKolam: string) {
  const [entries, setEntries] = useState<PersiapanKolam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!idKolam) return
    try {
      setLoading(true)
      setError(null)
      const data = await persiapanRepository.getByKolam(idKolam)
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data persiapan')
    } finally {
      setLoading(false)
    }
  }, [idKolam])

  useEffect(() => { fetch() }, [fetch])

  // Gabungkan 6 item SOP tetap dengan data tersimpan (kalau belum ada, anggap belum selesai)
  const checklist = useMemo(() => {
    return PERSIAPAN_ITEMS.map(item => {
      const existing = entries.find(e => e.item === item)
      return existing ?? {
        id_persiapan: '', id_kolam: idKolam, item,
        selesai: false, tanggal_selesai: null, catatan: null, foto_url: null,
      } as PersiapanKolam
    })
  }, [entries, idKolam])

  const progress = useMemo(() => {
    const done = checklist.filter(c => c.selesai).length
    return { done, total: checklist.length, pct: Math.round((done / checklist.length) * 100) }
  }, [checklist])

  const toggle = async (item: ItemPersiapan, selesai: boolean) => {
    const updated = await persiapanRepository.upsertItem(idKolam, item, {
      selesai,
      tanggal_selesai: selesai ? new Date().toISOString().split('T')[0] : null,
    })
    setEntries(prev => {
      const others = prev.filter(e => e.item !== item)
      return [...others, updated]
    })
  }

  const setFoto = async (item: ItemPersiapan, foto_url: string) => {
    const updated = await persiapanRepository.upsertItem(idKolam, item, { foto_url })
    setEntries(prev => {
      const others = prev.filter(e => e.item !== item)
      return [...others, updated]
    })
  }

  return { checklist, progress, loading, error, refresh: fetch, toggle, setFoto }
}
