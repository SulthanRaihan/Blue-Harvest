interface IconProps {
  className?: string
  size?: number
  strokeWidth?: number
}

const stroke = (w = 1.75) => ({
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function IconDashboard({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconPlanning({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

export function IconOperational({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  )
}

export function IconSampling({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-5 4 3 4-6" />
    </svg>
  )
}

export function IconHarvest({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path d="M12 12v4M10 14h4" />
    </svg>
  )
}

export function IconDistribution({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <path d="M16 11v-2M9 15h3M9 18h2" />
    </svg>
  )
}

export function IconReport({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  )
}

export function IconUsers({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

export function IconLogOut({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function IconChevronRight({ size = 16, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function IconPond({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  )
}

export function IconCycle({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  )
}

export function IconApproval({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  )
}

export function IconScale({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M12 3v18M3 12h18" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

export function IconMenu({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  )
}

export function IconX({ size = 20, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke(strokeWidth)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
