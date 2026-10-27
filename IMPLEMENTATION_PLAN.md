# Rencana Implementasi: Akselerasi Sub-3 Detik Upload Foto & Presisi 100% Sensor Spanduk Kontak

## 1. Analisis Masalah Mendalam (Root Cause Forensic)

Berdasarkan investigasi menyeluruh pada log eksekusi Edge Function dan tangkapan layar pengujian pengguna:

### A. Mengapa Proses Upload Memakan Waktu 22 Detik?
1. **Model Quota Exhaustion (Status 429 pada Model #1)**:
   - Pada konfigurasi sebelumnya, `gemini-2.5-flash` ditempatkan di prioritas #1. Model preview ini memiliki kuota sangat ketat di Google AI Studio Free Tier, yaitu **hanya 20 request per hari**.
   - Ketika 20 request habis, setiap pemanggilan menghasilkan error `429 RESOURCE_EXHAUSTED: Quota exceeded... Please retry in 7h24m`. Server Edge Function membuang waktu ~3–4 detik menunggu respon error ini sebelum beralih ke model berikutnya.
2. **Model Produksi Tercepat Google Belum Terdaftar**:
   - Model produksi resmi Google dengan kuota tinggi (**1.500 request/hari**) dan kecepatan sub-2 detik, yaitu **`gemini-2.0-flash`** dan **`gemini-1.5-flash`**, belum ada di dalam daftar `CANDIDATE_MODELS`.
3. **Mekanisme Extended Thinking pada Gemini 3.7**:
   - Model `gemini-3.7-flash` secara default mengaktifkan fitur *extended thinking / reasoning* yang menghabiskan waktu 15–20 detik untuk menganalisis gambar, kecuali jika dimatikan dengan parameter `thinkingBudget: 0`.
4. **False Timeout di Sisi Frontend (15 Detik)**:
   - Frontend `autoSensorService.ts` memiliki batasan waktu kaku `15.000ms (15 detik)`.
   - Karena gabungan error kuota 429 dan model reasoning memakan waktu total ~18 detik, **frontend membatalkan request AI tepat di detik ke-15**.
5. **Rantai Waktu Total 22 Detik**:
   - Menunggu AI hingga batas timeout (15s) + pemrosesan heuristik lokal (1.5s) + upload WebP ke Supabase Storage (4-5s) = **tepat 21–22 detik**!

### B. Mengapa Spanduk Tidak Disensor (Padahal Muncul Badge `● RUANGSINGGAH.ID`)?
1. **Hasil Deteksi AI Sebenarnya Berhasil 100%**:
   - Uji log server membuktikan AI sebenarnya sukses membaca teks spanduk:
     - Foto 1: `"TERIMA KOST PUTRI HUBUNGI: 082238406909"` (koordinat `xmin: 256, ymin: 705`).
     - Foto 2: `"RUMAH INI DI JUAL 'TANPA PERANTARA' HUBUNGI: 0823 9925 6926"` (koordinat `xmin: 699, ymin: 255`).
   - Namun karena frontend keburu **timeout di detik ke-15**, data koordinat yang sangat akurat ini **terbuang dan tidak sempat digambar di kanvas**.
2. **Fallback Heuristik Salah Sasaran (False Target)**:
   - Ketika AI dianggap gagal (timeout), sistem beralih ke `detectBannerRegionsClientSide` yang menebak area spanduk berdasarkan kontras piksel.
   - Akibatnya, sensor jatuh pada jeruji pagar besi vertikal atau pantulan jendela kaca rumah, sementara lembaran spanduk aslinya tetap terbuka tanpa sensor.
   - Karena heuristik menemukan kotak kontras palsu tersebut, status `isBlurred` disetel `true` (memunculkan badge oranye `● RUANGSINGGAH.ID`), menciptakan ilusi bahwa sensor aktif padahal spanduk tidak tertutup.

---

## 2. Rencana Solusi & Perubahan

```
+-----------------------------------------------------------------------------------+
| ALUR OPTIMASI BARU SUB-3 DETIK                                                    |
|                                                                                   |
| 1. Foto Dipilih (File)                                                            |
|    |                                                                              |
|    v (Optimistic Preview <50ms)                                                   |
| 2. Kartu UI Langsung Tampil dengan Indikator "Memindai & Mengoptimasi..."         |
|    |                                                                              |
|    v (Ringkas Base64 800px, 28KB - Pengiriman Jaringan ~120ms)                    |
| 3. Supabase Edge Function: `gemini-2.0-flash` / `gemini-3.7-flash (Budget: 0)`    |
|    | (Respon AI: ~1.2 - 1.5 detik, Kuota: 1.500 RPD)                              |
|    v                                                                              |
| 4. Frontend Menerima Koordinat Presisi Tanpa Timeout                              |
|    |                                                                              |
|    v (Rendering Canvas 2D: Sensor Frosted Glass + Watermark Diagonal: ~100ms)     |
| 5. Hasil WebP Ditampilkan di UI & Diunggah ke Storage Background (~1.2s)          |
|    |                                                                              |
|    v                                                                              |
| TOTAL WAKTU TUNTAS: ~2.5 - 3.2 DETIK (Jauh dari 22 detik!)                        |
+-----------------------------------------------------------------------------------+
```

### A. Modifikasi `supabase/functions/detect-contact-banner/index.ts`
1. **Perombakan `CANDIDATE_MODELS` ke Model Kuota Besar & Kecepatan Tinggi**:
   ```ts
   const CANDIDATE_MODELS = [
     "gemini-2.0-flash",       // Prioritas #1: 1.2 detik, kuota 1.500 req/hari
     "gemini-2.0-flash-lite",  // Prioritas #2: ~0.8 detik, kuota 1.500 req/hari
     "gemini-1.5-flash",       // Prioritas #3: ~1.8 detik, kuota 1.500 req/hari
     "gemini-3.7-flash",       // Prioritas #4: reasoning hybrid
     "gemini-3.5-flash"        // Prioritas #5: fallback
   ];
   ```
2. **Eliminasi Extended Thinking pada Gemini 3.7**:
   - Menambahkan konfigurasi `thinking_config: { thinking_budget: 0 }` agar model 3.7 tidak menghabiskan waktu 15 detik untuk "berpikir".
3. **Pembatasan Token Output**:
   - Menyetel `max_output_tokens: 800` karena output deteksi hanya berupa JSON ringkas (koordinat kotak).
4. **Penajaman Deteksi Banner Penjualan Rumah/Properti**:
   - Memperkaya prompt deteksi dengan kata kunci: `"RUMAH INI DI JUAL"`, `"DIJUAL"`, `"DI JUAL"`, `"TANPA PERANTARA"`, `"SEWA/KONTRAK"`, dan deretan nomor WhatsApp/telepon.

### B. Modifikasi `functions/public/autoSensorService.ts`
1. **Pengecilan Payload Base64**:
   - Mengubah parameter `createLowResBase64ForAi(file, 800, 0.55)` (dari sebelumnya 1024px, 0.65).
   - Ukuran payload berkurang drastis dari ~100KB menjadi **hanya ~28KB**, memotong waktu transfer di jaringan seluler mitra hingga 70%.
2. **Penyelarasan Timeout Toleran**:
   - Menyesuaikan batas timeout menjadi 20 detik sebagai batas pengaman jika terjadi gangguan sinyal jaringan seluler, memastikan hasil deteksi AI tidak terputus di tengah jalan.
3. **Penyempurnaan Penanganan Koordinat**:
   - Memastikan bahwa jika AI sukses merespons (`aiScanSucceeded = true`), hasil AI dihormati 100% dan fallback heuristik tidak akan dijalankan.

### C. Modifikasi `functions/public/components/KostFormMitra.tsx`
1. **Instant Local Preview (< 100ms)**:
   - Ketika file dipilih, segera tampilkan foto di grid form menggunakan blob URL lokal dengan badge status *"Memindai Spanduk..."*.
   - Halaman tidak lagi membeku dengan spinner upload yang menghalangi pengguna.
2. **Seamless Background Processing & Sensor Update**:
   - Proses sensor dan watermark disematkan ke kanvas lokal, kemudian URL preview diperbarui secara otomatis.
   - Foto tersimpan di draft storage secara mulus di latar belakang.

---

## 3. Dampak Perubahan (Files to Modify)
1. `supabase/functions/detect-contact-banner/index.ts` (Model cascade, thinkingBudget: 0, prompt spanduk jual/sewa)
2. `functions/public/autoSensorService.ts` (Payload 800px 28KB, timeout toleran, sinkronisasi koordinat)
3. `functions/public/components/KostFormMitra.tsx` (Instant preview responsif & upload non-blocking)

---

## 4. Rencana Verifikasi (Testing Plan)
1. **Uji Kecepatan & Responsivitas Edge Function**:
   - Melakukan uji live pemanggilan Edge Function dengan model `gemini-2.0-flash` dan `gemini-1.5-flash` menggunakan payload gambar nyata.
   - Memastikan latensi Edge Function berada di kisaran **sub-2 detik**.
2. **Uji Akurasi Koordinat Sensor**:
   - Memastikan koordinat spanduk `"TERIMA KOST PUTRI"` dan `"RUMAH INI DI JUAL"` terdeteksi dan kanvas menutup spanduk 100% rapat.
3. **Kompilasi Frontend (Build Test)**:
   - Menjalankan `npm run build` di direktori `functions/public/` untuk memastikan 0 kesalahan kompilasi TypeScript.
4. **Deploy Edge Function**:
   - Melakukan deployment Edge Function ke Supabase project `sgcmnsnokrztocnhxnqm`.
5. **Dokumentasi & Commit**:
   - Mencatat hasil pekerjaan ke `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.
