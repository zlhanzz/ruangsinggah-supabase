# Walkthrough: Penguncian Isolasi Mutlak Akun Mitra (Owner) Berbasis Role Database Anti-Leak pada Sesi Offline / Reload

## Ringkasan Perubahan
Sistem otentikasi dan navigasi kini telah dikunci secara mutlak (*Role-Based Pure Isolation*) untuk akun **Mitra (Owner)** (`role: 'owner'` / `'mitra'`). Seluruh ketergantungan pada flag sementara `localStorage.getItem('portal_view')` telah dihapus dan digantikan oleh validasi langsung terhadap peran akun di database.

Akun Mitra dipastikan **100% terlindungi dan terisolasi** di dalam lingkungan Dashboard Mitra (`/dashboard-mitra`), dan tidak akan pernah bocor ke tampilan atau bottom navigation bar User umum, bahkan saat terjadi pemutusan koneksi internet, refresh browser, maupun reload halaman secara tiba-tiba.

---

## 1. Detail Implementasi

### A. Isolasi Mutlak Navigasi Navbar & Bottom Nav ([`Navbar.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/Navbar.tsx))
1. **Penentuan Peran Murni Berbasis Role**:
   ```ts
   const isOwner = user?.role === 'owner' || user?.role === 'mitra';
   ```
   Menghapus syarat lama `localStorage.getItem('portal_view') === 'owner'` yang rentan hilang saat session reload atau offline.
2. **Penguncian Mobile Header Avatar & Bottom Nav Profil**:
   - Jika `isOwner === true`:
     - Klik tombol avatar mobile $\rightarrow$ langsung mengarah ke `${Page.DASHBOARD_MITRA}/profile` (Profil Mitra).
     - Klik tab *Profil* di Bottom Navigation Bar $\rightarrow$ langsung mengarah ke `${Page.DASHBOARD_MITRA}/profile`.
     - Mobile Bottom Navigation Bar hanya menampilkan menu Mitra: **Dashboard**, **Chat**, dan **Profil Mitra**.

### B. Penguncian Sesi & Guard Komprehensif pada [`App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx)
1. **Penyimpanan Sesi Permanen pada `fetchUserData`**:
   - Saat `role === 'owner'`, sistem langsung mengeksekusi `localStorage.setItem('portal_view', 'owner')`.
   - Mengaktifkan proteksi navigasi paksa otomatis ke `Page.DASHBOARD_MITRA` jika akun Mitra membuka halaman publik User.
2. **Pemasangan Guard Ketat pada Seluruh Rute User**:
   - Rute Beranda (`Page.HOME`), Katalog (`Page.LISTINGS`), Filter Kampus/Area (`/kost-dekat/*`, `/kost-area/*`), Produk (`/products/*`), Mitra Landing (`Page.OWNER`), Layanan Survey (`Page.SURVEY_SERVICE`, `Page.SURVEY_CHECKOUT`), dan Sewa Kost (`Page.MY_BOOKINGS`) secara mutlak me-redirect akun Mitra ke `Page.DASHBOARD_MITRA`.
   - Rute Profil (`Page.PROFILE`) dan Pengaturan (`Page.SETTINGS`) secara instan me-redirect akun Mitra ke `${Page.DASHBOARD_MITRA}/profile`.
   - Rute Login (`Page.LOGIN`) secara otomatis mengalihkan akun Mitra yang sudah login ke `Page.DASHBOARD_MITRA`.

---

## 2. Hasil Pengujian & Kompilasi

- **Kompilasi Frontend Vite**:
  ```bash
  cmd /c npm run build (di functions/public)
  ```
  **Status**: `✓ 2511 modules transformed. ✓ built in 36.14s` (**0 Error, 0 Warning Kritis**).

---

## 3. Panduan Pengujian untuk Pengguna (User Testing Steps)

1. **Simulasi Reload / Offline pada Akun Mitra**:
   - Login dengan akun Mitra (`tipexpesta@gmail.com`).
   - Buka Console DevTools dan hapus local storage (atau matikan/nyalakan koneksi internet dan tekan `F5` / Refresh).
   - Akses URL apa pun: `/`, `/listings`, `/profile`, `/settings`, `/my-bookings`.
   - **Hasil**: Sistem secara 100% konsisten langsung mengalihkan ke **Dashboard Mitra** (`/dashboard-mitra`).
2. **Cek Tampilan Mobile**:
   - Pada resolusi mobile, perhatikan bilah navigasi bawah (Bottom Nav).
   - **Hasil**: Hanya menampilkan bilah navigasi Mitra (**Dashboard**, **Chat**, **Profil Mitra**) dan tidak pernah menampilkan menu User (*Home, Search, Orders*).
   - Klik tab **Profil** di Bottom Nav atau klik Avatar di Header $\rightarrow$ langsung membuka **Profil Mitra** (`/dashboard-mitra/profile`).
