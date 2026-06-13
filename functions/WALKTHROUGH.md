# WALKTHROUGH - Integrasi Verifikasi Email untuk Upgrade Peran Pemilik Kost & Perbaikan UI

Dokumen ini menjelaskan rincian perubahan, pengujian, dan instruksi deploy untuk implementasi gerbang verifikasi email saat upgrade peran ke Pemilik Kost.

## 1. Daftar Perubahan

### Backend (Cloud Functions)
- **Modifikasi `handleCustomAuthEmail` (`functions/src/index.ts`)**:
  - Mendukung `type === 'magiclink'` untuk generate auth link khusus upgrade.
  - Menyesuaikan visual dan copy email Brevo HTML: Judul, Subjudul, subjek, serta tombol CTA khusus untuk konfirmasi upgrade.
  - Membaca properti `redirectTo` secara dinamis dari payload request, sehingga alur redirect berfungsi dengan andal baik di localhost maupun di server produksi.

### Frontend
- **Pembaruan Alur Upgrade (`Login.tsx`)**:
  - Mengubah `handleUpgradeToOwner` agar tidak langsung memperbarui database secara sepihak. Fungsi kini melakukan validasi sandi, melakukan sign out, lalu mengirimkan email konfirmasi upgrade (magic link) via Cloud Function. Setelah itu, antarmuka dialihkan ke layar visual "Verifikasi Email Upgrade Terkirim" dengan penunjuk status yang jelas.
  - Mengimplementasikan fungsi `handleResendUpgradeEmail` yang sebelumnya belum didefinisikan untuk mengirim ulang email verifikasi upgrade jika pengguna belum menerimanya.

---

## 2. Hasil Pengujian

- **Kompilasi Firebase Functions**: Berhasil dideploy secara utuh ke Firebase.
- **Build Vite Frontend**: Berhasil dikompilasi ke mode production (`npm run build`) dengan sukses tanpa error (Exit Code: 0).

---

## 3. Petunjuk Deploy Bagi User

1. Masuk ke folder frontend (`functions/public`):
   ```bash
   cd functions/public
   ```
2. Jalankan aplikasi local development untuk memverifikasi fungsionalitas:
   ```bash
   npm run dev
   ```
3. Lakukan pendaftaran dengan email pencari kost yang sudah terdaftar pada portal Pemilik Kost. Klik **Ya, Upgrade Sekarang**, masukkan password, dan pastikan sistem mengirimkan email konfirmasi. Klik link di kotak masuk email Anda untuk menyelesaikan proses upgrade peran secara aman.
