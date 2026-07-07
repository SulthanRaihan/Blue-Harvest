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
