# WALKTHROUGH - Pendaftaran KostManager Cerdas & Pelacakan Rute GPS

## 1. Daftar Perubahan
Berikut adalah detail perubahan yang telah dilakukan pada kode program untuk mendukung integrasi GPS pelacakan:

### A. Autofill Google Maps Koordinat (`KostManagerLanding.tsx`)
- Jika mitra memilih opsi **"Pilih dari Kost Saya"**, sistem secara otomatis memeriksa koordinat latitude dan longitude dari properti tersebut.
- Jika koordinat tersedia, sistem memformat URL pencarian Google Maps (`https://www.google.com/maps?q=lat,lng`) dan mengisinya ke field `googleMapsLink` secara otomatis.

### B. Sinkronisasi Data Tautan ke Tugas Survey (`adminService.ts` & `index.ts`)
- Memperbarui file backend `functions/src/index.ts` dan helper client `functions/public/adminService.ts` agar menyisipkan string penunjuk GPS `📍 Link GPS: [URL]` ke dalam kolom `notes` pada entri `survey_requests`.

### C. Dashboard Admin: Tombol Lacak (`KostManagerManagement.tsx`)
- Memodifikasi kueri pemilihan data KostManager agar menyertakan kolom `metadata` dari tabel transaksi.
- Menambahkan tautan tombol interaktif *"📍 Lacak Rute GPS"* di bawah alamat kost jika data `googleMapsLink` terdeteksi di dalam metadata transaksi.

### D. Dashboard Agen: Navigasi GPS (`AgentDashboard.tsx`)
- Menggunakan regex `📍(?: Link)? GPS:\s*(https?:\/\/\S+)` untuk mendeteksi keberadaan tautan lokasi di kolom `notes` tugas survey.
- Jika terdeteksi, sistem akan menampilkan tombol hijau bersinar *"📍 Buka Rute GPS / Maps"* pada detail kartu tugas survey agen agar agen dapat langsung bernavigasi ke lokasi menggunakan Google Maps bawaan ponsel/komputer mereka.

## 2. Hasil Pengujian & Verifikasi
- Pengujian kompilasi dengan `npm run build` selesai dengan **sukses** (100% aman tanpa error lint/tipe data).
- Kode siap dijalankan di produksi.

## 3. Petunjuk Deploy
Deploy dapat langsung dilakukan oleh pemilik dengan mem-push ke production server seperti biasa (seluruh perubahan sudah dipush ke GitHub origin/main).
