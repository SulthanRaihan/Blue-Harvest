import { supabase } from '@/lib/supabase'
import type { RencanaTebar } from '@/types/database'

export const rencanaRepository = {
  async getAll(): Promise<RencanaTebar[]> {
    const { data, error } = await supabase
      .from('rencana_tebar')
      .select('*, kolam(*), komoditas(*)')
      .order('tanggal_rencana', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<RencanaTebar | null> {
    const { data, error } = await supabase
      .from('rencana_tebar')
      .select('*, kolam(*), komoditas(*), skoring_risiko(*, detail_skoring(*, faktor_risiko(*)))')
      .eq('id_rencana', id)
      .single()
    if (error) throw error
    return data
  },

  async getAktif(): Promise<RencanaTebar[]> {
    const { data, error } = await supabase
      .from('rencana_tebar')
      .select('*, kolam(*), komoditas(*)')
      .eq('status', 'aktif')
    if (error) throw error
    return data
  },

  async create(rencana: Omit<RencanaTebar, 'id_rencana'>): Promise<RencanaTebar> {
    const { data, error } = await supabase.from('rencana_tebar').insert(rencana).select('*, kolam(*), komoditas(*)').single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Omit<RencanaTebar, 'id_rencana'>>): Promise<RencanaTebar> {
    const { data, error } = await supabase.from('rencana_tebar').update(updates).eq('id_rencana', id).select().single()
    if (error) throw error
    return data
  },

  async updateStatus(id: string, status: RencanaTebar['status']): Promise<void> {
    const { error } = await supabase.from('rencana_tebar').update({ status }).eq('id_rencana', id)
    if (error) throw error
  },

  async approve(id: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('rencana_tebar')
      .update({ status: 'approved', id_approved_by: approvedBy })
      .eq('id_rencana', id)
    if (error) throw error
  },
}
