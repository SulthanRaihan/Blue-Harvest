'use client'

import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const SIZE: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-lg',
}

// Gaya tombol terpusat supaya konsisten di seluruh aplikasi. Warna
// mengikuti token Notion+ocean, hover halus, tanpa efek berlebihan.
function baseStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: 'var(--color-notion-500)', color: '#fff', border: '1px solid transparent', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }
    case 'secondary':
      return { background: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
    case 'danger':
      return { background: 'var(--color-risk-worst)', color: '#fff', border: '1px solid transparent', boxShadow: '0 1px 2px rgba(220,38,38,0.15)' }
    case 'ghost':
      return { background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid transparent' }
  }
}

function hoverBg(variant: Variant): string {
  switch (variant) {
    case 'primary': return 'var(--color-notion-600)'
    case 'secondary': return 'var(--color-surface-muted)'
    case 'danger': return '#b91c1c'
    case 'ghost': return 'var(--color-surface-muted)'
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className = '', disabled, ...props },
  ref,
) {
  const style = baseStyle(variant)
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${SIZE[size]} ${className}`}
      style={style}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.background = hoverBg(variant) }}
      onMouseLeave={e => { e.currentTarget.style.background = style.background as string }}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})
