import { supabase } from '@/lib/supabase'
import type { KualitasAir } from '@/types/database'

export const kualitasRepository = {
  async getByKolam(idKolam: string, limit = 30): Promise<KualitasAir[]> {
    const { data, error } = await supabase
      .from('kualitas_air')
      .select('*')
      .eq('id_kolam', idKolam)
      .order('timestamp', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as KualitasAir[]
  },

  async create(entry: Omit<KualitasAir, 'id_kualitas'>): Promise<KualitasAir> {
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
