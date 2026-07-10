'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useKolamDetail } from '@/hooks/useKolam'
import { usePersiapan, PERSIAPAN_LABEL } from '@/hooks/usePersiapan'
import { uploadFoto } from '@/lib/storage'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ItemPersiapan } from '@/types/database'

gsap.registerPlugin(useGSAP)

// ── Checklist item row ──────────────────────────────────────────
function PersiapanRow({
  item, selesai, catatan, fotoUrl, onToggle, onUpload, uploading,
}: {
  item: ItemPersiapan
  selesai: boolean
  catatan: string | null
  fotoUrl: string | null
  onToggle: (val: boolean) => void
  onUpload: (file: File) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => onToggle(!selesai)}
        className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
        style={{
          background: selesai ? 'var(--color-risk-best)' : 'transparent',
          border: `1.5px solid ${selesai ? 'var(--color-risk-best)' : 'var(--color-border)'}`,
        }}
        aria-label={selesai ? 'Tandai belum selesai' : 'Tandai selesai'}
      >
        {selesai && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: selesai ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', textDecoration: selesai ? 'none' : 'none' }}>
          {PERSIAPAN_LABEL[item]}
        </div>
        {catatan && <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{catatan}</div>}

        <div className="flex items-center gap-2 mt-2">
          {fotoUrl && (
            <a href={fotoUrl} target="_blank" rel="noreferrer" className="block">
              <img src={fotoUrl} alt={PERSIAPAN_LABEL[item]} className="rounded-lg object-cover" style={{ width: 48, height: 48 }} />
            </a>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: 'var(--color-ocean-50)', color: 'var(--color-ocean-700)' }}
          >
            {uploading ? 'Mengunggah...' : fotoUrl ? 'Ganti Foto' : '+ Foto'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
          />
        </div>
      </div>
    </div>
  )
}

export default function KolamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { kolam, loading: loadKolam } = useKolamDetail(id)
  const { checklist, progress, loading: loadPersiapan, toggle, setFoto } = usePersiapan(id)
  const [uploadingItem, setUploadingItem] = useState<ItemPersiapan | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (loadKolam) return
    gsap.from('.detail-section', { y: 12, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' })
  }, { scope: pageRef, dependencies: [loadKolam] })

  const handleUpload = async (item: ItemPersiapan, file: File) => {
    setUploadingItem(item)
    setUploadError(null)
    try {
      const url = await uploadFoto(`persiapan/${id}/${item}`, file)
      await setFoto(item, url)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Gagal mengunggah foto')
    } finally {
      setUploadingItem(null)
    }
  }

  if (loadKolam) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton height={24} width={200} />
        <Skeleton height={100} rounded="rounded-2xl" />
        <Skeleton height={300} rounded="rounded-2xl" />
      </div>
    )
  }

  if (!kolam) {
    return (
      <div className="px-5 py-6 lg:px-8 max-w-2xl mx-auto">
        <div className="card p-5 text-sm" style={{ color: 'var(--color-risk-worst)' }}>Kolam tidak ditemukan.</div>
      </div>
    )
  }

  return (
    <div ref={pageRef} className="px-5 py-6 lg:px-8 max-w-2xl mx-auto">
      <div className="detail-section mb-5">
        <Link href="/pengguna"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-3"
          style={{ color: 'var(--color-text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Kembali ke Kelola Kolam
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{kolam.nama_kolam}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {kolam.luas_ha} ha{kolam.lokasi ? ` · ${kolam.lokasi}` : ''} · {kolam.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
        </p>
      </div>

      <div className="detail-section card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Persiapan Tambak</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Checklist sebelum tebar benih — bersifat informasional, tidak menghalangi pembuatan rencana tebar
            </div>
          </div>
          {!loadPersiapan && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{
                background: progress.done === progress.total ? 'var(--color-risk-best-bg)' : 'var(--color-ocean-50)',
                color: progress.done === progress.total ? 'var(--color-risk-best)' : 'var(--color-ocean-700)',
              }}>
              {progress.done}/{progress.total}
            </span>
          )}
        </div>

        {uploadError && (
          <div className="px-5 py-3 text-sm" style={{ background: 'var(--color-risk-worst-bg)', color: 'var(--color-risk-worst)' }}>
            {uploadError}
          </div>
        )}

        {loadPersiapan ? (
          <div className="p-5"><Skeleton height={200} /></div>
        ) : (
          checklist.map(c => (
            <PersiapanRow
              key={c.item}
              item={c.item}
              selesai={c.selesai}
              catatan={c.catatan}
              fotoUrl={c.foto_url}
              uploading={uploadingItem === c.item}
              onToggle={val => toggle(c.item, val)}
              onUpload={file => handleUpload(c.item, file)}
            />
          ))
        )}
      </div>
    </div>
  )
}
