# Walkthrough: Setup API Google Drive untuk Jasa Survey

Saya telah memperbarui sistem agar mendukung konfigurasi Google Drive yang lebih fleksibel melalui Firebase Functions Params.

## Perubahan yang Dilakukan:
1.  **`functions/src/index.ts`**: Menambahkan parameter `GOOGLE_PRIVATE_KEY` dan `GOOGLE_SERVICE_ACCOUNT_EMAIL` agar bisa dikelola secara aman.
2.  **`functions/src/googleDriveUtils.ts`**: Memperbarui fungsi `createSurveyFolder` agar dapat menerima kredensial secara dinamis dan memiliki penanganan error yang lebih baik.
3.  **Integrasi**: Memastikan proses otomatisasi setelah pembayaran (`completeSurveyProcess`) menggunakan kredensial yang baru disetup.

## Langkah yang Harus Anda Lakukan:
Untuk mengaktifkan fitur ini, Anda perlu menambahkan kredensial ke dalam file `functions/.env`:

1. Buka file `functions/.env`.
2. Tambahkan dua baris berikut (ambil nilainya dari file JSON Service Account Anda):
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   *Catatan: Pastikan Private Key dibungkus tanda kutip dan karakter `\n` tetap dipertahankan.*

3. Simpan file tersebut.

## Apa yang Terjadi Setelah Ini?
Setelah kredensial ditambahkan:
- Setiap pembayaran survey yang berhasil akan secara otomatis membuat folder di Google Drive.
- Folder tersebut akan secara otomatis diberikan akses "View" untuk siapa saja yang memiliki link.
- Link folder tersebut akan disimpan di tabel `survey_requests` kolom `result_drive_link`.

> [!TIP]
> Saya siap membantu membuatkan script uji coba (test script) segera setelah Anda memasukkan kredensial tersebut untuk memastikan semuanya berjalan lancar.
