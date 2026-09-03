# WALKTHROUGH: Penambahan Filter Provinsi & Kecamatan Serta Implementasi Tombol "Terapkan Filter" On-Demand

## 1. Ringkasan Pekerjaan
Telah berhasil diselesaikan penambahan kategori filter **Provinsi** & **Kecamatan / Area** serta implementasi mekanisme **Tombol "Terapkan Filter" On-Demand**:
- **Penambahan Kategori Filter**:
  - **Pilih Provinsi**: Menampilkan dropdown provinsi yang tersedia secara dinamis dari database.
  - **Pilih Kecamatan / Area**: Menampilkan dropdown kecamatan/wilayah yang tersedia dari database.
- **Mekanisme On-Demand Filter**:
  - Sistem **TIDAK langsung bereaksi** saat pengguna sedang mengetik di input pencarian atau memilih dropdown filter.
  - State filter form (`draftFilters`) dipisahkan dari state query database (`appliedFilters`).
  - Query ke PostgreSQL Supabase baru dieksekusi ketika pengguna menekan tombol **"TERAPKAN FILTER"** (warna oranye `#ff7a00` tebal) atau menekan `Enter` di kolom pencarian.
  - Tombol **"RESET FILTER"** akan mengembalikan form ke default dan mengeksekusi query database awal.
  - Berfungsi optimal di Desktop Sidebar Filter dan Mobile Filter Drawer.

---

## 2. Rincian Perubahan Berkas

### A. [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)
- Memperbarui `PropertyFilterParams` dengan `selectedProvince` dan `selectedDistrict`.
- Memperbarui `getFilteredProperties` untuk mengeksekusi `.eq('province', selectedProvince)` dan `.eq('area', selectedDistrict)`.
- Memperbarui `getAvailableFilterOptions` untuk mengumpulkan array `provinces` dan `districts`.

### B. [`FilterControls.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/FilterControls.tsx)
- Menambahkan dropdown Provinsi dan Kecamatan / Area.
- Menambahkan tombol **Terapkan Filter** oranye dan tombol **Reset Filter**.

### C. [`FilterDrawer.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/FilterDrawer.tsx)
- Meneruskan `availableProvinces` dan `availableDistricts` ke `FilterControls`.

### D. [`Listings.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Listings.tsx)
- Memisahkan `draftFilters` dan `appliedFilters`.
- Mengatur pemicuan query database hanya pada `appliedFilters` change.

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 30.82s
Exit code: 0 (0 error)
```

---

## 4. Panduan Pengujian

1. **Buka Halaman Cari Kost (`/listings`)**:
   - Ketik nama kost di form pencarian atau ubah dropdown Provinsi, Kota, Kecamatan, Tipe Kost, atau Kampus $\rightarrow$ Perhatikan bahwa daftar hasil di sebelah kanan **TIDAK langsung berubah**.
   - Klik tombol **"Terapkan Filter"** (atau tekan `Enter` di kolom pencarian) $\rightarrow$ Hasil pencarian baru di-query dan diperbarui dari database Supabase secara presisi.
   - Klik tombol **"Reset Filter"** $\rightarrow$ Form dan hasil pencarian akan kembali ke kondisi default.
