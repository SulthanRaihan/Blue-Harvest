-- ============================================================
-- HAPUS DATA DEMO — pasangan dari demo_seed.sql DAN demo_seed_panen.sql
-- ============================================================
-- Menghapus semua data yang ditandai "[DEMO]" di nama_kolam (dari
-- kedua file seed sekaligus, tidak perlu dijalankan terpisah),
-- urut sesuai foreign key (child dulu baru parent) supaya tidak
-- kena constraint ON DELETE RESTRICT.
-- Jalankan di Supabase SQL Editor kapan saja demo sudah tidak perlu.
-- ============================================================

DO $$
DECLARE
  v_ids UUID[];
BEGIN
  SELECT array_agg(id_kolam) INTO v_ids FROM kolam WHERE nama_kolam LIKE '[DEMO]%';

  IF v_ids IS NULL THEN
    RAISE NOTICE 'Tidak ada data demo ditemukan — tidak ada yang dihapus';
    RETURN;
  END IF;

  DELETE FROM biaya_operasional      WHERE id_rencana IN (SELECT id_rencana FROM rencana_tebar WHERE id_kolam = ANY(v_ids));
  DELETE FROM sampling_pertumbuhan   WHERE id_rencana IN (SELECT id_rencana FROM rencana_tebar WHERE id_kolam = ANY(v_ids));
  DELETE FROM operasional_harian     WHERE id_rencana IN (SELECT id_rencana FROM rencana_tebar WHERE id_kolam = ANY(v_ids));
  DELETE FROM distribusi             WHERE id_panen IN (
    SELECT id_panen FROM panen WHERE id_rencana IN (SELECT id_rencana FROM rencana_tebar WHERE id_kolam = ANY(v_ids))
  );
  DELETE FROM panen                  WHERE id_rencana IN (SELECT id_rencana FROM rencana_tebar WHERE id_kolam = ANY(v_ids));
  DELETE FROM detail_skoring         WHERE id_skoring IN (
    SELECT id_skoring FROM skoring_risiko WHERE id_rencana IN (SELECT id_rencana FROM rencana_tebar WHERE id_kolam = ANY(v_ids))
  );
  DELETE FROM skoring_risiko         WHERE id_rencana IN (SELECT id_rencana FROM rencana_tebar WHERE id_kolam = ANY(v_ids));
  DELETE FROM rencana_tebar          WHERE id_kolam = ANY(v_ids);
  DELETE FROM kualitas_air           WHERE id_kolam = ANY(v_ids);
  DELETE FROM persiapan_kolam        WHERE id_kolam = ANY(v_ids);
  DELETE FROM kolam                  WHERE id_kolam = ANY(v_ids);

  RAISE NOTICE 'Data demo dihapus: % kolam beserta seluruh data turunannya', array_length(v_ids, 1);
END $$;
