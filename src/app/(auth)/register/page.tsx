'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '@/lib/supabase'

gsap.registerPlugin(useGSAP)

export default function RegisterPage() {
  const formRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useGSAP(() => {
    gsap.from('.form-el', {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.07,
      ease: 'power3.out', delay: 0.1,
    })
  }, { scope: formRef })

  const inputStyle = (field: string) => ({
    background: focusedField === field ? '#f0f9ff' : '#f8fafc',
    border: `1.5px solid ${focusedField === field ? 'var(--color-accent)' : 'var(--color-border)'}`,
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nama.trim())               return setError('Nama lengkap wajib diisi')
    if (password.length < 8)        return setError('Password minimal 8 karakter')
    if (password !== confirm)       return setError('Konfirmasi password tidak cocok')

    setLoading(true)

    // 1. Buat akun di Supabase Auth
    const { data, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama } },
    })

    if (authErr) {
      setLoading(false)
      if (authErr.message.includes('already registered'))
        return setError('Email sudah terdaftar. Silakan login.')
      return setError(authErr.message)
    }

    // 2. Insert ke tabel pengguna (role default: petambak)
    if (data.user) {
      await supabase.from('pengguna').insert({
        id_pengguna: data.user.id,
        nama: nama.trim(),
        email: email.toLowerCase(),
        role: 'petambak',
      } as any)
    }

    setLoading(false)
    setSuccess(true)
  }

  const canSubmit = nama && email && password && confirm && !loading

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8fafc' }}>
        <div ref={formRef} className="w-full max-w-md">
          <div
            className="form-el rounded-2xl p-8 text-center"
            style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}
          >
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(14,165,233,0.1)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Akun berhasil dibuat!
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Cek email <strong>{email}</strong> untuk konfirmasi.
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Setelah konfirmasi, hubungi administrator untuk pengaturan role akun Anda.
            </p>

            <Link
              href="/login"
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all"
              style={{ background: 'var(--color-ocean-900)', color: '#fff' }}
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#f8fafc' }}>
      <div ref={formRef} className="w-full max-w-md">

        {/* Logo */}
        <div className="form-el flex items-center gap-2.5 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base"
            style={{ background: 'var(--color-ocean-900)', color: '#fff' }}
          >
            BH
          </div>
          <div>
            <div className="font-bold text-sm leading-tight" style={{ color: 'var(--color-ocean-900)' }}>Blue Harvest</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Manajemen Tambak</div>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}
        >
          <div className="form-el mb-7">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Buat akun</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Role default: Petambak. Admin dapat mengubah role setelah registrasi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Nama */}
            <div className="form-el flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={e => setNama(e.target.value)}
                onFocus={() => setFocusedField('nama')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nama lengkap Anda"
                autoComplete="name"
                required
                className="w-full px-4 py-3 text-sm outline-none"
                style={inputStyle('nama')}
              />
            </div>

            {/* Email */}
            <div className="form-el flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 text-sm outline-none pr-12"
                  style={inputStyle('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPass ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Konfirmasi */}
            <div className="form-el flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Konfirmasi Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                placeholder="Ulangi password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 text-sm outline-none"
                style={{
                  ...inputStyle('confirm'),
                  border: confirm && confirm !== password
                    ? '1.5px solid var(--color-risk-worst)'
                    : inputStyle('confirm').border,
                }}
              />
              {confirm && confirm !== password && (
                <span className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>Password tidak cocok</span>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="form-el flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--color-risk-worst-bg)', color: 'var(--color-risk-worst)', border: '1px solid #fca5a5' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="form-el w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{
                background: 'var(--color-ocean-900)',
                color: '#fff',
                boxShadow: canSubmit ? '0 4px 14px rgba(11,45,78,0.35)' : 'none',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Membuat akun...
                </span>
              ) : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="form-el text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
