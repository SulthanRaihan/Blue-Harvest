-- =============================================================
-- 014_ai_insight_harian.sql
-- Cache insight AI harian. Insight di-generate sekali per hari lalu
-- disimpan di sini; dashboard membaca dari cache ini, bukan memanggil
-- Groq setiap kali dibuka. Hemat token dan tetap tampil walau Groq
-- sedang tidak bisa diakses.
-- Jalankan di Supabase SQL Editor.
-- =============================================================

CREATE TABLE IF NOT EXISTS ai_insight_harian (
  id_insight  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  scope       VARCHAR(20) NOT NULL,   -- untuk siapa insight ini, mis. 'owner'
  insight     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tanggal, scope)
);

COMMENT ON TABLE ai_insight_harian IS 'Cache insight AI harian, digenerate sekali per hari per scope';

ALTER TABLE ai_insight_harian ENABLE ROW LEVEL SECURITY;

-- Pola sederhana seperti tabel lain di app ini: baca & tulis untuk
-- pengguna terautentikasi. Generasi tetap lewat API route yang memegang
-- GROQ_API_KEY; tabel ini cuma menyimpan hasilnya.
CREATE POLICY "ai_insight_select" ON ai_insight_harian
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ai_insight_insert" ON ai_insight_harian
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
