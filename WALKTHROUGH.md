# WALKTHROUGH - Restrukturisasi Modal Ganti Kata Sandi Menjadi Clean 2-Step Flow & 6-Box OTP Input

**ID Pekerjaan**: Entry #439  
**Tanggal**: September 2026  
**Status**: Selesai & Lulus Uji Kompilasi (`build 0 error`)

---

## 1. Ringkasan Kebutuhan & Perubahan

Berdasarkan permintaan penyempurnaan antarmuka pengubahan kata sandi akun pada **Dashboard Mitra (`MitraProfile.tsx`)** dan **Profil Pengguna Umum (`Profile.tsx`)**:
1. **Penyederhanaan Tampilan (Clean Minimalist UI)**:
   - Menghilangkan tumpukan seluruh elemen dalam satu layar yang sebelumnya semrawut (input sandi baru, email, tombol minta OTP, dan verifikasi menumpuk bersamaan).
   - Mengadopsi struktur alur 2-tahap (*2-Step Guided Flow*) yang bersih, ringkas, dan bebas kebingungan kognitif (*no cognitive overload*).
2. **Tahap 1 (`input_password`)**:
   - Struktur dari atas ke bawah:
     1. **Kata Sandi Baru** (lengkap dengan toggle visibility mata `Eye` / `EyeOff`)
     2. **Konfirmasi Kata Sandi Baru** (lengkap dengan toggle visibility mata `Eye` / `EyeOff`)
     3. **Email Terdaftar** (kartu info ringkas yang menampilkan email tujuan kode OTP)
     4. **Tombol "Verifikasi Perubahan Sandi"** (melakukan validasi form dan langsung mengirimkan OTP 6 digit secara otomatis)
     5. Tautan alternatif: *"Atau Kirim Link Reset ke Email"*
3. **Tahap 2 (`verify_otp`)**:
   - Menampilkan banner instruksi konfirmasi pengiriman kode ke email.
   - Menggunakan **6-Box Section OTP Input** (6 kotak digit terpisah, font mono tebal, auto-jump, backspace-jump, dan paste support).
   - Indikator hitung mundur (*cooldown resend*) 60 detik & tombol kirim ulang OTP.
   - Tombol aksi utama: **"Verifikasi & Simpan Kata Sandi"** (menyimpan perubahan langsung ke `supabase.auth.updateUser`).
   - Tombol kembali ke Tahap 1: **"Ubah Input Kata Sandi"** jika pengguna ingin merevisi sandi.

---

## 2. Rincian Perubahan File

### A. [functions/public/pages/MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)
1. **State Navigasi & 6-Digit OTP**:
   - Menambahkan state `passwordStep`: `'input_password' | 'verify_otp'`.
   - Menambahkan state `passwordOtpDigits` (array 6 elemen) dan `passwordOtpRefs` untuk kontrol fokus setiap digit.
2. **Handler Transisi Otomatis (`handleProceedToPasswordOtp`)**:
   - Memvalidasi minimal 6 karakter kata sandi dan keselarasan konfirmasi sandi.
   - Menghasilkan kode OTP 6 digit acak dan mengirimkannya melalui `sendPasswordChangeOtp`.
   - Mengaktifkan cooldown timer 60 detik dan memindahkan state ke `verify_otp`.
3. **Komponen 6-Box OTP Input**:
   - Mendukung pengetikan cepat (otomatis pindah ke kotak berikutnya).
   - Mendukung penghapusan `Backspace` yang mundur ke kotak sebelumnya.
   - Mendukung aksi tempel kode (`Paste`) otomatis 6 digit.
4. **Verifikasi Final & Eksekusi Supabase Auth**:
   - Memvalidasi kecocokan 6 digit kode dengan kode yang dikirim ke email.
   - Memperbarui kata sandi akun melalui `supabase.auth.updateUser({ password: newPassword })`.
   - Menampilkan notifikasi sukses dan menutup modal secara otomatis.

### B. [functions/public/pages/Profile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx)
- Menerapkan alur 2-tahap dan komponen 6-Box Section OTP yang 100% identik pada modal ganti kata sandi profil pengguna umum sehingga seluruh ekosistem aplikasi memiliki standar UI/UX yang selaras dan premium.

### C. [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md)
- Mencatat riwayat implementasi pada Entry #439.

---

## 3. Hasil Verifikasi & Pengujian

### A. Uji Kompilasi Frontend (`cmd.exe /c npm run build`)
- Kompilasi TypeScript dan bundler Vite berjalan lancar dengan status 0 error kompilasi (`exit code 0`).

### B. Panduan Pengujian UI/UX Pengguna
1. **Dashboard Mitra**:
   - Buka `/dashboard-mitra/profile`.
   - Buka menu **Keamanan & Kata Sandi** (Pengaturan Akun).
   - Periksa urutan form Tahap 1: Kata Sandi Baru -> Ulangi Kata Sandi Baru -> Email Terdaftar -> Tombol *"Verifikasi Perubahan Sandi"*.
   - Masukkan kata sandi baru dan klik tombol *"Verifikasi Perubahan Sandi"*.
   - Amati transisi mulus ke Tahap 2: form beralih ke 6 kotak input digit OTP.
   - Uji pengetikan 6 digit atau copy-paste kode OTP.
   - Klik *"Verifikasi & Simpan Kata Sandi"* untuk menyelesaikan pembaruan kata sandi.
2. **Profil Pengguna**:
   - Buka `/profile` atau klik icon profil user.
   - Buka menu Ubah Kata Sandi dan amati alur 2-tahap dengan 6 box OTP yang konsisten.
