# IMPLEMENTATION PLAN - Pendaftaran KostManager, Pelacakan GPS, & Pemantauan Status Pengajuan

## 1. Analisis Masalah
Mitra/owner yang mengajukan pendaftaran KostManager membutuhkan umpan balik status secara transparan mengenai proses pengajuannya, mulai dari pembayaran sukses hingga ditetapkannya agen survey, jadwal survey, dan status operasional (Selesai). Kita ingin menghadirkan UI pemantauan real-time yang ramah bagi pengguna di menu Profil Dashboard Mitra, yang bersinkronisasi langsung dengan aksi penugasan dan survey dari Dashboard Admin/Agen.

## 2. Dampak Perubahan
1. `functions/public/pages/MitraProfile.tsx` (Implementasi penarikan database permohonan KostManager & visualisasi Progress Stepper 5 tahapan)
2. `functions/public/pages/KostManagerLanding.tsx` (Autofill koordinat peta Google Maps embed & proteksi input)
3. `functions/public/adminService.ts` & `functions/src/index.ts` (Penyematan data link GPS ke catatan survey_requests)
4. `functions/public/components/admin/KostManagerManagement.tsx` (Visualisasi tombol lacak koordinat di Dashboard Admin)
5. `functions/public/pages/AgentDashboard.tsx` (Tombol navigasi rute instan di Dashboard Agen)

## 3. Langkah-Langkah Eksekusi
1. **Fetching Data Status di Mitra**: Di `MitraProfile.tsx`, tambahkan pengambilan data dari tabel `kostmanager_requests` beserta relasi transaksi Midtrans untuk user yang sedang aktif.
2. **Visualisasi Progress Stepper**: Buat stepper responsive dengan 5 langkah:
   - **Diajukan**: Pembayaran berhasil diverifikasi.
   - **Verifikasi**: Sedang ditinjau admin.
   - **Agen Ditunjuk**: Menampilkan nama agen jika sudah ditetapkan admin.
   - **Proses Survey**: Menampilkan jadwal survey (tanggal/jam) jika sudah diatur.
   - **Selesai**: Kost berhasil diaktifkan dengan status `COMPLETED` dan dikelola penuh.
3. **Penyelarasan Dashboard Admin**: Memastikan admin dapat menetapkan agen survey dan memperbarui jadwal melalui dashboard admin.

## 4. Rencana Verifikasi
- Membuka menu profil mitra dan memverifikasi data pengajuan KostManager terisi.
- Menguji responsivitas stepper pada layout mobile dan desktop.
- Memastikan build frontend sukses tanpa warning.
