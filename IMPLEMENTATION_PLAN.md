# IMPLEMENTATION PLAN - Perbaikan Kritis Sensor Spanduk (Pencegahan Over-Blur / Layar Gelap Total pada Fallback Heuristik & Normalisasi Watermark)

## 1. Analisis Masalah & Kebutuhan

### A. Gejala yang Dilaporkan Pengguna
Pada foto yang baru diunggah (terlihat di tangkapan layar kartu kanan bawah):
1. Foto tampak **hampir hitam pekat (gelap total / over-blurred)** dengan lapisan frosted glass `rgba(15, 23, 42, 0.84)` yang menutupi hampir 80–90% seluruh area gambar.
2. Terdapat stempel kapsul watermark `ruangsinggah.id` di area gelap tersebut, dan watermark diagonal menyelimuti foto gelap, membuat hasil foto rusak dan tidak layak tampil.
3. Pengguna menanyakan mengapa hasilnya menjadi seperti ini, mengapa sensor AI tidak bekerja, dan ada masalah dengan cara kerja watermark.

### B. Hasil Diagnostik & Akar Masalah yang Ditemukan

1. **Akar Masalah 1: Efek Salju (Cascading Snowball Merging) pada Fallback Heuristik**:
   - Karena kuota Gemini API saat ini berstatus **HTTP 429 (Resource Exhausted, batas 20 request/hari pada Free Tier telah tercapai)**, Edge Function mengembalikan kegagalan, dan frontend beralih ke `detectBannerRegionsClientSide`.
   - Pada `detectBannerRegionsClientSide`:
     - Ambang energi diturunkan terlalu sensitif (`lumDiff > 45` dan `energy >= 0.9`). Tekstur alami rumah (kerikil aspal, pagar kayu vertikal, kusen jendela, dinding bata) memicu sel berenergi tinggi di hampir setiap baris foto.
     - Setiap baris `r` menghasilkan kotak dengan tinggi `4 * step = 56px`. Karena jarak antar baris hanya `14px`, setiap baris bersinggungan secara vertikal dengan baris di bawahnya.
     - Logika `merged` dengan toleransi `pad = 30px` mengalami **efek domino (chain-reaction)**: kotak di baris 1 menempel ke baris 2, baris 2 menempel ke baris 3, dan seterusnya hingga **seluruh foto terserap menjadi satu kotak raksasa (giant rectangle)** yang menutupi hampir seluruh layar.
   - Filter `m.width > width * 0.85 && m.height > height * 0.85` tidak menolak kotak tersebut jika ukurannya misalnya 78% lebar x 82% tinggi (karena menggunakan operator `&&`).

2. **Akar Masalah 2: Efek Frosted Glass Raksasa Disangka Rusaknya Watermark**:
   - Di [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts) fungsi `applyPerspectivePolygonSensorToCanvas`:
     Ketika menerima kotak hasil sensor raksasa tersebut, fungsi menerapkan `ctx.fillStyle = 'rgba(15, 23, 42, 0.84)'` (warna gelap pekat frosted glass) dan menempatkan stempel kapsul `ruangsinggah.id` di tengah kotak raksasa.
   - Kemudian fungsi `drawRuangSinggahWatermarkPattern` menggambar pola watermark diagonal di atas foto yang sudah gelap gulita tersebut.
   - Akibatnya, pengguna melihat tampilan seolah-olah "watermark merusak foto menjadi gelap", padahal sebenarnya adalah **lapisan sensor spanduk yang membesar tanpa batas (*over-blur*)**.

3. **Akar Masalah 3: Edge Function Cloud Belum Dideploy**:
   - Modifikasi penambahan model cadangan (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) pada turn sebelumnya baru berada di repositori lokal dan **belum dideploy ke Supabase Cloud**.
   - Edge Function yang aktif di Supabase Cloud saat ini masih versi lama yang hanya mencoba model `gemini-3.5-flash` / `gemini-3.7-flash` (keduanya sudah habis kuota harian 20 RPD pada Free Tier).

---

## 2. Rencana Perbaikan (Solusi Komprehensif)

### A. Front-End: Pemasangan Hard Safety Guardrails pada `detectBannerRegionsClientSide`
1. **Batas Maksimal Ukuran Spanduk (Hard Geometric Constraints)**:
   - Spanduk atau plang kost di dunia nyata **TIDAK PERNAH** menutupi setengah foto rumah.
   - Tetapkan batas keras ukuran kotak hasil heuristik:
     - `maxWidth = width * 0.38` (maksimal 38% lebar foto).
     - `maxHeight = height * 0.28` (maksimal 28% tinggi foto).
     - `maxArea = (width * height) * 0.08` (maksimal 8% luas foto keseluruhan).
     - Jika sebuah kotak melebihi batas tersebut, **KOTAK WAJIB DIBUANG (DISCARD)**, bukan diterapkan.
2. **Eliminasi Efek Domino (Stop Snowball Merging)**:
   - Hapus pelebaran `pad = 30px` yang memicu fusi seluruh baris.
   - Gabungkan dua kotak HANYA jika terjadi tumpang tindih riil (*real intersection*, IoU > 0.25).
   - Jika penggabungan menghasilkan kotak yang melebihi batas maksimal, jangan digabung.
3. **Penyempurnaan Ambang Deteksi Energi (Anti False-Positive Tekstur Dinding/Aspal)**:
   - Tingkatkan kembali ambang batas kontras dan saturasi: spanduk sewa harus memiliki kepadatan warna cerah khas banner (`sat > 0.32`) atau kontras teks kuat di atas plang berlatar putih/gelap (`lumDiff > 70`).
   - Tekstur dinding abu-abu atau pagar kayu tidak boleh dianggap sebagai spanduk.
4. **Maksimal 2 Region Sensor Heuristik**:
   - Ambil hanya maksimal 1–2 kotak dengan skor energi tertinggi untuk mencegah clutter.

### B. Front-End: Guardrail pada `applyPerspectivePolygonSensorToCanvas`
- Sebelum menerapkan `ctx.fillRect(minX, minY, bW, bH)` dengan warna gelap `rgba(15, 23, 42, 0.84)`:
  - Validasi luas: `if (bW > width * 0.40 || bH > height * 0.30 || (bW * bH) > (width * height * 0.10))` -> Lewati / abaikan kotak tersebut untuk mencegah layar menjadi hitam pekat.

### C. Solusi Pemulihan AI Edge Function (Bebas Quota)
- Panduan jelas untuk menjalankan deploy Edge Function yang telah memuat model `gemini-2.5-flash` dan `gemini-2.0-flash`:
  `npx supabase functions deploy detect-contact-banner`
- Panduan menambahkan multi-key gratisan pada Supabase Secret `GEMINI_API_KEY` agar kuota berlipat ganda.

---

## 3. Dampak Perubahan (Files to be Touched)
1. [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts):
   - Merombak `detectBannerRegionsClientSide` dengan batas geometri ketat (max 38% lebar, max 28% tinggi, max 8% luas).
   - Memasang guardrail di `applyPerspectivePolygonSensorToCanvas` agar tidak pernah menggelapkan lebih dari 10% foto.
2. [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
   - Dokumentasi entri progres #453.
3. [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md):
   - Panduan verifikasi dan petunjuk deploy Edge Function bagi user.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)
1. Perbaiki `autoSensorService.ts` dengan memasang guardrail ketat dan membatasi merging kotak.
2. Jalankan `npm --prefix functions/public run build` dan `npm --prefix functions run build` untuk memverifikasi 0 error.
3. Catat di `functions/PROGRESS.md` entri #453 dan perbarui `WALKTHROUGH.md`.
4. Commit dan push ke remote branch `bukan-productions`.

---

## 5. Rencana Verifikasi
- Foto yang diunggah tidak akan pernah lagi menjadi gelap gulita.
- Jika ada spanduk kecil, hanya area spanduk kecil tersebut (maksimal < 8% foto) yang disamarkan.
- Foto bangunan tetap terang, tajam, dan watermark `RuangSinggah.id` tampil proporsional tanpa tertutup kegelapan.
