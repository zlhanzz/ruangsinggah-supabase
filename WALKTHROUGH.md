# WALKTHROUGH - Pengetatan Presisi Sensor Spanduk (Ultra-Tight Fit) & Auto-Watermark di Dashboard Mitra

Dokumen ini merangkum penyempurnaan presisi deteksi AI dan algoritma sensor spanduk kontak promosi pada foto properti kost di Dashboard Mitra.

---

## 1. Ringkasan Masalah & Solusi

1. **Masalah Sensor Terlalu Besar (*Over-Extended*)**:
   - Pada foto sebelumnya, area sensor berbentuk kolom vertikal yang memanjang dari spanduk di bawah hingga ke tiang kanopi dan atap seng di atas.
   - Hal ini disebabkan oleh AI yang mengikutsertakan jeruji gerbang kayu vertikal di belakang spanduk dan clustering gap yang terlalu longgar.

2. **Solusi Pengetatan Presisi (*Ultra-Tight Bounding Box*)**:
   - **Prompt AI Vision Gemini ([detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts))**:
     - Ditambahkan batasan negatif tegas: Dilarang menyertakan struktur gerbang, jeruji pagar kayu/besi vertikal, atap kanopi, tiang, dinding, atau lantai.
     - Koordinat bounding box `ymin`, `ymax`, `xmin`, `xmax` diwajibkan menempel pas (*tight crop*) hanya pada 4 sudut lembaran kain/kertas spanduk itu sendiri.
   - **Optimasi Sensor & Watermark ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))**:
     - Toleransi gap clustering diperkecil menjadi irisan langsung (*direct intersection*) dengan margin mikro minimal (`0.8%`), mencegah pembengkakan kotak deteksi.
     - Render pixelate mikro 0.05 lebih rapat dan tajam.
     - Watermark kapsul `ruangsinggah.id` diskalakan proporsional berada pas di dalam area spanduk.

---

## 2. Rincian Perubahan File

| File | Perubahan Logika |
| :--- | :--- |
| [detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts) | Menambahkan instruksi Ultra-Tight Fit dan negative constraints untuk mengabaikan gerbang/pagar/atap di atas spanduk. |
| [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) | Memperketat clustering gap `applyBlurToBoundingBoxes`, merapikan lapisan frosted glass dan scaling watermark `ruangsinggah.id`. |
| [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) | Memperbarui catatan riwayat progres fitur #334. |

---

## 3. Hasil Pengujian & Build

1. **Frontend Build (Vite)**:
   ```bash
   cd functions/public && npm run build
   ```
   - **Hasil**: ✓ 2510 modules transformed, built in 30.09s, **0 errors**.
2. **Backend Build (TypeScript)**:
   ```bash
   cd functions && tsc
   ```
   - **Hasil**: **0 errors**.

---

## 4. Panduan Pengujian oleh Pengguna (User Testing Guide)

1. Buka Dashboard Mitra pada menu **Kelola Kost / Tambah Kost** (`/dashboard-mitra/properties`).
2. Masuk ke **Langkah 5: Dokumentasi Foto Properti**.
3. Unggah kembali foto **Bangunan Depan (Fasad)** yang memuat spanduk sewa kost.
4. **Verifikasi Visual**:
   - Area blur/sensor kini **hanya menutupi lembaran spanduk secara pas (tight fit)**.
   - Pagar kayu/besi di atas spanduk, kanopi, dan atap tidak lagi tertutup blur.
   - Watermark kapsul `ruangsinggah.id` tampil proporsional tepat di tengah spanduk.
