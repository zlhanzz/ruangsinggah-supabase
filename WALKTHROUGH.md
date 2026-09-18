# Walkthrough: Penerapan Arsitektur Opsi B & Sistem Kode 6-Digit Email OTP pada Pendaftaran

Dokumen ini mendokumentasikan implementasi fitur **Opsi B** untuk pendaftaran akun dan penyempurnaan alur verifikasi email menjadi sistem **input 6-digit kode OTP langsung di layar UI website**.

---

## 1. Daftar Perubahan yang Dilakukan

### A. Front-End Pendaftaran ([`functions/public/pages/Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx))
1. **Penghapusan Hambatan WhatsApp OTP saat Registrasi**:
   - Menghapus modal penahan WhatsApp OTP yang sebelumnya memblokir proses submit pendaftaran pemilik kost.
   - Calon mitra dan calon pencari kost kini dapat mendaftar dengan lancar dan instan (*zero friction signup*).
   - Nomor WhatsApp tetap dicatat di form pendaftaran dan disimpan ke dalam database `users.phone` serta metadata awal (`whatsapp_verified: false`).
2. **Antarmuka Interaktif 6-Digit Kode OTP Email (`verificationSent`)**:
   - Setelah menekan tombol *"Daftar & Verifikasi"*, pengguna tidak lagi hanya melihat teks statis "Cek email Anda", melainkan langsung dihadapkan pada layar **Verifikasi Email Anda** lengkap dengan:
     - 6 kotak input OTP yang otomatis memformat angka (`font-mono text-3xl tracking-[1em]`).
     - Banner *Mode Pengujian Cepat* yang menampilkan kode OTP jika dijalankan di mode lokal/sandbox.
     - Tombol **"Verifikasi & Masuk"** yang memicu `handleVerifyEmailOtp`.
     - Hitung mundur timer 60 detik untuk tombol **"Kirim Ulang Kode Verifikasi"**.
     - Opsi tombol **"Batal"** jika pengguna ingin mengubah email yang salah ketik.
3. **Autentikasi Otomatis via Supabase `verifyOtp`**:
   - Ketika 6 digit kode dimasukkan, sistem memanggil:
     ```typescript
     await supabase.auth.verifyOtp({
       email: formData.email.trim(),
       token: emailOtpInput.trim(),
       type: 'signup'
     });
     ```
   - Begitu diverifikasi, sesi Supabase langsung aktif (*instant login*), pengguna mendapatkan feedback hijau, dan sistem langsung mengarahkan pengguna ke Dashboard Mitra (`Page.DASHBOARD_MITRA`) atau Beranda (`Page.HOME`) tanpa perlu login ulang!

### B. Backend Email Handler ([`functions/src/index.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/src/index.ts))
1. **Ekstraksi Kode OTP Supabase**:
   - Mengambil properti `email_otp` dari hasil `supabase.auth.admin.generateLink`.
2. **Pembaruan Desain Email Brevo**:
   - Menyisipkan kotak kode OTP verifikasi 6-digit (*prominent OTP box*) dengan styling oranye kontras tinggi, font monospace besar, dan instruksi yang jelas.
   - Tetap menyediakan tombol tautan konfirmasi langsung di bawahnya (*dual verification option*), sehingga pengguna yang membuka email di HP tetap bisa klik tombol langsung jika tidak ingin menyalin kode.
3. **Penyertaan `emailOtp` pada Respons HTTP**:
   - Mengembalikan field `emailOtp` pada respons JSON pendaftaran untuk mendukung kemudahan pengujian.

### C. Menu Verifikasi Identitas (KYC) Mitra ([`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx))
- Alur verifikasi WhatsApp OTP resmi via Meta Cloud API tetap aktif dan berfungsi penuh pada tab **Verifikasi Identitas (KYC)** di Dashboard Mitra.
- Mitra memverifikasi nomor WhatsApp-nya berdampingan dengan unggah KTP dan rekening bank sebelum data diserahkan ke Admin untuk disetujui (ACC).

---

## 2. Hasil Pengujian & Kompilasi

1. **Kompilasi TypeScript Backend (`functions`)**:
   ```
   > build
   > tsc
   Exit code: 0 (Sukses tanpa error)
   ```
2. **Kompilasi Produksi Front-End Vite (`functions/public`)**:
   ```
   vite v6.4.1 building for production...
   ✓ 2512 modules transformed.
   rendering chunks...
   ✓ built in 20.64s
   Exit code: 0 (Sukses 100%)
   ```

---

## 3. Panduan Pengujian bagi Pengguna (Testing Guide)

Silakan uji alur pendaftaran baru ini di browser Anda:

1. **Buka Halaman Pendaftaran**:
   - Buka `/login?role=owner` (atau pilih peran *Pemilik / Mitra Kost* $\rightarrow$ klik *Daftar Sekarang*).
2. **Isi Formulir**:
   - Masukkan Nama Lengkap, Nomor WhatsApp, Email, dan Kata Sandi.
   - Klik **"Daftar & Verifikasi"**.
3. **Layar Masukkan Kode OTP Email Terbuka**:
   - Anda akan langsung melihat layar verifikasi email dengan input 6-digit.
   - Di kotak oranye *Mode Pengujian Cepat*, kode 6-digit akan langsung terlihat (dan email dengan template baru juga dikirimkan ke inbox email Anda).
4. **Verifikasi Kode**:
   - Ketikkan 6 digit angka tersebut ke dalam kotak input.
   - Klik **"Verifikasi & Masuk"**.
5. **Hasil**:
   - Sistem memverifikasi email Anda, sesi langsung aktif seketika, dan Anda langsung dialihkan ke Dashboard Mitra!
