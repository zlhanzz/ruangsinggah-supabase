# IMPLEMENTATION PLAN: Deteksi Pembayaran Real-time (Supabase Realtime)

## 1. Analisis Masalah
Saat ini, `PaymentGateway.tsx` menggunakan mekanisme *polling* setiap 5 detik untuk mendeteksi perubahan status transaksi. 
- **Delay**: Pengguna harus menunggu hingga 5 detik setelah pembayaran diverifikasi oleh webhook untuk melihat perubahan di UI.
- **Inkonsistensi Logika**: Logika *polling* sudah mengenali berbagai status sukses (`SETTLEMENT`, `CAPTURE`, dll), namun logika *rendering* UI hanya mengecek status `PAID` secara eksplisit, yang menyebabkan UI tidak berubah meskipun transaksi sudah sukses di database (jika statusnya bukan tepat `PAID`).
- **User Experience**: Pengguna menginginkan feedback instan begitu pembayaran terdeteksi.

## 2. Dampak Perubahan
- **`functions/public/components/PaymentGateway.tsx`**: 
    - Penambahan `SUCCESS_STATUSES` sebagai konstanta standar.
    - Implementasi `supabase.channel()` untuk mendengarkan perubahan pada tabel `transactions` secara real-time.
    - Perbaikan kondisi rendering pada baris ~659.

## 3. Langkah-Langkah Eksekusi
1.  **Definisikan Konstanta Status**: 
    Memindahkan daftar status sukses ke konstanta di luar komponen atau di bagian atas file agar dapat digunakan kembali.
2.  **Tambah Subscription Real-time**: 
    Dalam `useEffect`, buat *channel* Supabase yang memfilter perubahan (UPDATE) pada tabel `transactions` berdasarkan `id` yang sedang diproses.
3.  **Update State Instan**: 
    Ketika pesan realtime diterima dengan status sukses, langsung jalankan fungsi sukses (update `currentOrder`, panggil `onPaymentSuccess`, dll).
4.  **Perbaikan Rendering**: 
    Ubah kondisi `{currentOrder?.status?.toUpperCase() === 'PAID'}` menjadi fungsi pengecekan yang lebih luas (misal: `isPaid(currentOrder?.status)`).

## 4. Rencana Verifikasi
1.  **Uji Simulasi**: Gunakan fitur simulasi admin (jika tersedia di UI) untuk mengubah status transaksi di database.
2.  **Monitor Network**: Pastikan WebSocket Supabase terhubung (`wss://...`).
3.  **Uji Fallback**: Matikan koneksi internet sebentar lalu nyalakan lagi untuk memastikan *polling* tetap bekerja jika Realtime gagal.
