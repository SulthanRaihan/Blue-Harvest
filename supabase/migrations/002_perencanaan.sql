-- ════════════════════════════════════════════════════════════
-- MIGRATION 002 — Perencanaan & Skoring Risiko
-- Tabel: RENCANA_TEBAR, FAKTOR_RISIKO, SKORING_RISIKO, DETAIL_SKORING
-- Jalankan SETELAH 001_core_tables.sql
-- ════════════════════════════════════════════════════════════

-- ── 4. RENCANA_TEBAR ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rencana_tebar (
  id_rencana      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kolam        UUID NOT NULL REFERENCES kolam(id_kolam) ON DELETE RESTRICT,
  id_komoditas    UUID NOT NULL REFERENCES komoditas(id_komoditas) ON DELETE RESTRICT,
  id_approved_by  UUID REFERENCES pengguna(id_pengguna) ON DELETE SET NULL,
  modal_rp        BIGINT NOT NULL CHECK (modal_rp >= 0),
  jumlah_benih    INTEGER NOT NULL CHECK (jumlah_benih > 0),
  tanggal_rencana DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'approved', 'aktif', 'selesai')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rencana_tebar IS 'Rencana tebar benih per kolam per siklus budidaya';
CREATE INDEX IF NOT EXISTS idx_rencana_kolam    ON rencana_tebar(id_kolam);
CREATE INDEX IF NOT EXISTS idx_rencana_status   ON rencana_tebar(status);
CREATE INDEX IF NOT EXISTS idx_rencana_tanggal  ON rencana_tebar(tanggal_rencana DESC);

-- ── 5. FAKTOR_RISIKO ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faktor_risiko (
  id_faktor      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_faktor    TEXT NOT NULL UNIQUE
                   CHECK (nama_faktor IN ('hama', 'cuaca', 'pasar', 'sdm')),
  deskripsi      TEXT NOT NULL,
  bobot_default  DECIMAL(4, 2) NOT NULL DEFAULT 1.0
);

COMMENT ON TABLE faktor_risiko IS 'Master faktor risiko yang dinilai dalam skoring';

-- ── 6. SKORING_RISIKO ────────────────────────────────────────
-- Relasi 1:1 dengan rencana_tebar
CREATE TABLE IF NOT EXISTS skoring_risiko (
  id_skoring    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rencana    UUID NOT NULL UNIQUE REFERENCES rencana_tebar(id_rencana) ON DELETE CASCADE,
  total_skor    INTEGER NOT NULL CHECK (total_skor >= 0),
  kategori      TEXT NOT NULL
                  CHECK (kategori IN ('best', 'middle', 'worst')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE skoring_risiko IS 'Hasil skoring risiko per rencana tebar (1:1)';
CREATE INDEX IF NOT EXISTS idx_skoring_rencana ON skoring_risiko(id_rencana);

-- ── 7. DETAIL_SKORING ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detail_skoring (
  id_detail       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_skoring      UUID NOT NULL REFERENCES skoring_risiko(id_skoring) ON DELETE CASCADE,
  id_faktor       UUID NOT NULL REFERENCES faktor_risiko(id_faktor) ON DELETE RESTRICT,
  nilai_potensi   SMALLINT NOT NULL CHECK (nilai_potensi BETWEEN 1 AND 5),
  nilai_dampak    SMALLINT NOT NULL CHECK (nilai_dampak BETWEEN 1 AND 5),
  skor_hasil      SMALLINT NOT NULL GENERATED ALWAYS AS (nilai_potensi * nilai_dampak) STORED,
  UNIQUE (id_skoring, id_faktor)
);

COMMENT ON TABLE detail_skoring IS 'Detail skor per faktor risiko (Potensi x Dampak)';
CREATE INDEX IF NOT EXISTS idx_detail_skoring ON detail_skoring(id_skoring);
