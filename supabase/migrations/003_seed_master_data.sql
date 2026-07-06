-- =============================================================
-- 003_seed_master_data.sql
-- Seed data untuk tabel master: KOMODITAS dan FAKTOR_RISIKO
-- Jalankan di Supabase SQL Editor (Run without RLS / Run)
-- =============================================================

-- ── KOMODITAS ─────────────────────────────────────────────────
-- Standar kualitas air berdasarkan referensi budidaya Indonesia

INSERT INTO komoditas (nama, target_ph_min, target_ph_max, target_suhu_min, target_suhu_max, target_do_min, target_salinitas_min, target_salinitas_max, fcr_standar)
VALUES
  ('bandeng',      7.0, 8.5, 26, 32, 4.0, 10, 30, 1.8),
  ('nila',         6.5, 8.5, 25, 30, 3.0,  0,  5, 1.6),
  ('udang_vaname', 7.5, 8.5, 23, 30, 4.0, 15, 30, 1.4)
ON CONFLICT (nama) DO NOTHING;


-- ── FAKTOR RISIKO ─────────────────────────────────────────────
-- 4 faktor skoring risiko (rule-based, sesuai BPMN Blok B)

INSERT INTO faktor_risiko (nama_faktor, deskripsi, bobot_default)
VALUES
  (
    'hama',
    'Potensi serangan hama, wabah penyakit ikan/udang, dan kondisi kesehatan kolam. Meliputi risiko parasit, bakteri patogen, jamur, dan predator alami.',
    1
  ),
  (
    'cuaca',
    'Risiko perubahan cuaca ekstrem, musim hujan/kemarau panjang, dan dampak iklim terhadap kualitas air dan kelangsungan hidup budidaya.',
    1
  ),
  (
    'pasar',
    'Fluktuasi harga komoditas di pasar, ketersediaan pembeli/pengepul, risiko harga anjlok saat panen, dan ketidakpastian serapan pasar.',
    1
  ),
  (
    'sdm',
    'Kemampuan dan ketersediaan tenaga kerja terampil, risiko human error dalam operasional harian, serta ketersediaan sarana dan prasarana operasional.',
    1
  )
ON CONFLICT (nama_faktor) DO NOTHING;
