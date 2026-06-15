# WALKTHROUGH - Paritas Halaman Profil Agen & Manajemen Agen Admin dengan Mitra

Dokumen ini mendokumentasikan rincian perubahan yang telah diselesaikan untuk menyelaraskan halaman profil Agen dan panel manajemen agen di sisi Admin dengan fitur dan visual yang setara dengan Mitra.

## 1. Daftar Perubahan Detail

### A. Backend & Services (`functions/public/adminService.ts`)
1. **Fungsi Baru `getBannedAgents()`**: Mengambil data agen dari tabel `agents` dan tabel `users` yang memiliki status `verification_status = 'banned'`.
2. **Fungsi Baru `banAgentRequest()`**: Mengubah status verifikasi agen menjadi `'banned'`, mengubah role pengguna di tabel `users` kembali menjadi `'user'` biasa untuk mencabut akses ke dashboard agen, dan menyinkronkan data ke tabel privat `user_verifications`.
3. **Fungsi Baru `unbanAgentRequest()`**: Memulihkan status verifikasi agen dari pemblokiran kembali ke `'unverified'`, mengatur ulang hitungan penolakan (`rejection_count = 0`), memulihkan role pengguna kembali menjadi `'user'` (atau role agen terkait setelah verifikasi ulang disetujui), serta menyinkronkan status tersebut ke database.
4. **Pembaruan `updateAgentVerificationStatus()`**:
   - Mendukung input alasan penolakan kustom (`rejection_reason`).
   - Menyimpan `rejection_count` secara kumulatif. Jika penolakan mencapai 3 kali, otomatis memicu pemblokiran akun (`verification_status = 'banned'`).
   - Menyinkronkan status verifikasi terbaru ke tabel privat `user_verifications` agar kebijakan RLS database terpenuhi.
   - Mengirim email pemberitahuan otomatis ke agen via Brevo SMTP / template email status agen.
5. **Pembaruan `getBannedMitra()`**: Ditambahkan filter penyaringan agar query hanya mengambil user dengan data di tabel `mitra` saja, sehingga tidak tumpang tindih dengan agen yang diblokir.

### B. Halaman Profil Agen (`functions/public/pages/AgentProfile.tsx`)
1. **Wizard Flow 2-Langkah**:
   - **Step 1**: Pengisian data profil utama, verifikasi nomor WhatsApp menggunakan Double OTP.
   - **Step 2**: Pemuatan unggah foto KTP, pengisian data objektif KTP (NIK, Nama, Tempat/Tanggal Lahir, Jenis Kelamin, dll), RLS Security Notice di bagian teratas panel, dan pemindaian otomatis KTP berbasis AI/OCR.
2. **Double OTP WhatsApp**:
   - OTP Sesi 1: Dikirim ke email untuk membuka kunci input nomor WhatsApp baru.
   - OTP Sesi 2: Dikirim ke nomor WhatsApp baru untuk memverifikasi validitas nomor tersebut.
3. **Hapus Input Referral & Tampilkan Referral Sendiri**:
   - Menghapus kolom input `referred_by` (kode referral yang mengundang) karena tidak berlaku untuk agen.
   - Menampilkan kode referral agen itu sendiri (`referral_code`) yang dimuat secara dinamis dari tabel `agents` dalam bentuk kotak read-only premium yang dilengkapi tombol **Salin**.
4. **Kontrol Navigasi & UX**:
   - Transisi step otomatis memicu scroll layar ke atas (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
   - Tombol **BATAL** dan silang "X" memicu pemanggilan `handleCancel()` untuk membuang draft perubahan sementara dan memulihkan data asli dari database (*rollback state*).
   - Penguncian email permanen secara read-only.
5. **Perbaikan Deteksi Status Verifikasi & Tombol Aksi**:
   - Menambahkan penanganan status `'verified'` pada panel *Status Alert Cards*. Agen terverifikasi sekarang melihat kartu hijau "Akun Terverifikasi" yang elegan alih-alih kartu orange "Belum Terverifikasi".
   - Menyelaraskan tombol aksi di Step 1 edit profil agar berubah menjadi tombol "Simpan Semua Data" secara dinamis ketika status verifikasi bernilai `'verified'`, menggantikan tombol "Lanjutkan".

### C. Komponen Kelola Agen Admin (`functions/public/components/admin/AgentManagement.tsx`)
1. **Restrukturisasi Tampilan**:
   - Memisahkan daftar verifikasi menjadi 3 tab: **Permintaan Verifikasi** (pending), **Daftar Agen Aktif** (verified), dan **Akun Diblokir** (banned).
2. **Fitur Pengelolaan**:
   - Tombol **Terima** untuk menyetujui verifikasi agen.
   - Tombol **Tolak** yang menampilkan dialog modal interaktif untuk memasukkan alasan penolakan kustom.
   - Tombol **Blokir Kemitraan** untuk menonaktifkan agen dan memindahkannya ke tab "Akun Diblokir".
   - Tombol **Pulihkan Akses** pada tab "Akun Diblokir" untuk mengaktifkan kembali kemitraan agen yang sempat ditangguhkan.

### D. Integrasi Parent Dashboard (`functions/public/pages/Dashboard.tsx`)
1. Menambahkan state `bannedAgents` dan fungsi loading data `loadBannedAgents()` dari service.
2. Mengalirkan data `bannedAgents` ke komponen `AgentManagement` agar disinkronkan secara real-time saat aksi ban/unban dipicu oleh admin.

### E. Pengamanan Akses Step 2 KTP Akun Terverifikasi (`MitraProfile.tsx` & `AgentProfile.tsx`)
1. **Validasi State Reaktif (URL & State Sync)**: Menambahkan `useEffect` reaktif untuk mendeteksi apabila akun pengguna sudah terverifikasi (`verified`) tetapi URL parameter terdeteksi berada di `step=2`. Sistem secara otomatis mengembalikan URL ke `step=1` dan menyetel `currentStep` ke `1`.
2. **Proteksi Rendering (Hard-Guard)**: Memberikan pembatasan visual tambahan di mana Step 2 (KTP) tidak akan dirender melainkan menampilkan banner "Akses Ditolak" apabila status verifikasi bernilai `'verified'`.

---

## 2. Hasil Pengujian (Simulasi & Kompilasi)
1. **Uji Validasi TypeScript / Build**:
   - Telah dijalankan perintah `npm run build` dan file-file yang kita modifikasi (`AgentProfile.tsx`, `AgentManagement.tsx`, `Dashboard.tsx`, dan `adminService.ts`) lolos proses kompilasi TypeScript dengan sukses tanpa ada error tipe data baru.
2. **Kesesuaian Desain**:
   - Penyelarasan visual (warna oranye-amber gradient, shadow card, layout wizard) terintegrasi dengan mulus pada tampilan desktop maupun mobile viewport.

---

## 3. Petunjuk Deploy (Manual Pilot)
Sesuai arahan, jangan langsung melakukan `git push` ke repositori utama. Lakukan langkah-langkah pengujian lokal dan deployment manual berikut:

1. **Jalankan Aplikasi secara Lokal untuk Review UI/UX**:
   ```bash
   npm run dev
   ```
2. **Periksa Profil Agen**:
   - Masuk sebagai akun dengan role `agent`.
   - Buka menu **Profil** untuk memverifikasi wizard 2-langkah, Double OTP WhatsApp, dan tampilan read-only kode referral.
3. **Periksa Kelola Agen Admin**:
   - Masuk sebagai akun dengan role `admin`.
   - Buka menu **Kelola Agen** untuk memverifikasi pembagian 3 tab, pengisian alasan tolak verifikasi, tombol blokir, dan pemulihan akses.
4. **Verifikasi Build Akhir**:
   ```bash
   npm run build
   ```
5. **Commit Perubahan Secara Manual**:
   ```bash
   git add .
   git commit -m "feat: align agent profile wizard and admin agent management parity with mitra"
   ```
6. **Push ke GitHub (Ketika Anda Siap)**:
   ```bash
   git push origin <nama-branch>
   ```
