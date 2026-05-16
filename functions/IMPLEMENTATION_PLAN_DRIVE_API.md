# Rencana Implementasi: Setup Ulang API Google Drive

Dokumen ini merinci langkah-langkah untuk mengaktifkan kembali integrasi Google Drive guna pembuatan folder survey secara otomatis.

## 1. Analisis Masalah
Saat ini, fungsi `createSurveyFolder` dalam `googleDriveUtils.ts` bergantung pada variabel lingkungan `GOOGLE_PRIVATE_KEY` dan `GOOGLE_SERVICE_ACCOUNT_EMAIL`. Namun, variabel-variabel ini belum terdefinisi di file `.env` fungsi, sehingga proses pembuatan folder survey akan gagal saat pembayaran berhasil.

## 2. Dampak Perubahan
- **File Terkait**: 
    - `functions/src/googleDriveUtils.ts` (Pembaruan cara pengambilan config)
    - `functions/.env` (Penyimpanan kredensial)
- **Fitur Terkait**: Jasa Survey (Proses otomatis pasca-pembayaran).

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Kode Utilitas**:
   - Memodifikasi `googleDriveUtils.ts` untuk menggunakan parameter dari `firebase-functions/params` (jika menggunakan Cloud Functions v2) atau memastikan fallback yang aman jika variabel `.env` tidak ada.
2. **Konfigurasi Lingkungan**:
   - Memasukkan `GOOGLE_PRIVATE_KEY` dan `GOOGLE_SERVICE_ACCOUNT_EMAIL` ke dalam file `.env` di direktori `functions`.
   - Melakukan deploy ulang fungsi jika diperlukan.
3. **Verifikasi**:
   - Menjalankan script uji coba untuk membuat folder Drive secara manual menggunakan Service Account yang baru.

## 4. Rencana Verifikasi
- Melakukan pemanggilan fungsi `createSurveyFolder` melalui script scratch.
- Memastikan folder berhasil dibuat di Google Drive dan memiliki akses "Anyone with link can view".
- Memastikan link Drive tersimpan dengan benar di tabel `survey_requests`.

> [!IMPORTANT]
> USER perlu menyiapkan file JSON Service Account dari Google Cloud Console dengan role "Editor" atau akses spesifik ke folder induk Drive.
