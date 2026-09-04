# Implementation Plan - Sistem Kendali Biaya Operasional Platform KostManager (5%) di Dashboard Admin & Dashboard Mitra

Dokumen ini merinci rencana implementasi penetapan biaya operasional platform (default 5%) khusus untuk transaksi properti **KostManager** (sewa baru dan perpanjangan sewa) dengan kendali penuh (*Full Control*) di Dashboard Admin, serta transparansi pembagian hasil di Dashboard Mitra dan Laporan Keuangan.

---

## 1. Analisis Masalah & Kebutuhan

### Kebutuhan 1: Kendali Penuh Biaya Platform di Dashboard Admin
- Super Admin membutuhkan panel konfigurasi dinamis untuk mengatur persentase biaya layanan platform KostManager (default **5%**) yang disimpan di tabel `app_settings` Supabase (`key: 'kostmanager_fee_settings'`).
- Parameter kendali admin meliputi:
  1. **Persentase Potongan Platform (`fee_percentage`)**: Input dinamis (misal: 5%, dapat disesuaikan naik/turun menjadi 3%, 7.5%, 10%, dll.).
  2. **Status Potongan (`is_active`)**: Saklar On/Off untuk mengaktifkan atau menonaktifkan potongan.
  3. **Cakupan Transaksi (`applied_to`)**: Checklist pos yang dikenakan potongan (Sewa Baru, Perpanjangan Sewa, Ekstra Penghuni, Fasilitas Tambahan). *Catatan: Deposit jaminan tetap 0%*.
  4. **Kalkulator Simulasi Interaktif**: Alat simulasi langsung di admin untuk menghitung bagi hasil (misal sewa Rp 1.500.000 $\rightarrow$ Potongan 5% = Rp 75.000, Bersih Diterima Mitra = Rp 1.425.000).
  5. **Riwayat Log Perubahan Tarif**: Pencatatan riwayat perubahan persentase biaya oleh admin.

### Kebutuhan 2: Transparansi Finansial di Sisi Mitra (Dashboard & Laporan Keuangan)
- **Laporan Keuangan Bulanan Properti KostManager**:
  - Menampilkan **Total Pemasukan Kotor (*Gross Rent*)**.
  - Menampilkan **Biaya Layanan KostManager (5%)** sebagai potongan operasional resmi secara transparan.
  - Menampilkan **Total Pendapatan Bersih Mitra (95%)** yang siap ditarik/diteruskan ke dompet mitra.
  - Pesan ringkasan WhatsApp memuat rincian transparansi Gross, Biaya Layanan 5%, dan Net Diterima.
- **Properti Reguler (Non-KostManager)**:
  - Tetap 0% potongan operasional (*100% Utuh Diterima Mitra*).

---

## 2. Dampak Perubahan File

| File | Bagian yang Dimodifikasi |
|---|---|
| `functions/public/types.ts` | Penambahan tipe data `KostManagerFeeSettings` dan `KostManagerFeeLogEntry`. |
| `functions/public/adminService.ts` | Penambahan fungsi `getKostManagerFeeSettings()`, `saveKostManagerFeeSettings()`, dan `getKostManagerFeeLogs()`. |
| `functions/public/components/admin/KostManagerPortal.tsx` | Penambahan panel **Pengaturan Biaya Layanan Platform KostManager** (input persentase, switch status, checklist cakupan, kalkulator simulasi, dan log perubahan). |
| `functions/public/pages/MitraDashboard.tsx` | Penyesuaian kalkulasi pada modal Laporan Keuangan Bulanan (`selectedKostForFinance`) dan ringkasan WhatsApp untuk properti KostManager dengan potongan dinamis dari `app_settings` (default 5%). |
| `functions/PROGRESS.md` | Pencatatan riwayat progres 328 (Fase 2). |
| `WALKTHROUGH.md` | Dokumentasi panduan pengujian dan walkthrough fitur (Fase 2). |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

### Tahap 1: Tipe Data & Layanan Database (`types.ts` & `adminService.ts`)
1. Mendefinisikan interface:
   ```typescript
   export interface KostManagerFeeSettings {
     fee_percentage: number; // default: 5
     is_active: boolean;    // default: true
     applied_to: {
       new_booking: boolean;
       extension: boolean;
       extra_occupant: boolean;
       facility: boolean;
     };
     updated_at?: string;
     updated_by?: string;
   }
   ```
2. Mengimplementasikan `getKostManagerFeeSettings()`, `saveKostManagerFeeSettings()`, dan pencatatan log ke `app_settings`.

### Tahap 2: Panel Kendali Admin di `KostManagerPortal.tsx`
1. Membuat kartu antarmuka elegan *"Pengaturan Biaya Layanan KostManager (Platform Fee)"*.
2. Menyediakan input persentase (%) dengan tombol preset cepat (0%, 3%, 5%, 7.5%, 10%).
3. Menyediakan simulasi kalkulasi real-time agar admin dapat langsung melihat pembagian hasil sebelum menyimpan.
4. Menyediakan tombol simpan dengan toast notifikasi sukses.

### Tahap 3: Integrasi Transparansi di Dashboard Mitra (`MitraDashboard.tsx`)
1. Mengambil konfigurasi `getKostManagerFeeSettings()` saat inisialisasi data mitra.
2. Pada modal Laporan Keuangan Bulanan:
   - Jika properti berstatus KostManager (`selectedKostForFinance.isManaged`):
     - `feeRate = kmFeeSettings.is_active ? kmFeeSettings.fee_percentage : 0;`
     - `totalPlatformFee = Math.round(totalGrossRevenue * (feeRate / 100));`
     - `totalNetReceived = totalGrossRevenue - totalPlatformFee;`
     - Tampilkan badge `"Biaya Layanan KostManager (5%): - Rp XX.XXX"`.
   - Jika properti reguler: Potongan tetap Rp 0 (100% diterima mitra).
3. Pembaruan format teks ringkasan WhatsApp agar mencantumkan rincian Gross, Biaya Layanan KostManager, dan Total Bersih Mitra.

### Tahap 4: Uji Kompilasi, Pencatatan & Git Push
1. Menjalankan `cmd /c npm run build` (Vite) dan `tsc` (Functions) untuk memastikan 0 error.
2. Mencatat progres ke `functions/PROGRESS.md` dan memperbarui `WALKTHROUGH.md`.
3. Melakukan commit dan push ke remote branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**: Memastikan kompilasi Vite dan TypeScript 100% bersih tanpa error.
2. **Uji Konfigurasi Admin**:
   - Buka Dashboard Admin $\rightarrow$ Portal KostManager $\rightarrow$ Pengaturan Biaya Layanan.
   - Ubah persentase dari 5% ke angka lain (misal 7.5%) dan simpan.
   - Pastikan data tersimpan di Supabase `app_settings` dan nilai baru termuat saat halaman direfresh.
3. **Uji Laporan Keuangan di Dashboard Mitra**:
   - Buka menu *Kost Saya* $\rightarrow$ Laporan Keuangan pada kost berstatus KostManager.
   - Pastikan potongan biaya operasional 5% dihitung otomatis dan mengurangi total pendapatan kotor menjadi pendapatan bersih secara transparan.
   - Buka kost reguler non-KostManager dan pastikan potongan tetap Rp 0 (100% utuh).
