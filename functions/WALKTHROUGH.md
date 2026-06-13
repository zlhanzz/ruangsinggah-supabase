# WALKTHROUGH - Perbaikan Pemulihan Peran (Role Restoration) saat Unban & Login Error Visibilitas

Dokumen ini menjelaskan daftar perubahan, hasil pengujian, dan petunjuk deploy untuk perbaikan penanganan unban (pemulihan peran owner) serta visibilitas error login.

## 1. Daftar Perubahan

### Frontend (Admin Service)
- **Pembaruan Fungsi `unbanMitraRequest` (`adminService.ts`)**:
  - Saat melakukan unban pada user, sistem kini tidak hanya mengubah status verifikasi kembali ke `'unverified'`, melainkan juga mengembalikan peran (`role`) pengguna menjadi `'owner'`.
  - Ini memperbaiki bug di mana pemilik kost yang telah di-unban tetap bertindak sebagai peran `'user'` biasa di database, yang memicu penolakan *role mismatch* saat mereka mencoba login kembali ke portal Pemilik Kost.

### Frontend (Halaman Login)
- **Pembaruan Halaman Login (`Login.tsx`)**:
  - Menggunakan hook `useSearchParams` dari `react-router-dom` dan mendaftarkannya ke dalam dependency list `useEffect` agar error (seperti *role mismatch* atau akun diblokir) langsung terdeteksi tanpa perlu refresh halaman secara manual.
  - Menghapus popup browser native (`alert()`) yang mengganggu estetika pada login sukses (pengalihan langsung secara instan) dan menggantinya dengan inline banner hijau premium pada sukses update kata sandi.

---

## 2. Hasil Pengujian

- **Build Vite Frontend**:
  - Berhasil dikompilasi ke mode production (`npm run build`) dengan sukses tanpa error (Exit Code: 0).

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
3. Lakukan pengujian unban di Dashboard Admin pada tab **Akun Diblokir**, kemudian cobalah login menggunakan akun mitra yang baru di-unban tersebut pada portal Pemilik Kost. Akun akan dapat masuk kembali dengan sukses dan status verifikasinya ter-reset ke `'unverified'` (siap mengisi profil & KTP ulang).
