# IMPLEMENTATION PLAN: Dynamic Payment Method Registry

## Analisis Masalah
Saat ini, daftar metode pembayaran (BRI, BNI, QRIS, dll) didefinisikan secara statis (hardcoded) di dalam kode frontend. Hal ini menyulitkan pengelolaan karena:
1. Jika admin menonaktifkan salah satu bank di Dashboard Midtrans, frontend tidak tahu dan tetap menampilkannya.
2. Setiap ada perubahan metode, developer harus mengubah kode di sisi klien.

## Solusi: Backend-Driven Payment Methods
Kita akan memindahkan "Source of Truth" daftar metode pembayaran ke Backend.
1. **Registry Pusat**: Backend akan memiliki daftar lengkap metode yang didukung Midtrans beserta ikon dan warnanya.
2. **Dynamic Sync**: Frontend akan mengambil daftar ini saat inisialisasi gateway.
3. **Admin Control**: Daftar ini dapat difilter atau diatur melalui konfigurasi backend tanpa perlu menyentuh kode frontend lagi.

## Langkah-Langkah Eksekusi

### 1. Backend Update (`functions/src/index.ts`)
*   Definisikan `MIDTRANS_METHODS` yang berisi data lengkap (code, name, icon, color).
*   Perbarui endpoint `getPaymentConfig` untuk menyertakan daftar ini dalam responnya.
*   (Opsi Lanjutan) Menyiapkan struktur agar daftar ini bisa ditarik dari database di masa depan.

### 2. Frontend Update (`public/components/PaymentGateway.tsx`)
*   Hapus variabel statis `PAYMENT_METHODS`.
*   Tambahkan state `availableMethods` yang akan diisi dari hasil fetch `getPaymentConfig`.
*   Update komponen pemilihan metode agar menggunakan data dinamis tersebut.

## Rencana Verifikasi
1. Buka Gateway -> Pastikan daftar metode pembayaran muncul dengan benar.
2. Hapus salah satu metode di Backend -> Pastikan metode tersebut langsung hilang dari UI web tanpa redeploy frontend.
