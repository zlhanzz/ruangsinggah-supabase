# WALKTHROUGH - Perbaikan Entitas Brand dan SEO Pencarian AI (Google & Gemini)

**Tanggal**: 4 Juni 2026  
**Fitur**: Optimasi Semantik Entitas Brand `RuangSinggah.id` & `PT Ruang Singgah Nusantara` untuk Gemini/Google Search

---

## 1. Daftar Perubahan

### ✅ `functions/public/index.html` & `public/index.html`
- **Optimasi Judul Utama (`<title>`)**: Mengubah penempatan kata kunci agar brand name berada di prioritas terdepan untuk memperkuat nama brand:
  *   *Sebelum*: `<title>RuangSinggah - Cari Kost Mahasiswa Terverifikasi di Makassar</title>`
  *   *Sesudah*: `<title>RuangSinggah.id - Platform Sewa Kost &amp; Jasa Survey Kost Terpercaya</title>`
- **Optimasi Deskripsi Meta (`<meta name="description">`)**: Menyusun ulang kalimat deskripsi dengan mengawali menggunakan nama brand agar bot AI mengidentifikasi bahwa web ini adalah perwakilan resmi brand:
  *   *Sebelum*: `<meta name="description" content="Cari kost mahasiswa terverifikasi di Makassar dengan mudah!...">`
  *   *Sesudah*: `<meta name="description" content="RuangSinggah.id adalah platform pencarian sewa kost dan jasa survey kost independen terpercaya di Makassar dan Indonesia. Cari kost mahasiswa terverifikasi dekat Unhas, UNM, UIN secara aman.">`
- **Heading H1 Dokumen (`<h1>`)**: Memperbaiki tag header `H1` tersembunyi yang dibaca khusus oleh bot crawler:
  *   *Sebelum*: `Cari Kost Mahasiswa Terverifikasi di Makassar - RuangSinggah`
  *   *Sesudah*: `RuangSinggah.id - Platform Sewa Kost &amp; Jasa Survey Kost Terpercaya`
- **JSON-LD Schema (Organization)**: Menambahkan entitas legal perusahaan (`legalName: "PT Ruang Singgah Nusantara"`) serta merinci deskripsi platform dalam format JSON terstruktur agar Google Graph & Gemini AI mengenali relasi nama "Ruang Singgah" dengan platform booking kost Anda.
- **Pembaruan OpenGraph & Twitter Cards**: Menyinkronkan semua data meta peninjau WhatsApp/Sosial Media agar sama-sama memprioritaskan entitas `RuangSinggah.id`.

---

## 2. Proses Deploy & Dampak
1.  Perubahan berkas disuntikkan secara aman ke berkas sumber `index.html`.
2.  Proyek dikompilasi ulang secara bersih (`npm run build` di direktori `functions/public`) menghasilkan aset statis terbaru di direktori `dist`.
3.  Berkas index terbaru disalin ke folder root `public` sebagai cadangan.
4.  Semua berkas telah berhasil dilakukan komit dan di-push otomatis ke GitHub (`origin main`).
5.  Cloudflare Pages akan melakukan pembacaan build otomatis dan menyebarkan metadata baru ini ke server edge produksi dalam 1-2 menit.

---

## 3. Cara Kerja & Efek pada Gemini / Google Search
*   **Perayapan Ulang Google**: Setelah metadata ter-deploy di Cloudflare, Google Search Console akan merayap ulang dokumen `/` (homepage). Google akan mendeteksi penegasan bahwa nama entitas adalah "RuangSinggah.id" dan badan hukumnya adalah "PT Ruang Singgah Nusantara" yang bergerak di bidang PropTech (Platform Sewa Kost).
*   **Penyelarasan AI Gemini**: Gemini mengonsumsi data dari indeks web Google secara real-time. Dengan adanya data schema terstruktur `Organization` dengan nama resmi perusahaan, serta deskripsi halaman yang secara eksplisit mengaitkan "Ruang Singgah" dengan "platform pencarian sewa kost", Gemini akan mulai menggeser pemahamannya dari "Rumah Singgah Pasien/Sosial" menuju "Platform Booking Kost" khusus untuk konteks brand komersial Anda.
*   **Kenaikan Posisi**: Format judul halaman baru yang memprioritaskan kata "RuangSinggah.id" di awal tag `<title>` akan secara dramatis mempermudah Google menempatkan posisi web Anda di atas akun Instagram Semarang (`ruangsinggah_smg`) karena relevansi kata kunci brand yang jauh lebih tinggi.
