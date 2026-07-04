-- ════════════════════════════════════════════════════════════
-- MIGRATION 005 — Laporan
-- Tabel: LAPORAN
-- Jalankan SETELAH 004_panen_distribusi.sql
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS laporan (
  id_laporan          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rencana          UUID NOT NULL REFERENCES rencana_tebar(id_rencana) ON DELETE RESTRICT,
  id_approved_by      UUID REFERENCES pengguna(id_pengguna) ON DELETE SET NULL,
  periode             VARCHAR(50) NOT NULL,
  total_produksi_kg   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_biaya         BIGINT NOT NULL DEFAULT 0,
  total_pendapatan    BIGINT NOT NULL DEFAULT 0,
  laba_rugi           BIGINT NOT NULL GENERATED ALWAYS AS
                        (total_pendapatan - total_biaya) STORED,
  fcr_rata            DECIMAL(5, 3),
  catatan_evaluasi    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE laporan IS 'Laporan keuangan dan produksi per siklus budidaya';
CREATE INDEX IF NOT EXISTS idx_laporan_rencana ON laporan(id_rencana);
CREATE INDEX IF NOT EXISTS idx_laporan_periode ON laporan(periode);
