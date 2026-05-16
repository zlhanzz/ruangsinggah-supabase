# WALKTHROUGH: Full Payment Expansion (Retail, E-Wallet, Paylater)

## Daftar Perubahan

### 1. Backend (`functions/src/index.ts`)
*   **Registri Lengkap**: Menambahkan 7+ metode pembayaran baru agar setara dengan Midtrans Snap Sandbox:
    *   **Retail**: Alfamart & Indomaret.
    *   **E-Wallet**: ShopeePay (dengan dukungan Deeplink).
    *   **Paylater**: Akulaku & Kredivo.
    *   **Card**: Kartu Kredit / Debit (dengan secure fallback).
*   **Logika Charge Baru**: Mengimplementasikan pemetaan `cstore` untuk minimarket dan `shopeepay` untuk integrasi e-wallet yang lebih dalam.

### 2. Frontend (`public/components/PaymentGateway.tsx`)
*   **Desktop-Optimized Grid**: Mengubah tampilan daftar bank menjadi 2 kolom pada layar komputer agar semua pilihan (10+) terlihat rapi tanpa banyak scroll.
*   **Native Retail UI**: Sekarang UI bisa menampilkan **"Kode Pembayaran"** untuk Alfamart/Indomaret secara native dengan tombol "Salin Kode".
*   **ShopeePay Deeplink**: Menambahkan tombol otomatis **"Buka Aplikasi Shopee"** yang akan muncul hanya jika user memilih ShopeePay, untuk mempercepat proses checkout di ponsel.
*   **Dynamic Extraction**: Sistem sekarang cerdas mencari `payment_code`, `bill_key`, atau `va_number` tergantung jenis pembayaran yang dipilih.

## Hasil Transformasi
Aplikasi Anda kini memiliki kapabilitas pembayaran yang setara dengan sistem Snap resmi Midtrans, namun tetap dalam balutan desain **ruangsinggah.id**. User dapat membayar di Alfamart, menggunakan kartu kredit, atau paylater dengan pengalaman yang mulus.

## Petunjuk Deploy
Jalankan perintah berikut untuk mengaktifkan semua metode pembayaran baru:
```bash
npm run build
firebase deploy --only functions
```
Pastikan untuk mengecek Dashboard Midtrans Anda untuk memastikan metode-metode tersebut (seperti Alfamart atau ShopeePay) sudah di-approve oleh pihak Midtrans.
