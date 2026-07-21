'use client'

import { useId, useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import type { KategoriRisiko } from '@/types/database'

gsap.registerPlugin(useGSAP)

// ── Growth Area Chart ──────────────────────────────────────────
// Custom SVG (bukan chart library) — garis "digambar" via GSAP
// stroke-dashoffset, gradient mirip permukaan air sesuai arah
// desain di docs/UI-DESIGN-DIRECTION.md.
interface GrowthPoint {
  minggu_ke: number
  rata_berat_gram: number
}

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const gradId = useId()
  const pathRef = useRef<SVGPathElement>(null)
  const sorted = [...data].sort((a, b) => a.minggu_ke - b.minggu_ke)

  useGSAP(() => {
    const el = pathRef.current
    if (!el) return
    const len = el.getTotalLength()
    gsap.fromTo(
      el,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out', clearProps: 'none' }
    )
  }, { dependencies: [sorted.length] })

  if (sorted.length < 2) return null

  const width = 320
  const height = 110
  const padding = 8
  const maxVal = Math.max(...sorted.map(d => d.rata_berat_gram), 1)
  const stepX = (width - padding * 2) / (sorted.length - 1)

  const points = sorted.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - (d.rata_berat_gram / maxVal) * (height - padding * 2),
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height, display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-sky-400)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-sky-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" strokeWidth="1" />
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path ref={pathRef} d={linePath} fill="none" stroke="var(--color-role-petambak)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-role-petambak)" stroke="#fff" strokeWidth="1.2" />
      ))}
    </svg>
  )
}

// ── Risk Distribution Donut ──────────────────────────────────
const RISK_COLOR: Record<KategoriRisiko, string> = {
  best: 'var(--color-risk-best)',
  middle: 'var(--color-risk-middle)',
  worst: 'var(--color-risk-worst)',
}

export function RiskDonut({ data, size = 88 }: { data: { kategori: KategoriRisiko; jumlah: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.jumlah, 0)
  const r = 15.9
  const circumference = 2 * Math.PI * r
  let cumulative = 0

  if (total === 0) return null

  return (
    <svg width={size} height={size} viewBox="0 0 42 42">
      <circle cx="21" cy="21" r={r} fill="transparent" stroke="var(--color-border)" strokeWidth="6" />
      {data.filter(d => d.jumlah > 0).map(d => {
        const frac = d.jumlah / total
        const dash = frac * circumference
        const offset = -cumulative * circumference
        cumulative += frac
        return (
          <circle
            key={d.kategori}
            cx="21" cy="21" r={r}
            fill="transparent"
            stroke={RISK_COLOR[d.kategori]}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90 21 21)"
          />
        )
      })}
      <text x="21" y="24.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--color-text-primary)">{total}</text>
    </svg>
  )
}

// ── Category Donut (generik) ─────────────────────────────────
// Sama seperti RiskDonut tapi buat kategori apapun (mis. breakdown
// biaya operasional) — bukan cuma kategori risiko. Part-to-whole
// diskrit = donut chart, sesuai kaidah pemilihan chart MIS.
const DONUT_PALETTE = [
  'var(--color-role-petambak)', 'var(--color-role-admin)', 'var(--color-role-owner)',
  'var(--color-risk-middle)', 'var(--color-ocean-400)', 'var(--color-risk-worst)',
]

export function CategoryDonut({ data, size = 88 }: { data: { label: string; jumlah: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.jumlah, 0)
  const r = 15.9
  const circumference = 2 * Math.PI * r
  let cumulative = 0

  if (total === 0) return null

  return (
    <svg width={size} height={size} viewBox="0 0 42 42">
      <circle cx="21" cy="21" r={r} fill="transparent" stroke="var(--color-border)" strokeWidth="6" />
      {data.filter(d => d.jumlah > 0).map((d, i) => {
        const frac = d.jumlah / total
        const dash = frac * circumference
        const offset = -cumulative * circumference
        cumulative += frac
        return (
          <circle
            key={d.label}
            cx="21" cy="21" r={r}
            fill="transparent"
            stroke={DONUT_PALETTE[i % DONUT_PALETTE.length]}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90 21 21)"
          />
        )
      })}
    </svg>
  )
}

export const CATEGORY_DONUT_COLORS = DONUT_PALETTE

// ── Pond-Fill Gauge ────────────────────────────────────────────
// Metafora tambak literal: kotak "kolam" terisi air sesuai persentase
// (dipakai untuk tingkat kelangsungan hidup populasi). Animasi surface
// wave saat load, sesuai arah desain di docs/UI-DESIGN-DIRECTION.md.
export function PondGauge({ percent, label }: { percent: number; label: string }) {
  const uid = useId()
  const rectRef = useRef<SVGRectElement>(null)
  const clamped = Math.max(0, Math.min(100, percent))
  const size = 44
  const boxTop = 4
  const boxBottom = size - 4
  const boxHeight = boxBottom - boxTop
  const fillY = boxBottom - (clamped / 100) * boxHeight
  const fillHeight = boxBottom - fillY

  useGSAP(() => {
    const el = rectRef.current
    if (!el) return
    gsap.fromTo(
      el,
      { attr: { y: boxBottom, height: 0 } },
      { attr: { y: fillY, height: fillHeight }, duration: 1.2, ease: 'power2.out', clearProps: 'none' }
    )
  }, { dependencies: [clamped] })

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <defs>
          <clipPath id={`pond-clip-${uid}`}>
            <rect x="4" y={boxTop} width={size - 8} height={boxHeight} rx="6" />
          </clipPath>
          <linearGradient id={`pond-grad-${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--color-role-petambak)" />
            <stop offset="100%" stopColor="var(--color-sky-400)" />
          </linearGradient>
        </defs>
        <rect x="4" y={boxTop} width={size - 8} height={boxHeight} rx="6" fill="var(--color-ocean-50)" stroke="var(--color-ocean-100)" strokeWidth="1.5" />
        <g clipPath={`url(#pond-clip-${uid})`}>
          <rect ref={rectRef} x="4" y={boxBottom} width={size - 8} height="0" fill={`url(#pond-grad-${uid})`} />
        </g>
      </svg>
      <div>
        <div className="font-black leading-none" style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>
          {clamped.toFixed(0)}%
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}

// ── Water Quality Range Bar ────────────────────────────────────
// Gradasi aman-bahaya dengan penanda posisi nilai saat ini.
// Kalau `max` tidak diisi, dianggap ambang minimum saja (mis. DO).
interface RangeBarProps {
  label: string
  value: number
  unit?: string
  min: number
  max?: number
  ok: boolean
}

// ── Horizontal Bar Chart ───────────────────────────────────────
// Buat perbandingan antar kategori diskrit (bukan tren waktu, bukan
// bagian-dari-keseluruhan) — sesuai kaidah pemilihan chart MIS:
// perbandingan kategori = bar chart, bukan pie/line.
export interface BarDatum {
  label: string
  value: number
  color?: string
}

export function BarChart({ data, unit = '', formatValue }: { data: BarDatum[]; unit?: string; formatValue?: (v: number) => string }) {
  const barRefs = useRef<(SVGRectElement | null)[]>([])
  const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 1)

  useGSAP(() => {
    barRefs.current.forEach((el, i) => {
      if (!el) return
      const targetWidth = el.dataset.targetWidth ?? '0'
      gsap.fromTo(el, { attr: { width: 0 } }, { attr: { width: targetWidth }, duration: 0.8, delay: i * 0.08, ease: 'power2.out' })
    })
  }, { dependencies: [data.map(d => d.value).join(',')] })

  if (data.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => {
        const pct = (Math.abs(d.value) / maxVal) * 100
        const color = d.color ?? 'var(--color-role-petambak)'
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{d.label}</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                {formatValue ? formatValue(d.value) : d.value.toLocaleString('id-ID')}{unit}
              </span>
            </div>
            <svg width="100%" height="10" viewBox="0 0 100 10" preserveAspectRatio="none">
              <rect x="0" y="0" width="100" height="10" rx="4" fill="var(--color-border)" />
              <rect
                ref={el => { barRefs.current[i] = el }}
                data-target-width={pct}
                x="0" y="0" width="0" height="10" rx="4" fill={color}
              />
            </svg>
          </div>
        )
      })}
    </div>
  )
}

export function WaterQualityBar({ label, value, unit = '', min, max, ok }: RangeBarProps) {
  const hasMax = max !== undefined
  const span = hasMax ? max - min : min || 1
  const displayMin = hasMax ? min - span * 0.5 : Math.max(0, min - span * 0.5)
  const displayMax = hasMax ? max + span * 0.5 : min + span

  const pct = (v: number) => {
    const clamped = Math.min(displayMax, Math.max(displayMin, v))
    return ((clamped - displayMin) / (displayMax - displayMin)) * 100
  }

  const safeStart = pct(min)
  const safeEnd = hasMax ? pct(max) : 100
  const valuePos = pct(value)
  const markColor = ok ? 'var(--color-risk-best)' : 'var(--color-risk-worst)'

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: markColor, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--color-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${safeStart}%`, width: `${Math.max(0, safeEnd - safeStart)}%`,
          background: 'var(--color-risk-best-bg)',
        }} />
        <div style={{
          position: 'absolute', top: -2, width: 2, height: 10, borderRadius: 1,
          left: `${valuePos}%`, background: markColor,
        }} />
      </div>
    </div>
  )
}

// ── Dual Line Chart ────────────────────────────────────────────
// Tren 2 seri satuan sama (Rupiah) sepanjang waktu — genuine
// time-series job, jadi line/area, BUKAN bar (kaidah: tren waktu =
// line, bukan perbandingan kategori diskrit). Satu sumbu Y saja,
// tidak ada dual-axis. Legend selalu tampil untuk 2 seri.
export interface DualLinePoint {
  label: string
  a: number
  b: number
}

export function DualLineChart({
  data, labelA, labelB, colorA = 'var(--color-role-owner)', colorB = 'var(--color-risk-middle)', formatValue,
}: {
  data: DualLinePoint[]
  labelA: string
  labelB: string
  colorA?: string
  colorB?: string
  formatValue?: (v: number) => string
}) {
  const pathARef = useRef<SVGPathElement>(null)
  const pathBRef = useRef<SVGPathElement>(null)

  useGSAP(() => {
    for (const ref of [pathARef, pathBRef]) {
      const el = ref.current
      if (!el) continue
      const len = el.getTotalLength()
      gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1, ease: 'power2.out', clearProps: 'none' })
    }
  }, { dependencies: [data.length] })

  if (data.length < 2) return null

  const width = 480, height = 160, padX = 12, padY = 14
  const allVals = data.flatMap(d => [d.a, d.b])
  const maxVal = Math.max(...allVals, 1)
  const stepX = (width - padX * 2) / (data.length - 1)

  const toPoints = (key: 'a' | 'b') => data.map((d, i) => ({
    x: padX + i * stepX,
    y: height - padY - (d[key] / maxVal) * (height - padY * 2),
  }))
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const pointsA = toPoints('a')
  const pointsB = toPoints('b')
  const fmt = formatValue ?? ((v: number) => v.toLocaleString('id-ID'))

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: colorA, display: 'inline-block' }} />{labelA}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: colorB, display: 'inline-block' }} />{labelB}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height, display: 'block' }}>
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="var(--color-border)" strokeWidth="1" />
        <path ref={pathBRef} d={toPath(pointsB)} fill="none" stroke={colorB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path ref={pathARef} d={toPath(pointsA)} fill="none" stroke={colorA} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pointsA.map((p, i) => <circle key={`a${i}`} cx={p.x} cy={p.y} r="3" fill={colorA} stroke="#fff" strokeWidth="1.2" />)}
        {pointsB.map((p, i) => <circle key={`b${i}`} cx={p.x} cy={p.y} r="3" fill={colorB} stroke="#fff" strokeWidth="1.2" />)}
      </svg>
      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
      <div className="sr-only">
        {data.map(d => `${d.label}: ${labelA} ${fmt(d.a)}, ${labelB} ${fmt(d.b)}`).join('. ')}
      </div>
    </div>
  )
}

// ── Delta Badge ────────────────────────────────────────────────
// Indikator arah perubahan (naik/turun %) dibanding periode
// sebelumnya — angka tunggal tanpa pembanding tidak actionable buat
// keputusan Owner, jadi tiap KPI tren perlu ini.
export function DeltaBadge({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null || Number.isNaN(pct)) return null
  const isUp = pct >= 0
  const good = invert ? !isUp : isUp
  const color = good ? 'var(--color-risk-best)' : 'var(--color-risk-worst)'
  const bg = good ? 'var(--color-risk-best-bg)' : 'var(--color-risk-worst-bg)'
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: bg }}>
      {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%
    </span>
  )
}
