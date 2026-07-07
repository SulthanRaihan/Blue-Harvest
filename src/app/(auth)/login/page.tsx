'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '@/lib/supabase'
import { LoginSkeleton } from '@/components/ui/Skeleton'
import { BubbleBackground } from '@/components/ui/BubbleBackground'

gsap.registerPlugin(useGSAP)

// ── Wave SVG ──────────────────────────────────────────────────
function WaveLayer({ className, d, duration, delay }: { className: string; d: string; duration: number; delay: number }) {
  const ref = useRef<SVGPathElement>(null)
  useGSAP(() => {
    gsap.to(ref.current, {
      attr: { d: d.replace('M0,60', 'M0,80').replace('1440,80', '1440,60') },
      duration,
      delay,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }, { scope: ref })
  return <path ref={ref} d={d} className={className} />
}

// ── Left Brand Panel ──────────────────────────────────────────
function BrandPanel() {
  const panelRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 })
    tl.from('.brand-logo', { y: -20, opacity: 0, duration: 0.7, ease: 'power3.out' })
      .from('.brand-tagline', { y: 15, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .from('.brand-badge', { y: 10, opacity: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out' }, '-=0.3')
      .from('.brand-stat', { scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }, '-=0.2')
  }, { scope: panelRef })

  return (
    <div
      ref={panelRef}
      className="hidden lg:flex flex-col justify-between relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, var(--color-ocean-950) 0%, var(--color-ocean-900) 50%, var(--color-ocean-800) 100%)' }}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--color-sky-500) 0%, transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-1/2 -right-24 w-72 h-72 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, var(--color-teal-500) 0%, transparent 70%)',
            animation: 'pulse 10s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-48 h-48 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--color-sky-400) 0%, transparent 70%)',
            animation: 'pulse 12s ease-in-out infinite 4s',
          }}
        />
      </div>

      <BubbleBackground />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(var(--color-sky-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-sky-400) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
        {/* Logo */}
        <div className="brand-logo flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xl"
            style={{ background: 'var(--color-sky-500)', color: '#fff', boxShadow: '0 0 20px rgba(14,165,233,0.5)' }}
          >
            BH
          </div>
          <div>
            <div className="font-bold text-lg leading-tight" style={{ color: '#fff' }}>Blue Harvest</div>
            <div className="text-xs" style={{ color: 'var(--color-ocean-200)' }}>Manajemen Tambak</div>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm">
          <div className="brand-tagline mb-8">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4" style={{ color: '#fff' }}>
              Tambak lebih{' '}
              <span style={{ color: 'var(--color-sky-400)' }}>cerdas</span>,<br />
              hasil lebih{' '}
              <span style={{ color: 'var(--color-teal-400)' }}>pasti</span>.
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'var(--color-ocean-200)' }}>
              Kelola seluruh siklus budidaya bandeng, nila, dan udang vaname dalam satu platform terintegrasi.
            </p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-col gap-3 mb-10">
            {[
              { icon: '📊', text: 'Skoring Risiko Rule-Based' },
              { icon: '📋', text: 'Log Operasional Harian' },
              { icon: '📈', text: 'Laporan & Evaluasi Otomatis' },
            ].map((item) => (
              <div
                key={item.text}
                className="brand-badge flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-ocean-100)' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: '3', label: 'Komoditas' },
              { val: '7', label: 'Modul' },
              { val: '13', label: 'Entitas DB' },
            ].map((s) => (
              <div key={s.label} className="brand-stat text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--color-sky-400)' }}>{s.val}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-ocean-300)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave SVG */}
        <div className="absolute bottom-0 left-0 right-0 opacity-20">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
              fill="var(--color-sky-500)"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Login Form ────────────────────────────────────────────────
function LoginForm() {
  const formRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Entrance animation
  useGSAP(() => {
    gsap.from('.form-el', {
      y: 24,
      opacity: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power3.out',
      delay: 0.1,
    })
  }, { scope: formRef })

  // Shake on error
  const shakeForm = useCallback(() => {
    gsap.fromTo(
      formRef.current,
      { x: -8 },
      { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' }
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setLoading(false)
      const msg = authError.message.includes('Invalid login credentials')
        ? 'Email atau password salah. Periksa kembali.'
        : authError.message
      setError(msg)
      shakeForm()
    } else {
      router.push('/dashboard')
    }
  }

  const inputStyle = (field: string) => ({
    background: focusedField === field ? '#f0f9ff' : '#f8fafc',
    border: `1.5px solid ${focusedField === field ? 'var(--color-accent)' : 'var(--color-border)'}`,
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
  })

  return (
    <div
      ref={formRef}
      className="flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12"
      style={{ background: '#fff' }}
    >
      {/* Mobile logo */}
      <div className="form-el flex items-center gap-2.5 mb-10 lg:hidden">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
          style={{ background: 'var(--color-ocean-900)', color: '#fff' }}
        >
          BH
        </div>
        <span className="font-bold text-base" style={{ color: 'var(--color-ocean-900)' }}>Blue Harvest</span>
      </div>

      {/* Header */}
      <div className="form-el mb-8">
        <h2 className="text-2xl xl:text-3xl font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
          Selamat datang
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Masuk untuk mengelola tambak Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Email */}
        <div className="form-el flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="nama@email.com"
            autoComplete="email"
            required
            className="w-full px-4 py-3 text-sm outline-none"
            style={inputStyle('email')}
          />
        </div>

        {/* Password */}
        <div className="form-el flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 text-sm outline-none pr-12"
              style={inputStyle('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember & forgot */}
        <div className="form-el flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" />
              <div
                className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all peer-checked:bg-accent peer-checked:border-accent"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </div>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ingat saya</span>
          </label>
          <button
            type="button"
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: 'var(--color-accent)' }}
          >
            Lupa password?
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="form-el flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'var(--color-risk-worst-bg)', color: 'var(--color-risk-worst)', border: '1px solid #fca5a5' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="form-el relative w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer"
          style={{
            background: '#0b2d4e',
            color: '#fff',
            opacity: loading || !email || !password ? 0.5 : 1,
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            boxShadow: !loading && email && password ? '0 4px 14px rgba(11,45,78,0.4)' : 'none',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2.5">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              <span>Masuk...</span>
            </div>
          ) : (
            'Masuk ke Dashboard'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="form-el text-center text-xs mt-8" style={{ color: 'var(--color-text-muted)' }}>
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
          Daftar sekarang
        </Link>
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">
      <BrandPanel />
      <LoginForm />
    </div>
  )
}
