# IMPLEMENTATION PLAN: Pembaruan Sistem Pengajuan Sewa Dinamis & Protokol Konfirmasi Check-in Standar Proptech

Dokumen ini adalah rencana implementasi komprehensif untuk menyempurnakan fitur pengajuan sewa (*booking submission*) agar memenuhi standar industri proptech modern (Mamikos, Rukita, Airbnb), mengoptimalkan pendapatan pemilik kost (*Yield Management Safeguard*), dan menyinkronkan pencatatan masa sewa sistem dengan fakta lapangan (*Check-in Handover Protocol*).

---

## 1. Analisis Masalah & Kebutuhan Berdasarkan Standar Industri

### A. Evaluasi Masalah Batas Pemesanan di Muka (*Advance Booking Window*)
1. **Risiko Fatal Menyamaratakan H-30 untuk Semua Paket**:
   - Jika paket **Sewa Harian** diizinkan dipesan hingga 30 hari ke depan (H-30), seorang tamu bisa memesan kamar untuk 1 hari di bulan depan seharga Rp 100.000. Akibatnya, kalender kamar terkunci dan pemilik kost kehilangan calon penyewa **Bulanan** senilai Rp 1.500.000 (*Opportunity Cost Loss*).
2. **Solusi Proptech: *Dynamic Advance Booking Window***:
   - **Harian**: Maksimal **H+5 hari** (Hanya untuk tamu yang butuh akomodasi mendesak / transit jangka pendek).
   - **Mingguan**: Maksimal **H+14 hari**.
   - **Bulanan (termasuk 3 & 6 Bulan)**: Maksimal **H+30 hari** (Standar umum pencari kost).
   - **Tahunan**: Maksimal **H+45 hari** (Perencanaan jangka panjang untuk mahasiswa/karyawan baru).

---

### B. Kebutuhan Waktu & Jam Check-in Khusus Sewa Harian
1. **Realitas Kost Berbeda dengan Hotel Bintang 5**:
   - Kost umumnya **tidak memiliki resepsionis 24 jam**. Penjaga kost atau pemilik memiliki jam istirahat malam dan gerbang sering digembok.
2. **Standardisasi Waktu Check-in / Check-out**:
   - Check-in baku: **Pukul 14:00 WIB**.
   - Check-out baku: **Pukul 12:00 WIB** (memberikan jeda 2 jam bagi tim *housekeeping* untuk membersihkan sprei & kamar).
3. **Input Estimasi Jam Tiba (*Estimated Time of Arrival / ETA*)**:
   - Khusus sewa Harian, wajib ada dropdown pemilihan perkiraan jam tiba:
     - `14:00 - 16:00 WIB`
     - `16:00 - 18:00 WIB`
     - `18:00 - 20:00 WIB`
     - `Di atas 20:00 WIB (Perlu konfirmasi khusus penjaga kost)`
   - Informasi ini masuk ke tiket booking dan obrolan otomatis agar penjaga kost siap menyambut dan menyerahkan kunci.

---

### C. Transparansi Tanggal Selesai (*Check-out Date*) & Format Tanggal Lokal
1. **Format Input Browser `mm/dd/yyyy` yang Membingungkan**:
   - Menggantikan tampilan mentah dengan preview label berformat bahasa Indonesia resmi (misal: *Senin, 10 November 2026*).
2. **Kalkulasi Otomatis Tanggal Berakhir (*Check-out Date*)**:
   - Ketika penyewa memilih paket sewa dan tanggal masuk, sistem secara instan menampilkan:
     - **Periode Sewa**: *10 Nov 2026 s/d 10 Des 2026* (1 Bulan) atau *10 Nov 2026 (14:00) s/d 11 Nov 2026 (12:00)* (1 Hari).
     - Menghilangkan ambiguitas kapan hak huni berakhir.

---

### D. Sinkronisasi Masa Sewa & Protokol Serah Terima Fisik (*Check-in Protocol*)
1. **Penetapan Awal Masa Sewa**:
   - Masa sewa dihitung berdasarkan **Tanggal Masuk (*Start Date*) yang disepakati**, bukan tanggal bayar atau tanggal approve.
2. **Kasus Datang Lebih Lambat (*Late Check-in*)**:
   - Masa sewa tetap berjalan sejak tanggal yang disepakati (kamar sudah di-*hold* khusus untuk penyewa tersebut).
3. **Kasus Datang Lebih Cepat (*Early Check-in*)**:
   - Jika penyewa tiba 2 hari lebih cepat dari jadwal, sistem menyediakan alur pengajuan pemajuan tanggal masuk (*Request Early Check-in*) yang dapat di-approve pemilik/penjaga kost secara instan di sistem.
4. **Tombol Serah Terima Kunci (*Handover Confirmation*)**:
   - Tombol konfirmasi fisik di sisi Penyewa (*"Saya Sudah Tiba & Terima Kunci"*) dan Pemilik (*"Serahkan Kamar & Kunci"*).
   - Fitur keselamatan (*safety net*): Auto check-in otomatis pada H+1 tanggal masuk jika kedua pihak lupa menekan tombol agar dana escrow pemilik dapat dicairkan.

---

### E. Edukasi Visual 3 Langkah Alur Sewa
- Menampilkan visual progress mini di dalam modal:
  1. `1. Ajukan Sewa` $\rightarrow$ `2. Persetujuan Pemilik Kost` $\rightarrow$ `3. Pembayaran Resmi Terlindungi`.

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
1. **`functions/public/components/BookingModal.tsx`**:
   - Penentuan batas maksimal tanggal dinamis (`maxDate`) berdasarkan paket (`harian`: +5, `mingguan`: +14, `bulanan`: +30, `tahunan`: +45).
   - Komponen input estimasi jam tiba (*Check-in ETA Dropdown*) khusus paket `harian`.
   - Kartu ringkasan sewa interaktif (*Lease Summary Card*) dengan kalkulasi otomatis `endDate` dan jam check-in/out.
   - Stepper edukasi alur transaksi 3-langkah.
   - Menggunakan ikon pure vector SVG `lucide-react` (`Calendar`, `Clock`, `ShieldCheck`, `AlertCircle`, `CheckCircle2`, `Info`).
2. **`functions/public/userService.ts` & `functions/public/types.ts`**:
   - Penambahan fungsi pembantu:
     - `confirmCheckIn(residentId, role)`: Menandai serah terima kunci dan mengaktifkan status hunian.
     - `requestEarlyCheckIn(residentId, newStartDate)`: Mengajukan pemajuan tanggal masuk.
     - `approveEarlyCheckIn(residentId)`: Menyetujui pemajuan tanggal masuk dan memperbarui `start_date` serta `end_date`.
3. **`functions/public/pages/MyKost.tsx`**:
   - Menampilkan status booking `UPCOMING` dengan countdown H-menuju tanggal masuk.
   - Tombol interaktif `[ 🔑 Konfirmasi Sudah Tiba & Terima Kunci ]`.
   - Modal aksi *Early Check-in* jika penyewa ingin masuk lebih awal dari jadwal.
4. **`functions/public/pages/MitraDashboard.tsx`**:
   - Tombol serah terima kunci bagi pemilik kost: `[ ✔️ Konfirmasi Serah Terima Kamar & Kunci ]`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Hanya Setelah di-ACC)

### Tahap 1: Penyempurnaan `BookingModal.tsx`
1. Hitung batasan tanggal dinamis:
   ```typescript
   const getAdvanceBookingLimitDays = (period: string): number => {
     switch (period) {
       case 'harian': return 5;
       case 'mingguan': return 14;
       case 'bulanan':
       case '3bulanan':
       case '6bulanan': return 30;
       case 'tahunan': return 45;
       default: return 30;
     }
   };
   ```
2. Reset/validasi otomatis nilai `startDate` jika berpindah ke paket dengan batas lebih ketat (misal dari bulanan ke harian).
3. Tambahkan state `checkInEta` (default: `'14:00 - 16:00'`) yang dirender hanya jika `selectedPeriod === 'harian'`.
4. Hitung `calculatedEndDate` secara reaktif dan sajikan kartu ringkasan sewa transparan:
   - Format: `Hari, DD MMMM YYYY` (Indonesia).
   - Jam harian: Masuk 14:00 WIB, Keluar 12:00 WIB.
5. Kemas payload `onConfirm` dengan menyertakan `checkInEta`, `endDate`, dan batas sewa.

### Tahap 2: Backend Handlers di `userService.ts`
1. Implementasikan `confirmCheckIn` untuk memperbarui status sewa menjadi `ACTIVE` dan mencatat `actual_checkin_at`.
2. Implementasikan alur `requestEarlyCheckIn` dan `approveEarlyCheckIn`.
3. Tambahkan logika safety net tanggal masuk.

### Tahap 3: Integrasi Antarmuka `MyKost.tsx` & `MitraDashboard.tsx`
1. Di halaman hunian penyewa (`MyKost.tsx`), buat kartu *Upcoming Stay* yang jelas dengan indikator kesiapan check-in.
2. Tambahkan tombol serah terima kunci di dashboard pemilik kost (`MitraDashboard.tsx`).

---

## 4. Rencana Verifikasi

1. **Uji Validasi Input Tanggal Booking**:
   - Pilih paket **Harian**: Verifikasi atribut `max` pada datepicker adalah H+5 hari.
   - Pilih paket **Bulanan**: Verifikasi atribut `max` berubah menjadi H+30 hari.
   - Pilih paket **Tahunan**: Verifikasi atribut `max` berubah menjadi H+45 hari.
2. **Uji Fitur Sewa Harian**:
   - Buka form paket Harian: Verifikasi muncul informasi check-in 14:00, check-out 12:00, dan dropdown pilihan jam tiba (ETA).
   - Pastikan pilihan ETA tersimpan dan terkirim dalam metadata booking.
3. **Uji Kalkulasi Tanggal Berakhir (*Check-out Date*)**:
   - Pilih tanggal 10 November 2026 pada paket Bulanan $\rightarrow$ Tanggal selesai otomatis terhitung 10 Desember 2026.
   - Pilih paket Harian $\rightarrow$ Tanggal selesai otomatis 11 November 2026 pukul 12:00 WIB.
4. **Uji Kompilasi Frontend & Backend**:
   - Jalankan `cmd.exe /c "npm --prefix functions/public run build"` $\rightarrow$ Wajib lulus 100% tanpa error.
   - Jalankan `cmd.exe /c "npm --prefix functions run build"` $\rightarrow$ Wajib lulus 100% tanpa error.
