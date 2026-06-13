# IMPLEMENTATION PLAN - Perbaikan Pemulihan Peran (Role Restoration) saat Akun Pemilik Kost di-Unban

Rencana ini dibuat untuk memperbaiki masalah di mana akun pemilik kost (mitra/owner) yang telah di-unban oleh admin tidak dapat masuk (login) kembali ke dashboard owner.

## 1. Analisis Masalah
- **Penyebab Utama**: Ketika admin melakukan blokir (ban) pada mitra melalui fungsi `banMitraRequest`, peran (`role`) pengguna di database diturunkan secara permanen menjadi `'user'`. Namun, ketika admin memulihkan akun tersebut menggunakan fungsi `unbanMitraRequest`, peran pengguna tidak diubah kembali menjadi `'owner'`.
- **Dampak**: Pengguna yang sudah di-unban tetap memiliki peran `'user'` di database, sehingga ketika mencoba login di portal Pemilik Kost, sistem mendeteksi ketidakcocokan peran (*role mismatch*) dan menolak akses login dengan me-redirect ke `/login?error=role_mismatch`.

## 2. Solusi & Dampak Perubahan
- **Solusi**: Memperbarui fungsi `unbanMitraRequest` di `adminService.ts` agar turut mengembalikan peran (`role`) pengguna menjadi `'owner'` saat proses unban diproses.
- **Dampak Perubahan**: Memulihkan otorisasi akses login pengguna ke portal Pemilik Kost secara instan setelah status ban mereka dicabut oleh admin.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `unbanMitraRequest` di `functions/public/adminService.ts`**:
   - Menambahkan kolom `role: 'owner'` pada objek update untuk tabel `users`.
2. **Verifikasi Build**:
   - Menjalankan build produksi untuk memastikan tidak ada kesalahan tipe TypeScript.

## 4. Rencana Verifikasi
- Memanggil fungsi unban pada salah satu akun mitra yang diblokir.
- Memeriksa di database (atau melakukan login) bahwa perannya kembali menjadi `'owner'` dan pengguna bisa masuk ke dashboard mitra dengan status verifikasi `'unverified'` (siap untuk mengajukan ulang verifikasi).
