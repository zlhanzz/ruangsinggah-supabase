# Implementation Plan: Perbaikan Redirect Dinamis (Localhost vs Produksi) & Auto-Routing ke Dashboard Mitra setelah Verifikasi

Dokumen ini merinci analisis dan rencana solusi teknis atas 3 kendala yang dilaporkan:
1. **Email Autentikasi Masih Berupa Tombol Link & Penjelasan Kode OTP Supabase**.
2. **Redirection Link Belum Dinamis (Localhost Terlempar ke Domain Asli `ruangsinggah.id`)**.
3. **Akun Pemilik Kost Masuk ke Tampilan User (Pencari Kost) setelah Verifikasi, Bukan ke Dashboard Mitra**.

---

## 1. Analisis Masalah & Kebutuhan

### A. Mengapa Email Masuk Masih Berupa Tombol Link Saja (Belum Ada Kode 6-Digit)?
- **Akar Masalah**: Pengiriman email verifikasi ditangani oleh fungsi cloud `handleCustomAuthEmail` di Google Cloud Run / Firebase Functions (`https://handlecustomauthemail-hzxlewhsuq-uc.a.run.app`). Perubahan template email yang menampilkan kotak kode OTP 6-digit sudah selesai kita buat di file lokal `functions/src/index.ts`, namun **belum di-deploy ke Cloud Run oleh user** (sesuai aturan baku bahwa agent tidak boleh melakukan deploy cloud secara mandiri).
- **Apakah Supabase BISA pakai kode OTP?**: **BISA 100%!** Supabase Auth menghasilkan `data.properties.email_otp`. Begitu fungsi di-deploy, Brevo otomatis menyertakan kotak 6-digit OTP tersebut. Selain itu, di front-end kita sudah menyediakan banner *Mode Pengujian Cepat* yang menampilkan kode 6-digit secara instan di layar pendaftaran.

### B. Mengapa Tautan Email Mengarah ke `ruangsinggah.id` saat Mendaftar di `localhost`?
- **Akar Masalah**: Pada `Login.tsx`, panggilan `fetch('https://handlecustomauthemail-hzxlewhsuq-uc.a.run.app')` saat registrasi belum menyertakan properti `redirectTo` di body JSON. Akibatnya, backend menggunakan nilai fallback default yang di-hardcode:
  `const redirectUrl = req.body.redirectTo || 'https://ruangsinggah.id/login';`
- **Solusi**: Mengirimkan `redirectTo: `${window.location.origin}${Page.LOGIN}?verified=true&role=${activeRole}`` secara eksplisit.
  - Pada `http://localhost:5173`, link verifikasi email akan mengarahkan kembali ke `http://localhost:5173/login?verified=true&role=owner`.
  - Pada domain produksi `https://ruangsinggah.id`, link akan mengarahkan ke `https://ruangsinggah.id/login?verified=true&role=owner`.

### C. Mengapa Pemilik Kost Masuk ke Tampilan User setelah Verifikasi?
- **Akar Masalah**:
  1. Saat link email diklik, Supabase Auth mendeteksi token dan mengaktifkan sesi login di browser. Namun, URL tidak menyertakan peran, dan `localStorage.getItem('portal_view')` tidak diset ke `'owner'`.
  2. Pada `App.tsx` baris 286–306 dan baris 818–824, jika `portal_view` tidak diset ke `'owner'`, sistem menganggap pengguna berada di portal pencari kost biasa sehingga diarahkan ke Beranda User (`Page.HOME`).
- **Solusi**:
  1. Menyertakan `&role=${activeRole}` pada tautan redirect email.
  2. Pada `Login.tsx`, saat mendeteksi `verified === 'true'` atau saat 6-digit OTP email diverifikasi:
     - Set `localStorage.setItem('portal_view', role || 'owner')`.
     - Set `setActiveRole('owner')`.
     - Lakukan pengecekan sesi aktif dari Supabase. Jika sesi login sudah aktif dari token email, langsung redirect otomatis ke `Page.DASHBOARD_MITRA`!

---

## 2. Dampak Perubahan (File yang Tersentuh)

1. **[`functions/public/pages/Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx)**:
   - Menambahkan `redirectTo: `${window.location.origin}${Page.LOGIN}?verified=true&role=${activeRole}`` pada fungsi `handleRegister` dan `handleResendEmailOtp`.
   - Menangani parameter URL `verified === 'true'` dan `role === 'owner'`:
     - Menyetel `portal_view` ke `'owner'` di `localStorage`.
     - Memeriksa sesi login aktif dari Supabase (`supabase.auth.getSession()`).
     - Jika sesi aktif terdeteksi (dari token link email), langsung redirect otomatis ke `/dashboard-mitra`.
   - Memastikan setelah verifikasi kode 6-digit OTP berhasil, sistem menyetel `localStorage.setItem('portal_view', 'owner')` dan mengarahkan ke `/dashboard-mitra`.
2. **Panduan Deploy Backend**:
   - Memberikan perintah eksplisit bagi user untuk mendeploy fungsi email Brevo terbaru ke Firebase Cloud Run: `firebase deploy --only functions:handleCustomAuthEmail`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Modifikasi `Login.tsx` untuk Dynamic Redirect & Role Tracking
1. Tambahkan `redirectTo` dinamis berbasis `window.location.origin` pada `handleRegister` dan `handleResendEmailOtp`.
2. Perbarui blok `else if (verified === 'true')` di `useEffect` `Login.tsx` untuk:
   - Mengambil parameter `roleParam = searchParams.get('role') || 'owner'`.
   - Mengatur `localStorage.setItem('portal_view', roleParam)`.
   - Memeriksa sesi Supabase; jika terotentikasi, otomatis navigasi ke `Page.DASHBOARD_MITRA`.

### Langkah 2: Uji Kompilasi Front-End
1. Menjalankan `npm.cmd run build` di direktori `functions/public` untuk memastikan 0 error kompilasi Vite/TypeScript.

### Langkah 3: Pencatatan Riwayat & Push Git
1. Mencatat perubahan di `functions/PROGRESS.md`.
2. Menerbitkan laporan `WALKTHROUGH.md`.
3. Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Pengujian Link Redirect di Localhost**:
   - Submit pendaftaran pemilik kost di `localhost:5173`.
   - Verifikasi bahwa payload ke `handlecustomauthemail` membawa `redirectTo: http://localhost:5173/login?verified=true&role=owner`.
2. **Pengujian Navigasi Otomatis ke Dashboard Mitra**:
   - Simulasi verifikasi OTP 6 digit di modal $\rightarrow$ dipastikan langsung masuk ke `/dashboard-mitra`.
   - Simulasi buka URL `/login?verified=true&role=owner` dengan sesi login aktif $\rightarrow$ dipastikan langsung masuk ke `/dashboard-mitra`.
