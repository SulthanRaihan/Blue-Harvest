'use client'

import type { ReactNode } from 'react'

// Tabel bersih ala Notion: header muted, garis pemisah baris tipis,
// hover halus, dan selalu bisa di-scroll horizontal di layar sempit
// supaya body halaman tidak pernah melebar.
export interface Column<T> {
  key: string
  header: ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  empty?: ReactNode
}

export function Table<T>({ columns, data, rowKey, onRowClick, empty }: TableProps<T>) {
  const alignCls = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
      <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 480 }}>
        <thead>
          <tr style={{ background: 'var(--color-surface-muted)' }}>
            {columns.map(c => (
              <th
                key={c.key}
                className={`text-xs font-semibold uppercase tracking-wide px-4 py-2.5 ${alignCls(c.align)}`}
                style={{ color: 'var(--color-text-muted)', width: c.width, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {empty ?? 'Belum ada data'}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className="transition-colors"
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map(c => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 text-sm ${alignCls(c.align)}`}
                    style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
