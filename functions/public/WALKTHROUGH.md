# WALKTHROUGH — Penambahan CMS Artikel & Editor Visual Pilihan (SEO & GEO)

**Tanggal:** 19 Mei 2026  
**Fitur:** Sistem Manajemen Konten (CMS) Artikel Dinamis & Editor Visual tingkat Industri

---

## 1. Daftar Perubahan

### ✅ `types.ts`
- Menambahkan rute `/artikel` (`Page.ARTICLES`) dan `/artikel/:slug` (`Page.ARTICLE_DETAIL`) ke dalam `Page` enum.

### ✅ `App.tsx`
- Menambahkan *lazy loading* untuk halaman `Articles.tsx` guna mengoptimasi performa *loading* awal website.
- Mendaftarkan Route `/artikel` dan `/artikel/:slug` di router aplikasi.
- Memperbaiki import `OrderPaymentStatus` agar aplikasi tidak memunculkan ReferenceError.

### ✅ `components/Footer.tsx`
- Menambahkan tautan **"Edukasi & Artikel"** di bawah kategori **Perusahaan** di footer global.

### ✅ `pages/Articles.tsx`
- Halaman premium yang berisi katalog artikel edukasi dengan fitur pencarian judul.
- Mendukung penarikan data dinamis dari tabel `articles` Supabase (hanya artikel berstatus `published`).
- **Sistem Fallback Tangguh**: Jika tabel database belum dibuat/kosong, secara otomatis menggunakan 3 artikel statis awal (sehingga website tetap berjalan normal tanpa crash).
- Mengimplementasikan **injeksi JSON-LD Schema (Article)** secara dinamis menggunakan `useEffect`. Saat bot pencari atau AI crawler masuk ke halaman artikel spesifik, mereka akan disuguhi data terstruktur yang mendefinisikan entitas **PT Ruang Singgah Nusantara** dan deskripsi konten.
- Mendukung rendering konten berbasis HTML string secara dinamis untuk artikel yang ditulis melalui editor visual admin.

### ✅ `components/admin/ArticleManagement.tsx` (BARU)
- Panel CMS admin dengan visual editor HTML/Markdown.
- Menyediakan toolbar formatting instan (`<strong>`, `<em>`, `<h2>`, `<p>`, `<blockquote>`, `<ul>`).
- Input formulir: Judul, Auto-Slug Generator, Kategori, Penulis, Icon Cover, Warna Cover Gradient, Ringkasan SEO, dan Status (Draft/Published).
- Perhitungan waktu baca otomatis berbasis jumlah kata.
- Panduan integrasi SQL Supabase untuk memudahkan administrator.

### ✅ `pages/Dashboard.tsx`
- Menambahkan `'articles'` ke tipe rute `DashboardMenu`.
- Mengimpor komponen admin `ArticleManagement`.
- Menambahkan tombol menu sidebar baru **"Kelola Artikel"** khusus untuk role Admin.

---

## 2. Struktur Tabel Supabase (`articles`)

Salin skrip SQL di bawah ini dan jalankan pada menu **SQL Editor** di dashboard Supabase Console Anda:

```sql
-- 1. Buat Tabel Articles
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    date TEXT NOT NULL,
    read_time TEXT NOT NULL,
    icon TEXT NOT NULL,
    gradient TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Public READ, Admin WRITE)
CREATE POLICY "Allow public read access to published articles"
ON public.articles
FOR SELECT
USING (status = 'published');

CREATE POLICY "Allow all operations for authenticated admin"
ON public.articles
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

---

## 3. Petunjuk Deploy

Untuk meluncurkan pembaruan ini ke server produksi:

```bash
# 1. Kompilasi aset produksi
npm run build

# 2. Deploy ke hosting Anda (misal Firebase Hosting)
firebase deploy --only hosting
```
