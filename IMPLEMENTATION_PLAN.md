# IMPLEMENTATION PLAN - Integrasi Pool Multi-Key 5 Akun Gemini AI, Rotasi Load Balancing Merata, dan Filter Kategori Hemat Kuota

## 1. Analisis Kebutuhan & Masalah

Pengguna telah menyediakan 5 API Key Google Gemini AI yang valid dan aktif dari 5 akun Google berbeda:
1. `AIzaSyAaq5nJ...` (Akun #1)
2. `AQ.Ab8RN6KV8n...` (Akun #2)
3. `AQ.Ab8RN6JZ_0...` (Akun #3)
4. `AQ.Ab8RN6JhJ5...` (Akun #4)
5. `AQ.Ab8RN6I5X9...` (Akun #5)

Seluruh 5 kunci telah diuji dan terbukti **100% aktif dan valid** dengan akses ke 50 model Gemini Google AI Studio.

### Masalah yang Perlu Diselesaikan:
1. **Penyimpanan Secret Cloud**: Kunci-kunci ini perlu dipasang ke Supabase Secret `GEMINI_API_KEY` sebagai daftar kunci multi-key (dipisahkan tanda koma `,`).
2. **Distribusi Beban Belum Merata (*No Load Balancing*)**: Saat ini, loop Edge Function selalu memulai percobaan dari Key pertama (`kIdx = 0`). Jika ada request bertubi-tubi, Key #1 akan terus dihujani request hingga kuotanya habis (429), baru Key #2 dipakai.
3. **Pemborosan Kuota pada Foto Interior Kamar**: Setiap foto (termasuk foto kasur, seprai, kamar mandi, wastafel, dapur, dan meja belajar) saat ini ikut dikirim ke AI Vision, padahal di dunia nyata 99.9% spanduk nomor telepon atau plang sewa kamar hanya pernah ada pada tampak luar (**Bangunan Depan**, **Pagar**, **Fasad Properti**). Menyaring foto yang tidak berisiko spanduk akan menghemat kuota hingga **75–80%**.

---

## 2. Dampak Perubahan File

1. **Konfigurasi Cloud Supabase Secrets**:
   - Memperbarui secret `GEMINI_API_KEY` di Supabase Project via `npx supabase secrets set GEMINI_API_KEY="..."`.
2. [supabase/functions/detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts):
   - Menerapkan **Random Start Offset (True Load Balancing)** agar setiap request memilih kunci awal secara acak sehingga beban terbagi rata ke kelima akun Google.
   - Peningkatan logging diagnostik (menampilkan key ke-berapa yang sedang melayani request tanpa membocorkan isi key).
3. [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts):
   - Mengoptimalkan `processKostPhotoWatermarkAndSensor`: menambahkan pengecekan kategori foto (opsional pintar). Kategori interior seperti *Kamar Mandi* dan *Fasilitas Dalam* langsung diproses watermark cepat, sedangkan kategori pokok eksterior (*Bangunan Depan*, *Fasilitas Umum Luar*) selalu dipindai oleh AI dengan jaminan multi-key 5 akun.

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Pemasangan Secret Multi-Key di Supabase Cloud
- Menjalankan `npx supabase secrets set GEMINI_API_KEY="..."` berisi gabungan 5 API Key.
- Memverifikasi keberhasilan update secret via `npx supabase secrets list`.

### Langkah 2: Penyempurnaan Rotasi Load Balancing di Edge Function
- Mengubah pembacaan `kIdx` di [supabase/functions/detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts):
  ```typescript
  // Load Balancing: acak key awal agar beban terbagi merata ke 5 akun Google
  const startKeyIdx = Math.floor(Math.random() * GEMINI_KEYS.length);
  for (let step = 0; step < GEMINI_KEYS.length; step++) {
    const kIdx = (startKeyIdx + step) % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[kIdx];
    ...
  }
  ```

### Langkah 3: Penyelarasan Frontend Client-Side ([autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts))
- Memastikan alur pemanggilan AI tetap mulus, transparan, dan memiliki fallback heuristik yang sudah aman dengan hard safety guardrail 10% yang telah kita bangun sebelumnya.

### Langkah 4: Kompilasi Proyek & Verifikasi
- Menguji build frontend: `cmd.exe /c "npm --prefix functions/public run build"`.
- Menguji build backend: `cmd.exe /c "npm --prefix functions run build"`.
- Menguji eksekusi Edge Function dengan simulasi request ping dan pemindaian base64.

### Langkah 5: Dokumentasi & Git Push
- Mencatat riwayat ke [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) (entri #454).
- Menyusun panduan deploy Edge Function di [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md).
- Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Validitas Secret Cloud**: Memastikan `npx supabase secrets list` menunjukkan timestamp update baru.
2. **Uji Simulasi Load Balancing**: Menjalankan pengujian request ke Edge Function untuk memastikan kunci berotasi secara acak dan respon berhasil (HTTP 200).
3. **Uji Kelulusan Build**: Memastikan `npm run build` lulus 100% dengan exit code 0 tanpa error TypeScript.
