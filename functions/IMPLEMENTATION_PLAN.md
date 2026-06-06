# IMPLEMENTATION PLAN - Sinkronisasi Transaksi Survey Pending ke Survey Requests

Rencana ini dibuat untuk memastikan bahwa pesanan survey dengan status pembayaran pending/belum lunas tetap sinkron ke tabel `survey_requests` agar dapat muncul di menu "Kost Saya" bagian tab "Diajukan" milik user.

## 1. Analisis Masalah
- **Masalah Utama**:
  - `syncSurveyRequest` pada `adminService.ts` menolak sinkronisasi jika status transaksi tidak lunas (bukan PAID/SUCCESS/SELESAI/dll). Akibatnya, transaksi survey yang baru diajukan (status `pending` atau `awaiting_payment`) tidak dimasukkan ke dalam tabel `survey_requests`.
  - `autoSyncPaidSurveys` hanya mendeteksi transaksi survey yang sudah berstatus PAID/lunas, sehingga mengabaikan transaksi pending.
  - Halaman `MyKost.tsx` hanya menampilkan daftar survey berdasarkan data dari tabel `survey_requests`, sehingga pesanan survey pending tersebut tidak pernah muncul bagi user.

- **Solusi**:
  - Ubah logika `syncSurveyRequest` di `adminService.ts` agar memproses semua status transaksi survey. Jika transaksi belum lunas, status target di `survey_requests` akan diset sebagai `AWAITING_PAYMENT`.
  - Ubah/perluas `autoSyncPaidSurveys` menjadi `autoSyncAllSurveys` untuk memindai seluruh transaksi survey (lunas dan pending) milik user.
  - Perbarui impor dan pemanggilan fungsi sinkronisasi di `MyKost.tsx` dan internal `adminService.ts` dari `autoSyncPaidSurveys` menjadi `autoSyncAllSurveys`.

## 2. Dampak Perubahan
File yang akan diubah:
1. **`functions/public/adminService.ts`**:
   - Modifikasi `syncSurveyRequest` agar tidak melakukan `return` dini jika transaksi belum lunas.
   - Ubah `autoSyncPaidSurveys` menjadi `autoSyncAllSurveys` yang mencari semua transaksi dengan tipe `survey` tanpa memfilter status pembayaran.
2. **`functions/public/pages/MyKost.tsx`**:
   - Ubah impor `autoSyncPaidSurveys` menjadi `autoSyncAllSurveys`.
   - Ubah pemanggilan fungsi di dalam `fetchMyKosts` menjadi `autoSyncAllSurveys`.

## 3. Langkah-Langkah Eksekusi
1. Membuat dokumen `IMPLEMENTATION_PLAN.md` (langkah ini).
2. Memperbarui `functions/public/adminService.ts`.
3. Memperbarui `functions/public/pages/MyKost.tsx`.
4. Memverifikasi hasil build TypeScript dengan menjalankan `npm run build` di folder `functions/public` atau root.
5. Membuat dokumen `WALKTHROUGH.md` dan memperbarui `PROGRESS.md`.

## 4. Rencana Verifikasi
- Memastikan tidak ada error kompilasi TypeScript setelah modifikasi dilakukan.
