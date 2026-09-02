# WALKTHROUGH: Modernisasi UI/UX Beranda (Home) & Bottom Navigation Bar Mobile dengan Desain Google Stitch

## 1. Ringkasan Pekerjaan
Telah berhasil dilakukan modernisasi dan penyegaran tampilan antarmuka (UI/UX) pada **Halaman Beranda (Home)** dan **Bottom Navigation Bar Mobile** menggunakan kerangka dan token styling **Google Stitch**. Seluruh konten riil (logo RuangSinggah.id, data listing Supabase, filter pencarian, dan sistem autentikasi) tetap dipertahankan 100% utuh dan berfungsi normal.

---

## 2. Rincian Perubahan Komponen & File

### A. `functions/public/index.css`
- Mengintegrasikan CSS design tokens Google Stitch (`--primary`, `--primary-container: #ff7a00`, `--background: #f8f9ff`, `--tertiary: #6d3bd7`, dsb.).
- Menyediakan utility classes tipografi (`.text-headline-md`, `.text-headline-lg`, `.text-body-md`, `.text-label-bold`, dsb.).

### B. `functions/public/components/Navbar.tsx`
- **Desktop Navbar**:
  - Tautan navigasi: `Cari Kost`, `Data Kost`, `Jasa Survey`, `Jadi Mitra` dengan garis oranye penanda aktif.
  - Tombol Masuk / Daftar pill oranye `#ff7a00` yang modern.
- **Mobile Bottom Navigation Bar (4 Menu)**:
  1. 🏠 **Home** (`Page.HOME`)
  2. 🔍 **Search** (`Page.LISTINGS`)
  3. 📄 **Orders** (`Page.MY_BOOKINGS`)
  4. 👤 **Profile** (`Page.PROFILE` / `Page.LOGIN`)
  - 100% menggunakan SVG bundled lokal `lucide-react` (Bebas FOUT).

### C. `functions/public/pages/Home.tsx`
- **Desktop Search Bar**: Floating horizontal pill bar dengan 4 segmen (Lokasi/Nama, Kota, Kampus, Jenis Kost) dan tombol cari bulat gelap.
- **Mobile Search Bar**: Compact pill trigger dengan label *"CARI KOST SEKARANG"* dan tombol *"FILTER"* untuk membuka `FilterDrawer`.
- **Rekomendasi Utama**: Section header dengan aksen oranye `— REKOMENDASI UTAMA`, judul `KOST PILIHAN HARI INI`, dan tombol `LIHAT SEMUA >`.

### D. `functions/public/components/QuickActionMenu.tsx`
- Header: `• Menu Utama & Fitur` dengan dot oranye.
- 4 Kartu Aksi Cepat dengan warna pastel elegan: Cari Kost (oranye), Data Kost (biru), Jasa Survey (hijau), Jadi Mitra (ungu).

### E. `functions/public/components/KostCard.tsx`
- Kartu listing rounded-3xl yang clean dengan badge kategori, badge verified oranye, bintang rating, icon lokasi MapPin, dan tombol `DETAIL` hitam elegan.

---

## 3. Hasil Pengujian & Kompilasi

- **Uji Kompilasi TypeScript / Vite**:
  ```bash
  cmd /c npm run build
  ```
  **Hasil:**
  ```text
  ✓ 2504 modules transformed.
  ✓ built in 1m 10s
  Exit code: 0 (0 error)
  ```

---

## 4. Panduan Pengujian untuk Pengguna

1. **Uji Tampilan Desktop (PC)**:
   - Buka `localhost:5173` di browser.
   - Perhatikan header navbar, search bar horizontal floating pill, menu 4 fitur utama, dan grid kartu kost rekomendasi yang rapi dan elegan.
   - Coba lakukan pencarian atau klik filter untuk memastikan fungsionalitas pencarian berjalan normal.
2. **Uji Tampilan Mobile (HP / Mode Responsif)**:
   - Aktifkan mode responsive mobile (Inspect Element $\rightarrow$ Mobile View).
   - Periksa Bottom Navigation Bar di bagian bawah layar:
     - Terdapat 4 menu: **Home**, **Search**, **Orders**, dan **Profile**.
     - Coba klik menu **Profile**: aplikasi akan mengarahkan ke halaman profil (atau halaman login jika belum login).
     - Coba klik menu **Search**: aplikasi akan membuka katalog cari kost.
     - Coba klik menu **Orders**: aplikasi akan membuka halaman kost saya/pemesanan.
