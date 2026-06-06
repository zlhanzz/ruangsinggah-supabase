# WALKTHROUGH - Perbaikan Visibilitas Pesanan Survey Pending di Menu Kost Saya

Dokumen ini menjelaskan perubahan yang dilakukan untuk memperbaiki masalah pesanan survey pending/menunggu pembayaran yang tidak muncul di menu "Kost Saya" bagi pengguna.

## 1. Daftar Perubahan

Secara mendetail, berikut adalah modifikasi yang telah dilakukan:

### 1. **`functions/public/adminService.ts`**
- **Logika Sinkronisasi (`syncSurveyRequest`)**:
  - Menghapus pembatasan sinkronisasi dini yang menolak transaksi jika statusnya belum lunas (PAID/SUCCESS/dll).
  - Menyinkronkan transaksi non-paid (misal `pending` atau `awaiting_payment`) dengan menetapkan status targetnya di tabel `survey_requests` sebagai `'AWAITING_PAYMENT'`. Hal ini menyelaraskan logika client-side dengan backend (`syncSurveyRequestsBackend`).
- **Pembersihan Scan Otomatis (`autoSyncAllSurveys`)**:
  - Mengubah nama fungsi `autoSyncPaidSurveys` menjadi `autoSyncAllSurveys`.
  - Mengubah query pencarian transaksi agar mengambil seluruh transaksi bertipe `'survey'` tanpa membatasi hanya yang berstatus lunas.
  - Memperbarui pemanggilan internal background sync di `getAdminSurveyRequests` agar menggunakan `autoSyncAllSurveys`.

### 2. **`functions/public/pages/MyKost.tsx`**
- **Impor & Integrasi**:
  - Mengganti impor `autoSyncPaidSurveys` dari `../adminService` menjadi `autoSyncAllSurveys`.
  - Mengubah pemanggilan di dalam `fetchMyKosts` agar memicu `autoSyncAllSurveys(user.uid)` pada saat memuat halaman, memastikan pesanan survey pending langsung disinkronkan ke tabel `survey_requests` di browser.

---

## 2. Hasil Pengujian

- **Kompilasi Sukses**:
  Proses build produksi lokal menggunakan `npm run build` di dalam folder `functions/public` telah dijalankan dan selesai secara sukses tanpa ada error linting maupun TypeScript.
  ```bash
  vite v6.4.1 building for production...
  transforming...
  ✓ 2520 modules transformed.
  rendering chunks...
  ✓ built in 32.64s
  ```

---

## 3. Petunjuk Deploy

Untuk menerapkan perubahan ini ke lingkungan produksi, silakan jalankan perintah berikut:

1. **Build Frontend**:
   ```bash
   cd "functions/public"
   npm run build
   ```
2. **Deploy Ke Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```
