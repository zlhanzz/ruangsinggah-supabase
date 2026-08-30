# Walkthrough: Peningkatan Komprehensif Modal Perpanjangan Sewa pada Halaman 'Kost Saya' (`MyKost.tsx`)

Dokumen ini mendokumentasikan pembaruan dan peningkatan fitur pada modal **Perpanjang Sewa** yang menyajikan status masa sewa berjalan, simulasi timeline tanggal & total skala hari baru secara interaktif, serta tab riwayat perpanjangan sewa masa lalu lengkap dengan akses kwitansi digital.

---

## 1. Ringkasan Perubahan

### A. Navigasi 2-Tab Internal Modal:
- Pada header modal perpanjangan, ditambahkan switcher tab:
  - `[ ➕ Form Perpanjangan ]`: Mengatur durasi perpanjangan, melihat simulasi tanggal/hari bersambung, dan rincian biaya.
  - `[ 📜 Riwayat ({count}) ]`: Menampilkan seluruh riwayat transaksi perpanjangan & pembayaran sewa lunas milik unit hunian ini.

### B. Kartu Status Masa Sewa Berjalan Saat Ini:
- Menampilkan kartu gelap modern berisi:
  - **Identitas Kamar**: Nomor Unit Kamar & Tipe Kamar (`Kamar 3 • Standard`).
  - **Mulai Masuk**: Tanggal awal sewa berjalan.
  - **Jatuh Tempo Saat Ini**: Tanggal batas sewa aktif saat ini.
  - **Sisa Hari**: Badge status sisa hari (`X Hari Tersisa` / `Aktif`).

### C. Live Simulasi Timeline & Skala Hari Perpanjangan:
- Mengkalkulasi secara instan saat pengguna mengubah durasi ($N$ Bulan) atau memilih paket:
  - **Mulai Bersambung**: Tanggal mulai perpanjangan (bersambung tepat dari jatuh tempo saat ini).
  - **Jatuh Tempo Baru**: Tanggal akhir jatuh tempo baru setelah diperpanjang.
  - **Total Skala Hari**: Jumlah hari jangka perpanjangan (`+31 Hari` untuk 1 bulan, `+92 Hari` untuk 3 bulan, dst.).
  - **Banner Keterangan**: *"Masa tinggal Anda akan otomatis bersambung hingga [Tanggal Baru] tanpa jeda."*

### D. Tab Riwayat Perpanjangan & Kwitansi Digital:
- Menampilkan daftar transaksi perpanjangan sewa dan sewa kamar sebelumnya yang berstatus lunas.
- Setiap item riwayat memuat:
  - Judul/Periode Tagihan & ID Invoice (`#INV-...`).
  - Tanggal Pembayaran & Badge `Lunas`.
  - Nominal Pembayaran.
  - Tombol **"🧾 Lihat Kwitansi"** yang langsung membuka modal `DigitalReceiptModal` resmi berstempel PT RUANG SINGGAH NUSANTARA.

---

## 2. File yang Disentuh

| File | Deskripsi |
|---|---|
| [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Integrasi state tab perpanjangan, kalkulator timeline perpanjangan baru (+hari, tanggal mulai/selesai), kartu masa sewa aktif, dan tab riwayat transaksi + kwitansi. |
| `functions/PROGRESS.md` | Pencatatan riwayat penambahan fitur #214. |
| `WALKTHROUGH.md` | Dokumentasi walkthrough hasil pengembangan. |

---

## 3. Hasil Pengujian & Verifikasi Build

- **Build Kompilasi Frontend**:
  ```bash
  cmd /c npm run build
  ```
  **Hasil**:
  ```
  vite v6.4.1 building for production...
  transforming...
  ✓ 2531 modules transformed.
  rendering chunks...
  computing gzip size...
  ✓ built in 37.35s
  exit code: 0
  ```

---

## 4. Panduan Verifikasi Pengguna (UI)

1. Buka aplikasi dan masuk ke menu **Kost Saya** (`/my-bookings/aktif`).
2. Pada kartu kost aktif Anda (misal *Kost Madani*), klik tombol **"Perpanjang Sewa"**.
3. Periksa tampilan modal baru:
   - Di bagian atas terdapat kartu **Masa Sewa Berjalan** dengan nomor kamar, tanggal mulai masuk, tanggal jatuh tempo saat ini, dan sisa hari tinggal.
   - Ubah durasi perpanjangan (misal tekan `+` menjadi 2 Bulan atau 3 Bulan).
   - Perhatikan kartu **Simulasi Periode Bersambung**: tanggal mulai, tanggal jatuh tempo baru, dan jumlah total hari (+92 Hari) berubah secara langsung dan akurat.
4. Klik tab **"Riwayat"** pada header modal:
   - Lihat riwayat transaksi pembayaran/perpanjangan sewa sebelumnya.
   - Klik tombol **"Lihat Kwitansi"** untuk memeriksa dokumen kwitansi digital resmi berstempel.
