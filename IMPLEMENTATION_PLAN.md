# Implementation Plan: Perbaikan Fungsi Keluar Akun (Logout) pada Profil Dashboard Mitra

Dokumen rencana kerja ini disusun untuk mengatasi masalah di mana tombol **"Keluar dari Akun Mitra"** pada halaman profil Dashboard Mitra (`/dashboard-mitra/profile`) belum berfungsi dengan baik dan tidak mengeluarkan sesi akun pengguna secara semestinya.

---

## 1. Analisis Masalah & Kebutuhan

1. **Akar Masalah (Bug Routing vs Auth SignOut)**:
   - Pada komponen [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx) (baris 2646), prop `onLogout` yang dioper ke `<MitraProfile>` bernilai:
     ```tsx
     onLogout={() => onPageChange?.(Page.HOME)}
     ```
   - Handler tersebut hanya memerintahkan navigasi URL ke halaman beranda (`Page.HOME`), **tanpa memanggil `supabase.auth.signOut()`**, tanpa menghapus state sesi user di `App.tsx`, dan tanpa membersihkan cache browser.
   - Akibatnya, sesi login pengguna tetap aktif sepenuhnya di browser, dan ketika pengguna membuka kembali situs atau tombol navigasi, akun mitra masih tetap dalam posisi login (*tidak logout*).
2. **Kebutuhan Solusi**:
   - Menghubungkan tombol logout profil mitra ke fungsi logout resmi yang sesungguhnya (`handleLogoutWithCleanup` yang memicu `onLogout={handleLogout}` dari `App.tsx` serta `supabase.auth.signOut()`).
   - Menambahkan konfirmasi interaktif (*"Apakah Anda yakin ingin keluar dari akun mitra?"*) sebelum proses logout dieksekusi untuk mencegah ketidaksengajaan klik.
   - Menyediakan mekanisme pembersihan sesi cadangan (*fallback*) jika terjadi kegagalan jaringan saat menghubungi auth service.

---

## 2. Dampak Perubahan

File yang akan disentuh pada tahap eksekusi:
- [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx):
  - Mengubah prop `onLogout` pada pemanggilan `<MitraProfile>` (baris 2646) dari `() => onPageChange?.(Page.HOME)` menjadi `handleLogoutWithCleanup`.
  - Memperkuat fungsi `handleLogoutWithCleanup` agar mengeksekusi `onLogout()` dari props dan membersihkan state session storage.
- [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
  - Menambahkan handler `handleLogoutClick` dengan konfirmasi `window.confirm` yang ramah dan aman sebelum mengeksekusi callback logout.
  - Memastikan jika prop `onLogout` tidak terdefinisi karena alasan tertentu, terdapat fallback langsung memanggil `supabase.auth.signOut()` dan meredireksi ke `/`.

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Perbaikan Pengikatan Callback di `MitraDashboard.tsx`
1. Cari pemanggilan `<MitraProfile>` di dalam blok `activeMenu === 'profile'`.
2. Ubah baris:
   ```tsx
   onLogout={() => onPageChange?.(Page.HOME)}
   ```
   menjadi:
   ```tsx
   onLogout={handleLogoutWithCleanup}
   ```
3. Pastikan `handleLogoutWithCleanup` memanggil `onLogout?.()` yang diterima dari `App.tsx` (yang menjalankan `supabase.auth.signOut()` dan reset `setUser(null)`).

### Langkah 2: Penyempurnaan Tombol Logout di `MitraProfile.tsx`
1. Buat fungsi `handleLogoutClick`:
   ```tsx
   const handleLogoutClick = async () => {
       if (!window.confirm('Apakah Anda yakin ingin keluar dari akun mitra?')) return;
       if (onLogout) {
           onLogout();
       } else {
           try {
               await supabase.auth.signOut();
           } catch (e) {
               console.error('SignOut error:', e);
           } finally {
               window.location.href = '/';
           }
       }
   };
   ```
2. Hubungkan event tombol `Keluar dari Akun Mitra` ke `onClick={handleLogoutClick}`.

### Langkah 3: Pengujian Kompilasi & Pengujian Alur
1. Jalankan `cmd.exe /c npm run build` untuk memastikan 0 error kompilasi.
2. Uji fungsi logout pada halaman profil mitra untuk memastikan sesi Supabase auth terhapus dan halaman teredireksi bersih ke halaman utama.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**: Memastikan proses `npm run build` sukses 100% tanpa error TypeScript.
2. **Uji Fungsionalitas**:
   - Membuka menu profil mitra di Dashboard Mitra (`/dashboard-mitra/profile`).
   - Mengklik tombol **"Keluar dari Akun Mitra"**.
   - Menyetujui konfirmasi dialog.
   - Memverifikasi bahwa auth session Supabase berhasil dihapus (`supabase.auth.getUser()` bernilai null) dan pengguna dialihkan ke halaman utama dalam status belum login (*guest/logged out*).
