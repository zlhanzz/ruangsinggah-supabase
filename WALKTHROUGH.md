# WALKTHROUGH: Isolasi Lingkungan Penuh Portal Pemilik Kost (Role Isolation)

## 1. Ringkasan Pekerjaan
Telah berhasil diimplementasikan **Isolasi Lingkungan Penuh (Role Isolation)** bagi Pemilik Kost (Mitra) pada [`App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx), [`Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx), dan [`Navbar.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/Navbar.tsx):

1. **Otentikasi & Redirect Otomatis ke Dashboard Mitra**:
   - Menghapus logika pemaksaan role pemilik kost yang sebelumnya diturunkan menjadi `user` jika `portal_view` bernilai `'user'` di `fetchUserData()`.
   - Mengunci dan menyimpan `localStorage.setItem('portal_view', 'owner')` ketika akun pemilik kost terautentikasi.
   - Mengarahkan akun pemilik kost secara otomatis ke **`Page.DASHBOARD_MITRA` (`/dashboard-mitra`)** saat selesai login atau saat me-load aplikasi dari halaman user biasa.

2. **Penguncian & Proteksi Rute Publik (Route Locking)**:
   - Rute publik pencari kost:
     - Beranda (`/`)
     - Cari Kost (`/listings`, `/kost-dekat/:campusSlug`, `/kost-area/:areaSlug`)
     - Data Kost (`/products/*`)
     - Jadi Mitra (`/owner`)
     - Jasa Survey (`/survey-service`)
     - KostManager (`/kostmanager`)
   - Seluruh rute di atas secara otomatis me-redirect akun pemilik kost ke `Page.DASHBOARD_MITRA` jika pemilik mencoba membukanya saat sesi aktif.

3. **Isolasi Antarmuka Navigasi (`Navbar.tsx`)**:
   - **Klik Logo**: Mengarahkan pemilik kost ke `Page.DASHBOARD_MITRA` (bukan Beranda user).
   - **Desktop Nav Menu**: Menampilkan menu operasional mitra (*Dashboard Mitra*, *Chat Penyewa*, *Profil Mitra*).
   - **Desktop Profile Dropdown**: Menyajikan badge `Login Sebagai Mitra Kost`, *Dashboard Mitra*, *Chat Penyewa*, *Profil Mitra*, dan *Keluar*.
   - **Mobile Bottom Navigation Bar**: Menampilkan 3 tombol khusus (*Dashboard*, *Chat*, *Profil*) saat pemilik kost berada di luar dashboard mitra.

---

## 2. Rincian Perubahan Berkas

### [`App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx)
- Menghapus logika downgrade role pemilik `if (portalView === 'user' && role === 'owner') role = 'user'`.
- Menambahkan auto-redirect pemilik kost ke `Page.DASHBOARD_MITRA` pada `fetchUserData()`.
- Memasang `<Navigate to={Page.DASHBOARD_MITRA} replace />` pada seluruh rute pencari kost publik jika `user?.role === 'owner'`.

### [`Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx)
- Menambahkan penyimpanan `localStorage.setItem('portal_view', activeRole)` pada `handleLogin` dan `handleGoogleLogin`.

### [`Navbar.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/Navbar.tsx)
- Mengimpor ikon pure vector SVG `Building2` dan `Layers` dari `lucide-react`.
- Menyesuaikan `navItems`, `onClick` logo, label tombol panel, isi dropdown profil, dan navigasi bawah mobile khusus untuk pemilik kost (`isOwner`).

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
vite v6.4.1 building for production...
transforming...
✓ 2509 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 34.41s
Exit code: 0 (0 error)
```

---

## 4. Panduan Verifikasi Pengguna
1. Buka halaman **Login** (`/login`) dan pilih **Pemilik Kost**.
2. Lakukan login menggunakan akun Pemilik Kost (via Email atau Google OAuth):
   - Setelah login berhasil, perhatikan bahwa Anda **langsung mendarat di Portal Dashboard Mitra (`/dashboard-mitra`)**, bukan di Beranda pencari kost.
3. Coba ketik URL beranda (`/`) atau `/listings` di address bar browser:
   - Sistem secara otomatis mengunci dan me-redirect Anda kembali ke `/dashboard-mitra`.
4. Perhatikan navigasi Navbar:
   - Klik logo RuangSinggah di pojok kiri atas mengarahkan Anda ke Dashboard Mitra.
   - Menu atas dan dropdown profil menyajikan menu khusus mitra (*Dashboard Mitra*, *Chat Penyewa*, *Profil Mitra*).
   - Pada layar HP/mobile, bottom bar menyajikan menu mitra (*Dashboard*, *Chat*, *Profil*).
