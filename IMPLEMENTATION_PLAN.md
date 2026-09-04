# IMPLEMENTATION PLAN - Perbaikan Sistem Deteksi Spanduk/Banner & Watermark Otomatis Foto Kost di Dashboard Mitra

## 1. Analisis Masalah & Penyebab Utama (Root Cause)

Berdasarkan investigasi mendalam pada alur upload foto properti di Dashboard Mitra ([KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)), service ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)), dan Edge Function ([detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts)), ditemukan **3 ketidaksesuaian kritis** yang menyebabkan fitur deteksi banner kontak dan watermark otomatis tidak bekerja saat mengunggah foto:

1. **Mismatch Nama Edge Function**:
   - Di [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts#L5684), frontend memanggil:
     ```typescript
     supabase.functions.invoke('detect-banner', ...)
     ```
   - Sedangkan Edge Function Supabase yang didefinisikan bernama:
     ```
     detect-contact-banner
     ```
   - Hal ini menyebabkan pemanggilan selalu menghasilkan status *Function Not Found* (404/error), sehingga deteksi langsung diabaikan (*fallback silent*).

2. **Mismatch Nama Kunci Payload (Body Payload)**:
   - Frontend mengirimkan objek `{ image: base64Image, mimeType }`.
   - Edge Function [detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts#L23) membaca `const { imageUrl, base64Image, mimeType } = await req.json();`.
   - Karena frontend mengirim key `image` alih-alih `base64Image`, nilai `base64Image` di Edge Function bernilai `undefined`, yang memicu *error*: `Missing imageUrl or base64Image parameter`.

3. **Mismatch Struktur Parsing Response AI**:
   - Edge Function mengembalikan format terstruktur:
     ```json
     {
       "success": true,
       "modelUsed": "gemini-2.0-flash",
       "data": {
         "has_contact": true,
         "boxes": [{ "ymin": 100, "xmin": 200, "ymax": 300, "xmax": 800 }],
         "detected_texts": ["HUBUNGI 0812..."]
       }
     }
     ```
   - Di [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts#L5697), fungsi membaca properti langsung di root `data`:
     `Boolean(data.hasContact)` dan `data.boxes`.
   - Karena respons bersarang di `data.data` dan menggunakan snake_case (`has_contact`, `boxes`, `detected_texts`), hasil deteksi selalu terbaca `hasContact: false` dan `boxes: []`, sehingga fungsi pembuat blur dan penempel watermark kapsul `ruangsinggah.id` tidak pernah terpanggil.

4. **Ketiadaan Timeout Guard & Robust Retry**:
   - Pemanggilan function belum memiliki timeout race (misal 18 detik) dan retry otomatis jika terjadi *cold start* pada Supabase Edge Function atau fluktuasi jaringan seluler mitra.

---

## 2. Dampak Perubahan (Files to Modify)

1. [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts):
   - Memperbaiki nama endpoint Edge Function ke `'detect-contact-banner'`.
   - Menyelaraskan payload body menjadi `{ base64Image, image: base64Image, mimeType }`.
   - Memperbaiki logika ekstraksi data response agar membaca baik format `data.data` (nested snake_case/camelCase) maupun format flat root.
   - Menambahkan timeout handling (18 detik) dan opsi retry 1x jika cold start.
2. [detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts):
   - Memastikan penerimaan payload fleksibel (`base64Image || image`).
   - Memastikan urutan model Gemini aktif yang teruji (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.5-flash`).

---

## 3. Langkah-Langkah Eksekusi (Incremental Execution)

1. **Langkah 1: Perbaikan Logika Service `detectPhotoContactBanner` ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))**:
   - Ganti nama invokasi function menjadi `'detect-contact-banner'`.
   - Format payload body dengan `{ base64Image, image: base64Image, mimeType }`.
   - Parsing response fleksibel:
     ```typescript
     const rawData = data?.data || data || {};
     const hasContact = Boolean(rawData.has_contact ?? rawData.hasContact ?? false);
     const boxes = Array.isArray(rawData.boxes) ? rawData.boxes : [];
     const detectedTexts = Array.isArray(rawData.detected_texts) 
       ? rawData.detected_texts 
       : Array.isArray(rawData.detectedTexts) 
         ? rawData.detectedTexts 
         : [];
     ```
   - Terapkan timeout race guard (18s) dan penanganan log yang informatif.

2. **Langkah 2: Verifikasi & Penyelarasan Edge Function ([detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts))**:
   - Pastikan Edge Function menerima `base64Image || image`.
   - Verifikasi output JSON selalu konsisten `{ success: true, data: { has_contact, boxes, detected_texts } }`.

3. **Langkah 3: Uji Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` pada folder `functions/public/` untuk memastikan tidak ada TypeScript / lint error.

---

## 4. Rencana Verifikasi (Verification Plan)

1. **Uji Kompilasi Build Frontend**:
   - Jalankan `cmd /c npm run build` di `functions/public/` dan pastikan build selesai 100% tanpa error.
2. **Verifikasi Alur Logika**:
   - Pastikan fungsi `detectPhotoContactBanner` berhasil memanggil `detect-contact-banner` di Supabase.
   - Saat foto berisi spanduk/nomor kontak diunggah di form mitra (Langkah 5 - Foto Bangunan Depan):
     - Edge function mendeteksi koordinat spanduk / nomor HP.
     - Frontend menjalankan `applyBlurToBoundingBoxes` untuk memburamkan area banner.
     - Watermark kapsul modern `ruangsinggah.id` dirender dengan latar semi-transparan gelap dan teks putih/oranye di atas spanduk.
     - Gambar akhir dikonversi ke WebP dan badge status "ruangsinggah.id" muncul pada kartu preview foto.
