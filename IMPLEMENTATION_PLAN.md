# IMPLEMENTATION PLAN: Perbaikan Populasi Opsi Filter (Provinsi, Kota, Kecamatan, Kampus) Berbasis Database

## 1. Analisis Masalah & Akar Penyebab
- **Masalah**:
  - Dropdown "PILIH PROVINSI", "PILIH KOTA", "PILIH KECAMATAN / AREA", dan "PILIH KAMPUS" hanya menampilkan opsi default (*"Semua Provinsi"*, *"Semua Kota"*, dll.) tanpa memunculkan daftar opsi lokasi dari listing yang ada di database.
- **Akar Penyebab**:
  1. Pada fungsi `getAvailableFilterOptions()`, query database menggunakan `.select('province, city, area, campuses, metadata')`. Karena kolom `province` di tabel PostgreSQL `properties` tidak didefinisikan sebagai kolom mandiri (melainkan tersimpan di dalam objek `metadata` atau diturunkan dari alamat/kota), PostgREST Supabase mengembalikan error `column properties.province does not exist`, sehingga `error` terpicu dan mengembalikan array kosong `[]`.
  2. Pada fungsi `getFilteredProperties()`, pemanggilan `.eq('province', selectedProvince)` juga berpotensi error karena ketiadaan kolom fisik `province`.
  3. Komponen `Listings.tsx` belum memiliki fallback ekstraksi opsi otomatis dari `initialListings` saat pemanggilan awal database sedang dalam proses.

---

## 2. Arsitektur & Solusi Perbaikan

1. **Pembaruan Query Aman di Backend (`userService.ts`)**:
   - Ganti query `getAvailableFilterOptions()` menggunakan `.select('*')` (aman 100% dari error kolom spesifik).
   - Ekstraksi `province` cerdas:
     `const prov = (row.province || row.metadata?.province || (row.city ? 'Sulawesi Selatan' : '')).trim();`
     (Mendeteksi metadata, kolom, atau wilayah regional kota seperti Makassar/Gowa).
   - Ekstraksi `district` / `area` dari `row.area || row.metadata?.area`.
   - Ekstraksi `campuses` dari array `row.campuses` per properti.
   - Mengumpulkan `rawRelations: GeoRelationEntry[]` secara lengkap dari seluruh listing published.
   - Pada `getFilteredProperties()`, filter provinsi dan kampus ditangani dengan mapping aman yang mendukung kolom maupun metadata JSONB.

2. **Pembaruan di `Listings.tsx`**:
   - Menambahkan mekanisme fallback otomatis dari `initialListings` jika `getAvailableFilterOptions` memerlukan waktu:
     - Mengisi `availableProvinces`, `availableCities`, `availableDistricts`, `availableCampuses`, dan `rawRelations` secara instan dari `initialListings`.
     - Memperbarui secara asinkron begitu `getAvailableFilterOptions()` selesai.

3. **Pembaruan di `FilterControls.tsx`**:
   - Memastikan dropdown selalu menampilkan opsi unik yang telah di-sort dan terbebas dari duplikasi / string kosong.
   - Label dropdown dan cascading antar pilihan (Provinsi $\rightarrow$ Kota $\rightarrow$ Kecamatan $\rightarrow$ Kampus) bekerja mulus secara real-time.

---

## 3. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**:
  - `functions/public/userService.ts`
  - `functions/public/components/FilterControls.tsx`
  - `functions/public/pages/Listings.tsx`
- **Proteksi Logika**:
  - Menjaga seluruh properti Mitra Biasa dan Mitra KostManager tetap muncul secara lengkap.
  - Mempertahankan tombol "Terapkan Filter" on-demand.
  - Pure SVG icons (`lucide-react`) tanpa FOUT.

---

## 4. Langkah-Langkah Eksekusi
1. **Perbaiki `userService.ts`**:
   - Gunakan `.select('*')` pada `getAvailableFilterOptions()` dengan ekstraksi fallback provinsi, kota, kecamatan, dan kampus.
   - Amankan query `getFilteredProperties()` agar kompatibel dengan skema tabel `properties`.
2. **Perbaiki `Listings.tsx`**:
   - Tambahkan ekstraksi fallback instan dari `initialListings`.
3. **Validasi & Pengujian**:
   - Jalankan `cmd /c npm run build` untuk memastikan kelulusan kompilasi.
   - Pastikan opsi Provinsi ("Sulawesi Selatan"), Kota ("Makassar", "Gowa"), Kecamatan ("Tamalanrea", dll.), dan Kampus ("Unhas", "UNM", dll.) langsung tampil di dropdown.

---

## 5. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - `cmd /c npm run build` di `functions/public/` (0 error).
2. **Uji Dropdown UI**:
   - Buka filter $\rightarrow$ Pastikan dropdown Provinsi memuat opsi provinsi dari listing.
   - Buka dropdown Kota $\rightarrow$ Memuat opsi kota listing.
   - Buka dropdown Kecamatan $\rightarrow$ Memuat opsi kecamatan listing.
   - Buka dropdown Kampus $\rightarrow$ Memuat opsi kampus listing.
3. **Pencatatan & Git Push**:
   - Catat di `functions/PROGRESS.md` (Nomor 292), perbarui `WALKTHROUGH.md`, dan push ke branch `bukan-productions`.
