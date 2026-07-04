-- ════════════════════════════════════════════════════════════
-- MIGRATION 003 — Operasional Harian
-- Tabel: KUALITAS_AIR, OPERASIONAL_HARIAN, SAMPLING_PERTUMBUHAN
-- Jalankan SETELAH 002_perencanaan.sql
-- ════════════════════════════════════════════════════════════

-- ── 8. KUALITAS_AIR ──────────────────────────────────────────
-- Input manual oleh petambak (tidak ada IoT)
CREATE TABLE IF NOT EXISTS kualitas_air (
  id_kualitas     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kolam        UUID NOT NULL REFERENCES kolam(id_kolam) ON DELETE RESTRICT,
  id_rencana      UUID REFERENCES rencana_tebar(id_rencana) ON DELETE SET NULL,
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  ph              DECIMAL(4, 2) CHECK (ph BETWEEN 0 AND 14),
  do_ppm          DECIMAL(5, 2) CHECK (do_ppm >= 0),
  suhu_celsius    DECIMAL(5, 2) CHECK (suhu_celsius BETWEEN 0 AND 50),
  salinitas_ppt   DECIMAL(5, 2) CHECK (salinitas_ppt >= 0),
  catatan         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE kualitas_air IS 'Data kualitas air harian — input manual petambak';
CREATE INDEX IF NOT EXISTS idx_kualitas_kolam   ON kualitas_air(id_kolam);
CREATE INDEX IF NOT EXISTS idx_kualitas_tanggal ON kualitas_air(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_kualitas_rencana ON kualitas_air(id_rencana);

-- ── 9. OPERASIONAL_HARIAN ────────────────────────────────────
CREATE TABLE IF NOT EXISTS operasional_harian (
  id_operasional          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rencana              UUID NOT NULL REFERENCES rencana_tebar(id_rencana) ON DELETE RESTRICT,
  tanggal                 DATE NOT NULL DEFAULT CURRENT_DATE,
  jumlah_pakan_kg         DECIMAL(8, 3) NOT NULL DEFAULT 0 CHECK (jumlah_pakan_kg >= 0),
  jenis_pakan             VARCHAR(100),
  catatan_hama_penyakit   TEXT,
  tindakan                TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_rencana, tanggal)
);

COMMENT ON TABLE operasional_harian IS 'Log harian pakan dan catatan hama/penyakit';
CREATE INDEX IF NOT EXISTS idx_operasional_rencana ON operasional_harian(id_rencana);
CREATE INDEX IF NOT EXISTS idx_operasional_tanggal ON operasional_harian(tanggal DESC);

-- ── 10. SAMPLING_PERTUMBUHAN ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sampling_pertumbuhan (
  id_sampling         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rencana          UUID NOT NULL REFERENCES rencana_tebar(id_rencana) ON DELETE RESTRICT,
  tanggal             DATE NOT NULL DEFAULT CURRENT_DATE,
  minggu_ke           SMALLINT NOT NULL CHECK (minggu_ke > 0),
  rata_berat_gram     DECIMAL(8, 2) NOT NULL CHECK (rata_berat_gram > 0),
  estimasi_populasi   INTEGER NOT NULL CHECK (estimasi_populasi >= 0),
  fcr                 DECIMAL(5, 3) CHECK (fcr >= 0),
  catatan             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_rencana, minggu_ke)
);

COMMENT ON TABLE sampling_pertumbuhan IS 'Sampling mingguan bobot, populasi, dan FCR';
CREATE INDEX IF NOT EXISTS idx_sampling_rencana ON sampling_pertumbuhan(id_rencana);
CREATE INDEX IF NOT EXISTS idx_sampling_tanggal ON sampling_pertumbuhan(tanggal DESC);
