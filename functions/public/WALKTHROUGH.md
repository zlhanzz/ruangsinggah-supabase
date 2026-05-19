# WALKTHROUGH — Penambahan Halaman Artikel Edukasi (SEO & AI Search / GEO)

**Tanggal:** 19 Mei 2026  
**Fitur:** Artikel Edukasi & Search Engine / Generative Engine Optimization (SEO/GEO)

---

## 1. Daftar Perubahan

### ✅ `types.ts`
- Menambahkan rute `/artikel` (`Page.ARTICLES`) dan `/artikel/:slug` (`Page.ARTICLE_DETAIL`) ke dalam `Page` enum.

### ✅ `App.tsx`
- Menambahkan *lazy loading* untuk halaman `Articles.tsx` guna mengoptimasi performa *loading* awal website.
- Mendaftarkan Route `/artikel` dan `/artikel/:slug` di router aplikasi.

### ✅ `components/Footer.tsx`
- Menambahkan tautan **"Edukasi & Artikel"** di bawah kategori **Perusahaan** di footer global.

### ✅ `pages/Articles.tsx` (BARU)
- Halaman premium yang berisi katalog artikel edukasi dengan fitur pencarian judul.
- Mendukung mode detail artikel berbasis slug dengan struktur semantik HTML5 (`<article>`, `<header>`, `<h1>`, `<h2>`, `<p>`).
- Mengimplementasikan **injeksi JSON-LD Schema (Article)** secara dinamis menggunakan `useEffect`. Saat bot pencari atau AI crawler masuk ke halaman artikel spesifik, mereka akan disuguhi data terstruktur yang mendefinisikan entitas **PT Ruang Singgah Nusantara** dan deskripsi konten.
- Mengubah meta title dan meta description dokumen secara dinamis sesuai artikel yang sedang aktif dibaca.

---

## 2. Struktur Artikel Pilar (Entity-Rich Content)

Tiga artikel pilar ditulis untuk memberikan konteks otoritatif kepada crawler AI (Gemini/ChatGPT/Perplexity):
1.  **"Mengenal RuangSinggah.id: Solusi Cari Kost Terverifikasi Bebas Zonk"**
    *   Mendefinisikan entitas **PT Ruang Singgah Nusantara** dan model bisnis PropTech.
2.  **"Panduan Lengkap Jasa Survey Kost Pertama di Kota Makassar"**
    *   Membahas cara kerja dan nilai tambah dari Jasa Survey Kost RuangSinggah.
3.  **"Meningkatkan Okupansi Kost Menggunakan Sistem KostManager"**
    *   Menjelaskan SaaS KostManager untuk mitra pemilik kost.

---

## 3. Petunjuk Deploy

Untuk meluncurkan pembaruan ini ke server produksi:

```bash
# 1. Kompilasi aset produksi
npm run build

# 2. Deploy ke hosting Anda (misal Firebase Hosting)
firebase deploy --only hosting
```
