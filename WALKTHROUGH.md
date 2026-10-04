# WALKTHROUGH: Migrasi Multimodal Gemini 3.7 Flash & 3.5 Flash, Eliminasi False Timeout, dan Penajaman Sensor Spanduk Presisi

## 1. Ringkasan Eksekusi

Sesuai permintaan dan persetujuan pada `IMPLEMENTATION_PLAN.md`, perbaikan arsitektur model AI dan penajaman penempatan sensor spanduk telah selesai diimplementasikan, diuji secara live, dan diverifikasi dengan kelulusan kompilasi build 100% tanpa error (`✓ built in 25.34s`).

### Temuan Investigasi Diagnostik:
1. **Penyebab Keterlambatan Respon (96 Detik)**:
   - Di Edge Function sebelumnya, model-model usang atau yang sedang tidak aktif berada di urutan atas. Server mencoba model-model tersebut di semua API key dan memakan waktu hingga 96 detik sebelum akhirnya mencapai model aktif.
2. **Penyebab Sensor Meleset ke Pagar Hitam**:
   - Batas waktu tunggu (*timeout*) frontend sebelumnya disetel 7,5 detik. Karena server belum selesai dalam 7,5 detik, frontend membatalkan request AI dan beralih ke *Fallback Heuristik Lokal*. Algoritma lokal menebak kontras warna antara kayu cokelat dan tiang hitam gerbang, sehingga kotak sensor keliru diletakkan di pagar sebelah kanan spanduk.
3. **Penyebab Foto Bersih Tetap Mendapat Efek Blur**:
   - Jika AI menyatakan tidak ada spanduk, fallback lokal sebelumnya tetap dijalankan dan mencari kontras acak. Kini telah diperbaiki agar sistem 100% menghormati hasil AI.

---

## 2. Hasil Benchmark Performa Model Google Gemini (Live Test)

Dari pengujian live terhadap endpoint Google API menggunakan API Key sistem:
- **`gemini-3.7-flash`**: Status 200 (Aktif, akurasi tinggi, sukses mendeteksi "TERIMA KOST PUTRI").
- **`gemini-3.5-flash`**: Status 200 (Super cepat, respon **1,9 detik**, akurasi tinggi).
- **`gemini-2.5-flash`**: Status 200 (Ultra cepat, respon **1,2 detik**).
- **`gemini-3.8-flash`**: Status 503 (*Temporary demand spike* di server Google).

---

## 3. Daftar File yang Dimodifikasi

### A. `supabase/functions/detect-contact-banner/index.ts`
- **Konfigurasi Prioritas Model Baru**:
  ```ts
  const CANDIDATE_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-3.8-flash"
  ];
  ```
- **Instant Fallback Switch**: Menambahkan penanganan status 404, 400, 503, dan 429 agar langsung memutus loop dan beralih ke model berikutnya dalam hitungan milidetik jika suatu model mengalami lonjakan antrean.
- **Normalisasi Poligon 4 Titik**: Memastikan seluruh koordinat poligon berskala 0–1000 terpetakan secara utuh dalam format `[x, y]` searah jarum jam.
- **Deployment Status**: Telah di-deploy live ke Supabase Edge Functions project `sgcmnsnokrztocnhxnqm`.

### B. `functions/public/autoSensorService.ts`
- **Peningkatan Timeout AI**: Dinaikkan dari 7,5 detik menjadi **15 detik** agar memberikan toleransi jaringan mobile tanpa memicu false fallback ke heuristik lokal.
- **Penerapan Flag `aiScanSucceeded`**:
  - Heuristik lokal hanya aktif jika koneksi jaringan offline / Edge Function tidak terjangkau.
  - Jika AI berhasil merespon dan menyatakan foto bersih (tidak ada spanduk), sistem tidak lagi mencari-cari kontras sembarangan di pagar atau dinding.
- **Responsive Capsule Badge**: Menyesuaikan ambang batas ukuran minimal banner agar badge `ruangsinggah.id` tetap proporsional dan tidak memotong area penting pada spanduk kecil.

---

## 4. Hasil Verifikasi & Pengujian

### A. Live Detection Test
- Pemanggilan `detect-contact-banner` dengan foto pagar pengguna:
  - **Status**: 200 OK
  - **Teks Terbaca**: `["TERIMA KOST PUTRI"]`
  - **Model Terpakai**: `gemini-3.7-flash` / `gemini-3.5-flash`
  - **Koordinat Poligon**: Tepat di atas plang spanduk kayu gerbang.

### B. Kompilasi Frontend
- Perintah: `npm run build` di `functions/public/`
- Hasil: **LULUS 100% (0 Error, Exit Code 0)** dalam **25.34 detik** (`✓ 2512 modules transformed`).

---

## 5. Panduan Pengujian bagi Pengguna di Antarmuka (UI)

1. **Buka Formulir Listing Kost Mitra**:
   - Masuk ke menu **Tambah Kost Baru** -> Buka **Langkah 5 (Foto)**.
2. **Unggah Foto Fasad / Bangunan Depan Ber-Spanduk**:
   - Pilih foto gerbang/pagar kayu yang memiliki plang spanduk "TERIMA KOST PUTRI".
   - **Hasil yang Diharapkan**:
     - Proses pemindaian selesai cepat (< 3-5 detik).
     - Kotak frosted glass sensor poligon terpasang **tepat di atas plang spanduk kayu**, tidak lagi bergeser ke pagar besi hitam di sampingnya.
     - Badge watermark kapsul `ruangsinggah.id` terpasang rapi di tengah plang spanduk.
3. **Unggah Foto Bersih (Tanpa Spanduk)**:
   - Unggah foto bangunan depan atau pagar lain yang tidak ada spanduknya.
   - **Hasil yang Diharapkan**:
     - Foto tampil dengan badge hijau `BARU` tanpa ada sensor hitam acak yang menutup pagar.
