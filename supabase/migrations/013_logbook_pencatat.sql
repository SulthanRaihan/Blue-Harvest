-- =============================================================
-- 013_logbook_pencatat.sql
-- Menyimpan siapa yang mencatat tiap entri operasional dan kualitas
-- air, untuk kolom USER di logbook. Default auth.uid() supaya setiap
-- input baru otomatis mencatat pengguna yang login, tanpa perlu ubah
-- kode insert. Entri lama bernilai NULL dan di UI jatuh ke pemilik
-- kolam sebagai fallback.
-- Jalankan di Supabase SQL Editor.
-- =============================================================

ALTER TABLE operasional_harian
  ADD COLUMN IF NOT EXISTS dicatat_oleh UUID REFERENCES pengguna(id_pengguna) DEFAULT auth.uid();

ALTER TABLE kualitas_air
  ADD COLUMN IF NOT EXISTS dicatat_oleh UUID REFERENCES pengguna(id_pengguna) DEFAULT auth.uid();

COMMENT ON COLUMN operasional_harian.dicatat_oleh IS 'Pengguna yang menginput entri ini (kolom USER di logbook)';
COMMENT ON COLUMN kualitas_air.dicatat_oleh IS 'Pengguna yang menginput entri ini (kolom USER di logbook)';
