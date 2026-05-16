# WALKTHROUGH: Refinement Payment UI (Native & Standalone QRIS)

## Daftar Perubahan

### 1. Backend (`functions/src/index.ts`)
*   **Standalone QRIS**: Mengubah kategori QRIS menjadi `none` agar dapat dipisahkan dari sistem accordion di frontend.
*   **Expansion E-Wallet**: Menambahkan registri resmi untuk **GoPay**, **OVO**, dan **DANA** ke dalam kategori E-Wallet, menyamai kelengkapan yang ada pada Snap Midtrans.
*   **Mapping Teknikal**: Memastikan semua metode E-Wallet baru (GoPay, OVO, DANA) diarahkan ke sistem QRIS dinamis di backend.
*   **Rename Card**: Mengubah label master menjadi **'Kartu Kredit / Debit'**.

### 2. Frontend (`public/components/PaymentGateway.tsx`)
*   **Premium QRIS Button**: QRIS kini tampil sebagai tombol tunggal besar di posisi teratas. Desainnya dibuat lebih menonjol dengan keterangan "Otomatis Terdeteksi" untuk memberikan kejelasan bagi user.
*   **Clean Accordion**: Mengatur ulang grup accordion agar hanya berisi Virtual Account, E-Wallet, Minimarket, dan Paylater.
*   **Smart Opening**: Mengatur kategori **Virtual Account** agar terbuka secara otomatis saat gateway dibuka, karena ini merupakan metode pembayaran paling umum.
*   **Aesthetic Labels**: Menghapus teks tambahan yang berlebihan pada nama bank dan metode agar UI terlihat lebih minimalis dan elegan.

## Hasil Transformasi Akhir
Sekarang user akan melihat tombol **QRIS** yang besar dan jelas di bagian paling atas, diikuti oleh pengelompokan bank dan e-wallet yang rapi di bawahnya. Pengalaman ini 100% menyerupai kecanggihan Snap Midtrans namun dengan identitas visual **ruangsinggah.id**.

## Petunjuk Deploy
Jalankan perintah berikut untuk mengaktifkan pembaruan tata letak ini:
```bash
npm run build
firebase deploy --only functions
```
Aplikasi Anda kini memiliki salah satu UI pembayaran tercanggih dan paling intuitif.
