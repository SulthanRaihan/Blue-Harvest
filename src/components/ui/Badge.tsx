type RoleType = 'petambak' | 'admin' | 'owner'
type StatusType = 'aktif' | 'tidak_aktif' | 'draft' | 'approved' | 'selesai' | 'pending' | 'selesai_dist'

const ROLE_CONFIG: Record<RoleType, { label: string; color: string; bg: string }> = {
  petambak: { label: 'Petambak', color: '#0369a1', bg: '#e0f2fe' },
  admin:    { label: 'Admin',    color: '#7c3aed', bg: '#ede9fe' },
  owner:    { label: 'Owner',    color: '#0f766e', bg: '#ccfbf1' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aktif:        { label: 'Aktif',         color: '#15803d', bg: '#dcfce7' },
  tidak_aktif:  { label: 'Tidak Aktif',   color: '#6b7280', bg: '#f3f4f6' },
  draft:        { label: 'Draft',         color: '#92400e', bg: '#fef3c7' },
  approved:     { label: 'Approved',      color: '#0369a1', bg: '#e0f2fe' },
  selesai:      { label: 'Selesai',       color: '#15803d', bg: '#dcfce7' },
  pending:      { label: 'Pending',       color: '#92400e', bg: '#fef3c7' },
  selesai_dist: { label: 'Selesai',       color: '#15803d', bg: '#dcfce7' },
}

interface BadgeProps { className?: string }

export function RoleBadge({ role, className = '' }: { role: string } & BadgeProps) {
  const cfg = ROLE_CONFIG[role as RoleType] ?? { label: role, color: '#374151', bg: '#f3f4f6' }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

export function StatusBadge({ status, className = '' }: { status: string } & BadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#374151', bg: '#f3f4f6' }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}
