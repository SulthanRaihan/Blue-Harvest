'use client'

import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useKomoditas, KOMODITAS_LABEL } from '@/hooks/useKomoditas'
import { Modal, Field, Input, ModalActions } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/ui/PageHeader'
import { IconFish } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import type { Komoditas } from '@/types/database'

gsap.registerPlugin(useGSAP)

function formatRupiah(n: number | null) {
  if (n == null) return 'Belum diisi'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

type FormState = {
  target_ph_min: string; target_ph_max: string
  target_suhu_min: string; target_suhu_max: string
  target_do_min: string
  target_salinitas_min: string; target_salinitas_max: string
  fcr_standar: string
  harga_acuan_per_kg: string
}

function toForm(k: Komoditas): FormState {
  return {
    target_ph_min: String(k.target_ph_min), target_ph_max: String(k.target_ph_max),
    target_suhu_min: String(k.target_suhu_min), target_suhu_max: String(k.target_suhu_max),
    target_do_min: String(k.target_do_min),
    target_salinitas_min: String(k.target_salinitas_min), target_salinitas_max: String(k.target_salinitas_max),
    fcr_standar: String(k.fcr_standar),
    harga_acuan_per_kg: k.harga_acuan_per_kg != null ? String(k.harga_acuan_per_kg) : '',
  }
}

// ── Komoditas card ────────────────────────────────────────────
function KomoditasCard({ komoditas, onSave }: { komoditas: Komoditas; onSave: (updates: Partial<Komoditas>) => Promise<void> }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(() => toForm(komoditas))

  const openEdit = () => {
    setForm(toForm(komoditas))
    setError(null)
    setOpen(true)
  }

  const handleSave = async () => {
    const nums = {
      target_ph_min: Number(form.target_ph_min), target_ph_max: Number(form.target_ph_max),
      target_suhu_min: Number(form.target_suhu_min), target_suhu_max: Number(form.target_suhu_max),
      target_do_min: Number(form.target_do_min),
      target_salinitas_min: Number(form.target_salinitas_min), target_salinitas_max: Number(form.target_salinitas_max),
      fcr_standar: Number(form.fcr_standar),
    }
    if (Object.values(nums).some(n => Number.isNaN(n))) {
      return setError('Semua field target harus berupa angka')
    }
    if (nums.target_ph_min >= nums.target_ph_max) return setError('pH minimum harus lebih kecil dari maksimum')
    if (nums.target_suhu_min >= nums.target_suhu_max) return setError('Suhu minimum harus lebih kecil dari maksimum')
    if (nums.target_salinitas_min >= nums.target_salinitas_max) return setError('Salinitas minimum harus lebih kecil dari maksimum')

    setSaving(true)
    setError(null)
    try {
      await onSave({
        ...nums,
        harga_acuan_per_kg: form.harga_acuan_per_kg ? Number(form.harga_acuan_per_kg) : null,
      })
      setOpen(false)
      toast.success(`Data ${KOMODITAS_LABEL[komoditas.nama]} diperbarui`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="komoditas-section card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
            <IconFish size={20} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {KOMODITAS_LABEL[komoditas.nama]}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              FCR standar {komoditas.fcr_standar}
            </div>
          </div>
        </div>
        <button onClick={openEdit}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
          style={{ background: 'var(--color-notion-500)', color: '#fff' }}>
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'pH', val: `${komoditas.target_ph_min}–${komoditas.target_ph_max}` },
          { label: 'Suhu (°C)', val: `${komoditas.target_suhu_min}–${komoditas.target_suhu_max}` },
          { label: 'DO min (ppm)', val: `${komoditas.target_do_min}` },
          { label: 'Salinitas (ppt)', val: `${komoditas.target_salinitas_min}–${komoditas.target_salinitas_max}` },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--color-surface-muted)' }}>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.label}</div>
            <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-ocean-800)' }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--color-ocean-50)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--color-ocean-700)' }}>
          Harga Acuan / kg <span className="opacity-70">(dipakai fitur Estimasi Omset)</span>
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--color-ocean-800)' }}>
          {formatRupiah(komoditas.harga_acuan_per_kg)}
        </span>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Edit ${KOMODITAS_LABEL[komoditas.nama]}`}
        description="Target kualitas air jadi acuan bandingan di Logbook Kualitas Air; harga acuan dipakai untuk Estimasi Omset.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="pH Minimum" required>
              <Input type="number" step="0.1" value={form.target_ph_min}
                onChange={e => setForm(f => ({ ...f, target_ph_min: e.target.value }))} />
            </Field>
            <Field label="pH Maksimum" required>
              <Input type="number" step="0.1" value={form.target_ph_max}
                onChange={e => setForm(f => ({ ...f, target_ph_max: e.target.value }))} />
            </Field>
            <Field label="Suhu Minimum (°C)" required>
              <Input type="number" step="0.1" value={form.target_suhu_min}
                onChange={e => setForm(f => ({ ...f, target_suhu_min: e.target.value }))} />
            </Field>
            <Field label="Suhu Maksimum (°C)" required>
              <Input type="number" step="0.1" value={form.target_suhu_max}
                onChange={e => setForm(f => ({ ...f, target_suhu_max: e.target.value }))} />
            </Field>
            <Field label="DO Minimum (ppm)" required>
              <Input type="number" step="0.1" value={form.target_do_min}
                onChange={e => setForm(f => ({ ...f, target_do_min: e.target.value }))} />
            </Field>
            <Field label="FCR Standar" required>
              <Input type="number" step="0.01" value={form.fcr_standar}
                onChange={e => setForm(f => ({ ...f, fcr_standar: e.target.value }))} />
            </Field>
            <Field label="Salinitas Minimum (ppt)" required>
              <Input type="number" step="0.1" value={form.target_salinitas_min}
                onChange={e => setForm(f => ({ ...f, target_salinitas_min: e.target.value }))} />
            </Field>
            <Field label="Salinitas Maksimum (ppt)" required>
              <Input type="number" step="0.1" value={form.target_salinitas_max}
                onChange={e => setForm(f => ({ ...f, target_salinitas_max: e.target.value }))} />
            </Field>
          </div>
          <Field label="Harga Acuan per kg (Rp)">
            <Input type="number" placeholder="Kosongkan kalau belum ada acuan" value={form.harga_acuan_per_kg}
              onChange={e => setForm(f => ({ ...f, harga_acuan_per_kg: e.target.value }))} />
          </Field>
          {error && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{error}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleSave} loading={saving} />
        </div>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════
export default function KomoditasPage() {
  const { komoditas, loading, error, update } = useKomoditas()
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.komoditas-section', { y: 16, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [loading] })

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <PageHeader
        title="Kelola Komoditas"
        subtitle="Data master target kualitas air, standar FCR, dan harga acuan per komoditas"
      />

      {error && (
        <div className="mb-4 rounded-xl p-4 text-sm" style={{ background: 'var(--color-risk-worst-bg)', color: 'var(--color-risk-worst)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} height={220} rounded="rounded-2xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {komoditas.map(k => (
            <KomoditasCard key={k.id_komoditas} komoditas={k} onSave={async updates => { await update(k.id_komoditas, updates) }} />
          ))}
        </div>
      )}
    </div>
  )
}
