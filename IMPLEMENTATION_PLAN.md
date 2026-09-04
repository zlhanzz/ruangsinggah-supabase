# IMPLEMENTATION PLAN - Client-Side Smart Banner Trimming & Presisi Sensor Spanduk (Auto-Trim to Banner Color/Edge)

## 1. Analisis Masalah & Kebutuhan

Berdasarkan pengujian pengguna pada foto:
- **Gejala Masalah**: Kotak sensor masih berbentuk pilar vertikal yang tinggi dan *offside* hingga ke atap/jeruji gerbang, meskipun watermark kapsul berada di posisi spanduk.
- **Akar Penyebab**:
  1. **AI Menganggap Gerbang Kayu Vertikal Sebagai Frame Spanduk**: Pada foto asli, spanduk kuning/putih terpasang di atas pintu gerbang berbilah kayu vertikal gelap. AI Vision sering kali mengidentifikasi pilar gerbang tersebut sebagai batas atas spanduk, sehingga koordinat `ymin` dimulai dari atas gerbang (mendekati atap).
  2. **Ketergantungan pada Edge Function Cloud**: Edge Function berjalan di Supabase Cloud. Jika client-side hanya menerima koordinat mentah dari AI tanpa verifikasi pixel, kotak sensor akan selalu mengikuti bounding box mentah tersebut.
  3. **Ketiadaan Pemangkas Otomatis (Auto-Trimming)**: Frontend belum memiliki algoritma deteksi batas warna/kontras untuk memotong area gelap/atap non-spanduk di dalam bounding box.

---

## 2. Solusi Teknis Front-End (Smart Banner Boundary Trimming)

Alih-alih hanya mengandalkan koordinat mentah AI, front-end di [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) akan dilengkapi dengan **algoritma pemangkas pintar berbasis analisis pixel canvas (`trimToActualBannerBounds`)**:

1. **Analisis Pixel di Area Bounding Box AI**:
   - Spanduk sewa/kontak memiliki ciri visual: warna cerah/kontras (kuning, putih, merah, oranye, dll.) dan kerapatan tepi teks tinggi (*high luminance/color variance*).
   - Gerbang kayu gelap, kanopi, atau dinding semen di atas spanduk memiliki karakteristik warna gelap/monoton.
2. **Pemangkasan Batas Atas & Bawah (Vertical Trimming)**:
   - Sistem memindai baris pixel (*row-by-row*) dari atas ke bawah di dalam kotak AI.
   - Baris-baris atas yang hanya berisi gerbang gelap/atap seng akan otomatis dipotong, dan `y` dimulai tepat pada baris pertama di mana kain spanduk berwarna/berteks muncul.
   - Batas bawah `y + h` juga dipotong tepat di tepi bawah kain spanduk.
3. **Pembatasan Rasio Aspek (Anti-Pillar Clamp)**:
   - Spanduk umumnya berbentuk horizontal atau bujursangkar (lebar $\ge$ tinggi).
   - Jika rasio tinggi terhadap lebar melebihi batas wajar (`h > w * 1.25`), sistem secara cerdas membatasi tinggi kotak sensor agar berpusat pada area berdensitas teks/kontras tertinggi (lokasi spanduk sebenarnya).
4. **Watermark Kapsul Presisi**:
   - Menempatkan watermark `ruangsinggah.id` pas di tengah spanduk yang sudah dipangkas rapi.

---

## 3. Dampak Perubahan (Files to Modify)

1. [functions/public/adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts):
   - Menambahkan fungsi helper `refineBannerBoundsWithPixelAnalysis(ctx, rawBox)` untuk memangkas area non-spanduk berdasarkan variasi warna dan kecerahan pixel canvas.
   - Memperbarui `applyBlurToBoundingBoxes` agar menerapkan pemangkasan presisi sebelum memburamkan dan merender watermark.

---

## 4. Langkah-Langkah Eksekusi (Incremental Execution)

1. **Langkah 1: Implementasi Algoritma `refineBannerBoundsWithPixelAnalysis` ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))**:
   - Ekstrak data pixel (`getImageData`) pada koordinat kotak deteksi AI.
   - Hitung profil intensitas warna & variasi tepi horizontal per baris.
   - Tentukan `cropYmin` dan `cropYmax` tepat di area kain spanduk.
   - Tentukan `cropXmin` dan `cropXmax` tepat di tepi kiri & kanan spanduk.

2. **Langkah 2: Integrasi ke `applyBlurToBoundingBoxes` ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))**:
   - Terapkan pemangkasan pixel pada setiap kotak deteksi.
   - Render efek pixelate mikro dan frosted glass tepat pada area spanduk yang telah dipangkas.

3. **Langkah 3: Uji Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` di `functions/public/` dan pastikan 0 error kompilasi.

---

## 5. Rencana Verifikasi (Verification Plan)

1. **Uji Kompilasi**:
   - Jalankan `cmd /c npm run build` dan pastikan build selesai 100% tanpa error.
2. **Verifikasi Visual**:
   - Unggah foto bangunan depan dengan spanduk kecil di gerbang.
   - Kotak sensor otomatis terpangkas (*trimmed*) hanya menutupi kain spanduk kuning/putih, dan atap/gerbang di atasnya tetap terlihat bersih tanpa blur.
