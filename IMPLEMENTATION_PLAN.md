# IMPLEMENTATION PLAN: Perbaikan Navigasi Tombol Promo KostManager (/kost-manager vs /kostmanager)

## 1. Analisis Masalah & Akar Penyebab (Root Cause Analysis)
- **Akar Masalah**:
  - Pada popup promo KostManager (`MitraDashboard.tsx`), tombol *"Pelajari Sekarang ↗"* mengambil nilai URL dari `promoPopupSetting.link_url`.
  - Di dalam `adminService.ts` dan database `app_settings`, nilai default `link_url` adalah `'/kost-manager'` (menggunakan tanda hubung / hyphen).
  - Sementara itu, di `App.tsx` dan `types.ts`, rute landing page terdaftar sebagai `Page.KOSTMANAGER = '/kostmanager'` (tanpa tanda hubung).
  - Ketika pemilik kost mengklik tombol *"Pelajari Sekarang ↗"*, router mencoba memuat `'/kost-manager'` yang tidak cocok dengan rute manapun $\rightarrow$ memicu rute fallback `*` ke `Page.HOME` (`/`) $\rightarrow$ terpicu pengaman isolasi role yang me-redirect kembali ke `Page.DASHBOARD_MITRA` (`/dashboard-mitra`).
  - Akibatnya, popup tertutup dan pengguna terlihat seolah-olah "tidak bisa membuka landing page".

- **Tujuan Perbaikan**:
  - Menyelaraskan seluruh rute dan navigasi KostManager: mendukung format `'/kostmanager'` dan alias `'/kost-manager'`.
  - Membuat fungsi handler `handlePromoNavigate` di `MitraDashboard.tsx` yang secara otomatis menormalkan `'/kost-manager'` menjadi `Page.KOSTMANAGER`.
  - Menambahkan alias rute `<Route path="/kost-manager" element={<Navigate to={Page.KOSTMANAGER} replace />} />` di `App.tsx` sebagai jaring pengaman URL legacy.
  - Memperbarui `DEFAULT_MITRA_PROMO_POPUP` di `adminService.ts` dan `BannerManagement.tsx` menjadi `'/kostmanager'`.

---

## 2. Dampak Perubahan
- **Berkas yang Dimodifikasi**:
  1. `functions/public/App.tsx`:
     - Menambahkan alias route: `<Route path="/kost-manager" element={<Navigate to={Page.KOSTMANAGER} replace />} />`.
  2. `functions/public/pages/MitraDashboard.tsx`:
     - Membuat fungsi handler khusus `handlePromoNavigate` untuk menormalisasi URL internal sebelum eksekusi navigasi.
     - Menerapkan `handlePromoNavigate` pada banner gambar dan kedua tombol aksi popup promo.
  3. `functions/public/adminService.ts`:
     - Mengubah default `link_url` dari `'/kost-manager'` menjadi `'/kostmanager'` di `DEFAULT_MITRA_PROMO_POPUP`.
  4. `functions/public/components/admin/BannerManagement.tsx`:
     - Menyesuaikan petunjuk dan placeholder default URL `link_url` menjadi `'/kostmanager'`.

---

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Rute di `App.tsx`**:
   - Menambahkan redirect route `/kost-manager` ke `Page.KOSTMANAGER`.
2. **Penyempurnaan Handler di `MitraDashboard.tsx`**:
   - Menambahkan fungsi `handlePromoNavigate(url?: string)` untuk menangani URL external (`http...`) maupun internal secara aman.
3. **Penyelarasan Nilai Default di `adminService.ts` & `BannerManagement.tsx`**:
   - Mengubah `link_url` default menjadi `'/kostmanager'`.
4. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
5. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 306 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka modal popup promo KostManager di Dashboard Mitra.
- Mengklik tombol **"Pelajari Sekarang ↗"** $\rightarrow$ Halaman `KostManagerLanding` (`/kostmanager`) langsung terbuka.
- Mengklik banner gambar pada popup promo $\rightarrow$ Landing page KostManager langsung terbuka.
- Mencoba mengetik URL manual `http://localhost:5173/kost-manager` di browser $\rightarrow$ Auto-redirect ke `/kostmanager` tanpa mental ke dashboard.
