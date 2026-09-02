# WALKTHROUGH: Interactive In-App Route Preview pada Halaman Detail Kost

## 1. Ringkasan Fitur
Telah berhasil diimplementasikan fitur **Interactive In-App Route Preview** pada halaman detail kost (`KostDetail.tsx`). Pengguna kini dapat melihat rute petunjuk arah dari lokasi kost menuju kampus atau fasilitas publik terdekat secara langsung di layar mini map tanpa harus keluar ke aplikasi Google Maps eksternal.

---

## 2. Detail Perubahan Kode

### `functions/public/pages/KostDetail.tsx`
1. **Interactive Route State & Dynamic Map Source**:
   - Menambahkan state `activeRoute` dan ref `mapPreviewRef`.
   - Mengubah iframe Google Maps agar secara reaktif beralih antara **Pin Tunggal Kost** (`maps?q=...`) dan **Rute Navigasi Lengkap** (`maps?saddr=...&daddr=...`).
2. **Banner Status Rute Aktif**:
   - Di atas mini map, disajikan banner informasi rute:
     - 🧭 Menampilkan nama destinasi dan badge jarak (`± X km`).
     - Estimasi waktu tempuh: 🚶 Jalan Kaki • 🏍️ Sepeda Motor • 🚗 Mobil.
     - Tombol **"Titik Kost"** (`<RotateCcw />`) untuk mereset peta kembali ke lokasi awal.
3. **Smooth Scroll & State Highlight**:
   - Mengintegrasikan fungsi scroll halus ke elemen mini map saat tombol *"Rute"* pada kampus atau fasilitas publik diklik.
   - Kartu tempat yang sedang aktif diberikan highlight ring warna dan tombol bertuliskan *"Aktif ✓"*.
4. **Tombol Navigasi Sekunder**:
   - Tombol di bawah peta secara cerdas bertransformasi menjadi *"Buka Navigasi Penuh di Google Maps ↗"* untuk opsi navigasi GPS eksternal jika diinginkan.
5. **100% Bebas FOUT**:
   - Seluruh ikon menggunakan komponen vector SVG bundled dari `lucide-react`.

---

## 3. Hasil Pengujian & Kompilasi

- **Uji Kompilasi TypeScript / Vite**:
  ```bash
  cmd /c npm run build
  ```
  **Hasil:**
  ```text
  ✓ 2509 modules transformed.
  ✓ built in 27.68s
  Exit code: 0 (0 error)
  ```

---

## 4. Panduan Pengujian untuk Pengguna

1. Buka halaman detail kost manapun (misal: `/kost/...`).
2. Gulir ke bagian **Lokasi & Lingkungan**.
3. Di bawah daftar **Kampus Terdekat** atau **Fasilitas Publik**, klik tombol **"Rute"** pada salah satu tempat (misal: *Universitas Hasanuddin* atau *Makassar Town Square*).
4. **Hasil Pengujian**:
   - Halaman menggulir mulus ke atas ke layar mini preview peta.
   - Mini preview peta langsung memvisualisasikan jalur rute jalan (Directions) dari Kost menuju lokasi tersebut.
   - Di atas peta tampil banner info rute dan estimasi waktu tempuh.
   - Klik tombol **"Titik Kost"** atau klik kembali tombol rute untuk mengembalikan peta ke pin lokasi kost awal.
