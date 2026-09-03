# WALKTHROUGH: Penerapan Lazy Loading Gambar & Paginasi Halaman pada Menu Listing

## 1. Ringkasan Pekerjaan
Telah berhasil diselesaikan implementasi **Lazy Loading Gambar** dan **Paginasi Halaman (Pagination)** pada katalog pencarian listing kost:
- **Lazy Loading Gambar & Skeleton Shimmer (`KostCard.tsx`)**:
  - Menambahkan atribut `loading="lazy"` dan `decoding="async"` pada elemen `<img>` kartu properti sehingga browser hanya memuat gambar yang mendekati viewport pengguna.
  - Menambahkan state `imageLoaded` berpadu dengan efek skeleton shimmer lembut saat gambar sedang diproses untuk mencegah *layout shift* dan rendering lag.
  - Fallback kartu aman jika gambar gagal dimuat.
- **Paginasi Halaman Dinamis (`Listings.tsx`)**:
  - Menetapkan batas tampilan sebanyak **9 unit kost per halaman** (pas 3 baris $\times$ 3 kolom grid).
  - Jika total unit kost melebihi 9 unit (misal 11 unit), unit ke 10 dan 11 akan ditampilkan di Halaman 2.
  - Navigasi paginasi modern: Tombol *Sebelumnya*, nomor halaman aktif (*1, 2, 3...*), dan tombol *Berikutnya*.
  - Indikator range teks: *"Menampilkan **1-9** dari **11** Unit Kost"*.
  - *Smooth Scroll* otomatis kembali ke bagian atas hasil pencarian saat berpindah halaman.
  - Reset otomatis ke Halaman 1 saat pengguna memfilter atau mencari kost baru.

---

## 2. Rincian Perubahan Berkas

### A. [`KostCard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostCard.tsx)
- Menambahkan `loading="lazy"` dan `decoding="async"`.
- Menambahkan shimmer skeleton saat loading dan fallback view jika URL gambar bermasalah.

### B. [`Listings.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Listings.tsx)
- Menambahkan state `currentPage` dan slice data `paginatedKosts`.
- Menambahkan komponen navigasi paginasi dengan nomor halaman, smart ellipsis, dan kontrol navigasi.
- Menambahkan auto smooth scroll ke atas dan auto-reset saat filter berganti.

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 23.66s
Exit code: 0 (0 error)
```

---

## 4. Panduan Pengujian

1. **Buka Halaman Cari Kost (`/listings`)**:
   - Perhatikan bahwa hanya 9 unit kost pertama yang tampil pada halaman 1.
   - Perhatikan indikator teks *"Menampilkan 1-9 dari 11 Unit Kost"* di bagian bawah grid.
   - Klik tombol **2** atau tombol **Berikutnya**: Daftar akan berpindah menampilkan unit ke 10 dan 11, dan halaman akan otomatis bergulir (*smooth scroll*) ke bagian atas.
   - Coba ubah filter (misal: pilih kota atau kampus tertentu): Paginasi akan otomatis mereset ke Halaman 1.
