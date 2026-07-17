import { supabase } from '@/lib/supabase'

export type ActivityType = 'user' | 'kolam' | 'skoring' | 'biaya' | 'persiapan'

export interface ActivityItem {
  id: string
  type: ActivityType
  message: string
  timestamp: string
}

// Tidak ada tabel audit-log terpisah — feed ini murni agregasi
// created_at/tanggal_selesai dari beberapa tabel yang sudah ada,
// digabung & diurutkan client-side. Cukup untuk kebutuhan Admin
// "apa yang baru terjadi di sistem", tanpa infrastruktur baru.
export const activityRepository = {
  async getRecent(limit = 8): Promise<ActivityItem[]> {
    const [penggunaRes, kolamRes, skoringRes, biayaRes, persiapanRes] = await Promise.all([
      supabase.from('pengguna').select('id_pengguna, nama, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('kolam').select('id_kolam, nama_kolam, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('skoring_risiko')
        .select('id_skoring, kategori, created_at, rencana_tebar(kolam(nama_kolam))')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('biaya_operasional')
        .select('id_biaya, kategori, jumlah_rp, created_at, rencana_tebar(kolam(nama_kolam))')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('persiapan_kolam')
        .select('id_persiapan, item, tanggal_selesai, kolam(nama_kolam)')
        .eq('selesai', true).not('tanggal_selesai', 'is', null)
        .order('tanggal_selesai', { ascending: false }).limit(5),
    ])

    const items: ActivityItem[] = []

    for (const p of (penggunaRes.data ?? []) as any[]) {
      items.push({ id: `user-${p.id_pengguna}`, type: 'user', message: `Pengguna baru terdaftar: ${p.nama}`, timestamp: p.created_at })
    }
    for (const k of (kolamRes.data ?? []) as any[]) {
      items.push({ id: `kolam-${k.id_kolam}`, type: 'kolam', message: `Kolam baru ditambahkan: ${k.nama_kolam}`, timestamp: k.created_at })
    }
    for (const s of (skoringRes.data ?? []) as any[]) {
      const nama = s.rencana_tebar?.kolam?.nama_kolam ?? '—'
      const label = s.kategori === 'best' ? 'Best Case' : s.kategori === 'middle' ? 'Middle Case' : 'Worst Case'
      items.push({ id: `skoring-${s.id_skoring}`, type: 'skoring', message: `Skoring risiko baru di ${nama}: ${label}`, timestamp: s.created_at })
    }
    for (const b of (biayaRes.data ?? []) as any[]) {
      const nama = b.rencana_tebar?.kolam?.nama_kolam ?? '—'
      items.push({ id: `biaya-${b.id_biaya}`, type: 'biaya', message: `Biaya dicatat di ${nama}: Rp${Number(b.jumlah_rp).toLocaleString('id-ID')}`, timestamp: b.created_at })
    }
    for (const p of (persiapanRes.data ?? []) as any[]) {
      const nama = p.kolam?.nama_kolam ?? '—'
      items.push({ id: `persiapan-${p.id_persiapan}`, type: 'persiapan', message: `Persiapan tambak selesai di ${nama}`, timestamp: p.tanggal_selesai })
    }

    return items
      .filter(i => !!i.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  },
}
