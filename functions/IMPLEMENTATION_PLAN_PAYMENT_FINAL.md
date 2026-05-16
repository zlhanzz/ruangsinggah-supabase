# IMPLEMENTATION_PLAN - Optimalisasi Pembayaran Midtrans Professional

Dokumen ini merinci langkah-langkah untuk memperbaiki dan mengoptimalkan integrasi Midtrans Production agar lebih profesional, aman, dan memiliki alur (flow) yang mulus.

## Analisis Masalah
1.  **Alur E-Wallet (DANA/GoPay)**: Saat ini masih menggunakan QRIS statis atau Snap Popup yang kurang intuitif. Pengguna menginginkan redirect langsung ke aplikasi (mobile) atau portal web (desktop).
2.  **Metadata Pengguna Kosong**: Data profil pembayar (nama, nomor HP, alamat) tidak terkirim ke Midtrans, yang dapat menyebabkan transaksi ditolak (denied) oleh Risk Scanning Midtrans Production.
3.  **UI Kurang Terorganisir**: Metode pembayaran belum dikelompokkan dengan rapi dan masih menampilkan metode yang tidak profesional (seperti "Bank Lainnya").
4.  **Error Sinkronisasi**: Ditemukan file halaman utama (`Products.tsx` & `SurveyService.tsx`) yang kosong yang menyebabkan error aplikasi (sudah direstore via Git, perlu verifikasi).

## Dampak Perubahan
-   `functions/src/index.ts`: Logika backend untuk pemrosesan DANA (Snap Redirect) dan GoPay (Direct Charge Deeplink).
-   `functions/public/components/PaymentGateway.tsx`: UI pengelompokan metode, handling redirect otomatis, dan pengumpulan metadata.
-   `functions/public/pages/Products.tsx`: Penambahan pengiriman metadata profil user.
-   `functions/public/pages/SurveyService.tsx`: Penambahan pengiriman metadata profil user.
-   `functions/public/pages/KostDetail.tsx`: Penambahan pengiriman metadata profil user.
-   `functions/public/pages/MyKost.tsx`: Penambahan pengiriman metadata profil user (untuk pelunasan tagihan).

## Langkah-Langkah Eksekusi

### 1. Perbaikan Backend (Integritas Data & Flow)
-   Memastikan `MASTER_PAYMENT_METHODS` hanya berisi kanal Production aktif (BRI, BNI, Mandiri, BSI, Permata, CIMB, GoPay, DANA, QRIS, Alfamart, Indomaret).
-   Mengatur alur DANA agar menggunakan Snap Redirect dengan filter `enabled_payments`.
-   Mengatur alur GoPay agar menggunakan Core API Direct Charge dengan `callback_url` untuk mendapatkan deeplink.
-   Memperkuat ekstraksi profil user di backend sebagai fallback jika frontend tidak mengirimkan data lengkap.

### 2. Perbaikan UI (Professional Look & Feel)
-   Mengelompokkan metode ke dalam kategori: **Virtual Account (VA)**, **E-Wallet**, dan **Minimarket**.
-   Menghapus label "Bank Lainnya" dan sejenisnya.
-   Menampilkan instruksi pembayaran yang lebih spesifik (Tutorial).

### 3. Otomatisasi Redirect (Smooth Experience)
-   Pada mobile, jika memilih DANA/GoPay/ShopeePay, aplikasi akan mencoba melakukan redirect otomatis ke aplikasi terkait setelah mendapatkan respon dari server.
-   Menampilkan tombol "Buka Aplikasi" yang mencolok jika redirect otomatis terhambat browser.

### 4. Sinkronisasi Profil User
-   Memastikan semua komponen yang memanggil `PaymentGateway` menyertakan objek `metadata` yang berisi: `userName`, `userEmail`, `userPhone`, dan `userAddress`.

## Rencana Verifikasi
1.  **Uji Metadata**: Periksa log Firebase Functions untuk memastikan objek `customer_details` terisi lengkap saat memanggil API Midtrans.
2.  **Uji Deeplink**: Pastikan transaksi GoPay menghasilkan link `deeplink-redirect`.
3.  **Uji Snap DANA**: Pastikan transaksi DANA menghasilkan `redirect_url` Snap.
4.  **Uji UI**: Pastikan daftar pembayaran tampil berkelompok dan rapi tanpa logo grup yang mengganggu (sesuai permintaan user).
