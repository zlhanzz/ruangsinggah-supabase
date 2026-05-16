# IMPLEMENTATION PLAN: Sistem Multi-Gateway (Pakasir & Midtrans)

## Analisis Masalah
User ingin memiliki fleksibilitas untuk memilih gateway pembayaran yang aktif (Pakasir atau Midtrans) serta beralih antara mode Sandbox dan Production untuk Midtrans. Saat ini, konfigurasi masih bersifat hardcoded atau terpencar.

## Solusi
1.  **Sentralisasi Konfigurasi (Backend)**:
    *   Tambahkan parameter konfigurasi baru di Firebase Functions:
        *   `ACTIVE_GATEWAY`: Pilihan gateway yang diizinkan (`MIDTRANS`, `PAKASIR`, atau `BOTH`).
        *   `MIDTRANS_ENV`: Mode Midtrans (`SANDBOX` atau `PRODUCTION`).
        *   `PAKASIR_API_KEY`: Memindahkan API Key Pakasir ke parameter aman.
2.  **API Konfigurasi**:
    *   Buat endpoint `getPaymentConfig` yang mengembalikan status gateway aktif ke frontend.
3.  **Frontend (PaymentGateway.tsx)**:
    *   Modifikasi UI untuk mendukung pemilihan gateway jika mode `BOTH` aktif.
    *   Integrasikan logika `createPakasirPayment` ke dalam `PaymentGateway.tsx` agar user bisa beralih tanpa meninggalkan halaman.
    *   Gunakan URL Snap Production/Sandbox sesuai konfigurasi dari backend.

## Dampak Perubahan
1.  `functions/src/index.ts`: Menambah parameter dan endpoint baru.
2.  `public/components/PaymentGateway.tsx`: Menambah pilihan gateway dan logika fleksibel.

## Langkah-Langkah Eksekusi
1.  **Backend Config**:
    *   Update `defineString` untuk parameter baru.
    *   Update `getMidtransSnap` agar membaca `MIDTRANS_ENV`.
    *   Buat fungsi `getPaymentConfig`.
2.  **Frontend Logic**:
    *   Panggil `getPaymentConfig` saat inisialisasi.
    *   Jika gateway terpilih adalah Pakasir, panggil `createPakasirPayment`.
    *   Tampilkan tab atau tombol pilihan jika kedua gateway diizinkan.

## Rencana Verifikasi
1.  Ubah `ACTIVE_GATEWAY` menjadi `PAKASIR` -> Cek apakah Midtrans hilang dari UI.
2.  Ubah `ACTIVE_GATEWAY` menjadi `BOTH` -> Cek apakah muncul opsi untuk memilih.
3.  Ubah `MIDTRANS_ENV` menjadi `PRODUCTION` -> Pastikan Snap menggunakan client key production.
