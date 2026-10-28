# Walkthrough: Standarisasi Alur Pengajuan Sewa Proptech & Redesain On-Brand

**ID Progres**: #470  
**Status**: Selesai & Lulus Uji Kompilasi 100% (Frontend & Backend)  
**Tanggal**: 28 Oktober 2026  

---

## 📌 Ringkasan Pekerjaan

Sesuai audit menyeluruh terhadap praktik terbaik proptech modern (Mamikos, Rukita, Airbnb) serta masukan dari User mengenai perbaikan tampilan yang bebas dari kesan *"AI slop"*, pembaruan ini menyempurnakan:
1. **Dynamic Advance Booking Window**: Batas reservasi dinamis berdasarkan durasi sewa untuk mencegah konflik *yield management* (booking harian receh memblokir sewa bulanan).
2. **Aturan Waktu & Dropdown ETA Check-in Harian**: Ketentuan baku check-in 14:00 & check-out 12:00 serta input estimasi jam tiba (*ETA*) karena kost tidak memiliki resepsionis 24 jam.
3. **Kalkulasi Otomatis Tanggal Check-out**: Perhitungan transparan tanggal keluar hunian secara real-time.
4. **Sinkronisasi Check-in Fisik & Early Check-in**: Fungsi pencatatan tanggal kedatangan riil penyewa di database dan alur pengajuan jika datang lebih awal.
5. **Redesain Visual On-Brand RuangSinggah**: Menggantikan 4 kartu pastel acak dengan *Unified Booking Spec Sheet* monokromatik, merapikan tombol aksi, menyeimbangkan radius kartu, dan memperbaiki posisi FAB TimeSimulator agar tidak menutupi tombol sewa di layar ponsel.

---

## 🛠️ Daftar Perubahan File

### 1. [BookingModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/BookingModal.tsx)
- **Dynamic Max Booking Date**:
  - Harian: Maksimal H+5 hari ke depan.
  - Mingguan: Maksimal H+14 hari ke depan.
  - Bulanan: Maksimal H+30 hari ke depan.
  - Tahunan: Maksimal H+45 hari ke depan.
- **Badge Edukasi Batas Booking**: Ditampilkan berdampingan dengan pemilih tanggal masuk (*"Maks. booking H+5 hari untuk sewa harian"*).
- **Banner Check-in 14:00 & Check-out 12:00**: Muncul otomatis khusus sewa harian.
- **Dropdown Perkiraan Jam Tiba (ETA)**:
  - Pilihan jam 08:00 s/d 22:00 WIB serta opsi `> 22:00 (Malam / Butuh Koordinasi Khusus)`.
- **Kalkulator Tanggal Check-out**: Menghitung tanggal selesai sewa otomatis berdasarkan paket & durasi yang dipilih.

### 2. [userService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)
- `confirmCheckIn(bookingId)`: Konfirmasi kedatangan penyewa & serah terima kunci, mencatat `actual_check_in_date` dan `key_handed_over: true` di database Supabase.
- `requestEarlyCheckIn(bookingId, requestedDate, notes)`: Pengajuan penyewa untuk mempercepat tanggal masuk.
- `approveEarlyCheckIn(bookingId, newStartDate)`: Persetujuan mitra/pemilik kost untuk memajukan tanggal sewa dan menyesuaikan tanggal berakhir sewa secara otomatis.

### 3. [MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx)
- **Unified Booking Spec Sheet**:
  - Menghapus 4 kartu pastel acak (oranye, biru, ungu, kuning) yang terkesan *"AI slop"*.
  - Menggantinya dengan satu kontainer spesifikasi sewa monokromatik on-brand (`bg-slate-50/90 border-slate-200/80`) dengan grid 4 parameter (Paket Sewa, Rencana Masuk, Penghuni, dan Estimasi Tagihan).
- **Redesain Tombol Aksi**:
  - Tombol chat diubah dari gradien pelangi `from-emerald-600 to-teal-600` menjadi **solid emerald proptech** (`bg-emerald-600 hover:bg-emerald-700`) yang tegas dan bersih.
  - Tombol `Detail Kost` dan `Rute Lokasi` menggunakan secondary outline terstandar.
  - Tombol `Batalkan Pengajuan` dirapikan dengan padding presisi tanpa visual agresif.
- **Penyelarasan Notice Bar SLA**:
  - Banner edukasi respon pemilik 1x24 jam disederhanakan dengan border halus dan teks ringkas.
- **Keseimbangan Corner Radius**:
  - Mengubah radius kartu dari `rounded-3xl sm:rounded-[3rem]` menjadi `rounded-2xl sm:rounded-[2rem]` yang proporsional.

### 4. [TimeSimulator.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/TimeSimulator.tsx)
- **Eliminasi Tumpang Tindih Tombol di Mobile**:
  - Mengubah ukuran FAB pada mobile dari 56px menjadi **44px** (`w-11 h-11 sm:w-14 sm:h-14`).
  - Menggeser posisi FAB ke `bottom-28 right-3.5` dengan lapisan `z-40` agar tidak menutupi tombol kartu sewa di bawahnya.

---

## 🧪 Hasil Verifikasi Kompilasi

1. **Frontend Production Build (`functions/public`)**:
   ```
   ✓ 2512 modules transformed.
   ✓ built in 44.01s
   Exit Code: 0 (Sukses tanpa error)
   ```
2. **Backend Cloud Functions Build (`functions`)**:
   ```
   > tsc
   Exit Code: 0 (Sukses tanpa error)
   ```

---

## 📋 Panduan Verifikasi Pengguna di UI

1. **Uji Batas Booking Dinamis (*Dynamic Advance Window*)**:
   - Buka halaman detail kost apa saja dan klik tombol **Ajukan Sewa**.
   - Pilih paket **Harian**: Perhatikan kalender pemilih tanggal dibatasi maksimal H+5 dari hari ini, dengan badge *"Maks. booking H+5 hari"*.
   - Ubah ke paket **Bulanan**: Kalender pemilih tanggal otomatis memperluas batas hingga H+30 hari.
2. **Uji Info Jam Check-in & Dropdown ETA**:
   - Pada paket **Harian**, lihat banner ketentuan waktu check-in (14:00) dan check-out (12:00).
   - Pilih dropdown **Perkiraan Jam Tiba** (misal: `14:00 - 16:00 (Sore)`).
   - Perhatikan rincian kalkulasi tanggal check-out yang dihitung transparan.
3. **Uji Tampilan Menu Kost Saya (Tab Diajukan)**:
   - Kunjungi menu **Kost Saya** pada tab **Diajukan**.
   - Lihat kartu pengajuan:
     - Tidak ada lagi kartu kotak-kotak pastel 4 warna acak; digantikan oleh **Unified Booking Spec Sheet** yang bersih dan on-brand.
     - Tombol aksi chat kini berwarna hijau emerald solid yang konsisten dengan identitas RuangSinggah.
     - Perhatikan posisi tombol bulat TimeSimulator di pojok kanan bawah yang kini rapi dan tidak menghalangi tombol sewa di layar ponsel.
