# WALKTHROUGH: Midtrans White-Label (Native UI)

## Daftar Perubahan

### 1. Backend (`functions/src/index.ts`)
*   **Core API Integration**: Menambahkan helper `getMidtransCoreApi()` untuk berkomunikasi langsung dengan sistem Midtrans tanpa melalui UI Snap.
*   **Direct Charge Logic**: Mengubah `createMidtransPayment` agar melakukan request `charge` langsung ke Midtrans saat user memilih bank atau QRIS.
*   **Mapping Otomatis**:
    *   **Bank VA**: BRI, BNI, BCA, CIMB Niaga kini menghasilkan nomor VA langsung.
    *   **Mandiri Bill**: Menggunakan format `echannel` (bill_key & biller_code).
    *   **Permata VA**: Menggunakan format `permata_va_number`.
    *   **QRIS/GoPay/OVO**: Menghasilkan `qr_string` dinamis yang dapat di-scan.

### 2. Frontend (`public/components/PaymentGateway.tsx`)
*   **Eliminasi Iframe Snap**: Sistem tidak lagi menampilkan iframe Midtrans yang tumpang tindih. Sebagai gantinya, data dari Midtrans ditangkap dan ditampilkan menggunakan desain asli **ruangsinggah.id**.
*   **Unified Instruction Component**:
    *   **QRIS Section**: Secara otomatis mendeteksi `qr_string` dari Midtrans dan mengubahnya menjadi gambar QR Code yang bisa di-scan.
    *   **VA Section**: Menampilkan nomor VA, kode perusahaan (untuk Mandiri), dan instruksi bayar dengan desain premium yang konsisten.
*   **Smart Fallback**: Jika suatu metode belum didukung oleh Core API, sistem akan otomatis kembali (fallback) ke Snap sebagai pengaman, sehingga pembayaran tidak akan pernah gagal.

## Hasil Transformasi
| Fitur | Sebelum (Snap) | Sesudah (White-Label) |
| --- | --- | --- |
| **Aestetik** | Kotak Midtrans (Biru/Putih) di dalam UI RS | 100% Desain RuangSinggah |
| **Loading** | Double loading (RS + Midtrans) | Single, fast loading |
| **UX** | Terasa seperti website pihak ketiga | Terasa seperti fitur internal RS |
| **Data QRIS** | Tidak bisa dicustom | Ukuran & gaya QR bisa kita atur |

## Petunjuk Deploy
Jalankan perintah berikut untuk menerapkan perubahan ke Cloud Functions:
```bash
npm run build
firebase deploy --only functions
```
Pastikan frontend juga di-deploy agar perubahan UI dapat dinikmati pengguna.
