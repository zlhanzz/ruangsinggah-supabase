# Rencana Implementasi: Penyesuaian Toleransi Timeout OCR KTP & Graceful Error Handling (`MitraProfile.tsx`, `AgentProfile.tsx`)

Dokumen ini merancang perbaikan penanganan batas waktu (*timeout threshold*) dan *error handling* pada pemindaian KTP ketika Edge Function sedang dalam proses deploy atau jaringan mengalami latensi.

---

## 1. Analisis Masalah

### Error Log dari Pengguna:
```text
MitraProfile.tsx:571
OCR Error: Error: Waktu pemindaian melebihi batas waktu at MitraProfile.tsx:541:41
```

### Penyebab:
1. **Edge Function `analyze-ktp` di Cloud Supabase Belum Dideploy**:
   - Kode baru yang super cepat (`gemini-3.7-flash` / Gemini Flash Vision) sudah ditulis di direktori `supabase/functions/analyze-ktp/index.ts`.
   - Namun di server cloud Supabase, Edge Function masih menjalankan versi lama yang mengalami *Worker Resource Limit* / hang.
   - Sesuai Aturan Baku Workspace (Rule #6), deploy ke Supabase dilakukan secara manual oleh User.
2. **Ambang Batas Timeout Terlalu Ketat (12 Detik)**:
   - Batas 12 detik terlalu singkat jika ada *cold start* Edge Function atau latensi jaringan internet seluler saat pengunggahan gambar KTP.
   - Perlu ditingkatkan menjadi **25 detik** dengan penanganan *graceful error alert* sehingga jika terjadi kendala pada Edge Function, pengguna mendapatkan informasi yang jelas dan tetap dapat melanjutkan pengisian data secara manual.

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Rencana Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx) | Menyesuaikan timeout menjadi 25 detik dan memberikan notifikasi informatif jika Edge Function gagal/timeout. |
| 2 | [`functions/public/pages/AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx) | Menyesuaikan timeout menjadi 25 detik dan graceful error handling. |
| 3 | `functions/PROGRESS.md` | Pencatatan riwayat pekerjaan (Anti-Amnesia). |
| 4 | `WALKTHROUGH.md` | Dokumentasi panduan pengujian dan detail perintah deploy. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

### Langkah 1: Perbarui Timeout & Notifikasi di `MitraProfile.tsx` & `AgentProfile.tsx`
- Ubah timeout dari 12000ms menjadi 25000ms.
- Tangani error dengan pesan informatif jika fungsi gagal dieksekusi atau belum terdeploy.

### Langkah 2: Uji Kompilasi
- Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan lulus 100% (0 error).

### Langkah 3: Berikan Perintah Deploy yang Tepat untuk Windows
- Berikan panduan perintah deploy Supabase CLI yang kompatibel dengan Windows PowerShell (`cmd /c npx supabase functions deploy analyze-ktp --no-verify-jwt`).

### Langkah 4: Pencatatan Riwayat & Git Push
- Catat riwayat di `functions/PROGRESS.md`.
- Terbitkan dokumen `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Deploy Edge Function**:
   - Jalankan deploy Edge Function di terminal user.
2. **Uji Pemindaian KTP**:
   - Unggah foto KTP di halaman profil mitra (`/dashboard-mitra/profile`).
   - Verifikasi respon berhasil dalam < 2-3 detik tanpa timeout error.
3. **Uji Build**:
   - Jalankan `npm run build` dan pastikan hasil `0 error`.
