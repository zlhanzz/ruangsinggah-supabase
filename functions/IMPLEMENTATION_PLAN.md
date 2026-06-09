# IMPLEMENTATION PLAN - Perbaikan Redireksi Login Sukses untuk Pengguna Biasa (User)

Rencana ini dibuat untuk memastikan pengguna biasa (role 'user') dialihkan secara otomatis ke halaman beranda (Home) setelah login berhasil, dan mencegah tampilan stuck di halaman login akibat parameter URL mode recovery yang tidak sinkron dengan React Router.

## 1. Analisis Masalah
- **Gejala**: Pengguna biasa yang berhasil login (atau setelah mereset sandi) tetap berada di halaman `/login`. Avatar di navbar menunjukkan status login aktif, tetapi formulir login tetap terbuka.
- **Penyebab**:
  1. Di `fetchUserData` pada `App.tsx`, tidak ada logika `else` untuk mengalihkan pengguna dengan role selain `admin`, `survey_agent`, dan `owner` ke halaman beranda (`Page.HOME`).
  2. Saat login sukses setelah mode recovery, pembersihan parameter URL menggunakan `window.history.replaceState` langsung ke browser tidak memicu perubahan state internal React Router (`location.search`), sehingga rute `<Route path={Page.LOGIN}>` mendeteksi bahwa mode recovery masih aktif dan tidak merender `<Navigate to={...}>`.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/App.tsx`:
   - Tambahkan pengalihan ke `Page.HOME` di `fetchUserData` jika role adalah `user`.
   - Gunakan `navigate(Page.LOGIN, { replace: true })` di properti `onLoginSuccess` komponen `Login` untuk menyinkronkan URL React Router dan menghapus parameter query.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `App.tsx`**:
   - Di `fetchUserData`, tambahkan: `else navigate(Page.HOME, { replace: true });`.
   - Di rute `Page.LOGIN`, ganti manipulasi history mentah menjadi navigasi router resmi.
2. **Kompilasi & Build Verifikasi**:
   - Jalankan `cmd.exe /c npm run build` di folder `functions/public` untuk memverifikasi frontend.
3. **Commit & Push**:
   - Push perubahan ke repositori git agar ter-deploy ke Cloudflare Pages.

## 4. Rencana Verifikasi
- Memastikan build lokal sukses.
- Mencoba alur login dengan akun pengguna biasa (`tipexpesta@gmail.com`) dan memastikan langsung dialihkan ke beranda (Home).
