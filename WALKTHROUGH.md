# Walkthrough - Perbaikan Deteksi Banner Kontak, Pengetatan Presisi Sensor (Ultra-Tight Fit), & Watermark Otomatis

Dokumen ini merangkum perbaikan pada alur deteksi nomor kontak/banner spanduk pada foto kost di Dashboard Mitra, penyelarasan integrasi Edge Function `detect-contact-banner`, serta pengetatan kotak sensor (*ultra-tight fit*) menggunakan pemangkas pixel canvas (*Client-Side Pixel Analysis Auto-Trimming*) agar tidak menutupi gerbang, atap, atau dinding di sekitar spanduk.

---

## 1. Ringkasan Perubahan

### A. Penyelarasan Integrasi Edge Function (`functions/public/adminService.ts`)
- **Penyelarasan Nama Function**: Memperbarui pemanggilan Supabase Functions dari `'detect-banner'` menjadi `'detect-contact-banner'`.
- **Dukungan Payload Universal**: Mengirimkan `{ base64Image, image: base64Image, mimeType }` sehingga kompatibel penuh dengan semua versi implementasi backend/edge function.
- **Ekstraksi Tangguh Response Bersarang**: Menguraikan `rawData = data?.data || data || {}`, membaca flag deteksi (`has_contact` / `hasContact`), serta bounding boxes (`boxes` / `detected_texts`).
- **Resilience & Timeout Guard**: Ditambahkan timeout guard 18 detik dan retry otomatis 1x dalam 800ms jika terjadi cold-start pada serverless edge function.

### B. Pemangkas Pintar Presisi Banner (`functions/public/adminService.ts` - `refineBannerBoundsWithPixelAnalysis`)
- **Analisis Pixel Canvas Real-Time**:
  - Membaca baris-baris pixel canvas (`ctx.getImageData`) di dalam area bounding box deteksi.
  - Menghitung skor *banner-likeness* per baris (berdasarkan kecerahan, saturasi warna khas spanduk kuning/merah/putih, dan variansi tepi teks).
  - Memangkas baris atas dan bawah yang memiliki nilai rendah (< 0.18) seperti bilah kayu gelap pintu gerbang, bayangan, atau kanopi atap seng.
- **Pembatas Rasio Aspek (Aspect Ratio Clamp)**:
  - Menerapkan batasan tinggi kotak spanduk horizontal agar tidak melebihi $1.35 \times \text{lebar}$ (karena spanduk nomor HP umumnya berbentuk persegi panjang horizontal atau bujur sangkar).

### C. Rendering Efek Sensor & Watermark Kapsul Elegan (`functions/public/adminService.ts` - `applyBlurToBoundingBoxes`)
- **Mosaik Mikro Rapat**: Mengaburkan nomor kontak dan teks spanduk tanpa merusak estetika visual foto properti.
- **Lapisan Gelap Frosted Glassmorphism**: Memberikan kontras yang elegan dan bersih (`rgba(15, 23, 42, 0.82)`).
- **Watermark Kapsul Proporsional `ruangsinggah.id`**:
  - Watermark berbentuk kapsul pill modern (`ruangsinggah` putih, `.id` oranye) yang ukurannya secara dinamis menyesuaikan dimensi kotak spanduk yang dipangkas.

### D. Pengetatan Prompt AI Vision (`supabase/functions/detect-contact-banner/index.ts`)
- **Instruksi Ultra-Tight Bounding Box**: Memberikan instruksi ketat pada Gemini Vision agar bounding box `[ymin, xmin, ymax, xmax]` hanya menempel pas pada 4 sudut lembaran fisik spanduk/kain/kertas dan dilarang keras meluas ke gerbang, jeruji, tiang, atap, atau dinding.
- **Cascade Model Gemini Aktif**: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-2.5-flash`, `gemini-1.5-pro`, `gemini-3.7-flash`.

---

## 2. Hasil Pengujian & Kompilasi

### A. Uji Kompilasi Frontend (`functions/public/`)
```bash
cmd /c npm run build
```
- **Hasil**: ✅ **Lulus 100% (0 error)**
- **Output**: `✓ 2510 modules transformed. built in 30.74s`

### B. Uji Kompilasi Backend (`functions/`)
```bash
cmd /c npm run build
```
- **Hasil**: ✅ **Lulus 100% (0 error)** (`tsc` exit code 0)

---

## 3. Panduan Pengujian untuk Pengguna (User Testing)

1. Buka halaman **Dashboard Mitra** $\rightarrow$ **Kelola Kost / Tambah Kost Baru** (`/dashboard-mitra/properties`).
2. Masuk ke **Langkah 2: Media & Foto Kost** (atau upload foto utama / foto area depan gerbang).
3. Upload foto kost yang memiliki spanduk kontak nomor telepon (misal: spanduk kuning di gerbang/pagar).
4. **Hasil yang Diharapkan**:
   - Status notifikasi upload menampilkan info: *"🛡️ Foto mengandung nomor kontak/banner. Sistem otomatis menyamarkannya dengan watermark ruangsinggah.id"*.
   - Kotak sensor (blur & kapsul watermark `ruangsinggah.id`) **hanya menutupi lembaran spanduk kuning secara pas (*ultra-tight fit*)**, dan tidak lagi menjulang tinggi menutupi jeruji kayu gerbang atau atap seng kanopi.
