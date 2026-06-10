# WALKTHROUGH - Hamburger Menu, Fitur Logout, Batasan Gerbang Login, & Penanganan Chunk Load Error

Dokumen ini menjelaskan detail perubahan untuk menambahkan tombol hamburger menu, memisahkan aksi Kembali ke Beranda dan Logout sesungguhnya di Dashboard Mitra, membatasi login gerbang unik, serta menangani error pemuatan file chunk otomatis.

## 1. Daftar Perubahan
1. **Pemicu Hamburger Menu (Garis 3) di Tampilan Seluler**:
   - Memodifikasi [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx).
   - Menambahkan elemen `<header className="lg:hidden ...">` di area konten utama untuk merender tombol hamburger garis 3 (ikon `Menu` dari `lucide-react`) saat diakses menggunakan resolusi HP/seluler.
   - Pemicu ini sukses membuka sidebar mobile overlay (`setMobileSidebarOpen(true)`).

2. **Pemberian Fungsi Logout Akun yang Sesungguhnya**:
   - Memodifikasi [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx) & [App.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx).
   - Menambahkan prop callback `onLogout` ke dalam properti `MitraDashboardProps` dan menyalurkannya dari fungsi `handleLogout` global di `App.tsx`.
   - Mengubah navigasi sidebar (baik sidebar desktop maupun mobile overlay) agar memiliki dua pilihan yang terpisah:
     - **Kembali ke Beranda** (ikon `Home`) - melakukan navigasi biasa ke halaman utama (`Page.HOME`).
     - **Keluar Akun** (ikon `LogOut` merah) - benar-benar mengakhiri sesi otentikasi di Supabase.

3. **Sinkronisasi Tab Login Portal & Normalisasi**:
   - Menyimpan pilihan tab login ke `localStorage` dengan key `portal_view` untuk memvalidasi gerbang masuk user vs mitra.
   - Memastikan normalisasi peran database lama (`'mitra'`) menjadi `'owner'` berjalan dengan benar sebelum validasi akses gerbang login.

4. **Penanganan Otomatis Chunk Load Error**:
   - Menambahkan listener global pada [index.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/index.tsx) untuk me-reload browser otomatis jika terjadi kegagalan modul dynamic import pasca deployment aset baru.

## 2. Hasil Pengujian & Verifikasi
1. **Kompilasi Frontend Sukses**:
   - Menjalankan `npm run build` di folder `functions/public` sukses tanpa error tipe data (`✓ built in 29.89s`).

## 3. Cara Deploy Perubahan Kode
Lakukan push commit ke repositori Git untuk mendeploy pembaruan frontend secara otomatis:
```bash
git add .
git commit -m "feat: add mobile hamburger menu and real logout to partner dashboard"
git push origin main
```
