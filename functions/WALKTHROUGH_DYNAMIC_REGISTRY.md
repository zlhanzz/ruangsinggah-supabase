# WALKTHROUGH: Dynamic Payment Registry (Admin Controlled)

## Daftar Perubahan

### 1. Backend (`functions/src/index.ts`)
*   **Centralized Registry**: Membuat konstanta `MASTER_PAYMENT_METHODS` yang menampung daftar bank dan metode pembayaran resmi.
*   **Dynamic Config Delivery**: Memperbarui endpoint `getPaymentConfig` agar mengirimkan daftar metode pembayaran aktif ke frontend. Kini Anda cukup mengedit file `index.ts` di backend untuk menambah, menghapus, atau mengubah urutan bank yang muncul di aplikasi.

### 2. Frontend (`public/components/PaymentGateway.tsx`)
*   **Data Driven UI**: Menghapus daftar bank yang diketik manual (hardcoded). UI sekarang sepenuhnya bergantung pada data yang dikirim oleh server.
*   **Auto-Sync**: Saat halaman pembayaran dibuka, aplikasi akan otomatis menyesuaikan tombol yang muncul dengan konfigurasi terbaru dari backend.
*   **Improved Grid**: Mengoptimalkan tampilan daftar metode pembayaran agar tetap rapi dan premium saat jumlah metode bertambah.

## Hasil Pengujian
1. **Verifikasi**: Saat aplikasi dibuka, tombol BRI, BNI, Mandiri, dan QRIS muncul sesuai daftar di backend.
2. **Fleksibilitas**: Jika admin ingin menonaktifkan "BCA VA", admin cukup menghapusnya dari array di `index.ts` dan melakukan deploy backend. Frontend akan otomatis menyembunyikan tombol tersebut.

## Petunjuk Deploy
Jalankan perintah berikut untuk menerapkan pembaruan registri:
```bash
npm run build
firebase deploy --only functions
```
Setelah deploy selesai, segarkan (refresh) halaman aplikasi untuk melihat perubahan pada daftar metode pembayaran.
