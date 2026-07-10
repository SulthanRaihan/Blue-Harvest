import { supabase } from '@/lib/supabase'
import type { BiayaOperasional } from '@/types/database'

export const biayaRepository = {
  async getByRencana(idRencana: string): Promise<BiayaOperasional[]> {
    const { data, error } = await supabase
      .from('biaya_operasional')
      .select('*')
      .eq('id_rencana', idRencana)
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data as BiayaOperasional[]
  },

  async create(entry: Omit<BiayaOperasional, 'id_biaya' | 'created_at'>): Promise<BiayaOperasional> {
    const { data, error } = await supabase
      .from('biaya_operasional')
      .insert(entry)
      .select()
      .single()
    if (error) throw error
    return data as BiayaOperasional
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('biaya_operasional')
      .delete()
      .eq('id_biaya', id)
    if (error) throw error
  },
}
