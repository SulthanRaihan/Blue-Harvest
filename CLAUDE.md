# Blue Harvest — Sistem Informasi Manajemen Tambak

## Ringkasan

Blue Harvest adalah sistem informasi manajemen tambak berbasis web untuk budidaya
ikan bandeng, nila, dan udang vaname. Proyek ini dikerjakan untuk dua tujuan sekaligus:
skripsi (tugas akhir) dan proyek klien nyata. Fitur andalan sistem adalah **modul
skoring risiko rule-based** yang membantu petambak menilai kelayakan siklus budidaya
sebelum tebar benih.

Sistem **tidak menggunakan IoT** — semua data kualitas air diinput manual oleh
petambak di lapangan. Sistem juga **tidak memiliki modul Pelanggan/Pembeli maupun
Notifikasi/Alarm** — dua fitur ini sengaja dihilangkan atas permintaan klien.

## Aktor Sistem (hanya 3)

| Aktor | Peran |
|---|---|
| **Petambak / Operator** | Pelaku utama di lapangan. Input rencana tebar, data operasional harian, kualitas air manual, sampling pertumbuhan, dan hasil panen. Memantau dashboard. |
| **Admin** | Mengelola data master (kolam, pengguna, konfigurasi sistem), verifikasi data. |
| **Manajemen / Owner** | Approve rencana budidaya, melihat laporan keuangan dan produksi, evaluasi kinerja. |

## Alur Proses Bisnis (BPMN High Level — Blok A sampai G)

1. **Blok A — Perencanaan dan Analisis**: survey lahan, identifikasi potensi, keputusan kelayakan.
2. **Blok B — Perencanaan Budidaya (Modul Skoring Risiko)**: petambak input rencana tebar → sistem hitung skor risiko → Owner approve/tolak. Ini modul inti skripsi.
3. **Blok C — Persiapan Lahan**: kolam siap, stok material tersedia.
4. **Blok D — Operasional Budidaya**: log harian pakan, kualitas air manual, sampling pertumbuhan mingguan. Fase terpanjang (60–120 hari tergantung komoditas).
5. **Blok E — Panen dan Pasca Panen**: catat hasil panen, sortasi dan QC.
6. **Blok F — Distribusi**: catat distribusi produk ke pasar/pengepul/mitra (bukan ke pelanggan terdaftar — tidak ada entitas Pelanggan di sistem).
7. **Blok G — Evaluasi dan Analisis**: generate laporan otomatis, review siklus berikutnya.

## Modul Skoring Risiko (Rule-Based) — Fitur Inti

Menilai 4 kategori faktor risiko per rencana tebar:
- Risiko Hama dan Penyakit
- Risiko Cuaca dan Iklim
- Risiko Pasar dan Harga
- Risiko Operasional / SDM

**Formula:**
```
Skor per Faktor = Nilai Potensi (1–5) × Nilai Dampak (1–5)
Total Skor      = Jumlah seluruh skor faktor
```

**Klasifikasi:**
| Total Skor | Kategori |
|---|---|
| ≤ 10 | BEST CASE |
| 11 – 20 | MIDDLE CASE |
| > 20 | WORST CASE |

## Modul Sistem (7 modul utama)

1. Perencanaan dan Skoring Risiko
2. Operasional Harian (pakan, hama/penyakit, kualitas air manual)
3. Sampling Pertumbuhan (mingguan: bobot, populasi, FCR)
4. Panen dan Pasca Panen
5. Distribusi
6. Laporan dan Evaluasi
7. Manajemen Pengguna

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js (React) + PWA — bisa diinstall di HP/tablet tanpa App Store |
| Backend Platform | Supabase (all-in-one) |
| Database | PostgreSQL via Supabase — 13 entitas |
| REST API | Supabase PostgREST (auto-generated dari skema) |
| Realtime | Supabase Realtime Engine (WebSocket, live update dashboard) |
| Autentikasi | Supabase Auth (JWT), role-based: petambak \| admin \| owner |
| File Storage | Supabase Storage (laporan PDF, foto dokumentasi panen) |
| Business Logic | Supabase Edge Functions — `fn_scoring_risiko()`, `fn_generate_laporan()` |

Arsitektur terbagi dua zona: **Supabase Platform** (backend terpadu) dan
**Zona Klien** (satu entry point: Dashboard Utama Next.js untuk ketiga aktor
dengan autentikasi penuh — tidak ada portal publik terpisah).

## Skema Database (13 Entitas)

`PENGGUNA`, `KOLAM`, `KOMODITAS`, `RENCANA_TEBAR`, `FAKTOR_RISIKO`,
`SKORING_RISIKO`, `DETAIL_SKORING`, `KUALITAS_AIR`, `OPERASIONAL_HARIAN`,
`SAMPLING_PERTUMBUHAN`, `PANEN`, `DISTRIBUSI`, `LAPORAN`.

Notasi ERD: crow's foot (1:1 dan 1:N), PK ditulis tebal, FK ditulis miring.

## Dokumen dan Diagram Sumber

- `System-Design-Document.docx` — dokumen perancangan sistem lengkap (SDD), 7 BAB.
- `diagrams/Final BPMN blok B.drawio` — file gabungan berisi semua diagram (BPMN detail Blok B, BPMN high level, Use Case, DFD Level 0, DFD Level 1, ERD) dalam satu file multi-page. **Ini file diagram yang aktif/terbaru.**
- `diagrams/07-arsitektur-sistem.drawio` — diagram arsitektur sistem (Supabase + Next.js), terbaru.
- `diagrams/01-06-*.drawio` — file diagram versi lama per-topik, kemungkinan sudah digantikan oleh file gabungan di atas. Cek tanggal modifikasi sebelum dipakai sebagai acuan.

## Aturan Penting (Jangan Dilanggar)

- **Tidak ada IoT.** Semua input data kualitas air manual oleh petambak.
- **Tidak ada entitas/aktor Pelanggan atau Pembeli** di manapun (DB, use case, DFD, ERD, arsitektur).
- **Tidak ada fitur Notifikasi/Alarm.** Threshold kualitas air tetap ada sebagai konsep di deskripsi proses (P3 pada DFD), tapi tidak direalisasikan sebagai modul notifikasi terpisah — jangan bangun sistem notifikasi/push/alert kecuali diminta ulang secara eksplisit.
- Diagram menggunakan gaya monokrom hitam-putih saja, tanpa warna, tanpa header/footer.
- DFD Level 0 dijaga tetap minimal (hanya 3 entitas eksternal); detail proses ditaruh di DFD Level 1.
