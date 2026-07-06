'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { IconX } from '@/components/ui/Icon'

gsap.registerPlugin(useGSAP)

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!backdropRef.current || !panelRef.current) return
    if (open) {
      gsap.fromTo(backdropRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.2, ease: 'none' }
      )
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: 16, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
      )
    } else {
      gsap.to(panelRef.current, { autoAlpha: 0, y: 8, scale: 0.98, duration: 0.18, ease: 'power2.in' })
      gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.2, ease: 'none' })
    }
  }, { dependencies: [open] })

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,13,26,0.55)', backdropFilter: 'blur(4px)', visibility: open ? 'visible' : 'hidden', opacity: 0 }}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div
        ref={panelRef}
        className={`w-full ${SIZE[size]} bg-white rounded-2xl shadow-2xl flex flex-col`}
        style={{ opacity: 0, maxHeight: 'calc(100vh - 2rem)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
            {description && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors ml-4 shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <IconX size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ── Reusable form field ───────────────────────────────────────
interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{error}</p>}
    </div>
  )
}

// ── Input & Select ────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all ${className}`}
      style={{
        border: `1.5px solid ${error ? 'var(--color-risk-worst)' : 'var(--color-border)'}`,
        background: 'var(--color-surface-muted)',
        color: 'var(--color-text-primary)',
      }}
      onFocus={e => !error && (e.currentTarget.style.borderColor = 'var(--color-accent)')}
      onBlur={e => !error && (e.currentTarget.style.borderColor = 'var(--color-border)')}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export function Select({ error, className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all cursor-pointer ${className}`}
      style={{
        border: `1.5px solid ${error ? 'var(--color-risk-worst)' : 'var(--color-border)'}`,
        background: 'var(--color-surface-muted)',
        color: 'var(--color-text-primary)',
      }}
      onFocus={e => !error && (e.currentTarget.style.borderColor = 'var(--color-accent)')}
      onBlur={e => !error && (e.currentTarget.style.borderColor = 'var(--color-border)')}
      {...props}
    >
      {children}
    </select>
  )
}

// ── Action buttons ────────────────────────────────────────────
interface ModalActionsProps {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  loading?: boolean
  danger?: boolean
}

export function ModalActions({ onCancel, onConfirm, confirmLabel = 'Simpan', loading, danger }: ModalActionsProps) {
  return (
    <div className="flex justify-end gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        style={{
          background: danger ? 'var(--color-risk-worst)' : 'var(--color-ocean-900)',
          color: '#fff',
          boxShadow: danger ? 'none' : '0 2px 8px rgba(11,45,78,0.3)',
        }}
      >
        {loading ? 'Menyimpan...' : confirmLabel}
      </button>
    </div>
  )
}
