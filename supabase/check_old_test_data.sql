-- ============================================================
-- CEK DATA TEST LAMA — jumlah_benih tidak realistis
-- ============================================================
-- Query SELECT saja, TIDAK menghapus apa-apa. Jalankan di Supabase
-- SQL Editor untuk lihat rencana tebar mana saja yang datanya
-- kelewat besar (kemungkinan sisa data test sebelum ada validasi
-- sanity-check jumlah_benih/kepadatan).
--
-- Patokan kasar: kolam tambak rakyat biasa (0.1 - 2 ha) realistis
-- diisi puluhan ribu sampai low-hundred-thousand ekor benih,
-- tergantung komoditas & kepadatan. Di atas 500.000 ekor untuk
-- kolam < 1 ha sudah patut dicurigai.
-- ============================================================

SELECT
  rt.id_rencana,
  k.nama_kolam,
  k.luas_ha,
  km.nama AS komoditas,
  rt.jumlah_benih,
  ROUND(rt.jumlah_benih / NULLIF(k.luas_ha, 0)) AS kepadatan_per_ha,
  rt.modal_rp,
  rt.tanggal_rencana,
  rt.status,
  rt.id_kolam
FROM rencana_tebar rt
JOIN kolam k      ON k.id_kolam = rt.id_kolam
JOIN komoditas km ON km.id_komoditas = rt.id_komoditas
WHERE rt.jumlah_benih > 500000
   OR (k.luas_ha > 0 AND rt.jumlah_benih / k.luas_ha > 200000)
ORDER BY rt.jumlah_benih DESC;

-- Kalau mau lihat SEMUA rencana tebar untuk perbandingan (bukan cuma
-- yang mencurigakan), hapus komentar query di bawah ini:
--
-- SELECT rt.id_rencana, k.nama_kolam, k.luas_ha, km.nama AS komoditas,
--        rt.jumlah_benih, rt.status, rt.tanggal_rencana
-- FROM rencana_tebar rt
-- JOIN kolam k ON k.id_kolam = rt.id_kolam
-- JOIN komoditas km ON km.id_komoditas = rt.id_komoditas
-- ORDER BY rt.tanggal_rencana DESC;
