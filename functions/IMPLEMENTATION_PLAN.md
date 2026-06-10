# IMPLEMENTATION PLAN - Batasan Gerbang Login Unik per Role (User vs Mitra)

Rencana ini dibuat untuk menerapkan batasan masuk (login) yang unik untuk setiap peran (role) sesuai dengan dokumen `FOKUS_PENGEMBANGAN.md`. User biasa tidak diperbolehkan masuk ke portal mitra (Pemilik Kost), sedangkan mitra (Pemilik Kost) diperbolehkan masuk ke portal user (Pencari Kost) namun dengan tampilan dan hak akses user biasa.

## 1. Analisis Masalah
- **Masalah**: Saat ini, pemilik akun dengan peran `user` (Pencari Kost) bisa saja masuk lewat tab Pemilik Kost di halaman login dan diarahkan ke halaman/fungsi internal pemilik kost. Sebaliknya, Pemilik Kost (role `owner`/`mitra`) yang masuk lewat gerbang Pencari Kost langsung dialihkan ke dashboard mitra mereka, bukannya disajikan tampilan pencari kost biasa.
- **Solusi**:
  1. Sinkronkan tab portal aktif yang dipilih (`activeRole`: `'user'` atau `'owner'`) ke dalam `localStorage` (`portal_view`).
  2. Saat otentikasi berhasil (di `fetchUserData` pada `App.tsx`):
     - Jika `portal_view === 'owner'` (portal Pemilik Kost) namun peran database aslinya adalah `user` (atau bukan `owner` dan bukan `admin`), batalkan sesi login (`signOut`) dan arahkan kembali ke halaman login dengan query parameter `?error=role_mismatch`.
     - Jika `portal_view === 'user'` (portal Pencari Kost) namun peran database aslinya adalah `owner`, ubah perannya di runtime frontend menjadi `user`. Hal ini membuat mitra dapat menggunakan platform sebagai penyewa kost biasa dengan visual/fitur pencari kost biasa tanpa akses ke dashboard mitra.
  3. Bersihkan status portal pada saat pengguna melakukan Logout.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/pages/Login.tsx`:
   - Sinkronisasi `activeRole` ke `localStorage` dengan key `portal_view` saat inisialisasi dan setiap kali tab berubah.
   - Penambahan deteksi parameter URL `?error=role_mismatch` untuk menampilkan pesan kesalahan yang ramah kepada pengguna.
2. `functions/public/App.tsx`:
   - Modifikasi `fetchUserData` untuk memeriksa `portal_view` dari `localStorage`.
   - Implementasi logika pemutusan sesi (`signOut`) jika terjadi pelanggaran role (user mencoba masuk portal owner).
   - Implementasi logika penurunan peran runtime (`role = 'user'`) jika owner masuk lewat portal user.
   - Penghapusan `portal_view` dari `localStorage` saat fungsi `handleLogout` dipanggil.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/public/pages/Login.tsx`**:
   - Di hook inisialisasi tab, set default `activeRole` berdasarkan nilai yang ada di `localStorage.getItem('portal_view')` jika ada.
   - Tambahkan `useEffect` untuk memperbarui `localStorage` saat `activeRole` berubah.
   - Di hook `useEffect` pendeteksi URL parameter, tambahkan penanganan `error === 'role_mismatch'`.
2. **Modifikasi `functions/public/App.tsx`**:
   - Di awal `fetchUserData` setelah peran ditentukan, tambahkan pemeriksaan `portal_view`.
   - Jika `portalView === 'owner'` dan `role !== 'owner' && role !== 'admin'`, panggil `signOut()` dan navigasikan ke `/login?error=role_mismatch`.
   - Jika `portalView === 'user'` dan `role === 'owner'`, override nilai `role` menjadi `'user'` di dalam objek `safeUser`.
   - Di dalam fungsi `handleLogout`, tambahkan `localStorage.removeItem('portal_view')`.
3. **Kompilasi & Pengujian Frontend**:
   - Jalankan `npm run build` di folder `functions/public` untuk memastikan kode terkompilasi dengan sempurna.

## 4. Rencana Verifikasi
- **Skenario 1: User Biasa masuk ke Portal Mitra**:
  - Di halaman login, pilih tab "Pemilik Kost".
  - Masukkan kredensial akun Pencari Kost biasa.
  - Verifikasi bahwa sistem otomatis me-logout akun tersebut dan menampilkan pesan kesalahan: "Akun Anda tidak terdaftar sebagai Pemilik Kost. Silakan login sebagai Pencari Kost."
- **Skenario 2: Pemilik Kost masuk ke Portal User**:
  - Di halaman login, pilih tab "Pencari Kost".
  - Masukkan kredensial akun Pemilik Kost (Mitra).
  - Verifikasi bahwa login berhasil, pengguna diarahkan ke Halaman Beranda (`Page.HOME`), menu dashboard mitra tidak muncul di Navbar, dan pengguna tidak dapat mengakses `/dashboard-mitra`.
