'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencanaDetail } from '@/hooks/useRencana'
import { useOperasional, useKualitas, checkKualitas } from '@/hooks/useOperasional'
import { Modal, Field, Input, ModalActions } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NamaKomoditas, OperasionalHarian, KualitasAir } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng:      'Ikan Bandeng',
  nila:         'Ikan Nila',
  udang_vaname: 'Udang Vaname',
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTimestamp(s: string) {
  return new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Status dot ─────────────────────────────────────────────────
function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: ok ? 'var(--color-risk-best)' : 'var(--color-risk-worst)' }} />
  )
}

// ── Empty state ────────────────────────────────────────────────
function EmptyLog({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12">
      <div className="text-2xl">📋</div>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  )
}

// ── Row skeleton ───────────────────────────────────────────────
function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton width={36} height={36} rounded="rounded-xl" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton height={13} width={120} />
            <Skeleton height={11} width={180} rounded="rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: PAKAN & CATATAN
// ════════════════════════════════════════════════════════════
function TabPakan({ idRencana }: { idRencana: string }) {
  const { entries, loading, error, add } = useOperasional(idRencana)
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const emptyForm = { tanggal: new Date().toISOString().split('T')[0], jumlah_pakan_kg: '', jenis_pakan: '', catatan_hama_penyakit: '', tindakan: '' }
  const [form, setForm] = useState(emptyForm)

  const handleAdd = async () => {
    if (!form.jumlah_pakan_kg || isNaN(Number(form.jumlah_pakan_kg))) {
      return setFormErr('Jumlah pakan harus angka')
    }
    if (!form.jenis_pakan.trim()) return setFormErr('Jenis pakan wajib diisi')
    setSaving(true)
    setFormErr(null)
    try {
      await add({
        id_rencana: idRencana,
        tanggal: form.tanggal,
        jumlah_pakan_kg: Number(form.jumlah_pakan_kg),
        jenis_pakan: form.jenis_pakan,
        catatan_hama_penyakit: form.catatan_hama_penyakit || null,
        tindakan: form.tindakan || null,
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
    <>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {loading ? '...' : `${entries.length} entri`}
        </p>
        <button onClick={() => { setFormErr(null); setOpen(true) }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
          <span className="text-base leading-none">+</span> Tambah Log
        </button>
      </div>

      {loading ? <RowSkeleton /> : error ? (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--color-risk-worst)' }}>{error}</div>
      ) : entries.length === 0 ? (
        <EmptyLog label="Belum ada log pakan — tambahkan entri harian pertama" />
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {entries.map(e => <PakanRow key={e.id_operasional} entry={e} />)}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Log Harian">
        <div className="flex flex-col gap-4">
          <Field label="Tanggal" required>
            <Input type="date" value={form.tanggal}
              onChange={ev => setForm(f => ({ ...f, tanggal: ev.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah Pakan (kg)" required>
              <Input type="number" step="0.1" min="0" placeholder="5.5"
                value={form.jumlah_pakan_kg}
                onChange={ev => setForm(f => ({ ...f, jumlah_pakan_kg: ev.target.value }))} />
            </Field>
            <Field label="Jenis Pakan" required>
              <Input placeholder="Pellet 781-2" value={form.jenis_pakan}
                onChange={ev => setForm(f => ({ ...f, jenis_pakan: ev.target.value }))} />
            </Field>
          </div>
          <Field label="Catatan Hama / Penyakit">
            <Input placeholder="Tidak ada / Terlihat bercak putih pada sirip..." value={form.catatan_hama_penyakit}
              onChange={ev => setForm(f => ({ ...f, catatan_hama_penyakit: ev.target.value }))} />
          </Field>
          <Field label="Tindakan">
            <Input placeholder="Pemberian obat / Penggantian air 20%..." value={form.tindakan}
              onChange={ev => setForm(f => ({ ...f, tindakan: ev.target.value }))} />
          </Field>
          {formErr && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formErr}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleAdd}
            confirmLabel="Simpan Log" loading={saving} />
        </div>
      </Modal>
    </>
  )
}

function PakanRow({ entry }: { entry: OperasionalHarian }) {
  const hasAlert = !!entry.catatan_hama_penyakit
  return (
    <div className="flex items-start gap-4 px-5 py-4 transition-colors"
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: hasAlert ? 'var(--color-risk-worst-bg)' : 'var(--color-ocean-50)', color: hasAlert ? 'var(--color-risk-worst)' : 'var(--color-ocean-600)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {hasAlert
            ? <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
            : <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
          }
        </svg>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatTanggal(entry.tanggal)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
            {entry.jumlah_pakan_kg} kg · {entry.jenis_pakan}
          </span>
        </div>
        {entry.catatan_hama_penyakit && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-risk-worst)' }}>
            Hama: {entry.catatan_hama_penyakit}
          </p>
        )}
        {entry.tindakan && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Tindakan: {entry.tindakan}
          </p>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: KUALITAS AIR
// ════════════════════════════════════════════════════════════
function TabKualitas({ idKolam, komoditas }: {
  idKolam: string
  komoditas: { target_ph_min: number; target_ph_max: number; target_suhu_min: number; target_suhu_max: number; target_do_min: number; target_salinitas_min: number; target_salinitas_max: number } | null
}) {
  const { entries, loading, error, add } = useKualitas(idKolam)
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const emptyForm = { ph: '', do_ppm: '', suhu_celsius: '', salinitas_ppt: '' }
  const [form, setForm] = useState(emptyForm)

  const handleAdd = async () => {
    if (!form.ph || !form.do_ppm || !form.suhu_celsius || !form.salinitas_ppt) {
      return setFormErr('Semua parameter wajib diisi')
    }
    setSaving(true)
    setFormErr(null)
    try {
      await add({
        id_kolam: idKolam,
        timestamp: new Date().toISOString(),
        ph: Number(form.ph),
        do_ppm: Number(form.do_ppm),
        suhu_celsius: Number(form.suhu_celsius),
        salinitas_ppt: Number(form.salinitas_ppt),
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
    <>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {loading ? '...' : `${entries.length} pengukuran`}
        </p>
        <button onClick={() => { setFormErr(null); setOpen(true) }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
          <span className="text-base leading-none">+</span> Catat Kualitas
        </button>
      </div>

      {/* Threshold legend */}
      {komoditas && (
        <div className="px-5 py-3 flex flex-wrap gap-3 text-xs" style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)' }}>
          <span>Target:</span>
          <span>pH {komoditas.target_ph_min}–{komoditas.target_ph_max}</span>
          <span>DO ≥{komoditas.target_do_min} ppm</span>
          <span>Suhu {komoditas.target_suhu_min}–{komoditas.target_suhu_max}°C</span>
          <span>Salinitas {komoditas.target_salinitas_min}–{komoditas.target_salinitas_max} ppt</span>
        </div>
      )}

      {loading ? <RowSkeleton /> : error ? (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--color-risk-worst)' }}>{error}</div>
      ) : entries.length === 0 ? (
        <EmptyLog label="Belum ada pengukuran kualitas air" />
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {entries.map(e => <KualitasRow key={e.id_kualitas} entry={e} komoditas={komoditas} />)}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Catat Kualitas Air"
        description="Input pengukuran manual dari lapangan. Sistem akan menandai parameter yang di luar batas normal.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="pH" required>
              <Input type="number" step="0.1" min="0" max="14" placeholder="7.5"
                value={form.ph} onChange={ev => setForm(f => ({ ...f, ph: ev.target.value }))} />
            </Field>
            <Field label="DO (ppm)" required>
              <Input type="number" step="0.1" min="0" placeholder="5.0"
                value={form.do_ppm} onChange={ev => setForm(f => ({ ...f, do_ppm: ev.target.value }))} />
            </Field>
            <Field label="Suhu (°C)" required>
              <Input type="number" step="0.1" min="0" placeholder="28.0"
                value={form.suhu_celsius} onChange={ev => setForm(f => ({ ...f, suhu_celsius: ev.target.value }))} />
            </Field>
            <Field label="Salinitas (ppt)" required>
              <Input type="number" step="0.1" min="0" placeholder="15.0"
                value={form.salinitas_ppt} onChange={ev => setForm(f => ({ ...f, salinitas_ppt: ev.target.value }))} />
            </Field>
          </div>
          {formErr && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formErr}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleAdd}
            confirmLabel="Simpan Pengukuran" loading={saving} />
        </div>
      </Modal>
    </>
  )
}

function KualitasRow({ entry, komoditas }: { entry: KualitasAir; komoditas: any }) {
  const status = checkKualitas(entry, komoditas)
  const allOk  = Object.values(status).every(s => s.ok)
  const params = [
    { key: 'ph',         label: 'pH',         val: entry.ph,           unit: '' },
    { key: 'do_ppm',     label: 'DO',         val: entry.do_ppm,       unit: ' ppm' },
    { key: 'suhu',       label: 'Suhu',       val: entry.suhu_celsius, unit: '°C' },
    { key: 'salinitas',  label: 'Salinitas',  val: entry.salinitas_ppt,unit: ' ppt' },
  ]

  return (
    <div className="px-5 py-4 transition-colors"
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {formatTimestamp(entry.timestamp)}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: allOk ? 'var(--color-risk-best)' : 'var(--color-risk-worst)' }}>
          <StatusDot ok={allOk} />
          {allOk ? 'Normal' : 'Ada Anomali'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {params.map(p => {
          const s = status[p.key]
          const ok = s ? s.ok : true
          return (
            <div key={p.key} className="rounded-lg p-2.5 text-center"
              style={{
                background: ok ? 'var(--color-ocean-50)' : 'var(--color-risk-worst-bg)',
                border: ok ? '1px solid var(--color-ocean-100)' : '1px solid #fca5a5',
              }}>
              <div className="text-xs mb-0.5" style={{ color: ok ? 'var(--color-ocean-500)' : 'var(--color-risk-worst)' }}>
                {p.label}
              </div>
              <div className="text-sm font-bold" style={{ color: ok ? 'var(--color-ocean-800)' : 'var(--color-risk-worst)' }}>
                {p.val}{p.unit}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════
type Tab = 'pakan' | 'kualitas'

export default function OperasionalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { rencana, loading } = useRencanaDetail(id)
  const [tab, setTab] = useState<Tab>('pakan')
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (loading) return
    gsap.from('.detail-section', { y: 12, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
  }, { scope: pageRef, dependencies: [loading] })

  if (loading) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-3xl mx-auto flex flex-col gap-4">
        <Skeleton height={24} width={200} />
        <Skeleton height={100} rounded="rounded-2xl" />
        <Skeleton height={300} rounded="rounded-2xl" />
      </div>
    )
  }

  if (!rencana) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-3xl mx-auto">
        <div className="card p-5 text-sm" style={{ color: 'var(--color-risk-worst)' }}>
          Siklus tidak ditemukan.
        </div>
      </div>
    )
  }

  const komoditas = rencana.komoditas?.nama ? KOMODITAS_LABEL[rencana.komoditas.nama] : '—'
  const idKolam   = rencana.id_kolam

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="detail-section mb-5">
        <Link href="/operasional"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ocean-700)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {rencana.kolam?.nama_kolam ?? 'Logbook'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {komoditas} · mulai {formatTanggal(rencana.tanggal_rencana)}
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
            Siklus Aktif
          </span>
        </div>
      </div>

      {/* Card with tabs */}
      <div className="detail-section card overflow-hidden">
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {([
            { key: 'pakan',   label: 'Pakan & Catatan' },
            { key: 'kualitas', label: 'Kualitas Air' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-5 py-3.5 text-sm font-semibold transition-all relative"
              style={{
                color: tab === t.key ? 'var(--color-ocean-900)' : 'var(--color-text-muted)',
                borderBottom: tab === t.key ? '2px solid var(--color-ocean-900)' : '2px solid transparent',
                marginBottom: '-1px',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'pakan'
          ? <TabPakan idRencana={id} />
          : <TabKualitas idKolam={idKolam} komoditas={rencana.komoditas as any} />
        }
      </div>
    </div>
  )
}
