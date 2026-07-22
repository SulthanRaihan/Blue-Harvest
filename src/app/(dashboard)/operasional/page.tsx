'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencana } from '@/hooks/useRencana'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NamaKomoditas } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng:      'Ikan Bandeng',
  nila:         'Ikan Nila',
  udang_vaname: 'Udang Vaname',
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--color-ocean-50)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-300)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="14" x2="8" y2="14"/>
          <line x1="12" y1="14" x2="12" y2="14"/>
          <line x1="16" y1="14" x2="16" y2="14"/>
        </svg>
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
          Tidak ada siklus aktif
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Aktifkan rencana budidaya di modul Perencanaan terlebih dahulu
        </p>
      </div>
      <Link href="/perencanaan"
        className="px-4 py-2 rounded-lg text-sm font-semibold"
        style={{ background: 'var(--color-notion-500)', color: '#fff' }}>
        Ke Perencanaan
      </Link>
    </div>
  )
}

export default function OperasionalPage() {
  const { rencana, loading } = useRencana()
  const pageRef = useRef<HTMLDivElement>(null)

  const aktif = rencana.filter(r => r.status === 'aktif')

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.cycle-card', { y: 18, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [loading] })

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Operasional Harian
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Log pakan, kualitas air, dan catatan hama/penyakit untuk setiap siklus aktif
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} height={120} rounded="rounded-2xl" />)}
        </div>
      ) : aktif.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {aktif.map(r => {
            const komoditas = r.komoditas?.nama ? KOMODITAS_LABEL[r.komoditas.nama] : '—'
            return (
              <Link key={r.id_rencana} href={`/operasional/${r.id_rencana}`}
                className="cycle-card card card-hover block p-5"
                style={{ textDecoration: 'none' }}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {r.kolam?.nama_kolam ?? '—'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{komoditas}</div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
                    Aktif
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3" style={{ background: 'var(--color-surface-muted)' }}>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Mulai Tebar</div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {formatTanggal(r.tanggal_rencana)}
                    </div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'var(--color-surface-muted)' }}>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Luas Kolam</div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {r.kolam?.luas_ha ?? '—'} ha
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4 gap-1"
                  style={{ color: 'var(--color-ocean-600)' }}>
                  <span className="text-xs font-medium">Buka Logbook</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
