# IMPLEMENTATION PLAN: Penyelarasan Tombol Pra-Masuk (Jadwalkan Lebih Cepat vs Terima Kunci) & Penguncian Lapor Kendala pada Fase Menunggu Masuk

## 1. Analisis Masalah & Kebutuhan

### A. Konteks Masalah
Berdasarkan tinjauan alur penyewaan aktif pada halaman Orders (`MyKost.tsx`) dan tangkapan layar pengguna:
1. **Tombol "Lapor Kendala Kamar" Masih Aktif di Fase Menunggu Masuk**:
   - Saat ini, tombol "Lapor Kendala Kamar" aktif selama transaksi berstatus `PAID` tanpa memeriksa apakah penghuni sudah tiba / menerima kunci (`isHandoverDone`).
   - Secara logika operasional, calon penghuni yang belum menerima kunci dan belum menempati kamar fisik tidak mungkin dapat atau diizinkan melaporkan kerusakan fasilitas kamar kost (misal: keran bocor, AC rusak, lampu mati).
2. **Tombol "Jadwalkan Lebih Cepat" dan "Terima Kunci & Masuk" Terpisah dan Tampil Bersamaan**:
   - Di banner atas, terdapat tombol `[⚡ JADWALKAN LEBIH CEPAT]`.
   - Di daftar aksi bawah (sidebar), tombol hijau `[✓ TERIMA KUNCI & MASUK]` juga muncul secara bersamaan, padahal tanggal check-in masih 6 hari lagi (10 November 2026, sedangkan hari ini 04 November 2026).
   - Pengguna meminta agar kedua tombol ini **bukan tombol terpisah yang muncul bersamaan**, melainkan **satu tombol kontekstual yang bergantian (alternating)**:
     - **Sebelum Hari H Masuk (H-N)**: Tombol yang muncul adalah **"JADWALKAN LEBIH CEPAT"**. Tombol "Terima Kunci & Masuk" **TIDAK MUNCUL**.
     - **Di Hari H Masuk yang Disepakati (Hari H)**: Tombol otomatis berganti menjadi **"TERIMA KUNCI & MASUK"**. Tanggal ini bisa berasal dari tanggal booking awal atau tanggal percepatan yang telah disetujui (di-ACC) oleh pemilik kost.
3. **Penyelarasan Durasi Sewa 1 Bulan (`end_date`)**:
   - Pada kartu sewa, durasi sewa tertulis "1 Bulan" (Mulai 10 Nov 2026), namun tanggal selesai sewa tertulis "09 Januari 2027" (2 bulan) akibat sisa nilai `end_date` pada database `resident_status`. Perlu disinkronkan agar `end_date` secara akurat mencerminkan tepat 1 bulan (10 Des 2026).

---

## 2. Komparasi & Evaluasi Standar Industri Objektif (Anti-Bias Konfirmasi)

Mengacu pada Pasal 8 Aturan Baku Workspace:

| Dimensi | Solusi Saat Ini (Sebelum Perbaikan) | Pendekatan Solusi yang Direncanakan | Klasifikasi Standar Industri | Alasan Teknis & Rekomendasi Terbaik |
| :--- | :--- | :--- | :--- | :--- |
| **Alur Check-in & Lifecycle Hunian** | Tombol check-in ("Terima Kunci") dan tombol reschedule ("Jadwalkan Lebih Cepat") muncul bersamaan di dua tempat terpisah sejak H-N jauh hari | Mengadopsi pola *Linear State-Driven Action Slot* (seperti Airbnb Trips & Traveloka Hotel Check-in): Hanya menampilkan satu aksi utama yang relevan sesuai timeline (Reschedule saat H-N, Check-in saat Hari H) | 🌟 **Setara Standar Industri (*Industry Standard*)** | Menghilangkan beban kognitif (*cognitive load*) pengguna dan mencegah kesalahan klik konfirmasi serah terima kunci sebelum penghuni benar-benar tiba di lokasi. |
| **Proteksi Tiket Kendala (Issue Management)** | Form lapor kendala dapat dikirim kapan saja meskipun kunci fisik belum diserahterimakan | Mengunci tombol "Lapor Kendala Kamar" dengan status disabled dan tooltip penjelas "Tersedia setelah serah terima kunci & masuk" | 🚀 **Lebih Maju dari Standar Industri (*Ahead of Industry Standard*)** | Mencegah *spam ticket* dan laporan fiktif pada sistem pengelola kost, menjamin bahwa hanya penghuni yang sudah resmi menempati kamar yang dapat mengajukan komplain fasilitas. |
| **Integritas Data Tanggal & Durasi** | Tanggal selesai sewa membaca kolom mentah `r.end_date` yang sempat terdistorsi 2 bulan | Menyelaraskan kalkulasi `endDate` agar konsisten dengan `start_date` dan `duration` paket sewa 1 bulan | 🌟 **Setara Standar Industri (*Industry Standard*)** | Menjamin transparansi dan akurasi informasi finansial/jadwal bagi pengguna sesuai durasi yang dibayar. |

---

## 3. Dampak Perubahan (Scope & Affected Files)

- **File yang Dimodifikasi:**
  - `functions/public/pages/MyKost.tsx`
- **Tingkat Risiko:** Sangat Rendah (*Non-Breaking & Non-Destructive*).
  - Logika transisi tombol murni berbasis waktu (`todayNorm` vs `checkInNorm`) dan status serah terima kunci (`isHandoverDone`).
  - Fungsi submit kendala dan modal reschedule yang sudah ada dipertahankan 100%.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

### Langkah 1: Penyelarasan Tombol Kontekstual Bergantian
1. Hitung status waktu masuk:
   ```typescript
   const agreedStartDate = startDateObj; // Tanggal masuk awal atau tanggal lebih cepat yang sudah di-ACC
   const isBeforeCheckInDay = Boolean(agreedStartDate && todayNorm.getTime() < startNorm.getTime());
   const isCheckInDayOrAfter = Boolean(agreedStartDate && todayNorm.getTime() >= startNorm.getTime());
   ```
2. Pada banner atas kartu pesanan (`isWaitingArrival`):
   - Jadikan banner murni informatif yang elegan:
     - Jika sebelum Hari H (`isBeforeCheckInDay`): Tampilkan informasi "MENUNGGU TANGGAL MASUK", tanggal check-in yang disepakati, dan badge countdown kedatangan (`Masuk dlm N hari` / `Masuk Besok`).
     - Jika sudah Hari H (`isCheckInDayOrAfter`): Tampilkan informasi "HARI MASUK KOST TELAH TIBA! Siap Check-in", "Silakan serah terima kunci fisik dengan pemilik/penjaga kost."
3. Pada slot aksi utama sidebar (menggantikan posisi tombol `Terima Kunci & Masuk` saat ini):
   - **Jika `!isHandoverDone && isBeforeCheckInDay` (Masih Jauh Hari)**:
     - Jika sedang menunggu ACC mitra (`isEarlyRequested`): Tampilkan tombol/badge informatif disabled `[🕒 Menunggu Persetujuan Masuk Tgl DD/MM/YYYY]`.
     - Jika belum mengajukan: Tampilkan tombol oranye **`[⚡ JADWALKAN LEBIH CEPAT]`** yang memicu `handleOpenEarlyCheckInModal`.
     - Tombol "Terima Kunci & Masuk" **100% TIDAK MUNCUL**.
   - **Jika `!isHandoverDone && isCheckInDayOrAfter` (Sudah Hari H)**:
     - Tombol otomatis berganti menjadi tombol hijau emerald **`[✓ TERIMA KUNCI & MASUK]`** yang memicu `handleConfirmTenantCheckIn`.
     - Tombol "Jadwalkan Lebih Cepat" **100% TIDAK MUNCUL**.
   - **Jika `isHandoverDone` (Sudah Terima Kunci)**:
     - Kedua tombol check-in/reschedule hilang dan status beralih ke masa sewa berjalan.

### Langkah 2: Penguncian Tombol "Lapor Kendala Kamar"
1. Perbarui tombol "Lapor Kendala Kamar" di sidebar:
   ```typescript
   const canReportComplaint = isPaid && !kost.is_checked_out && isHandoverDone;
   ```
2. Jika `!isHandoverDone`:
   - Tombol dirender dalam kondisi `disabled` dengan styling abu-abu lembut (`bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed`).
   - Tampilkan sub-teks helper kecil di bawahnya: `Selesaikan terima kunci terlebih dahulu` (serupa dengan tombol Ulasan).
3. Di dalam fungsi handler `handleOpenComplaint`:
   - Tambahkan proteksi guardrail: jika `!isHandoverDone`, tampilkan pesan edukatif bahwa kendala kamar hanya dapat dilaporkan setelah menerima kunci kamar dan check-in.

### Langkah 3: Sanitasi Data Durasi & Selesai Sewa
1. Pastikan pemetaan `endDate` pada Kost Ryuta menghitung 1 bulan penuh secara presisi dari `start_date` (`2026-11-10` s/d `2026-12-10`) jika durasi sewa yang dipilih adalah 1 bulan.
2. Perbarui baris record `resident_status` pengujian di Supabase agar `end_date: 2026-12-10` dan `total_months: 1` sinkron dengan `metadata`.

### Langkah 4: Kompilasi, Pencatatan Progres, dan Push
1. Jalankan `npm.cmd --prefix functions/public run build` (wajib 0 error).
2. Catat pencapaian Milestone #492 di `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
3. Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Kasus 1: Fase Pra-Masuk (H-6, Hari Ini: 04 Nov, Mulai Masuk: 10 Nov)**:
   - Buka kartu Kost Ryuta di tab "AKTIF".
   - Verifikasi bahwa tombol di sidebar adalah **`[⚡ JADWALKAN LEBIH CEPAT]`**.
   - Verifikasi bahwa tombol **`[✓ TERIMA KUNCI & MASUK]` TIDAK MUNCUL**.
   - Verifikasi bahwa tombol **`[🔧 LAPOR KENDALA KAMAR]` BERSTATUS NONAKTIF / DISABLED** dengan keterangan *"Selesaikan terima kunci terlebih dahulu"*.
2. **Uji Kasus 2: Simulasi Hari H (Ubah Tanggal Masuk Menjadi Hari Ini / Waktu Live >= 10 Nov)**:
   - Verifikasi tombol otomatis berganti dari "Jadwalkan Lebih Cepat" menjadi **`[✓ TERIMA KUNCI & MASUK]`**.
   - Tombol "Jadwalkan Lebih Cepat" tidak muncul lagi.
3. **Uji Kasus 3: Setelah Konfirmasi Terima Kunci**:
   - Klik "Terima Kunci & Masuk".
   - Verifikasi kartu berubah ke masa sewa berjalan (`KUNCI DITERIMA`).
   - Verifikasi tombol **`[🔧 LAPOR KENDALA KAMAR]` KINI AKTIF** dan dapat diklik untuk mengisi form laporan kendala.
