# WALKTHROUGH - Batasan Gerbang Login Unik per Role (User vs Mitra)

Dokumen ini menjelaskan detail perubahan untuk membatasi akses login berdasarkan peran aktif (portal Pencari Kost vs Pemilik Kost) serta menguji bahwa kode frontend berhasil dikompilasi dengan baik.

## 1. Daftar Perubahan
1. **Sinkronisasi Tab Login Portal ke `localStorage`**:
   - Memodifikasi [Login.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx).
   - Menyimpan pilihan tab login (`activeRole` - `'user'` atau `'owner'`) ke `localStorage` dengan key `portal_view` secara dinamis.
   - Mencegah perubahan tab secara otomatis ketika form di-reset (`resetForm`).
   - Menambahkan deteksi dan tampilan pesan kesalahan `role_mismatch` apabila pengguna biasa mencoba mengakses portal mitra.

2. **Validasi Role & Override Tampilan di App Core**:
   - Memodifikasi [App.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx) di dalam fungsi `fetchUserData`.
   - Mengambil `portal_view` untuk divalidasi dengan peran aslinya di database:
     - Jika pengguna masuk ke portal Pemilik Kost (`portal_view === 'owner'`) namun peran aslinya adalah `user`, maka sesi otentikasi Supabase langsung dibatalkan (`signOut`) dan diarahkan kembali ke halaman login dengan pesan error parameter `role_mismatch`.
     - Jika pemilik kost masuk ke portal Pencari Kost (`portal_view === 'user'`) namun peran aslinya adalah `owner`, peran aslinya diabaikan secara visual di frontend dan ditimpa menjadi `user` (`role = 'user'`), menyembunyikan akses dashboard mitra dan menyajikan tampilan pencari kost biasa.
   - Menghapus nilai `portal_view` dari `localStorage` saat pengguna melakukan logout (`handleLogout`).

## 2. Hasil Pengujian & Verifikasi
1. **Kompilasi Frontend Sukses**:
   - Menjalankan `npm run build` di folder `functions/public` sukses tanpa error tipe data (`✓ built in 29.35s`).
   - Seluruh modul ter-bundle dengan sempurna ke folder `dist/`.

## 3. Cara Deploy Perubahan Kode
Karena perubahan ini sepenuhnya terjadi pada sisi frontend, Anda hanya perlu melakukan push commit ke repositori Git untuk memicu deployment otomatis (misalnya melalui Cloudflare Pages):
```bash
git add .
git commit -m "feat: enforce unique login gates for user and partner roles"
git push origin main
```
