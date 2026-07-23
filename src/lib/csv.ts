// Ekspor CSV sederhana yang ramah Excel. Pakai titik koma sebagai
// pemisah (Excel lokal Indonesia sering pakai ini) dan BOM UTF-8 supaya
// karakter non-ASCII terbaca benar saat dibuka di Excel.
function escapeCell(v: string | number): string {
  const s = String(v ?? '')
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers, ...rows].map(row => row.map(escapeCell).join(';'))
  const content = '﻿' + lines.join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
