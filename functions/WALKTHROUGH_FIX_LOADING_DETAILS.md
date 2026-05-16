# WALKTHROUGH: Perbaikan Loading & Unified UI Payment Gateway

## Daftar Perubahan

### 1. Backend (`functions/src/index.ts`)
*   **Item Details Persistence**: Menambahkan logika untuk menyimpan `item_details` (rincian biaya) ke dalam metadata transaksi. Hal ini memungkinkan frontend untuk menarik data komposisi pembayaran secara akurat.
*   **Fix Bug**: Memperbaiki deklarasi fungsi yang sempat rusak agar build kembali normal.

### 2. Frontend (`public/components/PaymentGateway.tsx`)
*   **Fix Loading Stuck**: Mengubah state `isProcessing` menjadi `false` segera setelah `window.snap.embed` dipanggil. Sebelumnya, loading menutupi UI Midtrans selamanya.
*   **Fitur Rincian Pembayaran**:
    *   Menambahkan tombol **"Lihat Rincian"** di header gateway.
    *   Menampilkan breakdown harga (misal: Sewa Pokok, Biaya Fasilitas, Pajak) agar transparan bagi penyewa.
*   **Unified UI Rendering**: 
    *   Menyembunyikan seluruh instruksi manual Pakasir (QRIS/VA custom) jika gateway yang aktif adalah Midtrans.
    *   Menghilangkan log error "[DEBUG] QR Data detected: empty" karena komponen QRIS tidak akan dirender jika datanya memang tidak ada/tidak diperlukan.
*   **Aesthetic Improvements**:
    *   Menambahkan pola latar belakang halus pada header.
    *   Menghaluskan transisi antar layar menggunakan Tailwind `animate-in`.
    *   Memperbaiki spacing dan border agar terlihat lebih premium.

## Hasil Pengujian (Simulasi)
1.  **Loading**: Saat memilih bank, loading muncul sejenak (0.5 detik) lalu langsung menampilkan UI Midtrans yang bersih.
2.  **Detail**: Mengklik "Lihat Rincian" membuka panel dropdown yang menunjukkan rincian biaya dari metadata.
3.  **Gateway Switch**: Jika backend di-set ke Pakasir, UI secara otomatis beralih ke instruksi manual tanpa ada sisa UI Midtrans.

## Petunjuk Deploy
Jalankan perintah berikut di folder `functions`:
```bash
npm run build
firebase deploy --only functions
```
Dan pastikan frontend telah di-build/deploy jika menggunakan hosting statis.
