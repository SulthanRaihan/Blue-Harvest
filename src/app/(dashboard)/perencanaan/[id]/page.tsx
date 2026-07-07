'use client'

import { useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRencanaDetail } from '@/hooks/useRencana'
import { useSkoring, FAKTOR_META, KATEGORI_LABEL, NILAI_LABEL, hitungKategori } from '@/hooks/useSkoring'
import { useAuth } from '@/hooks/useAuth'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { KategoriRisiko, NamaKomoditas, NamaFaktor } from '@/types/database'

gsap.registerPlugin(useGSAP)

// ── Helpers ───────────────────────────────────────────────────
const KOMODITAS_LABEL: Record<NamaKomoditas, string> = {
  bandeng:      'Ikan Bandeng',
  nila:         'Ikan Nila',
  udang_vaname: 'Udang Vaname',
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Kategori visual config ─────────────────────────────────────
const KATEGORI_CONFIG: Record<KategoriRisiko, {
  color: string; bg: string; border: string; desc: string; skor: string
}> = {
  best: {
    color:  'var(--color-risk-best)',
    bg:     'var(--color-risk-best-bg)',
    border: '#bbf7d0',
    desc:   'Risiko rendah — budidaya dapat dilanjutkan dengan pengawasan rutin.',
    skor:   '≤ 10',
  },
  middle: {
    color:  'var(--color-risk-middle)',
    bg:     'var(--color-risk-middle-bg)',
    border: '#fde68a',
    desc:   'Risiko sedang — siapkan langkah mitigasi sebelum tebar benih.',
    skor:   '11 – 20',
  },
  worst: {
    color:  'var(--color-risk-worst)',
    bg:     'var(--color-risk-worst-bg)',
    border: '#fca5a5',
    desc:   'Risiko tinggi — tinjau ulang rencana atau tunda pelaksanaan.',
    skor:   '> 20',
  },
}

// ── Score pill button ─────────────────────────────────────────
function ScorePill({ value, selected, onClick }: {
  value: number; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-xl text-sm font-bold transition-all duration-150"
      style={{
        background: selected ? 'var(--color-ocean-900)' : 'var(--color-ocean-50)',
        color:      selected ? '#fff' : 'var(--color-ocean-600)',
        border:     selected ? '2px solid var(--color-ocean-900)' : '2px solid transparent',
        transform:  selected ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      {value}
    </button>
  )
}

// ── Risk Meter ────────────────────────────────────────────────
function RiskMeter({ total, kategori }: { total: number; kategori: KategoriRisiko }) {
  const maxSkor = 25 * 4  // 5×5 per 4 faktor = 100 teoretis, tapi realnya 4–20 rata2
  const pct     = Math.min((total / 40) * 100, 100)
  const cfg     = KATEGORI_CONFIG[kategori]

  return (
    <div className="rounded-2xl p-5" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-medium mb-0.5" style={{ color: cfg.color }}>Kategori Risiko</div>
          <div className="text-xl font-black" style={{ color: cfg.color }}>
            {KATEGORI_LABEL[kategori]}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: cfg.color }}>Total Skor</div>
          <div className="text-3xl font-black" style={{ color: cfg.color }}>{total}</div>
          <div className="text-xs" style={{ color: cfg.color, opacity: 0.7 }}>dari {maxSkor} maks</div>
        </div>
      </div>
      {/* Bar */}
      <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.5)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: cfg.color }} />
      </div>
      {/* Range markers */}
      <div className="flex text-xs justify-between" style={{ color: cfg.color, opacity: 0.7 }}>
        <span>BEST ≤10</span>
        <span>MIDDLE 11–20</span>
        <span>WORST &gt;20</span>
      </div>
      <p className="text-xs mt-3 font-medium" style={{ color: cfg.color }}>{cfg.desc}</p>
    </div>
  )
}

// ── Faktor card (input) ────────────────────────────────────────
function FaktorInputCard({
  faktor, nilai_potensi, nilai_dampak, skor_hasil, onSet, alasan,
}: {
  faktor: { id_faktor: string; nama_faktor: string; deskripsi: string }
  nilai_potensi: number
  nilai_dampak: number
  skor_hasil: number
  onSet: (field: 'nilai_potensi' | 'nilai_dampak', val: number) => void
  alasan?: string
}) {
  const meta = FAKTOR_META[faktor.nama_faktor as NamaFaktor] ?? { label: faktor.nama_faktor, desc: faktor.deskripsi }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{meta.label}</div>
          <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{meta.desc}</div>
        </div>
        <div className="shrink-0 ml-4 text-right">
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Skor</div>
          <div className="text-2xl font-black" style={{ color: 'var(--color-ocean-800)' }}>{skor_hasil}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {/* Nilai Potensi */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Nilai Potensi
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {NILAI_LABEL[nilai_potensi]}
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <ScorePill key={v} value={v} selected={nilai_potensi === v}
                onClick={() => onSet('nilai_potensi', v)} />
            ))}
          </div>
        </div>

        {/* Nilai Dampak */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Nilai Dampak
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {NILAI_LABEL[nilai_dampak]}
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <ScorePill key={v} value={v} selected={nilai_dampak === v}
                onClick={() => onSet('nilai_dampak', v)} />
            ))}
          </div>
        </div>

        {/* Formula */}
        <div className="flex items-center gap-2 text-xs pt-1" style={{ color: 'var(--color-text-muted)' }}>
          <span>{nilai_potensi}</span>
          <span>×</span>
          <span>{nilai_dampak}</span>
          <span>=</span>
          <span className="font-bold" style={{ color: 'var(--color-ocean-700)' }}>{skor_hasil}</span>
        </div>

        {/* AI alasan hint */}
        {alasan && (
          <div className="flex items-start gap-2 mt-2 pt-2 text-xs rounded-lg px-3 py-2"
            style={{ background: 'var(--color-ocean-50)', borderLeft: '3px solid var(--color-ocean-300)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"
              style={{ color: 'var(--color-ocean-500)' }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            <span style={{ color: 'var(--color-ocean-700)' }}>{alasan}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Faktor result card (readonly) ─────────────────────────────
function FaktorResultCard({ detail }: {
  detail: {
    nama_faktor?: string
    faktor_risiko?: { nama_faktor: string; deskripsi: string }
    nilai_potensi: number
    nilai_dampak: number
    skor_hasil: number
  }
}) {
  const namaFaktor = detail.faktor_risiko?.nama_faktor ?? detail.nama_faktor ?? ''
  const meta = FAKTOR_META[namaFaktor] ?? { label: namaFaktor, desc: '' }

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{meta.label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Potensi {detail.nilai_potensi} × Dampak {detail.nilai_dampak}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-black" style={{ color: 'var(--color-ocean-800)' }}>{detail.skor_hasil}</div>
        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>skor</div>
      </div>
    </div>
  )
}

// ── Info chip ──────────────────────────────────────────────────
function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════
export default function RencanaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user, role } = useAuth()
  const pageRef = useRef<HTMLDivElement>(null)

  const { rencana, loading: loadRencana, error: errRencana, approve, updateStatus } = useRencanaDetail(id)
  const {
    faktor, result, values, liveDetails, liveTotal, liveKategori,
    loading: loadSkoring, saving, error: errSkoring, setNilai, submit,
  } = useSkoring(id)

  const isOwner    = role === 'owner'
  const canApprove = isOwner && rencana?.status === 'draft' && !!result
  const canActivate = (role === 'admin' || role === 'petambak') && rencana?.status === 'approved'

  // ── AI scoring suggestion ─────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSaran, setAiSaran]     = useState<Record<string, string>>({}) // nama_faktor → alasan
  const [aiError, setAiError]     = useState<string | null>(null)

  async function handleAiSuggest() {
    if (!rencana) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/scoring-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          komoditas:       rencana.komoditas?.nama ?? 'bandeng',
          luas_ha:         rencana.kolam?.luas_ha ?? 1,
          jumlah_benih:    rencana.jumlah_benih,
          modal_rp:        rencana.modal_rp,
          tanggal_rencana: rencana.tanggal_rencana,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal terhubung ke AI' }))
        throw new Error(err.error ?? 'Gagal terhubung ke AI')
      }
      const data = await res.json()
      // Pre-fill nilai for each faktor
      data.saran?.forEach((s: { nama_faktor: string; nilai_potensi: number; nilai_dampak: number; alasan: string }) => {
        const match = faktor.find(f => f.nama_faktor === s.nama_faktor)
        if (match) {
          setNilai(match.id_faktor, 'nilai_potensi', s.nilai_potensi)
          setNilai(match.id_faktor, 'nilai_dampak',  s.nilai_dampak)
        }
      })
      // Store alasan per faktor
      const saran: Record<string, string> = {}
      data.saran?.forEach((s: { nama_faktor: string; alasan: string }) => { saran[s.nama_faktor] = s.alasan })
      setAiSaran(saran)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setAiLoading(false)
    }
  }

  useGSAP(() => {
    if (loadRencana || loadSkoring) return
    gsap.from('.detail-section', {
      y: 16, opacity: 0, stagger: 0.1, duration: 0.45,
      ease: 'power2.out', clearProps: 'opacity,transform',
    })
  }, { scope: pageRef, dependencies: [loadRencana, loadSkoring] })

  if (loadRencana) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-3xl mx-auto flex flex-col gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} height={80} rounded="rounded-2xl" />)}
      </div>
    )
  }

  if (errRencana || !rencana) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-3xl mx-auto">
        <div className="card p-6 text-sm" style={{ color: 'var(--color-risk-worst)' }}>
          {errRencana ?? 'Rencana tidak ditemukan.'}
        </div>
      </div>
    )
  }

  const komoditas = rencana.komoditas?.nama ? KOMODITAS_LABEL[rencana.komoditas.nama] : '—'

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 max-w-3xl mx-auto">
      {/* Back + header */}
      <div className="detail-section mb-6">
        <Link href="/perencanaan"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ocean-700)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali ke Daftar
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {rencana.kolam?.nama_kolam ?? 'Detail Rencana'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {komoditas} · {formatTanggal(rencana.tanggal_rencana)}
            </p>
          </div>
          <StatusBadge status={rencana.status} />
        </div>
      </div>

      {/* Info chips */}
      <div className="detail-section grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <InfoChip label="Kolam" value={rencana.kolam?.nama_kolam ?? '—'} />
        <InfoChip label="Komoditas" value={komoditas} />
        <InfoChip label="Modal" value={formatRupiah(rencana.modal_rp)} />
        <InfoChip label="Jumlah Benih" value={`${rencana.jumlah_benih.toLocaleString('id-ID')} ekor`} />
      </div>

      {/* ── Scoring section ── */}
      {loadSkoring ? (
        <div className="flex flex-col gap-4 mb-6">
          {[1, 2].map(i => <Skeleton key={i} height={120} rounded="rounded-2xl" />)}
        </div>
      ) : result ? (
        /* ── Already scored: show result ── */
        <>
          <div className="detail-section mb-4">
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Hasil Skoring Risiko
            </h2>
            <RiskMeter total={result.skoring.total_skor} kategori={result.skoring.kategori} />
          </div>

          <div className="detail-section mb-6">
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Rincian Per Faktor
            </h2>
            <div className="flex flex-col gap-3">
              {result.details.map(d => (
                <FaktorResultCard key={d.id_detail} detail={d as any} />
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ── No scoring yet: input form ── */
        <>
          <div className="detail-section mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Skoring Risiko
              </h2>
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}>
                Belum diisi
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Nilai Potensi = seberapa besar kemungkinan terjadi (1–5). Nilai Dampak = seberapa besar pengaruhnya (1–5). Skor = Potensi × Dampak.
            </p>

            {/* AI suggest button */}
            <button
              onClick={handleAiSuggest}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mb-4 transition-all disabled:opacity-60"
              style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)', border: '1.5px dashed var(--color-ocean-300)' }}>
              {aiLoading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Menganalisis dengan AI...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10"/>
                    <path d="M12 8v4l3 3"/>
                    <circle cx="18" cy="5" r="3"/>
                  </svg>
                  Bantu Isi dengan AI
                </>
              )}
            </button>
            {aiError && (
              <div className="text-xs mb-3 px-3 py-2 rounded-lg"
                style={{ background: 'var(--color-risk-worst-bg)', color: 'var(--color-risk-worst)' }}>
                {aiError}
              </div>
            )}

            {/* Live meter */}
            <RiskMeter total={liveTotal} kategori={liveKategori} />
          </div>

          {/* Factor input cards */}
          <div className="detail-section flex flex-col gap-4 mb-5">
            {faktor.length === 0 ? (
              <div className="card p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Data faktor risiko belum tersedia. Pastikan tabel faktor_risiko sudah terisi.
              </div>
            ) : (
              liveDetails.map(d => (
                <FaktorInputCard
                  key={d.id_faktor}
                  faktor={{ id_faktor: d.id_faktor, nama_faktor: d.nama_faktor, deskripsi: d.deskripsi }}
                  nilai_potensi={d.nilai_potensi}
                  nilai_dampak={d.nilai_dampak}
                  skor_hasil={d.skor_hasil}
                  onSet={(field, val) => setNilai(d.id_faktor, field, val)}
                  alasan={aiSaran[d.nama_faktor]}
                />
              ))
            )}
          </div>

          {errSkoring && (
            <div className="text-xs mb-3 px-1" style={{ color: 'var(--color-risk-worst)' }}>{errSkoring}</div>
          )}

          {/* Submit */}
          {faktor.length > 0 && (
            <div className="detail-section">
              <button
                onClick={submit}
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                style={{ background: 'var(--color-ocean-900)', color: '#fff', boxShadow: '0 4px 16px rgba(11,45,78,0.25)' }}>
                {saving ? 'Menyimpan...' : `Simpan Skoring — ${KATEGORI_LABEL[liveKategori]} (${liveTotal})`}
              </button>
              <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Setelah skoring disimpan, Owner dapat melakukan approval rencana ini.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Owner action bar ── */}
      {canApprove && (
        <div className="detail-section mt-4 card p-4">
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Approval Rencana
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Skoring risiko telah diisi. Sebagai Owner, Anda dapat menyetujui atau menolak rencana ini.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => approve(user!.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--color-risk-best)', color: '#fff' }}>
              Setujui Rencana
            </button>
            <button
              onClick={() => updateStatus('draft')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ border: '1px solid var(--color-risk-worst)', color: 'var(--color-risk-worst)', background: 'var(--color-risk-worst-bg)' }}>
              Tolak / Revisi
            </button>
          </div>
        </div>
      )}

      {/* ── Activate button (after approved) ── */}
      {canActivate && (
        <div className="detail-section mt-4 card p-4">
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Mulai Siklus Budidaya
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Rencana telah disetujui. Aktifkan siklus untuk mulai mencatat operasional harian.
          </p>
          <button
            onClick={() => updateStatus('aktif')}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--color-ocean-900)', color: '#fff' }}>
            Aktifkan Siklus Budidaya
          </button>
        </div>
      )}
    </div>
  )
}
