import { supabase } from '@/lib/supabase'
import type { PersiapanKolam, ItemPersiapan } from '@/types/database'

export const PERSIAPAN_ITEMS: ItemPersiapan[] = [
  'pengeringan', 'pengapuran', 'perbaikan_pematang', 'pengisian_air', 'pemupukan', 'cek_kualitas_air',
]

export const persiapanRepository = {
  async getByKolam(idKolam: string): Promise<PersiapanKolam[]> {
    const { data, error } = await supabase
      .from('persiapan_kolam')
      .select('*')
      .eq('id_kolam', idKolam)
    if (error) throw error
    return data as PersiapanKolam[]
  },

  // Upsert per item (unik per id_kolam+item) — toggle selesai, catatan, foto.
  async upsertItem(idKolam: string, item: ItemPersiapan, updates: Partial<Pick<PersiapanKolam, 'selesai' | 'catatan' | 'foto_url' | 'tanggal_selesai'>>): Promise<PersiapanKolam> {
    const { data, error } = await supabase
      .from('persiapan_kolam')
      .upsert(
        { id_kolam: idKolam, item, ...updates },
        { onConflict: 'id_kolam,item' }
      )
      .select()
      .single()
    if (error) throw error
    return data as PersiapanKolam
  },
}
