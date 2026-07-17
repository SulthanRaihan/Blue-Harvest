-- ============================================================
-- DATA DEMO SEMENTARA #2 — siklus SUDAH PANEN (nila, ~100 hari)
-- ============================================================
-- Pasangan dari demo_seed.sql (yang isinya siklus AKTIF/berjalan).
-- File ini simulasikan satu siklus PENUH dari tebar sampai panen +
-- distribusi, supaya modul Laporan & Evaluasi ada isinya buat demo.
--
-- Sama seperti demo_seed.sql — semua ditandai prefix "[DEMO]" di
-- nama kolam, dan bisa dihapus lewat demo_seed_cleanup.sql yang sama
-- (cleanup sudah mencocokkan pola "[DEMO]%", bukan file tertentu).
--
-- Jalankan di Supabase SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_id_pengguna   UUID;
  v_id_owner      UUID;
  v_id_komoditas  UUID;
  v_id_kolam      UUID := gen_random_uuid();
  v_id_rencana    UUID := gen_random_uuid();
  v_id_skoring    UUID := gen_random_uuid();
  v_id_panen_a    UUID := gen_random_uuid();
  v_id_panen_b    UUID := gen_random_uuid();
  v_tebar_date    DATE := CURRENT_DATE - INTERVAL '103 days';
  v_panen_date_a  DATE := CURRENT_DATE - INTERVAL '3 days';
  v_panen_date_b  DATE := CURRENT_DATE - INTERVAL '1 days';
BEGIN
  SELECT id_pengguna INTO v_id_pengguna FROM pengguna WHERE email = 'petambak@test.com' LIMIT 1;
  SELECT id_pengguna INTO v_id_owner    FROM pengguna WHERE email = 'owner@test.com' LIMIT 1;
  SELECT id_komoditas INTO v_id_komoditas FROM komoditas WHERE nama = 'nila' LIMIT 1;

  IF v_id_pengguna IS NULL OR v_id_komoditas IS NULL THEN
    RAISE EXCEPTION 'Akun petambak@test.com atau komoditas nila tidak ditemukan — seed dibatalkan';
  END IF;

  -- 1. Kolam demo
  INSERT INTO kolam (id_kolam, id_pengguna, nama_kolam, luas_ha, lokasi, status)
  VALUES (v_id_kolam, v_id_pengguna, '[DEMO] Kolam Sudah Panen (Nila 100 Hari)', 0.3, 'Blok Demo - hapus setelah selesai', 'aktif');

  -- 2. Persiapan tambak
  INSERT INTO persiapan_kolam (id_kolam, item, selesai, tanggal_selesai, catatan) VALUES
    (v_id_kolam, 'pengeringan',         true, v_tebar_date - 6, 'Pengeringan dasar kolam 6 hari'),
    (v_id_kolam, 'pengapuran',          true, v_tebar_date - 5, 'Kapur dolomit 40kg'),
    (v_id_kolam, 'perbaikan_pematang',  true, v_tebar_date - 5, NULL),
    (v_id_kolam, 'pengisian_air',       true, v_tebar_date - 2, 'Ketinggian air 80cm'),
    (v_id_kolam, 'pemupukan',           true, v_tebar_date - 2, 'Pupuk kandang untuk pakan alami'),
    (v_id_kolam, 'cek_kualitas_air',    true, v_tebar_date - 1, 'pH 7.2, DO 4.5 — layak tebar');

  -- 3. Rencana tebar — SELESAI (sudah panen)
  INSERT INTO rencana_tebar (id_rencana, id_kolam, id_komoditas, id_approved_by, modal_rp, jumlah_benih, tanggal_rencana, status)
  VALUES (v_id_rencana, v_id_kolam, v_id_komoditas, v_id_owner, 80000000, 20000, v_tebar_date, 'selesai');

  -- 4. Skoring risiko — total 9 -> BEST CASE
  INSERT INTO skoring_risiko (id_skoring, id_rencana, total_skor, kategori, created_at)
  VALUES (v_id_skoring, v_id_rencana, 9, 'best', v_tebar_date - INTERVAL '2 days');

  INSERT INTO detail_skoring (id_skoring, id_faktor, nilai_potensi, nilai_dampak)
  SELECT v_id_skoring, id_faktor, potensi, dampak
  FROM faktor_risiko, (VALUES
    ('hama', 2, 2),
    ('cuaca', 1, 2),
    ('pasar', 1, 1),
    ('sdm', 1, 2)
  ) AS v(nama_f, potensi, dampak)
  WHERE faktor_risiko.nama_faktor = v.nama_f;

  -- 5. Kualitas air manual — tiap 5 hari selama 100 hari
  INSERT INTO kualitas_air (id_kolam, tanggal, ph, do_ppm, suhu_celsius, salinitas_ppt)
  SELECT v_id_kolam, v_tebar_date + (n * 5),
    6.8 + (random() * 1.4),
    3.2 + (random() * 2.0),
    25.5 + (random() * 4),
    0 + (random() * 3)
  FROM generate_series(0, 19) AS n;

  -- 6. Operasional harian — 100 hari, pakan naik seiring pertumbuhan biomassa
  INSERT INTO operasional_harian (id_rencana, tanggal, jumlah_pakan_kg, jenis_pakan, catatan_hama_penyakit, tindakan)
  SELECT
    v_id_rencana,
    v_tebar_date + n,
    ROUND((8 + (n * 1.35) + (random() * 3))::numeric, 1),
    CASE WHEN n < 30 THEN 'Pelet apung 32% protein' WHEN n < 70 THEN 'Pelet apung 28% protein' ELSE 'Pelet apung 25% protein' END,
    CASE WHEN n = 20 THEN 'Ditemukan bercak jamur pada sirip beberapa ekor nila'
         WHEN n = 55 THEN 'Populasi terlihat menggerombol di permukaan pagi hari, indikasi oksigen rendah'
         WHEN n = 80 THEN 'Ada indikasi serangan burung pemangsa di pinggir kolam'
         ELSE NULL END,
    CASE WHEN n = 20 THEN 'Rendam pakan dengan vitamin C, kurangi kepadatan sementara'
         WHEN n = 55 THEN 'Tambah kincir aerator, kurangi pakan sore hari'
         WHEN n = 80 THEN 'Pasang jaring pengaman di sekeliling pematang'
         ELSE NULL END
  FROM generate_series(0, 99) AS n;

  -- 7. Sampling pertumbuhan mingguan — 14 minggu
  INSERT INTO sampling_pertumbuhan (id_rencana, tanggal, minggu_ke, rata_berat_gram, estimasi_populasi, fcr) VALUES
    (v_id_rencana, v_tebar_date + 7,   1,   5, 19950, 1.1),
    (v_id_rencana, v_tebar_date + 14,  2,  12, 19900, 1.2),
    (v_id_rencana, v_tebar_date + 21,  3,  22, 19800, 1.3),
    (v_id_rencana, v_tebar_date + 28,  4,  35, 19700, 1.3),
    (v_id_rencana, v_tebar_date + 35,  5,  50, 19550, 1.4),
    (v_id_rencana, v_tebar_date + 42,  6,  70, 19400, 1.4),
    (v_id_rencana, v_tebar_date + 49,  7,  95, 19250, 1.5),
    (v_id_rencana, v_tebar_date + 56,  8, 120, 19100, 1.5),
    (v_id_rencana, v_tebar_date + 63,  9, 145, 18900, 1.5),
    (v_id_rencana, v_tebar_date + 70, 10, 170, 18700, 1.5),
    (v_id_rencana, v_tebar_date + 77, 11, 195, 18500, 1.6),
    (v_id_rencana, v_tebar_date + 84, 12, 215, 18300, 1.6),
    (v_id_rencana, v_tebar_date + 91, 13, 235, 18100, 1.6),
    (v_id_rencana, v_tebar_date + 98, 14, 250, 18000, 1.6);

  -- 8. Biaya operasional — benih, pakan (dominan), listrik, tenaga kerja, obat, lainnya
  INSERT INTO biaya_operasional (id_rencana, tanggal, kategori, jumlah_rp, catatan) VALUES
    (v_id_rencana, v_tebar_date,      'benih',          6000000, 'Benih nila 20.000 ekor'),
    (v_id_rencana, v_tebar_date + 2,  'listrik',         400000, 'Kincir air bulan ke-1'),
    (v_id_rencana, v_tebar_date + 10, 'lainnya',         500000, 'Perbaikan jaring & anco'),
    (v_id_rencana, v_tebar_date + 14, 'pakan',         8500000, 'Pakan minggu 1-2'),
    (v_id_rencana, v_tebar_date + 14, 'tenaga_kerja',  1400000, 'Upah minggu 1-2'),
    (v_id_rencana, v_tebar_date + 20, 'obat_probiotik', 500000, 'Vitamin C + probiotik (jamur sirip)'),
    (v_id_rencana, v_tebar_date + 28, 'pakan',         9200000, 'Pakan minggu 3-4'),
    (v_id_rencana, v_tebar_date + 28, 'tenaga_kerja',  1400000, 'Upah minggu 3-4'),
    (v_id_rencana, v_tebar_date + 32, 'listrik',         400000, 'Kincir air bulan ke-2'),
    (v_id_rencana, v_tebar_date + 42, 'pakan',        10500000, 'Pakan minggu 5-6'),
    (v_id_rencana, v_tebar_date + 42, 'tenaga_kerja',  1400000, 'Upah minggu 5-6'),
    (v_id_rencana, v_tebar_date + 55, 'obat_probiotik', 400000, 'Penanganan oksigen rendah'),
    (v_id_rencana, v_tebar_date + 56, 'pakan',        11800000, 'Pakan minggu 7-8'),
    (v_id_rencana, v_tebar_date + 56, 'tenaga_kerja',  1400000, 'Upah minggu 7-8'),
    (v_id_rencana, v_tebar_date + 63, 'listrik',         400000, 'Kincir air bulan ke-3'),
    (v_id_rencana, v_tebar_date + 70, 'pakan',        12000000, 'Pakan minggu 9-10'),
    (v_id_rencana, v_tebar_date + 70, 'tenaga_kerja',  1400000, 'Upah minggu 9-10'),
    (v_id_rencana, v_tebar_date + 80, 'lainnya',         500000, 'Jaring pengaman burung'),
    (v_id_rencana, v_tebar_date + 84, 'pakan',        10800000, 'Pakan minggu 11-12'),
    (v_id_rencana, v_tebar_date + 84, 'tenaga_kerja',  1400000, 'Upah minggu 11-12'),
    (v_id_rencana, v_tebar_date + 98, 'pakan',         6500000, 'Pakan minggu 13-14'),
    (v_id_rencana, v_tebar_date + 98, 'tenaga_kerja',  1400000, 'Upah minggu 13-14 + panen');

  -- 9. Panen — 2 grade
  INSERT INTO panen (id_panen, id_rencana, tanggal_panen, total_bobot_kg, grade, harga_per_kg)
  VALUES
    (v_id_panen_a, v_id_rencana, v_panen_date_a, 3200, 'A', 23000),
    (v_id_panen_b, v_id_rencana, v_panen_date_b, 1300, 'B', 19000);

  -- 10. Distribusi
  INSERT INTO distribusi (id_panen, nama_penerima, tanggal, bobot_kg, harga_jual_per_kg, status) VALUES
    (v_id_panen_a, 'Pengepul Pasar Ikan Nila Raya', v_panen_date_a, 3200, 23500, 'selesai'),
    (v_id_panen_b, 'Pengepul Pasar Ikan Nila Raya', v_panen_date_b, 1300, 19500, 'selesai');

  RAISE NOTICE 'Demo data siklus selesai berhasil dibuat. id_kolam=%, id_rencana=%', v_id_kolam, v_id_rencana;
END $$;
