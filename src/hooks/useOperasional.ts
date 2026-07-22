'use client'

import { useCallback, useEffect, useState } from 'react'
import { operasionalRepository, type OperasionalWithPencatat } from '@/lib/repositories/operasional.repository'
import { kualitasRepository, type KualitasWithPencatat } from '@/lib/repositories/kualitas.repository'
import type { OperasionalHarian, KualitasAir, Komoditas } from '@/types/database'

// ── Threshold check ───────────────────────────────────────────
export interface ParamStatus {
  value: number
  ok: boolean
  label: string
}

export function checkKualitas(k: KualitasAir, komoditas?: Komoditas | null): Record<string, ParamStatus> {
  if (!komoditas) return {}
  return {
    ph: {
      value: k.ph,
      ok: k.ph >= komoditas.target_ph_min && k.ph <= komoditas.target_ph_max,
      label: `pH ${k.ph} (target ${komoditas.target_ph_min}–${komoditas.target_ph_max})`,
    },
    do_ppm: {
      value: k.do_ppm,
      ok: k.do_ppm >= komoditas.target_do_min,
      label: `DO ${k.do_ppm} ppm (min ${komoditas.target_do_min})`,
    },
    suhu: {
      value: k.suhu_celsius,
      ok: k.suhu_celsius >= komoditas.target_suhu_min && k.suhu_celsius <= komoditas.target_suhu_max,
      label: `Suhu ${k.suhu_celsius}°C (target ${komoditas.target_suhu_min}–${komoditas.target_suhu_max})`,
    },
    salinitas: {
      value: k.salinitas_ppt,
      ok: k.salinitas_ppt >= komoditas.target_salinitas_min && k.salinitas_ppt <= komoditas.target_salinitas_max,
      label: `Salinitas ${k.salinitas_ppt} ppt (target ${komoditas.target_salinitas_min}–${komoditas.target_salinitas_max})`,
    },
  }
}

// ── useOperasional ────────────────────────────────────────────
export function useOperasional(idRencana: string) {
  const [entries, setEntries] = useState<OperasionalWithPencatat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await operasionalRepository.getByRencana(idRencana)
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat log operasional')
    } finally {
      setLoading(false)
    }
  }, [idRencana])

  useEffect(() => { fetch() }, [fetch])

  const add = async (entry: Omit<OperasionalHarian, 'id_operasional' | 'dicatat_oleh'>) => {
    const created = await operasionalRepository.create(entry)
    setEntries(prev => [created, ...prev])
    return created
  }

  const remove = async (id: string) => {
    await operasionalRepository.delete(id)
    setEntries(prev => prev.filter(e => e.id_operasional !== id))
  }

  return { entries, loading, error, refresh: fetch, add, remove }
}

// ── useKualitas ───────────────────────────────────────────────
export function useKualitas(idKolam: string) {
  const [entries, setEntries] = useState<KualitasWithPencatat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!idKolam) return
    try {
      setLoading(true)
      setError(null)
      const data = await kualitasRepository.getByKolam(idKolam)
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data kualitas air')
    } finally {
      setLoading(false)
    }
  }, [idKolam])

  useEffect(() => { fetch() }, [fetch])

  const add = async (entry: Omit<KualitasAir, 'id_kualitas' | 'dicatat_oleh'>) => {
    const created = await kualitasRepository.create(entry)
    setEntries(prev => [created, ...prev])
    return created
  }

  const remove = async (id: string) => {
    await kualitasRepository.delete(id)
    setEntries(prev => prev.filter(e => e.id_kualitas !== id))
  }

  return { entries, loading, error, refresh: fetch, add, remove }
}
