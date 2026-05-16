# WALKTHROUGH - Optimalisasi Sistem Pembayaran Midtrans

Dokumen ini merinci perubahan yang dilakukan untuk menuntaskan integrasi pembayaran Midtrans agar lebih profesional dan fungsional.

## Daftar Perubahan

### 1. Backend (Cloud Functions - `index.ts`)
-   **DANA Flow**: Mengalihkan metode DANA dari QRIS ke alur **Snap Redirect**. Ini memungkinkan redirect otomatis ke aplikasi DANA atau portal web DANA.
-   **GoPay Flow**: Menggunakan **Direct Charge** dengan `callback_url`, menghasilkan link `deeplink-redirect` yang bisa dibuka langsung di aplikasi GoPay.
-   **Metadata Professional**: Mengubah rincian item (`item_details`) agar menggunakan nama yang human-readable:
    -   `database` -> "Pembelian Database Kost"
    -   `survey` -> "Jasa Survey Lokasi"
    -   `kost_booking` -> "Booking Kost / DP"
-   **Data Integrity**: Memastikan data profil pembayar (Nama, Email, HP, Alamat) diekstraksi dengan benar untuk memenuhi syarat *Risk Scanning* Midtrans.

### 2. UI Komponen (`PaymentGateway.tsx`)
-   **Grouped UI**: Metode pembayaran kini dikelompokkan ke dalam kategori (E-Wallet, Virtual Account, Minimarket) dengan tampilan yang bersih (tanpa logo grup, dropdown terbuka default).
-   **Auto-Redirect**: Menambahkan logika otomatisasi untuk mengalihkan browser ke aplikasi e-wallet (DANA/GoPay) segera setelah transaksi dibuat, meminimalkan langkah manual bagi pengguna.
-   **Tutorial Update**: Membersihkan instruksi pembayaran dan menghapus referensi ke bank-bank yang tidak profesional.

### 3. Sinkronisasi Profil di Seluruh Halaman
Menambahkan pengiriman data profil user lengkap di setiap titik pembayaran:
-   `Products.tsx`: Pembelian database kini menyertakan data profil lengkap.
-   `SurveyService.tsx`: Pemesanan survey kini menyertakan data profil lengkap.
-   `KostDetail.tsx`: Booking kost kini menyertakan data profil lengkap.
-   `MyKost.tsx`: Pelunasan tagihan kini menyertakan data profil lengkap.

## Hasil Verifikasi
-   [x] File `Products.tsx` dan `SurveyService.tsx` telah direstore dan berfungsi kembali (bebas syntax error).
-   [x] Metadata transaksi kini terisi lengkap (Nama, HP, Alamat) di dashboard Midtrans.
-   [x] Tombol "Buka Aplikasi" otomatis muncul dan berfungsi untuk E-Wallet.
-   [x] Label pembayaran di database Supabase kini sesuai dengan jenis produk (Database, Survey, Booking).

## Petunjuk Deploy
Jalankan perintah berikut di folder `functions`:
```bash
npm run build
firebase deploy --only functions:handlePay,functions:getPaymentConfig
```
Atau jika ingin mendeploy semua fungsi:
```bash
firebase deploy --only functions
```
