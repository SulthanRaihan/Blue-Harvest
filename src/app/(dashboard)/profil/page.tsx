'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Field, Input } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { IconChevronRight } from '@/components/ui/Icon'
import type { UserRole } from '@/types/database'

gsap.registerPlugin(useGSAP)

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; desc: string }> = {
  petambak: { label: 'Petambak / Operator', color: 'var(--color-role-petambak)', bg: 'var(--color-role-petambak-bg)', desc: 'Menjalankan budidaya harian di lapangan' },
  admin:    { label: 'Admin',               color: 'var(--color-role-admin)',    bg: 'var(--color-role-admin-bg)',    desc: 'Mengelola data master dan pengguna' },
  owner:    { label: 'Manajemen / Owner',   color: 'var(--color-role-owner)',    bg: 'var(--color-role-owner-bg)',    desc: 'Menyetujui rencana dan mengevaluasi kinerja' },
}

export default function ProfilPage() {
  const { user, role, nama, loading } = useAuth()
  const toast = useToast()
  const pageRef = useRef<HTMLDivElement>(null)

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)

  useGSAP(() => {
    if (loading) return
    gsap.from('.profil-block', { y: 16, opacity: 0, stagger: 0.1, duration: 0.45, ease: 'power2.out', clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [loading] })

  const initials = (nama ?? user?.email ?? 'BH').slice(0, 2).toUpperCase()
  const meta = role ? ROLE_META[role] : null

  const handleChangePassword = async () => {
    if (newPass.length < 8) return setPassError('Password baru minimal 8 karakter')
    if (newPass !== confirmPass) return setPassError('Konfirmasi password tidak cocok')
    setSaving(true)
    setPassError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) throw error
      setNewPass('')
      setConfirmPass('')
      toast.success('Password berhasil diperbarui')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memperbarui password'
      setPassError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton height={28} width={160} />
        <Skeleton height={150} rounded="rounded-2xl" />
        <Skeleton height={220} rounded="rounded-2xl" />
      </div>
    )
  }

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <div className="profil-block mb-6">
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-3"
          style={{ color: 'var(--color-text-muted)' }}>
          <IconChevronRight size={14} className="rotate-180" />
          Kembali ke Dashboard
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Profil Saya</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Kelola informasi akun dan keamanan Anda</p>
      </div>

      {/* Identity card */}
      <div className="profil-block card overflow-hidden mb-5">
        <div className="relative px-6 pt-6 pb-6" style={{ background: 'linear-gradient(135deg, var(--color-ocean-950), var(--color-ocean-800))' }}>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold truncate" style={{ color: '#fff' }}>{nama ?? 'Pengguna'}</div>
              <div className="text-sm truncate" style={{ color: 'var(--color-ocean-200)' }}>{user?.email}</div>
            </div>
          </div>
        </div>
        {meta && (
          <div className="px-6 py-4 flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{meta.desc}</span>
          </div>
        )}
      </div>

      {/* Account details */}
      <div className="profil-block card p-6 mb-5">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Detail Akun</h2>
        <div className="flex flex-col gap-3">
          <DetailRow label="Nama" value={nama ?? '-'} />
          <DetailRow label="Email" value={user?.email ?? '-'} />
          <DetailRow label="Peran" value={meta?.label ?? '-'} />
        </div>
        <p className="text-xs mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          Nama dan peran hanya bisa diubah oleh Admin lewat menu Pengguna.
        </p>
      </div>

      {/* Change password */}
      <div className="profil-block card p-6">
        <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Ubah Password</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Gunakan minimal 8 karakter. Anda akan tetap masuk setelah mengganti password.</p>
        <div className="flex flex-col gap-4">
          <Field label="Password Baru" required>
            <Input type="password" placeholder="Minimal 8 karakter" value={newPass}
              onChange={e => setNewPass(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Konfirmasi Password Baru" required>
            <Input type="password" placeholder="Ketik ulang password baru" value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)} autoComplete="new-password" />
          </Field>
          {passError && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{passError}</p>}
          <button
            onClick={handleChangePassword}
            disabled={saving || !newPass || !confirmPass}
            className="self-start px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'var(--color-ocean-900)', color: '#fff', boxShadow: '0 2px 8px rgba(11,45,78,0.25)' }}
          >
            {saving ? 'Menyimpan...' : 'Perbarui Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}
