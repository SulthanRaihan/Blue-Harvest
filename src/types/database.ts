export type UserRole = 'petambak' | 'admin' | 'owner'
export type StatusKolam = 'aktif' | 'tidak_aktif'
export type NamaKomoditas = 'bandeng' | 'nila' | 'udang_vaname'
export type StatusRencana = 'draft' | 'approved' | 'aktif' | 'selesai'
export type NamaFaktor = 'hama' | 'cuaca' | 'pasar' | 'sdm'
export type KategoriRisiko = 'best' | 'middle' | 'worst'
export type GradePanen = 'A' | 'B' | 'C'
export type StatusDistribusi = 'pending' | 'selesai'

export interface Pengguna {
  id_pengguna: string
  nama: string
  email: string
  role: UserRole
  created_at: string
}

export interface Kolam {
  id_kolam: string
  id_pengguna: string
  nama_kolam: string
  luas_ha: number
  lokasi: string
  status: StatusKolam
}

export interface Komoditas {
  id_komoditas: string
  nama: NamaKomoditas
  target_ph_min: number
  target_ph_max: number
  target_suhu_min: number
  target_suhu_max: number
  target_do_min: number
  target_salinitas_min: number
  target_salinitas_max: number
  fcr_standar: number
}

export interface RencanaTebar {
  id_rencana: string
  id_kolam: string
  id_komoditas: string
  id_approved_by: string | null
  modal_rp: number
  jumlah_benih: number
  tanggal_rencana: string
  status: StatusRencana
}

export interface FaktorRisiko {
  id_faktor: string
  nama_faktor: NamaFaktor
  deskripsi: string
  bobot_default: number
}

export interface SkoringRisiko {
  id_skoring: string
  id_rencana: string
  total_skor: number
  kategori: KategoriRisiko
  created_at: string
}

export interface DetailSkoring {
  id_detail: string
  id_skoring: string
  id_faktor: string
  nilai_potensi: number
  nilai_dampak: number
  skor_hasil: number
}

export interface KualitasAir {
  id_kualitas: string
  id_kolam: string
  timestamp: string
  ph: number
  do_ppm: number
  suhu_celsius: number
  salinitas_ppt: number
}

export interface OperasionalHarian {
  id_operasional: string
  id_rencana: string
  tanggal: string
  jumlah_pakan_kg: number
  jenis_pakan: string
  catatan_hama_penyakit: string | null
  tindakan: string | null
}

export interface SamplingPertumbuhan {
  id_sampling: string
  id_rencana: string
  tanggal: string
  minggu_ke: number
  rata_berat_gram: number
  estimasi_populasi: number
  fcr: number
}

export interface Panen {
  id_panen: string
  id_rencana: string
  tanggal_panen: string
  total_bobot_kg: number
  grade: GradePanen
  harga_per_kg: number
  total_pendapatan: number
}

export interface Distribusi {
  id_distribusi: string
  id_panen: string
  nama_penerima: string
  tanggal: string
  bobot_kg: number
  harga_jual_per_kg: number
  status: StatusDistribusi
}

export interface Laporan {
  id_laporan: string
  id_rencana: string
  id_approved_by: string | null
  periode: string
  total_produksi_kg: number
  total_biaya: number
  total_pendapatan: number
  fcr_rata: number
  created_at: string
}

// Supabase Database type map
export interface Database {
  public: {
    Tables: {
      pengguna: { Row: Pengguna; Insert: Omit<Pengguna, 'created_at'>; Update: Partial<Pengguna> }
      kolam: { Row: Kolam; Insert: Omit<Kolam, 'id_kolam'>; Update: Partial<Kolam> }
      komoditas: { Row: Komoditas; Insert: Omit<Komoditas, 'id_komoditas'>; Update: Partial<Komoditas> }
      rencana_tebar: { Row: RencanaTebar; Insert: Omit<RencanaTebar, 'id_rencana'>; Update: Partial<RencanaTebar> }
      faktor_risiko: { Row: FaktorRisiko; Insert: Omit<FaktorRisiko, 'id_faktor'>; Update: Partial<FaktorRisiko> }
      skoring_risiko: { Row: SkoringRisiko; Insert: Omit<SkoringRisiko, 'id_skoring' | 'created_at'>; Update: Partial<SkoringRisiko> }
      detail_skoring: { Row: DetailSkoring; Insert: Omit<DetailSkoring, 'id_detail'>; Update: Partial<DetailSkoring> }
      kualitas_air: { Row: KualitasAir; Insert: Omit<KualitasAir, 'id_kualitas'>; Update: Partial<KualitasAir> }
      operasional_harian: { Row: OperasionalHarian; Insert: Omit<OperasionalHarian, 'id_operasional'>; Update: Partial<OperasionalHarian> }
      sampling_pertumbuhan: { Row: SamplingPertumbuhan; Insert: Omit<SamplingPertumbuhan, 'id_sampling'>; Update: Partial<SamplingPertumbuhan> }
      panen: { Row: Panen; Insert: Omit<Panen, 'id_panen'>; Update: Partial<Panen> }
      distribusi: { Row: Distribusi; Insert: Omit<Distribusi, 'id_distribusi'>; Update: Partial<Distribusi> }
      laporan: { Row: Laporan; Insert: Omit<Laporan, 'id_laporan' | 'created_at'>; Update: Partial<Laporan> }
    }
  }
}
