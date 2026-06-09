# WALKTHROUGH - Kustomisasi Template Email Autentikasi RuangSinggah.id

Dokumen ini menjelaskan detail perubahan untuk memperindah dan memprofesionalkan template email verifikasi pendaftaran akun dan reset kata sandi dengan layout HTML premium, grafis logo, dan tombol CTA.

## 1. Daftar Perubahan
1. **Desain Ulang HTML Email Template**:
   - Memodifikasi fungsi `handleCustomAuthEmail` pada `functions/src/index.ts`.
   - Mengganti teks polos (`plain text`) menjadi layout HTML premium yang responsif dengan skema warna oranye khas RuangSinggah.id (`#f97316`).
   - Menyematkan logo resmi RuangSinggah.id yang mengarah ke `https://ruangsinggah.id/logo.png`.
   - Menambahkan tombol Call-to-Action (CTA) berdesain modern dan berbayang untuk mempermudah pengguna melakukan konfirmasi/reset.
   - Menambahkan kotak fallback URL jika tombol tidak dapat dimuat di aplikasi email tertentu.
   - Menambahkan footer profesional dengan hak cipta dan deskripsi layanan.

2. **Pembersihan Data Mismatch (Resolusi Kendala `tipexpesta@gmail.com`)**:
   - Ditemukan adanya data yatim (orphaned record) dengan email `tipexpesta@gmail.com` pada tabel `public.users` (dari ID lama yang sudah dihapus dari sistem auth).
   - Data yatim tersebut telah dibersihkan agar tidak terjadi bentrokan unique constraint (`users_email_key`) saat registrasi baru.
   - Akun `tipexpesta@gmail.com` sekarang sudah berhasil dikonfirmasi secara manual dan dapat langsung digunakan untuk masuk.

## 2. Hasil Pengujian & Verifikasi Lokal
1. **Build & Kompilasi Sukses**:
   - Proses kompilasi kode Cloud Functions telah divalidasi dan berhasil terkompilasi tanpa error menggunakan perintah:
     ```bash
     npm run build (melalui cmd.exe)
     ```
     Output: `tsc` berhasil tanpa pesan kesalahan.

## 3. Cara Deploy Perubahan Kode
Jalankan perintah berikut untuk mendeploy pembaruan Cloud Functions ke Firebase:
```bash
firebase deploy --only functions
```
Atau jalankan git push jika repositori Anda terhubung dengan alur CI/CD:
```bash
git add .
git commit -m "feat: enhance auth email templates with custom HTML and button"
git push origin main
```
