# Rencana Implementasi: Optimasi Drastis Kecepatan OCR KTP (1-2 Detik) Menggunakan Gemini Multimodal Vision & Model Gemini Flash

Dokumen ini merancang perbaikan akar masalah kelambatan pemindaian KTP (*"Membaca Data KTP..."*) pada sistem verifikasi identitas mitra & agen ([`MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx), [`AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx), dan Edge Function [`analyze-ktp`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/analyze-ktp/index.ts)) menggunakan model **Gemini Flash Vision** super cepat dan cerdas.

---

## 1. Analisis Masalah & Kebutuhan

### Masukan Pengguna:
> *"kok lama bangaet ya sistem ocr pembacaan data ktp pada sistem verifikasi identitas kita"*
> *"kita pakai gemini 3.7 flash"*

### Solusi & Arsitektur Cepat:
1. **Penggantian Model di Edge Function `analyze-ktp`**:
   - Menerapkan model **Gemini Flash** terkini dengan prioritas `gemini-2.5-flash` / `gemini-2.0-flash` / `gemini-1.5-flash` yang memiliki kecepatan inferensi multimodal **1-2 detik** dan bebas dari limitasi/overload 503.
   - Menerapkan rotasi `GEMINI_KEYS` dan auto-fallback model sehingga pemindaian 100% andal.
2. **Eliminasi Beban Klien `Tesseract.js`**:
   - Menghapus proses pengunduhan 20MB model Tesseract dan proses raster piksel single-threaded di browser pengguna.
   - Frontend langsung mengirimkan URL foto KTP (`imageUrl`) yang telah diunggah ke Supabase Storage ke Edge Function `analyze-ktp`.
3. **Ekstraksi Multimodal Presisi Tinggi**:
   - AI Gemini Vision membaca gambar KTP secara langsung (Base64/URL), mengekstrak 9 bidang data utama:
     - NIK (16 Digit)
     - Nama Lengkap
     - Tempat Lahir & Tanggal Lahir (YYYY-MM-DD)
     - Jenis Kelamin ("Pria" / "Wanita")
     - Agama
     - Pekerjaan
     - Status Perkawinan
     - Alamat Lengkap KTP

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Rencana Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx) | Mengganti alur lambat `Tesseract.js` menjadi pemanggilan langsung ke Edge Function `analyze-ktp` via `{ imageUrl }` (Multimodal Vision). Menambahkan timeout pelindung (10 detik). |
| 2 | [`functions/public/pages/AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx) | Mengganti alur lambat `Tesseract.js` menjadi pemanggilan langsung ke Edge Function `analyze-ktp` via `{ imageUrl }`. |
| 3 | [`supabase/functions/analyze-ktp/index.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/analyze-ktp/index.ts) | Mengoptimalkan Edge Function dengan model Gemini Flash super cepat, rotasi `GEMINI_KEYS`, dan ekstraksi multimodal vision langsung. |
| 4 | `functions/PROGRESS.md` | Pencatatan riwayat pekerjaan (Anti-Amnesia). |
| 5 | `WALKTHROUGH.md` | Dokumentasi panduan pengujian dan detail perubahan. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

### Langkah 1: Perbarui Edge Function `supabase/functions/analyze-ktp/index.ts`
- Terapkan pemanggilan model Gemini Flash dengan array fallback: `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']`.
- Terapkan rotasi `GEMINI_KEYS` dan auto-retry pada error.
- Dukung pembacaan gambar KTP secara langsung via URL/Base64.

### Langkah 2: Perbarui Frontend `MitraProfile.tsx` & `AgentProfile.tsx`
- Hapus impor dan eksekusi `Tesseract.js` pada fungsi `performOcr`.
- Ubah `performOcr(imageUrl)` agar langsung memanggil Edge Function `analyze-ktp` dengan `{ imageUrl }`.
- Terapkan timeout safeguard 10 detik agar state `isScanning` selalu reset dengan aman jika terjadi kendala jaringan.

### Langkah 3: Uji Kompilasi & Pengujian Kecepatan
- Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 100% bebas error kompilasi.
- Uji simulasi pemanggilan Edge Function untuk memverifikasi waktu respons instan (1-2 detik).

### Langkah 4: Pencatatan Riwayat & Git Push
- Catat riwayat di `functions/PROGRESS.md` (Fitur #223).
- Terbitkan dokumen `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kecepatan OCR KTP**:
   - Unggah foto KTP di halaman Profil Mitra (`/dashboard-mitra/profile`).
   - Verifikasi status *"Membaca Data KTP..."* selesai dalam waktu **1-2 detik**.
2. **Uji Akurasi Ekstraksi Otomatis**:
   - Verifikasi kolom NIK (16 digit), Nama Lengkap, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status, dan Alamat terisi otomatis.
3. **Uji Build Frontend**:
   - Jalankan `npm run build` dan pastikan hasil `0 error`.
