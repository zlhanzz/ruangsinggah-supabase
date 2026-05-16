# IMPLEMENTATION PLAN: Order ID Synchronization

## Analisis Masalah
Terjadi diskoneksi visual antara ID yang tampil di aplikasi, ID di database, dan ID di Midtrans:
1. **UI** menampilkan ID statis/prop yang tidak update.
2. **Database** menyimpan UUID mentah.
3. **Midtrans** menerima ID dengan suffix (timestamp) untuk menghindari duplikasi.

Hal ini menyulitkan proses rekonsiliasi manual oleh Admin karena ID yang dicari di Midtrans tidak cocok dengan yang ada di UI atau database utama.

## Solusi: Unified Order ID
1. **Database Persistence**: Kita akan memastikan `midtrans_order_id` (ID yang lengkap dengan suffix) disimpan secara eksplisit ke kolom `pakasir_order_id` di database Supabase segera setelah transaksi dibuat.
2. **UI Sync**: Frontend akan diubah agar menampilkan `pakasir_order_id` (ID Resmi Midtrans) sebagai referensi utama bagi user.
3. **Consistency**: Dengan ini, ID yang dilihat user di layar, ID yang dicari admin di Midtrans Dashboard, dan ID di database akan 100% SAMA.

## Langkah-Langkah Eksekusi

### 1. Backend Update (`functions/src/index.ts`)
*   Pastikan variabel `midtransOrderId` dikirim kembali ke frontend dalam objek response.
*   Pastikan database mengupdate kolom `pakasir_order_id` dengan nilai `midtransOrderId` tersebut untuk setiap transaksi (baik via Snap maupun Core API).

### 2. Frontend Update (`public/components/PaymentGateway.tsx`)
*   Tambahkan state atau logika untuk menangkap `midtransOrderId` dari response backend.
*   Update bagian Header UI agar menampilkan ID dari Midtrans tersebut (misal: `ORDER-123-456789`) alih-alih ID internal UUID yang membingungkan.

## Rencana Verifikasi
1. Lakukan transaksi baru.
2. Cek UI -> Catat ID yang muncul (misal: `ORDER-ABC-123456`).
3. Cek Dashboard Midtrans -> Cari ID tersebut, harus ADA dan COCOK.
4. Cek Database Supabase -> Kolom `pakasir_order_id` harus berisi ID yang sama.
