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
  bandeng: 'Ikan Bandeng', nila: 'Ikan Nila', udang_vaname: 'Udang Vaname',
}

export default function SamplingPage() {
  const { rencana, loading } = useRencana()
  const pageRef = useRef<HTMLDivElement>(null)
  const aktif = rencana.filter(r => r.status === 'aktif')

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.cycle-card', { y: 16, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [loading] })

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Sampling Pertumbuhan
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Pantau bobot, populasi, dan FCR mingguan setiap siklus aktif
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} height={110} rounded="rounded-2xl" />)}
        </div>
      ) : aktif.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Tidak ada siklus aktif</p>
          <Link href="/perencanaan"
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
            Ke Perencanaan
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {aktif.map(r => {
            const kmd = r.komoditas?.nama ? KOMODITAS_LABEL[r.komoditas.nama] : '—'
            return (
              <Link key={r.id_rencana} href={`/sampling/${r.id_rencana}`}
                className="cycle-card card card-hover block p-5" style={{ textDecoration: 'none' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {r.kolam?.nama_kolam ?? '—'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{kmd}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <span>{r.jumlah_benih.toLocaleString('id-ID')} ekor awal</span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-teal-600)' }}>
                    Buka Tracking
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
