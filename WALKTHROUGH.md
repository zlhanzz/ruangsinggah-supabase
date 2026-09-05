# Walkthrough: Syarat Wajib Verifikasi Identitas Sebelum Mendaftar KostManager & Pengalihan Otomatis ke Profil

## Ringkasan Perubahan
Sistem pendaftaran program **KostManager** telah dilengkapi dengan validasi verifikasi identitas wajib (`verification_status === 'verified'`). Jika pengguna atau mitra belum menyelesaikan verifikasi identitas (KTP dan data diri), setiap upaya mendaftar KostManager akan dicegah dan **dialihkan secara otomatis langsung ke halaman profil verifikasi identitas**.

---

## 1. Detail Implementasi

### A. Proteksi Pendaftaran pada [`KostManagerLanding.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx)
1. **Fungsi Validasi `checkIdentityVerification()`**:
   - Memeriksa status login dan verifikasi pengguna:
     - Jika belum login $\rightarrow$ mengarahkan ke halaman login pendaftaran mitra (`/login?role=owner&mode=register`).
     - Jika `user.verification_status !== 'verified'` $\rightarrow$ memunculkan alert notifikasi:
       > *"Syarat Mendaftar KostManager: Anda harus menyelesaikan verifikasi identitas terlebih dahulu. Anda akan dialihkan otomatis ke halaman profil untuk melengkapi data dan dokumen identitas."*
       dan langsung mengalihkan pengguna ke:
       - **Mitra**: `/dashboard-mitra/profile?edit=true&step=2` (Langkah 2: Verifikasi Identitas & Unggah KTP).
       - **User Umum**: `/profile?view=edit`.
2. **Proteksi Pembukaan Modal (`handleOpenRegistration`)**:
   - Mencegah modal pendaftaran terbuka jika akun belum terverifikasi.
3. **Proteksi Akses URL Langsung (`?register=true`)**:
   - Menambahkan hook reaktif `useEffect` yang mengecek status verifikasi saat halaman diakses via URL pendaftaran langsung. Jika belum terverifikasi, modal ditutup dan pengguna dialihkan ke profil.
4. **Proteksi Submit Layer (`handleSubmit`)**:
   - Memastikan data onboarding dan checkout pembayaran tidak dapat dikirim sebelum verifikasi identitas berstatus `verified`.

### B. Proteksi Pop-up Iklan Promo pada [`MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
- Pada fungsi `handlePromoNavigate`, saat tombol *"Pelajari & Ajukan Sekarang"* diklik:
  - Jika mitra belum terverifikasi (`!isVerified`), sistem memunculkan notifikasi edukasi dan langsung mengarahkan mitra ke `/dashboard-mitra/profile?edit=true&step=2`.

### C. Proteksi Tombol Upgrade pada [`MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)
- Tombol *"Upgrade ke KostManager"* pada kartu profil mitra dan tombol modal progres memvalidasi status `formData.verification_status !== 'verified'`.
- Jika belum terverifikasi, tombol langsung membuka formulir Langkah 2 Verifikasi Identitas (`setSearchParams({ edit: 'true', step: '2' })`).

---

## 2. Hasil Pengujian & Kompilasi

- **Kompilasi Frontend Vite**:
  ```bash
  cmd /c npm run build (di functions/public)
  ```
  **Status**: `✓ 2511 modules transformed. ✓ built in 40.01s` (**0 Error, 0 Warning Kritis**).

---

## 3. Panduan Pengujian untuk Pengguna (User Testing Steps)

1. **Uji Melalui Pop-up Iklan KostManager di Dashboard Mitra**:
   - Login dengan akun mitra yang status identitasnya belum diverifikasi.
   - Buka Beranda Dashboard Mitra (`/mitra`) $\rightarrow$ Modal pop-up iklan KostManager muncul.
   - Klik tombol **"Pelajari & Ajukan Sekarang"**.
   - Sistem akan memunculkan alert: *"Syarat Mendaftar KostManager: Anda harus menyelesaikan verifikasi identitas terlebih dahulu..."* dan langsung mengarahkan ke tab **Profil (Langkah 2: Verifikasi Identitas & KTP)**.
2. **Uji Melalui Landing Page KostManager (`/kostmanager`)**:
   - Akses `/kostmanager`.
   - Klik tombol **"Daftar KostManager Sekarang"** atau tombol **"Pilih Paket & Daftar"**.
   - Sistem akan memunculkan alert dan otomatis mengalihkan pengguna langsung ke halaman pengisian verifikasi identitas.
3. **Uji Akses URL Langsung `/kostmanager?register=true`**:
   - Buka `/kostmanager?register=true` pada akun yang belum terverifikasi.
   - Halaman pendaftaran otomatis ditutup dan pengguna dialihkan ke profil verifikasi.
4. **Uji Akun Mitra Terverifikasi (`verified`)**:
   - Login dengan akun mitra yang sudah terverifikasi (`verification_status: 'verified'`).
   - Buka `/kostmanager` $\rightarrow$ Klik daftar $\rightarrow$ Modal pendaftaran KostManager terbuka secara normal dan siap diisi.
