'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  kolamAktif: number
  siklusBerjalan: number
  menungguApproval: number
  panenBulanIni: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [kolamRes, siklusRes, approvalRes, panenRes] = await Promise.all([
          supabase.from('kolam').select('id_kolam', { count: 'exact' }).eq('status', 'aktif'),
          supabase.from('rencana_tebar').select('id_rencana', { count: 'exact' }).eq('status', 'aktif'),
          supabase.from('rencana_tebar').select('id_rencana', { count: 'exact' }).eq('status', 'draft'),
          supabase.from('panen')
            .select('total_bobot_kg')
            .gte('tanggal_panen', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        ])

        const panenKg = (panenRes.data ?? []).reduce((sum, p) => sum + (p.total_bobot_kg ?? 0), 0)

        setStats({
          kolamAktif: kolamRes.count ?? 0,
          siklusBerjalan: siklusRes.count ?? 0,
          menungguApproval: approvalRes.count ?? 0,
          panenBulanIni: Math.round(panenKg),
        })
      } catch {
        setStats({ kolamAktif: 0, siklusBerjalan: 0, menungguApproval: 0, panenBulanIni: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, loading }
}
