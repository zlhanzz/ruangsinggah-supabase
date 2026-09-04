# IMPLEMENTATION PLAN - Perbaikan Redaksi Notifikasi Pemindaian KTP Profesional (`MitraProfile.tsx`, `AgentProfile.tsx`)

## 1. Analisis Masalah & Kebutuhan
- **Keluhan Pengguna**:
  Notifikasi alert saat pemindaian KTP berhasil saat ini menampilkan teks:
  `"Data KTP berhasil dipindai otomatis menggunakan AI Gemini Cerdas."`
  Teks ini dinilai kurang profesional, menyebutkan nama vendor AI secara canggung (*unprofessional branding*), dan kurang mencerminkan standar platform proptech resmi.
- **Tujuan Perbaikan**:
  Mengubah redaksi pesan notifikasi keberhasilan pemindaian KTP (serta pesan peringatan/fallback terkait) menjadi lebih profesional, baku, jelas, dan berorientasi pada kepastian data pengguna:
  - **Pesan Sukses**:
    *"Data KTP berhasil dipindai otomatis. Mohon periksa kembali kecocokan data Anda sebelum melanjutkan."*
  - **Pesan Belum Lengkap / Perlu Penyesuaian Manual**:
    *"Pemindaian otomatis belum optimal. Silakan periksa dan lengkapi data profil Anda secara manual."*
  - **Pesan Batas Waktu / Gangguan Jaringan**:
    *"Pemindaian otomatis memerlukan waktu lebih lama. Silakan lanjutkan pengisian data profil secara manual."*

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
  - Memperbarui redaksi alert OCR pemindaian KTP menjadi bahasa platform resmi dan profesional.
- [`functions/public/pages/AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx):
  - Menyamakan standar redaksi pesan pemindaian KTP untuk modul profil agen lapangan.
- [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Mencatat riwayat implementasi Progres 321.
- `WALKTHROUGH.md`:
  - Menerbitkan dokumentasi hasil pengujian dan perubahan teks.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Approval)
1. **Modifikasi Redaksi Notifikasi pada `MitraProfile.tsx`**:
   - Mengganti teks alert `"Data KTP berhasil dipindai otomatis menggunakan AI Gemini Cerdas."` dengan `"Data KTP berhasil dipindai otomatis. Mohon periksa kembali kecocokan data Anda sebelum melanjutkan."`
   - Menyelaraskan teks pesan *fallback* dan batas waktu agar bernada profesional.
2. **Modifikasi Redaksi Notifikasi pada `AgentProfile.tsx`**:
   - Menerapkan standarisasi pesan profesional yang sama pada modul verifikasi profil agen.
3. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` untuk memvalidasi kelulusan kompilasi 0 error.
4. **Pencatatan & Git Repository**:
   - Mencatat ke `functions/PROGRESS.md` (Progres 321) dan memperbarui `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions` dan `main`.

---

## 4. Rencana Verifikasi
- [ ] Upload foto KTP pada formulir Verifikasi Identitas Mitra $\rightarrow$ Alert popup yang muncul menampilkan pesan profesional: *"Data KTP berhasil dipindai otomatis. Mohon periksa kembali kecocokan data Anda sebelum melanjutkan."*
- [ ] Jalankan build project $\rightarrow$ Memastikan 100% bebas error kompilasi.
