# IMPLEMENTATION PLAN - Integrasi Kategori Foto Dokumentasi dengan Sub-Fasilitas Tercentang pada Pendataan KostManager

## Analisis Masalah & Kebutuhan
Pada antarmuka pendataan KostManager ([AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) dan [KostManagerPropertyFormModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPropertyFormModal.tsx)):

1. **Kondisi Saat Ini**:
   - Fungsi `computeDynamicPublicPhotoCategories` sebelumnya mengecualikan/mem-blacklist seluruh nama sub-fasilitas (seperti `Kompor`, `Kulkas`, `Dispenser`, `Wastafel Cuci Piring`, `Peralatan Masak`, `Meja Makan`, `Kloset Duduk`, `Kloset Jongkok`, `Shower`, `Wastafel`, dll.) dari daftar kategori upload foto.
   - Akibatnya, pada bagian **Dokumentasi Area Umum & Fasilitas Properti**, hanya kategori induk umum (seperti *Dapur Bersama*, *Area Parkir*, *WC Umum*) yang muncul, sementara sub-fasilitas spesifik yang dicentang oleh surveyor/admin tidak memunculkan kartu upload foto pendukungnya.
2. **Kebutuhan Pengguna**:
   - Khusus pendataan KostManager, seluruh sub-fasilitas yang dicentang (baik pada kelengkapan Area Parkir, Dapur Bersama, WC Umum, maupun kelengkapan kustom) harus **secara otomatis memunculkan kartu/input kategori foto dokumentasinya** di bagian Dokumentasi Area Umum & Fasilitas Properti secara terintegrasi dan real-time.

---

## Dampak Perubahan
File yang akan dimodifikasi:

1. **`functions/public/pages/AgentDashboard.tsx`**:
   - Memperbarui fungsi `computeDynamicPublicPhotoCategories` agar menerima parameter `publicParkingFacilities`, `publicKitchenFacilities`, dan `publicBathroomFacilities`.
   - Mengintegrasikan sub-fasilitas yang dicentang ke dalam daftar kartu foto dokumentasi dinamis:
     - **Kelengkapan Dapur Bersama**: Menampilkan kartu foto *Dapur Bersama* dan seluruh sub-fasilitas yang tercentang (*Kompor*, *Kulkas*, *Dispenser*, *Wastafel Cuci Piring*, *Peralatan Masak*, *Meja Makan*, atau kelengkapan kustom).
     - **Kelengkapan Area Parkir**: Menampilkan kartu foto sub-fasilitas parkir yang dicentang (*Parkir Motor*, *Parkir Mobil*, *Parkir Sepeda*, atau kustom parkir).
     - **Kelengkapan WC Umum**: Menampilkan kartu foto *WC Umum* dan sub-fasilitas tercentang (*Kloset Duduk*, *Kloset Jongkok*, *Shower*, *Wastafel*, atau kustom WC).
   - Memperbarui hook `useEffect` sinkronisasi kategori foto agar reaktif terhadap perubahan `publicParkingFacilities`, `publicKitchenFacilities`, dan `publicBathroomFacilities`.
   - Mempercantik ikon dinamis pada kartu foto menggunakan `lucide-react` SVG murni.

2. **`functions/public/components/admin/KostManagerPropertyFormModal.tsx`**:
   - Menyelaraskan fungsi `computeDynamicPublicPhotoCategories` dan sinkronisasi kategori foto di modal Admin KostManager dengan logika yang sama persis.

---

## Langkah-Langkah Eksekusi

### Langkah 1: Perbarui `computeDynamicPublicPhotoCategories` di `AgentDashboard.tsx`
- Tambahkan parameter sub-fasilitas: `publicParkingFacilities`, `publicKitchenFacilities`, `publicBathroomFacilities`.
- Hapus pemblokiran sub-fasilitas dari array `nonPhotoFacs`.
- Masukkan setiap sub-fasilitas yang tercentang ke dalam array kategori foto dinamis yang dihasilkan.

### Langkah 2: Perbarui Sinkronisasi State & Reaktivitas di `AgentDashboard.tsx`
- Perbarui `useEffect` sinkronisasi kategori foto agar memantau `kmListingForm.facilities`, `kmListingForm.publicParkingFacilities`, `kmListingForm.publicKitchenFacilities`, dan `kmListingForm.publicBathroomFacilities`.
- Perbarui pemanggilan pada saat pemuatan draft dan data listing awal (`loadKmDraft`, `loadPropertyData`).

### Langkah 3: Penyelarasan di `KostManagerPropertyFormModal.tsx`
- Terapkan pembaruan fungsi `computeDynamicPublicPhotoCategories` dan dependency `useEffect` di komponen modal Admin KostManager.

### Langkah 4: Uji Kompilasi & Validasi Build
- Jalankan perintah `npm.cmd run build` untuk memverifikasi 0 error tipe TypeScript & Vite bundling.

---

## Rencana Verifikasi
1. **Verifikasi Build**: Menjalankan `npm.cmd run build` (harus sukses dengan exit code 0).
2. **Uji Reaktivitas Centang Sub-Fasilitas**:
   - Buka form pendataan KostManager di Dashboard Surveyor / Admin.
   - Centang **Dapur Bersama** $\rightarrow$ centang sub-fasilitas **Kompor**, **Kulkas**, **Dispenser**, **Wastafel Cuci Piring**, **Peralatan Masak**.
   - Centang **Area Parkir** $\rightarrow$ centang **Parkir Motor**.
   - Gulir ke bagian **Dokumentasi Area Umum & Fasilitas Properti**.
   - **Verifikasi**: Kartu upload foto untuk *Dapur Bersama*, *Kompor*, *Kulkas*, *Dispenser*, *Wastafel Cuci Piring*, *Peralatan Masak*, dan *Parkir Motor* otomatis muncul rapi siap diisi foto.
   - Hapus centang salah satu sub-fasilitas (misal *Peralatan Masak*) $\rightarrow$ kartu foto *Peralatan Masak* otomatis hilang jika belum ada foto, atau tetap terjaga jika foto sudah diunggah.
