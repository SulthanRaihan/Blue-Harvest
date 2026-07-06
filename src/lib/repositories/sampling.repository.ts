import { supabase } from '@/lib/supabase'
import type { SamplingPertumbuhan } from '@/types/database'

export const samplingRepository = {
  async getByRencana(idRencana: string): Promise<SamplingPertumbuhan[]> {
    const { data, error } = await supabase
      .from('sampling_pertumbuhan')
      .select('*')
      .eq('id_rencana', idRencana)
      .order('minggu_ke', { ascending: true })
    if (error) throw error
    return data as SamplingPertumbuhan[]
  },

  async create(entry: Omit<SamplingPertumbuhan, 'id_sampling'>): Promise<SamplingPertumbuhan> {
    const { data, error } = await supabase
      .from('sampling_pertumbuhan')
      .insert(entry)
      .select()
      .single()
    if (error) throw error
    return data as SamplingPertumbuhan
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sampling_pertumbuhan')
      .delete()
      .eq('id_sampling', id)
    if (error) throw error
  },
}
