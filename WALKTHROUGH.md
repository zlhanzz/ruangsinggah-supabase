# Walkthrough - Progres 318: Aktivasi Sistem Pelacakan Kunjungan (Views), CTR, dan Tren Kunjungan Riil di Dashboard Mitra

## Ringkasan Perubahan
Mengaktifkan dan menghubungkan seluruh sistem analitik performa kost di Dashboard Mitra secara riil:
1. **Kunjungan (Views)**: Otomatis bertambah saat halaman detail kost dibuka oleh pengunjung/calon penyewa, lengkap dengan mekanisme *anti-spam session*.
2. **CTR (Click-Through Rate)**: Terhitung dinamis berdasarkan perbandingan interaksi calon penyewa (booking + chat inquiry) terhadap total views.
3. **Tren Kunjungan 7 Hari Terakhir**: Grafik kurva `AreaChart` kini memetakan data kunjungan harian (`daily_views`) yang nyata per hari (Min, Sen, Sel, Rab, Kam, Jum, Sab).

---

## Detail Perubahan File & Arsitektur

### 1. `functions/public/userService.ts`
- **Pembaruan `incrementPropertyView(propertyId, viewerUid)`**:
  - Menggunakan `sessionStorage` (`viewed_kost_${propertyId}`) agar pengguna yang merefresh halaman berulang-ulang dalam satu sesi browser tidak melipatgandakan jumlah kunjungan secara tidak wajar.
  - Memeriksa `owner_uid` properti agar kunjungan pemilik kost sendiri tidak ikut dihitung (*owner view exclusion*).
  - Menyimpan akumulasi counter `views` dan mencatat riwayat per tanggal ke `metadata.daily_views[YYYY-MM-DD]`.
  - Melakukan *auto-pruning* otomatis untuk log harian yang lebih dari 60 hari agar ukuran metadata tetap efisien.

### 2. `functions/public/pages/KostDetail.tsx`
- Mengirimkan `user?.uid` pada fungsi pelacakan saat detail kost dimuat oleh pengunjung.

### 3. `functions/public/pages/MitraDashboard.tsx`
- **Kalkulasi Total Kunjungan**:
  ```tsx
  const totalViews = propsData.reduce((a, p) => a + (p.views || 0), 0);
  ```
- **Kalkulasi CTR Real-time**:
  ```tsx
  const totalInteractions = bookingsData.length + nonKmChatSessions.length;
  const computedCtr = totalViews > 0 
      ? parseFloat(((totalInteractions / totalViews) * 100).toFixed(1)) 
      : 0;
  ```
- **Grafik Tren Kunjungan 7 Hari Terakhir**:
  - Mengambil data kunjungan per tanggal (`dateKey`) dari `metadata.daily_views` seluruh properti milik mitra selama 7 hari terakhir.
  - Menampilkan tooltip interaktif *"{X} Views (Kunjungan)"* pada kurva biru `AreaChart`.

---

## Hasil Pengujian & Kompilasi

1. **Kompilasi Root Build (`npm run build`)**:
   - **Lulus 100% (✓ 2509 modules transformed, built in 46.22s, 0 error)**.
   - Seluruh direktori (`public/`, `dist/`, dan `functions/public/dist/`) ter-update dengan asset terbaru.

---

## Panduan Pengujian

1. **Uji Kunjungan Riil**:
   - Buka halaman Beranda / Cari Kost $\rightarrow$ Buka salah satu properti milik Mitra dari browser/mode Incognito atau akun lain.
   - Buka Dashboard Mitra (`/dashboard-mitra`).
   - **Hasil**:
     - Stat **KUNJUNGAN** bertambah.
     - Stat **CTR** menampilkan persentase rasio interaksi yang proporsional.
     - Grafik **Tren Kunjungan 7 Hari Terakhir** menampilkan titik kurva naik pada hari kunjungan terkait.
