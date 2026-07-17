-- =============================================================
-- 012_panen_foto.sql
-- Tambah kolom foto dokumentasi hasil panen (pakai bucket Storage
-- "dokumentasi" yang sudah ada dari migration 011).
-- Jalankan di Supabase SQL Editor.
-- =============================================================

ALTER TABLE panen ADD COLUMN IF NOT EXISTS foto_url TEXT;

COMMENT ON COLUMN panen.foto_url IS 'URL publik foto dokumentasi hasil panen di bucket dokumentasi (opsional)';
