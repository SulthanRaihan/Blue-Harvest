import { supabase } from '@/lib/supabase'
import type { KualitasAir } from '@/types/database'

export type KualitasWithPencatat = KualitasAir & {
  pencatat?: { nama: string } | null
}

export const kualitasRepository = {
  async getByKolam(idKolam: string, limit = 30): Promise<KualitasWithPencatat[]> {
    const { data, error } = await supabase
      .from('kualitas_air')
      .select('*, pencatat:pengguna!dicatat_oleh(nama)')
      .eq('id_kolam', idKolam)
      .order('tanggal', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as KualitasWithPencatat[]
  },

  async create(entry: Omit<KualitasAir, 'id_kualitas' | 'dicatat_oleh'>): Promise<KualitasAir> {
    const { data, error } = await supabase
      .from('kualitas_air')
      .insert(entry)
      .select()
      .single()
    if (error) throw error
    return data as KualitasAir
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('kualitas_air')
      .delete()
      .eq('id_kualitas', id)
    if (error) throw error
  },
}
