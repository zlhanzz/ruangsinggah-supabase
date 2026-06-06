# IMPLEMENTATION PLAN - Perbaikan Status Pesanan Survey yang Reset Kembali ke Diajukan

Rencana ini dibuat untuk memperbaiki masalah di mana status pesanan survey yang sudah aktif/selesai ter-reset kembali ke status `'PENDING_ASSIGNMENT'` (kembali ke tab Diajukan) secara otomatis ketika pengguna memuat halaman "Kost Saya".

## 1. Analisis Masalah
- **Masalah Utama**:
  - Pada saat memuat halaman "Kost Saya", fungsi `autoSyncAllSurveys` dipanggil di latar belakang untuk menyelaraskan status transaksi dengan tabel `survey_requests`.
  - Di dalam fungsi `syncSurveyRequest` pada [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts), logika penentuan status target ditulis sebagai berikut:
    ```typescript
    const currentStatus = (existing?.status || 'AWAITING_PAYMENT').toUpperCase();
    let targetStatus = 'AWAITING_PAYMENT';
    if (isPaid) {
        targetStatus = 'PENDING_ASSIGNMENT';
    } else if (existing && currentStatus !== 'AWAITING_PAYMENT') {
        targetStatus = existing.status;
    }
    ```
  - Karena transaksi survei yang sukses akan selalu bernilai `isPaid = true`, kondisi `if (isPaid)` akan selalu terpenuhi.
  - Akibatnya, `targetStatus` diatur kembali ke `'PENDING_ASSIGNMENT'` pada setiap kali proses sinkronisasi otomatis berjalan, mengabaikan status riil di database yang mungkin sudah `'AGENT_ASSIGNED'`, `'SURVEYING'`, atau `'COMPLETED'`. Hal ini memaksa pesanan survey turun kembali ke tab "Diajukan" dan meminta agen surveyor melakukan konfirmasi ulang.

- **Solusi**:
  - Perbaiki logika penetapan `targetStatus` agar mempertahankan status yang sudah ada (`existing.status`) jika record survey sudah terbentuk di database, kecuali jika status sebelumnya masih `'AWAITING_PAYMENT'` dan transaksi baru saja terbayar (`isPaid = true`).

## 2. Dampak Perubahan
File yang akan disentuh:
1. **`functions/public/adminService.ts`**:
   - Modifikasi logika pencocokan status di fungsi `syncSurveyRequest` (baris ~912-918).

## 3. Langkah-Langkah Eksekusi
1. Buka [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts).
2. Temukan penentuan variabel `targetStatus` di fungsi `syncSurveyRequest`.
3. Ganti logika tersebut dengan logika yang aman mempertahankan status yang ada:
   ```typescript
   let targetStatus = 'AWAITING_PAYMENT';
   if (existing && existing.status) {
       if (isPaid && existing.status === 'AWAITING_PAYMENT') {
           targetStatus = 'PENDING_ASSIGNMENT';
       } else {
           targetStatus = existing.status;
       }
   } else {
       if (isPaid) {
           targetStatus = 'PENDING_ASSIGNMENT';
       } else {
           targetStatus = 'AWAITING_PAYMENT';
       }
   }
   ```
4. Jalankan build lokal `npm run build` menggunakan CMD untuk memverifikasi tidak ada error kompilasi.

## 4. Rencana Verifikasi
- Memastikan bundel Vite berhasil dibangun tanpa error.
- Melakukan verifikasi alur sinkronisasi data.
