# IMPLEMENTATION PLAN - Notifikasi Transaksi Admin Menggunakan FormSubmit

Rencana ini dibuat untuk memindahkan notifikasi transaksi admin (sewa kost, database, dan jasa survey) sepenuhnya menggunakan FormSubmit (`formsubmit.co`) guna menghemat penggunaan kuota Brevo yang diprioritaskan untuk pengguna (customer).

## 1. Analisis Masalah
- **Kebutuhan**: Admin perlu menerima email notifikasi setiap ada transaksi baru (baik dibuat maupun berhasil dibayar) untuk sewa kost, database, dan jasa survey.
- **Batasan**: Notifikasi ini dikirim ke semua akun yang memiliki role `admin` (atau `is_admin = true`), menggunakan FormSubmit alih-alih Brevo.
- **Solusi**:
  - Ubah `notifyAdminTransaction` di `emailService.ts` agar mengambil seluruh daftar email admin secara dinamis dari database Supabase (`users` table).
  - Kirim email notifikasi secara asinkron ke masing-masing email admin melalui `https://formsubmit.co/ajax/{email}`.
  - Tambahkan pemanggilan `notifyAdminTransaction` di `PaymentGateway.tsx` saat transaksi berhasil dibuat/diinisiasi agar mencakup database, survey, dan sewa kost yang dibuat via checkout.

## 2. Dampak Perubahan
File yang akan diubah:
1. **`functions/public/emailService.ts`**:
   - Impor `supabase`.
   - Kueri dinamis untuk mendapatkan email pengguna dengan `role = 'admin'` atau `is_admin = true`.
   - Iterasi pengiriman FormSubmit AJAX ke semua email admin tersebut.
   - Sediakan fallback email default `sulhan77777@gmail.com`.
2. **`functions/public/components/PaymentGateway.tsx`**:
   - Impor `notifyAdminTransaction`.
   - Panggil `notifyAdminTransaction` di dalam `handlePay` saat transaksi baru berhasil dibuat dengan status `PENDING`.

## 3. Langkah-Langkah Eksekusi
1. Menulis file `IMPLEMENTATION_PLAN.md` ini.
2. Memperbarui file `functions/public/emailService.ts` dengan logika pengiriman dinamis ke semua admin.
3. Memperbarui file `functions/public/components/PaymentGateway.tsx` untuk memicu notifikasi ketika transaksi baru dibuat.
4. Memvalidasi kode dengan menjalankan proses build lokal (`npm run build`).
5. Membuat dokumen `WALKTHROUGH.md` dan memperbarui `PROGRESS.md`.

## 4. Rencana Verifikasi
- Memastikan build produksi berjalan sukses tanpa error linting atau TypeScript (`npm run build`).
