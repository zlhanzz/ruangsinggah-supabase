# WALKTHROUGH - Sistem Kendali Biaya Operasional Platform KostManager & Transparansi Laporan Keuangan

Dokumen ini merangkum penyelesaian implementasi sistem kendali biaya operasional platform RuangSinggah.id (default 5%) khusus untuk properti **KostManager**, simulator interaktif dan audit trail di Dashboard Admin, serta transparansi penuh pada Laporan Keuangan di Dashboard Mitra.

---

## 1. Ringkasan Kebutuhan & Solusi

1. **Kendali Penuh Biaya Platform di Dashboard Admin**:
   - Menetapkan biaya operasional platform (default 5%) untuk menunjang layanan pencatatan kamar, pencatatan penghuni, penagihan sewa otomatis, pemasaran, dan pelaporan keuangan properti **KostManager**.
   - Admin memiliki kendali penuh untuk menaikkan/menurunkan persentase, mengaktifkan/menonaktifkan pemotongan, mengatur cakupan transaksi (sewa baru, perpanjangan sewa, biaya ekstra penghuni, fasilitas), dan melihat audit trail perubahan tarif.
2. **Kalkulator Simulasi Interaktif**:
   - Admin dapat mensimulasikan nilai bruto transaksi sewa secara langsung di Admin Dashboard untuk melihat potongan platform dan penerimaan bersih mitra.
3. **Transparansi Finansial di Dashboard Mitra**:
   - Modal Laporan Keuangan Properti Bulanan pada menu *Kost Saya* (`MitraDashboard.tsx`) secara dinamis menghitung potongan operasional KostManager secara transparan.
   - Properti mitra reguler tetap 0% potongan (100% pendapatan sewa utuh diterima mitra).
   - Uang deposit jaminan 100% dikecualikan dari pemotongan (0% potongan).
   - Format berbagi laporan ke WhatsApp otomatis mencantumkan rincian potongan operasional dan nilai net diterima.

---

## 2. Rincian Perubahan Kode

### A. Tipe Data & Skema Konfigurasi ([types.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts))
- Mendefinisikan antarmuka `KostManagerFeeSettings`:
  ```ts
  export interface KostManagerFeeSettings {
    percentage: number; // default: 5
    is_active: boolean; // default: true
    applies_to_new_booking: boolean;
    applies_to_extension: boolean;
    applies_to_extra_occupant: boolean;
    applies_to_facilities: boolean;
    deposit_excluded: boolean; // fixed true
    notes?: string;
    updated_at: string;
    updated_by: string;
  }
  ```
- Mendefinisikan antarmuka `KostManagerFeeLogEntry` untuk mencatat riwayat perubahan tarif platform (*audit trail*).

### B. Service Layer & Persistensi Supabase ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))
- Menyediakan nilai default `DEFAULT_KOSTMANAGER_FEE_SETTINGS`.
- Fungsi `getKostManagerFeeSettings()`: mengambil pengaturan tarif dari tabel `app_settings` (key: `'kostmanager_fee_settings'`) dengan mekanisme in-memory cache.
- Fungsi `getKostManagerFeeLogs()`: mengambil daftar log audit perubahan tarif dari tabel `app_settings` (key: `'kostmanager_fee_logs'`).
- Fungsi `saveKostManagerFeeSettings()`: menyimpan perubahan pengaturan ke `app_settings` sekaligus mencatat rekaman log baru dengan timestamp, email admin, persentase lama & baru, dan alasan perubahan.

### C. Panel Kendali & Simulator di Admin Portal ([KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx))
- Ditempatkan pada tab **"Paket & Tarif"** (`activeTab === 'packages'`).
- **Fitur Utama**:
  1. **Saklar Status Operasional**: Toggle Aktif/Nonaktif pemotongan platform.
  2. **Input Persentase & Quick Preset Chips**: Tombol preset instan `0% (Gratis Promo)`, `3%`, `5% (Rekomendasi Standar)`, `7.5%`, dan `10%`.
  3. **Checklist Cakupan Transaksi**: Centang transaksi yang dikenakan potongan (Sewa Baru, Perpanjangan, Ekstra Penghuni, Fasilitas) disertai banner penegasan bahwa Uang Deposit Jaminan selalu 0% potongan.
  4. **Kalkulator Simulasi Real-Time**: Input nominal sewa kotor $\rightarrow$ langsung menghitung potongan platform dan pendapatan bersih mitra secara instan.
  5. **Tabel Audit Trail**: Menampilkan histori perubahan tarif, admin pembuat perubahan, dan catatan alasan.

### D. Transparansi Laporan Keuangan Mitra ([MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx))
- Mengambil konfigurasi `kmFeeSettings` secara otomatis saat dashboard dimuat.
- Pada Modal Laporan Keuangan Properti Bulanan (`selectedKostForFinance`):
  - Jika properti berstatus **KostManager** dan fee aktif:
    - Menghitung `totalOperationalCut = grossRevenue * (feePercentage / 100)`.
    - Menghitung `totalNetReceived = totalGrossIncome - totalOperationalCut`.
    - Menampilkan **Kartu Rincian Potongan Operasional Platform KostManager (X%)** secara elegan.
    - Mengarahkan kartu performa utama ke **Total Bersih Diterima Pemilik Kost** (hijau emerald).
  - Jika properti berstatus reguler: potongan tetap Rp 0 (100% diterima mitra).
  - Menyesuaikan klausul transparansi operasional dan template teks ekspor WhatsApp.

### E. Standar Ikon Pure SVG Bebas FOUT
- Seluruh icon menggunakan komponen vector SVG dari package `lucide-react` (`Percent`, `Calculator`, `History`, `Save`, `ShieldCheck`, `FileText`, `Layers`, `Zap`).

---

## 3. Berkas yang Disentuh

1. **[types.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts)**: Penambahan antarmuka `KostManagerFeeSettings` & `KostManagerFeeLogEntry`.
2. **[adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)**: Penambahan service query, mutation, caching, dan audit logging pada Supabase `app_settings`.
3. **[KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)**: Pembuatan section pengaturan biaya platform, simulator kalkulasi, dan tabel audit log.
4. **[MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)**: Integrasi kalkulasi dinamis potongan platform, kartu transparansi, dan pembaruan format bagikan WhatsApp.
5. **[functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md)**: Dokumentasi progres entri nomor 333.
6. **[WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md)**: Panduan walkthrough dan hasil pengujian.

---

## 4. Hasil Verifikasi & Uji Kompilasi

1. **Build Frontend Vite (`functions/public`)**:
   ```bash
   cmd /c npm run build
   ```
   **Hasil**: **LULUS (Exit Code 0)**. Sebanyak 2510 modul tertransformasi dan bundle production berhasil disalin ke `./dist` & `../../public` dalam waktu 30.40 detik tanpa error.
2. **Build Backend Functions (`functions`)**:
   ```bash
   cmd /c npm run build (tsc)
   ```
   **Hasil**: **LULUS (Exit Code 0)**. 0 error kompilasi TypeScript.

---

## 5. Panduan Pengujian bagi Pengguna

### A. Pengujian Kendali Tarif di Dashboard Admin
1. Buka halaman **Admin Portal KostManager** (`/dashboard-admin/km_portal`).
2. Masuk ke tab **"Paket & Tarif"**.
3. Di bagian teratas, Anda akan melihat panel **"Pengaturan Biaya Layanan Platform KostManager"**:
   - Coba klik chip preset persentase (misal: `3%`, `5%`, `7.5%`, atau `0%`).
   - Coba ubah nilai pada **Kalkulator Simulasi Pendapatan** (misal masukkan `Rp 2.000.000`) dan perhatikan perubahan angka potongan platform dan net pemilik secara real-time.
   - Masukkan alasan perubahan pada kolom catatan, lalu klik **"Simpan Pengaturan Biaya"**.
   - Perhatikan notifikasi sukses dan amati pembaruan entri pada **Riwayat Perubahan Tarif Platform**.

### B. Pengujian Transparansi di Dashboard Mitra
1. Buka **Dashboard Mitra** (`/dashboard-mitra/properties`).
2. Pada salah satu properti berstatus **KostManager**, klik tombol **"📄 Laporan Keuangan Kost"**.
3. Amati tampilan modal:
   - Terdapat kartu rincian **"Potongan Operasional Platform KostManager (5%)"**.
   - Kartu statistik utama menampilkan **"Total Bersih Diterima Pemilik Kost"**.
   - Klik tombol **"Kirim ke WhatsApp"** dan perhatikan bahwa draf pesan WhatsApp telah memuat rincian bruto, potongan platform, dan total net diterima.
4. Buka modal laporan keuangan pada properti berstatus reguler:
   - Pastikan potongan operasional tetap Rp 0 (100% diterima penuh).
