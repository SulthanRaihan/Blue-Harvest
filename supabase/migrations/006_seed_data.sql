-- ════════════════════════════════════════════════════════════
-- MIGRATION 006 — Seed Data
-- Data awal: KOMODITAS dan FAKTOR_RISIKO
-- Jalankan SETELAH 005_laporan.sql
-- ════════════════════════════════════════════════════════════

-- ── Komoditas ────────────────────────────────────────────────
INSERT INTO komoditas (nama, target_ph_min, target_ph_max, target_suhu_min, target_suhu_max, target_do_min, target_salinitas_min, target_salinitas_max, fcr_standar)
VALUES
  ('bandeng',      7.5, 8.5, 26.0, 32.0, 4.0, 15.0, 30.0, 1.8),
  ('nila',         6.5, 8.5, 25.0, 30.0, 4.0,  0.0,  5.0, 1.6),
  ('udang_vaname', 7.5, 8.5, 23.0, 30.0, 5.0, 10.0, 35.0, 1.4)
ON CONFLICT (nama) DO NOTHING;

-- ── Faktor Risiko ─────────────────────────────────────────────
INSERT INTO faktor_risiko (nama_faktor, deskripsi, bobot_default)
VALUES
  ('hama',  'Risiko serangan hama dan penyakit organisme pengganggu pada kolam budidaya', 1.0),
  ('cuaca', 'Risiko dampak cuaca ekstrem dan perubahan iklim terhadap kondisi kolam',     1.0),
  ('pasar', 'Risiko volatilitas harga komoditas dan fluktuasi permintaan pasar',          1.0),
  ('sdm',   'Risiko kapasitas tenaga kerja, ketersediaan sarana produksi, dan SDM',       1.0)
ON CONFLICT (nama_faktor) DO NOTHING;
