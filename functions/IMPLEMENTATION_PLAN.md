# IMPLEMENTATION PLAN - Diagnostik Visibilitas Pesanan Survey Akun Biasa

Rencana ini dibuat untuk menambahkan log diagnostik di `MyKost.tsx` guna mengidentifikasi kenapa pesanan survey tidak muncul pada akun dengan role `user` biasa, sementara pada akun `admin` muncul.

## 1. Analisis Masalah
- **Masalah Utama**:
  - Di browser, akun dengan role `user` biasa tidak melihat pesanan survey pada menu "Kost Saya".
  - Logika sinkronisasi (`autoSyncAllSurveys`) berhasil menemukan transaksi dan melakukan sinkronisasi di database.
  - Pengujian kueri langsung via Node.js dengan hak akses user anonim/biasa mengindikasikan bahwa data pesanan survey ada di database dan secara teori dapat diakses.
  - Perlu dipastikan apakah data yang diterima browser dari `survey_requests` kosong (masalah RLS/koneksi) atau disaring keluar oleh filter UI di frontend.

- **Solusi Diagnostik**:
  - Tambahkan `console.log` di `MyKost.tsx` untuk memantau nilai `surveysData` hasil query langsung dari Supabase.
  - Tambahkan `console.log` untuk memantau nilai `surveyRequests`, `groupedSurveyOrders`, dan `filteredSurveyOrders` sebelum komponen dirender.

## 2. Dampak Perubahan
File yang akan diubah:
1. **`functions/public/pages/MyKost.tsx`**:
   - Menambahkan log pencetakan variabel state query survey.

## 3. Rencana Verifikasi
- Memeriksa output log di konsol browser (F12) untuk melihat data mentah hasil kueri.
