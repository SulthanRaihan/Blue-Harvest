'use client'

import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencana } from '@/hooks/useRencana'
import { usePanenByRencana, useDistribusi } from '@/hooks/usePanen'
import { Modal, Field, Input, Select, ModalActions } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { uploadFoto } from '@/lib/storage'
import type { NamaKomoditas, GradePanen, Panen } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng: 'Ikan Bandeng', nila: 'Ikan Nila', udang_vaname: 'Udang Vaname',
}

const GRADE_COLOR: Record<GradePanen, { bg: string; color: string }> = {
  A: { bg: '#dcfce7', color: '#166534' },
  B: { bg: '#fef3c7', color: '#92400e' },
  C: { bg: '#fee2e2', color: '#991b1b' },
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Distribusi panel ──────────────────────────────────────────
function DistribusiPanel({ idPanen, totalBobot }: { idPanen: string; totalBobot: number }) {
  const { distribusi, loading, create, updateStatus } = useDistribusi(idPanen)
  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const emptyForm = { nama_penerima: '', tanggal: new Date().toISOString().split('T')[0], bobot_kg: '', harga_jual_per_kg: '' }
  const [form, setForm] = useState(emptyForm)

  const totalDistribusi = distribusi.reduce((s, d) => s + d.bobot_kg, 0)
  const sisa = totalBobot - totalDistribusi

  const handleAdd = async () => {
    if (!form.nama_penerima || !form.bobot_kg || !form.harga_jual_per_kg) {
      return setFormErr('Semua field wajib diisi')
    }
    setSaving(true)
    setFormErr(null)
    try {
      await create({
        id_panen: idPanen,
        nama_penerima: form.nama_penerima,
        tanggal: form.tanggal,
        bobot_kg: Number(form.bobot_kg),
        harga_jual_per_kg: Number(form.harga_jual_per_kg),
        status: 'pending',
      })
      setOpen(false)
      setForm(emptyForm)
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Distribusi · Sisa {sisa.toFixed(1)} kg
        </div>
        <button onClick={() => { setFormErr(null); setOpen(true) }}
          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
          style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
          + Tambah
        </button>
      </div>

      {loading ? (
        <div className="p-3"><Skeleton height={36} rounded="rounded-lg" /></div>
      ) : distribusi.length === 0 ? (
        <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum ada distribusi</div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {distribusi.map(d => (
            <div key={d.id_distribusi}
              className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{d.nama_penerima}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {d.bobot_kg} kg · {formatRupiah(d.harga_jual_per_kg)}/kg · {formatTanggal(d.tanggal)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={d.status} />
                {d.status === 'pending' && (
                  <button onClick={() => updateStatus(d.id_distribusi, 'selesai')}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'var(--color-risk-best-bg)', color: 'var(--color-risk-best)', border: '1px solid #bbf7d0' }}>
                    Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Distribusi" size="sm">
        <div className="flex flex-col gap-4">
          <Field label="Nama Penerima / Pengepul" required>
            <Input placeholder="UD. Maju Jaya" value={form.nama_penerima}
              onChange={e => setForm(f => ({ ...f, nama_penerima: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bobot (kg)" required>
              <Input type="number" step="0.1" placeholder="100.5"
                value={form.bobot_kg}
                onChange={e => setForm(f => ({ ...f, bobot_kg: e.target.value }))} />
            </Field>
            <Field label="Harga Jual/kg (Rp)" required>
              <Input type="number" placeholder="35000"
                value={form.harga_jual_per_kg}
                onChange={e => setForm(f => ({ ...f, harga_jual_per_kg: e.target.value }))} />
            </Field>
          </div>
          <Field label="Tanggal Distribusi">
            <Input type="date" value={form.tanggal}
              onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} />
          </Field>
          {formErr && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formErr}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleAdd}
            confirmLabel="Simpan Distribusi" loading={saving} />
        </div>
      </Modal>
    </div>
  )
}

// ── Panen card ────────────────────────────────────────────────
function PanenCard({ panen, onUpload, uploading }: { panen: Panen; onUpload: (file: File) => void; uploading: boolean }) {
  const [showDist, setShowDist] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const g = GRADE_COLOR[panen.grade]
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          {panen.foto_url && (
            <a href={panen.foto_url} target="_blank" rel="noreferrer" className="block shrink-0">
              <img src={panen.foto_url} alt="Dokumentasi panen" className="rounded-xl object-cover" style={{ width: 52, height: 52 }} />
            </a>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {formatTanggal(panen.tanggal_panen)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: g.bg, color: g.color }}>
                Grade {panen.grade}
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {panen.total_bobot_kg} kg · {formatRupiah(panen.harga_per_kg)}/kg
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium px-2 py-1 rounded-lg mt-1.5 transition-colors disabled:opacity-50"
              style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}
            >
              {uploading ? 'Mengunggah...' : panen.foto_url ? 'Ganti Foto' : '+ Foto Dokumentasi'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total Pendapatan</div>
          <div className="text-lg font-black" style={{ color: 'var(--color-ocean-800)' }}>
            {formatRupiah(panen.total_pendapatan)}
          </div>
        </div>
      </div>
      <button onClick={() => setShowDist(v => !v)}
        className="text-xs font-medium flex items-center gap-1 transition-colors"
        style={{ color: 'var(--color-ocean-600)' }}>
        {showDist ? '▲' : '▼'} {showDist ? 'Sembunyikan' : 'Lihat'} Distribusi
      </button>
      {showDist && <DistribusiPanel idPanen={panen.id_panen} totalBobot={panen.total_bobot_kg} />}
    </div>
  )
}

// ── Rencana selector + panen form ────────────────────────────
function RencanaSection({ rencana }: { rencana: ReturnType<typeof useRencana>['rencana'][0] }) {
  const { panen, loading, create, setFoto } = usePanenByRencana(rencana.id_rencana)
  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const handleUpload = async (idPanen: string, file: File) => {
    setUploadingId(idPanen)
    try {
      const url = await uploadFoto(`panen/${idPanen}`, file)
      await setFoto(idPanen, url)
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Gagal mengunggah foto')
    } finally {
      setUploadingId(null)
    }
  }
  const emptyForm = {
    tanggal_panen: new Date().toISOString().split('T')[0],
    total_bobot_kg: '', grade: 'A' as GradePanen, harga_per_kg: '',
  }
  const [form, setForm] = useState(emptyForm)
  const kmd = rencana.komoditas?.nama ? KOMODITAS_LABEL[rencana.komoditas.nama] : '—'

  const handleAdd = async () => {
    if (!form.total_bobot_kg || !form.harga_per_kg) return setFormErr('Bobot dan harga wajib diisi')
    setSaving(true)
    setFormErr(null)
    try {
      await create({
        id_rencana: rencana.id_rencana,
        tanggal_panen: form.tanggal_panen,
        total_bobot_kg: Number(form.total_bobot_kg),
        grade: form.grade,
        harga_per_kg: Number(form.harga_per_kg),
      })
      setOpen(false)
      setForm(emptyForm)
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Gagal menyimpan panen')
    } finally {
      setSaving(false)
    }
  }

  const totalPendapatan = panen.reduce((s, p) => s + p.total_pendapatan, 0)

  return (
    <div className="rencana-section">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {rencana.kolam?.nama_kolam ?? '—'}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {kmd} · {panen.length} panen · {formatRupiah(totalPendapatan)} total
          </div>
        </div>
        <button onClick={() => { setFormErr(null); setOpen(true) }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
          <span className="text-base leading-none">+</span> Catat Panen
        </button>
      </div>

      {loading ? (
        <Skeleton height={100} rounded="rounded-2xl" />
      ) : panen.length === 0 ? (
        <div className="card p-4 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
          Belum ada catatan panen
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {panen.map(p => (
            <PanenCard
              key={p.id_panen}
              panen={p}
              uploading={uploadingId === p.id_panen}
              onUpload={file => handleUpload(p.id_panen, file)}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Catat Hasil Panen">
        <div className="flex flex-col gap-4">
          <Field label="Tanggal Panen" required>
            <Input type="date" value={form.tanggal_panen}
              onChange={e => setForm(f => ({ ...f, tanggal_panen: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Total Bobot (kg)" required>
              <Input type="number" step="0.1" placeholder="500.0"
                value={form.total_bobot_kg}
                onChange={e => setForm(f => ({ ...f, total_bobot_kg: e.target.value }))} />
            </Field>
            <Field label="Harga/kg (Rp)" required>
              <Input type="number" placeholder="35000"
                value={form.harga_per_kg}
                onChange={e => setForm(f => ({ ...f, harga_per_kg: e.target.value }))} />
            </Field>
            <Field label="Grade">
              <Select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value as GradePanen }))}>
                <option value="A">Grade A (Terbaik)</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </Select>
            </Field>
          </div>
          {form.total_bobot_kg && form.harga_per_kg && (
            <div className="rounded-xl p-3 text-sm text-center" style={{ background: 'var(--color-ocean-50)' }}>
              Estimasi pendapatan: <strong style={{ color: 'var(--color-ocean-800)' }}>
                {formatRupiah(Number(form.total_bobot_kg) * Number(form.harga_per_kg))}
              </strong>
            </div>
          )}
          {formErr && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formErr}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleAdd}
            confirmLabel="Simpan Panen" loading={saving} />
        </div>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════
export default function PanenPage() {
  const { rencana, loading } = useRencana()
  const pageRef = useRef<HTMLDivElement>(null)

  // Panen berlaku untuk siklus aktif dan selesai
  const harvestabl = rencana.filter(r => r.status === 'aktif' || r.status === 'selesai')

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { y: -10, opacity: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
    gsap.from('.rencana-section', { y: 16, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out', delay: 0.1, clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [loading] })

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Panen & Distribusi
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Catat hasil panen dan atur distribusi produk ke pengepul / pasar
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          {[1, 2].map(i => <Skeleton key={i} height={160} rounded="rounded-2xl" />)}
        </div>
      ) : harvestabl.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Tidak ada siklus aktif</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Aktifkan siklus budidaya terlebih dahulu</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {harvestabl.map(r => <RencanaSection key={r.id_rencana} rencana={r} />)}
        </div>
      )}
    </div>
  )
}
