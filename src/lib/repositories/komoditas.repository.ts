import { supabase } from '@/lib/supabase'
import type { Komoditas } from '@/types/database'

export const komoditasRepository = {
  async getAll(): Promise<Komoditas[]> {
    const { data, error } = await supabase
      .from('komoditas')
      .select('*')
      .order('nama')
    if (error) throw error
    return data as Komoditas[]
  },

  async getById(id: string): Promise<Komoditas | null> {
    const { data, error } = await supabase
      .from('komoditas')
      .select('*')
      .eq('id_komoditas', id)
      .single()
    if (error) return null
    return data as Komoditas
  },
}
