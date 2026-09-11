# Implementation Plan - Pemulihan Menu Navigasi 'Artikel & Edukasi' di Footer

Dokumen ini disusun untuk menganalisis penyebab hilangnya menu artikel pada footer UI/UX saat ini, melaporkan status struktur kode dan data artikel di database Supabase, serta merencanakan langkah pemulihan menu artikel di footer.

---

## 1. Analisis Masalah & Hasil Pengecekan Sistem

### A. Mengapa Menu Artikel Hilang di Footer UI/UX Sekarang?
- Pada pembaruan antarmuka footer sebelumnya (migrasi ke grid 12 kolom dengan penataan baru grup media sosial: Platform Utama, Pemasaran Kost, dan Info Villa), tautan menu `Artikel & Edukasi` yang sebelumnya berada di bawah kolom `PERUSAHAAN` secara tidak sengaja terlewatkan (*omitted*) dari daftar tautan.
- Akibatnya, pengunjung web tidak memiliki tautan langsung untuk mengakses halaman katalog artikel dari footer, meskipun sistem backend dan frontend-nya tetap aktif.

### B. Apakah Sistem & Struktur Kodenya Masih Ada?
**STATUS: 100% LENGKAP & AKTIF**
1. **Routing (`functions/public/App.tsx`)**:
   - Rute publik `/artikel` (`<Route path={Page.ARTICLES} element={<Articles />} />`) dan `/artikel/:slug` (`<Route path={Page.ARTICLE_DETAIL} element={<Articles />} />`) masih terdaftar dan aktif (baris 774-775).
2. **Page Component (`functions/public/pages/Articles.tsx`)**:
   - Komponen halaman `Articles.tsx` (929 baris) masih utuh dan berfungsi penuh, lengkap dengan:
     - Fitur pencarian artikel (*Search input*).
     - Filter berdasarkan kategori (`Edukasi`, `Panduan`, `Berita`, `Tips`, `Bisnis`, `Mitra Kost`).
     - Tampilan artikel unggulan (*Featured Post*) dan artikel pendukung (*Grid Articles*).
     - Halaman detail artikel dengan pembacaan isi konten, waktu baca, tanggal terbit, serta rekomendasi artikel terkait.
     - Optimasi SEO via `react-helmet-async` dan Schema.org JSON-LD structured data.
3. **Konstanta Navigasi (`functions/public/types.ts`)**:
   - `Page.ARTICLES = '/artikel'` dan `Page.ARTICLE_DETAIL = '/artikel/:slug'` terdefinisi aktif (baris 206-207).
4. **Sistem Admin CMS (`functions/public/components/admin/ArticleManagement.tsx` & `Dashboard.tsx`)**:
   - Fitur admin "Kelola Artikel" untuk menulis, mengedit, mengunggah banner, dan menerbitkan artikel baru ke database masih terpasang di Dashboard Admin.

### C. Apakah Artikel yang Sebelumnya Diterbitkan Masih Ada di Database?
**STATUS: MASIH ADA & TERSIMPAN AMAN DI SUPABASE**
- Kami telah menjalankan pemeriksaan langsung ke database Supabase via query:
  ```javascript
  const { data, error } = await supabase.from('articles').select('*');
  ```
- **Hasil Verifikasi Database**:
  - Tabel `articles` **tersedia dan aktif** di Supabase.
  - Artikel yang telah diterbitkan sebelumnya **masih tersimpan utuh**, antara lain:
    - **ID**: `7f1c3d64-3fc7-4acd-86dd-5447040362bc`
    - **Judul**: *"Mengenal Ruang Singgah: Transformasi Digital Manajemen dan Pencarian Kost."*
    - **Slug**: `mengenal-ruang-singgah-transformasi-digital-manajemen-dan-pencarian-kost`
    - **Status**: `published`
    - **Kategori**: `Panduan`
    - **Penulis**: `Admin RuangSinggah`
    - **Tanggal**: `19 Mei 2026`
    - **Cover Banner**: Tersimpan di Supabase Storage (`banners/articles/covers/cover_6mudz9v3za4.png`).
  - Selain artikel database tersebut, sistem `Articles.tsx` juga memiliki 4 artikel kurasi statis (*fallback/bawaan*) yang secara otomatis digabungkan (*merge*):
    1. *"Mengenal RuangSinggah.id: Solusi Cari Kost Terverifikasi Bebas Zonk"*
    2. *"Panduan Lengkap Jasa Survey Kost Pertama di Kota Makassar"*
    3. *"Program Referral Agen: Ajak Pemilik Kost Bergabung & Dapatkan Bonus Rp 50.000"*
    4. *"Meningkatkan Okupansi Kost Menggunakan Sistem KostManager"*

---

## 2. Dampak Perubahan (File yang Tersentuh)

Perubahan ini bersifat terisolasi dan aman (low-risk UI update):
- `functions/public/components/Footer.tsx`: Menambahkan tombol menu navigasi `Artikel & Edukasi` di bawah kolom `PERUSAHAAN`.
- `functions/PROGRESS.md`: Mencatat riwayat progres (Entri 404).
- `WALKTHROUGH.md`: Menyajikan ringkasan hasil pekerjaan dan panduan pengujian.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Persetujuan)

1. **Modifikasi `Footer.tsx`**:
   - Menambahkan item navigasi `Artikel & Edukasi` ke dalam daftar kolom `PERUSAHAAN`:
     ```tsx
     <li>
       <button 
         onClick={() => onPageChange(Page.ARTICLES)} 
         className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
       >
         Artikel & Edukasi
       </button>
     </li>
     ```
   - Memastikan styling, transisi hover, dan aksesibilitas konsisten dengan elemen menu lainnya.

2. **Uji Kompilasi Build**:
   - Menjalankan perintah build `npm.cmd run build` pada folder `functions/public` untuk memastikan kompilasi Vite/TypeScript 100% lulus tanpa ada error atau broken link.

3. **Pencatatan Riwayat & Walkthrough**:
   - Mencatat progres ke `functions/PROGRESS.md`.
   - Membuat panduan peninjauan di `WALKTHROUGH.md`.

4. **Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Build**: Memastikan `npm.cmd run build` menghasilkan bundle produksi tanpa error TypeScript.
2. **Uji Navigasi Frontend**:
   - Memastikan teks "Artikel & Edukasi" muncul di footer di bawah kelompok "PERUSAHAAN".
   - Mengklik tombol "Artikel & Edukasi" dan memverifikasi browser mengarah ke `/artikel`.
   - Memverifikasi halaman `/artikel` memuat artikel dari database Supabase serta artikel bawaan dengan tata letak visual yang rapi dan responsif.
