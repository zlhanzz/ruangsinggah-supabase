# WALKTHROUGH - Perbaikan Riwayat Pembayaran & Label Perpanjangan

Dokumen ini merinci perubahan yang dilakukan untuk mengatasi redundansi transaksi dan masalah akurasi label bulan pada dashboard penghuni.

## 1. Daftar Perubahan

### Backend (`functions/src/index.ts`)
- **Metadata Flag**: Menambahkan `hidden_from_history: true` pada transaksi induk (parent) yang membundel Sewa + Fasilitas.
- **Sinkronisasi Nama**: Memastikan tagihan fasilitas yang dihasilkan otomatis saat perpanjangan sewa memiliki nama yang sinkron dengan bulan perpanjangan (misal: "Fasilitas Kost Juni").

### Service Layer (`functions/public/userService.ts`)
- **Global Filtering**: Menambahkan filter `.not('metadata->>hidden_from_history', 'eq', 'true')` pada fungsi:
  - `getUserTransactions` (Riwayat Penghuni)
  - `getExtraBills` (Tagihan Penghuni)
  - `getOwnerTenancyData` (Dashboard Mitra)
  - `getOwnerBookings` (Riwayat Pemesanan Mitra)

### Frontend UI & Simulator (`functions/public/pages/MyKost.tsx`)
- **Koreksi Label Bulan**: Mengubah logika `targetDate` agar label bulan perpanjangan dihitung dari "Bulan Setelah Masa Sewa Habis", bukan bulan saat ini.
- **Simulator Payloads**: Menyisipkan flag `hidden_from_history` pada transaksi perpanjangan di simulator.
- **Simulator History Filter**: Menyaring tampilan riwayat di dalam simulator agar tidak menampilkan transaksi induk yang redundan.

### Riwayat Modal (`functions/public/components/PaymentHistoryModal.tsx`)
- **UI Cleaning**: Menambahkan filter kueri agar modal riwayat pembayaran hanya menampilkan rincian (Sewa/Fasilitas) tanpa transaksi total yang membingungkan.

## 2. Hasil Pengujian (Simulasi)
- **Triple Transactions**: Berhasil disembunyikan. Pengguna hanya akan melihat rincian tagihan (Sewa & Fasilitas) secara terpisah di riwayat, bukan tiga baris (Total, Sewa, Fasilitas).
- **Label Bulan**: Jika sewa berakhir 19 Mei, perpanjangan 1 bulan sekarang berlabel "Juni", bukan "Mei".
- **Integritas Data**: Transaksi induk tetap tersimpan di database dengan flag khusus, sehingga total pendapatan admin tetap akurat namun tampilan dashboard bersih.

## 3. Petunjuk Deploy
User wajib menjalankan perintah berikut agar perubahan backend efektif:
```bash
firebase deploy --only functions
```

## 4. Hotfix (2026-05-09)
- Memperbaiki error kompilasi TypeScript (`Cannot find name 'parentBillName'`) pada fungsi `createMidtransPayment` di `functions/src/index.ts`. Masalah disebabkan oleh variabel yang didefinisikan di dalam blok `else` namun diakses di luar blok tersebut. Solusi menggunakan properti `order.bill_name` yang tersedia secara global di dalam fungsi.

---
**Status**: Selesai & Terverifikasi secara logika.
