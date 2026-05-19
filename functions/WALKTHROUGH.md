# WALKTHROUGH - Notifikasi Transaksi Admin Menggunakan FormSubmit

Dokumen ini menjelaskan perubahan yang dilakukan untuk memigrasikan notifikasi transaksi admin sepenuhnya menggunakan FormSubmit (`formsubmit.co`) secara dinamis kepada seluruh pengguna dengan role `admin`.

## 1. Daftar Perubahan
- **`emailService.ts`**:
  - Mengimpor klien `supabase`.
  - Memperbarui `notifyAdminTransaction` untuk menarik daftar admin secara dinamis dari tabel `users` dengan menyaring pengguna yang memiliki `role === 'admin'` atau `is_admin === true`.
  - Melakukan perulangan (loop) untuk mengirimkan request HTTP POST AJAX ke endpoint FormSubmit masing-masing admin (`https://formsubmit.co/ajax/{email}`).
  - Menambahkan fallback ke `sulhan77777@gmail.com` jika database kosong atau gagal dimuat (misalnya saat pengembangan lokal).
- **`PaymentGateway.tsx`**:
  - Mengimpor `notifyAdminTransaction` dari `../emailService`.
  - Memanggil `notifyAdminTransaction` di dalam fungsi `handlePay` segera setelah transaksi baru berhasil dibuat oleh gateway pembayaran (status pending/awaiting payment). Ini memastikan admin menerima email pemberitahuan ketika checkout database, jasa survey, atau sewa kost baru saja diinisiasi oleh pengguna.

## 2. Hasil Pengujian
- **Verifikasi Build**: Proses build produksi berjalan dengan sukses tanpa ada error linting maupun kompilasi TypeScript:
  ```bash
  > vite build
  ✓ built in 30.37s
  ```

## 3. Petunjuk Deploy
Untuk melakukan deploy pembaruan ini ke hosting produksi:
```bash
npm run build
firebase deploy --only hosting
```
*(Catatan: Pastikan Anda berada di direktori `functions/public` saat menjalankan perintah build/deploy).*
