'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
  duration: number
}

interface ToastApi {
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider')
  return ctx
}

const VARIANT_STYLE: Record<ToastVariant, { accent: string; bg: string; icon: React.ReactNode }> = {
  success: {
    accent: 'var(--color-risk-best)',
    bg: 'var(--color-risk-best-bg)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    accent: 'var(--color-risk-worst)',
    bg: 'var(--color-risk-worst-bg)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  info: {
    accent: 'var(--color-ocean-600)',
    bg: 'var(--color-ocean-50)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
}

function ToastCard({ toast, onDone }: { toast: ToastItem; onDone: (id: number) => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const style = VARIANT_STYLE[toast.variant]

  const dismiss = useCallback(() => {
    const el = cardRef.current
    if (el) gsap.to(el, { x: 32, autoAlpha: 0, duration: 0.28, ease: 'power2.in' })
    // Hapus lewat timer, bukan onComplete animasi, supaya tetap hilang
    // walau ticker GSAP ter-throttle (tab background dsb).
    window.setTimeout(() => onDone(toast.id), el ? 260 : 0)
  }, [toast.id, onDone])

  useEffect(() => {
    const el = cardRef.current
    const bar = barRef.current
    if (!el) return

    const tl = gsap.timeline()
    tl.fromTo(el,
      { x: 40, autoAlpha: 0, scale: 0.94 },
      { x: 0, autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }
    )
    if (el.querySelector('.toast-icon')) {
      tl.fromTo(el.querySelector('.toast-icon'),
        { scale: 0 },
        { scale: 1, duration: 0.35, ease: 'back.out(2.4)' }, '-=0.25'
      )
    }
    if (bar) {
      gsap.fromTo(bar, { scaleX: 1 }, { scaleX: 0, duration: toast.duration / 1000, ease: 'none' })
    }

    const timer = window.setTimeout(dismiss, toast.duration)
    return () => window.clearTimeout(timer)
  }, [toast.duration, dismiss])

  return (
    <div
      ref={cardRef}
      role="status"
      className="pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-2xl px-4 py-3.5 mb-3"
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-dropdown)',
        minWidth: 280, maxWidth: 380,
      }}
    >
      <div
        className="toast-icon w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: style.bg, color: style.accent }}
      >
        {style.icon}
      </div>
      <p className="flex-1 text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>
        {toast.message}
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        aria-label="Tutup notifikasi"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div
        ref={barRef}
        className="absolute bottom-0 left-0 h-0.5 w-full origin-left"
        style={{ background: style.accent }}
      />
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const push = useCallback((variant: ToastVariant, message: string, duration = 3500) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, variant, message, duration }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const api: ToastApi = {
    success: (m, d) => push('success', m, d),
    error: (m, d) => push('error', m, d),
    info: (m, d) => push('info', m, d),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto flex flex-col items-end pointer-events-none">
        {toasts.map(t => <ToastCard key={t.id} toast={t} onDone={remove} />)}
      </div>
    </ToastContext.Provider>
  )
}
