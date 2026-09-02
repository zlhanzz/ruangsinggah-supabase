# WALKTHROUGH: Penyederhanaan UI Mini Peta Rute & Fitur Auto-Scale Adaptive Viewport

## 1. Ringkasan Fitur
Telah diselesaikan penyederhanaan antarmuka peta pada halaman detail kost (`KostDetail.tsx`) menjadi **Ultra Clean & Minimalis**, disertai dengan fitur **Auto-Scale Adaptive Viewport** yang secara cerdas memperluas area pandang peta saat rute perjalanan sedang aktif.

---

## 2. Detail Perubahan Kode

### `functions/public/pages/KostDetail.tsx`
1. **Pembersihan Elemen UI**:
   - Menghapus banner oranye atas (*"Menampilkan Rute Menuju..."*).
   - Menghapus tombol tautan bawah (*"Buka Navigasi Penuh di Google Maps"*).
   - Menghasilkan area peta yang bersih, fokus, dan bebas distraksi.
2. **Fitur Auto-Scale Adaptive Viewport**:
   - Container peta kini menggunakan tinggi dinamis:
     - **Mode Pin Kost (Normal)**: `h-60 sm:h-72` (compact & proporsional).
     - **Mode Rute Aktif**: Otomatis membesar (*auto-scale*) menjadi `h-96 sm:h-[420px] md:h-[460px]` dengan transisi animasi halus (`transition-all duration-500 ease-in-out`).
     - Seluruh garis belokan, rute jalan, dan titik asal-tujuan termuat secara leluasa tanpa terpotong.
3. **Floating Reset Pill Ringkas**:
   - Menyematkan tombol mini semi-transparan di sudut kanan atas peta bertuliskan *"✕ Titik Kost"* (`<RotateCcw />`) saat rute aktif untuk mereset peta ke titik asal kost dengan mudah.
   - Tombol *"Aktif ✓"* pada item list juga tetap berfungsi sebagai toggle.

---

## 3. Hasil Pengujian & Kompilasi

- **Uji Kompilasi TypeScript / Vite**:
  ```bash
  cmd /c npm run build
  ```
  **Hasil:**
  ```text
  ✓ 2509 modules transformed.
  ✓ built in 30.64s
  Exit code: 0 (0 error)
  ```

---

## 4. Panduan Pengujian untuk Pengguna

1. Buka halaman detail kost (`/kost/...`).
2. Lihat bagian **Lokasi & Lingkungan**:
   - Peta kini tampil bersih dan ringkas tanpa banner oranye di atas dan tanpa tombol di bawah.
3. Klik tombol **"Rute"** pada kampus terdekat (misal: *Politeknik Negeri Ujung Pandang*):
   - Layar melakukan *smooth scroll* ke peta.
   - Peta secara otomatis membesar (*auto-scale*) menjadi lebih tinggi dan lapang dengan animasi mulus.
   - Rute perjalanan dari Kost ke kampus tampil penuh tanpa terpotong.
4. Klik tombol **"Titik Kost"** di sudut kanan atas peta (atau klik tombol **"Aktif ✓"** pada list):
   - Peta kembali mengecil ke ukuran compact dan menampilkan pin tunggal lokasi kost.
