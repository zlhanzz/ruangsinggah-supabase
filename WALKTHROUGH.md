# WALKTHROUGH - Sistem Kendali Biaya Operasional Platform KostManager & Transparansi Laporan Keuangan

Dokumen ini merangkum seluruh perubahan yang telah selesai diimplementasikan dan diverifikasi untuk fitur **Sistem Kendali Biaya Operasional Platform KostManager (Default 5%) dan Transparansi Laporan Keuangan Mitra**.

---

## 1. Ringkasan Perubahan

### A. Skema Data & Type Definitions ([types.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts))
- Mendefinisikan antarmuka data `KostManagerFeeSettings` yang mencakup:
  - `enabled`: status toggle aktif/nonaktif potongan platform.
  - `fee_percentage`: persentase potongan platform (default: `5`%).
  - `applies_to`: cakupan transaksi (`new_booking`, `extension`, `extra_occupant`, `facilities`).
  - `deposit_fee_percentage`: potongan dana deposit/jaminan (ditetapkan `0`% permanen).
  - `last_updated_at` & `last_updated_by`: jejak audit waktu dan email pengubah.
  - `notes`: catatan alasan atau memo internal perubahan tarif.
- Mendefinisikan antarmuka `KostManagerFeeLogEntry` untuk pencatatan riwayat perubahan (*audit trail*).

### B. Service Pengaturan Platform di Supabase ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))
- Menambahkan konstanta `DEFAULT_KOSTMANAGER_FEE_SETTINGS` dengan tarif default **5%**.
- Mengimplementasikan fungsi data fetching & mutation:
  - `getKostManagerFeeSettings()`: mengambil pengaturan dari tabel `app_settings` (`key: 'kostmanager_fee_settings'`) dengan fallback yang aman.
  - `saveKostManagerFeeSettings(settings, adminEmail, notes)`: memperbarui pengaturan dan mencatat riwayat perubahan ke array `kostmanager_fee_logs`.
  - `getKostManagerFeeLogs()`: mengambil daftar riwayat perubahan tarif platform.

### C. Panel Kendali Penuh di Dashboard Admin ([KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx))
- Menempatkan seksian **"Pengaturan Biaya Layanan Platform KostManager"** pada tab *"Paket & Biaya"*.
- Fitur antarmuka yang disediakan:
  1. **Toggle Sakelar Status**: Mengaktifkan atau menonaktifkan potongan platform secara instan.
  2. **Preset & Input Persentase**: Chip pilihan cepat (`0% Gratis`, `3%`, `5% Rekomendasi`, `7.5%`, `10%`) serta input manual dengan slider dinamis.
  3. **Cakupan Transaksi**: Pilihan checklist untuk Penyewaan Baru (*New Booking*), Perpanjangan Sewa (*Rent Extension*), Biaya Tambahan Penghuni (*Extra Occupant*), dan Biaya Pemakaian Fasilitas.
  4. **Proteksi Dana Deposit**: Banner transparansi bahwa uang deposit/jaminan **100% aman (0% potongan)** untuk melindungi hak penyewa.
  5. **Kalkulator Simulasi Real-Time**: Input nominal tarif sewa (misal: Rp 1.500.000) yang langsung mengkalkulasikan penerimaan kotor, potongan platform, dan pendapatan bersih mitra.
  6. **Catatan Memo & Riwayat Audit**: Input catatan revisi tarif serta tabel riwayat log perubahan tarif sebelumnya.

### D. Transparansi Finansial Real-Time di Dashboard Mitra ([MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx))
- Mengambil pengaturan tarif `kmFeeSettings` secara paralel saat dashboard mitra dimuat.
- Pada modal **Laporan Keuangan Properti Bulanan** (`selectedKostForFinance`):
  1. **Kalkulasi Khusus KostManager**: Jika properti berstatus kelolaan KostManager, sistem secara otomatis menghitung `totalOperationalCut` berdasarkan persentase platform aktif (misal 5%).
  2. **Mitra Reguler Bebas Potongan**: Jika properti kelolaan mandiri (regular partner), potongan tetap `Rp 0` (100% bersih ke mitra).
  3. **Kartu Rincian Finansial Transparan**:
     - *Total Penerimaan Kotor* (Gross Revenue).
     - *Potongan Layanan Platform KostManager (5%)* dengan badge informasi transparan.
     - *Estimasi Bersih Diterima Mitra* (Net Revenue).
  4. **Pembaruan Template WhatsApp**: Format pesan bagikan laporan keuangan menyertakan nominal kotor, potongan platform, dan transfer bersih ke rekening pemilik.

---

## 2. Hasil Pengujian & Verifikasi

1. **Uji Kompilasi Frontend Vite (`functions/public`)**:
   ```bash
   cmd /c npm run build
   # Hasil: ✓ 2510 modules transformed.
   # Status: Exit code 0 (Berhasil, 0 error kompilasi).
   ```

2. **Uji Kompilasi Backend TypeScript (`functions`)**:
   ```bash
   cmd /c npm run build (tsc)
   # Hasil: Exit code 0 (Berhasil, 0 error kompilasi).
   ```

3. **Verifikasi Standar FOUT**:
   - Seluruh ikon menggunakan pure vector SVG dari paket `lucide-react` (`Percent`, `Calculator`, `History`, `Save`, `ShieldCheck`, `Layers`, dll.) dengan 0 FOUT dan 0 network delay.

---

## 3. Panduan Pengujian bagi Pengguna / Administrator

1. **Pengujian Kendali Admin**:
   - Masuk ke Dashboard Admin: `/dashboard-admin` $\rightarrow$ pilih tab **"Paket & Biaya"**.
   - Periksa seksian pertama **"Pengaturan Biaya Layanan Platform KostManager"**.
   - Coba ubah persentase menggunakan chip preset (misal `5%` atau `7.5%`) atau input kustom.
   - Coba gunakan **Kalkulator Simulasi Cepat** dengan memasukkan nominal sewa kamar (misal: `2.000.000`). Amati perhitungan potongan platform dan estimasi bersih mitra.
   - Masukkan catatan alasan dan klik **"Simpan Pengaturan Biaya"**.
   - Konfirmasi dialog notifikasi dan periksa apakah riwayat perubahan tercatat di tabel log.

2. **Pengujian Laporan Keuangan Mitra**:
   - Masuk ke Dashboard Mitra: `/dashboard-mitra/properties`.
   - Buka menu modal **"Laporan Keuangan"** pada kartu properti kelolaan KostManager.
   - Periksa kartu ringkasan keuangan: amati baris rincian potongan platform KostManager (misal 5%) dan total transfer bersih yang diterima mitra.
   - Coba bagikan via tombol WhatsApp untuk memastikan template rincian laporan keuangan tersaji rapi dan transparan.
