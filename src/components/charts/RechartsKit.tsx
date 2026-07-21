'use client'

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'

// Palet konsisten dengan token aplikasi. Recharts menerima string CSS
// apa pun untuk stroke/fill, termasuk var(), tapi untuk gradient perlu
// warna eksplisit jadi kita pakai hex yang sama dengan token.
const COLOR = {
  owner: '#0f766e',
  middle: '#d97706',
  ocean: '#1560a0',
  grid: '#e2e8f0',
  axis: '#64748b',
  best: '#16a34a',
  worst: '#dc2626',
}

const axisTick = { fontSize: 11, fill: COLOR.axis }

// ── Tooltip bertema ────────────────────────────────────────────
function ThemedTooltip({ active, payload, label, formatValue }: any) {
  if (!active || !payload || payload.length === 0) return null
  const fmt = formatValue ?? ((v: number) => v.toLocaleString('id-ID'))
  return (
    <div style={{
      background: 'var(--color-surface-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-dropdown)',
      padding: '10px 12px',
      minWidth: 140,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginTop: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}>{p.name}</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Tren Area Chart (2 seri, satu sumbu) ───────────────────────
export interface TrenPoint {
  bulan: string
  pendapatan: number
  biaya: number
}

export function TrenAreaChart({ data, formatValue }: { data: TrenPoint[]; formatValue?: (v: number) => string }) {
  const compact = formatValue ?? ((v: number) => v.toLocaleString('id-ID'))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-pendapatan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR.owner} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLOR.owner} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-biaya" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR.middle} stopOpacity={0.28} />
            <stop offset="100%" stopColor={COLOR.middle} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR.grid} vertical={false} />
        <XAxis dataKey="bulan" tick={axisTick} tickLine={false} axisLine={{ stroke: COLOR.grid }} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={48} tickFormatter={compact} />
        <Tooltip content={<ThemedTooltip formatValue={formatValue} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
        <Area type="monotone" dataKey="pendapatan" name="Pendapatan" stroke={COLOR.owner} strokeWidth={2.5} fill="url(#grad-pendapatan)" dot={{ r: 3, fill: COLOR.owner }} activeDot={{ r: 5 }} />
        <Area type="monotone" dataKey="biaya" name="Biaya" stroke={COLOR.middle} strokeWidth={2} fill="url(#grad-biaya)" dot={{ r: 3, fill: COLOR.middle }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Perbandingan Bar Chart (kategori diskrit) ──────────────────
export interface BarPoint {
  label: string
  value: number
  fill?: string
}

export function PerbandinganBarChart({ data, unit = '', formatValue, height = 220 }: {
  data: BarPoint[]
  unit?: string
  formatValue?: (v: number) => string
  height?: number
}) {
  const compact = formatValue ?? ((v: number) => v.toLocaleString('id-ID'))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR.grid} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: COLOR.grid }} interval={0} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={48} tickFormatter={compact} />
        <Tooltip
          cursor={{ fill: 'rgba(21,96,160,0.06)' }}
          content={<ThemedTooltip formatValue={(v: number) => `${compact(v)}${unit}`} />}
        />
        <Bar dataKey="value" name="Nilai" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill ?? COLOR.ocean} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
