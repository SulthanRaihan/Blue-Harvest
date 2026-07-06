'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    komoditasRepository.getAll()
      .then(setKomoditas)
      .catch(() => setKomoditas([]))
      .finally(() => setLoading(false))
  }, [])

  return { komoditas, loading }
}
