'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { IconChevronRight } from '@/components/ui/Icon'

// Layar kosong adalah ajakan bertindak, bukan pemberitahuan bahwa tidak
// ada apa-apa. Tiap empty state menyebut langkah berikutnya yang jelas.
interface EmptyStateProps {
  judul: string
  deskripsi: string
  aksi?: { href: string; label: string }
  icon?: React.ReactNode
  compact?: boolean
}

export function EmptyState({ judul, deskripsi, aksi, icon, compact }: EmptyStateProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    gsap.fromTo(el.querySelectorAll('.empty-item'),
      { y: 10, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out', clearProps: 'transform,opacity' }
    )
    // Riak air pelan di lingkaran ikon, mengikat ke tema tambak
    const ripple = el.querySelector('.empty-ripple')
    if (ripple) {
      gsap.to(ripple, { scale: 1.35, opacity: 0, duration: 2.4, repeat: -1, ease: 'sine.out' })
    }
  }, [])

  return (
    <div ref={ref} className={`card flex flex-col items-center text-center ${compact ? 'py-8 px-5' : 'py-14 px-6'}`}>
      <div className="empty-item relative mb-4">
        <span
          className="empty-ripple absolute inset-0 rounded-2xl"
          style={{ background: 'var(--color-ocean-100)', opacity: 0.6 }}
        />
        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-500)' }}
        >
          {icon ?? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
              <path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
              <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
            </svg>
          )}
        </div>
      </div>
      <p className="empty-item text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{judul}</p>
      <p className="empty-item text-xs leading-relaxed max-w-xs" style={{ color: 'var(--color-text-muted)' }}>{deskripsi}</p>
      {aksi && (
        <Link
          href={aksi.href}
          className="empty-item inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--color-ocean-900)', color: '#fff', boxShadow: '0 2px 8px rgba(11,45,78,0.25)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,45,78,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(11,45,78,0.25)' }}
        >
          {aksi.label}
          <IconChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}
