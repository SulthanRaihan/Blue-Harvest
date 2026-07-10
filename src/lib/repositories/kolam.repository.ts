import { supabase } from '@/lib/supabase'
import type { Kolam } from '@/types/database'

export type KolamWithPengguna = Kolam & {
  pengguna: { nama: string; email: string } | null
}

export const kolamRepository = {
  async getAll(): Promise<KolamWithPengguna[]> {
    const { data, error } = await supabase
      .from('kolam')
      .select('*, pengguna(nama, email)')
      .order('nama_kolam')
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Kolam | null> {
    const { data, error } = await supabase
      .from('kolam').select('*').eq('id_kolam', id).single()
    if (error) throw error
    return data
  },

  async getByPengguna(idPengguna: string): Promise<Kolam[]> {
    const { data, error } = await supabase
      .from('kolam')
      .select('*')
      .eq('id_pengguna', idPengguna)
      .eq('status', 'aktif')
      .order('nama_kolam')
    if (error) throw error
    return data
  },

  async create(kolam: Omit<Kolam, 'id_kolam'>): Promise<Kolam> {
    const { data, error } = await supabase
      .from('kolam').insert(kolam).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Omit<Kolam, 'id_kolam' | 'created_at'>>): Promise<Kolam> {
    const { data, error } = await supabase
      .from('kolam').update(updates).eq('id_kolam', id).select().single()
    if (error) throw error
    return data
  },

  async toggleStatus(id: string, current: Kolam['status']): Promise<void> {
    const next = current === 'aktif' ? 'tidak_aktif' : 'aktif'

    // Guard: jangan biarkan kolam yang masih punya siklus aktif dinonaktifkan
    // begitu saja — tanpa ini, admin bisa nonaktifkan kolam yang sedang
    // dipakai petambak tanpa pengecekan apapun.
    if (next === 'tidak_aktif') {
      const { data: siklusAktif, error: cekError } = await supabase
        .from('rencana_tebar')
        .select('id_rencana')
        .eq('id_kolam', id)
        .eq('status', 'aktif')
        .limit(1)
      if (cekError) throw cekError
      if (siklusAktif && siklusAktif.length > 0) {
        throw new Error('Kolam ini masih punya siklus aktif, tidak bisa dinonaktifkan.')
      }
    }

    const { error } = await supabase
      .from('kolam').update({ status: next }).eq('id_kolam', id)
    if (error) throw error
  },
}
