# Rencana Implementasi: Mengaktifkan Sistem Kunjungan (Views), CTR, dan Tren Kunjungan Riil di Dashboard Mitra

## 1. Analisis Masalah & Kebutuhan
- **Pertanyaan & Kebutuhan Pengguna**:
  > *"pada dashboard mitra, bisa nggak sih data seperti kunjungan, ctr, dan trend kunjungan berfungsi?"*
- **Kondisi Saat Ini**:
  1. **Kunjungan (Views)**: Kartu stat membaca `propsData.reduce((a, p) => a + (p.views || 0), 0)`. Namun saat ini belum ada mekanisme pelacakan (*view tracker*) yang mencatat kunjungan ketika calon penyewa membuka halaman detail kost di `KostDetail.tsx`, sehingga angkanya selalu 0.
  2. **CTR (Click-Through Rate)**: Bergantung pada total views kost. Karena views masih 0, CTR selalu 0%.
  3. **Tren Kunjungan (7 Hari Terakhir)**: Logika pembuatan data grafik 7 hari pada `MitraDashboard.tsx` (baris 504–515) saat ini salah mengambil nominal rupiah `dayRevenue` dari transaksi booking (bukan data kunjungan views harian), dan jika tidak ada transaksi harian, grafiknya menjadi datar di 0.
- **Tujuan Pengembangan**:
  - Mengaktifkan pelacakan kunjungan riil (*real-time view tracking*) setiap kali halaman detail kost dibuka oleh pengunjung.
  - Menghitung CTR secara dinamis berdasarkan perbandingan jumlah aksi/interaksi calon penyewa (booking + chat inquiry) terhadap total kunjungan.
  - Memfungsikan grafik **Tren Kunjungan 7 Hari Terakhir** agar memetakan data kunjungan harian yang nyata secara presisi.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/userService.ts` | Membuat fungsi `trackPropertyView(propertyId, currentUserId)` untuk menambah counter `views` dan mencatat riwayat kunjungan harian per tanggal (`metadata.daily_views`). |
| `functions/public/pages/KostDetail.tsx` | Memanggil `trackPropertyView` saat halaman detail kost dimuat oleh pengunjung (dengan pencegahan spam refresh via `sessionStorage`). |
| `functions/public/pages/MitraDashboard.tsx` | 1. Memperbaiki sumber data grafik **Tren Kunjungan** agar membaca data kunjungan harian 7 hari terakhir (`daily_views`).<br>2. Mengaktifkan kalkulasi **Kunjungan** dan **CTR** dinamis secara real-time. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Buat Fungsi Pelacakan Kunjungan di `userService.ts`
- Implementasikan `trackPropertyView(propertyId: string, viewerUid?: string)`:
  - Cek `sessionStorage` (`viewed_kost_${propertyId}`) untuk mencegah double count saat refresh berulang dalam 1 sesi.
  - Ambil data properti saat ini, lakukan increment pada `views = (views || 0) + 1`.
  - Catat distribusi tanggal harian pada `metadata.daily_views[YYYY-MM-DD] = (count || 0) + 1`.
  - Simpan perubahan ke tabel `properties` di Supabase.

### Langkah 2: Integrasikan Pelacakan Kunjungan di `KostDetail.tsx`
- Pada `useEffect` inisialisasi detail kost:
  - Jika properti berhasil dimuat dan pengunjung bukan pemilik kost tersebut (`user?.uid !== kost.ownerUid`), panggil `trackPropertyView(kost.id, user?.uid)`.

### Langkah 3: Sinkronisasi dan Perbaiki Visualisasi di `MitraDashboard.tsx`
- **Total Kunjungan**: Akumulasi `views` dari semua kost milik mitra.
- **CTR**: Formula $\text{CTR} = \frac{\text{Total Interaksi (Bookings + Chat Inquiries)}}{\max(1, \text{Total Kunjungan})} \times 100\%$.
- **Tren Kunjungan 7 Hari**:
  - Iterasi 7 hari ke belakang (misal: Min, Sen, Sel, Rab, Kam, Jum, Sab).
  - Ambil total kunjungan dari semua properti mitra pada masing-masing tanggal dari `metadata.daily_views`.
  - Tampilkan tren kurva naik-turun yang nyata dan informatif di `AreaChart`.

### Langkah 4: Build & Validasi
- Jalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi dan sinkronisasi ke folder `dist` dan `public`.
- Commit ke `bukan-productions`, merge ke `main`, dan push ke GitHub `origin main`.

---

## 4. Rencana Verifikasi

1. **Uji Pelacakan Kunjungan**:
   - Buka halaman katalog $\rightarrow$ Buka salah satu halaman Detail Kost sebagai pencari kost / pengunjung umum.
   - Buka Dashboard Mitra $\rightarrow$ Angka **Kunjungan** bertambah secara akurat.
2. **Uji Kalkulasi CTR**:
   - Pastikan persentase CTR terhitung proporsional terhadap interaksi sewa & kunjungan.
3. **Uji Grafik Tren Kunjungan**:
   - Grafik 7 Hari Terakhir memvisualisasikan jumlah view pada hari terkait dengan tooltip jumlah kunjungan yang akurat.
