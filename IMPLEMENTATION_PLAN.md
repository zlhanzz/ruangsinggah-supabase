# Rencana Implementasi: Akses Peninjauan Mode User untuk Admin & Penyempurnaan Navigasi

## 1. Analisis Masalah & Kebutuhan
- **Masalah**:
  - Saat ini, ketika Admin berada di Dashboard Admin (`/dashboard-admin`) dan mengklik tombol **`[👁️ LIHAT SEBAGAI USER]`** atau tombol **`[Mode User]`** di Navbar, rute `Page.HOME` (`/`) pada `App.tsx` secara otomatis memaksa redirect kembali:
    ```tsx
    user?.role === 'admin' ? <Navigate to={Page.DASHBOARD_ADMIN} replace />
    ```
  - Akibatnya, Admin ikut "terisolasi" dan tidak bisa membuka atau meninjau halaman Beranda/Home sebagai pengguna umum.
- **Kebutuhan**:
  - Role **`admin`** (dan `survey_agent`) harus dapat meninjau dan membuka tampilan Beranda (`Page.HOME`), Katalog Cari Kost, Detail Kost, Database Kost, dan Jasa Survey secara bebas.
  - Role **`owner`** (pemilik kost) tetap dipertahankan 100% terisolasi ke `Page.DASHBOARD_MITRA` sesuai kebutuhan privasi portal mitra.
  - Admin dapat berpindah antara **"Mode User"** (meninjau tampilan pengguna) dan **"Admin Panel"** kapan saja melalui tombol navigasi di Navbar dan tombol di sidebar Admin Dashboard.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/App.tsx` | Hapus redirect paksa `user?.role === 'admin'` pada rute `Page.HOME` (`/`). Hanya `user?.role === 'owner'` yang di-redirect ke Dashboard Mitra. |
| `functions/public/components/Navbar.tsx` | Pastikan klik pada Logo RuangSinggah mengarahkan Admin ke `Page.HOME` saat dalam mode peninjauan, dan tombol toggle `"Mode User"` / `"Admin Panel"` bekerja dua arah secara mulus. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Modifikasi Rute `Page.HOME` di `App.tsx`
- Ubah rute `Page.HOME` menjadi:
  ```tsx
  <Route path={Page.HOME} element={
    user?.role === 'owner' ? <Navigate to={Page.DASHBOARD_MITRA} replace /> :
    <Home onPageChange={(p: Page | string) => navigate(p)} onKostSelect={handleKostSelect} user={user} listings={listings} loading={loadingListings} />
  } />
  ```

### Langkah 2: Sempurnakan Klik Logo di `Navbar.tsx`
- Ubah `onClick` pada logo:
  ```tsx
  onClick={() => onPageChange(isOwner ? Page.DASHBOARD_MITRA : Page.HOME)}
  ```

### Langkah 3: Build & Validasi
- Jalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi dan sinkronisasi ke folder `dist` dan `public`.
- Commit ke `bukan-productions`, merge ke `main`, dan push ke GitHub `origin main`.

---

## 4. Rencana Verifikasi

1. **Uji Peninjauan Mode User sebagai Admin**:
   - Login sebagai Admin $\rightarrow$ Buka Dashboard Admin $\rightarrow$ Klik tombol **`[👁️ LIHAT SEBAGAI USER]`**.
   - **Hasil**: Halaman Beranda (`/`) terbuka sempurna tanpa terlempar kembali ke Admin Dashboard.
2. **Uji Kembali ke Admin Panel**:
   - Di Navbar saat di halaman user, klik tombol **`[ADMIN PANEL]`**.
   - **Hasil**: Halaman langsung kembali ke Dashboard Admin (`/dashboard-admin`).
3. **Uji Isolasi Pemilik Kost (Owner)**:
   - Login sebagai Pemilik Kost $\rightarrow$ Buka `/` $\rightarrow$ Tetap otomatis diarahkan ke `/dashboard-mitra` (isolasi mitra tetap utuh 100%).
