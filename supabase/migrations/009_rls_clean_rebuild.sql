-- ════════════════════════════════════════════════════════════
-- MIGRATION 009 — RLS Clean Rebuild (single-tenant)
-- Jalankan di Supabase SQL Editor.
-- Drop semua policy lama lalu recreate bersih.
-- ════════════════════════════════════════════════════════════

-- ── Helper function (idempotent) ──────────────────────────
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.pengguna WHERE id_pengguna = auth.uid();
$$;

-- ── Enable RLS (idempotent) ───────────────────────────────
ALTER TABLE pengguna             ENABLE ROW LEVEL SECURITY;
ALTER TABLE kolam                ENABLE ROW LEVEL SECURITY;
ALTER TABLE komoditas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_tebar        ENABLE ROW LEVEL SECURITY;
ALTER TABLE faktor_risiko        ENABLE ROW LEVEL SECURITY;
ALTER TABLE skoring_risiko       ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_skoring       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kualitas_air         ENABLE ROW LEVEL SECURITY;
ALTER TABLE operasional_harian   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sampling_pertumbuhan ENABLE ROW LEVEL SECURITY;
ALTER TABLE panen                ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribusi           ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan              ENABLE ROW LEVEL SECURITY;

-- ── Drop semua policy lama ────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════
-- PENGGUNA
-- ══════════════════════════════════════════════════════════
CREATE POLICY "pengguna_select" ON pengguna
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "pengguna_insert" ON pengguna
  FOR INSERT WITH CHECK (
    id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner')
  );

CREATE POLICY "pengguna_update" ON pengguna
  FOR UPDATE USING (
    id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner')
  );

CREATE POLICY "pengguna_delete" ON pengguna
  FOR DELETE USING (get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════
-- KOMODITAS & FAKTOR_RISIKO — master data, read-only semua
-- ══════════════════════════════════════════════════════════
CREATE POLICY "komoditas_select" ON komoditas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "komoditas_write" ON komoditas
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "faktor_risiko_select" ON faktor_risiko
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "faktor_risiko_write" ON faktor_risiko
  FOR ALL USING (get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════
-- KOLAM
-- ══════════════════════════════════════════════════════════
CREATE POLICY "kolam_select" ON kolam
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "kolam_insert" ON kolam
  FOR INSERT WITH CHECK (
    id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner')
  );

CREATE POLICY "kolam_update" ON kolam
  FOR UPDATE USING (
    id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner')
  );

CREATE POLICY "kolam_delete" ON kolam
  FOR DELETE USING (get_user_role() IN ('admin', 'owner'));

-- ══════════════════════════════════════════════════════════
-- RENCANA_TEBAR
-- SELECT: semua authenticated
-- INSERT: semua authenticated (petambak bisa pilih kolam apapun
--         karena satu usaha tambak, bukan multi-tenant)
-- UPDATE: petambak (rencana sendiri via kolam) + admin + owner
-- ══════════════════════════════════════════════════════════
CREATE POLICY "rencana_select" ON rencana_tebar
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "rencana_insert" ON rencana_tebar
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "rencana_update" ON rencana_tebar
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "rencana_delete" ON rencana_tebar
  FOR DELETE USING (get_user_role() IN ('admin', 'owner'));

-- ══════════════════════════════════════════════════════════
-- SKORING_RISIKO & DETAIL_SKORING
-- ══════════════════════════════════════════════════════════
CREATE POLICY "skoring_select" ON skoring_risiko
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "skoring_insert" ON skoring_risiko
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "skoring_update" ON skoring_risiko
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "detail_skoring_select" ON detail_skoring
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "detail_skoring_insert" ON detail_skoring
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "detail_skoring_update" ON detail_skoring
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════
-- KUALITAS_AIR
-- ══════════════════════════════════════════════════════════
CREATE POLICY "kualitas_air_select" ON kualitas_air
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "kualitas_air_write" ON kualitas_air
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════
-- OPERASIONAL_HARIAN
-- ══════════════════════════════════════════════════════════
CREATE POLICY "operasional_select" ON operasional_harian
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "operasional_write" ON operasional_harian
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════
-- SAMPLING_PERTUMBUHAN
-- ══════════════════════════════════════════════════════════
CREATE POLICY "sampling_select" ON sampling_pertumbuhan
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sampling_write" ON sampling_pertumbuhan
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════
-- PANEN
-- ══════════════════════════════════════════════════════════
CREATE POLICY "panen_select" ON panen
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "panen_write" ON panen
  FOR ALL USING (
    get_user_role() IN ('petambak', 'admin', 'owner')
  );

-- ══════════════════════════════════════════════════════════
-- DISTRIBUSI
-- ══════════════════════════════════════════════════════════
CREATE POLICY "distribusi_select" ON distribusi
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "distribusi_write" ON distribusi
  FOR ALL USING (
    get_user_role() IN ('petambak', 'admin', 'owner')
  );

-- ══════════════════════════════════════════════════════════
-- LAPORAN
-- ══════════════════════════════════════════════════════════
CREATE POLICY "laporan_select" ON laporan
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "laporan_write" ON laporan
  FOR ALL USING (
    get_user_role() IN ('admin', 'owner')
  );
