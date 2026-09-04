# Rencana Implementasi: Zero-Deploy Pengiriman Email Brevo ke Mitra & Pemisahan Kanal Email (Admin vs Mitra/User)

Dokumen ini adalah **Implementation Plan (Fase 1)** yang telah diperbarui dengan arahan baku dari pengguna:
1. **Kanal Notifikasi Admin**: Tetap **100% menggunakan FormSubmit** (`https://formsubmit.co/ajax/${email}`) dan in-app notification. Tidak dialihkan ke Brevo.
2. **Kanal Mitra, Agen, & User**: Menggunakan **Brevo REST API** (`https://api.brevo.com/v3/smtp/email`) untuk komunikasi resmi berdesain premium (seperti ucapan selamat listing terbit, invoice, dll.).
3. **Mekanisme Zero-Deploy Brevo**: Pemicuan email ucapan selamat mitra berjalan langsung dari front-end (`emailService.ts` & `adminService.ts`) tanpa membutuhkan perintah `firebase deploy`.
4. **Pencegahan Timeout Backend**: Merapikan inisialisasi `.value()` di `functions/src/index.ts` agar modul backend bersih dan tidak mengalami timeout 10000ms.

---

## 1. Analisis & Pemisahan Arsitektur Kanal Email

| Jenis Notifikasi | Penerima Sasaran | Layanan Pengiriman | Lokasi Implementasi | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Notifikasi Transaksi / Aduan / Pendaftaran** | **Admin RuangSinggah** | **FormSubmit** (`https://formsubmit.co/ajax/${adminEmail}`) | `emailService.ts` (`notifyAdminTransaction`, `notifyAdminPropertyReview`) | **Tetap & Dipertahankan** |
| **Ucapan Selamat Listing Terbit** | **Mitra Pemilik Kost** | **Brevo REST API** (`https://api.brevo.com/v3/smtp/email`) | `emailService.ts` (`sendMitraPublishedEmailBrevoDirect`) | **Baru (Zero-Deploy)** |
| **Notifikasi Akun & Transaksi Pengguna** | **User / Mitra / Agen** | **Brevo REST API** / Email Template | `emailService.ts` & helper | **Sesuai Standar** |

### A. Konfirmasi Aturan Pengguna
- **Notifikasi Admin**: Setiap kali ada pengajuan listing baru atau pembaruan kost yang masuk ke tahap peninjauan admin, sistem mengirimkan email ke admin via **FormSubmit**, bukan Brevo.
- **Pemberitahuan Mitra**: Ketika kost berhasil diterbitkan dan tayang, email selebrasi ucapan selamat dikirim ke email **Mitra** menggunakan **Brevo**.

### B. Solusi Error Timeout `firebase deploy` (Zero-Deploy)
- Pengguna tidak perlu menjalankan `firebase deploy` lagi di terminal.
- Fungsi `sendMitraPublishedEmailBrevoDirect` di front-end mengirimkan HTTP POST langsung ke `https://api.brevo.com/v3/smtp/email` dengan API Key resmi dan template HTML selebrasi.
- Di sisi backend `functions/src/index.ts`, pemanggilan parameter `.value()` pada global scope diubah menjadi lazy getter sehingga modul tidak lagi memicu warning timeout 10000ms.

---

## 2. Dampak Perubahan (Files Touched)

1. **`functions/public/emailService.ts`**:
   - Menjaga keutuhan fungsi FormSubmit untuk admin (`notifyAdminTransaction`, `notifyAdminPropertyReview`, dll.).
   - Menambahkan fungsi `sendMitraPublishedEmailBrevoDirect`:
     - Khusus dikirim ke email **Mitra**.
     - Template selebrasi RuangSinggah warna zamrud-oranye.
     - Direct HTTP fetch ke Brevo REST API (Zero-Deploy, non-blocking).

2. **`functions/public/adminService.ts`**:
   - Memperbarui `sendMitraPublishedEmailBrevo` agar memanggil `sendMitraPublishedEmailBrevoDirect` dari `emailService.ts`.

3. **`functions/public/.env.local`**:
   - Memastikan `VITE_BREVO_API_KEY` terkonfigurasi untuk front-end.

4. **`functions/src/index.ts`**:
   - Mengubah pembacaan parameter Midtrans `.value()` di top-level menjadi lazy evaluation di dalam fungsi saat runtime, sehingga aman dari deployment timeout.

5. **`functions/PROGRESS.md` & `WALKTHROUGH.md`**:
   - Mencatat penegasan aturan kanal email (Admin = FormSubmit, Mitra/User = Brevo) dan panduan Zero-Deploy.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

### Tahap 1: Pembuatan `sendMitraPublishedEmailBrevoDirect` di `emailService.ts`
- Implementasikan fungsi pengiriman email Brevo khusus mitra dengan template HTML responsif.
- Pastikan tidak menyentuh atau mengubah fungsi notifikasi admin yang menggunakan FormSubmit.

### Tahap 2: Sambungkan `adminService.ts` ke Direct Brevo Dispatcher
- Ubah `sendMitraPublishedEmailBrevo` untuk langsung memanggil `sendMitraPublishedEmailBrevoDirect`.

### Tahap 3: Perapian Lazy Params di `functions/src/index.ts`
- Buat helper `getActiveKeys()` dan `getMidtransIsProduction()` untuk membungkus `.value()` agar tidak dievaluasi saat module import.

### Tahap 4: Verifikasi Kompilasi & Build
- `npm run build` di `functions/public/` (memastikan 0 error).
- `npm run build` di `functions/` (memastikan backend TypeScript 0 error).

### Tahap 5: Dokumentasi & Git Push
- Perbarui `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
1. **Verifikasi Jalur Email**:
   - Admin menerima notifikasi submission via **FormSubmit**.
   - Mitra menerima ucapan selamat listing terbit via **Brevo REST API**.
2. **Verifikasi Zero-Deploy**:
   - Pengguna tidak perlu menjalankan `firebase deploy` di terminal; email selamat otomatis meluncur saat kost dipublikasikan dari UI.
3. **Verifikasi Build**:
   - `npm run build` front-end dan backend sukses tanpa peringatan fatal ataupun error.
