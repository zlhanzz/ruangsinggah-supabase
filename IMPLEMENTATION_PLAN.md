# Rencana Implementasi: Migrasi Langsung ke Gemini 3.7 Flash & Penajaman Deteksi Sensor Spanduk Presisi

## 1. Analisis Masalah & Temuan Diagnostik

Berdasarkan investigasi langsung terhadap Edge Function live dan foto terbaru yang Anda unggah (`media_1791128615210.png`):

1. **Akar Masalah Keterlambatan Respon (96 Detik) & Timeout**:
   - Di Edge Function `detect-contact-banner`, model `gemini-3.7-flash` berada di urutan terbawah (`index 4`).
   - Server mencoba model-model di atasnya (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`) yang berulang kali gagal di semua API key.
   - Akibatnya, pemanggilan Edge Function memakan waktu **96,35 detik** sebelum akhirnya berhasil mencapai `gemini-3.7-flash`.
   - Sementara itu, di front-end (`autoSensorService.ts`), timeout disetel **7,5 detik**. Karena server belum merespon pada detik ke-7,5, front-end membatalkan request AI dan mengira koneksi AI gagal.

2. **Akar Masalah Mengapa Sensor Meleset atau Tidak Menutup Spanduk**:
   - Karena request AI timeout di front-end, sistem beralih ke *Fallback Heuristik Client-Side* (`detectBannerRegionsClientSide`).
   - Heuristik lokal bekerja berdasarkan algoritma kontras piksel sederhana (bukan AI vision). Pada foto sebelumnya, algoritma salah mendeteksi kontras antara jeruji pagar besi hitam dan bilah kayu, sehingga kotak sensor diletakkan di pagar sebelah kanan spanduk (meleset).
   - Pada foto terbaru Anda, heuristik tidak menemukan kontras yang cukup, sehingga tidak ada sensor yang digambar, meski badge status sudah terlanjur berstatus aktif.

3. **Validasi Model Gemini 3.7 Flash**:
   - Berdasarkan pengujian langsung tadi, **`gemini-3.7-flash` terbukti 100% aktif, didukung oleh API key Anda, dan berhasil membaca teks secara tepat**:
     ```json
     {
       "success": true,
       "modelUsed": "gemini-3.7-flash",
       "data": {
         "has_contact": true,
         "detected_texts": ["TERIMA KOST PUTRI"],
         "boxes": [ ... ]
       }
     }
     ```
   - Dengan memangkas model usang dan **langsung menjadikan `gemini-3.7-flash` sebagai prioritas #1**, waktu eksekusi akan terpangkas drastis dari **96 detik menjadi ~1,5 – 3 detik**, berada jauh di bawah batas timeout front-end sehingga sensor AI akan 100% aktif dan tepat sasaran.

---

## 2. Dampak Perubahan (Affected Files)

1. **`supabase/functions/detect-contact-banner/index.ts`**:
   - Memperbarui daftar `CANDIDATE_MODELS` dengan menempatkan `gemini-3.7-flash` di posisi teratas (#1).
   - Menambahkan varian fallback resmi seperti `gemini-2.0-flash-exp` atau `gemini-3.8-flash` (jika tersedia), serta membersihkan model yang tidak aktif.
   - Memastikan format pengembalian koordinat poligon 4 titik (`[x, y]`) dan bounding box (`ymin, xmin, ymax, xmax`) ter-validasi dengan baik.
   - Men-deploy ulang Edge Function ke Supabase project `sgcmnsnokrztocnhxnqm`.

2. **`functions/public/autoSensorService.ts`**:
   - Menyesuaikan timeout pemanggilan AI dari 7,5s menjadi 12s agar memberikan toleransi jaringan seluler yang memadai namun tetap responsif bagi pengguna.
   - Memperkuat kalkulasi parsing koordinat poligon 4 titik agar memastikan titik koordinat `[x, y]` selalu terpetakan secara presisi 1:1 ke kanvas foto asli.
   - Menyempurnakan pembobotan heuristik fallback client-side agar tidak menargetkan pagar kayu/besi jika AI sedang tidak terjangkau.

3. **`functions/PROGRESS.md`**:
   - Mencatat progres fitur dan penyesuaian model AI terbaru.

4. **`WALKTHROUGH.md`**:
   - Membuat panduan ringkasan perubahan teknis dan langkah verifikasi hasil.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 - Setelah di-ACC)

1. **Langkah 1: Konfigurasi Model Prioritas pada Edge Function**:
   - Mengubah `CANDIDATE_MODELS` pada `supabase/functions/detect-contact-banner/index.ts`:
     ```ts
     const CANDIDATE_MODELS = [
       "gemini-3.7-flash",
       "gemini-2.0-flash-exp",
       "gemini-2.0-flash"
     ];
     ```
   - Menambahkan pengaman agar model 404/400 langsung di-skip seketika tanpa menunggu berulang.

2. **Langkah 2: Deployment Ulang Edge Function**:
   - Menjalankan perintah `cmd /c npx supabase functions deploy detect-contact-banner --project-ref sgcmnsnokrztocnhxnqm`.

3. **Langkah 3: Pengujian Kecepatan & Akurasi Langsung (Live Benchmark)**:
   - Menjalankan kembali skrip uji diagnostik dengan gambar pagar kost pengguna untuk memverifikasi bahwa respon kembali dalam < 3 detik dengan koordinat spanduk "TERIMA KOST PUTRI".

4. **Langkah 4: Sinkronisasi Frontend `autoSensorService.ts`**:
   - Memastikan timeout 12s dan normalisasi poligon `[x, y]` terpetakan sempurna ke canvas.

5. **Langkah 5: Kompilasi & Build Verification**:
   - Menjalankan `cmd /c npm run build` di direktori `functions/public/` hingga lulus 100% tanpa error.

6. **Langkah 6: Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Latensi Respon**: Pemanggilan `detect-contact-banner` harus selesai dalam kurun waktu **1,5 – 3,5 detik** (dari sebelumnya 96 detik).
- **Verifikasi Deteksi Teks Spanduk**: Teks "TERIMA KOST PUTRI" terdeteksi oleh `gemini-3.7-flash`.
- **Verifikasi Penempatan Sensor**: Kotak sensor poligon terpasang tepat membungkus plang kayu/kertas "TERIMA KOST PUTRI", tidak meleset ke pagar besi hitam di sampingnya.
- **Verifikasi Kompilasi Frontend**: `npm run build` sukses 0 error.
