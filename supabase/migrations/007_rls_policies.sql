-- ════════════════════════════════════════════════════════════
-- MIGRATION 007 — Row Level Security (RLS)
-- Atur akses per role: petambak, admin, owner
-- Jalankan SETELAH 006_seed_data.sql
-- ════════════════════════════════════════════════════════════

-- Helper function: ambil role dari tabel pengguna
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.pengguna WHERE id_pengguna = auth.uid();
$$;

-- ── Enable RLS semua tabel ────────────────────────────────────
ALTER TABLE pengguna           ENABLE ROW LEVEL SECURITY;
ALTER TABLE kolam              ENABLE ROW LEVEL SECURITY;
ALTER TABLE komoditas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_tebar      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faktor_risiko      ENABLE ROW LEVEL SECURITY;
ALTER TABLE skoring_risiko     ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_skoring     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kualitas_air       ENABLE ROW LEVEL SECURITY;
ALTER TABLE operasional_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE sampling_pertumbuhan ENABLE ROW LEVEL SECURITY;
ALTER TABLE panen              ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribusi         ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan            ENABLE ROW LEVEL SECURITY;

-- ── PENGGUNA ─────────────────────────────────────────────────
-- Tiap user hanya bisa lihat/edit data dirinya sendiri; admin bisa semua
CREATE POLICY "pengguna: lihat diri sendiri" ON pengguna
  FOR SELECT USING (id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner'));

CREATE POLICY "pengguna: update diri sendiri" ON pengguna
  FOR UPDATE USING (id_pengguna = auth.uid());

-- ── KOMODITAS & FAKTOR_RISIKO — read-only untuk semua ────────
CREATE POLICY "komoditas: read all" ON komoditas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "faktor_risiko: read all" ON faktor_risiko
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── KOLAM ────────────────────────────────────────────────────
CREATE POLICY "kolam: lihat milik sendiri atau semua role atas" ON kolam
  FOR SELECT USING (
    id_pengguna = auth.uid() OR get_user_role() IN ('admin', 'owner')
  );

CREATE POLICY "kolam: petambak insert kolam sendiri" ON kolam
  FOR INSERT WITH CHECK (id_pengguna = auth.uid());

CREATE POLICY "kolam: petambak update kolam sendiri" ON kolam
  FOR UPDATE USING (id_pengguna = auth.uid() OR get_user_role() = 'admin');

-- ── RENCANA_TEBAR ────────────────────────────────────────────
CREATE POLICY "rencana: semua authenticated bisa lihat" ON rencana_tebar
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "rencana: petambak insert" ON rencana_tebar
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM kolam WHERE id_kolam = rencana_tebar.id_kolam AND id_pengguna = auth.uid())
  );

CREATE POLICY "rencana: owner bisa approve" ON rencana_tebar
  FOR UPDATE USING (get_user_role() IN ('owner', 'admin'));

-- ── SKORING_RISIKO & DETAIL_SKORING ──────────────────────────
CREATE POLICY "skoring: semua authenticated bisa lihat" ON skoring_risiko
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "skoring: petambak bisa insert" ON skoring_risiko
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "detail_skoring: semua authenticated bisa lihat" ON detail_skoring
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "detail_skoring: petambak bisa insert" ON detail_skoring
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── OPERASIONAL (kualitas_air, operasional_harian, sampling) ─
CREATE POLICY "kualitas_air: lihat semua" ON kualitas_air
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "kualitas_air: petambak insert" ON kualitas_air
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "kualitas_air: petambak update" ON kualitas_air
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "operasional: lihat semua" ON operasional_harian
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "operasional: petambak insert/update" ON operasional_harian
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "sampling: lihat semua" ON sampling_pertumbuhan
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sampling: petambak insert/update" ON sampling_pertumbuhan
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ── PANEN & DISTRIBUSI ────────────────────────────────────────
CREATE POLICY "panen: lihat semua" ON panen
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "panen: petambak/admin insert" ON panen
  FOR INSERT WITH CHECK (get_user_role() IN ('petambak', 'admin'));

CREATE POLICY "distribusi: lihat semua" ON distribusi
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "distribusi: petambak/admin insert" ON distribusi
  FOR INSERT WITH CHECK (get_user_role() IN ('petambak', 'admin'));
CREATE POLICY "distribusi: update status" ON distribusi
  FOR UPDATE USING (get_user_role() IN ('petambak', 'admin'));

-- ── LAPORAN ──────────────────────────────────────────────────
CREATE POLICY "laporan: lihat semua" ON laporan
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "laporan: admin bisa generate" ON laporan
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'owner'));
CREATE POLICY "laporan: owner bisa approve" ON laporan
  FOR UPDATE USING (get_user_role() IN ('owner', 'admin'));
