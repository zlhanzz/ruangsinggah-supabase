# IMPLEMENTATION PLAN: Isolasi Lingkungan Penuh Portal Pemilik Kost (Role Isolation)

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Saat login sebagai Pemilik Kost (baik melalui email/kata sandi maupun Google OAuth), mitra seringkali mendarat atau tembus ke tampilan Beranda pencari kost (`Page.HOME` / `/`).
  - Mitra harus membuka profil terlebih dahulu untuk dapat mengakses Dashboard Mitra.
  - Hal ini terjadi karena:
    1. Di `App.tsx` (`fetchUserData()`), terdapat logika yang memaksakan role pemilik diturunkan menjadi `user` (`if (portalView === 'user' && role === 'owner') role = 'user'`).
    2. Logika redirect saat login hanya aktif jika URL saat itu tepat di `/login`, sehingga redirect Google OAuth ke `window.location.origin` (`/`) atau reload halaman di `/` tetap merender antarmuka pencari kost.
    3. Navigasi desktop & bottom bar mobile di `Navbar.tsx` masih menampilkan menu pencari kost (*Cari Kost*, *Data Kost*, *Jasa Survey*, *Orders*) alih-alih navigasi operasional mitra kost.
- **Tujuan Pengembangan**:
  - Mewujudkan **Isolasi Lingkungan Penuh (Role Isolation)** bagi Pemilik Kost:
    1. Ketika login sebagai Pemilik Kost atau ketika akun terdeteksi memiliki role `owner`/`mitra`, sistem **secara instan dan otomatis mengarahkan mitra ke `Page.DASHBOARD_MITRA` (`/dashboard-mitra`)**.
    2. Rute pencari kost publik (Beranda `/`, `/listings`, `/products`, `/kostmanager`, dll.) langsung di-redirect ke `Page.DASHBOARD_MITRA` jika diakses oleh pemilik kost yang sedang login.
    3. `Navbar.tsx` menyesuaikan navigasi desktop dan mobile khusus untuk lingkungan pemilik kost (Dashboard, Kelola Kost, Chat Penyewa, Profil Mitra, Logout) dan klik logo mengarah ke Dashboard Mitra.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/App.tsx`:
    - Menghapus paksaan downgrade role pemilik di `fetchUserData()`.
    - Menambahkan auto-redirect rute publik (`/`, `/listings`, `/products`, `/owner`, `/kostmanager`, `/survey-service`) ke `Page.DASHBOARD_MITRA` jika `user?.role === 'owner'`.
    - Memastikan redirect Google OAuth dan sesi mount langsung masuk ke `/dashboard-mitra`.
  - `functions/public/pages/Login.tsx`:
    - Memastikan pilihan `Pemilik Kost` menyimpan `portal_view = 'owner'` dan mengarahkan pengguna langsung ke `Page.DASHBOARD_MITRA` setelah autentikasi berhasil.
  - `functions/public/components/Navbar.tsx`:
    - Mengisolasi navigasi khusus pemilik kost: Logo menuju `Page.DASHBOARD_MITRA`, menu desktop & mobile bottom nav menampilkan link operasional mitra (Dashboard, Kelola Kost, Chat, Profil Mitra).

---

## 3. Langkah-Langkah Eksekusi
1. **Perbaikan Otentikasi & State Role di `App.tsx`**:
   - Menghapus logika `if (portalView === 'user' && role === 'owner') role = 'user'`.
   - Mengupdate sinkronisasi `localStorage.setItem('portal_view', 'owner')` saat akun pemilik kost berhasil diverifikasi.
   - Menambahkan guard redirect di `fetchUserData()`: jika role adalah `owner` dan lokasi saat ini adalah `/login`, `/`, atau rute publik user, langsung navigate ke `Page.DASHBOARD_MITRA`.
2. **Proteksi & Isolasi Rute di `<Routes>` (`App.tsx`)**:
   - Memasang perlindungan pada `<Route path={Page.HOME} ... />` dan rute publik lainnya agar me-redirect akun `owner` ke `Page.DASHBOARD_MITRA`.
3. **Penyelarasan Navigasi di `Navbar.tsx`**:
   - Memperbarui desktop nav items saat `user?.role === 'owner'` (Dashboard Mitra, Kelola Kost, Chat, Profil Mitra).
   - Memperbarui bottom navigation mobile saat `user?.role === 'owner'` (Dashboard, Kelola Kost, Chat, Profil).
   - Memastikan logo RuangSinggah di navbar mengarahkan pemilik ke `Page.DASHBOARD_MITRA`.
4. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
5. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 304 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Melakukan login sebagai akun Pemilik Kost (`owner`):
  - Memverifikasi setelah klik masuk / login Google, pengguna langsung diarahkan ke `/dashboard-mitra` (Dashboard Pemilik Kost) tanpa mendarat di beranda user.
  - Memverifikasi jika pemilik kost mengetik rute `/`, `/listings`, atau `/products`, sistem otomatis mengunci dan mengarahkannya kembali ke `/dashboard-mitra`.
  - Memverifikasi tampilan navbar desktop dan bottom bar mobile menyajikan menu khusus pemilik kost.
