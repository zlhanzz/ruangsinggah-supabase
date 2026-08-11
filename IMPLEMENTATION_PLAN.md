# IMPLEMENTATION PLAN - Pendaftaran KostManager, Pelacakan GPS, Pemantauan Status Pengajuan, & Kartu Kemitraan

## 1. Analisis Masalah
Mitra/owner yang mengajukan pendaftaran KostManager membutuhkan umpan balik status secara transparan mengenai proses pengajuannya, serta informasi tipe keanggotaan aktif mereka (Mitra Reguler vs Mitra KostManager Autopilot). Kita perlu menyediakan wadah interaktif "Status Program & Layanan" yang dapat diklik untuk menampilkan modal khusus pelacakan progres pengajuan yang sangat mendetail.
Untuk mendukung hal tersebut di tingkat data, database Supabase harus memiliki kolom jadwal survey (`survey_date`, `survey_time`) dan catatan maps (`notes`) pada tabel `kostmanager_requests` untuk disinkronisasikan secara bi-direksional dengan tabel `survey_requests`.

## 2. Dampak Perubahan
1. `functions/public/pages/MitraProfile.tsx` (Penambahan state `showKmProgressModal`, kueri `mitra` table, rendering Membership Status Card yang clickable, dan implementasi popup modal ruang pelacakan progres detail)
2. `functions/public/supabase_schema.sql` (Penambahan kolom `survey_date`, `survey_time`, dan `notes` ke tabel `kostmanager_requests`)
3. `functions/public/adminService.ts` & `functions/src/index.ts` (Penambahan sinkronisasi bi-direksional untuk data tanggal survey, jam survey, dan catatan di `updateSurveyRequest`, `updateKostManagerRequest`, dan `syncKostManagerRequest`)
4. `functions/public/pages/KostManagerLanding.tsx` (Autofill koordinat peta Google Maps embed, proteksi input, dan arah navigasi ke dashboard-mitra/profile setelah bayar sukses)
5. `functions/public/components/admin/KostManagerManagement.tsx` (Visualisasi tombol lacak koordinat di Dashboard Admin)
6. `functions/public/pages/AgentDashboard.tsx` (Tombol navigasi rute instan di Dashboard Agen)

## 3. Langkah-Langkah Eksekusi
1. **Perubahan Skema Supabase**: Ubah definisi tabel `kostmanager_requests` di berkas `supabase_schema.sql` untuk menyertakan kolom `survey_date` (DATE), `survey_time` (TIME), dan `notes` (TEXT).
2. **Sinkronisasi Bi-direksional data**:
   - Di `syncKostManagerRequest`: Copy data survey awal (`survey_date`, `survey_time`, dan `notes` link GPS) dari metadata transaksi ke kolom `kostmanager_requests`.
   - Di `updateSurveyRequest` dan `updateKostManagerRequest`: Tambahkan logika sinkronisasi data tanggal, waktu, dan catatan survey agar kedua tabel selalu identik secara real-time.
3. **Pembalutan Elemen Clickable**: Bungkus kartu "Status Program & Layanan" dengan handler `onClick` untuk mengaktifkan visibilitas modal.
4. **Implementasi Modal Ruang Progress**: Buat dialog pop-up berisi daftar permohonan KostManager milik user. Pada tiap permohonan, tampilkan progress stepper 5 tahapan secara detail beserta info penugasan agen, rute peta GPS, dan jadwal survey.

## 4. Rencana Verifikasi
- Membuka profil mitra, mengklik kartu "Status Program & Layanan", dan menguji terbukanya modal.
- Memastikan database schema sinkron dan build frontend sukses tanpa warning.
