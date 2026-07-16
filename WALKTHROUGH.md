# WALKTHROUGH - Pendaftaran KostManager, Pelacakan GPS, & Pemantauan Status Pengajuan

## 1. Daftar Perubahan
Berikut adalah detail perubahan yang telah dilakukan pada kode program untuk mendukung tracking pengajuan:

### A. Dashboard Mitra: Pemantauan Progress Stepper (`MitraProfile.tsx`)
- Menambahkan state `kmRequests` untuk menarik seluruh riwayat transaksi pengajuan layanan KostManager milik mitra secara live.
- Merancang komponen visual **Progress Stepper UI** di dalam menu Profil (jika tidak sedang dalam mode edit).
- Memetakan 5 tahapan proses pengajuan secara dinamis:
  1. **Diajukan**: Status pembayaran terverifikasi sukses.
  2. **Verifikasi**: Pengajuan sedang diproses verifikasi kelayakan oleh admin.
  3. **Agen Ditunjuk**: Menampilkan nama agen survey lapangan jika sudah ditugaskan oleh admin.
  4. **Proses Survey**: Menampilkan jadwal survey (tanggal & waktu) yang ditetapkan untuk kunjungan.
  5. **Selesai**: Kost diserahterimakan dan dikelola penuh oleh sistem autopilot.

### B. Dashboard Admin: Tombol Lacak & Penugasan (`KostManagerManagement.tsx`)
- Admin dapat memantau permohonan aktif, melihat tautan GPS, dan memilih tombol *"📍 Lacak Rute GPS"* langsung dari baris tabel data.
- Menyediakan formulir penugasan agen survey dan penjadwalan kunjungan secara dinamis, yang secara otomatis memicu pembaruan progress stepper di sisi mitra.

### C. Dashboard Agen: Navigasi Lokasi GPS (`AgentDashboard.tsx`)
- Menyediakan tombol *"📍 Buka Rute GPS / Maps"* pada detail kartu tugas survey agen untuk navigasi instan ke titik koordinat properti yang didaftarkan.

## 2. Hasil Pengujian & Verifikasi
- Pengujian kompilasi dengan `npm run build` selesai dengan **sukses** (100% aman tanpa error lint/tipe data).
- Kode siap dijalankan di produksi.

## 3. Petunjuk Deploy
Deploy dapat langsung dilakukan oleh pemilik dengan mem-push ke production server seperti biasa (seluruh perubahan sudah dipush ke GitHub origin/main).
