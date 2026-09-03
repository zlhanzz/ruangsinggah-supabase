# IMPLEMENTATION PLAN: Dynamic Cascading & Independent Filter Options (Provinsi, Kota, Kecamatan, Kampus)

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Pilihan dropdown Provinsi, Kota, Kecamatan, dan Kampus saat ini menampilkan seluruh daftar secara statis tanpa melihat keterkaitan hierarki lokasi (misal: memilih provinsi Sulawesi Selatan belum membatasi pilihan kota ke kota-kota di Sulsel saja).
- **Kebutuhan Pengguna**:
  1. **Relasi Hierarkis Cerdas (Cascading Context)**:
     - Jika memilih **Provinsi tertentu**, dropdown **Kota** hanya menampilkan kota yang ada di provinsi tersebut.
     - Jika memilih **Kota tertentu**, dropdown **Kecamatan / Area** hanya menampilkan kecamatan yang ada di kota tersebut.
     - Jika memilih **Wilayah/Kota/Provinsi tertentu**, dropdown **Kampus** hanya menampilkan kampus yang relevan/terhubung dengan listing di area tersebut.
  2. **100% Fleksibel & Opsional (Independent / Unrestricted Entry)**:
     - Filter tidak bersifat kaku/memaksa. Pengguna bebas hanya memilih **Harga saja**, **Kampus saja**, **Kota saja**, atau **Tipe Kost saja**.
     - Jika pengguna langsung membuka dropdown **Kampus** tanpa memilih provinsi/kota, sistem akan menyajikan **SEMUA pilihan kampus** yang ada di database.
     - Jika pengguna langsung membuka dropdown **Kota** tanpa memilih provinsi, sistem akan menyajikan **SEMUA pilihan kota** di database.
  3. **Auto-Reset Child saat Parent Berubah**:
     - Jika pengguna mengubah Provinsi, sistem secara otomatis mereset Kota, Kecamatan, dan Kampus yang tidak lagi relevan ke `'Semua'`.
     - Jika pengguna mengubah Kota, sistem secara otomatis mereset Kecamatan ke `'Semua'`.

---

## 2. Arsitektur & Perubahan Logika

1. **Pembaruan Backend / Data Layer (`userService.ts`)**:
   - Memperbarui fungsi `getAvailableFilterOptions()` agar mengembalikan data relasi lokasi per listing:
     ```ts
     export interface GeoRelationEntry {
       province: string;
       city: string;
       district: string; // area
       campuses: string[];
     }
     ```
   - Mengambil seluruh properti `status = 'published'` dengan kolom `province, city, area, campuses, metadata`.
   - Mengembalikan daftar induk unik (`provinces`, `cities`, `districts`, `campuses`) serta array relasi `rawRelations: GeoRelationEntry[]`.

2. **Pembaruan Logika Filter Dropdown Dinamis (`FilterControls.tsx`)**:
   - Menggunakan `useMemo` untuk menghitung daftar opsi dropdown secara reaktif berdasarkan relasi `rawRelations`:
     - **`computedCities`**: Jika `selectedProvince !== 'Semua'`, hanya tampilkan kota di provinsi tersebut. Jika `'Semua'`, tampilkan seluruh kota.
     - **`computedDistricts`**: Jika `selectedCity !== 'Semua'`, hanya tampilkan kecamatan di kota tersebut. Jika kota `'Semua'` namun provinsi dipilih, tampilkan kecamatan di provinsi tersebut. Jika semua `'Semua'`, tampilkan seluruh kecamatan.
     - **`computedCampuses`**: Jika kecamatan/kota/provinsi dipilih, prioritaskan kampus yang terhubung dengan listing di area tersebut. Jika semua `'Semua'`, tampilkan seluruh kampus di database.
   - **Handler Perubahan Dropdown**:
     - Saat `selectedProvince` berubah: Set `selectedProvince`, dan jika `selectedCity` sebelumnya tidak ada di `computedCities`, reset `selectedCity = 'Semua'`, `selectedDistrict = 'Semua'`, `selectedCampus = 'Semua'`.
     - Saat `selectedCity` berubah: Set `selectedCity`, dan jika `selectedDistrict` sebelumnya tidak ada di `computedDistricts`, reset `selectedDistrict = 'Semua'`.

3. **Penyelarasan `FilterDrawer.tsx` & `Listings.tsx`**:
   - Menyalurkan data relasi lokasi `rawRelations` ke `FilterControls` dan `FilterDrawer`.
   - Menjamin eksekusi filter tetap on-demand (baru diterapkan setelah tombol "Terapkan Filter" diklik).

---

## 3. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**:
  - `functions/public/userService.ts`
  - `functions/public/components/FilterControls.tsx`
  - `functions/public/components/FilterDrawer.tsx`
  - `functions/public/pages/Listings.tsx`
- **Proteksi Logika**:
  - Tidak merombak query database backend `getFilteredProperties` yang sudah berjalan stabil.
  - Mempertahankan integrasi listing Mitra Biasa dan Mitra KostManager.
  - Pure SVG icons (`lucide-react`) tanpa FOUT.

---

## 4. Langkah-Langkah Eksekusi
1. **Perbarui `userService.ts`**:
   - Tambahkan `rawRelations` pada return value `getAvailableFilterOptions()`.
2. **Perbarui `FilterControls.tsx`**:
   - Terapkan `useMemo` untuk `computedCities`, `computedDistricts`, dan `computedCampuses`.
   - Tambahkan validasi & auto-reset child saat parent berganti.
3. **Perbarui `FilterDrawer.tsx` & `Listings.tsx`**:
   - Teruskan `rawRelations` ke komponen drawer dan sidebar filter.

---

## 5. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
2. **Uji Kasus Interaksi Pengguna**:
   - **Kasus 1 (Hierarkis)**: Pilih Provinsi "Sulawesi Selatan" $\rightarrow$ Dropdown Kota hanya memuat "Makassar", "Gowa", dll. Pilih Kota "Makassar" $\rightarrow$ Dropdown Kecamatan hanya memuat kecamatan di Makassar ("Tamalanrea", dll.).
   - **Kasus 2 (Bebas / Mandiri)**: Tanpa memilih Provinsi & Kota, langsung klik dropdown Kampus $\rightarrow$ Seluruh kampus (Unhas, UNM, UIN, dll.) tetap tampil lengkap.
   - **Kasus 3 (Hanya Harga)**: Tanpa memilih lokasi apapun, geser harga dan klik Terapkan Filter $\rightarrow$ Berhasil memfilter berdasarkan tarif saja.
3. **Pencatatan & Git Push**:
   - Catat di `functions/PROGRESS.md` (Nomor 291), perbarui `WALKTHROUGH.md`, dan push ke branch `bukan-productions`.
