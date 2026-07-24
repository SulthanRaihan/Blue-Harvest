'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { usePengguna } from '@/hooks/usePengguna'
import { useKolam } from '@/hooks/useKolam'
import { useAuth } from '@/hooks/useAuth'
import { Modal, Field, Input, Select, ModalActions } from '@/components/ui/Modal'
import { RoleBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import type { UserRole } from '@/types/database'

gsap.registerPlugin(useGSAP)

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-ocean-50)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-.94 20.14 20.14 0 0014 0A1 1 0 0120 6v7z" />
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  )
}

// ── Search box ────────────────────────────────────────────────
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-0 max-w-xs">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg outline-none transition-all"
        style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface-card)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-muted)' }}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center"
          style={{ color: 'var(--color-text-muted)' }} aria-label="Hapus pencarian">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  )
}

// ── Meta row untuk kartu kolam ────────────────────────────────
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="font-medium truncate text-right" style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
    </div>
  )
}

// ── Skeleton rows ─────────────────────────────────────────────
function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton width={36} height={36} rounded="rounded-full" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton height={13} width={140} />
            <Skeleton height={11} width={200} rounded="rounded" />
          </div>
          <Skeleton height={22} width={70} rounded="rounded-full" />
          <Skeleton height={28} width={80} rounded="rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: PENGGUNA
// ════════════════════════════════════════════════════════════
function TabPengguna() {
  const { pengguna, loading, error, refresh, updateRole } = usePengguna()
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [addOpen, setAddOpen]       = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [editRole, setEditRole]     = useState<UserRole>('petambak')
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)
  const [query, setQuery]           = useState('')

  // Add user form state
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'petambak' as UserRole })

  const filtered = pengguna.filter(p =>
    `${p.nama} ${p.email}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  const handleAddUser = async () => {
    if (!form.nama || !form.email || !form.password) {
      setFormError('Semua field wajib diisi')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setAddOpen(false)
      setForm({ nama: '', email: '', password: '', role: 'petambak' })
      await refresh()
      toast.success(`Akun ${form.nama} berhasil dibuat`)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal membuat pengguna')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRole = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      await updateRole(editTarget, editRole)
      setEditTarget(null)
      toast.success('Role pengguna diperbarui')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memperbarui role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3 flex-1">
          <SearchBox value={query} onChange={setQuery} placeholder="Cari nama atau email..." />
          <p className="text-sm shrink-0 hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? '...' : `${filtered.length} pengguna`}
          </p>
        </div>
        <button
          onClick={() => { setFormError(null); setAddOpen(true) }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0"
          style={{ background: 'var(--color-notion-500)', color: '#fff', boxShadow: '0 2px 8px rgba(11,45,78,0.25)' }}
        >
          <span className="text-base leading-none">+</span> Tambah Pengguna
        </button>
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--color-risk-worst)' }}>{error}</div>
      ) : pengguna.length === 0 ? (
        <EmptyState label="Belum ada pengguna terdaftar" />
      ) : filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Tidak ada pengguna yang cocok dengan &quot;{query}&quot;.</div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {filtered.map(p => {
            const initials = p.nama.slice(0, 2).toUpperCase()
            const isSelf = p.id_pengguna === currentUser?.id
            return (
              <div key={p.id_pengguna} className="flex items-center gap-4 px-5 py-3.5 transition-colors" style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--color-ocean-100)', color: 'var(--color-ocean-800)' }}>
                  {initials}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{p.nama}</span>
                    {isSelf && <span className="text-xs px-1.5 py-px rounded-full" style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-600)' }}>Anda</span>}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.email}</span>
                </div>
                {/* Role badge */}
                <RoleBadge role={p.role} />
                {/* Edit button */}
                {!isSelf && (
                  <button
                    onClick={() => { setEditTarget(p.id_pengguna); setEditRole(p.role) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Edit Role
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Tambah Pengguna */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Pengguna Baru"
        description="User akan langsung aktif tanpa perlu verifikasi email.">
        <div className="flex flex-col gap-4">
          <Field label="Nama Lengkap" required>
            <Input placeholder="Ahmad Santoso" value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
          </Field>
          <Field label="Email" required>
            <Input type="email" placeholder="ahmad@email.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Password Awal" required>
            <Input type="password" placeholder="Min. 6 karakter" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
              <option value="petambak">Petambak / Operator</option>
              <option value="admin">Admin</option>
              <option value="owner">Manajemen / Owner</option>
            </Select>
          </Field>
          {formError && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formError}</p>}
          <ModalActions onCancel={() => setAddOpen(false)} onConfirm={handleAddUser}
            confirmLabel="Buat Pengguna" loading={saving} />
        </div>
      </Modal>

      {/* Modal: Edit Role */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Ubah Role Pengguna" size="sm">
        <div className="flex flex-col gap-4">
          <Field label="Role Baru">
            <Select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
              <option value="petambak">Petambak / Operator</option>
              <option value="admin">Admin</option>
              <option value="owner">Manajemen / Owner</option>
            </Select>
          </Field>
          <ModalActions onCancel={() => setEditTarget(null)} onConfirm={handleSaveRole}
            confirmLabel="Simpan Role" loading={saving} />
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: KOLAM
// ════════════════════════════════════════════════════════════
function TabKolam() {
  const { kolam, loading, error, create, update, toggleStatus } = useKolam()
  const { pengguna } = usePengguna()
  const { user, role } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const [addOpen, setAddOpen]       = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [query, setQuery]           = useState('')
  const emptyForm = { nama_kolam: '', luas_ha: '', lokasi: '', id_pengguna: '' }
  const [form, setForm]             = useState(emptyForm)

  const filtered = kolam.filter(k =>
    `${k.nama_kolam} ${k.lokasi ?? ''} ${k.pengguna?.nama ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  const handleToggle = async (id: string, status: typeof kolam[0]['status'], nama: string) => {
    setToggleError(null)
    if (status === 'aktif') {
      const ok = await confirm({
        title: 'Nonaktifkan kolam ini?',
        message: `Kolam ${nama} tidak akan muncul sebagai pilihan saat membuat rencana tebar baru. Kolam bisa diaktifkan lagi kapan saja.`,
        confirmLabel: 'Nonaktifkan',
      })
      if (!ok) return
    }
    try {
      await toggleStatus(id, status)
      toast.success(status === 'aktif' ? `Kolam ${nama} dinonaktifkan` : `Kolam ${nama} diaktifkan`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mengubah status kolam'
      setToggleError(msg)
      toast.error(msg)
    }
  }

  const openAdd = () => {
    setForm({ ...emptyForm, id_pengguna: user?.id ?? '' })
    setFormError(null)
    setAddOpen(true)
  }

  const openEdit = (k: typeof kolam[0]) => {
    setForm({ nama_kolam: k.nama_kolam, luas_ha: String(k.luas_ha), lokasi: k.lokasi ?? '', id_pengguna: k.id_pengguna })
    setFormError(null)
    setEditTarget(k.id_kolam)
  }

  const validate = () => {
    if (!form.nama_kolam) return 'Nama kolam wajib diisi'
    if (!form.luas_ha || isNaN(Number(form.luas_ha)) || Number(form.luas_ha) <= 0) return 'Luas harus angka positif'
    if (!form.id_pengguna) return 'Pilih pemilik kolam'
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError(null)
    try {
      const payload = { nama_kolam: form.nama_kolam, luas_ha: Number(form.luas_ha), lokasi: form.lokasi, id_pengguna: form.id_pengguna, status: 'aktif' as const }
      if (editTarget) {
        await update(editTarget, payload)
        setEditTarget(null)
        toast.success('Data kolam diperbarui')
      } else {
        await create(payload)
        setAddOpen(false)
        toast.success('Kolam baru ditambahkan')
      }
      setForm(emptyForm)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const penggunaOptions = pengguna.filter(p => p.role === 'petambak')

  return (
    <>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3 flex-1">
          <SearchBox value={query} onChange={setQuery} placeholder="Cari kolam, lokasi, petambak..." />
          <p className="text-sm shrink-0 hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? '...' : `${filtered.length} kolam`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0"
          style={{ background: 'var(--color-notion-500)', color: '#fff', boxShadow: '0 2px 8px rgba(11,45,78,0.25)' }}
        >
          <span className="text-base leading-none">+</span> Tambah Kolam
        </button>
      </div>

      {toggleError && (
        <div className="px-5 py-3 text-sm" style={{ background: 'var(--color-risk-worst-bg)', color: 'var(--color-risk-worst)' }}>
          {toggleError}
        </div>
      )}

      {/* List */}
      {loading ? (
        <TableSkeleton rows={3} />
      ) : error ? (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--color-risk-worst)' }}>{error}</div>
      ) : kolam.length === 0 ? (
        <EmptyState label="Belum ada kolam terdaftar" />
      ) : filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Tidak ada kolam yang cocok dengan &quot;{query}&quot;.</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {filtered.map(k => {
            const aktif = k.status === 'aktif'
            return (
              <div key={k.id_kolam} className="kolam-card card card-hover overflow-hidden flex flex-col">
                {/* Header dengan aksen air */}
                <div className="relative px-4 pt-4 pb-3" style={{ background: aktif ? 'linear-gradient(135deg, var(--color-ocean-800), var(--color-ocean-600))' : 'var(--color-surface-muted)' }}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: aktif ? 'rgba(255,255,255,0.15)' : 'var(--color-ocean-50)', color: aktif ? '#fff' : 'var(--color-ocean-600)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: aktif ? 'rgba(255,255,255,0.18)' : 'var(--color-border)',
                        color: aktif ? '#fff' : 'var(--color-text-muted)',
                      }}>
                      {aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="mt-2.5 text-base font-bold truncate" style={{ color: aktif ? '#fff' : 'var(--color-text-primary)' }}>
                    {k.nama_kolam}
                  </div>
                </div>

                {/* Meta */}
                <div className="px-4 py-3 flex flex-col gap-1.5 flex-1">
                  <MetaRow label="Luas" value={`${k.luas_ha} ha`} />
                  {k.lokasi && <MetaRow label="Lokasi" value={k.lokasi} />}
                  {k.pengguna && <MetaRow label="Petambak" value={k.pengguna.nama} />}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <Link href={`/kolam/${k.id_kolam}`}
                    className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: 'var(--color-notion-50)', color: 'var(--color-notion-600)', textDecoration: 'none' }}
                  >Detail</Link>
                  <button onClick={() => openEdit(k)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >Edit</button>
                  <button
                    onClick={() => handleToggle(k.id_kolam, k.status, k.nama_kolam)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      color: aktif ? 'var(--color-risk-worst)' : 'var(--color-risk-best)',
                      background: aktif ? 'var(--color-risk-worst-bg)' : 'var(--color-risk-best-bg)',
                    }}
                  >
                    {aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal form (Add / Edit) */}
      <Modal
        open={addOpen || !!editTarget}
        onClose={() => { setAddOpen(false); setEditTarget(null) }}
        title={editTarget ? 'Edit Kolam' : 'Tambah Kolam Baru'}
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama Kolam" required>
            <Input placeholder="Kolam A1" value={form.nama_kolam}
              onChange={e => setForm(f => ({ ...f, nama_kolam: e.target.value }))} />
          </Field>
          <Field label="Luas (hektar)" required>
            <Input type="number" step="0.01" min="0.01" placeholder="0.50"
              value={form.luas_ha} onChange={e => setForm(f => ({ ...f, luas_ha: e.target.value }))} />
          </Field>
          <Field label="Lokasi / Koordinat">
            <Input placeholder="Desa Sidoarjo, Jawa Timur" value={form.lokasi}
              onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))} />
          </Field>
          <Field label="Pemilik (Petambak)" required>
            <Select value={form.id_pengguna} onChange={e => setForm(f => ({ ...f, id_pengguna: e.target.value }))}>
              <option value="">-- Pilih petambak --</option>
              {penggunaOptions.map(p => (
                <option key={p.id_pengguna} value={p.id_pengguna}>{p.nama}</option>
              ))}
            </Select>
          </Field>
          {formError && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formError}</p>}
          <ModalActions
            onCancel={() => { setAddOpen(false); setEditTarget(null) }}
            onConfirm={handleSave}
            confirmLabel={editTarget ? 'Simpan Perubahan' : 'Tambah Kolam'}
            loading={saving}
          />
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════
type Tab = 'pengguna' | 'kolam'

export default function PenggunaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pengguna')
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from('.page-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.page-card', { y: 16, opacity: 0, duration: 0.45, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' })
  }, { scope: pageRef })

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header mb-6">
        <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Manajemen Pengguna
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Kelola akun pengguna, role, dan data kolam tambak
        </p>
      </div>

      {/* Card with tabs */}
      <div className="page-card card overflow-hidden">
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {([
            { key: 'pengguna', label: 'Pengguna' },
            { key: 'kolam',    label: 'Kolam' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-6 py-3.5 text-sm font-semibold transition-all relative"
              style={{
                color: activeTab === t.key ? 'var(--color-ocean-900)' : 'var(--color-text-muted)',
                background: 'transparent',
                borderBottom: activeTab === t.key ? '2px solid var(--color-ocean-900)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'pengguna' ? <TabPengguna /> : <TabKolam />}
      </div>

      {/* Note: service role key */}
      <p className="text-xs mt-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
        Tambah pengguna membutuhkan <code className="px-1 py-px rounded" style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>SUPABASE_SERVICE_ROLE_KEY</code> di .env.local
      </p>
    </div>
  )
}
