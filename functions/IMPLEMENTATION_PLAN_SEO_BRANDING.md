# IMPLEMENTATION PLAN - Optimasi Entitas Brand dan SEO Pencarian AI (Google & Gemini)

Rencana ini dibuat untuk mengoptimalkan penargetan nama brand "Ruang Singgah" atau "RuangSinggah.id" di mesin pencari Google dan kecerdasan buatan (Gemini/SGE) agar tidak disalahartikan sebagai rumah sakit/rumah singgah sosial, serta menaikkan peringkat organik di atas akun Instagram kompetitor.

## 1. Analisis Masalah
- **Masalah Utama**: 
  1. Ketika mencari "ruang singgah", AI Gemini/Google Search mendefinisikannya sebagai "rumah sakit/rumah singgah pasien" atau "podcast Spotify".
  2. Pencarian organik mandiri menempatkan situs `ruangsinggah.id` di bawah akun Instagram kafe kopi di Semarang (`ruangsinggah_smg`).
- **Penyebab**:
  1. Istilah "ruang singgah" secara semantik adalah kata umum bahasa Indonesia yang sangat erat kaitannya dengan yayasan sosial/rumah singgah pasien rumah sakit. AI/search engine mengelompokkan kata ini secara generik karena kurangnya bobot entitas (entity authority) yang mengaitkan istilah tersebut ke platform teknologi properti (PropTech).
  2. Judul utama halaman (Title Tag) dan deskripsi meta situs saat ini dimulai dengan kata kerja generik: *"Cari Kost Mahasiswa..."*. Hal ini membuat Google menganggap situs Anda adalah direktori lokal Makassar generik, bukan situs resmi dari entitas brand nasional *"RuangSinggah"*.
  3. Tag `<h1>` tersembunyi yang dibaca crawler di `index.html` juga tidak memprioritaskan nama brand di awal kalimat.
- **Solusi**:
  1. **Re-branding Tag Judul Utama (Title Tag)**: Mengubah judul utama di `index.html` agar diawali dengan nama brand yang jelas dan profesional:
     *   *Sebelum*: `RuangSinggah - Cari Kost Mahasiswa Terverifikasi di Makassar`
     *   *Sesudah*: `RuangSinggah.id - Platform Sewa Kost & Jasa Survey Kost Terpercaya`
  2. **Optimasi Deskripsi Meta**: Mengubah deskripsi agar diawali dengan penegasan identitas brand secara semantik:
     *   *Sebelum*: `Cari kost mahasiswa terverifikasi di Makassar...`
     *   *Sesudah*: `RuangSinggah.id adalah platform pencarian sewa kost dan jasa survey kost independen terpercaya di Indonesia. Temukan kost mahasiswa terverifikasi...`
  3. **Penyelarasan Tag Heading H1**: Mengubah tag `<h1>` penanda utama dokumen untuk crawler agar memperkuat entitas brand:
     *   *Sebelum*: `Cari Kost Mahasiswa Terverifikasi di Makassar - RuangSinggah`
     *   *Sesudah*: `RuangSinggah.id - Platform Sewa Kost & Jasa Survey Kost Terverifikasi`
  4. **Penguatan Entitas pada JSON-LD**: Memastikan data terstruktur JSON-LD di `index.html` memiliki bidang `legalName` `"PT Ruang Singgah Nusantara"` dan memperbanyak sinonim kata kunci.

## 2. Dampak Perubahan
Berkas yang akan diubah:
1. **`functions/public/index.html`**:
   - Judul halaman (`<title>`)
   - Deskripsi meta (`<meta name="description">`)
   - Kata kunci meta (`<meta name="keywords">`)
   - OpenGraph title & description (`og:title`, `og:description`)
   - Twitter card title & description (`twitter:title`, `twitter:description`)
   - Heading H1 tersembunyi (`<h1>`)
   - Organisasi JSON-LD Schema (penambahan `legalName` dan optimasi `description`)

## 3. Langkah-Langkah Eksekusi
1. Membuat dokumen `IMPLEMENTATION_PLAN_SEO_BRANDING.md` ini.
2. Memperbarui elemen-elemen SEO dan entitas di `functions/public/index.html`.
3. Menjalankan kompilasi dan kompresi ulang berkas produksi (`npm run build` di direktori `functions/public`) guna menghasilkan berkas `dist/index.html` yang baru.
4. Menyalin manual hasil kompilasi `dist/index.html` ke direktori root `public/index.html` (sebagai cadangan Firebase Hosting).
5. Melakukan komit dan melakukan `git push origin main` agar Cloudflare Pages otomatis men-deploy versi terbaru.
6. Memvalidasi metadata situs live menggunakan curl.
7. Membuat dokumen `WALKTHROUGH_SEO_BRANDING.md` dan memperbarui `PROGRESS.md`.

## 4. Rencana Verifikasi
- **Verifikasi Lokal**: Memastikan build frontend sukses tanpa kesalahan syntax.
- **Verifikasi Metadata**: Menjalankan `curl.exe -s https://ruangsinggah.id/ | findstr /i "title"` untuk memastikan tag judul terbaru sudah ter-deploy dengan benar.
