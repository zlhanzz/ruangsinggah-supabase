# WALKTHROUGH - Penegakan Kesakralan Gerbang Login (Pencari Kost vs Pemilik Kost)

## Ringkasan Pekerjaan
Telah berhasil diimplementasikan penguncian dan validasi dua arah (*strict bidirectional role-gateway isolation*) pada sistem autentikasi login RuangSinggah. Perubahan ini memastikan "kesakralan" gerbang masuk (*portal gate*) tetap terjaga 100%:
1. **Gerbang Pencari Kost**: Hanya akun penyewa / pencari kost biasa (`role === 'user'`) yang diizinkan masuk. Jika akun Pemilik Kost / Mitra (`role === 'owner'` / `'mitra'`) mencoba login di gerbang ini, sistem secara otomatis menolak, melakukan auto-logout, dan mengarahkan ke formulir Pemilik Kost dengan pesan peringatan yang jelas.
2. **Gerbang Pemilik Kost (Mitra)**: Hanya akun mitra / admin (`role === 'owner'`, `'mitra'`, `'admin'`) yang diizinkan masuk. Jika akun Pencari Kost biasa mencoba login di gerbang ini, sistem menolak dan mengarahkan kembali ke formulir Pencari Kost.

---

## 1. Daftar Perubahan Kode

### A. Validasi Ketat Dua Arah & Navigasi di `App.tsx` (`functions/public/App.tsx`)
- **Pembersihan Overwrite Paksa**: Menghapus baris `if (role === 'owner') localStorage.setItem('portal_view', 'owner');` yang sebelumnya membajak pilihan gerbang pengguna dan memaksanya langsung masuk ke dashboard mitra.
- **Validasi Dua Arah pada `fetchUserData`**:
  - **Blokir Pemilik di Gerbang Pencari Kost**:
    Jika `currentPortal === 'user'` dan `role === 'owner'` / `'mitra'`, sistem mengeksekusi `supabase.auth.signOut()` dan redirect ke `/login?error=role_mismatch_owner`.
  - **Blokir Pencari Kost di Gerbang Pemilik**:
    Jika `currentPortal === 'owner'` dan `role === 'user'`, sistem mengeksekusi `supabase.auth.signOut()` dan redirect ke `/login?error=role_mismatch`.
- **Navigasi Post-Login Presisi (`handleNavigationAfterLogin`)**:
  - Mengubah logika redirect sehingga akun mitra hanya diarahkan ke `Page.DASHBOARD_MITRA` jika `currentPortal === 'owner'`. Jika login melalui gerbang lain atau kondisi tidak valid, diarahkan dengan aman.

### B. Penanganan Pesan Error di Halaman Login (`functions/public/pages/Login.tsx`)
- Menambahkan penanganan parameter query `error === 'role_mismatch_owner'` pada hook `useEffect`.
- Menampilkan pesan notifikasi:
  `"Akun Anda terdaftar sebagai Pemilik Kost. Silakan masuk melalui gerbang Pemilik Kost (Mitra)."`
- Secara otomatis mengalihkan tab/tampilan form login ke mode `'owner'` agar pengguna langsung berada di gerbang yang benar.

---

## 2. Hasil Pengujian & Kompilasi
- **Vite Production Build**: `Exit Code 0` (Berhasil 100% tanpa error, `built in 41.45s`).
- **Validasi Kode**: Struktur data dan otorisasi auth state terjaga konsisten.

---

## 3. Panduan Pengujian untuk Pengguna
1. **Uji Skenario 1 (Pemilik mencoba masuk lewat Gerbang Pencari Kost)**:
   - Buka `/login` dan pastikan tab berada di **Pencari Kost**.
   - Masukkan email dan password akun Pemilik Kost (Mitra).
   - Klik **Masuk**.
   - **Hasil**: Login ditolak, sistem otomatis logout, tab berpindah ke **Pemilik Kost**, dan muncul pesan banner: *"Akun Anda terdaftar sebagai Pemilik Kost. Silakan masuk melalui gerbang Pemilik Kost (Mitra)."*
2. **Uji Skenario 2 (Pencari Kost mencoba masuk lewat Gerbang Pemilik Kost)**:
   - Buka `/login` dan pilih tab **Pemilik Kost**.
   - Masukkan email dan password akun Pencari Kost biasa (`role: user`).
   - Klik **Masuk**.
   - **Hasil**: Login ditolak, sistem otomatis logout, tab berpindah ke **Pencari Kost**, dan muncul pesan banner: *"Akun Anda tidak terdaftar sebagai Pemilik Kost. Silakan login sebagai Pencari Kost."*
3. **Uji Skenario 3 (Login Normal Sesuai Gerbang Masing-Masing)**:
   - Akun Pencari Kost login di tab Pencari Kost ➔ Berhasil masuk ke Beranda / Halaman User.
   - Akun Pemilik Kost login di tab Pemilik Kost ➔ Berhasil masuk ke Dashboard Mitra.
