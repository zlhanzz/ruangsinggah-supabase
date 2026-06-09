# WALKTHROUGH - Kustomisasi Template Email Autentikasi & Perbaikan Alur Reset Sandi

Dokumen ini menjelaskan detail perubahan untuk memperindah email konfirmasi/reset sandi serta memperbaiki alur reset kata sandi agar diarahkan ke form penetapan kata sandi baru dan diarahkan ke beranda setelah login berhasil.

## 1. Daftar Perubahan
1. **Desain Ulang HTML Email Template**:
   - Memodifikasi fungsi `handleCustomAuthEmail` pada `functions/src/index.ts`.
   - Mengganti email teks polos menjadi layout HTML responsif premium menggunakan skema warna oranye khas RuangSinggah.id (`#f97316`), logo resmi, tombol Call-to-Action (CTA) berbayang, dan fallback URL.

2. **Perbaikan Alur Reset Sandi (Password Recovery) & Redireksi Role User**:
   - Memodifikasi [App.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx).
   - Menambahkan intersepsi untuk event `PASSWORD_RECOVERY` pada callback `onAuthStateChange` agar mengalihkan pengguna secara instan ke `/login?mode=recovery` dengan sesi aktif.
   - Menyesuaikan fungsi `fetchUserData` agar menonaktifkan pengalihan otomatis ke dashboard berdasarkan peran (*role-based auto-redirect*) apabila parameter URL mengandung `mode=recovery`. Dengan ini, form penyetelan kata sandi baru ("Setel Sandi Baru") pada halaman login akan muncul dengan benar dan tidak ter-bypass.
   - **Menambahkan Pengalihan Default untuk Pengguna Biasa (role 'user')**: Menambahkan logika `else navigate(Page.HOME, { replace: true })` di dalam `fetchUserData` agar pengguna biasa langsung dialihkan ke beranda (Home) ketika berhasil login, alih-alih stuck di halaman login.
   - **Sinkronisasi Parameter URL React Router**: Mengganti pembersihan query parameter URL dari manipulasi `window.history.replaceState` mentah menjadi fungsi `navigate(Page.LOGIN, { replace: true })` dari React Router pada prop `onLoginSuccess` di rute login. Hal ini memastikan rute React Router segera memperbarui state internal `location.search` dan mendeteksi bahwa mode recovery telah berakhir, sehingga form login dapat ditutup dan pengguna dialihkan seketika.

3. **Pembersihan Data Mismatch (Resolusi Kendala `tipexpesta@gmail.com`)**:
   - Membersihkan data profil yatim (orphaned record) di tabel `public.users` agar tidak terjadi pelanggaran constraint unik. Akun tersebut sekarang sudah aktif dan terkonfirmasi secara manual.

## 2. Hasil Pengujian & Verifikasi Lokal
1. **Build & Kompilasi Sukses**:
   - Proses kompilasi Cloud Functions (`npm run build` di folder `functions`) berhasil tanpa error.
   - Proses build frontend React (`npm run build` di folder `functions/public`) berhasil 100% tanpa kendala tipe data maupun runtime (`✓ built in 38.67s`).

## 3. Cara Deploy Perubahan Kode
Jalankan perintah berikut untuk mendeploy pembaruan Cloud Functions ke Firebase:
```bash
firebase deploy --only functions
```
Dan push kode terbaru ke repositori Git untuk mendeploy pembaruan frontend (Cloudflare Pages):
```bash
git add .
git commit -m "fix: redirect user to home on login and sync router search params"
git push origin main
```
