'use client'

import { useState } from 'react'
import { skoringRepository, type SkoringInput, type SkoringResult } from '@/lib/repositories/skoring.repository'
import type { KategoriRisiko } from '@/types/database'

export interface SkoringViewModel {
  result: SkoringResult | null
  loading: boolean
  error: string | null
  hitungSkoring: (input: SkoringInput) => Promise<void>
  getLabel: (kategori: KategoriRisiko) => { label: string; desc: string }
}

const KATEGORI_MAP: Record<KategoriRisiko, { label: string; desc: string }> = {
  best: { label: 'BEST CASE', desc: 'Risiko rendah — budidaya dapat dilanjutkan.' },
  middle: { label: 'MIDDLE CASE', desc: 'Risiko sedang — diperlukan langkah mitigasi.' },
  worst: { label: 'WORST CASE', desc: 'Risiko tinggi — tinjau ulang rencana.' },
}

export function useSkoring(): SkoringViewModel {
  const [result, setResult] = useState<SkoringResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hitungSkoring = async (input: SkoringInput) => {
    try {
      setLoading(true)
      setError(null)
      const data = await skoringRepository.create(input)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghitung skoring')
    } finally {
      setLoading(false)
    }
  }

  const getLabel = (kategori: KategoriRisiko) => KATEGORI_MAP[kategori]

  return { result, loading, error, hitungSkoring, getLabel }
}
