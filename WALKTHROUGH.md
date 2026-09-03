# WALKTHROUGH: Migrasi Filter, Pencarian, dan Paginasi Listing Kost ke Backend Database Supabase Query

## 1. Ringkasan Pekerjaan
Telah berhasil diselesaikan migrasi **Filter, Pencarian, dan Paginasi Listing Kost** dari yang sebelumnya berjalan di browser (*client-side*) menjadi berjalan langsung di level **Backend Database (PostgreSQL Supabase Query)**:
- **Query Database Backend Supabase (`userService.ts`)**:
  - Membuat fungsi `getFilteredProperties(params)` yang memfilter langsung di tabel `properties` dengan status `published`.
  - **Inklusivitas Penuh**: Mendukung seluruh unit properti **Mitra Biasa** (`is_managed = false`) dan **Mitra KostManager** (`is_managed = true`).
  - **Pencarian Teks Multi-Kolom**: `.or('title.ilike.%${term}%,address.ilike.%${term}%,area.ilike.%${term}%')` untuk mencari nama kost, alamat, maupun kelurahan/kecamatan.
  - **Filter Kategori**: Filter tipe hunian (*Putra, Putri, Campur*), filter kota (*Makassar, Gowa, dll.*), filter kampus terdekat (*Unhas, UNM, UMI, dll.*), dan filter harga maksimal.
  - **Paginasi Server-Side**: Mengambil hanya 9 baris data per halaman dengan `.range(from, to)` dan `{ count: 'exact' }` untuk mendapatkan jumlah total data yang cocok dari backend.
  - Opsi dropdown filter kota dan kampus diambil secara dinamis via `getAvailableFilterOptions()`.
- **Integrasi di Halaman Katalog (`Listings.tsx`)**:
  - Menghubungkan kontrol filter dan search bar ke backend dengan debounce 250ms pada input pencarian (mencegah beban query berlebih saat pengguna mengetik cepat).
  - Paginasi 9 unit per halaman diatur langsung menggunakan `totalCount` dari database.
  - Skeleton loading halus saat server memproses query.

---

## 2. Rincian Perubahan Berkas

### A. [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)
- Menambahkan `transformPropertyRow(row)` untuk standarisasi pemetaan properti.
- Menambahkan interface `PropertyFilterParams`.
- Menambahkan fungsi `getFilteredProperties(params)` dan `getAvailableFilterOptions()`.

### B. [`Listings.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Listings.tsx)
- Menghubungkan seluruh proses filtering dan paginasi langsung ke `getFilteredProperties`.
- Mengimplementasikan debouncing pada kata kunci pencarian.

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 24.55s
Exit code: 0 (0 error)
```

---

## 4. Panduan Pengujian

1. **Buka Halaman Cari Kost (`/listings`)**:
   - Ketikkan nama kost atau nama daerah (misal: "Madani", "Daya", "Tamalanrea") $\rightarrow$ Database Supabase akan langsung merespons dengan properti yang cocok baik milik Mitra Biasa maupun KostManager.
   - Pilih filter **Tipe Kost** (*Putra, Putri, Campur*), **Pilih Kota**, atau **Pilih Kampus** $\rightarrow$ Hasil terfilter secara instan dari database.
   - Geser slider **Harga Maksimal** $\rightarrow$ Database hanya mengembalikan kost yang sesuai dengan tarif.
   - Uji klik tombol paginasi (Halaman 1, 2, dll.) $\rightarrow$ Database hanya mengunduh 9 record per halaman.
