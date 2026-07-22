export type UserRole       = 'petambak' | 'admin' | 'owner'
export type StatusKolam    = 'aktif' | 'tidak_aktif'
export type NamaKomoditas  = 'bandeng' | 'nila' | 'udang_vaname'
export type StatusRencana  = 'draft' | 'approved' | 'aktif' | 'selesai'
export type NamaFaktor     = 'hama' | 'cuaca' | 'pasar' | 'sdm'
export type KategoriRisiko = 'best' | 'middle' | 'worst'
export type GradePanen     = 'A' | 'B' | 'C'
export type StatusDistribusi = 'pending' | 'selesai'
export type KategoriBiaya  = 'benih' | 'pakan' | 'listrik' | 'tenaga_kerja' | 'obat_probiotik' | 'lainnya'
export type ItemPersiapan  = 'pengeringan' | 'pengapuran' | 'perbaikan_pematang' | 'pengisian_air' | 'pemupukan' | 'cek_kualitas_air'

// ── Row interfaces ────────────────────────────────────────────

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
  lokasi: string | null
  status: StatusKolam
  created_at?: string
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
  harga_acuan_per_kg: number | null
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
  tanggal: string
  ph: number
  do_ppm: number
  suhu_celsius: number
  salinitas_ppt: number
  dicatat_oleh: string | null
}

export interface OperasionalHarian {
  id_operasional: string
  id_rencana: string
  tanggal: string
  jumlah_pakan_kg: number
  jenis_pakan: string
  catatan_hama_penyakit: string | null
  tindakan: string | null
  dicatat_oleh: string | null
}

export interface BiayaOperasional {
  id_biaya: string
  id_rencana: string
  tanggal: string
  kategori: KategoriBiaya
  jumlah_rp: number
  catatan: string | null
  created_at?: string
}

export interface PersiapanKolam {
  id_persiapan: string
  id_kolam: string
  item: ItemPersiapan
  selesai: boolean
  tanggal_selesai: string | null
  catatan: string | null
  foto_url: string | null
  created_at?: string
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
  foto_url: string | null
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

// ── Supabase Database type (v2 format) ─────────────────────────
// Must use `type` (not `interface`) so TypeScript correctly resolves
// the extends GenericSchema check inside supabase-js SupabaseClient.

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }

export type Database = {
  public: {
    Tables: {
      pengguna: {
        Row: Pengguna
        Insert: Omit<Pengguna, 'created_at'>
        Update: Partial<Omit<Pengguna, 'created_at'>>
        Relationships: Rel[]
      }
      kolam: {
        Row: Kolam
        Insert: Omit<Kolam, 'id_kolam'>
        Update: Partial<Omit<Kolam, 'id_kolam'>>
        Relationships: Rel[]
      }
      komoditas: {
        Row: Komoditas
        Insert: Omit<Komoditas, 'id_komoditas'>
        Update: Partial<Omit<Komoditas, 'id_komoditas'>>
        Relationships: Rel[]
      }
      rencana_tebar: {
        Row: RencanaTebar
        Insert: Omit<RencanaTebar, 'id_rencana'>
        Update: Partial<Omit<RencanaTebar, 'id_rencana'>>
        Relationships: Rel[]
      }
      faktor_risiko: {
        Row: FaktorRisiko
        Insert: Omit<FaktorRisiko, 'id_faktor'>
        Update: Partial<Omit<FaktorRisiko, 'id_faktor'>>
        Relationships: Rel[]
      }
      skoring_risiko: {
        Row: SkoringRisiko
        Insert: Omit<SkoringRisiko, 'id_skoring' | 'created_at'>
        Update: Partial<Omit<SkoringRisiko, 'id_skoring' | 'created_at'>>
        Relationships: Rel[]
      }
      detail_skoring: {
        Row: DetailSkoring
        Insert: Omit<DetailSkoring, 'id_detail' | 'skor_hasil'>   // skor_hasil = GENERATED ALWAYS
        Update: Partial<Omit<DetailSkoring, 'id_detail' | 'skor_hasil'>>
        Relationships: Rel[]
      }
      kualitas_air: {
        Row: KualitasAir
        Insert: Omit<KualitasAir, 'id_kualitas' | 'dicatat_oleh'>   // dicatat_oleh = DEFAULT auth.uid()
        Update: Partial<Omit<KualitasAir, 'id_kualitas'>>
        Relationships: Rel[]
      }
      operasional_harian: {
        Row: OperasionalHarian
        Insert: Omit<OperasionalHarian, 'id_operasional' | 'dicatat_oleh'>   // dicatat_oleh = DEFAULT auth.uid()
        Update: Partial<Omit<OperasionalHarian, 'id_operasional'>>
        Relationships: Rel[]
      }
      sampling_pertumbuhan: {
        Row: SamplingPertumbuhan
        Insert: Omit<SamplingPertumbuhan, 'id_sampling'>
        Update: Partial<Omit<SamplingPertumbuhan, 'id_sampling'>>
        Relationships: Rel[]
      }
      panen: {
        Row: Panen
        Insert: Omit<Panen, 'id_panen' | 'total_pendapatan'>      // total_pendapatan = GENERATED ALWAYS
        Update: Partial<Omit<Panen, 'id_panen' | 'total_pendapatan'>>
        Relationships: Rel[]
      }
      distribusi: {
        Row: Distribusi
        Insert: Omit<Distribusi, 'id_distribusi'>
        Update: Partial<Omit<Distribusi, 'id_distribusi'>>
        Relationships: Rel[]
      }
      laporan: {
        Row: Laporan
        Insert: Omit<Laporan, 'id_laporan' | 'created_at'>
        Update: Partial<Omit<Laporan, 'id_laporan' | 'created_at'>>
        Relationships: Rel[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      status_kolam: StatusKolam
      nama_komoditas: NamaKomoditas
      status_rencana: StatusRencana
      nama_faktor: NamaFaktor
      kategori_risiko: KategoriRisiko
      grade_panen: GradePanen
      status_distribusi: StatusDistribusi
    }
    CompositeTypes: Record<string, never>
  }
}
