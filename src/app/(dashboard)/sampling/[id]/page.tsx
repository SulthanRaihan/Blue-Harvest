'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencanaDetail } from '@/hooks/useRencana'
import { useSampling } from '@/hooks/useSampling'
import { Modal, Field, Input, ModalActions } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NamaKomoditas } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng: 'Ikan Bandeng', nila: 'Ikan Nila', udang_vaname: 'Udang Vaname',
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Mini sparkline bar ─────────────────────────────────────────
function SparkBar({ values, max, color }: { values: number[]; max: number; color: string }) {
  if (values.length === 0) return null
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm min-h-[2px] transition-all duration-500"
          style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color, opacity: 0.7 + (i / values.length) * 0.3 }} />
      ))}
    </div>
  )
}

export default function SamplingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { rencana, loading: loadR } = useRencanaDetail(id)
  const { entries, loading: loadS, error, add } = useSampling(id)
  const pageRef = useRef<HTMLDivElement>(null)

  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const emptyForm = { tanggal: new Date().toISOString().split('T')[0], minggu_ke: '', rata_berat_gram: '', estimasi_populasi: '', fcr: '' }
  const [form, setForm] = useState(emptyForm)

  const loading = loadR || loadS

  useGSAP(() => {
    if (loading) return
    gsap.from('.detail-section', { y: 14, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
  }, { scope: pageRef, dependencies: [loading] })

  const handleAdd = async () => {
    if (!form.minggu_ke || !form.rata_berat_gram || !form.estimasi_populasi || !form.fcr) {
      return setFormErr('Semua field wajib diisi')
    }
    setSaving(true)
    setFormErr(null)
    try {
      await add({
        id_rencana: id,
        tanggal: form.tanggal,
        minggu_ke: Number(form.minggu_ke),
        rata_berat_gram: Number(form.rata_berat_gram),
        estimasi_populasi: Number(form.estimasi_populasi),
        fcr: Number(form.fcr),
      })
      setOpen(false)
      setForm(emptyForm)
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-3xl mx-auto flex flex-col gap-4">
        <Skeleton height={24} width={200} />
        <Skeleton height={120} rounded="rounded-2xl" />
        <Skeleton height={260} rounded="rounded-2xl" />
      </div>
    )
  }

  if (!rencana) {
    return (
      <div className="px-5 py-6 max-w-3xl mx-auto">
        <div className="card p-5 text-sm" style={{ color: 'var(--color-risk-worst)' }}>Siklus tidak ditemukan.</div>
      </div>
    )
  }

  const fcrStandar = (rencana.komoditas as any)?.fcr_standar ?? null
  const latestEntry = entries[entries.length - 1]
  const bobotValues = entries.map(e => e.rata_berat_gram)
  const fcrValues   = entries.map(e => e.fcr)
  const maxBobot    = bobotValues.length > 0 ? Math.max(...bobotValues) : 1
  const maxFcr      = fcrValues.length > 0 ? Math.max(...fcrValues, fcrStandar ?? 1) : 1

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 max-w-3xl mx-auto">
      {/* Back */}
      <div className="detail-section mb-5">
        <Link href="/sampling"
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
              {rencana.kolam?.nama_kolam ?? 'Sampling'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {rencana.komoditas?.nama ? KOMODITAS_LABEL[rencana.komoditas.nama as NamaKomoditas] : '—'} · {entries.length} data mingguan
            </p>
          </div>
          <button onClick={() => { setFormErr(null); setOpen(true) }}
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
            <span className="text-base leading-none">+</span> Sampling
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {latestEntry && (
        <div className="detail-section grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Bobot Terakhir', val: `${latestEntry.rata_berat_gram} g`, sub: `Minggu ke-${latestEntry.minggu_ke}` },
            { label: 'Est. Populasi', val: latestEntry.estimasi_populasi.toLocaleString('id-ID'), sub: 'ekor' },
            { label: 'FCR Terakhir', val: latestEntry.fcr.toFixed(2), sub: fcrStandar ? `Standar: ${fcrStandar}` : 'FCR aktual', highlight: fcrStandar && latestEntry.fcr > fcrStandar },
          ].map(c => (
            <div key={c.label} className="card p-4 text-center">
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{c.label}</div>
              <div className="text-xl font-black" style={{ color: (c as any).highlight ? 'var(--color-risk-worst)' : 'var(--color-ocean-800)' }}>
                {c.val}
              </div>
              <div className="text-xs mt-0.5" style={{ color: (c as any).highlight ? 'var(--color-risk-worst)' : 'var(--color-text-muted)' }}>
                {c.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sparkline charts */}
      {entries.length >= 2 && (
        <div className="detail-section grid grid-cols-2 gap-3 mb-5">
          <div className="card p-4">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Pertumbuhan Bobot (g)
            </div>
            <SparkBar values={bobotValues} max={maxBobot} color="var(--color-ocean-500)" />
            <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span>Mg {entries[0].minggu_ke}</span>
              <span>Mg {entries[entries.length - 1].minggu_ke}</span>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              FCR Aktual {fcrStandar ? `(std: ${fcrStandar})` : ''}
            </div>
            <SparkBar values={fcrValues} max={maxFcr} color="var(--color-teal-500)" />
            <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span>Mg {entries[0].minggu_ke}</span>
              <span>Mg {entries[entries.length - 1].minggu_ke}</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="detail-section card overflow-hidden">
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
          <div className="grid grid-cols-5 gap-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text-muted)' }}>
            <span>Minggu</span><span>Tanggal</span><span>Bobot (g)</span><span>Populasi</span><span>FCR</span>
          </div>
        </div>

        {loadS ? (
          <div className="p-4 flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} height={36} rounded="rounded-lg" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada data sampling</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {entries.map(e => {
              const fcrBad = fcrStandar && e.fcr > fcrStandar
              return (
                <div key={e.id_sampling}
                  className="grid grid-cols-5 gap-2 px-5 py-3.5 text-sm items-center transition-colors"
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--color-surface-muted)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                  <span className="font-semibold" style={{ color: 'var(--color-ocean-700)' }}>ke-{e.minggu_ke}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{formatTanggal(e.tanggal)}</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{e.rata_berat_gram}</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{e.estimasi_populasi.toLocaleString('id-ID')}</span>
                  <span className="font-semibold" style={{ color: fcrBad ? 'var(--color-risk-worst)' : 'var(--color-risk-best)' }}>
                    {e.fcr.toFixed(2)} {fcrBad ? '↑' : '✓'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Data Sampling Minggu Ini">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minggu ke-" required>
              <Input type="number" min="1" placeholder="1"
                value={form.minggu_ke}
                onChange={e => setForm(f => ({ ...f, minggu_ke: e.target.value }))} />
            </Field>
            <Field label="Tanggal Sampling" required>
              <Input type="date" value={form.tanggal}
                onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rata Bobot (g)" required>
              <Input type="number" step="0.1" placeholder="50.5"
                value={form.rata_berat_gram}
                onChange={e => setForm(f => ({ ...f, rata_berat_gram: e.target.value }))} />
            </Field>
            <Field label="Est. Populasi" required>
              <Input type="number" placeholder="9500"
                value={form.estimasi_populasi}
                onChange={e => setForm(f => ({ ...f, estimasi_populasi: e.target.value }))} />
            </Field>
            <Field label="FCR" required>
              <Input type="number" step="0.01" placeholder="1.20"
                value={form.fcr}
                onChange={e => setForm(f => ({ ...f, fcr: e.target.value }))} />
            </Field>
          </div>
          {fcrStandar && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              FCR standar komoditas: <strong>{fcrStandar}</strong> — nilai lebih tinggi berarti efisiensi pakan berkurang.
            </p>
          )}
          {formErr && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formErr}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleAdd}
            confirmLabel="Simpan Sampling" loading={saving} />
        </div>
      </Modal>
    </div>
  )
}
