-- ════════════════════════════════════════════════════════════
-- MIGRATION 008 — Perbaikan RLS: model single-tenant
-- ════════════════════════════════════════════════════════════
-- Blue Harvest adalah aplikasi SATU usaha tambak dengan 3 role
-- (petambak, admin, owner) — bukan multi-tenant SaaS.
--
-- Masalah lama: policy SELECT kolam & pengguna membatasi baris ke
-- "milik sendiri" untuk petambak, sehingga:
--   • dropdown kolam kosong (kolam dibuat admin, tak terlihat petambak)
--   • daftar pengguna cuma menampilkan diri sendiri
--   • join kolam.pengguna gagal (baris pengguna lain terblokir)
--
-- Solusi: semua user TERAUTENTIKASI boleh MEMBACA seluruh data.
-- Hak TULIS tetap dibatasi per role (approve, generate laporan, dsb).
--
-- Jalankan SETELAH 007_rls_policies.sql.
-- ════════════════════════════════════════════════════════════

-- ── PENGGUNA ─────────────────────────────────────────────────
-- Semua authenticated bisa lihat (dibutuhkan untuk join kolam.pengguna
-- dan halaman manajemen pengguna).
DROP POLICY IF EXISTS "pengguna: lihat diri sendiri" ON pengguna;
DROP POLICY IF EXISTS "pengguna: authenticated read all" ON pengguna;
CREATE POLICY "pengguna: authenticated read all" ON pengguna
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Update: diri sendiri, atau admin/owner boleh ubah role siapa saja.
DROP POLICY IF EXISTS "pengguna: update diri sendiri" ON pengguna;
DROP POLICY IF EXISTS "pengguna: update self or admin" ON pengguna;
CREATE POLICY "pengguna: update self or admin" ON pengguna
  FOR UPDATE USING (id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner'));

-- Insert: user boleh insert baris dirinya sendiri saat registrasi
-- (trigger handle_new_user juga menangani ini, tapi jaga-jaga untuk
--  registrasi via aplikasi).
DROP POLICY IF EXISTS "pengguna: insert self" ON pengguna;
CREATE POLICY "pengguna: insert self" ON pengguna
  FOR INSERT WITH CHECK (id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner'));

-- ── KOLAM ────────────────────────────────────────────────────
-- Semua authenticated bisa lihat semua kolam (satu usaha tambak).
DROP POLICY IF EXISTS "kolam: lihat milik sendiri atau semua role atas" ON kolam;
DROP POLICY IF EXISTS "kolam: authenticated read all" ON kolam;
CREATE POLICY "kolam: authenticated read all" ON kolam
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert & update kolam: petambak (kolam sendiri) atau admin (semua).
DROP POLICY IF EXISTS "kolam: petambak insert kolam sendiri" ON kolam;
CREATE POLICY "kolam: insert petambak/admin" ON kolam
  FOR INSERT WITH CHECK (id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner'));

DROP POLICY IF EXISTS "kolam: petambak update kolam sendiri" ON kolam;
CREATE POLICY "kolam: update petambak/admin" ON kolam
  FOR UPDATE USING (id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner'));
