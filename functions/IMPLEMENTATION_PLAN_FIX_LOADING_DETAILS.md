# IMPLEMENTATION PLAN: Perbaikan Loading, Unified UI, dan Detail Komposisi Pembayaran

## Analisis Masalah
1.  **Loading Terus-Menerus**: `isProcessing` tidak di-reset setelah Midtrans Snap Embed diinisialisasi, sehingga overlay loading menutupi UI Snap.
2.  **UI Tidak Menyatu (Overlapping)**: Saat mode Midtrans aktif, UI custom QRIS/VA Pakasir masih mencoba merender dirinya sendiri, menyebabkan log error "empty data" dan kekacauan visual.
3.  **Detail Komposisi Hilang**: User ingin melihat rincian biaya (seperti di Midtrans Snap) di UI RuangSinggah (misal: Sewa Pokok + Biaya Fasilitas).

## Solusi
1.  **Fix Loading Bug**: Set `setIsProcessing(false)` segera setelah `window.snap.embed` dipanggil.
2.  **Unified Conditional Rendering**: 
    *   Sembunyikan seluruh blok instruksi manual (QRIS/VA custom) jika `selectedGateway === 'MIDTRANS'`.
    *   Midtrans Snap Embed akan menangani instruksi pembayarannya sendiri di dalam `snap-container`.
3.  **Komponen Rincian Pembayaran (Payment Details)**:
    *   Tambahkan bagian "Rincian Pembayaran" yang dapat di-expand di bagian header.
    *   Tampilkan list item dari `metadata.item_details` atau breakdown default berdasarkan `productType`.
4.  **Backend Alignment**: Pastikan `item_details` disimpan dengan benar ke dalam metadata transaksi di `src/index.ts`.

## Dampak Perubahan
1.  `functions/src/index.ts`: Menambah persistensi `item_details` ke metadata.
2.  `public/components/PaymentGateway.tsx`: Perubahan logika render dan penambahan komponen UI Detail.

## Langkah-Langkah Eksekusi
1.  **Update Backend**: Modifikasi `createMidtransPayment` dan `createPakasirPayment` untuk menyertakan `item_details` dalam payload metadata.
2.  **Fix Frontend Loading**: Update `handlePay` di `PaymentGateway.tsx`.
3.  **Refactor Frontend Rendering**: Tambahkan pengecekan `selectedGateway` sebelum merender blok QRIS/VA.
4.  **Add Details UI**: Implementasikan komponen akordeon/rincian di bagian atas `PaymentGateway.tsx`.

## Rencana Verifikasi
1.  Lakukan transaksi -> Pastikan loading overlay hilang setelah Snap muncul.
2.  Cek UI -> Pastikan tidak ada teks "Data QRIS Belum Tersedia" saat menggunakan Midtrans.
3.  Buka "Rincian Pembayaran" -> Pastikan komposisi harga muncul dengan benar.
