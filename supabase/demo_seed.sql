-- ============================================================
-- DATA DEMO SEMENTARA — simulasi 30 hari pemakaian aplikasi
-- ============================================================
-- Tujuan: memberi gambaran tampilan aplikasi kalau sudah dipakai
-- rutin selama sebulan (rencana tebar aktif, log harian, biaya,
-- sampling mingguan, kualitas air, checklist persiapan).
--
-- Semua data ditandai jelas dengan prefix "[DEMO]" pada nama kolam
-- supaya gampang dibedakan dari data asli dan gampang dihapus.
--
-- Jalankan di Supabase SQL Editor. Untuk menghapus semua data ini
-- lagi, jalankan file pasangannya: demo_seed_cleanup.sql
-- ============================================================

-- Pastikan harga acuan vaname terisi (dipakai fitur Estimasi Omset).
-- Tidak menimpa kalau admin sudah pernah isi harga acuan sungguhan.
UPDATE komoditas SET harga_acuan_per_kg = 85000
WHERE nama = 'udang_vaname' AND harga_acuan_per_kg IS NULL;

DO $$
DECLARE
  v_id_pengguna   UUID;
  v_id_owner      UUID;
  v_id_komoditas  UUID;
  v_id_kolam      UUID := gen_random_uuid();
  v_id_rencana    UUID := gen_random_uuid();
  v_id_skoring    UUID := gen_random_uuid();
  v_tebar_date    DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  SELECT id_pengguna INTO v_id_pengguna FROM pengguna WHERE email = 'petambak@test.com' LIMIT 1;
  SELECT id_pengguna INTO v_id_owner    FROM pengguna WHERE email = 'owner@test.com' LIMIT 1;
  SELECT id_komoditas INTO v_id_komoditas FROM komoditas WHERE nama = 'udang_vaname' LIMIT 1;

  IF v_id_pengguna IS NULL OR v_id_komoditas IS NULL THEN
    RAISE EXCEPTION 'Akun petambak@test.com atau komoditas udang_vaname tidak ditemukan — seed dibatalkan';
  END IF;

  -- 1. Kolam demo
  INSERT INTO kolam (id_kolam, id_pengguna, nama_kolam, luas_ha, lokasi, status)
  VALUES (v_id_kolam, v_id_pengguna, '[DEMO] Kolam Contoh Sebulan', 0.5, 'Blok Demo - hapus setelah selesai', 'aktif');

  -- 2. Persiapan tambak — semua item selesai sebelum tebar
  INSERT INTO persiapan_kolam (id_kolam, item, selesai, tanggal_selesai, catatan) VALUES
    (v_id_kolam, 'pengeringan',         true, v_tebar_date - 5, 'Pengeringan dasar kolam 5 hari'),
    (v_id_kolam, 'pengapuran',          true, v_tebar_date - 4, 'Kapur dolomit 50kg'),
    (v_id_kolam, 'perbaikan_pematang',  true, v_tebar_date - 4, NULL),
    (v_id_kolam, 'pengisian_air',       true, v_tebar_date - 2, 'Ketinggian air 90cm'),
    (v_id_kolam, 'pemupukan',           true, v_tebar_date - 2, 'Pupuk organik untuk tumbuhkan pakan alami'),
    (v_id_kolam, 'cek_kualitas_air',    true, v_tebar_date - 1, 'pH 7.8, DO 5.2 — layak tebar');

  -- 3. Rencana tebar — status aktif, sudah berjalan 30 hari
  INSERT INTO rencana_tebar (id_rencana, id_kolam, id_komoditas, id_approved_by, modal_rp, jumlah_benih, tanggal_rencana, status)
  VALUES (v_id_rencana, v_id_kolam, v_id_komoditas, v_id_owner, 15000000, 40000, v_tebar_date, 'aktif');

  -- 4. Skoring risiko — total 19 -> MIDDLE CASE
  INSERT INTO skoring_risiko (id_skoring, id_rencana, total_skor, kategori, created_at)
  VALUES (v_id_skoring, v_id_rencana, 19, 'middle', v_tebar_date - INTERVAL '2 days');

  INSERT INTO detail_skoring (id_skoring, id_faktor, nilai_potensi, nilai_dampak)
  SELECT v_id_skoring, id_faktor, potensi, dampak
  FROM faktor_risiko, (VALUES
    ('hama', 3, 3),
    ('cuaca', 2, 2),
    ('pasar', 2, 2),
    ('sdm', 1, 2)
  ) AS v(nama_f, potensi, dampak)
  WHERE faktor_risiko.nama_faktor = v.nama_f;

  -- 5. Kualitas air manual — tiap ~3 hari selama 30 hari
  INSERT INTO kualitas_air (id_kolam, tanggal, ph, do_ppm, suhu_celsius, salinitas_ppt)
  SELECT v_id_kolam, v_tebar_date + (n * 3),
    7.6 + (random() * 0.6),
    4.8 + (random() * 1.2),
    28 + (random() * 3),
    16 + (random() * 6)
  FROM generate_series(0, 9) AS n;

  -- 6. Operasional harian — 30 hari berturut-turut, pakan naik seiring pertumbuhan
  INSERT INTO operasional_harian (id_rencana, tanggal, jumlah_pakan_kg, jenis_pakan, catatan_hama_penyakit, tindakan)
  SELECT
    v_id_rencana,
    v_tebar_date + n,
    ROUND((2 + (n * 0.35) + (random() * 0.5))::numeric, 1),
    CASE WHEN n < 15 THEN 'Pelet PF-800' ELSE 'Pelet 781-2' END,
    CASE WHEN n = 12 THEN 'Ditemukan white spot ringan pada beberapa ekor udang'
         WHEN n = 25 THEN 'Sebagian udang terlihat kurang aktif saat pagi'
         ELSE NULL END,
    CASE WHEN n = 12 THEN 'Aplikasi probiotik tambahan dan tingkatkan monitoring harian'
         WHEN n = 25 THEN 'Cek ulang kualitas air, kurangi pakan sementara'
         ELSE NULL END
  FROM generate_series(0, 29) AS n;

  -- 7. Sampling pertumbuhan mingguan
  INSERT INTO sampling_pertumbuhan (id_rencana, tanggal, minggu_ke, rata_berat_gram, estimasi_populasi, fcr) VALUES
    (v_id_rencana, v_tebar_date + 7,  1, 0.3, 39500, 0.8),
    (v_id_rencana, v_tebar_date + 14, 2, 1.2, 39000, 1.0),
    (v_id_rencana, v_tebar_date + 21, 3, 2.8, 38500, 1.1),
    (v_id_rencana, v_tebar_date + 28, 4, 5.0, 38000, 1.2);

  -- 8. Biaya operasional — total ~14.3jt dari modal 15jt
  INSERT INTO biaya_operasional (id_rencana, tanggal, kategori, jumlah_rp, catatan) VALUES
    (v_id_rencana, v_tebar_date,      'benih',          3000000, 'Benur vaname 40.000 ekor'),
    (v_id_rencana, v_tebar_date,      'listrik',         500000, 'Kincir air bulan ke-1'),
    (v_id_rencana, v_tebar_date + 5,  'lainnya',         300000, 'Perlengkapan tambahan'),
    (v_id_rencana, v_tebar_date + 7,  'pakan',          1500000, 'Pakan minggu 1'),
    (v_id_rencana, v_tebar_date + 7,  'tenaga_kerja',    800000, 'Upah minggu 1'),
    (v_id_rencana, v_tebar_date + 12, 'obat_probiotik',  400000, 'Probiotik + vitamin (penanganan white spot)'),
    (v_id_rencana, v_tebar_date + 14, 'pakan',          1500000, 'Pakan minggu 2'),
    (v_id_rencana, v_tebar_date + 14, 'tenaga_kerja',    800000, 'Upah minggu 2'),
    (v_id_rencana, v_tebar_date + 15, 'listrik',         500000, 'Kincir air bulan ke-2'),
    (v_id_rencana, v_tebar_date + 21, 'pakan',          1500000, 'Pakan minggu 3'),
    (v_id_rencana, v_tebar_date + 21, 'tenaga_kerja',    800000, 'Upah minggu 3'),
    (v_id_rencana, v_tebar_date + 25, 'obat_probiotik',  400000, 'Probiotik tambahan'),
    (v_id_rencana, v_tebar_date + 28, 'pakan',          1500000, 'Pakan minggu 4'),
    (v_id_rencana, v_tebar_date + 28, 'tenaga_kerja',    800000, 'Upah minggu 4');

  RAISE NOTICE 'Demo data berhasil dibuat. id_kolam=%, id_rencana=%', v_id_kolam, v_id_rencana;
END $$;
