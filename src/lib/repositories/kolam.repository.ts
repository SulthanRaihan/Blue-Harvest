import { supabase } from '@/lib/supabase'
import type { Kolam } from '@/types/database'

export const kolamRepository = {
  async getAll(): Promise<Kolam[]> {
    const { data, error } = await supabase.from('kolam').select('*').order('nama_kolam')
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Kolam | null> {
    const { data, error } = await supabase.from('kolam').select('*').eq('id_kolam', id).single()
    if (error) throw error
    return data
  },

  async create(kolam: Omit<Kolam, 'id_kolam'>): Promise<Kolam> {
    const { data, error } = await supabase.from('kolam').insert(kolam).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Kolam>): Promise<Kolam> {
    const { data, error } = await supabase.from('kolam').update(updates).eq('id_kolam', id).select().single()
    if (error) throw error
    return data
  },
}
