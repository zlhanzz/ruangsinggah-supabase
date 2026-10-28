# Walkthrough - Progres #465: Standarisasi Siklus Sewa & Booking Proptech

Dokumen ini merangkum hasil implementasi audit dan standarisasi siklus sewa (*rental booking lifecycle*) berdasarkan standar industri proptech (Mamikos, Rukita, Airbnb) pada sistem RuangSinggah.

---

## 🌟 Ringkasan Perubahan

### 1. Batas Booking Dinamis (*Dynamic Advance Booking Window*)
- **Masalah Sebelumnya**: Tanggal masuk dipukul rata dapat dipesan hingga H+30 hari untuk semua paket sewa. Akibatnya, pemesanan sewa harian receh (misal Rp 100.000) yang dipesan 3 minggu ke depan berisiko memblokir kamar dari penyewa bulanan bernilai tinggi (konflik *yield management*).
- **Solusi**: Diterapkan fungsi dinamis `getAdvanceBookingLimitDays(period)` di [BookingModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/BookingModal.tsx):
  - **Harian**: Maksimal **H+5 hari** ke depan.
  - **Mingguan**: Maksimal **H+14 hari** ke depan.
  - **Bulanan / 3 Bulanan / 6 Bulanan**: Maksimal **H+30 hari** ke depan.
  - **Tahunan**: Maksimal **H+45 hari** ke depan.
  - Form tanggal masuk otomatis menyesuaikan (*auto-clamp*) rentang min-max ketika pengguna memilih/mengganti paket sewa.

### 2. Standarisasi Jam Check-in/Check-out & Estimasi Jam Kedatangan (ETA)
- **Realitas Operasional**: Kost harian tidak memiliki staf resepsionis 24 jam seperti hotel bintang 5.
- **Solusi**:
  - Ditetapkan aturan operasional baku untuk sewa harian: **Check-in mulai 14:00 WIB**, **Check-out maksimal 12:00 WIB**.
  - Dropdown **Estimasi Waktu Kedatangan (ETA)**:
    - `14:00 - 16:00 WIB (Normal Siang)`
    - `16:00 - 18:00 WIB (Sore Hari)`
    - `18:00 - 20:00 WIB (Malam Hari)`
    - `Di atas 20:00 WIB (Konfirmasi Khusus Penjaga Kost)`
  - Data ETA tersimpan di metadata pesanan dan diteruskan ke dashboard pemilik serta kartu hunian penyewa.

### 3. Kalkulasi Otomatis Tanggal Selesai (*Check-out Date*) & Progress 3 Langkah
- Menghitung secara otomatis tanggal keluar berdasarkan durasi paket sewa yang dipilih (Harian +1 hari, Mingguan +7 hari, Bulanan +1 bulan, dst.).
- Menampilkan kartu "Ringkasan Masa Sewa" (Tanggal Mulai, Jam Masuk, Tanggal Selesai, Jam Keluar).
- Menampilkan visual progress bar 3 langkah transaksi proptech:
  `1. Ajukan Sewa` $\rightarrow$ `2. Persetujuan Pemilik` $\rightarrow$ `3. Bayar Resmi`.

### 4. Siklus Sinkronisasi Sewa & Handover Kunci Fisik
- **Layanan Database ([userService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts))**:
  - `confirmCheckIn(targetId, role, notes)`: Mencatat serah terima kunci fisik (`actual_checkin_at`, `handover_confirmed: true`, `checked_in_by`), mengaktifkan status hunian ke `ACTIVE`.
  - `requestEarlyCheckIn(targetId, proposedDate, reason)`: Menyimpan pengajuan masuk lebih cepat oleh penyewa ke metadata.
  - `approveEarlyCheckIn(targetId, approvedDate)`: Memajukan tanggal masuk, otomatis menghitung ulang tanggal keluar (`end_date`), dan mengaktifkan status hunian.
- **Antarmuka Penyewa ([MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx))**:
  - *Upcoming Stay* (Belum Hari-H): Menampilkan jadwal masuk, ETA, dan tombol `[ ⚡ Masuk Lebih Cepat? ]` untuk mengajukan Early Check-in.
  - *Hari-H Masuk*: Menampilkan banner kesiapan dan tombol `[ 🔑 Sudah Tiba & Terima Kunci ]`.
  - *Sudah Serah Terima*: Menampilkan progress bar masa sewa aktif dan badge `✔️ Kunci Diterima`.
- **Antarmuka Pemilik Kost ([MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx))**:
  - Menampilkan badge ETA jam kedatangan calon penghuni di kartu pesanan.
  - Tombol `[ Serah Terima Kunci ]` untuk mencatat penyerahan kunci kamar fisik.
  - Tombol `[ ACC Masuk Lebih Awal ]` saat penyewa mengajukan perubahan tanggal masuk.

---

## 🔍 Hasil Pengujian & Verifikasi

1. **Frontend Compilation Build**:
   ```bash
   npm --prefix functions/public run build
   ```
   - **Hasil**: `✓ built in 36.31s` (Exit Code 0, 0 error).

2. **Backend Compilation Build**:
   ```bash
   npm --prefix functions run build
   ```
   - **Hasil**: `tsc` selesai 100% tanpa error (Exit Code 0).

3. **Kepatuhan Ikon**:
   - 100% menggunakan SVG murni dari `lucide-react` (`Calendar`, `Clock`, `Zap`, `CheckCircle2`, `Check`, `FileText`, dll.). 0% Google Fonts ligature.

---

## 🚀 Panduan Pengujian bagi Pengguna

1. **Uji Batas Booking Dinamis**:
   - Buka halaman Detail Kost, klik **"Ajukan Sewa"**.
   - Pilih paket **"Harian"**: Perhatikan bahwa kalender tanggal masuk dibatasi maksimal 5 hari ke depan (H+5), serta muncul info Check-in 14:00, Check-out 12:00, dan dropdown ETA.
   - Ganti paket ke **"Bulanan"**: Kalender otomatis membuka pilihan hingga 30 hari ke depan (H+30).
2. **Uji Konfirmasi Handover Kunci**:
   - Buka halaman **Kost Saya** (`/my-kost`).
   - Pada kartu kost yang sudah lunas:
     - Jika belum mencapai hari masuk: Muncul banner *Upcoming Stay* beserta tombol *Masuk Lebih Cepat?*.
     - Jika sudah hari masuk: Muncul banner *Hari Masuk Kost Telah Tiba!* dan tombol *Sudah Tiba & Terima Kunci*.
3. **Uji Pemilik Kost**:
   - Buka **Dashboard Mitra** tab Pesanan / Penghuni.
   - Perhatikan info ETA kedatangan serta tombol *Serah Terima Kunci* dan *ACC Masuk Lebih Awal*.
