# IMPLEMENTATION PLAN - Penghapusan Tombol Kembali ke Beranda di Dashboard Mitra

Rencana ini dibuat untuk menghapus tombol "Kembali ke Beranda" dari sidebar Dashboard Mitra (baik desktop maupun mobile overlay), menyisakan hanya tombol "Keluar Akun" (Logout) demi kesederhanaan dan fokus fungsionalitas panel kontrol pemilik kost.

## 1. Analisis Masalah
- **Masalah**: Pengguna merasa tombol "Kembali ke Beranda" tidak diperlukan di dalam menu sidebar Dashboard Mitra.
- **Solusi**: Hapus elemen button "Kembali ke Beranda" dari bagian bawah sidebar desktop dan sidebar mobile overlay pada [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx).

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/pages/MitraDashboard.tsx`:
   - Hapus kode render tombol "Kembali ke Beranda" di sidebar desktop dan mobile overlay.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/public/pages/MitraDashboard.tsx`**:
   - Cari blok kode tombol "Kembali ke Beranda" dan hapus.
2. **Kompilasi Frontend**:
   - Jalankan `npm run build` di folder `functions/public` untuk memvalidasi build.

## 4. Rencana Verifikasi
- Verifikasi visual di sidebar desktop dan mobile overlay hanya menampilkan tombol "Keluar Akun".
