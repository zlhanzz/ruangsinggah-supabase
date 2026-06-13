# IMPLEMENTATION PLAN - Integrasi Verifikasi Email untuk Upgrade Peran Pemilik Kost

Rencana ini dibuat untuk mengaktifkan kembali alur verifikasi email saat pengguna biasa (pencari kost) melakukan upgrade akun menjadi pemilik kost (owner/mitra), alih-alih langsung meloloskan login dan upgrade peran tanpa verifikasi.

## 1. Analisis Masalah
- **Penyebab Utama**: Tombol "Ya, Upgrade Sekarang" pada modal deteksi email terdaftar di `Login.tsx` saat ini langsung memicu fungsi `handleUpgradeToOwner` yang mengubah peran di database menggunakan password yang diinput, tanpa mengirimkan email verifikasi.
- **Dampak**: Tidak ada gerbang keamanan verifikasi kepemilikan email sebelum mengubah peran akun menjadi mitra/owner.
- **Solusi**: Mengaktifkan alur verifikasi email upgrade menggunakan Supabase Auth Magic Link (`type: 'magiclink'`). Ketika tautan di dalam email diklik, pengguna dialihkan kembali dengan parameter `?upgrade_to_owner=true` untuk diselesaikan secara otomatis oleh `App.tsx`.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/src/index.ts`: 
   - Memodifikasi Cloud Function `handleCustomAuthEmail` agar mendukung `type === 'magiclink'`.
   - Mengubah text email dan subjek email secara khusus untuk permintaan upgrade Pemilik Kost.
   - Mengambil dinamis parameter `redirectTo` dari request body agar kompatibel dengan localhost/produksi.
2. `functions/public/pages/Login.tsx`:
   - Memodifikasi `handleUpgradeToOwner` agar memicu pengiriman email magic link via Cloud Function dan menampilkan layar `upgradeEmailSent` (menghapus proses ubah role langsung).
   - Menambahkan definisi fungsi `handleResendUpgradeEmail` yang sebelumnya belum didefinisikan.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/src/index.ts` (`handleCustomAuthEmail`)**:
   - Memperbarui parameter `redirectTo` agar membaca `req.body.redirectTo`.
   - Menambahkan logika kondisional untuk mendeteksi `type === 'magiclink'` guna menyesuaikan `titleText`, `subTitleText`, `buttonText`, `footerText`, dan `subject`.
2. **Modifikasi `functions/public/pages/Login.tsx`**:
   - Memperbarui `handleUpgradeToOwner` agar melakukan fetch ke `handleCustomAuthEmail` dengan `type: 'magiclink'` dan `redirectTo: window.location.origin + Page.LOGIN + '?upgrade_to_owner=true'`.
   - Mendefinisikan fungsi `handleResendUpgradeEmail`.
3. **Deploy Firebase Functions**:
   - Dedeploy `handleCustomAuthEmail` ke Firebase.
4. **Verifikasi Build**:
   - Menjalankan build produksi untuk memastikan tidak ada kesalahan tipe TypeScript.

## 4. Rencana Verifikasi
- Mendaftar sebagai pemilik kost menggunakan email yang sudah terdaftar sebagai pencari kost.
- Klik tombol "Ya, Upgrade Sekarang" dan pastikan layar dialihkan ke "Verifikasi Email Upgrade Terkirim".
- Cek email dan klik link konfirmasi, pastikan akun berhasil diupgrade menjadi Pemilik Kost setelah link diklik.
