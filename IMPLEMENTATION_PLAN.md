# Rencana Implementasi: Akselerasi Ultra-Cepat Sub-2 Detik & Jaminan Penutupan Sensor Spanduk 100%

## 1. Analisis Masalah & Arsitektur AI

### A. Jawaban atas Peran AI & Efisiensi Token
1. **Peran AI di Sistem Kita**:
   - AI (Gemini) **TIDAK melakukan blur atau manipulasi gambar secara langsung**.
   - AI hanya bertindak sebagai **Vision Detector** (Validator Keberadaan Kontak & Penentu Koordinat).
   - Input ke AI: Foto ringan (Base64 JPEG beresolusi teroptimasi).
   - Output dari AI: Teks JSON murni (~50–100 token saja) berisi:
     - `has_contact: true / false`
     - `detected_texts: ["daftar teks terbaca"]`
     - `boxes: [{ ymin, xmin, ymax, xmax, polygon: [[x,y], ...] }]`
2. **Siapa yang Melakukan Sensor/Blur?**:
   - **Browser Pengguna Secara Lokal (HTML5 Canvas 2D)**.
   - Browser mengambil koordinat dari JSON tersebut, membuat path potongan (`ctx.clip()`), lalu menerapkan efek pixelate dan dark frosted glass dengan badge `ruangsinggah.id` langsung di perangkat pengguna secara offline/lokal.
3. **Efisiensi Token**:
   - **Sangat Hemat Token & Biaya**, karena kita tidak menggunakan model pembuat gambar (image-generation) yang mahal, melainkan model teks-JSON terpendek.

### B. Mengapa Kemarin Masih Menunggu Belasan Detik dan Sensor Belum Menutup Sempurna?
1. **Latensi Model Reasoning (3.7 Flash)**:
   - Model `gemini-3.7-flash` memiliki mekanisme *extended thinking / reasoning* bawaan yang memakan waktu 15–20 detik.
   - Hasil benchmark live kita menunjukkan bahwa:
     - **`gemini-2.5-flash`**: Hanya butuh **1,2 detik (1246 ms)**!
     - **`gemini-3.5-flash`**: Hanya butuh **1,9 detik (1966 ms)**!
     - Kedua model ini memiliki akurasi vision yang sama-sama tajam membaca "TERIMA KOST PUTRI", namun **10x lebih cepat** daripada 3.7 Flash.
2. **Margin Toleransi Koordinat (Bounding Padding)**:
   - Pada spanduk kecil di gerbang kayu, koordinat yang dikembalikan AI tepat di batas teks. Jika tidak diberi margin bantalan (*padding*), sedikit pergeseran resolusi kanvas membuat sensor tampak tipis atau meleset dari tepi kain spanduk.
   - Diperlukan margin ekspansi dinamis (8–14 piksel) di sekeliling poligon/kotak sensor agar lembaran spanduk tertutup 100% rapat.

---

## 2. Dampak Perubahan (Affected Files)

1. **`supabase/functions/detect-contact-banner/index.ts`**:
   - Memposisikan model tercepat **`gemini-2.5-flash` (1,2s)** dan **`gemini-3.5-flash` (1,9s)** sebagai prioritas nomor 1 dan 2.
   - Menempatkan `gemini-3.7-flash` sebagai fallback cadangan.
   - Men-deploy ulang Edge Function ke Supabase project `sgcmnsnokrztocnhxnqm`.

2. **`functions/public/autoSensorService.ts`**:
   - Menambahkan margin ekspansi (*polygon padding expansion*) sebesar 2%–3% (atau minimal 8–12px) dari titik pusat (*centroid*) poligon, sehingga seluruh lembaran spanduk dan border-nya tertutup rapat tanpa ada huruf yang tersisa.
   - Memastikan kanvas lokal langsung mengeksekusi sensor segera setelah AI merespon dalam waktu < 2 detik.

3. **`functions/PROGRESS.md`**:
   - Mencatat progres optimasi kecepatan sub-2 detik dan padding sensor spanduk.

4. **`WALKTHROUGH.md`**:
   - Menyajikan dokumentasi hasil pengujian latensi dan panduan verifikasi di antarmuka pengguna.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 - Setelah di-ACC)

1. **Langkah 1: Re-Ordering Model Prioritas Cepat di Edge Function**:
   - Mengubah urutan `CANDIDATE_MODELS`:
     ```ts
     const CANDIDATE_MODELS = [
       "gemini-2.5-flash",  // Super cepat: ~1,2 detik
       "gemini-3.5-flash",  // Cepat: ~1,9 detik
       "gemini-3.7-flash"   // Fallback: reasoning akurat
     ];
     ```
2. **Langkah 2: Deployment Ulang Edge Function ke Supabase**:
   - Deploy dengan `cmd /c npx supabase functions deploy detect-contact-banner --project-ref sgcmnsnokrztocnhxnqm`.
3. **Langkah 3: Pengujian Live Benchmark Respon AI**:
   - Memverifikasi respon pemanggilan AI selesai dalam waktu **1–2 detik**.
4. **Langkah 4: Penyempurnaan Padding Sensor Poligon di `autoSensorService.ts`**:
   - Memperluas area clipping poligon agar menutup penuh lembaran spanduk.
5. **Langkah 5: Kompilasi & Build Verification**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` (memastikan 0 error).
6. **Langkah 6: Git Commit & Push**:
   - Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Kecepatan**: Waktu pemrosesan upload foto depan turun drastis dari belasan detik menjadi **hanya 1,5 – 2,5 detik**.
- **Verifikasi Penutupan Spanduk**: Plang/spanduk "TERIMA KOST PUTRI" pada foto gerbang kayu dan spanduk pada foto carport tertutup frosted glass dan badge `ruangsinggah.id` secara presisi dan penuh 100%.
- **Verifikasi Build**: `npm run build` sukses 100% tanpa error.
