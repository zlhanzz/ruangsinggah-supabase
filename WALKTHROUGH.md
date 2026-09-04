# WALKTHROUGH: Sistem Kendali Biaya Operasional Platform KostManager & Transparansi Laporan Keuangan

## 1. Ringkasan Eksekusi
Telah berhasil diimplementasikan sistem pengelolaan dan pemotongan biaya operasional platform **KostManager** secara dinamis (default 5% per transaksi sewa baru dan perpanjangan) dengan kendali penuh bagi Administrator melalui Admin Dashboard, serta transparansi finansial penuh bagi Mitra di Laporan Keuangan Properti.

---

## 2. Rincian Perubahan Kode

### A. Tipe Data & Skema Pengaturan (`types.ts`)
- **[types.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts)**:
  - Mendefinisikan interface `KostManagerFeeSettings` dengan properti:
    - `enabled`: status toggle aktif/nonaktif biaya platform.
    - `fee_percentage`: persentase potongan sewa (default: 5%).
    - `applies_to`: array cakupan transaksi (`'new_booking' | 'extension' | 'extra_occupant' | 'facilities'`).
    - `deposit_fee_percentage`: fixed 0% (uang jaminan/deposit 100% utuh, tidak dipotong).
    - `last_updated_at`, `last_updated_by`, `notes`.
  - Mendefinisikan interface `KostManagerFeeLogEntry` untuk pencatatan riwayat audit log.

### B. Service CRUD & Audit Logging Supabase (`adminService.ts`)
- **[adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)**:
  - Menyediakan konstanta `DEFAULT_KOSTMANAGER_FEE_SETTINGS`.
  - Fungsi `getKostManagerFeeSettings()`: mengambil konfigurasi dari tabel `app_settings` (key: `'kostmanager_fee_settings'`).
  - Fungsi `saveKostManagerFeeSettings()`: memperbarui konfigurasi dan secara otomatis menambahkan catatan riwayat ke tabel `app_settings` (key: `'kostmanager_fee_logs'`).
  - Fungsi `getKostManagerFeeLogs()`: mengambil daftar riwayat perubahan persentase dan admin pengubah.

### C. Panel Pengaturan & Simulator Real-Time di Admin Dashboard (`KostManagerPortal.tsx`)
- **[KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)**:
  - Menambahkan panel **"Pengaturan Biaya Layanan Platform KostManager"** pada tab *"Paket & Biaya"*.
  - **Fitur Kontrol**:
    - Switch toggle aktif/nonaktif biaya layanan platform.
    - Input persentase dengan tombol preset instan (`0% Gratis`, `3%`, `5% Rekomendasi`, `7.5%`, `10%`).
    - Checklist pilihan cakupan transaksi yang dikenakan potongan.
    - Kartu proteksi deposit: aturan baku 0% potongan untuk dana deposit/jaminan.
    - **Kalkulator Simulasi Interaktif**: simulasi pendapatan kotor, potongan platform, dan pendapatan bersih mitra secara real-time.
    - Input catatan perubahan dan tombol simpan dengan konfirmasi dialog.
    - Tabel riwayat perubahan (*Audit Logs*) yang menampilkan waktu, admin pengubah, persentase lama $\rightarrow$ baru, dan catatan.
  - Seluruh ikon menggunakan pure SVG `lucide-react` (`Percent`, `Calculator`, `History`, `Save`, `ShieldCheck`, dll.) bebas FOUT.

### D. Integrasi & Transparansi Finansial di Mitra Dashboard (`MitraDashboard.tsx`)
- **[MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)**:
  - Mengambil pengaturan tarif `kmFeeSettings` saat inisialisasi dashboard.
  - Pada modal Laporan Keuangan Bulanan Properti (`selectedKostForFinance`):
    - Jika properti dikelola oleh **KostManager**: otomatis menghitung potongan operasional platform sesuai tarif aktif (default 5%) dari total sewa/transaksi, menampilkan kartu rincian potongan platform, dan mengalkulasi pendapatan bersih yang ditransfer ke mitra.
    - Jika properti **Reguler**: potongan platform tetap Rp 0 (100% utuh diterima mitra).
    - Menyesuaikan klausul transparansi operasional pada catatan keuangan.
    - Memperbarui format pesan template WhatsApp agar mencantumkan rincian potongan platform dan total transfer bersih secara rinci.

---

## 3. Hasil Pengujian & Kompilasi
- **Build Frontend (`functions/public`)**: `npm run build` lulus 100% (✓ 2509 modules transformed, built in 45.37s, 0 error).
- **Build Backend (`functions`)**: `tsc` lulus 100% (0 error).

---

## 4. Panduan Verifikasi Pengujian oleh User

### A. Pengujian Kendali Admin
1. Buka halaman **Admin Dashboard $\rightarrow$ Portal KostManager** (`/admin` tab KostManager).
2. Klik tab **"Paket & Biaya"**.
3. Periksa section **"Pengaturan Biaya Layanan Platform KostManager"**:
   - Coba ubah persentase menggunakan chip preset (misal `5%` atau `7.5%`).
   - Coba kalkulator simulasi (masukkan nominal sewa misal `1.500.000` dan amati hasil hitung potongan & penerimaan bersih).
   - Klik tombol **"Simpan Pengaturan Biaya"** dan amati konfirmasi serta pembaruan riwayat audit log.

### B. Pengujian Laporan Keuangan Mitra
1. Masuk ke **Dashboard Mitra** (`/dashboard-mitra/properties`).
2. Pada kartu properti yang berstatus **KostManager**, klik tombol **"📄 Laporan Keuangan Kost"**.
3. Periksa pada bagian **Rincian Penerimaan**:
   - Terdapat baris **"Potongan Biaya Operasional Platform (5%)"** yang terpotong secara transparan dari total pemasukan kotor.
   - Total Pemasukan Bersih menampilkan nominal setelah potongan platform.
4. Klik tombol **"Kirim ke WhatsApp"** atau **"Cetak / Unduh PDF"** untuk memverifikasi kesesuaian data yang tercetak/terkirim.
