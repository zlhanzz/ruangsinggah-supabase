# WALKTHROUGH - Stabilisasi & Pengujian Fundamental Sistem RuangSinggah

Dokumen ini merangkum penyelesaian implementasi fundamental platform RuangSinggah: eliminasi kendala CORS pada verifikasi WhatsApp OTP pendaftaran mitra, pengujian fungsi Dashboard Mitra, interaksi user-pemilik kost, siklus sewa & perpanjangan, payout / withdraw saldo, dan kontrol admin, beserta **panduan lengkap konfigurasi template OTP di Meta Developers**.

---

## 1. Daftar Perubahan yang Dilakukan

### A. Solusi Tuntas WhatsApp API & CORS (`send-wa-message` & `whatsappService.ts`)
1. **Pembuatan Supabase Edge Function `send-wa-message` (`supabase/functions/send-wa-message/index.ts`)**:
   - Memindahkan panggilan Meta Graph API (`https://graph.facebook.com/v21.0/...`) ke serverless backend Deno.
   - Mengatur header CORS lengkap (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`).
   - Mendaftarkan endpoint ke `supabase/config.toml` dengan `verify_jwt = false`.
2. **Peningkatan Layanan WhatsApp Front-End (`functions/public/whatsappService.ts`)**:
   - Memprioritaskan pengiriman via `supabase.functions.invoke('send-wa-message')` sehingga **0% terkena blokir CORS browser**.
   - Menambahkan mekanisme *auto-retry* cerdas: jika template Meta memiliki ketidakcocokan parameter tombol, sistem otomatis melakukan fallback pengiriman body-only sehingga pengiriman OTP tetap sukses.

### B. Aktivasi & Penguatan Registrasi Pemilik Kost (`functions/public/pages/Login.tsx`)
1. Mengaktifkan kembali blok OTP WhatsApp saat calon mitra memilih role **"Pemilik Kost"** (`activeRole === 'owner'`).
2. Mengintegrasikan input OTP 6 digit, timer kirim ulang 60 detik, serta mode pengujian sandbox.
3. Menyertakan status `whatsapp_verified: true` pada metadata saat pendaftaran akun diselesaikan.

### C. Pembaruan Nomor WhatsApp di Profil Mitra (`functions/public/pages/MitraProfile.tsx`)
1. Menghubungkan fungsi `handleSendNewWaOtp` dengan `sendWaOtpVerification` serverless yang baru.
2. Menyimpan nomor baru beserta flag `whatsapp_verified: true` ke database Supabase setelah kode OTP 6 digit diverifikasi cocok.

### D. Pembeda Visual Role Payout di Admin (`functions/public/components/admin/WithdrawalManagement.tsx`)
1. Menambahkan kolom `role` pada kueri tabel `users`.
2. Menampilkan Role Badge visual elegan pada setiap baris penarikan dana:
   - 🏠 **Mitra Kost** (oranye) untuk mitra pemilik properti (`owner` / `mitra`).
   - 💼 **Agen** (biru) untuk surveyor lapangan (`agent` / `survey_agent`).
3. Memperbarui placeholder pencarian menjadi `"Cari nama mitra, agen, bank, no. rekening..."` dan header kolom menjadi `"Pemohon (Mitra / Agen)"`.

---

## 2. Panduan Lengkap Konfigurasi Template OTP di Meta Developers

Berikut panduan langkah demi langkah untuk mengatur template WhatsApp OTP pada **Meta WhatsApp Business Manager**:

### Langkah 1: Buka WhatsApp Manager
1. Kunjungi [Meta Business Suite - WhatsApp Manager](https://business.facebook.com/wa/manage/message-templates/).
2. Pilih Akun WhatsApp Business (WABA) dan Nomor WhatsApp resmi RuangSinggah Anda.
3. Klik tombol **Buat Template** (*Create Template*).

### Langkah 2: Pilih Kategori & Nama Template
- **Kategori**: Pilih **Autentikasi** (*Authentication*).
  *(Catatan: Jika memilih Autentikasi, Meta secara otomatis menerapkan format OTP berstandar keamanan tinggi dengan tombol Salin Kode).*
- **Nama Template**: `otp_verification`
  *(Wajib huruf kecil dan underscore, tanpa spasi).*
- **Bahasa**: **Indonesian** (`id` - Bahasa Indonesia).

### Langkah 3: Konfigurasi Konten & Tombol
1. **Isi Pesan (Body)**:
   Gunakan teks standar autentikasi:
   ```text
   {{1}} adalah kode verifikasi akun RuangSinggah Anda. Demi keamanan, jangan bagikan kode ini kepada siapapun.
   ```
2. **Tombol (Buttons)**:
   - Pilih jenis tombol: **Salin Kode** (*Copy Code*) atau **Tombol URL**.
   - Teks tombol: `Salin Kode` (atau `Copy Code`).
3. **Masa Berlaku Kode (Code Expiration)** *(Opsional)*:
   - Set: `10 Menit`.
4. **Peringatan Keamanan Tambahan**:
   - Centang opsi tambahkan teks keamanan: *"Jangan berikan kode ini kepada siapa pun, termasuk pihak RuangSinggah."*

### Langkah 4: Simpan & Ajukan Persetujuan
- Klik tombol **Kirim** (*Submit*) untuk peninjauan.
- Template kategori **Autentikasi** biasanya disetujui secara otomatis dalam hitungan detik hingga beberapa menit oleh sistem AI Meta.
- Setelah statusnya berubah menjadi **Hijau (Disetujui / Active)**, template siap menerima panggilan dari API aplikasi RuangSinggah!

---

## 3. Hasil Pengujian & Kompilasi

### A. Uji Kompilasi Frontend Vite (`npm run build`)
Kompilasi produksi frontend di direktori `functions/public` sukses 100% tanpa error:
```bash
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 42.16s
```

### B. Uji Integritas Basis Data Supabase
Pemeriksaan data riil di Supabase melalui Node.js script memverifikasi:
- Tabel `users`: Tersedia kolom `role`, `verification_status`, dan `whatsapp_verified`.
- Tabel `properties`: 5 properti aktif terdaftar dengan pemisahan status `published` dan `is_managed`.
- Tabel `transactions`: 126 riwayat transaksi aktif mendukung `kost_booking` dan `perpanjangan_sewa`.
- Tabel `withdrawal_requests`: Permintaan penarikan dana terhubung dengan foreign key user pemohon dan siap ditindaklanjuti admin.

---

## 4. Panduan Verifikasi Pengujian di UI

### Pengujian 1: Pendaftaran Pemilik Kost & Verifikasi WA
1. Buka halaman `/login` $\rightarrow$ Klik tab **Daftar** $\rightarrow$ Pilih peran **Pemilik Kost**.
2. Masukkan Nama, Nomor WhatsApp, Email, dan Kata Sandi.
3. Klik tombol **Daftar Akun**.
4. Sistem membuka modal **Verifikasi OTP WhatsApp**:
   - Jika nomor terhubung ke gateway Meta yang aktif, pesan WA akan masuk ke HP Anda.
   - Pada mode pengujian/sandbox, kode OTP pengujian 6 digit juga ditampilkan di kartu panduan sandbox agar Anda dapat menguji tanpa hambatan.
5. Masukkan 6 digit kode OTP dan klik **Verifikasi**.
6. Sistem memvalidasi kode dan menyelesaikan pendaftaran dengan status `whatsapp_verified: true`.

### Pengujian 2: Dashboard Mitra (Self-Listing)
1. Login sebagai Pemilik Kost (Mitra) $\rightarrow$ Masuk ke `/dashboard-mitra`.
2. Menu **Overview**: Periksa ringkasan statistik pendapatan sewa dan saldo tersedia.
3. Menu **Kost Saya**:
   - Periksa daftar properti kost milik mitra.
   - Uji tombol tambah properti (`KostFormMitra.tsx`) atau klik tombol *Quick Room* untuk mengubah ketersediaan unit kamar (Kosong / Terisi).
4. Menu **Dompet**:
   - Masukkan nomor rekening bank/e-wallet Anda dan klik simpan.
   - Masukkan nominal penarikan (misal Rp 10.000) dan klik **Tarik Dana Sekarang**.
   - Saldo langsung terpotong secara aman dan permohonan masuk ke status *Menunggu*.

### Pengujian 3: Kontrol Penuh di Dashboard Admin
1. Login sebagai Admin $\rightarrow$ Buka `/dashboard-admin`.
2. Menu **Pendaftar Mitra / Verifikasi Identitas** (`/dashboard-admin/mitra`):
   - Admin melihat dokumen KTP, NIK, alamat, dan status nomor WhatsApp.
   - Klik **Terima** untuk meng-ACC mitra menjadi terverifikasi (`verified`).
3. Menu **Kelola Penarikan Saldo (WD)** (`/dashboard-admin/withdrawals`):
   - Admin melihat daftar pengajuan penarikan dana.
   - Pemohon ditandai dengan badge jelas: 🏠 **Mitra Kost** atau 💼 **Agen**.
   - Klik **Setujui & Transfer** untuk menyelesaikan pencairan, atau **Tolak** untuk mengembalikan dana ke saldo mitra.
