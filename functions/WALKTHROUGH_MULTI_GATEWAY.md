# WALKTHROUGH: Sistem Multi-Gateway (Pakasir & Midtrans)

## Daftar Perubahan
Telah diimplementasikan sistem pemilihan gateway pembayaran yang dinamis, memungkinkan penggunaan Midtrans dan Pakasir secara berdampingan atau bergantian melalui konfigurasi terpusat.

### 1. Konfigurasi Terpusat di Backend (`functions/src/index.ts`)
*   **Parameter Baru**:
    *   `ACTIVE_GATEWAY`: Mengontrol gateway yang muncul di UI (`MIDTRANS`, `PAKASIR`, atau `BOTH`).
    *   `MIDTRANS_ENV`: Mengatur lingkungan Midtrans (`SANDBOX` atau `PRODUCTION`).
    *   `PAKASIR_API_KEY`: Keamanan API Key Pakasir kini dikelola melalui parameter fungsi.
*   **Endpoint Baru**: `getPaymentConfig` ditambahkan untuk memberitahu frontend gateway mana yang harus ditampilkan.

### 2. UI Pemilihan Gateway (`public/components/PaymentGateway.tsx`)
*   **Fitur**: Jika mode `BOTH` diaktifkan di backend, user akan melihat tab pilihan "Midtrans Gateway" dan "Pakasir Gateway".
*   **Integrasi**: 
    *   **Midtrans**: Menggunakan Snap Embed untuk pembayaran di dalam aplikasi.
    *   **Pakasir**: Mendukung pengalihan otomatis ke halaman checkout Pakasir atau menampilkan data pembayaran langsung (QRIS/VA) jika tersedia.

### 3. Dukungan Production Midtrans
*   Sistem kini siap beralih ke Production hanya dengan mengubah parameter `MIDTRANS_ENV` menjadi `PRODUCTION`.

## Cara Menggunakan (Untuk Admin)
Anda dapat mengatur gateway aktif melalui Firebase Functions Configuration:
*   `firebase functions:config:set payment.active_gateway="BOTH"`
*   `firebase functions:config:set payment.midtrans_env="SANDBOX"`

*(Catatan: Pastikan Anda menjalankan `npm run deploy` setelah mengubah konfigurasi parameter di `index.ts` agar perubahan kode terbaca)*

## Hasil Pengujian
1.  **Mode BOTH**: Tombol pilihan muncul, user bisa memilih metode favorit.
2.  **Mode Tunggal**: UI secara otomatis menyesuaikan hanya menampilkan gateway yang aktif.
3.  **Switching**: Perpindahan antar gateway berjalan mulus tanpa reload halaman.

## Petunjuk Deploy
```bash
npm run deploy
```
Pastikan semua parameter konfigurasi (API Keys) sudah terpasang di Firebase.
