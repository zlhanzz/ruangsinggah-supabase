# IMPLEMENTATION PLAN - Penyelarasan Siklus Kode & Perbaikan Auto-Prefill Data

Dokumen ini menjelaskan rencana tindakan untuk mengatasi masalah hilangnya modifikasi kode, data jumlah kamar acuan mitra yang kosong, dan rusaknya peta preview pada Dashboard Agen dan Admin.

## 1. Analisis Masalah
* **Masalah 1 (Reset Kode)**: File `KostManagerManagement.tsx` di Admin Dashboard tidak dibersihkan di awal skrip `reapply_all_changes_chronologically.js`.
* **Masalah 2 (Admin Review Gagal)**: Skrip `add_admin_review_kostmanager.js` mencari string `onClick={async () => {` sedangkan aslinya adalah sinkron `onClick={() => {`. Hal ini menyebabkan pencarian gagal dan fitur Kelola/Review Admin hilang saat build.
* **Masalah 3 (Prefill Kamar & GPS Kosong)**: Logika pre-fill jumlah kamar acuan awal (`initialTotalRooms`) dan koordinat peta (`initialCoords`) tidak terdaftar untuk dijalankan secara otomatis saat rebuild.

## 2. Dampak Perubahan
File yang tersentuh:
* `functions/scratch/reapply_all_changes_chronologically.js` (Urutan eksekusi skrip)
* `functions/scratch/add_admin_review_kostmanager.js` (Perbaikan pencocokan pola tombol Kelola Admin)
* `functions/scratch/apply_gps_fixes_v2.js` (Injeksi baru untuk ekstraksi GPS & pre-fill kapasitas kamar)

## 3. Rencana Eksekusi
1. **Langkah 1**: Daftarkan file `KostManagerManagement.tsx` untuk di-checkout bersih ke status `git HEAD` di awal `reapply_all_changes_chronologically.js`.
2. **Langkah 2**: Perbaiki target pencocokan tombol Kelola di skrip `add_admin_review_kostmanager.js`.
3. **Langkah 3**: Tulis skrip `apply_gps_fixes_v2.js` untuk mengintegrasikan helper `extractCoordinates` dan data pre-fill kapasitas kamar dari registrasi.
4. **Langkah 4**: Daftarkan skrip `apply_gps_fixes_v2.js` ke antrean reapply otomatis.

## 5. Rencana Verifikasi
* Jalankan `reapply_all_changes_chronologically.js` dan pastikan status output `ALL SCRIPTS APPLIED SUCCESSFULLY!`.
* Jalankan `npm run build` di folder `functions/public` untuk memastikan kompilasi bundle sukses tanpa error.
