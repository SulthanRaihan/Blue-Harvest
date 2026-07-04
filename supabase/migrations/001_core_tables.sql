-- ════════════════════════════════════════════════════════════
-- MIGRATION 001 — Core Tables
-- Tabel: PENGGUNA, KOLAM, KOMODITAS
-- + Trigger auto-create pengguna saat user Supabase Auth dibuat
-- ════════════════════════════════════════════════════════════

-- ── 1. PENGGUNA ──────────────────────────────────────────────
-- Terhubung ke auth.users Supabase via UUID yang sama
CREATE TABLE IF NOT EXISTS pengguna (
  id_pengguna   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'petambak'
                  CHECK (role IN ('petambak', 'admin', 'owner')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pengguna IS 'Pengguna sistem — petambak, admin, owner';

-- Auto-create pengguna record setiap kali ada user baru di Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pengguna (id_pengguna, nama, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'petambak')
  )
  ON CONFLICT (id_pengguna) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. KOLAM ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kolam (
  id_kolam      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pengguna   UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT,
  nama_kolam    VARCHAR(100) NOT NULL,
  luas_ha       DECIMAL(8, 2) NOT NULL CHECK (luas_ha > 0),
  lokasi        TEXT,
  status        TEXT NOT NULL DEFAULT 'aktif'
                  CHECK (status IN ('aktif', 'tidak_aktif')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE kolam IS 'Data kolam / petak tambak milik petambak';
CREATE INDEX IF NOT EXISTS idx_kolam_pengguna ON kolam(id_pengguna);
CREATE INDEX IF NOT EXISTS idx_kolam_status   ON kolam(status);

-- ── 3. KOMODITAS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS komoditas (
  id_komoditas        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama                TEXT NOT NULL UNIQUE
                        CHECK (nama IN ('bandeng', 'nila', 'udang_vaname')),
  target_ph_min       DECIMAL(4, 2) NOT NULL,
  target_ph_max       DECIMAL(4, 2) NOT NULL,
  target_suhu_min     DECIMAL(5, 2) NOT NULL,
  target_suhu_max     DECIMAL(5, 2) NOT NULL,
  target_do_min       DECIMAL(5, 2) NOT NULL,
  target_salinitas_min DECIMAL(5, 2) NOT NULL,
  target_salinitas_max DECIMAL(5, 2) NOT NULL,
  fcr_standar         DECIMAL(4, 2) NOT NULL
);

COMMENT ON TABLE komoditas IS 'Parameter standar per komoditas budidaya';
