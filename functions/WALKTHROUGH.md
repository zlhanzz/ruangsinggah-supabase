# WALKTHROUGH - Batasan Gerbang Login Unik per Role, Perbaikan Normalisasi Peran & Penanganan Chunk Load Error

Dokumen ini menjelaskan detail perubahan untuk membatasi akses login berdasarkan peran aktif (portal Pencari Kost vs Pemilik Kost), perbaikan alur normalisasi peran dari database, serta mekanisme otomatisasi refresh halaman saat terjadi kegagalan pemuatan file (chunk load error) pasca deploy baru.

## 1. Daftar Perubahan
1. **Sinkronisasi Tab Login Portal ke `localStorage`**:
   - Memodifikasi [Login.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx).
   - Menyimpan pilihan tab login (`activeRole` - `'user'` atau `'owner'`) ke `localStorage` dengan key `portal_view` secara dinamis.
   - Mencegah perubahan tab secara otomatis ketika form di-reset (`resetForm`).
   - Menambahkan deteksi dan tampilan pesan kesalahan `role_mismatch` apabila pengguna biasa mencoba mengakses portal mitra.

2. **Normalisasi Peran Database & Validasi Gerbang Login**:
   - Memodifikasi [App.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx) di dalam fungsi `fetchUserData`.
   - Mengembalikan pemetaan dan normalisasi peran (`role`) dari database (mengubah `'mitra'` / `'owner'` menjadi `'owner'`) secara eksplisit sebelum divalidasi.
   - Mengambil `portal_view` untuk divalidasi dengan peran yang sudah dinormalisasi:
     - Jika pengguna masuk ke portal Pemilik Kost (`portal_view === 'owner'`) namun peran aslinya bukan `'owner'` atau `'admin'`, maka sesi otentikasi Supabase langsung dibatalkan (`signOut`) dan diarahkan kembali ke halaman login dengan pesan error parameter `role_mismatch`.
     - Jika pemilik kost masuk ke portal Pencari Kost (`portal_view === 'user'`) namun peran aslinya adalah `'owner'`, perannya secara visual di frontend ditimpa menjadi `'user'`, menyembunyikan akses dashboard mitra dan menyajikan tampilan pencari kost biasa.
   - Menghapus nilai `portal_view` dari `localStorage` saat pengguna melakukan logout (`handleLogout`).

3. **Penanganan Otomatis Chunk Load Error**:
   - Memodifikasi [index.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/index.tsx).
   - Menambahkan event listener global (`error` dan `unhandledrejection`) untuk menangkap error pemuatan aset dinamis (seperti `Failed to fetch dynamically imported module` atau `ChunkLoadError`).
   - Apabila terdeteksi, sistem secara otomatis melakukan refresh halaman penuh (`window.location.reload()`) untuk mengambil berkas HTML dan file manifes manifest yang paling baru dari server tanpa perlu pengguna melakukan hard refresh secara manual.

## 2. Hasil Pengujian & Verifikasi
1. **Kompilasi Frontend Sukses**:
   - Menjalankan `npm run build` di folder `functions/public` sukses tanpa error tipe data (`✓ built in 32.85s`).

## 3. Cara Deploy Perubahan Kode
Lakukan push commit ke repositori Git untuk mendeploy pembaruan frontend secara otomatis:
```bash
git add .
git commit -m "fix: reload window on dynamic chunk load errors"
git push origin main
```
