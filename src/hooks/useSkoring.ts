'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { faktorRepository } from '@/lib/repositories/faktor.repository'
import { skoringRepository, type SkoringResult } from '@/lib/repositories/skoring.repository'
import type { FaktorRisiko, KategoriRisiko, NamaFaktor } from '@/types/database'

interface FaktorValue {
  nilai_potensi: number
  nilai_dampak: number
}

export function hitungKategori(total: number): KategoriRisiko {
  if (total <= 10) return 'best'
  if (total <= 20) return 'middle'
  return 'worst'
}

export const KATEGORI_LABEL: Record<KategoriRisiko, string> = {
  best:   'BEST CASE',
  middle: 'MIDDLE CASE',
  worst:  'WORST CASE',
}

export const NILAI_LABEL: Record<number, string> = {
  1: 'Sangat Rendah',
  2: 'Rendah',
  3: 'Sedang',
  4: 'Tinggi',
  5: 'Sangat Tinggi',
}

export const FAKTOR_META: Record<string, { label: string; desc: string }> = {
  hama:  { label: 'Hama dan Penyakit',   desc: 'Potensi serangan hama, wabah penyakit ikan/udang, dan kondisi kesehatan kolam.' },
  cuaca: { label: 'Cuaca dan Iklim',     desc: 'Risiko perubahan cuaca ekstrem, musim hujan/kemarau, dan dampak iklim terhadap budidaya.' },
  pasar: { label: 'Pasar dan Harga',     desc: 'Fluktuasi harga komoditas, ketersediaan pasar, dan risiko tidak terserap pasar.' },
  sdm:   { label: 'Operasional / SDM',   desc: 'Kemampuan tenaga kerja, ketersediaan sarana operasional, dan risiko human error.' },
}

// ── DSS: insight/kesimpulan naratif ────────────────────────────
// Rule-based (bukan panggilan AI lagi) — mensintesis skor yang SUDAH
// dihitung jadi rekomendasi naratif. Ini komponen DSS: model + insight,
// keputusan akhir tetap di tangan Owner/Petambak.
export interface SkoringInsight {
  ringkasan: string
  faktorUtama: { label: string; skor: number } | null
  rekomendasi: string
}

const REKOMENDASI: Record<KategoriRisiko, string> = {
  best:   'Risiko rendah pada seluruh faktor. Rencana ini bisa dilanjutkan dengan pengawasan operasional standar.',
  middle: 'Ada faktor risiko yang perlu mitigasi spesifik sebelum tebar benih — bukan berarti dibatalkan, tapi siapkan langkah antisipasi untuk faktor dengan skor tertinggi.',
  worst:  'Risiko tinggi pada satu atau lebih faktor sekaligus. Disarankan meninjau ulang rencana (kurangi kepadatan tebar, tunda waktu tebar, atau siapkan mitigasi khusus) sebelum modal dikeluarkan.',
}

export function generateInsight(
  details: { nama_faktor: NamaFaktor; skor_hasil: number }[],
  total: number,
  kategori: KategoriRisiko
): SkoringInsight {
  if (details.length === 0 || total === 0) {
    return { ringkasan: '', faktorUtama: null, rekomendasi: '' }
  }

  const urutan = [...details].sort((a, b) => b.skor_hasil - a.skor_hasil)
  const tertinggi = urutan[0]
  const faktorUtama = tertinggi && tertinggi.skor_hasil > 0
    ? { label: FAKTOR_META[tertinggi.nama_faktor]?.label ?? tertinggi.nama_faktor, skor: tertinggi.skor_hasil }
    : null

  const ringkasan = faktorUtama
    ? `Total skor ${total} (${KATEGORI_LABEL[kategori]}) — kontributor terbesar adalah faktor ${faktorUtama.label} dengan skor ${faktorUtama.skor}.`
    : `Total skor ${total} (${KATEGORI_LABEL[kategori]}).`

  return { ringkasan, faktorUtama, rekomendasi: REKOMENDASI[kategori] }
}

export function useSkoring(idRencana: string) {
  const [faktor, setFaktor]   = useState<FaktorRisiko[]>([])
  const [result, setResult]   = useState<SkoringResult | null>(null)
  const [values, setValues]   = useState<Record<string, FaktorValue>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [faktors, existing] = await Promise.all([
        faktorRepository.getAll(),
        skoringRepository.getByRencana(idRencana),
      ])
      setFaktor(faktors)
      setResult(existing)
      const init: Record<string, FaktorValue> = {}
      faktors.forEach(f => { init[f.id_faktor] = { nilai_potensi: 1, nilai_dampak: 1 } })
      setValues(init)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data skoring')
    } finally {
      setLoading(false)
    }
  }, [idRencana])

  useEffect(() => { fetch() }, [fetch])

  const setNilai = (idFaktor: string, field: 'nilai_potensi' | 'nilai_dampak', val: number) => {
    setValues(prev => ({ ...prev, [idFaktor]: { ...prev[idFaktor], [field]: val } }))
  }

  const liveDetails = useMemo(() =>
    faktor.map(f => {
      const v = values[f.id_faktor] ?? { nilai_potensi: 1, nilai_dampak: 1 }
      return { ...f, ...v, skor_hasil: v.nilai_potensi * v.nilai_dampak }
    }),
  [faktor, values])

  const liveTotal    = useMemo(() => liveDetails.reduce((s, d) => s + d.skor_hasil, 0), [liveDetails])
  const liveKategori = useMemo(() => hitungKategori(liveTotal), [liveTotal])
  const liveInsight  = useMemo(
    () => generateInsight(liveDetails.map(d => ({ nama_faktor: d.nama_faktor, skor_hasil: d.skor_hasil })), liveTotal, liveKategori),
    [liveDetails, liveTotal, liveKategori]
  )

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await skoringRepository.create({
        id_rencana: idRencana,
        faktor: faktor.map(f => ({
          id_faktor:     f.id_faktor,
          nilai_potensi: values[f.id_faktor]?.nilai_potensi ?? 1,
          nilai_dampak:  values[f.id_faktor]?.nilai_dampak  ?? 1,
        })),
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan skoring')
    } finally {
      setSaving(false)
    }
  }

  return {
    faktor, result, values, liveDetails, liveTotal, liveKategori, liveInsight,
    loading, saving, error,
    setNilai, submit, refresh: fetch,
  }
}
