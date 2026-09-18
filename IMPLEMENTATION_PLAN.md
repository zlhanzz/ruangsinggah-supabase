# Implementation Plan: Transisi Opsi B & Sistem Kode OTP Email (6-Digit) pada Pendaftaran

Dokumen ini merinci rencana teknis untuk menerapkan **Opsi B**:
1. Menghapus pemblokiran verifikasi nomor WhatsApp pada formulir pendaftaran awal (`/login?role=owner`), serta memindahkan verifikasi nomor WhatsApp ke menu **Verifikasi Identitas (KYC)** di Dashboard Mitra.
2. Mengubah sistem verifikasi email pendaftaran dari yang sebelumnya mengandalkan klik tautan email (*action link*) menjadi **sistem input 6-digit kode OTP langsung di layar UI**, didukung oleh template email Brevo yang menampilkan kode OTP secara jelas dan menonjol.

---

## 1. Analisis Masalah & Kebutuhan

### A. Masalah Alur Saat Ini
1. **Double Friction (Hambatan Berlapis)**: Saat calon mitra mendaftar, sistem meminta verifikasi OTP WhatsApp, namun setelahnya Supabase Auth tetap menuntut verifikasi email. Ini menimbulkan kebingungan pengguna dan tingkat pembatalan (*drop-off*) pendaftaran yang tinggi.
2. **Kredensial Login**: Akun di RuangSinggah berakar pada Email & Password (bukan Phone Auth). Oleh karena itu, verifikasi kepemilikan email adalah prioritas utama saat pendaftaran akun.
3. **Klik Link Email Kurang Praktis**: Pengguna harus berpindah aplikasi/tab, membuka inbox email, lalu mengklik tombol verifikasi yang sering kali membuka tab browser baru dan memutuskan alur pendaftaran (*broken context*).
4. **Konteks WhatsApp yang Tepat**: Nomor WhatsApp pemilik kost diperlukan untuk transaksi, koordinasi sewa, dan kontak darurat penyewa. Tempat paling tepat dan profesional untuk memverifikasi nomor WhatsApp adalah pada tahap **Verifikasi Identitas (KYC)** di Dashboard Mitra bersama verifikasi KTP dan Rekening Bank.

### B. Solusi yang Diterapkan
- **Pendaftaran Tanpa Hambatan (Zero Friction Signup)**: Input formulir tetap mencatat Nama, Nomor WhatsApp, Email, dan Password.
- **Transisi ke Layar Input Kode OTP Email 6-Digit**:
  - Saat tombol "Daftar & Verifikasi" ditekan, sistem membuat kredensial akun dan mengirimkan kode OTP 6-digit ke email via Brevo.
  - Halaman pendaftaran langsung beralih ke layar input kode 6-digit OTP dengan countdown kirim ulang (60 detik).
  - Pengguna cukup melihat kode di inbox email, mengetikkan 6 digit tersebut di website, dan sistem memanggil `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
  - Seketika kode cocok, sesi login aktif otomatis (*instant login*) dan pengguna langsung masuk ke dashboard tanpa perlu login ulang!
- **Template Email Brevo yang Diperbarui**:
  - Email konfirmasi menampilkan kotak kode verifikasi 6-digit yang besar dan jelas (*prominent OTP box*).
  - Tetap menyertakan tombol tautan konfirmasi sebagai alternatif cadangan (opsi ganda yang aman).
- **Verifikasi WhatsApp di KYC Mitra**:
  - Fitur verifikasi OTP WhatsApp Meta Cloud API tetap aktif di tab Verifikasi Identitas Mitra ([`MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)) sebagai syarat wajib sebelum akun mitra di-ACC oleh Admin.

---

## 2. Dampak Perubahan (File yang Tersentuh)

1. **[`functions/public/pages/Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx)**:
   - Menghapus modal verifikasi WhatsApp OTP saat submit registrasi.
   - Mengubah alur pendaftaran agar langsung memicu pengiriman kode verifikasi email.
   - Menambahkan state dan UI untuk verifikasi 6-digit OTP email (`emailOtpInput`, `isVerifyingEmailOtp`, timer kirim ulang).
   - Menghubungkan verifikasi kode dengan API Supabase Auth `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
   - Mengarahkan mitra/user otomatis ke dashboard setelah verifikasi kode berhasil.
2. **[`functions/src/index.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/src/index.ts)**:
   - Pada fungsi `handleCustomAuthEmail`, membaca properti `email_otp` dari hasil `supabase.auth.admin.generateLink`.
   - Memperbarui template HTML email Brevo untuk menampilkan kotak kode OTP 6-digit yang elegan dan kontras di samping tombol link konfirmasi.
3. **[`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)**:
   - Memastikan alur verifikasi nomor WhatsApp OTP di tab Verifikasi Identitas berfungsi normal dan tersinkronisasi dengan metadata `whatsapp_verified`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Modifikasi Email Handler di Backend Cloud Functions (`functions/src/index.ts`)
1. Mengambil `const emailOtp = data.properties.email_otp;` pada pemanggilan `supabase.auth.admin.generateLink`.
2. Menyisipkan blok tampilan kode OTP 6-digit pada desain HTML email Brevo (font monospace, latar oranye lembut, kontras tinggi).
3. Memastikan kompabilitas jika tipe adalah `signup`.

### Langkah 2: Pembaruan Alur Frontend di `Login.tsx`
1. Menghapus trigger modal WhatsApp OTP pada fungsi `handleRegister`.
2. Menambahkan state:
   - `isVerifyingEmailOtp: boolean`
   - `emailOtpInput: string`
   - `emailResendTimer: number`
3. Membuat komponen UI modal/layar Verifikasi OTP Email dengan 6 kotak digit angka dan tombol verifikasi.
4. Mengimplementasikan fungsi `handleVerifyEmailOtp`:
   ```typescript
   const { data, error } = await supabase.auth.verifyOtp({
     email: formData.email,
     token: emailOtpInput.trim(),
     type: 'signup'
   });
   ```
5. Mengimplementasikan `handleResendEmailOtp` dengan timer 60 detik.
6. Menyimpan nomor WhatsApp ke dalam data profil/metadata pengguna saat signup tanpa menahan alur pendaftaran.

### Langkah 3: Verifikasi Konsistensi di Dashboard Mitra (`MitraProfile.tsx`)
1. Memastikan verifikasi WhatsApp OTP tetap menjadi gerbang validasi di form Verifikasi Identitas (KYC) sebelum pengajuan KTP diserahkan ke Admin.

---

## 4. Rencana Verifikasi & Pengujian

1. **Uji Kompilasi Front-End**:
   - Menjalankan `npm run build` di direktori `functions/public` untuk memastikan 0 error TypeScript / JSX.
2. **Uji Kompilasi Cloud Function**:
   - Menjalankan `npm run build` di direktori `functions` untuk memastikan kompilasi TypeScript `src/index.ts` sukses tanpa error.
3. **Simulasi Alur Pendaftaran**:
   - Calon mitra mengisi formulir pendaftaran di `/login?role=owner`.
   - Layar input OTP Email 6-digit muncul seketika setelah formulir disubmit.
   - Email Brevo masuk ke inbox dengan kode 6-digit yang tercetak jelas.
   - Memasukkan 6-digit kode ke website $\rightarrow$ Akun terverifikasi dan otomatis login ke sistem.
4. **Pencatatan Progres**:
   - Mencatat seluruh riwayat pembaruan di `functions/PROGRESS.md`.
   - Menerbitkan `WALKTHROUGH.md`.
   - Push ke branch remote `bukan-productions`.
