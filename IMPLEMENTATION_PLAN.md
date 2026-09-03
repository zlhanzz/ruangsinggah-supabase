# IMPLEMENTATION PLAN: Perbaikan Visibilitas Mobile Bottom Navigation Bar pada Halaman Orders / Kost Saya

## 1. Analisis Masalah & Kebutuhan
- **Masalah**:
  - Saat membuka menu **Orders / Kost Saya** (`/my-bookings`), Mobile Bottom Navigation Bar tidak muncul.
  - **Akar Masalah**: Pada `Navbar.tsx`, kondisi tampilan bottom navigation menggunakan pengecekan kaku `[Page.HOME, ...].includes(activePage)`. Ketika route diakses dengan sub-path, trailing slash, atau variasi URL router (`/my-bookings/*`), pengecekan kesamaan string menghasilkan `false`, sehingga bottom navbar disembunyikan.
- **Tujuan**:
  - Menampilkan Mobile Bottom Navigation Bar secara konsisten di seluruh halaman pengguna umum termasuk halaman **Orders** (`/my-bookings`), **Chat** (`/chat`), **Search** (`/listings`), **Profile** (`/profile`), dll.
  - Menambahkan padding bawah (`pb-28 sm:pb-12`) pada halaman `MyKost.tsx` agar konten kartu pesanan tidak tertutup bar navigasi.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**:
  1. `functions/public/components/Navbar.tsx` (Logika visibilitas dan status aktif per menu)
  2. `functions/public/pages/MyKost.tsx` (Penyesuaian padding bawah container)
- **Proteksi Logika**:
  - Bottom navbar tetap disembunyikan pada halaman dashboard internal (`/dashboard-admin`, `/dashboard-mitra`, `/dashboard-agent`).
  - Menjaga keutuhan seluruh state, hook, dan alur pembayaran/pembatalan booking di `MyKost.tsx`.

---

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Logika Visibilitas & Navigasi di `Navbar.tsx`**:
   - Ganti pengecekan kaku dengan pengecekan berbasis prefix:
     ```tsx
     const isDashboard = activePage.startsWith('/dashboard') || 
                         activePage.startsWith(Page.DASHBOARD_ADMIN) || 
                         activePage.startsWith(Page.DASHBOARD_MITRA) || 
                         activePage.startsWith(Page.DASHBOARD_AGENT) ||
                         activePage.startsWith(Page.DASHBOARD_OWNER);
     
     const isHomeActive = activePage === Page.HOME || activePage === '';
     const isSearchActive = activePage.startsWith(Page.LISTINGS) || 
                            activePage.startsWith('/kost-dekat') || 
                            activePage.startsWith('/kost-area') || 
                            activePage.startsWith(Page.PRODUCTS);
     const isChatActive = activePage.startsWith(Page.CHAT);
     const isOrdersActive = activePage.startsWith(Page.MY_BOOKINGS);
     const isProfileActive = activePage.startsWith(Page.PROFILE) || 
                             activePage.startsWith(Page.MITRA_PROFILE) || 
                             activePage.startsWith(Page.LOGIN);
     ```
   - Render bottom navbar jika `!hideBottomNav && !isDashboard`.
2. **Penyelarasan Padding Bawah di `MyKost.tsx`**:
   - Perbarui container utama `MyKost.tsx` menjadi `pb-28 sm:pb-12`.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
2. **Uji Tampilan & Navigasi di Halaman Orders**:
   - Membuka halaman `/my-bookings` pada mode mobile (375px - 430px).
   - Memastikan Mobile Bottom Navigation Bar muncul dengan menu **Orders** aktif (warna oranye), serta tombol navigasi lain dapat diklik dengan normal.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md`, memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
