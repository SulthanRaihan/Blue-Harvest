# Blue Harvest

**Sistem Informasi Manajemen Tambak**  
Budidaya Ikan Bandeng · Nila · Udang Vaname

---

## Tentang Proyek

Blue Harvest adalah platform manajemen tambak berbasis web yang dirancang untuk membantu petambak, admin, dan manajemen mengelola seluruh siklus budidaya akuakultur dalam satu sistem terintegrasi — dari perencanaan tebar hingga distribusi hasil panen.

Fitur unggulan sistem adalah **modul skoring risiko rule-based** yang membantu petambak menilai kelayakan siklus budidaya sebelum memulai tebar benih.

> Proyek ini dikerjakan sebagai tugas akhir (skripsi) sekaligus proyek klien nyata.

---

## Fitur Utama

| Modul | Deskripsi |
|---|---|
| Perencanaan & Skoring Risiko | Input rencana tebar + simulasi skor risiko (Best / Middle / Worst Case) |
| Operasional Harian | Log pakan, kualitas air manual, catatan hama/penyakit |
| Sampling Pertumbuhan | Sampling mingguan bobot, populasi, dan FCR |
| Panen & Pasca Panen | Catat hasil panen, grade, dan total pendapatan |
| Distribusi | Catat distribusi ke pengepul / pasar / mitra |
| Laporan & Evaluasi | Generate laporan keuangan dan produksi otomatis |
| Manajemen Pengguna | Role-based access: Petambak · Admin · Owner |

---

## Modul Skoring Risiko

Sistem mengevaluasi 4 kategori faktor risiko dengan formula sederhana:

```
Skor per Faktor = Nilai Potensi (1–5) × Nilai Dampak (1–5)
Total Skor      = Σ semua faktor
```

| Total Skor | Kategori |
|---|---|
| ≤ 10 | BEST CASE — risiko rendah |
| 11 – 20 | MIDDLE CASE — perlu mitigasi |
| > 20 | WORST CASE — tinjau ulang rencana |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL, Auth JWT, Realtime, Storage) |
| Business Logic | Supabase Edge Functions |
| PWA | Dapat diinstall di HP/tablet tanpa App Store |

---

## Aktor Sistem

- **Petambak / Operator** — input data lapangan, pantau dashboard
- **Admin** — kelola data master, verifikasi data, generate laporan
- **Manajemen / Owner** — approve rencana budidaya, akses laporan keuangan

---

## Menjalankan Project

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Struktur Proyek

```
blue-harvest/
├── src/
│   └── app/              # Next.js App Router pages
├── diagrams/             # Diagram sumber (.drawio)
│   ├── Final BPMN blok B.drawio
│   ├── 07-arsitektur-sistem.drawio
│   └── ...
├── public/               # Static assets
└── System-Design-Document.html   # SDD lengkap (7 BAB)
```

---

## Status Pengembangan

> **Juli 2026** — Fase UI Development

- [x] System Design Document selesai
- [x] Diagram BPMN, Use Case, DFD, ERD, Arsitektur
- [ ] Implementasi UI & halaman
- [ ] Integrasi Supabase
- [ ] Modul Skoring Risiko
- [ ] Testing & deployment

---

*Blue Harvest — Tambak Lebih Cerdas, Hasil Lebih Pasti.*
