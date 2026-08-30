# Rencana Implementasi: Optimasi Kecepatan Ekstraksi KTP Instan (Direct Base64 & Fast Model Cascade)

Dokumen ini merancang penyelesaian tuntas agar pemindaian OCR data KTP berjalan dalam **1,0 – 1,5 detik** tanpa risiko timeout.

---

## 1. Analisis Masalah & Temuan Diagnostik

Setelah dilakukan pengujian mendalam pada Edge Function `analyze-ktp`, ditemukan 2 penyebab utama mengapa terjadi *timeout 25 detik*:
1. **Looping Retry Model 404**:
   - Model `gemini-3.7-flash` belum terdaftar sebagai identifier resmi pada endpoint API `v1beta`.
   - Ketika model pertama mengembalikan error `404 Not Found`, sistem lama mencoba mengulang model yang sama pada 3 API Key berbeda (`Key #1, #2, #3`), membuang waktu ~15-20 detik sebelum berpindah ke model yang valid (`gemini-2.5-flash`).
2. **Double Network Hop (Fetch Storage URL)**:
   - Ketika frontend mengirimkan `imageUrl`, Edge Function harus melakukan HTTP `fetch(imageUrl)` sekunder ke Supabase Storage. Jika ada latensi propagasi CDN Storage, proses ini memakan waktu tambahan.

---

## 2. Solusi & Dampak Perubahan

### A. Fast Model Cascade & Smart 404 Break (`analyze-ktp/index.ts`)
- Memprioritaskan model resmi yang terbukti aktif dan super cepat: `["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]`.
- Jika sebuah model mengembalikan status `404`, sistem langsung melakukan `break` ke model berikutnya **seketika (0ms delay)** tanpa mencoba API Key lain untuk model yang sama.

### B. Direct Client-Side Base64 Transfer (`MitraProfile.tsx` & `AgentProfile.tsx`)
- Saat user memilih foto KTP dan file dikonversi ke WebP, frontend membaca file WebP lokal menjadi `base64Image` (via `FileReader`) dan mengirimkannya langsung ke Edge Function bersamaan dengan `imageUrl`.
- Edge Function langsung memproses bytes `base64Image` secara instan **tanpa perlu mendownload ulang dari Storage**.

---

## 3. Dampak Perubahan File

| No | File | Deskripsi Rencana Perubahan |
|---|---|---|
| 1 | [`supabase/functions/analyze-ktp/index.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/analyze-ktp/index.ts) | Model list: `gemini-2.5-flash` utama, smart break 404, prioritas Base64 vision. |
| 2 | [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx) | Baca WebP ke Base64 lokal dan kirim ke `performOcr(publicUrl, base64Image)`. |
| 3 | [`functions/public/pages/AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx) | Baca WebP ke Base64 lokal dan kirim ke `performOcr(publicUrl, base64Image)`. |
| 4 | `functions/PROGRESS.md` | Pencatatan riwayat (Anti-Amnesia). |
| 5 | `WALKTHROUGH.md` | Dokumentasi pengujian dan perintah deploy. |

---

## 4. Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Perbarui `supabase/functions/analyze-ktp/index.ts`**:
   - Pasang `gemini-2.5-flash` di urutan pertama.
   - Tambahkan `if (response.status === 404) break;` untuk eliminasi retry sia-sia.
2. **Perbarui `MitraProfile.tsx` & `AgentProfile.tsx`**:
   - Baca file WebP lokal ke Base64 dan sertakan pada pemanggilan Edge Function.
3. **Uji Kompilasi Build**:
   - Jalankan `cmd /c npm run build` di `functions/public/`.
4. **Deploy Edge Function & Git Push**:
   - Berikan perintah deploy Supabase CLI untuk dieksekusi pengguna.
   - Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi
- Pengujian langsung via node scratch script untuk memastikan respon AI kembali dalam **< 1.5 detik**.
- Pengujian upload KTP di browser Mitra & Agen.
