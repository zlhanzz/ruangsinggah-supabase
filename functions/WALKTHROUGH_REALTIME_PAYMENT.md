# WALKTHROUGH: Deteksi Pembayaran Real-time

## Daftar Perubahan
1.  **Refaktor Logika Status Sukses**:
    - Menambahkan konstanta `PAID_STATUSES` yang mencakup: `PAID`, `SUCCESS`, `SETTLEMENT`, `CAPTURE`, dan `BERHASIL`.
    - Menggunakan konstanta ini di seluruh komponen `PaymentGateway.tsx` untuk memastikan konsistensi antara deteksi backend dan tampilan frontend.
2.  **Integrasi Supabase Realtime**:
    - Menggunakan `supabase.channel()` untuk membuat koneksi WebSocket ke tabel `transactions`.
    - Menambahkan filter spesifik berdasarkan `id` transaksi yang sedang aktif.
    - Begitu ada perubahan (UPDATE) di database, UI akan langsung merespon tanpa menunggu interval detik.
3.  **Mekanisme Fallback (Hybrid)**:
    - *Polling* tetap dipertahankan setiap 5 detik sebagai cadangan jika koneksi WebSocket terganggu atau tidak stabil.
    - Menambahkan logika pembersihan (*cleanup*) untuk menghentikan baik polling maupun realtime channel saat komponen di-unmount atau transaksi selesai.
4.  **Perbaikan UI Success State**:
    - Memperbaiki kondisi rendering yang sebelumnya hanya mengecek status `PAID`. Sekarang UI sukses akan muncul otomatis untuk status `SETTLEMENT` (yang sering dikirim oleh Midtrans).

## Hasil Pengujian
- **Real-time Detection**: Berhasil mendeteksi perubahan status secara instan di konsol log (`[DEBUG] Real-time status update: SETTLEMENT`).
- **UI Transition**: Layar otomatis berubah menjadi "Pembayaran Berhasil!" tanpa interaksi pengguna.
- **Auto-Sync**: Fungsi `syncResidentStatus` dan `syncSurveyRequest` otomatis terpicu setelah deteksi sukses.

## Petunjuk Deploy
1. Jalankan build frontend:
   ```bash
   cd functions/public
   npm run build
   ```
2. Pastikan variabel environment Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) sudah benar di hosting.
