import { supabase } from '@/lib/supabase'
import type { SkoringRisiko, DetailSkoring, KategoriRisiko } from '@/types/database'

export interface SkoringInput {
  id_rencana: string
  faktor: Array<{
    id_faktor: string
    nilai_potensi: number
    nilai_dampak: number
  }>
}

export interface SkoringResult {
  skoring: SkoringRisiko
  details: DetailSkoring[]
}

export const skoringRepository = {
  async getByRencana(idRencana: string): Promise<SkoringResult | null> {
    const { data, error } = await supabase
      .from('skoring_risiko')
      .select('*, detail_skoring(*, faktor_risiko(*))')
      .eq('id_rencana', idRencana)
      .single()
    if (error) return null
    return { skoring: data, details: data.detail_skoring }
  },

  async create(input: SkoringInput): Promise<SkoringResult> {
    const totalSkor = input.faktor.reduce(
      (sum, f) => sum + f.nilai_potensi * f.nilai_dampak, 0,
    )
    const kategori: KategoriRisiko = totalSkor <= 10 ? 'best' : totalSkor <= 20 ? 'middle' : 'worst'

    const { data: skoring, error: skoringErr } = await supabase
      .from('skoring_risiko')
      .insert({ id_rencana: input.id_rencana, total_skor: totalSkor, kategori })
      .select()
      .single()
    if (skoringErr) throw skoringErr

    // skor_hasil is a GENERATED ALWAYS column — must not be included in INSERT
    const detailRows = input.faktor.map(f => ({
      id_skoring:    skoring.id_skoring,
      id_faktor:     f.id_faktor,
      nilai_potensi: f.nilai_potensi,
      nilai_dampak:  f.nilai_dampak,
    }))
    const { data: detailData, error: detailErr } = await supabase
      .from('detail_skoring')
      .insert(detailRows)
      .select()
    if (detailErr) throw detailErr

    return { skoring, details: detailData }
  },
}
