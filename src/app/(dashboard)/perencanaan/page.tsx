'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencana } from '@/hooks/useRencana'
import { useKolam } from '@/hooks/useKolam'
import { useKomoditas, KOMODITAS_LABEL as KMD_LABEL } from '@/hooks/useKomoditas'
import { useAuth } from '@/hooks/useAuth'
import { Modal, Field, Input, Select, ModalActions } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { StatusRencana } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL = KMD_LABEL

const STATUS_ORDER: StatusRencana[] = ['draft', 'approved', 'aktif', 'selesai']

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--color-ocean-50)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-300)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Belum ada rencana tebar</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Buat rencana pertama untuk mulai proses skoring risiko</p>
      </div>
      <button onClick={onAdd}
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
        Buat Rencana Sekarang
      </button>
    </div>
  )
}

// ── Skeleton row ──────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton height={16} width={160} />
          <Skeleton height={12} width={100} />
        </div>
        <Skeleton height={24} width={70} rounded="rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton height={12} width={90} />
        <Skeleton height={12} width={80} />
      </div>
    </div>
  )
}

// ── Rencana card ──────────────────────────────────────────────
function RencanaCard({ r }: { r: ReturnType<typeof useRencana>['rencana'][0] }) {
  const komoditas = r.komoditas?.nama ? KOMODITAS_LABEL[r.komoditas.nama] : '—'
  const progress  = ((STATUS_ORDER.indexOf(r.status) + 1) / STATUS_ORDER.length) * 100

  return (
    <Link href={`/perencanaan/${r.id_rencana}`}
      className="card card-hover block p-5 transition-all"
      style={{ textDecoration: 'none' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {r.kolam?.nama_kolam ?? '—'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {komoditas} · {formatTanggal(r.tanggal_rencana)}
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      {/* Stats row */}
      <div className="flex gap-5 mb-4">
        <div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Modal</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatRupiah(r.modal_rp)}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Jumlah Benih</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {r.jumlah_benih.toLocaleString('id-ID')} ekor
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-ocean-100)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--color-ocean-600)' }} />
        </div>
        <span className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{r.status}</span>
      </div>
    </Link>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════
export default function PerencanaanPage() {
  const { rencana, loading, error, create } = useRencana()
  const { kolam } = useKolam()
  const { komoditas } = useKomoditas()
  const { role } = useAuth()
  const pageRef = useRef<HTMLDivElement>(null)

  const [open, setOpen]       = useState(false)
  const [saving, setSaving]   = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const emptyForm = { id_kolam: '', id_komoditas: '', modal_rp: '', jumlah_benih: '', tanggal_rencana: '' }
  const [form, setForm] = useState(emptyForm)

  // Single-tenant: semua role melihat seluruh kolam yang aktif
  const kolamOptions = kolam.filter(k => k.status === 'aktif')

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.rencana-card', {
      y: 20, opacity: 0, duration: 0.4, stagger: 0.07,
      ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform',
    })
  }, { scope: pageRef, dependencies: [loading] })

  const handleCreate = async () => {
    if (!form.id_kolam)        return setFormError('Pilih kolam')
    if (!form.id_komoditas)    return setFormError('Pilih komoditas')
    if (!form.modal_rp || isNaN(Number(form.modal_rp))) return setFormError('Modal harus angka')
    if (!form.jumlah_benih || isNaN(Number(form.jumlah_benih))) return setFormError('Jumlah benih harus angka')
    if (!form.tanggal_rencana) return setFormError('Tanggal rencana wajib diisi')

    setSaving(true)
    setFormError(null)
    try {
      await create({
        id_kolam:       form.id_kolam,
        id_komoditas:   form.id_komoditas,
        id_approved_by: null,
        modal_rp:       Number(form.modal_rp),
        jumlah_benih:   Number(form.jumlah_benih),
        tanggal_rencana: form.tanggal_rencana,
        status:         'draft',
      })
      setOpen(false)
      setForm(emptyForm)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal membuat rencana')
    } finally {
      setSaving(false)
    }
  }

  // Filter tabs
  const [filter, setFilter] = useState<StatusRencana | 'semua'>('semua')
  const filtered = filter === 'semua' ? rencana : rencana.filter(r => r.status === filter)

  const canCreate = role === 'petambak' || role === 'admin'

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Perencanaan Budidaya
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Buat rencana tebar dan analisis risiko sebelum memulai siklus budidaya
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setFormError(null); setOpen(true) }}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--color-ocean-900)', color: '#fff', boxShadow: '0 2px 10px rgba(11,45,78,0.25)' }}>
            <span className="text-base leading-none">+</span> Buat Rencana
          </button>
        )}
      </div>

      {/* Filter bar */}
      {!loading && rencana.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['semua', ...STATUS_ORDER] as const).map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize"
              style={{
                background: filter === s ? 'var(--color-ocean-900)' : 'var(--color-surface)',
                color:      filter === s ? '#fff' : 'var(--color-text-secondary)',
                border:     `1px solid ${filter === s ? 'transparent' : 'var(--color-border)'}`,
              }}>
              {s === 'semua' ? 'Semua' : s}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card p-5 text-sm" style={{ color: 'var(--color-risk-worst)' }}>{error}</div>
      ) : filtered.length === 0 && rencana.length === 0 ? (
        <div className="card overflow-hidden">
          <EmptyState onAdd={() => { setFormError(null); setOpen(true) }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Tidak ada rencana dengan status "{filter}"
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div key={r.id_rencana} className="rencana-card">
              <RencanaCard r={r} />
            </div>
          ))}
        </div>
      )}

      {/* Modal: Buat Rencana */}
      <Modal open={open} onClose={() => setOpen(false)} title="Buat Rencana Tebar"
        description="Data ini akan dianalisis menggunakan sistem skoring risiko pada langkah berikutnya.">
        <div className="flex flex-col gap-4">
          <Field label="Kolam" required>
            <Select value={form.id_kolam} onChange={e => setForm(f => ({ ...f, id_kolam: e.target.value }))}>
              <option value="">-- Pilih kolam --</option>
              {kolamOptions.map(k => (
                <option key={k.id_kolam} value={k.id_kolam}>{k.nama_kolam} ({k.luas_ha} ha)</option>
              ))}
            </Select>
          </Field>
          <Field label="Komoditas" required>
            <Select value={form.id_komoditas} onChange={e => setForm(f => ({ ...f, id_komoditas: e.target.value }))}>
              <option value="">-- Pilih komoditas --</option>
              {komoditas.map(k => (
                <option key={k.id_komoditas} value={k.id_komoditas}>
                  {KOMODITAS_LABEL[k.nama] ?? k.nama}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Modal (Rp)" required>
              <Input type="number" placeholder="5000000" value={form.modal_rp}
                onChange={e => setForm(f => ({ ...f, modal_rp: e.target.value }))} />
            </Field>
            <Field label="Jumlah Benih (ekor)" required>
              <Input type="number" placeholder="10000" value={form.jumlah_benih}
                onChange={e => setForm(f => ({ ...f, jumlah_benih: e.target.value }))} />
            </Field>
          </div>
          <Field label="Tanggal Rencana Tebar" required>
            <Input type="date" value={form.tanggal_rencana}
              onChange={e => setForm(f => ({ ...f, tanggal_rencana: e.target.value }))} />
          </Field>
          {formError && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formError}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleCreate}
            confirmLabel="Buat & Lanjut Skoring" loading={saving} />
        </div>
      </Modal>
    </div>
  )
}
