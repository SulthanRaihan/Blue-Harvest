-- ============================================================
-- HAPUS 2 DATA TEST LAMA — jumlah_benih tidak realistis
-- ============================================================
-- Target spesifik (ditemukan lewat check_old_test_data.sql):
--   23833289-27d6-4f08-a81c-3f4f99938aa9  (status selesai, 2026-03-01)
--   0a1e6254-a851-4c8b-8530-3fa9637654c2  (status approved, 2026-07-07)
-- Ciri: modal_rp cuma Rp50.000, jumlah_benih 15.000.000 di kolam
-- 0.5ha (kepadatan 30 juta ekor/ha — mustahil). Kolam A1 TIDAK
-- dihapus, cuma 2 rencana_tebar ini + data turunannya.
--
-- LANGKAH 1: jalankan blok SELECT di bawah dulu buat lihat berapa
-- banyak data turunan yang bakal ikut terhapus (aman, tidak mengubah
-- apa pun). LANGKAH 2: kalau sudah yakin, jalankan blok DELETE.
-- ============================================================

-- ── LANGKAH 1: preview jumlah data turunan ─────────────────────
SELECT 'operasional_harian' AS tabel, count(*) FROM operasional_harian
  WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2')
UNION ALL
SELECT 'sampling_pertumbuhan', count(*) FROM sampling_pertumbuhan
  WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2')
UNION ALL
SELECT 'biaya_operasional', count(*) FROM biaya_operasional
  WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2')
UNION ALL
SELECT 'panen', count(*) FROM panen
  WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2')
UNION ALL
SELECT 'distribusi', count(*) FROM distribusi
  WHERE id_panen IN (SELECT id_panen FROM panen WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2'))
UNION ALL
SELECT 'laporan', count(*) FROM laporan
  WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2')
UNION ALL
SELECT 'skoring_risiko', count(*) FROM skoring_risiko
  WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2');


-- ── LANGKAH 2: hapus (jalankan setelah cek hasil di atas) ──────
-- Uncomment (hapus tanda "--" di setiap baris di bawah) baru RUN.

-- DELETE FROM distribusi WHERE id_panen IN (
--   SELECT id_panen FROM panen WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2')
-- );
-- DELETE FROM panen                where id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2');
-- DELETE FROM biaya_operasional     WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2');
-- DELETE FROM sampling_pertumbuhan  WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2');
-- DELETE FROM operasional_harian    WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2');
-- DELETE FROM laporan               WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2');
-- DELETE FROM rencana_tebar         WHERE id_rencana IN ('23833289-27d6-4f08-a81c-3f4f99938aa9', '0a1e6254-a851-4c8b-8530-3fa9637654c2');
-- -- skoring_risiko & detail_skoring otomatis ikut terhapus (ON DELETE CASCADE dari rencana_tebar)
