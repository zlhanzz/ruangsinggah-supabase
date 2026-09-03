# IMPLEMENTATION PLAN: Penerapan Lazy Loading & Paginasi Halaman pada Menu Listing (`Listings.tsx` & `KostCard.tsx`)

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Halaman `Listings.tsx` merender seluruh unit kost yang ditemukan secara sekaligus dalam 1 halaman panjang tanpa batasan.
  - Gambar listing dimuat bersamaan tanpa mekanisme *native lazy loading*, yang dapat menyebabkan konsumsi bandwidth tinggi, render blocking, dan lag saat pengguna pertama kali membuka katalog.
- **Kebutuhan Pengguna**:
  1. **Lazy Loading Gambar**: Gambar kartu kost hanya dimuat saat mendekati viewport pengguna dengan atribut `loading="lazy"`, `decoding="async"`, dan efek shimmer placeholder halus saat loading.
  2. **Paginasi Halaman (Pagination)**:
     - Membatasi jumlah listing yang dirender per halaman (misal: **9 unit per halaman**, pas 3 baris pada grid 3-kolom desktop).
     - Menyediakan navigasi paginasi modern: Tombol *Sebelumnya*, nomor halaman (*1, 2, 3, 4...*), dan tombol *Berikutnya*.
     - Menampilkan indikator informasi: *"Menampilkan **1-9** dari **{total}** Unit Kost"*.
     - Efek *Smooth Scroll* otomatis ke bagian atas daftar listing ketika berpindah halaman.
     - Reset otomatis ke halaman 1 ketika pengguna mengubah kriteria filter atau pencarian.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**:
  - `functions/public/pages/Listings.tsx` (Logika Paginasi & UI Kontrol Paginasi).
  - `functions/public/components/KostCard.tsx` (Lazy loading gambar, shimmer placeholder & fallback).
- **Proteksi Logika**:
  - Mempertahankan seluruh logika filtering (Kota, Kampus, Tipe Kost, Rentang Harga, Search Term).
  - Mempertahankan integrasi pSEO (`campusSlug`, `areaSlug`, meta tags Helmet).
  - Seluruh ikon menggunakan komponen SVG murni dari `lucide-react` (bebas FOUT 100%).

---

## 3. Langkah-Langkah Eksekusi
1. **Optimasi Lazy Loading di `KostCard.tsx`**:
   - Menambahkan atribut `loading="lazy"` dan `decoding="async"` pada tag `<img>`.
   - Menambahkan state `imageLoaded` dan skeleton placeholder shimmer saat gambar sedang dimuat.
   - Menambahkan fallback handling jika URL gambar gagal dimuat.
2. **Implementasi Paginasi di `Listings.tsx`**:
   - Menentukan konstanta `ITEMS_PER_PAGE = 9` (3 baris $\times$ 3 kolom).
   - Menambahkan state `currentPage` (default 1) dan efek `useEffect` untuk mereset `currentPage = 1` saat `filters`, `campusSlug`, atau `areaSlug` berubah.
   - Menghitung `totalPages = Math.ceil(filteredKosts.length / ITEMS_PER_PAGE)`.
   - Mengambil slice data aktif `paginatedKosts = filteredKosts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)`.
   - Merender UI Paginasi elegan di bagian bawah grid listing dengan tombol *Sebelumnya*, nomor halaman, dan *Berikutnya* yang responsif di mobile dan desktop.
   - Menambahkan scroll halus ke atas daftar ketika halaman berganti.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
2. **Uji Fungsionalitas di Browser**:
   - Membuka halaman `/listings` dan memverifikasi hanya 9 unit kost yang tampil di halaman 1.
   - Menguji klik tombol halaman 2, 3, Next, dan Prev, serta memastikan scroll otomatis kembali ke atas dengan mulus.
   - Menguji filter pencarian dan memastikan halaman mereset ke page 1 secara otomatis.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md` (Nomor 288), memperbarui `WALKTHROUGH.md`, dan push ke branch `bukan-productions`.
