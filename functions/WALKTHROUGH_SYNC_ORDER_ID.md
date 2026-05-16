# WALKTHROUGH: Order ID Synchronization & Consistency

## Daftar Perubahan

### 1. Backend (`functions/src/index.ts`)
*   **Database Persistence**: Setiap kali transaksi dibuat, ID resmi Midtrans (termasuk suffix unik) kini disimpan ke kolom `pakasir_order_id` di database Supabase.
*   **Extended Response**: Menambahkan `midtransOrderId` ke dalam respon API agar frontend dapat langsung memperbarui tampilan ID tanpa perlu refresh halaman.

### 2. Frontend (`public/components/PaymentGateway.tsx`)
*   **Dynamic ID Display**: Mengubah bagian header agar menggunakan `pakasir_order_id` dari server sebagai referensi utama.
*   **Real-time Update**: Saat user memilih metode pembayaran, ID di pojok kiri atas akan otomatis berubah dari ID internal (UUID) menjadi ID resmi Midtrans (misal: `550e8400...-123456`).

## Manfaat Sinkronisasi
1. **Rekonsiliasi Cepat**: Admin dapat langsung mencari transaksi di Dashboard Midtrans menggunakan ID yang disebutkan oleh user di WhatsApp/Email.
2. **Kejelasan Data**: Tidak ada lagi keraguan antara ID mana yang "asli" karena UI, Database, dan Midtrans kini merujuk pada satu set ID yang sama.
3. **Audit Trail**: Setiap entri di Supabase kini memiliki jejak ID Midtrans yang akurat di kolom `pakasir_order_id`.

## Petunjuk Deploy
Jalankan perintah berikut agar sinkronisasi ID aktif:
```bash
npm run build
firebase deploy --only functions
```
Cobalah melakukan transaksi baru dan perhatikan bagaimana ID di UI akan sinkron dengan ID di Dashboard Midtrans.
