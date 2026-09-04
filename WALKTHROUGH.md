# WALKTHROUGH: Sistem Kendali Biaya Operasional Platform KostManager (Default 5%) & Transparansi Laporan Keuangan Mitra

## 1. Ringkasan Eksekusi
Telah berhasil diimplementasikan sistem **Biaya Operasional Platform RuangSinggah.id** untuk layanan **KostManager**:
1. **Kendali Penuh di Admin Dashboard**:
   - Administrator memiliki kontrol penuh untuk mengubah persentase potongan platform (default 5%, dapat disetel naik/turun atau dinonaktifkan).
   - Dilengkapi toggle aktif/nonaktif, chip preset cepat (0%, 3%, 5%, 7.5%, 10%), checklist cakupan transaksi, kalkulator simulasi real-time, dan audit log riwayat perubahan tarif.
2. **Transparansi Finansial di Dashboard Mitra**:
   - Laporan keuangan bulanan properti KostManager secara dinamis dan transparan merinci penerimaan kotor, nominal potongan operasional platform, dan pendapatan bersih mitra (*Net Revenue*).
   - Properti reguler non-KostManager tetap 0% (100% diterima utuh).
   - Dana jaminan / deposit penghuni berstatus aman 0% (tidak dikenakan potongan).
   - Fitur ekspor laporan (Cetak / Unduh PDF dan Bagikan ke WhatsApp) otomatis memuat rincian transparansi potongan platform.
3. **Sistem Kendali Disiplin Properti KostManager**:
   - Fitur **Bekukan Properti (*Ban/Suspend*)** dengan pilihan kategori pelanggaran baku dan catatan edukatif.
   - Fitur **Pulihkan Properti (*Unban/Publish*)** 1-klik.
   - Fitur **Hapus Permanen (*Permanent Delete*)** dengan proteksi ketik nama properti dan pembersihan total dari storage serta database.
4. **Bebas FOUT (Flash of Unstyled Text)**:
   - Seluruh ikon menggunakan pure vector SVG dari `lucide-react` (`Percent`, `Calculator`, `History`, `Save`, `Ban`, `ShieldCheck`, `Receipt`, `RotateCw`, dll.).

---

## 2. Rincian File yang Dimodifikasi

### A. Tipe Data & Skema Pengaturan ([`types.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts))
- Mendefinisikan tipe data `KostManagerFeeSettings`:
  ```typescript
  export interface KostManagerFeeSettings {
    enabled: boolean;
    fee_percentage: number; // default: 5
    applies_to: ('new_booking' | 'extension' | 'extra_occupant' | 'facilities')[];
    deposit_fee_percentage: number; // fixed 0 (tidak dipotong)
    last_updated_at?: string;
    last_updated_by?: string;
    notes?: string;
  }
  ```
- Mendefinisikan tipe data `KostManagerFeeLogEntry` untuk pencatatan riwayat perubahan persentase biaya layanan.

### B. Service CRUD & Supabase Audit Log ([`adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))
- `DEFAULT_KOSTMANAGER_FEE_SETTINGS`: konfigurasi default 5% dengan deposit 0%.
- `getKostManagerFeeSettings()`: mengambil pengaturan dari tabel `app_settings` (`key = 'kostmanager_fee_settings'`).
- `saveKostManagerFeeSettings(settings, adminEmail, notes)`: memperbarui pengaturan tarif dan otomatis mencatat riwayat ke log `kostmanager_fee_logs` di Supabase `app_settings`.
- `getKostManagerFeeLogs()`: mengambil daftar riwayat perubahan persentase biaya platform.

### C. Antarmuka Kendali di Admin Dashboard ([`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx))
- Ditempatkan di tab **"Paket & Biaya"** (`activeTab === 'packages'`).
- **Komponen Panel Kendali**:
  1. **Header & Status Switch**: Toggle aktifkan/nonaktifkan potongan operasional platform dengan status visual real-time.
  2. **Persentase Potongan**: Input number dengan slider persentase dan tombol chip preset cepat (`0% Bebas Biaya`, `3%`, `5% Rekomendasi`, `7.5%`, `10%`).
  3. **Cakupan Transaksi**: Pilihan checkbox untuk Sewa Penghuni Baru, Perpanjangan Sewa, Ekstra Tambah Penghuni, dan Tagihan Fasilitas Tambahan. Dilengkapi banner edukatif kepastian Uang Jaminan / Deposit Bebas Potongan (0%).
  4. **Kalkulator Simulasi Finansial Real-Time**: Memasukkan nominal sewa kamar (misal: Rp 1.500.000) dan langsung melihat simulasi penerimaan kotor, nominal potongan operasional platform, serta nominal transfer bersih yang diterima mitra.
  5. **Catatan Perubahan & Tombol Simpan**: Input catatan manajerial dan tombol simpan dengan dialog konfirmasi.
  6. **Tabel Audit Log Riwayat Tarif**: Menampilkan tanggal/jam perubahan, persentase sebelum vs sesudah, status aktif/nonaktif, dan akun admin yang mengubah.
- **Sistem Disiplin Properti (Ban, Unban, Delete)**:
  - Tombol aksi cepat di setiap baris properti KostManager untuk membekukan listing (`freezeProperty`), memulihkan (`unfreezeProperty`), dan menghapus permanen dengan proteksi verifikasi nama (`deleteProperty`).

### D. Transparansi Finansial di Dashboard Mitra ([`MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx))
- Memuat konfigurasi tarif `kmFeeSettings` secara otomatis saat dashboard dibuka.
- Pada Modal Laporan Keuangan Properti (`selectedKostForFinance`):
  - Jika properti berstatus **KostManager**:
    - Menghitung potongan operasional platform: `totalOperationalCut = totalGrossRent * (fee_percentage / 100)`.
    - Menghitung penerimaan bersih mitra: `totalNetReceived = totalGrossRent - totalOperationalCut`.
    - Menampilkan kartu rincian potongan platform berwarna amber dengan keterangan persentase potongan aktif dan nominal rupiah yang dipotong.
    - Menyesuaikan klausul transparansi operasional pada bagian bawah laporan.
  - Jika properti berstatus **Reguler (Non-KostManager)**:
    - Potongan operasional tetap **Rp 0 (100% diterima utuh)**.
  - Fitur **Unduh / Cetak PDF** dan **Bagikan Laporan ke WhatsApp** menyertakan rincian potongan operasional dan nominal transfer bersih ke mitra secara transparan.

---

## 3. Hasil Pengujian & Kompilasi

| Lingkungan Pengujian | Perintah | Status | Hasil / Log |
|---|---|---|---|
| **Frontend Public** | `cmd /c npm run build` | **LULUS (100%)** | `✓ 2510 modules transformed, built in 30.09s, 0 error` |
| **Backend Functions** | `cmd /c npm run build` (`tsc`) | **LULUS (100%)** | `tsc exited with code 0, 0 error` |

---

## 4. Panduan Verifikasi Pengujian oleh User

### A. Pengujian Kendali Admin (Dashboard Admin)
1. Masuk ke **Dashboard Admin** $\rightarrow$ **Portal KostManager** (`/dashboard-admin/kostmanager`).
2. Klik tab **"Paket & Biaya"**.
3. Di bagian paling atas, periksa panel **"Pengaturan Biaya Layanan Platform KostManager"**:
   - Coba ubah persentase menggunakan chip preset (misal: klik `5%` atau `7.5%`).
   - Periksa bagian **Kalkulator Simulasi**: ubah nilai nominal sewa (misal: `Rp 2.000.000`) dan lihat perhitungan potongan serta transfer bersih mitra secara instan.
   - Klik **"Simpan Pengaturan Biaya"**, konfirmasi pop-up.
   - Periksa tabel **Riwayat Perubahan Tarif** di bagian bawah panel; entri perubahan baru akan tercatat.

### B. Pengujian Transparansi Mitra (Dashboard Mitra)
1. Buka **Dashboard Mitra** $\rightarrow$ menu **"Kost Saya"** (`/dashboard-mitra/properties`).
2. Pada kartu properti yang berstatus **KostManager**, klik tombol **"📄 Laporan Keuangan Kost"**.
3. Periksa rincian pendapatan:
   - Kartu statistik menampilkan total penerimaan bersih mitra setelah dipotong biaya operasional platform.
   - Di bawah rincian pos penerimaan, muncul baris rincian **"Potongan Layanan Platform KostManager (X%)"** dengan nominal potongan yang jelas.
4. Klik tombol **"Kirim ke WhatsApp"** atau **"Cetak / Unduh PDF"**:
   - Rincian teks WhatsApp dan dokumen cetak memuat transparansi potongan operasional platform dan total transfer bersih ke rekening mitra.
