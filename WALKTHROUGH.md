# Walkthrough - Pemulihan & Penguatan Sensor Banner Kontak Otomatis AI

Dokumen ini merangkum perbaikan dan penguatan menyeluruh pada sistem sensor banner/spanduk kontak otomatis berbasis AI Vision (`gemini-2.5-flash` via Supabase Edge Function).

---

## 1. Analisis Akar Masalah (Root Cause)

Berdasarkan investigasi diagnostik terhadap kegagalan sensor pada citra pengguna:
1. **Model AI & Edge Function Berjalan Normal**:
   - Uji tembak langsung ke endpoint Edge Function `detect-contact-banner` menghasilkan deteksi akurat 100%:
     - `has_contact: true`
     - Teks terdeteksi: `"MENERIMA KOST PUTRI"`, `"INFO WA : 0813 5536 27"`, `"0823 4990 80"`
     - Bounding boxes: `{ ymin: 545, xmin: 275, ymax: 905, xmax: 485 }`
2. **Penyebab Utama Foto Lolos Tanpa Sensor**:
   - **Silent Network Fallback**: Saat koneksi internet mengalami drop / timeout (18 detik) saat mitra mengunggah foto, `adminService.ts` menangkap error dan langsung me-return `{ hasContact: false }` tanpa retry dan tanpa flag error, sehingga foto dianggap bersih.
   - **Validasi MIME Type Kaku**: `file.type.startsWith('image/')` pada beberapa browser HP / galeri Android menghasilkan string kosong (`""`), sehingga konversi Base64 AI terlewatkan (*bypassed*).
   - **Gateway Supabase Belum Terdaftar**: `supabase/config.toml` belum mendaftarkan fungsi `detect-contact-banner` dengan `verify_jwt = false`.
   - **Ketiadaan Fitur Re-Scan Manual**: Foto yang terlanjur diunggah dalam mode draf lokal saat koneksi sempat putus tidak dapat dipindai ulang tanpa harus menghapus dan mengunggah ulang dari nol.

---

## 2. Rincian Perubahan yang Telah Diimplementasikan

### A. Konfigurasi Gateway Supabase (`supabase/config.toml`)
- Menambahkan blok registrasi fungsi:
  ```toml
  [functions.detect-contact-banner]
  verify_jwt = false
  ```
  Memastikan pemanggilan fungsi Edge Function dari anon key / mitra tidak tertolak oleh verifikasi JWT gateway.

### B. Penguatan Pemanggilan API AI di Front-End (`functions/public/adminService.ts`)
- Menambahkan header cadangan `apikey: supabaseAnonKey` pada request `detectPhotoContactBanner`.
- Mengimplementasikan mekanisme **auto-retry 1x** dengan jeda 800ms jika request pertama terhambat gangguan koneksi jaringan.
- Menambahkan field `error?: string` pada antarmuka `ContactBannerDetectionResult` agar UI mengetahui jika proses pemindaian terhambat.

### C. UI & Logika Form Mitra (`functions/public/components/KostFormMitra.tsx`)
1. **Helper Validasi File Fleksibel (`isImageFile`)**:
   - Memeriksa `file.type` maupun ekstensi file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, dll.) agar foto dari semua tipe browser HP selalu lolos ke tahap pemindaian Base64 AI.
2. **Notifikasi Gangguan Koneksi**:
   - Jika AI scan terhambat kendala koneksi internet saat upload otomatis, sistem memunculkan banner peringatan oranye ramah yang memberitahukan bahwa foto berhasil diunggah namun beberapa spanduk belum sempat terpindai AI, lengkap dengan petunjuk menggunakan tombol pemicu manual.
3. **Tombol Pemicu Manual "Pindai Kontak (AI)"**:
   - Menambahkan tombol aksi perisai oranye (`ShieldAlert`) pada pojok kanan atas kartu foto baru (`currentCatNew`) yang belum berstatus sensor (`!item.isBlurred`).
   - Tombol tersedia di kategori wajib (Bangunan Depan, dsb.) maupun kategori kustom/tambahan.
   - Menampilkan animasi putar (`Loader2`) saat proses pemindaian sedang berjalan.
4. **Fungsi Re-Scan Mandiri (`handleReScanBanner`)**:
   - Mampu memindai ulang foto dari memory blob ataupun fetch preview URL jika file mentah sudah dilepas.
   - Menerapkan penyamaran bounding box, watermark kapsul `ruangsinggah.id` dua warna, konversi WebP, dan pembaruan file draft di storage Supabase secara otomatis.
5. **Perluasan Kategori Rawan Kontak (`isBannerProneCategory`)**:
   - Menambahkan kata kunci tambahan: `luar`, `gerbang`, `spanduk`, `banner`, `jalan`.

---

## 3. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi TypeScript & Vite Bundling
Perintah pengujian dijalankan di direktori `functions/public/`:
```bash
cmd /c npm run build
```
**Hasil**:
- **0 Error Kompilasi**.
- **2,506 modul** berhasil ditransformasi dan di-bundle (`✓ built in 1m 7s`).
- Seluruh chunk JavaScript dan CSS ter-generate sempurna di folder `public/assets/`.

---

## 4. Panduan Verifikasi Pengguna (UI Testing Guide)

Untuk menguji fitur ini di antarmuka browser:
1. Masuk ke halaman **Mitra / Tambah Kost** (`KostFormMitra`).
2. Navigasi ke **Langkah 5 (Foto)**.
3. Pada kategori **Bangunan Depan (Fasad)**, unggah foto properti yang memiliki spanduk nomor HP / WhatsApp:
   - Sistem akan secara otomatis memanggil AI Vision `gemini-2.5-flash`.
   - Kotak spanduk akan disamarkan dan disematkan watermark kapsul resmi `ruangsinggah.id`.
   - Kartu foto akan menampilkan badge **`ruangsinggah.id`** di pojok kiri atas.
4. **Pengujian Re-Scan Manual**:
   - Jika suatu foto memiliki spanduk kontak tetapi belum tersensor (misal diunggah saat koneksi offline atau di kategori tanpa auto-scan), klik tombol perisai oranye (`ShieldAlert`) di pojok kanan atas thumbnail foto.
   - Sistem akan memindai foto tersebut secara instan, menyamarkan kontak, memasang watermark `ruangsinggah.id`, dan mengubah statusnya menjadi aman.
