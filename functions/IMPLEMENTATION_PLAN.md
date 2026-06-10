# IMPLEMENTATION PLAN - Perbaikan Normalisasi Peran Mitra Pada Gerbang Login

Rencana ini dibuat untuk memperbaiki kendala di mana akun dengan peran database `mitra` tidak dapat masuk ke portal Pemilik Kost karena hilangnya normalisasi peran sebelum validasi gerbang login dilakukan.

## 1. Analisis Masalah
- **Masalah**: Ketika kita memodifikasi `fetchUserData` di `App.tsx`, kita menghapus kode yang melakukan normalisasi peran `'mitra'` menjadi `'owner'`. Akibatnya, saat akun dengan peran database `'mitra'` masuk ke portal Pemilik Kost, nilai `role` tetap `'mitra'`. Pemeriksaan `role !== 'owner'` akhirnya bernilai `true`, sehingga sistem menganggap akun tersebut sebagai pencari kost biasa dan langsung mengeluarkannya (`signOut`) dengan error mismatch.
- **Solusi**: Normalisasi peran database (seperti mengubah `'mitra'` menjadi `'owner'`) harus dijalankan terlebih dahulu sebelum memeriksa gerbang login (`portalView === 'owner'`).

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/App.tsx`:
   - Kembalikan dan posisikan logika normalisasi peran (`role` = `'owner'` jika aslinya `'mitra'` atau `'owner'`) tepat sebelum pengecekan `portalView === 'owner'`.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/public/App.tsx`**:
   - Tentukan dan normalisasi `role` dari database terlebih dahulu:
     - Konversi ke lowercase.
     - Ubah `'mitra'` atau `'owner'` menjadi `'owner'`.
     - Ubah `'admin'` menjadi `'admin'`.
     - Ubah `'survey_agent'` menjadi `'survey_agent'`.
     - Selain itu, ubah menjadi `'user'`.
   - Setelah dinormalisasi, jalankan logika pembatasan `portalView`.
2. **Kompilasi Frontend**:
   - Jalankan `npm run build` di folder `functions/public` untuk memverifikasi kompilasi.

## 4. Rencana Verifikasi
- Uji login menggunakan akun dengan peran `'mitra'` di database pada portal "Pemilik Kost". Verifikasi akun berhasil masuk dan diarahkan ke Dashboard Mitra (`Page.DASHBOARD_MITRA`).
