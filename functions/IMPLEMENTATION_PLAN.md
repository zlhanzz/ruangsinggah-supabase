# IMPLEMENTATION PLAN - Sistem Penilaian Agen Survey oleh Pelanggan

Rencana ini dibuat untuk menambahkan fitur pemberian rating & ulasan dari pelanggan (User) untuk agen survey pada saat konfirmasi selesai, serta merender ulasan tersebut secara dinamis di dashboard agen.

## 1. Analisis Masalah
- **Masalah Utama**:
  - Tombol "Konfirmasi Selesai" pada pesanan survey milik User langsung menyelesaikan tugas tanpa memberikan kesempatan bagi User untuk menilai kepuasan kinerja agen.
  - Grafik rating rata-rata dan list tanggapan pengguna di dashboard agen masih menggunakan bintang statis (*dummy*).
- **Solusi**:
  - Di `MyKost.tsx`:
    - Tambahkan state untuk modal rating survey: `showSurveyRatingModal`, `selectedRatingSurvey`, `surveyRatingValue`, dan `surveyRatingComment`.
    - Ubah fungsi `handleConfirmSurvey` agar membuka modal ulasan ini alih-alih langsung melakukan pembaruan di database.
    - Buat fungsi `submitSurveyRating` untuk mengirim status `COMPLETED` berserta data `user_rating` dan `user_comment` ke tabel `survey_requests`.
    - Render modal ulasan khusus survey yang cantik dan interaktif dengan pilihan rating bintang 1-5 dan input teks masukan.
  - Di `AgentDashboard.tsx`:
    - Ubah tampilan bintang statis `★★★★★` pada kartu Rating Rata-rata dan daftar Tanggapan Pengguna menjadi dinamis berbasis nilai database (`user_rating`).

## 2. Dampak Perubahan
File yang akan disentuh:
1. `functions/public/pages/MyKost.tsx` (Proses konfirmasi dan modal rating survey).
2. `functions/public/pages/AgentDashboard.tsx` (Perbaikan visual rating bintang agen).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `MyKost.tsx`**:
   - Deklarasikan state rating baru.
   - Perbarui `handleConfirmSurvey` untuk memicu modal.
   - Tulis fungsi `submitSurveyRating`.
   - Tambahkan markup modal `showSurveyRatingModal` di area Modals Overlay.
2. **Modifikasi `AgentDashboard.tsx`**:
   - Ganti rendering bintang statis dengan mapper array bintang dinamis berdasarkan data rating riil.
3. **Verifikasi & Build**:
   - Jalankan `npm run build` untuk memvalidasi keberhasilan kompilasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil tanpa kesalahan kompilasi.
- Menguji alur dari sisi penyewa: klik "Konfirmasi" -> muncul modal ulasan -> isi rating & feedback -> kirim -> status survey terbarui di Supabase beserta rating & feedback.
- Menguji dari sisi surveyor: ulasan baru masuk di dashboard agen, memengaruhi rating rata-rata dan menambah daftar masukan di bawah "Tanggapan Pengguna".
