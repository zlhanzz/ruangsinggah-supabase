# IMPLEMENTATION PLAN: Perbaikan Fase Masa Tunggu (Upcoming Stay) vs Sewa Berjalan & Eliminasi Glitch Countdown 60 Hari

## 1. Analisis Masalah & Kebutuhan (Root Cause Analysis)

### Masalah yang Ditemukan
User melaporkan temuan pengujian yang sangat penting:
> *"ketika sudah klik serah terima kunci langsung 30 hari lagi di countdownnya. 60 harian jika masih di fase masa tunggu"*

Berdasarkan investigasi menyeluruh pada alur data antara `KostDetail`, `PaymentGateway`, `adminService`, `userService:confirmCheckIn`, `MyKost.tsx`, dan `MitraTenantManagement.tsx`:

1. **Inkonsistensi Status & Badge pada Fase Masa Tunggu (`isUpcoming` / Pre-Arrival)**:
   - Saat transaksi sewa telah lunas (`PAID`), tetapi penyewa **belum tiba di kost / belum serah terima kunci** (jadwal masuk di masa mendatang, misal booking tgl 5 Nov sementara hari ini tgl 4 Nov):
     - Di `MyKost.tsx`, header kartu menampilkan badge hijau **`SEDANG DISEWA`** dan badge oranye **`61 HARI LAGI`**.
     - Di `MitraTenantManagement.tsx` (Dashboard Mitra), penghuni langsung masuk ke kategori tab **`SEWA AKTIF`** dengan **`SISA HARI: 62H`** dan selesai sewa **`5 Jan 2027`**.
   - Ini merupakan **kesalahan konseptual dan UX**:
     - Masa sewa belum dimulai (penyewa belum serah terima kunci dan tanggal masuk belum tiba).
     - Menghitung mundur sisa hari sewa dari `today` (hari ini) menuju tanggal selesai sewa adalah salah kaprah, karena masa sewa 30 hari baru boleh dikurangi setelah kunci diserahterimakan / tanggal mulai sewa tiba.

2. **Akar Penyebab Nilai 60-an Hari (`2027-01-04` / `total_months: 2`)**:
   - Pada saat pembayaran booking lunas, fungsi sinkronisasi sewa (`syncResidentStatus`) sempat mendeteksi record `resident_status` yang sudah ada (dari fase booking `PENDING` atau sesi sebelumnya).
   - Di logika lama sebelum sanitasi tuntas, alur sinkronisasi memperlakukan record tersebut layaknya perpanjangan sewa (`isExtension`), sehingga tanggal akhir sewa ditambahkan **+1 bulan lagi** di atas tanggal akhir yang sudah ada (`2026-12-04 + 1 bulan = 2027-01-04`, `total_months = 2`).
   - Akibatnya, `end_date` menjadi 2 bulan ke depan (sekitar 61-62 hari dari hari ini).
   - Namun, ketika user menekan tombol **"Sudah Tiba & Terima Kunci"** (serah terima kunci), fungsi `confirmCheckIn` di `userService.ts` dijalankan. Fungsi ini secara cerdas menghitung ulang durasi murni **1 bulan dari hari serah terima kunci** (`todayStr + 1 bulan = 2026-12-04`). Begitu tanggal diperbarui menjadi 1 bulan, countdown langsung terkoreksi menjadi **30 Hari Lagi**!

---

## 2. Komparasi & Evaluasi Standar Industri Objektif (Anti-Bias Konfirmasi)

Berdasarkan ketentuan Pasal 8 Protokol Workspace, berikut perbandingan objektif antara implementasi saat ini dengan standar industri platform proptech/hospitality global (Airbnb, Traveloka, Mamikos, Booking.com):

| Dimensi Evaluasi | Kondisi Saat Ini (Sebelum Perbaikan) | Standar Industri (Airbnb / Traveloka / Mamikos) | Status Standar | Alasan & Rekomendasi Tindakan |
| :--- | :--- | :--- | :--- | :--- |
| **Pemisahan Status Lifecycle Penghuni** | Menggabungkan masa tunggu ke dalam status `SEDANG DISEWA`, menampilkan countdown sewa sebelum tanggal masuk. | Memisahkan tegas 3 fase siklus: **Upcoming Stay (Menunggu Tanggal Masuk)**, **Active Stay (Sedang Dihuni)**, dan **Completed/Checked-Out**. | ⚠️ *Below Industry Standard* | Terapkan status khusus `MENUNGGU MASUK` pada header badge pesanan dan dashboard mitra selama `!isHandoverDone && isUpcoming`. |
| **Kalkulasi Countdown Hari** | Countdown `daysRemaining` dihitung dari `today` ke `end_date` tanpa mempedulikan apakah sewa sudah aktif berjalan atau masih pre-arrival. | Selama fase reservasi/masa tunggu, countdown yang ditampilkan adalah **Hitung Mundur Kedatangan** (misal: *Masuk Besok* atau *H-2 Menuju Masuk*). Countdown durasi sewa 30 hari baru aktif setelah check-in fisik. | ⚠️ *Below Industry Standard* | Di fase `isUpcoming`, sembunyikan countdown `N Hari Lagi` (atau ganti dengan badge `H-N Menuju Masuk`), dan baru aktifkan countdown sewa berjalan setelah serah terima kunci. |
| **Determinisme Durasi Sewa Awal (Initial Booking Guard)** | Berisiko terjadi penambahan bulan ganda jika sinkronisasi database dipicu berulang kali saat transaksi booking baru. | Idempotent transaction guard: Initial booking dikunci mati secara deterministik (`total_months = 1` untuk bulanan) tanpa terpengaruh record `resident_status` sebelumnya. | 🌟 *Industry Standard* (setelah perbaikan) | Perketat guard di `adminService.ts` dan `functions/src/index.ts` agar booking sewa baru (`kost_booking`) tidak pernah dapat dievaluasi sebagai `isExtension`. |
| **Sinkronisasi Tab Dashboard Mitra** | Penghuni masa tunggu langsung muncul di filter `SEWA AKTIF` mitra dengan hitungan hari yang melenceng. | Mitra melihat calon penghuni di badge `MENUNGGU MASUK` (Upcoming) dan tanggal mulai yang jelas, bukan `SEWA AKTIF`. | 🌟 *Industry Standard* (setelah perbaikan) | Sinkronkan filter dan label di `MitraTenantManagement.tsx` agar penghuni `isUpcoming` berlabel jelas `MENUNGGU MASUK`. |

---

## 3. Dampak Perubahan (Affected Files)

1. `functions/public/pages/MyKost.tsx`:
   - Memperbaiki rendering badge header pada kartu pesanan: Jika `!isHandoverDone && isUpcoming`, tampilkan badge **`MENUNGGU MASUK`** (oranye/amber) alih-alih `SEDANG DISEWA` (hijau).
   - Memperbaiki badge countdown waktu: Selama `!isHandoverDone && isUpcoming`, sembunyikan countdown sewa `N Hari Lagi` yang prematur, atau tampilkan hitung mundur kedatangan (misal: `Masuk dlm 1 hari` / `H-1`). Countdown masa sewa 30 hari hanya muncul ketika `isHandoverDone` atau masa sewa telah resmi berjalan.
2. `functions/public/adminService.ts`:
   - Mengunci deterministik durasi `kost_booking`: Pastikan `newTotalMonths = 1` dan `endDate = meta.endDate` secara mutlak untuk pembayaran sewa baru, mencegah penambahan bulan ganda.
3. `functions/public/components/mitra/MitraTenantManagement.tsx`:
   - Memastikan penghuni dalam status `isUpcoming` menampilkan badge status `MENUNGGU MASUK` (bukan `SEWA AKTIF`), dan durasi sewa menampilkan durasi paket yang dipesan (`1 Bulan`) tanpa sisa hari 60H yang membingungkan.
4. `functions/public/userService.ts`:
   - Memastikan kalkulasi `confirmCheckIn` dan `createBookingRequest` selalu konsisten dengan durasi paket sewa.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

### Langkah 1: Koreksi Logika Badge & Countdown di `MyKost.tsx`
- Tambahkan flag `isWaitingArrival = isPaid && !kost.is_checked_out && !isHandoverDone && isUpcoming`.
- Jika `isWaitingArrival` bernilai `true`:
  - Badge utama: Render badge oranye elegan `MENUNGGU MASUK` dengan ikon `Clock`/`Calendar`.
  - Badge countdown: Tampilkan countdown kedatangan yang presisi (misal: jika tanggal masuk besok, tampilkan `Masuk Besok` atau `H-1 Masuk`). Jangan tampilkan sisa sewa 60 hari.
- Jika sewa sudah berjalan (`isHandoverDone` atau `!isUpcoming`):
  - Badge utama: Render badge hijau `SEDANG DISEWA`.
  - Badge countdown: Render countdown masa sewa aktif (`30 Hari Lagi`).

### Langkah 2: Sanitasi Perhitungan di `MitraTenantManagement.tsx`
- Pastikan kartu penghuni di dashboard mitra mengecek `isUpcoming`.
- Jika penghuni belum serah terima kunci (`isUpcoming`):
  - Label status: `MENUNGGU MASUK` (warna amber/oranye).
  - Kolom sisa hari: Tampilkan estimasi tanggal masuk atau durasi paket (`1 Bulan`), bukan angka 60H/62H.

### Langkah 3: Penguatan Idempotensi di `adminService.ts`
- Pada fungsi `syncResidentStatus`, pastikan transaksi dengan tipe `kost_booking` tidak pernah membaca atau memperpanjang `existing.end_date`.
- Tanggal akhir sewa awal dikunci murni pada `meta.startDate + 1 bulan = meta.endDate`.

### Langkah 4: Uji Kompilasi & Build Frontend
- Jalankan `npm.cmd --prefix functions/public run build` untuk memastikan 0 error TypeScript / JSX.
- Catat riwayat di `functions/PROGRESS.md`.
- Buat laporan `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Kompilasi**: `npm run build` berhasil tanpa error (`0 errors`).
2. **Uji Tampilan MyKost (User View)**:
   - Saat status `Menunggu Tanggal Masuk`:
     - Header kartu menampilkan badge **`MENUNGGU MASUK`** (bukan `SEDANG DISEWA`).
     - Tidak ada lagi badge rancu `61 HARI LAGI`.
     - Subcard menampilkan: *Menunggu Tanggal Masuk: 05 November 2026* + tombol *Jadwalkan Lebih Cepat*.
   - Saat klik **Serah Terima Kunci** (Sewa Aktif Berjalan):
     - Header kartu beralih menjadi **`SEDANG DISEWA`** + **`30 HARI LAGI`**.
     - Subcard menampilkan: *Masa Sewa Berjalan (Hari ke-0 dari 30 Hari)*.
3. **Uji Dashboard Mitra (Owner View)**:
   - Calon penghuni sebelum serah terima kunci berstatus `MENUNGGU MASUK` dengan durasi paket `1 Bulan`.

---

> [!IMPORTANT]
> **Menunggu Persetujuan Pengguna (Approval Required)**:
> Sesuai Protokol Kerja Workspace Pasal 1 (Siklus Kerja 2-Fase), modifikasi kode **TIDAK AKAN DILAKUKAN** sebelum dokumen rencana ini ditinjau dan disetujui (*ACC / Proceed*) oleh User. Silakan tekan tombol persetujuan atau beri masukan revisi.
