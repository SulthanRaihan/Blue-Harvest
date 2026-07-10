-- ════════════════════════════════════════════════════════════
-- MIGRATION 010 — Biaya Operasional, Persiapan Kolam, Harga Acuan
-- Tabel baru: BIAYA_OPERASIONAL, PERSIAPAN_KOLAM
-- Kolom baru: KOMODITAS.harga_acuan_per_kg
-- Jalankan SETELAH 009_rls_clean_rebuild.sql
-- ════════════════════════════════════════════════════════════

-- ── BIAYA_OPERASIONAL ────────────────────────────────────────
-- Breakdown biaya di luar pakan (yang sudah dicatat di operasional_harian)
-- supaya modal_rp (lump-sum di rencana_tebar) bisa dirinci per kategori.
CREATE TABLE IF NOT EXISTS biaya_operasional (
  id_biaya    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rencana  UUID NOT NULL REFERENCES rencana_tebar(id_rencana) ON DELETE RESTRICT,
  tanggal     DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori    VARCHAR(30) NOT NULL CHECK (kategori IN ('benih','pakan','listrik','tenaga_kerja','obat_probiotik','lainnya')),
  jumlah_rp   DECIMAL(12, 2) NOT NULL CHECK (jumlah_rp >= 0),
  catatan     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE biaya_operasional IS 'Rincian biaya operasional per kategori (pelengkap modal_rp yang lump-sum)';
CREATE INDEX IF NOT EXISTS idx_biaya_rencana ON biaya_operasional(id_rencana);

ALTER TABLE biaya_operasional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biaya_select" ON biaya_operasional
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "biaya_write" ON biaya_operasional
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ── PERSIAPAN_KOLAM ──────────────────────────────────────────
-- Checklist persiapan tambak (Blok C SOP) sebelum tebar benih.
-- Non-blocking/informational — tidak menghalangi pembuatan rencana_tebar.
CREATE TABLE IF NOT EXISTS persiapan_kolam (
  id_persiapan    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kolam        UUID NOT NULL REFERENCES kolam(id_kolam) ON DELETE CASCADE,
  item            VARCHAR(30) NOT NULL CHECK (item IN ('pengeringan','pengapuran','perbaikan_pematang','pengisian_air','pemupukan','cek_kualitas_air')),
  selesai         BOOLEAN NOT NULL DEFAULT FALSE,
  tanggal_selesai DATE,
  catatan         TEXT,
  foto_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_kolam, item)
);

COMMENT ON TABLE persiapan_kolam IS 'Checklist persiapan tambak per kolam (pengeringan, pengapuran, dst — Blok C SOP)';
CREATE INDEX IF NOT EXISTS idx_persiapan_kolam ON persiapan_kolam(id_kolam);

ALTER TABLE persiapan_kolam ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persiapan_select" ON persiapan_kolam
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "persiapan_write" ON persiapan_kolam
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ── KOMODITAS.harga_acuan_per_kg ─────────────────────────────
-- Harga acuan admin-editable, dipakai buat estimasi omset kalau
-- belum ada histori panen buat komoditas itu.
ALTER TABLE komoditas ADD COLUMN IF NOT EXISTS harga_acuan_per_kg DECIMAL(12, 2);
COMMENT ON COLUMN komoditas.harga_acuan_per_kg IS 'Harga acuan per kg (admin-editable) untuk estimasi omset sebelum ada histori panen';
