-- ════════════════════════════════════════════════════════════
-- MIGRATION 011 — Storage Setup (dokumentasi)
-- Bucket buat foto dokumentasi persiapan tambak & panen.
-- Jalankan SETELAH 010_biaya_persiapan_harga.sql
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumentasi', 'dokumentasi', true)
ON CONFLICT (id) DO NOTHING;

-- Siapa saja (termasuk publik) bisa lihat foto — bucket ini public
-- supaya foto bisa ditampilkan langsung via public URL tanpa signed URL.
CREATE POLICY "dokumentasi_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'dokumentasi');

-- Upload/update/delete cuma boleh user yang sudah login (single-tenant,
-- semua role authenticated boleh upload — konsisten dengan pola RLS
-- tabel lain di project ini).
CREATE POLICY "dokumentasi_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'dokumentasi' AND auth.uid() IS NOT NULL);

CREATE POLICY "dokumentasi_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'dokumentasi' AND auth.uid() IS NOT NULL);

CREATE POLICY "dokumentasi_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'dokumentasi' AND auth.uid() IS NOT NULL);
