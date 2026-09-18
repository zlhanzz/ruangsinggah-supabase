# Rencana Implementasi: Perbaikan Tuntas Alur Verifikasi Email & Eliminasi Anomali Pesan Login

Dokumen ini memuat analisis akar masalah, strategi perbaikan komprehensif, file yang terdampak, serta langkah eksekusi bertahap untuk memastikan sistem verifikasi pendaftaran pemilik kost berjalan lancar menggunakan tautan verifikasi akses (*action link button*), bebas dari anomali banner ganda, dan otomatis mengarahkan mitra ke Dashboard Mitra.

---

## 1. Analisis Masalah & Kebutuhan

Berdasarkan pengujian terbaru dan bukti tangkapan layar dari pengguna:
1. **Anomali Banner Pesan Ganda (Merah & Hijau Bersamaan)**:
   - Pada halaman `Masuk Pemilik Kost`, muncul dua kotak pesan secara bersamaan:
     - 🔴 **Merah**: *"Email Anda belum diverifikasi. Silakan cek inbox/spam email Anda."*
     - 🟢 **Hijau**: *"Email berhasil diverifikasi! Silakan masuk dengan email dan kata sandi Anda."*
   - **Akar Masalah**:
     - Di `Login.tsx`, ketika pengguna dialihkan kembali dari tautan email dengan parameter `?verified=true`, sistem menyetel `successMsg`.
     - Namun, URL kembalian dari Supabase pada saat yang sama memuat error di hash `#error=server_error&error_code=unexpected_failure&error_description=Error+confirming+user` yang tidak di-filter sebelum membaca `verified=true`.
     - Ketika pengguna memasukkan email & password lalu klik *"Masuk Sekarang"*, fungsi `handleLogin` mendeteksi bahwa `email_confirmed_at` masih kosong, sehingga memicu `setErrorMsg(...)`.
     - Karena `handleLogin` tidak mereset `successMsg` (tidak memanggil `setSuccessMsg('')`), kedua pesan tersebut tampil bersamaan dan saling bertolak belakang.

2. **Penyebab Utama Gagalnya Verifikasi Akun di Supabase (`500 unexpected_failure`)**:
   - Supabase Auth menjalankan trigger database `public.handle_new_user()` setiap kali `email_confirmed_at` diperbarui.
   - Pada trigger `public.handle_new_user()`, terdapat query `INSERT INTO public.users (...) VALUES (...) ON CONFLICT (id) DO UPDATE ...`.
   - Di database `public.users`, email `kaossekai@gmail.com` sebelumnya sudah tercatat (warisan migrasi data lama) dengan ID user yang berbeda (`9cd3d9c8-...`).
   - Akibatnya, saat akun Supabase Auth baru (`c0fd4105-...`) mencoba diverifikasi, Postgres menolak dengan error `23505 duplicate key value violates unique constraint "users_email_key"`.
   - Error database ini menyebabkan Supabase Auth membatalkan transaksi verifikasi dan me-redirect browser dengan status error.

3. **Pilihan Alur Pengguna (Verifikasi Tombol Akses Email)**:
   - Sesuai arahan pengguna: *"kalau memang auth supabase tidak bisa diverifikasi dengan menggunakan kode email, okelah kita pakai tombol akses verif aja, tapi pastikan bekerja dengan baik, tidak anomali seperti sekarang"*.
   - Kita akan mengembalikan alur pendaftaran ke sistem tautan tombol verifikasi email (**"KONFIRMASI AKUN SEKARANG"**) yang stabil, intuitif, dan tidak membingungkan pengguna dengan meminta 6-digit kode yang tidak ada di email.

4. **Otomatisasi Masuk ke Dashboard Mitra**:
   - Setelah tombol email diklik, sesi Supabase langsung terurai (`#access_token`), sistem menyetel role ke `owner`, dan langsung mengarahkan pengguna ke `/dashboard-mitra` secara otomatis tanpa memaksa login ulang manual.

---

## 2. Dampak Perubahan File

Perubahan difokuskan secara presisi pada file-file berikut tanpa merombak logika yang sudah stabil:

1. [Login.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx):
   - **Eliminasi Anomali Banner**: Pastikan `errorMsg` dan `successMsg` bersifat *mutually exclusive* (memanggil salah satu otomatis mengosongkan yang lain).
   - **Filter Hash Error**: Tangani `#error=...` dan `#error_code=...` di URL hash terlebih dahulu sebelum memproses status sukses verifikasi.
   - **Tampilan Tunggu Konfirmasi Email yang Bersih**: Ganti tampilan input OTP 6-digit dengan layar status konfirmasi email yang profesional (menampilkan ilustrasi email, tombol "Buka Gmail", hitung mundur kirim ulang, dan tombol kembali ke login).
   - **Penanganan Auto-Redirect Mitra**: Setelah verifikasi tautan sukses, tampilkan loader transisi *"Memverifikasi dan mengalihkan ke Dashboard Mitra..."* lalu redirect langsung ke `/dashboard-mitra`.

2. [functions/src/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/src/index.ts):
   - Memastikan endpoint `handleCustomAuthEmail` memprioritaskan desain tombol aksi verifikasi email yang responsif dan elegan via Brevo tanpa ketergantungan wajib pada kode angka 6-digit.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Resolusi Konflik Database (Database Level)
- Memastikan tidak ada duplikasi data `email` pada tabel `public.users` antara ID user lama dengan ID Supabase Auth aktif.
- Menjaga integritas data pengguna dan memastikan `email_confirmed_at` di Supabase Auth dapat diperbarui tanpa terhalang `users_email_key`.

### Langkah 2: Pembaruan Logika Deteksi Verifikasi & Eliminasi Anomali di `Login.tsx`
- Menambahkan pengecekan awal pada hash URL (`window.location.hash`):
  - Jika terdapat `error=` atau `error_code=otp_expired` atau `error_code=unexpected_failure`, tampilkan pesan kesalahan yang jelas dan bersihkan `successMsg`.
- Mengatur `handleLogin`:
  - Reset `setSuccessMsg('')` setiap kali form disubmit atau terjadi kegagalan validasi.
  - Reset `setErrorMsg('')` setiap kali ada pesan sukses baru.
- Pada cabang `verified === 'true'` atau deteksi `#access_token`:
  - Jika sesi Supabase aktif dan metadata / target role adalah `owner`:
    - Simpan `localStorage.setItem('portal_view', 'owner')`.
    - Tampilkan status transisi loading verifikasi sukses.
    - Arahkan langsung ke `Page.DASHBOARD_MITRA` (`/dashboard-mitra`).

### Langkah 3: Perbaikan Tampilan Tunggu Email Pasca Registrasi
- Ubah layar `verificationSent` pada pendaftaran:
  - Tampilkan instruksi jelas: *"Tautan verifikasi telah dikirim ke email [email]. Silakan klik tombol 'Konfirmasi Akun Sekarang' di email Anda untuk langsung mengaktifkan akun."*
  - Sediakan tombol pintas *"Buka Gmail"* (`https://mail.google.com`) untuk memudahkan calon mitra.
  - Sediakan tombol *"Kirim Ulang Email"* dengan timer hitung mundur 60 detik.
  - Hapus input kotak 6-digit OTP dari layar pendaftaran agar calon mitra tidak bingung mencari kode angka.

---

## 4. Rencana Verifikasi & Pengujian

1. **Uji Kompilasi Front-End**:
   - Menjalankan `npm.cmd run build` di direktori `functions/public` untuk memastikan **0 error** TypeScript / JSX.
2. **Uji Kompilasi Cloud Functions**:
   - Menjalankan `npm.cmd run build` di direktori `functions` untuk memastikan integritas kode backend.
3. **Simulasi Pengujian Alur Pendaftaran**:
   - Calon mitra mendaftar di `/login?role=owner`.
   - Muncul layar instruksi konfirmasi email yang bersih.
   - Mengklik tombol **"KONFIRMASI AKUN SEKARANG"** di email.
   - Sistem memvalidasi token dan langsung mengarahkan pengguna ke **Dashboard Mitra** (`/dashboard-mitra`) tanpa anomali pesan merah & hijau bertabrakan.
4. **Pencatatan Progres**:
   - Mencatat seluruh riwayat di `functions/PROGRESS.md`.
   - Menerbitkan `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.
