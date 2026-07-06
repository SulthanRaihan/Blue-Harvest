'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StatusRencana, NamaKomoditas } from '@/types/database'

// ── Bentuk data ringkas untuk kartu & daftar dashboard ────────
export interface RencanaRingkas {
  id_rencana: string
  status: StatusRencana
  modal_rp: number
  jumlah_benih: number
  tanggal_rencana: string
  nama_kolam: string | null
  komoditas: NamaKomoditas | null
}

export interface DashboardData {
  // hitungan umum
  totalPengguna: number
  totalKolam: number
  kolamAktif: number
  siklusAktif: number
  menungguApproval: number
  // finansial
  panenBulanIniKg: number
  totalPendapatan: number
  totalModal: number
  // daftar
  rencanaDraft: RencanaRingkas[]      // untuk Owner (perlu approval)
  siklusAktifList: RencanaRingkas[]   // untuk Petambak (sedang berjalan)
  komoditasBreakdown: { komoditas: NamaKomoditas; jumlah: number }[]
}

const EMPTY: DashboardData = {
  totalPengguna: 0, totalKolam: 0, kolamAktif: 0, siklusAktif: 0, menungguApproval: 0,
  panenBulanIniKg: 0, totalPendapatan: 0, totalModal: 0,
  rencanaDraft: [], siklusAktifList: [], komoditasBreakdown: [],
}

/**
 * ViewModel dashboard. Mengambil satu bundel data lalu menurunkan
 * seluruh metrik di sisi klien, sehingga tiap View per-role tinggal
 * memilih bagian yang relevan tanpa query tambahan.
 */
export function useDashboard() {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchAll() {
      try {
        const [penggunaRes, kolamRes, rencanaRes, panenRes] = await Promise.all([
          supabase.from('pengguna').select('id_pengguna', { count: 'exact', head: true }),
          supabase.from('kolam').select('id_kolam, status'),
          supabase.from('rencana_tebar').select('id_rencana, status, modal_rp, jumlah_benih, tanggal_rencana, kolam(nama_kolam), komoditas(nama)'),
          supabase.from('panen').select('total_bobot_kg, total_pendapatan, tanggal_panen'),
        ])

        if (!active) return

        const kolamRows = (kolamRes.data ?? []) as { id_kolam: string; status: string }[]
        const rencanaRows = (rencanaRes.data ?? []) as any[]
        const panenRows = (panenRes.data ?? []) as any[]

        const toRingkas = (r: any): RencanaRingkas => ({
          id_rencana: r.id_rencana,
          status: r.status,
          modal_rp: Number(r.modal_rp ?? 0),
          jumlah_benih: Number(r.jumlah_benih ?? 0),
          tanggal_rencana: r.tanggal_rencana,
          nama_kolam: r.kolam?.nama_kolam ?? null,
          komoditas: r.komoditas?.nama ?? null,
        })

        const semuaRencana = rencanaRows.map(toRingkas)

        // panen bulan ini
        const now = new Date()
        const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const panenBulanIniKg = panenRows
          .filter(p => (p.tanggal_panen ?? '') >= awalBulan)
          .reduce((s, p) => s + Number(p.total_bobot_kg ?? 0), 0)

        const totalPendapatan = panenRows.reduce((s, p) => s + Number(p.total_pendapatan ?? 0), 0)
        const totalModal = semuaRencana.reduce((s, r) => s + r.modal_rp, 0)

        // breakdown komoditas dari siklus aktif
        const aktif = semuaRencana.filter(r => r.status === 'aktif')
        const breakdownMap = new Map<NamaKomoditas, number>()
        for (const r of aktif) {
          if (r.komoditas) breakdownMap.set(r.komoditas, (breakdownMap.get(r.komoditas) ?? 0) + 1)
        }

        setData({
          totalPengguna: penggunaRes.count ?? 0,
          totalKolam: kolamRows.length,
          kolamAktif: kolamRows.filter(k => k.status === 'aktif').length,
          siklusAktif: aktif.length,
          menungguApproval: semuaRencana.filter(r => r.status === 'draft').length,
          panenBulanIniKg: Math.round(panenBulanIniKg),
          totalPendapatan,
          totalModal,
          rencanaDraft: semuaRencana.filter(r => r.status === 'draft').slice(0, 5),
          siklusAktifList: aktif.slice(0, 5),
          komoditasBreakdown: [...breakdownMap.entries()].map(([komoditas, jumlah]) => ({ komoditas, jumlah })),
        })
      } catch {
        if (active) setData(EMPTY)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAll()
    return () => { active = false }
  }, [])

  return { data, loading }
}
