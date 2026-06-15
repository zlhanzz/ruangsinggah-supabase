# IMPLEMENTATION PLAN - Pengisian Otomatis Data Objektif KTP Cerdas Berbasis AI (Mitra & Agen)

Rencana ini dibuat untuk memperluas sistem verifikasi KTP (Step 2) dengan integrasi model kecerdasan buatan (Gemini AI) via Supabase Edge Function untuk ekstraksi data objektif KTP secara otomatis dan presisi, lengkap dengan fallback cerdas berbasis parser lokal.

## 1. Analisis Masalah
- **Masalah Saat Ini**:
  Meskipun kita sudah memiliki parser lokal berbasis Regex, akurasi pembacaan teks OCR sangat tergantung pada kebersihan teks. OCR yang tidak presisi (karena foto miring, bayangan, atau noise kamera) seringkali menghasilkan data typo yang sulit ditangani oleh Regex statis.
- **Solusi**:
  - Membuat Supabase Edge Function baru bernama `analyze-ktp` yang menerima teks hasil pindaian Tesseract.js.
  - Memanfaatkan API Gemini (`gemini-2.5-flash`) untuk menganalisis teks KTP tersebut secara cerdas, memperbaiki typo secara otomatis, menstandardisasi format data, dan mengembalikan objek JSON yang bersih.
  - Mengintegrasikan pemanggilan Edge Function ini pada alur pindaian profil Mitra (`MitraProfile.tsx`) dan Agen (`AgentProfile.tsx`).
  - Menjaga keandalan sistem dengan menambahkan fallback otomatis ke parser Regex lokal jika Edge Function mengalami kegagalan (network error, API limit, dll).

## 2. Dampak Perubahan
Berkas yang diubah/ditambahkan:
1. `supabase/functions/analyze-ktp/index.ts` (Baru):
   - Edge Function untuk menganalisis teks KTP dengan Gemini API.
2. `functions/public/pages/MitraProfile.tsx`:
   - Menghubungkan fungsi `performOcr` ke Edge Function `analyze-ktp` sebelum memicu fallback Regex.
3. `functions/public/pages/AgentProfile.tsx`:
   - Menghubungkan fungsi `performOcr` ke Edge Function `analyze-ktp` sebelum memicu fallback Regex.

## 3. Langkah-Langkah Eksekusi
1. **Membuat Edge Function `analyze-ktp`**:
   - Tentukan prompt optimal untuk memformat output JSON secara ketat (NIK, Nama, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan, Alamat).
2. **Perbarui Halaman Profil Mitra & Agen**:
   - Integrasikan `supabase.functions.invoke('analyze-ktp')`.
   - Simpan data hasil pemindaian langsung ke state `formData` jika sukses.
3. **Verifikasi Build & Deploy**:
   - Uji build Vite frontend untuk menjamin tidak ada error kompilasi.

## 4. Rencana Verifikasi
- Mengunggah foto KTP pada dashboard.
- Memastikan pemanggilan fungsi `analyze-ktp` berjalan lancar.
- Memastikan sistem berhasil mengisi formulir secara otomatis menggunakan data dari AI.
- Memastikan fallback lokal bekerja dengan mematikan koneksi/mensimulasikan kegagalan fungsi.

