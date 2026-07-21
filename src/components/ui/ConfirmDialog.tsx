'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((v: boolean) => void) | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    setState(options)
    return new Promise<boolean>(resolve => { resolverRef.current = resolve })
  }, [])

  const close = useCallback((result: boolean) => {
    // Resolve + unmount langsung supaya tidak pernah tergantung pada
    // callback animasi yang bisa gagal jalan. Exit animation cuma
    // jalan kalau elemen masih ada, murni dekorasi non-blocking.
    const panel = panelRef.current
    if (panel) gsap.to(panel, { y: 8, scale: 0.98, autoAlpha: 0, duration: 0.15, ease: 'power2.in' })
    resolverRef.current?.(result)
    resolverRef.current = null
    setState(null)
  }, [])

  useEffect(() => {
    if (!state) return
    const backdrop = backdropRef.current
    const panel = panelRef.current
    if (backdrop) gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
    if (panel) gsap.fromTo(panel, { y: 16, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.32, ease: 'back.out(1.5)' })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: 'rgba(2,13,26,0.55)', backdropFilter: 'blur(4px)', opacity: 0 }}
          onClick={e => { if (e.target === backdropRef.current) close(false) }}
        >
          <div
            ref={panelRef}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--color-surface-card)', boxShadow: 'var(--shadow-dropdown)', opacity: 0 }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
              style={{
                background: state.danger ? 'var(--color-risk-worst-bg)' : 'var(--color-ocean-50)',
                color: state.danger ? 'var(--color-risk-worst)' : 'var(--color-ocean-600)',
              }}
            >
              {state.danger ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <h2 className="text-base font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{state.title}</h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)' }}>{state.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
              >
                {state.cancelLabel ?? 'Batal'}
              </button>
              <button
                onClick={() => close(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: state.danger ? 'var(--color-risk-worst)' : 'var(--color-ocean-900)',
                  color: '#fff',
                  boxShadow: state.danger ? '0 2px 8px rgba(220,38,38,0.3)' : '0 2px 8px rgba(11,45,78,0.3)',
                }}
              >
                {state.confirmLabel ?? 'Ya, lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
