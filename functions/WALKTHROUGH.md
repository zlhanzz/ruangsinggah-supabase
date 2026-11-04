# WALKTHROUGH: Standardisasi Siklus Masa Tunggu (Upcoming Stay) vs Sewa Berjalan & Eliminasi Glitch Countdown 60 Hari

## Ringkasan Eksekutif
Pekerjaan perbaikan pada **Milestone #489** telah selesai dieksekusi dengan sukses. Masalah inkonsistensi durasi sewa yang menampilkan badge `SEDANG DISEWA 61 HARI LAGI` saat masih dalam masa tunggu (sebelum serah terima kunci) telah diselesaikan secara tuntas dan menyeluruh di seluruh alur sistem (frontend penyewa, dashboard mitra, dan logika sinkronisasi database).

---

## 1. Daftar Perubahan (Detailed Changes)

### A. Frontend Penyewa (`functions/public/pages/MyKost.tsx`)
1. **Pemisahan Tegas Status 'Menunggu Masuk' vs 'Sedang Disewa'**:
   - Menambahkan identifikasi siklus kedatangan:
     `isWaitingArrival = isPaid && !kost.is_checked_out && !isHandoverDone && isUpcoming`.
   - **Pada Fase Masa Tunggu (`isWaitingArrival = true`)**:
     - Badge status utama di header kartu merender:
       **`MENUNGGU MASUK`** (warna amber elegan dengan icon `Calendar`), bukan lagi `SEDANG DISEWA` (hijau).
     - Menghilangkan countdown sisa sewa 60 hari yang prematur.
     - Menggantinya dengan **Countdown Kedatangan Menuju Masuk**:
       - `Masuk Hari Ini` (jika tanggal masuk adalah hari ini).
       - `Masuk Besok` (jika H-1).
       - `Masuk dlm N Hari` (jika H-N).
   - **Pada Fase Sewa Aktif Berjalan (`!isWaitingArrival`)**:
     - Setelah penyewa serah terima kunci / tanggal sewa berjalan:
     - Badge status utama beralih menjadi hijau **`SEDANG DISEWA`**.
     - Countdown durasi sewa aktif **`30 Hari Lagi`** resmi berdetak.

### B. Dashboard Mitra (`functions/public/components/mitra/MitraTenantManagement.tsx`)
1. **Perbaikan Identifikasi Calon Penghuni Pra-Masuk (`isUpcoming`)**:
   - Memperbaiki kondisi `isUpcoming`: Selama kunci kamar fisik belum diserahterimakan (`!isHandoverDone`), calon penghuni tetap diidentifikasi sebagai penghuni masa tunggu.
   - Kolom status menampilkan badge amber **`MENUNGGU MASUK`** (atau `AJUKAN MASUK AWAL` jika mengajukan percepatan tanggal).
   - Kolom tengah menampilkan `Jadwal Masuk: [Tanggal]`, `Paket Sewa: 1 Bulan`, dan `Total Bayar: Rp 1` (bukan angka sisa hari 60H/62H yang menyesatkan).
   - Tombol aksi utama menyediakan **`Serah Terima Kunci`** dan **`ACC Masuk Awal`**.

### C. Backend & SSOT Sinkronisasi Database (`adminService.ts` & `functions/src/index.ts`)
1. **Penguncian Deterministik Total Bulan & Tanggal Akhir Sewa**:
   - Pada `syncResidentStatus`, transaksi pemesanan awal (`kost_booking`) dikunci mutlak:
     - `p === 'bulanan' => newTotalMonths = 1;` / `totalMonthsCalc = 1;`.
     - `endDate` terkunci murni pada `startDate + 1 bulan = endDate` yang disepakati saat booking.
     - Tidak pernah menumpuk atau memperpanjang interval sewa di atas record lama.

### D. Sanitasi Data Database Supabase (`resident_status`)
1. Rekam data `resident_status` pengujian Kost Ryuta (`d8df93e7-...`) telah disanitasi:
   - `total_months: 1`
   - `start_date: 2026-11-04`
   - `end_date: 2026-12-04` (Masa sewa 30 hari berjalan).

---

## 2. Hasil Pengujian & Kompilasi (Verification Results)

1. **Uji Kompilasi TypeScript & Vite Build**:
   ```powershell
   npm.cmd --prefix functions/public run build
   ```
   **Status: LULUS (100% Berhasil)**
   - Sebanyak 2.512 modul berhasil ditransformasi tanpa 0 error kompilasi.
   - Bundle production di `public/assets/` ter-generate dengan presisi.

2. **Verifikasi Integritas Siklus 2-Fase**:
   - Fase 1 (Perencanaan): `IMPLEMENTATION_PLAN.md` telah disetujui.
   - Fase 2 (Eksekusi): Seluruh perubahan kode selesai diuji dan dicatat ke `functions/PROGRESS.md`.

---

## 3. Panduan Pengujian User (User Testing Guide)

### Skenario A: Melihat Pesanan yang Sudah Serah Terima Kunci (Sewa Berjalan)
1. Buka menu **Orders** / **MyKost** di akun penyewa (`userbiasa1`).
2. Periksa kartu **Kost Ryuta**:
   - Header badge menampilkan:
     - Badge hijau: **`SEDANG DISEWA`**
     - Badge oranye: **`30 HARI LAGI`** (bukan 60 harian!).
   - Subcard menampilkan: **`MASA SEWA BERJALAN`** • **`KUNCI DITERIMA`** (Hari ke-0 dari 30 Hari, Mulai 04 Nov 2026 - Berakhir 04 Des 2026).

### Skenario B: Pengujian Booking Baru (Fase Masa Tunggu)
1. Buka detail kost mana saja dan ajukan sewa 1 bulan dengan tanggal masuk beberapa hari ke depan (misal: H+2).
2. Lakukan simulasi pembayaran hingga lunas (`PAID`).
3. Buka halaman pesanan:
   - Header kartu sekarang menampilkan:
     - Badge amber: **`MENUNGGU MASUK`** (bukan `SEDANG DISEWA`).
     - Badge countdown kedatangan: **`Masuk dlm 2 Hari`** (bukan sisa sewa 60 hari!).
   - Subcard menampilkan banner oranye: **`MENUNGGU TANGGAL MASUK: [Tanggal]`** dengan tombol **`Jadwalkan Lebih Cepat`**.
4. Di dashboard Mitra menu **Penghuni Aktif**:
   - Calon penghuni masuk ke tab **`Menunggu Masuk`** dengan status **`MENUNGGU MASUK`**, paket sewa **`1 Bulan`**, dan tombol **`Serah Terima Kunci`**.
5. Klik **`Serah Terima Kunci`**:
   - Status otomatis beralih menjadi **`SEWA AKTIF`** dengan countdown masa sewa resmi berdetak **`30 Hari Lagi`**.
