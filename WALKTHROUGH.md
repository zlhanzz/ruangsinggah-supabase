# WALKTHROUGH - Perbaikan Sistem Deteksi Spanduk/Banner & Watermark Otomatis Foto Kost di Dashboard Mitra

Dokumen ini merangkum perbaikan menyeluruh pada integrasi frontend dan Supabase Edge Function untuk deteksi spanduk/banner kontak promosi dan penyematan watermark otomatis `ruangsinggah.id` pada foto properti di Dashboard Mitra.

---

## 1. Ringkasan Masalah & Solusi yang Diterapkan

1. **Penyelarasan Nama Edge Function**:
   - Sebelumnya frontend memanggil nama function `'detect-banner'` yang tidak ada / 404.
   - Telah diselaraskan menjadi `'detect-contact-banner'` sesuai nama fungsi terdaftar di Supabase.

2. **Penyelarasan Payload Body Parameter**:
   - Diperbarui menjadi `{ base64Image, image: base64Image, mimeType }` agar kompatibel ke dua arah baik di frontend maupun Edge Function backend.

3. **Penyelarasan Ekstraksi Data Response AI**:
   - Respons Edge Function yang mengembalikan data bersarang di `data.data` (dengan kunci `has_contact`, `boxes`, `detected_texts`) kini diekstrak secara dinamis dan tangguh:
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

4. **Timeout Guard & Retry Otomatis**:
   - Menambahkan mekanisme timeout 18 detik dan retry otomatis 1x dalam 800ms jika terjadi *cold start* pada Edge Function atau latensi jaringan seluler.

5. **Penyelarasan Cascade Model Gemini pada Edge Function**:
   - `detect-contact-banner/index.ts` menggunakan daftar model aktif: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-2.5-flash`, `gemini-1.5-pro`, `gemini-3.7-flash` dengan rotasi fallback otomatis antar kunci API.

---

## 2. Rincian Perubahan File

| File | Perubahan Logika |
| :--- | :--- |
| [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) | Memperbaiki fungsi `detectPhotoContactBanner`: memanggil `'detect-contact-banner'`, menyelaraskan body payload, menambahkan timeout guard 18s & retry 1x, serta meng-unwrap data response bersarang (`data.data.has_contact` & `data.data.boxes`). |
| [detect-contact-banner/index.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/detect-contact-banner/index.ts) | Menambahkan fallback ekstraksi body `base64Image \|\| image`, dan menyempurnakan daftar candidate models Gemini. |
| [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) | Mencatat riwayat progres fitur #334. |

---

## 3. Hasil Pengujian & Verifikasi Kompilasi

1. **Uji Kompilasi Build Frontend (Vite)**:
   ```bash
   cd functions/public && npm run build
   ```
   - **Hasil**: ✓ 2510 modules transformed, built in 32.10s, **0 errors**.
2. **Uji Kompilasi TypeScript Backend**:
   ```bash
   cd functions && tsc
   ```
   - **Hasil**: **0 errors**.

---

## 4. Panduan Pengujian oleh Pengguna (User Testing Guide)

1. Buka Dashboard Mitra pada menu **Kelola Kost / Tambah Kost** (`/dashboard-mitra/properties` $\rightarrow$ *"Tambah Kost"* atau *"Edit Kost"*).
2. Lanjutkan ke **Langkah 5: Dokumentasi Foto**.
3. Unggah foto pada kategori **Bangunan Depan (Fasad)** yang memuat spanduk / banner kontak sewa kost (misal banner nomor HP/WhatsApp).
4. **Verifikasi Hasil**:
   - Sistem akan memindai foto secara otomatis menggunakan AI Vision Edge Function.
   - Area spanduk nomor kontak akan otomatis disensor/dibutakan (*blurred*).
   - Di atas area sensor, otomatis tersemat kapsul watermark resmi `ruangsinggah.id`.
   - Kartu foto menampilkan badge status **"ruangsinggah.id"** berwarna gelap/oranye dan notifikasi perlindungan privasi aktif.
   - Jika diperlukan, tombol 🛡️ dapat diklik kapan saja untuk memindai ulang foto.
