import { supabase } from '@/lib/supabase'
import type { Pengguna, UserRole } from '@/types/database'

export const penggunaRepository = {
  async getAll(): Promise<Pengguna[]> {
    const { data, error } = await supabase
      .from('pengguna')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Pengguna | null> {
    const { data, error } = await supabase
      .from('pengguna')
      .select('*')
      .eq('id_pengguna', id)
      .single()
    if (error) throw error
    return data
  },

  async updateRole(id: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('pengguna')
      .update({ role })
      .eq('id_pengguna', id)
    if (error) throw error
  },

  async updateNama(id: string, nama: string): Promise<void> {
    const { error } = await supabase
      .from('pengguna')
      .update({ nama })
      .eq('id_pengguna', id)
    if (error) throw error
  },
}
