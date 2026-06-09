# WALKTHROUGH - Sistem Penilaian Agen Survey oleh Pelanggan

Dokumen ini berisi rangkuman perubahan, hasil pengujian, dan petunjuk deploy untuk implementasi fitur penilaian/rating agen survey oleh pelanggan.

## 1. Daftar Perubahan
- **Berkas yang Diubah**:
  1. `functions/public/pages/MyKost.tsx`
  2. `functions/public/pages/AgentDashboard.tsx`
- **Rincian Perubahan**:
  - **`MyKost.tsx`**:
    - Menambahkan state untuk modal rating survey: `showSurveyRatingModal`, `selectedRatingSurvey`, `surveyRatingValue`, dan `surveyRatingComment`.
    - Memodifikasi `handleConfirmSurvey` agar membuka modal ulasan khusus survey (`showSurveyRatingModal`) alih-alih menyelesaikan status tugas secara langsung tanpa ulasan.
    - Menambahkan fungsi `submitSurveyRating` untuk mengupdate `status` menjadi `'COMPLETED'`, menyisipkan `user_rating` dan `user_comment` pada pesanan survey bersangkutan di database Supabase, serta me-refresh daftar survey secara real-time.
    - Merender elemen visual modal ulasan interaktif dengan pilihan rating bintang 1 s/d 5.
  - **`AgentDashboard.tsx`**:
    - Mengubah tampilan rating bintang statis `★★★★★` pada bagian Average Rating Card dan daftar Tanggapan Pengguna menjadi dinamis berbasis nilai `user_rating` riil dari database.

## 2. Hasil Pengujian
- **Kompilasi TypeScript**: Sukses. Perintah `cmd.exe /c npm run build` telah dijalankan di direktori `functions` dan berhasil dikompilasi tanpa adanya error tipe/modul (`tsc` selesai dengan sukses).
- **Interaksi Modal**: Modal ulasan akan muncul ketika User mengklik tombol "Konfirmasi" pada pesanan survey di halaman "Kost Saya". Setelah dikirim, ulasan & rating tersebut langsung tersimpan dan dapat dibaca oleh Agen di halaman dashboard mereka secara real-time.

## 3. Petunjuk Deploy
Pengguna dapat membangun dan menjalankan proyek secara lokal dengan perintah berikut:
```bash
# Masuk ke direktori functions
cd "functions"

# Build proyek untuk memastikan semua resource terkompilasi
npm run build

# Jalankan server development lokal
npm run dev
```
