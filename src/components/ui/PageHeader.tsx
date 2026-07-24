import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Slot aksi di kanan (tombol, dsb). Kalau ada, header jadi layout flex. */
  actions?: ReactNode
  /** Override margin/spacing luar. Default `mb-6`. */
  className?: string
}

// Header halaman terpusat. Semua halaman dashboard memakai ini supaya
// tipografi judul, subjudul, dan jarak konsisten — satu tempat untuk
// diubah. Class `page-header` dipertahankan sebagai target animasi GSAP
// yang sudah dipakai di tiap halaman.
export function PageHeader({ title, subtitle, actions, className = 'mb-6' }: PageHeaderProps) {
  const heading = (
    <div>
      <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )

  if (actions) {
    return (
      <div className={`page-header flex items-start justify-between gap-4 ${className}`}>
        {heading}
        <div className="shrink-0">{actions}</div>
      </div>
    )
  }

  return <div className={`page-header ${className}`}>{heading}</div>
}
