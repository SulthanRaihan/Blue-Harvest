'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

// Kamus istilah teknis budidaya. Ditulis untuk petambak yang belum
// tentu familiar dengan singkatan, jadi bahasanya sehari-hari dan
// selalu menyebut kenapa angka itu penting, bukan cuma definisinya.
export const GLOSARIUM = {
  fcr: {
    judul: 'FCR (Feed Conversion Ratio)',
    isi: 'Perbandingan jumlah pakan yang dihabiskan dengan pertambahan bobot ikan atau udang. FCR 1,4 berarti butuh 1,4 kg pakan untuk menambah 1 kg bobot. Makin kecil angkanya, makin hemat pakan Anda.',
  },
  roi: {
    judul: 'ROI (Return on Investment)',
    isi: 'Persentase keuntungan dibanding modal yang dikeluarkan. ROI 50% berarti dari modal Rp10 juta, Anda untung Rp5 juta. Angka minus berarti siklus itu rugi.',
  },
  do: {
    judul: 'DO (Dissolved Oxygen)',
    isi: 'Kadar oksigen yang terlarut di air, satuannya ppm. Ikan dan udang butuh oksigen untuk bernapas. Kalau DO turun di bawah batas, mereka bisa menggerombol di permukaan atau mati.',
  },
  salinitas: {
    judul: 'Salinitas',
    isi: 'Kadar garam dalam air tambak, satuannya ppt. Tiap komoditas punya rentang nyaman sendiri. Udang vaname tahan salinitas tinggi, nila lebih cocok di air tawar atau payau.',
  },
  ph: {
    judul: 'pH Air',
    isi: 'Ukuran asam atau basa air tambak. Terlalu asam atau terlalu basa bikin ikan stres dan gampang sakit. Bisa dinaikkan dengan pengapuran.',
  },
  kepadatan: {
    judul: 'Kepadatan Tebar',
    isi: 'Jumlah benih per meter persegi kolam. Terlalu padat membuat perebutan oksigen dan pakan, mempercepat penyebaran penyakit, dan menekan pertumbuhan.',
  },
  biomassa: {
    judul: 'Biomassa',
    isi: 'Perkiraan total berat seluruh ikan atau udang yang hidup di kolam saat ini. Dihitung dari populasi dikali rata-rata bobot per ekor.',
  },
  kelangsunganHidup: {
    judul: 'Kelangsungan Hidup',
    isi: 'Persentase benih yang masih hidup dibanding jumlah yang ditebar di awal. Angka rendah menandakan ada masalah di kualitas air, pakan, atau penyakit.',
  },
  skorRisiko: {
    judul: 'Skor Risiko',
    isi: 'Hasil penjumlahan dari empat faktor risiko, tiap faktor dihitung Potensi dikali Dampak. Skor sampai 10 tergolong Best Case, 11 sampai 20 Middle Case, di atas 20 Worst Case.',
  },
} as const

export type IstilahKey = keyof typeof GLOSARIUM

export function InfoHint({ istilah, judul, isi }: { istilah?: IstilahKey; judul?: string; isi?: string }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const popRef = useRef<HTMLSpanElement>(null)

  const entry = istilah ? GLOSARIUM[istilah] : null
  const title = judul ?? entry?.judul ?? ''
  const body = isi ?? entry?.isi ?? ''

  useEffect(() => {
    if (!open || !popRef.current) return
    // Sengaja tidak menganimasikan opasitas. Kalau ticker animasi
    // tersendat, tooltip harus tetap terbaca, bukan tertinggal
    // transparan. Gerak posisi saja sudah cukup terasa hidup.
    gsap.fromTo(popRef.current,
      { y: 6, scale: 0.96 },
      { y: 0, scale: 1, duration: 0.22, ease: 'back.out(1.6)' }
    )
  }, [open])

  // Tutup kalau klik di luar, penting untuk pemakaian di HP
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={wrapRef} className="relative inline-flex items-center align-middle" style={{ marginLeft: 4 }}>
      <button
        type="button"
        // Selalu buka saat diklik, jangan toggle. Klik atau tap juga
        // memicu fokus, dan kalau ini toggle maka fokus membuka lalu
        // klik langsung menutup kembali sehingga tooltip tidak pernah
        // terlihat di HP. Menutupnya lewat klik di luar atau Escape.
        onClick={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        aria-label={`Penjelasan ${title}`}
        className="w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0"
        style={{
          background: open ? 'var(--color-ocean-100)' : 'var(--color-surface-muted)',
          color: 'var(--color-ocean-600)',
          border: '1px solid var(--color-border)',
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        i
      </button>
      {open && (
        <span
          ref={popRef}
          role="tooltip"
          className="absolute z-50 block rounded-xl p-3 text-left"
          style={{
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 240,
            background: 'var(--color-ocean-950)',
            boxShadow: 'var(--shadow-dropdown)',
          }}
        >
          <span className="block text-xs font-bold mb-1" style={{ color: 'var(--color-sky-400)' }}>{title}</span>
          <span className="block text-xs leading-relaxed" style={{ color: '#e2e8f0' }}>{body}</span>
        </span>
      )}
    </span>
  )
}
