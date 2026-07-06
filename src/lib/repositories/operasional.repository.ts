import { supabase } from '@/lib/supabase'
import type { OperasionalHarian } from '@/types/database'

export const operasionalRepository = {
  async getByRencana(idRencana: string): Promise<OperasionalHarian[]> {
    const { data, error } = await supabase
      .from('operasional_harian')
      .select('*')
      .eq('id_rencana', idRencana)
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data as OperasionalHarian[]
  },

  async create(entry: Omit<OperasionalHarian, 'id_operasional'>): Promise<OperasionalHarian> {
    const { data, error } = await supabase
      .from('operasional_harian')
      .insert(entry)
      .select()
      .single()
    if (error) throw error
    return data as OperasionalHarian
  },

  async update(id: string, updates: Partial<Omit<OperasionalHarian, 'id_operasional'>>): Promise<OperasionalHarian> {
    const { data, error } = await supabase
      .from('operasional_harian')
      .update(updates)
      .eq('id_operasional', id)
      .select()
      .single()
    if (error) throw error
    return data as OperasionalHarian
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('operasional_harian')
      .delete()
      .eq('id_operasional', id)
    if (error) throw error
  },
}
