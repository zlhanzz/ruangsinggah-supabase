# Walkthrough: Verifikasi Identitas Kilat & Otomatis (Instant Auto-ACC) Berbasis AI KTP & WhatsApp OTP

Dokumen ini mencatat implementasi sistem verifikasi identitas kilat dan otomatis (*Instant Auto-ACC*) untuk pemilik kost (mitra) di RuangSinggah, sehingga mitra baru dapat langsung mempublikasikan listing kamar kost seketika tanpa harus menunggu persetujuan manual admin (1x24 jam).

---

## 1. Ringkasan Perubahan

### A. Validasi Kilat & Otomatis di `MitraProfile.tsx`
- **Sebelumnya**: Pengunggahan KTP dan nomor WhatsApp selalu menetapkan `verification_status = 'pending'`, lalu mengunci seluruh akses profil dan formulir identitas sementara menunggu kurasi manual admin di dashboard admin.
- **Sesudahnya**:
  - Pada fungsi `handleSave`, sistem mengevaluasi kriteria kelayakan otomatis:
    1. `isWaVerified`: Nomor WhatsApp wajib telah diverifikasi via kode OTP 6-digit (`waOtpVerified` atau `whatsapp_verified`).
    2. `isNikValid`: NIK KTP wajib terdiri dari tepat 16 digit angka (`/^\d{16}$/`).
    3. `isNameValid`: Nama lengkap sesuai KTP terisi minimal 3 karakter.
    4. `isKtpPhotoReady`: Foto KTP fisik asli telah diunggah dan terdeteksi.
  - **Auto-ACC**: Apabila 4 kriteria terpenuhi:
    - Status langsung ditetapkan sebagai `'verified'`.
    - Catatan verifikasi: `'Terverifikasi Otomatis (Validasi AI KTP & WhatsApp OTP)'`.
    - Tabel `user_verifications` dan tabel `users` diperbarui secara real-time di Supabase.
    - Event `RS_USER_UPDATED` dipancarkan seketika untuk menyinkronkan seluruh state UI di dashboard mitra tanpa reload halaman.
  - Notifikasi email audit tetap dikirimkan ke admin (`notifyAdminIdentityVerification`) untuk pengawasan latar belakang (*background audit*).

### B. Pelepasan Lockout Status Pending & Tombol Verifikasi Instan
- Akun yang sebelumnya berada di status `pending`:
  - Tidak lagi dikunci paksa (`useEffect` reset `isEditing` dihapus).
  - Tombol **Data Kontak Pribadi** dan menu **Informasi Pribadi** kini dapat dibuka untuk meninjau data.
  - Banner status `pending` di `MitraProfile.tsx` dan `MitraDashboard.tsx` kini dilengkapi tombol **"Periksa / Verifikasi Instan"**.
  - Tombol simpan di Langkah 2 (KTP) diperbarui menjadi **"SIMPAN & VERIFIKASI INSTAN"**.

### C. Pembukaan Akses Tambah / Publikasi Listing Kost Seketika
- Begitu verifikasi instan sukses (`isVerified === true`), seluruh blokir di `MitraDashboard.tsx` terbuka seketika:
  - Tombol **Tambah Properti / Kamar** langsung aktif.
  - Opsi publikasi listing langsung dapat digunakan tanpa hambatan.

---

## 2. Hasil Verifikasi Kompilasi (Build Test)

Uji kompilasi frontend Vite dijalankan dengan `cmd.exe /c npm run build`:
```bash
cmd.exe /c npm run build
```

**Output Log**:
```
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.92 kB │ gzip:   2.29 kB
../../public/assets/index-b4n6kHuq.css                 299.59 kB │ gzip:  35.95 kB
../../public/assets/MitraDashboard-Beqh5J34.js         427.99 kB │ gzip:  93.37 kB
✓ built in 33.41s
```
*Hasil*: **0 Error Kompilasi, Lulus 100%**.

---

## 3. Panduan Pengujian bagi Pengguna (User Testing)

1. **Uji Pengguna Baru (Unverified)**:
   - Masuk ke dashboard mitra dengan akun baru atau akun belum terverifikasi.
   - Buka menu **Profil** -> klik **Informasi Pribadi** (atau klik tombol **Verifikasi Sekarang** di banner overview).
   - Masukkan nomor WhatsApp dan lakukan verifikasi OTP 6-digit.
   - Lanjutkan ke Langkah 2: Unggah foto KTP dan periksa NIK (16 digit) serta nama lengkap.
   - Klik tombol **"SIMPAN & VERIFIKASI INSTAN"**.
   - Sistem akan langsung menampilkan alert:
     > *"🎉 Selamat! Identitas Anda berhasil diverifikasi secara instan oleh sistem. Akun mitra Anda kini aktif penuh dan dapat langsung menambah serta mempublikasikan unit kost!"*
   - Status di pojok kanan profil seketika berubah menjadi **Terverifikasi ✓** (hijau).
   - Kembali ke menu **Listing / Kamar Saya** -> Tombol **Tambah Properti** dapat langsung diklik dan listing dapat dipublikasikan tanpa menunggu admin.

2. **Uji Pengguna Status Pending Sebelumnya**:
   - Buka profil mitra dengan akun yang berstatus `pending`.
   - Di kartu banner atas, klik tombol **"Periksa / Verifikasi Instan"**.
   - Halaman akan langsung membuka formulir identitas KTP (Langkah 2).
   - Pastikan nomor WhatsApp sudah terverifikasi OTP dan NIK 16 digit, lalu klik **"SIMPAN & VERIFIKASI INSTAN"**.
   - Akun akan langsung terverifikasi instan tanpa perlu menunggu admin manual.
