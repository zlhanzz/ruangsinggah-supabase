# IMPLEMENTATION PLAN: Integrasi UI & Visibilitas Status Email

## Analisis Masalah
User kesulitan melihat log pengiriman email (Brevo) karena modal Midtrans Snap menutupi seluruh layar (overlay fullscreen). Selain itu, status pengiriman email hanya tercatat di log server, tidak terlihat oleh user di antarmuka (UI).

## Solusi
1.  **Backend (Pencatatan Status)**:
    *   Modifikasi `sendSuccessEmail` untuk mengupdate kolom `metadata` pada tabel `transactions` dengan status pengiriman (`email_sent_status`, `email_sent_at`, atau `email_error`).
2.  **Frontend (Integrasi UI)**:
    *   Gunakan **Midtrans Snap Embed** daripada popup. Ini memungkinkan Snap dirender di dalam kontainer UI kita sendiri tanpa menutupi seluruh layar.
    *   Tambahkan indikator "Status Notifikasi Email" di dalam `PaymentGateway.tsx` yang dipantau melalui polling status transaksi yang sudah ada.
    *   Tampilkan pesan error email jika terjadi kegagalan langsung di UI.

## Dampak Perubahan
1.  `functions/src/index.ts`: Menambah logika update metadata setelah pengiriman email.
2.  `public/components/PaymentGateway.tsx`: Mengubah cara inisialisasi Midtrans Snap (Embed) dan menambah elemen UI untuk status email.

## Langkah-Langkah Eksekusi
1.  **Update `sendSuccessEmail`**: Tambahkan blok `supabase.from('transactions').update(...)` setelah pemanggilan API Brevo.
2.  **Refactor `PaymentGateway.tsx`**:
    *   Tambahkan `div` dengan ID `snap-container`.
    *   Ganti `window.snap.pay(token, ...)` menjadi `window.snap.embed(token, { embedId: 'snap-container', ... })`.
    *   Tambahkan bagian "Status Verifikasi" yang menampilkan status pembayaran dan status email secara real-time.

## Rencana Verifikasi
1.  Lakukan transaksi.
2.  Pastikan interface Midtrans muncul di dalam kotak (tidak menutupi layar).
3.  Perhatikan indikator status: "Menunggu Pembayaran" -> "Pembayaran Berhasil" -> "Mengirim Email Konfirmasi" -> "Email Terkirim".
