# IMPLEMENTATION PLAN - Perbaikan Sensor Spanduk / Kontak (Penanganan Quota AI 429, Deteksi Validasi Respon, dan Penguatan Fallback Heuristik Client-Side)

## 1. Analisis Masalah & Kebutuhan

### A. Gejala yang Dilaporkan
Pengguna melaporkan bahwa sensor banner/spanduk kontak tidak bekerja lagi saat pengujian unggah foto baru (termasuk pada foto kategori "Bangunan Depan" yang memuat spanduk/plang sewa kost di pagar gerbang dan dinding), padahal sebelumnya bekerja dengan sangat baik.

### B. Diagnostik Langsung & Temuan Fakta
Setelah dilakukan simulasi pengujian langsung ke endpoint Supabase Edge Function `detect-contact-banner`, ditemukan 2 akar masalah teknis yang saling berkaitan:

1. **Akar Masalah 1: Respon Error AI Tersamar Menjadi "Foto Bersih" di Frontend (`autoSensorService.ts`)**:
   - Ketika seluruh model AI di Edge Function gagal (misalnya kuota harian habis), Edge Function mengembalikan HTTP 200 dengan payload:
     ```json
     { "success": false, "error": "Semua model Gemini gagal...", "data": { "has_contact": false, "boxes": [] } }
     ```
   - Di [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts) (baris 503–518):
     Fungsi `detectPhotoContactBanner` hanya mengecek `if (error)` (transport error Supabase client). Karena HTTP status bernilai 200, transport error bernilai `null`. Fungsi langsung masuk ke blok `if (data)` dan mengambil `rawData = data.data = { has_contact: false, boxes: [] }` **tanpa mengecek status `data.success === false`**.
   - Akibatnya, `detectPhotoContactBanner` mengembalikan hasil tanpa properti `error`.
   - Di fungsi `processPhotoWithAutoSensor`:
     ```typescript
     if (!aiResult.error) {
         aiScanSucceeded = true; // Dianggap SUKSES memindai dan foto dinyatakan bersih!
     }
     ...
     // Fallback Heuristik Client-Side HANYA aktif jika !aiScanSucceeded
     if (!aiScanSucceeded && bannersToApply.length === 0) {
         // KODE INI TERLEWATI TOTAL DAN TIDAK PERNAH DIJALANKAN!
     }
     ```
   - **Dampak Fatal**: Fallback Heuristik Client-Side offline yang dirancang untuk menyelamatkan sistem saat AI bermasalah **mati total**, sehingga foto lolos tanpa sensor apa pun.

2. **Akar Masalah 2: Quota Free Tier Gemini API Habis (HTTP 429 Resource Exhausted)**:
   - Log eksekusi langsung Edge Function mengungkap:
     - `gemini-3.5-flash`: Menghasilkan **HTTP 429** (*"Generate content requests per day limit exceeded on Free Tier: limit 20 requests per day"*).
     - `gemini-3.8-flash`: Menghasilkan **HTTP 503** (*"This model is currently experiencing high demand"*).
     - `gemini-3.5-flash-lite`: Menghasilkan **HTTP 400** (*"Request contains an invalid argument"* karena tidak mendukung `thinkingBudget: 0`).
     - `gemini-3.7-flash`: Menghasilkan **HTTP 429** (*"limit 20 requests per day on Free Tier"*).
   - Akun Google AI Studio yang digunakan berada di Free Tier (maksimal 20 request per hari per model family). Karena pengujian berulang telah melebihi 20 request dalam 24 jam terakhir, AI Vision menolak seluruh request baru sampai reset kuota.

---

## 2. Rencana Perubahan (Solusi Terstruktur)

### A. Perbaikan Front-End: [autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts)
1. **Validasi Respon AI yang Ketat**:
   - Memeriksa `if (data.success === false || data.error)` pada hasil `supabase.functions.invoke`.
   - Jika terdeteksi error dari Edge Function, kembalikan objek dengan `error: data.error`, sehingga `aiScanSucceeded = false`.
2. **Aktivasi Otomatis Fallback Heuristik Cerdas**:
   - Jika AI gagal (`!aiScanSucceeded`), sistem seketika mengeksekusi `detectBannerRegionsClientSide(ctx, width, height)` di canvas browser secara lokal tanpa membutuhkan kuota internet/API eksternal.
3. **Penguatan Algoritma `detectBannerRegionsClientSide`**:
   - Menyempurnakan deteksi kluster warna, kontras teks, dan bentuk plang/spanduk (termasuk spanduk pada gerbang kayu/besi dan dinding depan) agar penyamaran tetap bekerja presisi bahkan saat AI sedang offline atau kehabisan kuota.
4. **Log Informasi di Console**:
   - Menambahkan log jelas jika terjadi fallback ke heuristik lokal agar pengembang/admin dapat langsung mengetahui status kuota AI.

### B. Perbaikan Back-End Edge Function: [supabase/functions/detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts)
1. **Ekspansi Model Cadangan Multi-Family**:
   - Menambahkan model dengan kuota terpisah di Google AI Studio: `"gemini-2.5-flash"`, `"gemini-2.0-flash"`, `"gemini-1.5-flash"`, `"gemini-2.0-flash-lite"`.
2. **Penanganan Fleksibel Parameter `thinkingConfig`**:
   - Jika model mengembalikan error 400 (Invalid Argument), ulangi otomatis (*auto-retry*) tanpa parameter `thinkingConfig` sebelum beralih ke model lain.
3. **Status Kode HTTP yang Tepat**:
   - Jika seluruh model gagal, Edge Function mengembalikan status HTTP 429/500 dan payload `{ success: false, error: ... }` agar tidak ada lagi ambiguitas di sisi front-end.

---

## 3. Dampak Perubahan (Files to be Touched)
1. [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts)
   - Memperbaiki penanganan respon `detectPhotoContactBanner` agar tidak mengabaikan error edge function.
   - Mengoptimalkan eksekusi fallback heuristik `detectBannerRegionsClientSide`.
2. [supabase/functions/detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts)
   - Memperluas model kandidat Gemini dan menangani kompatibilitas `thinkingConfig`.
3. [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md)
   - Dokumentasi riwayat progres entri #452.
4. [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md)
   - Laporan perubahan dan panduan verifikasi.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)
1. **Modifikasi `autoSensorService.ts`**:
   - Tambahkan pengecekan `data.success === false || data.error` di `detectPhotoContactBanner`.
   - Pastikan fallback `detectBannerRegionsClientSide` selalu aktif ketika AI tidak menghasilkan sensor akibat error kuota.
2. **Modifikasi `detect-contact-banner/index.ts`**:
   - Perluas daftar `CANDIDATE_MODELS` dengan fallback `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`.
   - Tambahkan safe fallback pada `thinkingConfig` jika model tidak mendukungnya.
3. **Kompilasi & Verifikasi Build**:
   - Jalankan `npm --prefix functions/public run build` untuk memastikan 0 error frontend.
   - Jalankan `npm --prefix functions run build` untuk memastikan 0 error backend.
4. **Pencatatan Progres & Walkthrough**:
   - Catat di `functions/PROGRESS.md` entri #452.
   - Update `WALKTHROUGH.md` lengkap dengan instruksi deploy function dan tips multi-key Gemini.
5. **Git Commit & Push**:
   - Push perubahan ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi
- **Uji Simulasi Fallback Heuristik**: Menguji upload foto dengan spanduk saat API offline/terhambat, memastikan sensor tetap diterapkan di canvas lokal.
- **Uji Kompilasi**: `npm run build` berhasil 100% dengan exit code 0.
