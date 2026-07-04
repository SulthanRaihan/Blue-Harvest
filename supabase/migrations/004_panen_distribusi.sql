-- ════════════════════════════════════════════════════════════
-- MIGRATION 004 — Panen & Distribusi
-- Tabel: PANEN, DISTRIBUSI
-- Jalankan SETELAH 003_operasional.sql
-- ════════════════════════════════════════════════════════════

-- ── 11. PANEN ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS panen (
  id_panen          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rencana        UUID NOT NULL REFERENCES rencana_tebar(id_rencana) ON DELETE RESTRICT,
  tanggal_panen     DATE NOT NULL DEFAULT CURRENT_DATE,
  total_bobot_kg    DECIMAL(10, 2) NOT NULL CHECK (total_bobot_kg > 0),
  grade             TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  harga_per_kg      DECIMAL(12, 2) NOT NULL CHECK (harga_per_kg > 0),
  total_pendapatan  BIGINT NOT NULL GENERATED ALWAYS AS
                      (FLOOR(total_bobot_kg * harga_per_kg)::BIGINT) STORED,
  catatan           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE panen IS 'Hasil panen per siklus budidaya';
CREATE INDEX IF NOT EXISTS idx_panen_rencana ON panen(id_rencana);
CREATE INDEX IF NOT EXISTS idx_panen_tanggal ON panen(tanggal_panen DESC);

-- ── 12. DISTRIBUSI ───────────────────────────────────────────
-- Tidak ada entitas Pelanggan — nama penerima disimpan sebagai teks
-- (pengepul / pasar / mitra — bukan user terdaftar)
CREATE TABLE IF NOT EXISTS distribusi (
  id_distribusi       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_panen            UUID NOT NULL REFERENCES panen(id_panen) ON DELETE RESTRICT,
  nama_penerima       VARCHAR(255) NOT NULL,
  tipe_penerima       TEXT NOT NULL DEFAULT 'pengepul'
                        CHECK (tipe_penerima IN ('pengepul', 'pasar', 'mitra', 'lainnya')),
  tanggal             DATE NOT NULL DEFAULT CURRENT_DATE,
  bobot_kg            DECIMAL(10, 2) NOT NULL CHECK (bobot_kg > 0),
  harga_jual_per_kg   DECIMAL(12, 2) NOT NULL CHECK (harga_jual_per_kg > 0),
  total_nilai         BIGINT NOT NULL GENERATED ALWAYS AS
                        (FLOOR(bobot_kg * harga_jual_per_kg)::BIGINT) STORED,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'selesai')),
  catatan             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE distribusi IS 'Distribusi produk panen ke pengepul/pasar/mitra';
CREATE INDEX IF NOT EXISTS idx_distribusi_panen  ON distribusi(id_panen);
CREATE INDEX IF NOT EXISTS idx_distribusi_status ON distribusi(status);
