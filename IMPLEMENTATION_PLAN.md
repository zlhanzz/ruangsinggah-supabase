# IMPLEMENTATION PLAN: Penambahan Filter Provinsi & Kecamatan Serta Implementasi Tombol "Terapkan" (On-Demand Filtering)

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Filter pencarian saat ini baru menyediakan Tipe Kost, Kota, Kampus, dan Rentang Harga. Kategori **Provinsi** dan **Kecamatan / Area** belum tersedia di kontrol filter.
  - Sistem saat ini langsung memicu query ke backend setiap kali pengguna mengetik atau memilih opsi (live reaction), padahal pengguna sering ingin menyesuaikan beberapa parameter terlebih dahulu sebelum melihat hasilnya.
- **Kebutuhan Pengguna**:
  1. **Penambahan Kategori Filter**:
     - **PILIH PROVINSI**: Dropdown pilihan provinsi yang tersedia dari database (misal: *Sulawesi Selatan, dll.*).
     - **PILIH KECAMATAN / AREA**: Dropdown pilihan kecamatan/wilayah yang tersedia dari database (misal: *Tamalanrea, Biringkanaya, Panakkukang, Rappocini, Manggala, dll.*).
  2. **Implementasi Tombol "TERAPKAN" (On-Demand Filter)**:
     - Sistem **TIDAK langsung bereaksi** saat pengguna sedang mengatur filter atau mengetik kata kunci pencarian.
     - Frontend memisahkan antara `draftFilters` (state sementara form) dan `appliedFilters` (state aktif query).
     - Query backend Supabase dan pembaruan hasil di layar **hanya dieksekusi ketika pengguna menekan tombol "TERAPKAN FILTER" / "TERAPKAN"**.
     - Tombol **"RESET"** akan mengembalikan seluruh isian ke nilai default dan langsung menerapkan query awal.

---

## 2. Arsitektur & Perubahan Logika
1. **Pembaruan `userService.ts`**:
   - Menambahkan field `selectedProvince` dan `selectedDistrict` pada `PropertyFilterParams`.
   - Mengintegrasikan filter `.eq('province', selectedProvince)` dan `.eq('area', selectedDistrict)` pada `getFilteredProperties`.
   - Memperbarui `getAvailableFilterOptions()` agar mengembalikan `{ provinces: string[]; cities: string[]; districts: string[]; campuses: string[] }`.

2. **Pembaruan `FilterControls.tsx` & `FilterDrawer.tsx`**:
   - Menambahkan dropdown **PILIH PROVINSI** dan **PILIH KECAMATAN / AREA** (tersinkronisasi secara dinamis berdasarkan data database).
   - Menampilkan tombol **TERAPKAN FILTER** (warna oranye `#ff7a00` tebal dan mencolok) di samping/atas tombol **RESET**, baik pada Desktop Sidebar maupun Mobile Filter Drawer.

3. **Pembaruan `Listings.tsx`**:
   - Memisahkan state `draftFilters` (untuk input form) dan `appliedFilters` (yang memicu query backend).
   - Fungsi `handleApplyFilters()`: Menyalin `draftFilters` ke `appliedFilters`, mereset `currentPage = 1`, dan memicu fetch backend.
   - Fungsi `handleResetFilters()`: Mereset `draftFilters` dan `appliedFilters` ke default, mereset `currentPage = 1`, dan memicu fetch awal.

---

## 3. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**:
  - `functions/public/userService.ts`
  - `functions/public/components/FilterControls.tsx`
  - `functions/public/components/FilterDrawer.tsx`
  - `functions/public/pages/Listings.tsx`
- **Proteksi Logika**:
  - Memastikan pencarian tetap mencakup properti Mitra Biasa dan Mitra KostManager.
  - Mempertahankan paginasi server-side 9 unit per halaman.
  - Seluruh ikon menggunakan komponen SVG murni dari `lucide-react` (bebas FOUT 100%).

---

## 4. Langkah-Langkah Eksekusi
1. **Modifikasi `userService.ts`**:
   - Dukung filter `selectedProvince` & `selectedDistrict` di query PostgreSQL.
   - Ambil list unik `provinces` dan `districts` di `getAvailableFilterOptions()`.
2. **Modifikasi `FilterControls.tsx` & `FilterDrawer.tsx`**:
   - Tambahkan dropdown Provinsi dan Kecamatan.
   - Tampilkan tombol **Terapkan Filter** yang jelas dan responsif.
3. **Modifikasi `Listings.tsx`**:
   - Implementasikan mekanisme `draftFilters` $\rightarrow$ `appliedFilters` saat tombol Terapkan ditekan.

---

## 5. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
2. **Uji Fungsionalitas di Browser**:
   - Ubah teks pencarian atau pilih dropdown provinsi/kecamatan/kota $\rightarrow$ Pastikan daftar di sebelah kanan **belum berubah** sebelum tombol ditekan.
   - Klik tombol **"Terapkan Filter"** $\rightarrow$ Pastikan database Supabase langsung merespons dengan hasil yang terfilter sesuai pilihan.
   - Klik tombol **"Reset"** $\rightarrow$ Pastikan seluruh filter kembali ke awal.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md` (Nomor 290), memperbarui `WALKTHROUGH.md`, dan push ke branch `bukan-productions`.
