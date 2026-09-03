# Rencana Implementasi: Layout Login Presisi Tengah & Pembersihan Redundansi Top Navbar

## 1. Analisis Masalah & Kebutuhan
- **Masalah dari Tangkapan Layar & Feedback Pengguna**:
  - Pada halaman `/login`, top navbar website (`RuangSinggah.id Masuk [Daftar]`) masih tampil di bagian atas. Hal ini menimbulkan:
    1. **Redundansi Visual**: Pengguna sudah berada di halaman Masuk/Daftar, sehingga tombol "Masuk" dan "Daftar" di header atas menjadi tidak perlu dan membingungkan.
    2. **Layout Kurang Presisi ke Tengah**: Adanya top header setinggi 80px mendorong card login ke bawah sehingga tidak presisi berada di tengah layar (*vertical center*).
- **Kebutuhan Pengguna**:
  - Sembunyikan top navbar (`<nav>`) khusus ketika pengguna berada di halaman login/register (`Page.LOGIN` / `/login`).
  - Pertahankan bottom navigation bar di mobile (`Home, Search, Chat, Orders, Profile`) agar pengguna tetap dapat berpindah menu dengan mudah.
  - Buat container halaman login menggunakan kalkulasi tinggi yang presisi (`min-h-[calc(100vh-4.5rem)] md:min-h-screen`) sehingga card pemilihan peran dan form login **100% presisi berada di tengah layar secara vertikal dan horizontal** persis seperti yang dilampirkan pengguna.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/components/Navbar.tsx` | Menambahkan kondisi pada top `<nav>` agar disembunyikan saat `activePage` adalah `/login` (`Page.LOGIN`). Mobile bottom nav tetap aktif. |
| `functions/public/pages/Login.tsx` | Menyesuaikan min-height container (`min-h-[calc(100vh-4.5rem)] md:min-h-screen`) dan padding agar card berada tepat di tengah layar (*perfect center*) baik di HP maupun PC. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Modifikasi Top Navbar di `Navbar.tsx`
- Tambahkan pengecekan rute login pada rendering top navbar:
  ```tsx
  {!activePage.startsWith('/login') && activePage !== Page.LOGIN && (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      ...
    </nav>
  )}
  ```

### Langkah 2: Sempurnakan Center Alignment di `Login.tsx`
- Perbarui wrapper layout utama agar presisi di tengah layar:
  ```tsx
  <div className="min-h-[calc(100vh-4.5rem)] md:min-h-screen bg-gradient-to-b from-gray-50 via-white to-orange-50/20 flex items-center justify-center p-4 sm:p-6">
  ```

### Langkah 3: Build & Validasi
- Jalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi dan sinkronisasi ke folder `dist` dan `public`.
- Commit ke `bukan-productions`, merge ke `main`, dan push ke GitHub `origin main`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan Halaman Login di HP & PC**:
   - Buka `/login` $\rightarrow$ Top navbar `RuangSinggah.id Masuk [Daftar]` bersih tidak muncul.
   - Card pilihan peran berada tepat di tengah layar secara vertikal & horizontal (*perfect center*).
   - Bottom navigation di HP tetap muncul rapi di bagian bawah.
