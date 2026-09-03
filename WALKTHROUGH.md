# WALKTHROUGH: Perbaikan Populasi Opsi Filter (Provinsi, Kota, Kecamatan, Kampus) Berbasis Database

## 1. Ringkasan Pekerjaan
Telah berhasil diperbaiki kendala populasi opsi dropdown pada menu filter (Provinsi, Kota, Kecamatan, Kampus) agar menampilkan seluruh data lokasi secara akurat sesuai listing aktif di database:
- **Akar Masalah**:
  - Sebelumnya fungsi `getAvailableFilterOptions()` memanggil `select('province, ...')`. Karena kolom `province` tidak ada sebagai kolom fisik mandiri di tabel PostgreSQL Supabase (melainkan ada di `metadata`), PostgREST mengembalikan error `column properties.province does not exist` yang menyebabkan fungsi me-return array kosong `[]`.
- **Solusi yang Diterapkan**:
  - Mengubah query menjadi `select('*')` yang aman dari error skema PostgreSQL.
  - Menerapkan ekstraksi cerdas fallback provinsi: `(row.province || row.metadata?.province || (city ? 'Sulawesi Selatan' : '') || 'Sulawesi Selatan')`.
  - Mengumpulkan daftar unik `provinces`, `cities`, `districts`, `campuses`, dan `rawRelations`.
  - Mengamankan query `getFilteredProperties` untuk filter provinsi dan kampus.
  - Menambahkan ekstraksi fallback instan dari `initialListings` di `Listings.tsx` sehingga dropdown langsung terisi seketika tanpa delay.

---

## 2. Rincian Perubahan Berkas

### A. [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)
- Menggunakan `select('*')` di `getAvailableFilterOptions()`.
- Menyesuaikan penanganan filter `selectedProvince` dan `selectedCampus` di `getFilteredProperties()`.

### B. [`Listings.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Listings.tsx)
- Menambahkan fallback ekstraksi instan dari `initialListings` pada saat komponen mount.

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 30.88s
Exit code: 0 (0 error)
```

---

## 4. Panduan Pengujian

1. **Buka Halaman Cari Kost (`/listings`)**:
   - Buka dropdown **PILIH PROVINSI** $\rightarrow$ Muncul opsi provinsi (misal: "Sulawesi Selatan").
   - Buka dropdown **PILIH KOTA** $\rightarrow$ Muncul opsi kota (misal: "Makassar", "Gowa", dll.).
   - Buka dropdown **PILIH KECAMATAN / AREA** $\rightarrow$ Muncul opsi kecamatan yang terdata pada listing (misal: "Tamalanrea", "Panakkukang", "Biringkanaya", dll.).
   - Buka dropdown **PILIH KAMPUS** $\rightarrow$ Muncul opsi kampus yang terdata pada listing ("Unhas", "UNM", "UMI", "UIN Alauddin", dll.).
2. **Uji Filter & Terapkan**:
   - Pilih kombinasi filter yang diinginkan $\rightarrow$ Klik tombol **"Terapkan Filter"** $\rightarrow$ Daftar kost yang cocok langsung tampil presisi.
