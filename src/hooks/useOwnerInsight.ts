'use client'

import { useEffect, useState } from 'react'
import { ownerInsightRepository, type TrenBulanan, type RoiPerKategori } from '@/lib/repositories/ownerInsight.repository'

export function useTrenBulanan(months = 6) {
  const [tren, setTren] = useState<TrenBulanan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ownerInsightRepository.getTrenBulanan(months)
      .then(res => { if (active) setTren(res) })
      .catch(() => { if (active) setTren([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [months])

  // delta pendapatan bulan ini vs bulan lalu, buat indikator di stat tile
  const bulanIni = tren[tren.length - 1]
  const bulanLalu = tren[tren.length - 2]
  const deltaPendapatanPct = bulanIni && bulanLalu && bulanLalu.pendapatan > 0
    ? ((bulanIni.pendapatan - bulanLalu.pendapatan) / bulanLalu.pendapatan) * 100
    : null

  return { tren, loading, deltaPendapatanPct }
}

export function useRoiPerKategori() {
  const [data, setData] = useState<RoiPerKategori[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ownerInsightRepository.getRoiPerKategori()
      .then(res => { if (active) setData(res) })
      .catch(() => { if (active) setData([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { data, loading }
}

export interface DashboardInsightPayload {
  deltaPendapatanPct: number | null
  totalPendapatan: number
  totalModal: number
  menungguApproval: number
  siklusAktif: number
  roiPerKategori: RoiPerKategori[]
  komoditasBreakdown: { komoditas: string; jumlah: number }[]
}

export function useDashboardInsight(payload: DashboardInsightPayload | null) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!payload) return
    let active = true
    setLoading(true)
    fetch('/api/ai/dashboard-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(json => {
        if (!active) return
        if (json.error) setError(json.error)
        else setInsight(json.insight)
      })
      .catch(() => { if (active) setError('Gagal memuat insight') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload && JSON.stringify(payload)])

  return { insight, loading, error }
}
