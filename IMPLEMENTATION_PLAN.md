# IMPLEMENTATION PLAN - Pengetatan Presisi Sensor & Watermark Spanduk (Ultra-Tight Bounding Box Fit)

## 1. Analisis Masalah & Kebutuhan

Berdasarkan hasil pengujian pada foto contoh pengguna:
- **Gejala Masalah**: Area sensor (blur dan lapisan gelap) tampak terlalu tinggi dan besar (*over-extended*), memanjang vertikal dari area spanduk di bawah hingga ke tiang kanopi/atap seng di atas.
- **Akar Penyebab**:
  1. **Prompt AI Vision Gemini** pada Edge Function belum memuat instruksi anti-struktur yang cukup tegas. Gemini mengidentifikasi bilah pagar/pintu gerbang kayu vertikal di belakang spanduk sebagai bagian dari objek spanduk, sehingga koordinat `ymin` tertarik ke atas mendekati atap.
  2. **Algoritma Clustering di Client-side (`adminService.ts`)** menggunakan toleransi jarak (`gapY = 3.5%`) yang dapat menggabungkan kotak deteksi teks terpisah di area vertikal menjadi satu blok raksasa.
  3. **Belum Ada Validasi Proporsi Bounding Box**: Belum ada batasan pemotongan/penyesuaian proporsi jika model mendeteksi area non-spanduk.

---

## 2. Dampak Perubahan (Files to Modify)

1. [supabase/functions/detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts):
   - Memperketat prompt AI Vision Gemini dengan aturan **Ultra-Tight Fit**:
     - Tegas melarang memasukkan pagar, jeruji gerbang, kanopi, atap seng, atau tiang bangunan ke dalam koordinat bounding box.
     - `ymin` dan `ymax` wajib menempel presisi hanya pada tepi atas dan tepi bawah kain/kertas spanduk.
     - Memberikan instruksi rasio aspek (spanduk umumnya persegi/horizontal, bukan kolom vertikal menjulang).
2. [functions/public/adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts):
   - Menyempurnakan fungsi `applyBlurToBoundingBoxes`:
     - Memperbaiki algoritma clustering agar hanya menggabungkan kotak yang benar-benar beririsan (*intersection over union / direct overlap*) tanpa pembengkakan gap berlebih.
     - Memastikan padding sensor minimal dan proporsional sehingga blur benar-benar menempel pas (*fit*) pada spanduk.
     - Penyesuaian ukuran font dan padding watermark kapsul `ruangsinggah.id` agar serasi dengan ukuran spanduk riil.

---

## 3. Langkah-Langkah Eksekusi (Incremental Execution)

1. **Langkah 1: Penyempurnaan Prompt Ultra-Tight AI Vision ([detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts))**:
   - Tambahkan instruksi pembeda yang jelas antara "kain/kertas spanduk kontak" vs "struktur bangunan/pagar vertikal".
   - Terapkan parameter batas koordinat ketat hanya pada teks kontak dan banner fisik.

2. **Langkah 2: Optimasi Algoritma Clustering & Sensor Fit ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))**:
   - Ganti gap expansion dengan *direct intersection / minimal margin* (hanya 4–8px margin untuk menutupi teks tepi).
   - Pastikan watermark `ruangsinggah.id` menyesuaikan skala otomatis sesuai lebar dan tinggi kotak spanduk.

3. **Langkah 3: Uji Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.

---

## 4. Rencana Verifikasi (Verification Plan)

1. **Uji Kompilasi**:
   - Jalankan `cmd /c npm run build` dan pastikan build selesai 100% tanpa error.
2. **Verifikasi Visual**:
   - Saat foto bangunan depan yang memuat spanduk kecil diunggah, kotak blur hanya melingkupi kain spanduk tanpa merembet ke atap seng atau jeruji pagar di atasnya.
   - Watermark `ruangsinggah.id` berada tepat di tengah area spanduk dengan ukuran yang proporsional.
