# Walkthrough - Progres 310: Penyembunyian Header Navigation Khusus Landing Page KostManager

## Ringkasan Perubahan
Menyembunyikan komponen header navigation (`Navbar`) dan `Footer` utama aplikasi saat pengguna mengakses Landing Page KostManager (`/kostmanager` dan `/kost-manager`), sehingga halaman promosi dan pendaftaran KostManager tampil mandiri, bersih, dan langsung menyajikan tombol navigasi internal `← KEMBALI KE DASHBOARD MITRA`.

Sesuai permintaan penegasan, halaman menu "Jadi Mitra" umum bagi pengguna biasa (`/owner` / `/mitra`) serta seluruh rute halaman lainnya tetap menampilkan Header Navigation normal 100%.

---

## Daftar Perubahan File & Logika

### 1. `functions/public/App.tsx`
- **Konstanta `isKostManagerPage`**:
  ```typescript
  const isKostManagerPage = [
    Page.KOSTMANAGER,
    '/kost-manager',
    '/kostmanager'
  ].some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));
  ```
- **Kondisi Rendering `<Navbar />`**:
  - Mengubah kondisi render Navbar dari `{!isDashboardPage && (<Navbar ... />)}` menjadi `{!isDashboardPage && !isKostManagerPage && (<Navbar ... />)}`.
- **Kondisi Rendering `<Footer />`**:
  - Mengubah kondisi render Footer menjadi `{!isDashboardPage && !isKostManagerPage && (<Footer ... />)}`.
- **Keutuhan Halaman Lain**:
  - Rute menu "Jadi Mitra" bagi pengguna umum (`Page.OWNER` / `/owner`) memiliki `isKostManagerPage === false`, sehingga Header Navigation **tetap tampil normal**.

---

## Hasil Pengujian & Kompilasi

1. **Kompilasi Frontend Vite (`vite build`)**:
   - `functions/public/`: **Lulus 100% (✓ 2509 modules transformed, built in 41.34s, 0 error)**.

---

## Panduan Pengujian untuk Pengguna (User Testing)

1. **Uji Halaman KostManager**:
   - Buka `/kostmanager` atau klik tombol promo KostManager dari Dashboard Mitra.
   - **Hasil**: Header navigation putih di bagian atas tidak lagi muncul. Tampilan langsung menyajikan banner hero KostManager dengan tombol navigasi `← KEMBALI KE DASHBOARD MITRA`.
2. **Uji Menu Mitra Kost User ("Jadi Mitra")**:
   - Buka `/owner` (menu "Jadi Mitra" pada navbar pengguna umum).
   - **Hasil**: Header navigation (Navbar) **tetap muncul normal** dengan logo dan link navigasi pengguna.
3. **Uji Halaman Lain**:
   - Buka `/`, `/listings`, `/products`, `/chat`.
   - **Hasil**: Header navigation **tetap muncul normal** tanpa ada gangguan visual.
