'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencanaDetail } from '@/hooks/useRencana'
import { useOperasional, useKualitas, checkKualitas } from '@/hooks/useOperasional'
import type { OperasionalWithPencatat } from '@/lib/repositories/operasional.repository'
import type { KualitasWithPencatat } from '@/lib/repositories/kualitas.repository'
import { useBiaya, KATEGORI_BIAYA_LABEL } from '@/hooks/useBiaya'
import { Modal, Field, Input, Select, ModalActions } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { CategoryDonut, CATEGORY_DONUT_COLORS } from '@/components/ui/Charts'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { InfoHint } from '@/components/ui/InfoHint'
import type { NamaKomoditas, OperasionalHarian, KualitasAir, KategoriBiaya } from '@/types/database'

gsap.registerPlugin(useGSAP)

const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng:      'Ikan Bandeng',
  nila:         'Ikan Nila',
  udang_vaname: 'Udang Vaname',
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
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
function TabPakan({ idRencana, pemilikNama }: { idRencana: string; pemilikNama: string | null }) {
  const { entries, loading, error, add } = useOperasional(idRencana)
  const toast = useToast()
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
      toast.success('Log harian tersimpan')
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
          style={{ background: 'var(--color-notion-500)', color: '#fff' }}>
          <span className="text-base leading-none">+</span> Tambah Log
        </button>
      </div>

      {loading ? <RowSkeleton /> : error ? (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--color-risk-worst)' }}>{error}</div>
      ) : entries.length === 0 ? (
        <EmptyLog label="Belum ada log pakan. Tambahkan entri harian pertama." />
      ) : (
        <LogbookPakan entries={entries} pemilikNama={pemilikNama} />
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

// ── Tab: Biaya Operasional ──────────────────────────────────────
function TabBiaya({ idRencana }: { idRencana: string }) {
  const { entries, loading, error, add, remove, total, breakdown } = useBiaya(idRencana)
  const toast = useToast()
  const confirm = useConfirm()
  const [open, setOpen]       = useState(false)
  const [saving, setSaving]   = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const emptyForm = { tanggal: new Date().toISOString().split('T')[0], kategori: '' as KategoriBiaya | '', jumlah_rp: '', catatan: '' }
  const [form, setForm] = useState(emptyForm)

  const handleAdd = async () => {
    if (!form.kategori) return setFormErr('Pilih kategori biaya')
    if (!form.jumlah_rp || isNaN(Number(form.jumlah_rp)) || Number(form.jumlah_rp) <= 0) {
      return setFormErr('Jumlah biaya harus angka positif')
    }
    setSaving(true)
    setFormErr(null)
    try {
      await add({
        id_rencana: idRencana,
        tanggal: form.tanggal,
        kategori: form.kategori,
        jumlah_rp: Number(form.jumlah_rp),
        catatan: form.catatan || null,
      })
      setOpen(false)
      setForm(emptyForm)
      toast.success('Biaya operasional tersimpan')
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Gagal menyimpan biaya')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string, kategori: KategoriBiaya) => {
    const ok = await confirm({
      title: 'Hapus biaya ini?',
      message: `Catatan biaya ${KATEGORI_BIAYA_LABEL[kategori]} akan dihapus permanen dan tidak bisa dikembalikan.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    try {
      await remove(id)
      toast.success('Biaya berhasil dihapus')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus biaya')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {loading ? '...' : `${entries.length} entri · Total ${formatRupiah(total)}`}
        </p>
        <button onClick={() => { setFormErr(null); setOpen(true) }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--color-notion-500)', color: '#fff' }}>
          <span className="text-base leading-none">+</span> Catat Biaya
        </button>
      </div>

      {!loading && breakdown.length > 0 && (
        <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <CategoryDonut data={breakdown.map(b => ({ label: b.kategori, jumlah: b.jumlah }))} size={64} />
          <div className="flex flex-col gap-1 text-xs">
            {breakdown.map((b, i) => (
              <div key={b.kategori} className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: 4, background: CATEGORY_DONUT_COLORS[i % CATEGORY_DONUT_COLORS.length], display: 'inline-block' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{KATEGORI_BIAYA_LABEL[b.kategori]}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>· {formatRupiah(b.jumlah)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <RowSkeleton /> : error ? (
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--color-risk-worst)' }}>{error}</div>
      ) : entries.length === 0 ? (
        <EmptyLog label="Belum ada biaya tercatat — catat biaya di luar pakan (listrik, tenaga kerja, dll)" />
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {entries.map(e => (
            <div key={e.id_biaya} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {KATEGORI_BIAYA_LABEL[e.kategori]}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {formatTanggal(e.tanggal)}{e.catatan ? ` · ${e.catatan}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: 'var(--color-ocean-800)' }}>{formatRupiah(e.jumlah_rp)}</span>
                <button onClick={() => handleRemove(e.id_biaya, e.kategori)} className="text-xs font-medium transition-colors hover:underline" style={{ color: 'var(--color-risk-worst)' }}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Catat Biaya Operasional">
        <div className="flex flex-col gap-4">
          <Field label="Tanggal" required>
            <Input type="date" value={form.tanggal}
              onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} />
          </Field>
          <Field label="Kategori" required>
            <Select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value as KategoriBiaya }))}>
              <option value="">-- Pilih kategori --</option>
              {Object.entries(KATEGORI_BIAYA_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Jumlah (Rp)" required>
            <Input type="number" placeholder="100000" value={form.jumlah_rp}
              onChange={e => setForm(f => ({ ...f, jumlah_rp: e.target.value }))} />
          </Field>
          <Field label="Catatan">
            <Input value={form.catatan}
              onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
          </Field>
          {formErr && <p className="text-xs" style={{ color: 'var(--color-risk-worst)' }}>{formErr}</p>}
          <ModalActions onCancel={() => setOpen(false)} onConfirm={handleAdd}
            confirmLabel="Simpan" loading={saving} />
        </div>
      </Modal>
    </>
  )
}

// ── Logbook Pakan (tabel ala referensi) ────────────────────────
// Tiap baris punya strip prioritas di tepi kiri: merah kalau ada
// catatan hama/penyakit (perlu perhatian), hijau kalau normal.
// Kolom USER menampilkan siapa yang mencatat.
function initials(nama: string) {
  return nama.slice(0, 2).toUpperCase()
}

function LogbookPakan({ entries, pemilikNama }: { entries: OperasionalWithPencatat[]; pemilikNama: string | null }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 620 }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-muted)' }}>
              <th style={{ width: 4, padding: 0, borderBottom: '1px solid var(--color-border)' }} />
              <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-2.5" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>Tanggal</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-2.5" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>Pakan</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-2.5" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Catatan</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-2.5" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>Pencatat</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const hasAlert = !!entry.catatan_hama_penyakit
              const nama = entry.pencatat?.nama ?? pemilikNama
              return (
                <tr key={entry.id_operasional} className="transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {/* Strip prioritas */}
                  <td style={{ padding: 0, borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ width: 4, height: '100%', minHeight: 44, background: hasAlert ? 'var(--color-risk-worst)' : 'var(--color-risk-best)' }} />
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {formatTanggal(entry.tanggal)}
                  </td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
                      {entry.jumlah_pakan_kg} kg · {entry.jenis_pakan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {hasAlert ? (
                      <div>
                        <div style={{ color: 'var(--color-risk-worst)' }}>{entry.catatan_hama_penyakit}</div>
                        {entry.tindakan && <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Tindakan: {entry.tindakan}</div>}
                      </div>
                    ) : (
                      <span className="text-xs font-medium" style={{ color: 'var(--color-risk-best)' }}>Normal</span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {nama ? (
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'var(--color-ocean-100)', color: 'var(--color-ocean-800)' }}>
                          {initials(nama)}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{nama}</span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Legenda prioritas */}
      <div className="flex items-center gap-4 px-5 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 4, borderRadius: 2, background: 'var(--color-risk-best)', display: 'inline-block' }} />Normal</span>
        <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 4, borderRadius: 2, background: 'var(--color-risk-worst)', display: 'inline-block' }} />Perlu perhatian</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: KUALITAS AIR
// ════════════════════════════════════════════════════════════
function TabKualitas({ idKolam, komoditas, pemilikNama }: {
  idKolam: string
  komoditas: { target_ph_min: number; target_ph_max: number; target_suhu_min: number; target_suhu_max: number; target_do_min: number; target_salinitas_min: number; target_salinitas_max: number } | null
  pemilikNama: string | null
}) {
  const { entries, loading, error, add } = useKualitas(idKolam)
  const toast = useToast()
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
        tanggal: new Date().toISOString().split('T')[0],
        ph: Number(form.ph),
        do_ppm: Number(form.do_ppm),
        suhu_celsius: Number(form.suhu_celsius),
        salinitas_ppt: Number(form.salinitas_ppt),
      })
      setOpen(false)
      setForm(emptyForm)
      toast.success('Data kualitas air tersimpan')
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
          style={{ background: 'var(--color-notion-500)', color: '#fff' }}>
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
        <EmptyLog label="Belum ada pengukuran kualitas air." />
      ) : (
        <LogbookKualitas entries={entries} komoditas={komoditas} pemilikNama={pemilikNama} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Catat Kualitas Air"
        description="Input pengukuran manual dari lapangan. Sistem akan menandai parameter yang di luar batas normal.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={<>pH<InfoHint istilah="ph" /></>} required>
              <Input type="number" step="0.1" min="0" max="14" placeholder="7.5"
                value={form.ph} onChange={ev => setForm(f => ({ ...f, ph: ev.target.value }))} />
            </Field>
            <Field label={<>DO (ppm)<InfoHint istilah="do" /></>} required>
              <Input type="number" step="0.1" min="0" placeholder="5.0"
                value={form.do_ppm} onChange={ev => setForm(f => ({ ...f, do_ppm: ev.target.value }))} />
            </Field>
            <Field label="Suhu (°C)" required>
              <Input type="number" step="0.1" min="0" placeholder="28.0"
                value={form.suhu_celsius} onChange={ev => setForm(f => ({ ...f, suhu_celsius: ev.target.value }))} />
            </Field>
            <Field label={<>Salinitas (ppt)<InfoHint istilah="salinitas" /></>} required>
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

// ── Logbook Kualitas Air (tabel) ───────────────────────────────
// Nilai tiap parameter diberi warna: merah kalau di luar batas
// aman, hijau kalau normal. Strip prioritas di tepi kiri sama seperti
// logbook pakan.
function ParamCell({ value, unit, ok }: { value: number; unit: string; ok: boolean }) {
  return (
    <td className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap', color: ok ? 'var(--color-text-primary)' : 'var(--color-risk-worst)' }}>
      {value}{unit}
    </td>
  )
}

function LogbookKualitas({ entries, komoditas, pemilikNama }: { entries: KualitasWithPencatat[]; komoditas: any; pemilikNama: string | null }) {
  const th = (label: string, nowrap = true) => (
    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-2.5" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: nowrap ? 'nowrap' : undefined }}>{label}</th>
  )
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-muted)' }}>
              <th style={{ width: 4, padding: 0, borderBottom: '1px solid var(--color-border)' }} />
              {th('Tanggal')}{th('pH')}{th('DO')}{th('Suhu')}{th('Salinitas')}{th('Status')}{th('Pencatat')}
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const status = checkKualitas(entry, komoditas)
              const allOk = Object.values(status).every(s => s.ok)
              const nama = entry.pencatat?.nama ?? pemilikNama
              return (
                <tr key={entry.id_kualitas} className="transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: 0, borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ width: 4, minHeight: 44, background: allOk ? 'var(--color-risk-best)' : 'var(--color-risk-worst)' }} />
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{formatTanggal(entry.tanggal)}</td>
                  <ParamCell value={entry.ph} unit="" ok={status.ph?.ok ?? true} />
                  <ParamCell value={entry.do_ppm} unit=" ppm" ok={status.do_ppm?.ok ?? true} />
                  <ParamCell value={entry.suhu_celsius} unit="°C" ok={status.suhu?.ok ?? true} />
                  <ParamCell value={entry.salinitas_ppt} unit=" ppt" ok={status.salinitas?.ok ?? true} />
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    <span className="text-xs font-medium" style={{ color: allOk ? 'var(--color-risk-best)' : 'var(--color-risk-worst)' }}>
                      {allOk ? 'Normal' : 'Ada anomali'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {nama ? (
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'var(--color-ocean-100)', color: 'var(--color-ocean-800)' }}>{initials(nama)}</span>
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{nama}</span>
                      </div>
                    ) : <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 px-5 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 4, borderRadius: 2, background: 'var(--color-risk-best)', display: 'inline-block' }} />Normal</span>
        <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 4, borderRadius: 2, background: 'var(--color-risk-worst)', display: 'inline-block' }} />Ada anomali</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════
type Tab = 'pakan' | 'kualitas' | 'biaya'

export default function OperasionalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { rencana, loading } = useRencanaDetail(id)
  const [tab, setTab] = useState<Tab>('pakan')
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (loading) return
    gsap.from('.detail-section', { y: 12, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
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
  const pemilikNama = (rencana.kolam as any)?.pengguna?.nama ?? null

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
            { key: 'biaya', label: 'Biaya' },
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

        {tab === 'pakan' ? <TabPakan idRencana={id} pemilikNama={pemilikNama} />
          : tab === 'kualitas' ? <TabKualitas idKolam={idKolam} komoditas={rencana.komoditas as any} pemilikNama={pemilikNama} />
          : <TabBiaya idRencana={id} />
        }
      </div>
    </div>
  )
}
