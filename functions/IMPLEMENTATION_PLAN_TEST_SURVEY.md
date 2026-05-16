# IMPLEMENTATION PLAN: Pengujian Menyeluruh Fungsi Layanan Survey

Dokumen ini merinci langkah-langkah untuk menguji fungsi Layanan Survey dari sisi Frontend hingga otomatisasi Backend.

## 1. Analisis Kesiapan
Berdasarkan pengecekan file `.env`, kredensial Google Drive belum terisi. Tanpa ini, fungsi `completeSurveyProcess` akan gagal membuat folder hasil survey.

**Kebutuhan Kunci:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email dari Service Account Google Cloud.
- `GOOGLE_PRIVATE_KEY`: Private key dari JSON Service Account (pastikan formatnya benar).

## 2. Langkah-Langkah Pengujian

### Tahap A: Pengisian Kredensial (Wajib)
1.  User mengisi `GOOGLE_PRIVATE_KEY` dan `GOOGLE_SERVICE_ACCOUNT_EMAIL` di file `functions/.env`.
2.  Pastikan Service Account tersebut sudah diberi akses "Editor" atau "Writer" pada folder induk Google Drive (`1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk`).

### Tahap B: Simulasi Alur Frontend
1.  Buka halaman **Survey Service**.
2.  Klik tombol **"Ambil Promo Ini Sekarang"**.
3.  Isi data form (Langkah 1-3) dengan data testing.
4.  Di Langkah 4, klik **"Selesaikan & Bayar"**.
5.  Pastikan Modal **Payment Gateway** muncul.

### Tahap C: Simulasi Pembayaran (Backend)
1.  Di Modal Payment Gateway (jika dalam mode Admin/Sandbox), gunakan tombol **"Simulasi Bayar"** atau selesaikan pembayaran via Midtrans Sandbox.
2.  Verifikasi bahwa:
    - Status di UI berubah menjadi **"Pembayaran Berhasil"**.
    - Muncul tombol **"Lihat Status di Kost Saya"**.

### Tahap D: Verifikasi Otomatisasi (E2E)
1.  Cek Database Supabase (tabel `survey_requests`):
    - Pastikan record baru muncul.
    - Pastikan status berubah menjadi `PENDING_ASSIGNMENT`.
    - Pastikan kolom `result_drive_link` terisi dengan link Google Drive yang valid.
2.  Cek Email: Pastikan email konfirmasi pembayaran dari Brevo masuk ke Inbox.

## 3. Rencana Verifikasi
- [ ] Form dapat disubmit tanpa error.
- [ ] Payment Gateway memuat metode pembayaran dengan benar.
- [ ] Webhook Backend berhasil memproses status `PAID`.
- [ ] Folder Google Drive otomatis terbentuk dengan nama yang sesuai.
- [ ] Email notifikasi terkirim dengan detail yang benar.

---
> [!IMPORTANT]
> Mohon konfirmasi apakah Anda ingin saya membantu mengisi template kunci di `.env` terlebih dahulu sebelum kita mulai pengujian.
