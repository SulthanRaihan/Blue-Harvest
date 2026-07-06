import { supabase } from '@/lib/supabase'
import type { Panen, Distribusi } from '@/types/database'

export type PanenWithRencana = Panen & {
  rencana_tebar?: {
    id_kolam: string
    tanggal_rencana: string
    kolam?: { nama_kolam: string }
    komoditas?: { nama: string }
  } | null
}

export const panenRepository = {
  async getAll(): Promise<PanenWithRencana[]> {
    const { data, error } = await supabase
      .from('panen')
      .select('*, rencana_tebar(id_kolam, tanggal_rencana, kolam(nama_kolam), komoditas(nama))')
      .order('tanggal_panen', { ascending: false })
    if (error) throw error
    return data as PanenWithRencana[]
  },

  async getByRencana(idRencana: string): Promise<Panen[]> {
    const { data, error } = await supabase
      .from('panen')
      .select('*')
      .eq('id_rencana', idRencana)
      .order('tanggal_panen', { ascending: false })
    if (error) throw error
    return data as Panen[]
  },

  async create(panen: Omit<Panen, 'id_panen' | 'total_pendapatan'>): Promise<Panen> {
    const payload = { ...panen, total_pendapatan: panen.total_bobot_kg * panen.harga_per_kg }
    const { data, error } = await supabase
      .from('panen')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as Panen
  },
}

export const distribusiRepository = {
  async getByPanen(idPanen: string): Promise<Distribusi[]> {
    const { data, error } = await supabase
      .from('distribusi')
      .select('*')
      .eq('id_panen', idPanen)
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data as Distribusi[]
  },

  async getAll(): Promise<Distribusi[]> {
    const { data, error } = await supabase
      .from('distribusi')
      .select('*')
      .order('tanggal', { ascending: false })
    if (error) throw error
    return data as Distribusi[]
  },

  async create(dist: Omit<Distribusi, 'id_distribusi'>): Promise<Distribusi> {
    const { data, error } = await supabase
      .from('distribusi')
      .insert(dist)
      .select()
      .single()
    if (error) throw error
    return data as Distribusi
  },

  async updateStatus(id: string, status: Distribusi['status']): Promise<void> {
    const { error } = await supabase
      .from('distribusi')
      .update({ status })
      .eq('id_distribusi', id)
    if (error) throw error
  },
}
