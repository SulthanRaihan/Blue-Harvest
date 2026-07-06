import { supabase } from '@/lib/supabase'
import type { FaktorRisiko } from '@/types/database'

export const faktorRepository = {
  async getAll(): Promise<FaktorRisiko[]> {
    const { data, error } = await supabase
      .from('faktor_risiko')
      .select('*')
      .order('nama_faktor')
    if (error) throw error
    return data
  },
}
