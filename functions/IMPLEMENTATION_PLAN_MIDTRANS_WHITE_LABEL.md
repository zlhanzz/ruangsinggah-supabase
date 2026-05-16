# IMPLEMENTATION PLAN: Midtrans White-Label (Core API Bridge)

## Analisis Masalah
Saat ini, integrasi Midtrans menggunakan **Snap Embed**, yang menampilkan UI Midtrans di dalam kotak (iframe) pada UI RuangSinggah. Hal ini membuat pengalaman pengguna terasa terputus ("UI di dalam UI"). User menginginkan data dari Midtrans (nomor VA, QRIS) ditampilkan langsung menggunakan desain premium **ruangsinggah.id**.

## Solusi: Core API Integration
Kita akan beralih dari Snap API ke **Midtrans Core API (Charge API)**.
1.  **Direct Charge**: Saat user memilih metode pembayaran di UI RuangSinggah, backend akan melakukan request `charge` langsung ke Midtrans.
2.  **Mapping Data**: Backend akan mengembalikan data mentah (misal: `va_number` untuk Bank, `qr_string` untuk QRIS) ke frontend.
3.  **Native UI Rendering**: Frontend akan menampilkan data tersebut menggunakan komponen RuangSinggah yang sudah ada (blok QRIS dan blok VA), sehingga tampilan konsisten 100%.

## Langkah-Langkah Eksekusi

### 1. Backend Update (`functions/src/index.ts`)
*   Refaktor `createMidtransPayment` untuk menerima parameter `paymentMethod`.
*   Implementasikan pemanggilan ke endpoint Midtrans `/v2/charge`.
*   Handle berbagai tipe pembayaran:
    *   `qris`: Untuk GoPay/ShopeePay/QRIS lainnya.
    *   `bank_transfer`: Untuk BRI, BNI, Mandiri, Permata, dll.
    *   `cstore`: Untuk Indomaret/Alfamart (jika diperlukan).
*   Simpan metode pembayaran yang dipilih ke database `transactions.payment_method`.

### 2. Frontend Update (`public/components/PaymentGateway.tsx`)
*   Ubah `handlePay` agar tidak lagi menggunakan `window.snap.embed`.
*   Terima `directPayment` dari hasil integrasi Midtrans yang baru.
*   Update state `directData` dengan informasi VA atau QRIS dari Midtrans.
*   Hapus `snap-container` untuk memberikan ruang penuh bagi UI RuangSinggah.
*   Pastikan alur "Ganti Metode" tetap berfungsi untuk kembali ke menu pilihan.

### 3. Verifikasi & Polishing
*   Pastikan nomor VA yang muncul adalah resmi dari Midtrans.
*   Pastikan QRIS yang muncul bisa di-scan oleh aplikasi pembayaran (GoPay, OVO, dll).
*   Pastikan status pembayaran tetap ter-update otomatis via webhook.

## Rencana Verifikasi
1.  Pilih BRI VA -> Pastikan nomor VA muncul di UI RuangSinggah (bukan di kotak Midtrans).
2.  Pilih QRIS -> Pastikan gambar QR muncul di UI RuangSinggah.
3.  Cek Database -> Pastikan kolom `payment_method` terisi sesuai pilihan user.
