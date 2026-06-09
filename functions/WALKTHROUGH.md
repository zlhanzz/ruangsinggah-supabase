# WALKTHROUGH - Perbaikan Trigger Konfirmasi Email & Alur Login Registrasi (Auth)

Dokumen ini menjelaskan detail perubahan untuk mengatasi kegagalan pendaftaran (trigger error) serta mengubah perilaku setelah user mengeklik link verifikasi email agar tidak langsung login otomatis.

## 1. Daftar Perubahan
1. **Perbaikan SQL Trigger**:
   - Memperbaiki fungsi `public.handle_new_user()` di database dengan menghilangkan kualifikasi skema penuh (`public.`) pada nama tabel target di bagian perintah `DO UPDATE SET`.
   - Menambahkan cast tipe data eksplisit `::public.user_role` pada nilai string `role` yang disisipkan karena kolom `role` di tabel `public.users` bertipe data enum kustom `user_role`.
2. **Interseptor Redirect Frontend**:
   - Memperbarui [App.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx) agar mendeteksi redirect verifikasi email melalui query parameter PKCE (`?code=...`).
   - Ketika terdeteksi masuk dari alur registrasi (terdapat parameter `code` dan tidak sedang dalam mode `recovery`), sistem akan secara otomatis memanggil `signOut()` dan mengalihkan pengguna ke `/login?verified=true`.
3. **Pemuatan Pesan Sukses**:
   - Halaman [Login.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx) sudah mendukung parameter `verified=true` dan akan menampilkan pesan hijau: *"Email berhasil diverifikasi! Silakan login dengan email dan kata sandi Anda."*
4. **File Skema Lokal & SQL Script**:
   - Menyelaraskan berkas [supabase_schema.sql](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/supabase_schema.sql).
   - Menulis perbaikan SQL ke berkas [fix_trigger.sql](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/scratch/fix_trigger.sql).

## 2. Petunjuk Perbaikan (Langkah Wajib untuk User)
1. Jika Anda belum melakukannya, silakan jalankan kembali script SQL perbaikan trigger terbaru di **SQL Editor** Supabase Anda menggunakan berkas:
   [fix_trigger.sql](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/scratch/fix_trigger.sql)
2. Klik tombol **Run** untuk mengeksekusi script.

## 3. Hasil Pengujian & Verifikasi Lokal
1. **Build Sukses**:
   Proses kompilasi dan build produksi lokal telah berhasil dijalankan menggunakan Vite tanpa ada error:
   ```bash
   vite build
   ✓ built in 36.19s
   ```
2. **Verifikasi Alur**:
   - Saat link autentikasi email diklik, URL akan membawa kode `?code=xxx`.
   - Kode ini ditukarkan dengan sesi di latar belakang (memicu `SIGNED_IN` event), kemudian langsung di-intercept oleh `App.tsx` untuk di-signout secara instan.
   - Pengguna diarahkan ke `/login?verified=true` dan diminta mengisi email/password untuk login.

## 4. Cara Deploy Perubahan Kode
Jalankan perintah berikut untuk mengunggah pembaruan ke repositori GitHub agar ter-deploy ke Cloudflare Pages secara otomatis:
```bash
git add .
git commit -m "fix: resolve email confirmation auto-login behavior and cast user_role enum"
git push origin main
```
