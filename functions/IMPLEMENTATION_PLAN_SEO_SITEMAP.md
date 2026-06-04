# IMPLEMENTATION PLAN - Perbaikan Peta Situs (Sitemap) SEO dan Konfigurasi Firebase Hosting & Cloudflare Pages

Rencana ini dibuat untuk memperbaiki kesalahan pembacaan peta situs (sitemap) di Google Search Console yang mendeteksi sitemap sebagai halaman HTML, serta mengoptimalkan indeks SEO dengan menambahkan tautan properti kost aktif secara dinamis.

## 1. Analisis Masalah
- **Masalah Utama**: Google Search Console (GSC) melaporkan error bahwa peta situs `/sitemap.xml` berupa HTML (`Peta situs Anda terlihat seperti halaman HTML. Pakai format peta situs resmi saja`).
- **Penyebab**: 
  1. Domain utama `ruangsinggah.id` diarahkan ke **Cloudflare Pages**, bukan ke Firebase Hosting. Oleh karena itu, aturan rewrite di `firebase.json` diabaikan oleh Cloudflare Pages.
  2. Cloudflare Pages saat ini mengonfigurasi aturan routing di file `_redirects` menggunakan aturan tangkap-semua wildcard: `/* /index.html 200`. Aturan ini memaksa semua rute termasuk `/sitemap.xml` untuk mengembalikan file HTML `/index.html`.
  3. Pengguna mendaftarkan halaman HTML reguler seperti `/artikel`, `/survey-service`, `/listings`, dan `/products` sebagai sitemap terpisah di GSC. Halaman-halaman tersebut adalah antarmuka pengguna (HTML), bukan file sitemap resmi (XML), sehingga memicu error HTML.
- **Solusi**:
  1. Tambahkan aturan redirect 302 di file `_redirects` Cloudflare Pages untuk merutekan permintaan `/sitemap.xml` langsung ke URL produksi Cloud Function v2: `https://sitemap-hzxlewhsuq-uc.a.run.app`.
  2. Tetap pertahankan aturan rewrite Firebase Hosting di `firebase.json` dan `functions/public/firebase-hosting.json` sebagai fallback yang bersih dan cadangan jika di masa depan domain dipindahkan.
  3. Berikan instruksi kepada pengguna untuk menghapus pendaftaran sitemap HTML yang salah di Google Search Console dan hanya menyisakan `/sitemap.xml` sebagai satu-satunya peta situs resmi.

## 2. Dampak Perubahan
File yang akan disentuh:
1. **`functions/public/public/_redirects`**:
   - Menambahkan aturan redirect `/sitemap.xml` ke Cloud Function v2 sebelum wildcard `/*`.
2. **`firebase.json`** (Root) & **`functions/public/firebase-hosting.json`** (Sudah Diubah):
   - Mengubah rule rewrite `/sitemap.xml` ke format objek v2 dengan region `us-central1`.

## 3. Langkah-Langkah Eksekusi
1. Memperbarui dokumen `IMPLEMENTATION_PLAN_SEO_SITEMAP.md` ini.
2. Mengubah berkas `functions/public/public/_redirects`.
3. Menjalankan kompilasi dan build frontend secara lokal (`npm run build` di direktori `functions/public`) untuk memperbarui direktori `dist`.
4. Meminta user melakukan git push ke GitHub agar memicu deployment otomatis di Cloudflare Pages.
5. Memvalidasi hasil redirect dan format XML sitemap setelah dideploy di Cloudflare.
6. Menulis laporan penyelesaian di `WALKTHROUGH_SEO_SITEMAP.md` dan memperbarui riwayat di `functions/PROGRESS.md`.

## 4. Rencana Verifikasi
- **Verifikasi Lokal**: Memastikan build frontend sukses (`npm run build`).
- **Verifikasi Produksi**: 
  - Menjalankan `curl.exe -i -H "Cache-Control: no-cache" https://ruangsinggah.id/sitemap.xml` untuk memastikan respons mengembalikan redirect 302 ke URL Cloud Function v2, dan target URL tersebut mengembalikan dokumen XML sitemap valid.
