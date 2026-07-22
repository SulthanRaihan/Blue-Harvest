import { supabase } from '@/lib/supabase'
import type { OperasionalHarian } from '@/types/database'

export type OperasionalWithPencatat = OperasionalHarian & {
  pencatat?: { nama: string } | null
}

export const operasionalRepository = {
  async getByRencana(idRencana: string): Promise<OperasionalWithPencatat[]> {
    // Embed nama pencatat lewat FK dicatat_oleh. Entri lama yang belum
    // punya pencatat akan bernilai null dan di UI jatuh ke pemilik kolam.
    const { data, error } = await supabase
      .from('operasional_harian')
      .select('*, pencatat:pengguna!dicatat_oleh(nama)')
      .eq('id_rencana', idRencana)
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data as OperasionalWithPencatat[]
  },

  async create(entry: Omit<OperasionalHarian, 'id_operasional' | 'dicatat_oleh'>): Promise<OperasionalHarian> {
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
