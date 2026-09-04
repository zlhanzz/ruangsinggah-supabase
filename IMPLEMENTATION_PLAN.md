# IMPLEMENTATION PLAN - Penyempurnaan Banner Keamanan Data Profesional (`MitraProfile.tsx`, `AgentProfile.tsx`)

## 1. Analisis Masalah & Kebutuhan
- **Keluhan Pengguna**:
  Pada formulir verifikasi KTP, terdapat banner keamanan data dengan teks:
  - Judul: `"KEAMANAN DATA TERJAMIN RLS"`
  - Deskripsi: `"Data identitas penting Anda dilindungi dengan tingkat keamanan tertinggi menggunakan sistem enkripsi Row Level Security (RLS) dari Supabase. Data tidak akan pernah dibocorkan kepada penyewa atau pihak ketiga."`
- **Analisis & Resiko**:
  - Menyebutkan istilah teknis database spesifik seperti *"Row Level Security (RLS)"* dan nama vendor *"Supabase"* ke pengguna publik dinilai kurang profesional (*amateurish*) serta dapat mengekspos detail arsitektur internal backend (*information disclosure*).
- **Tujuan Perbaikan**:
  Mengubah redaksi banner keamanan menjadi bahasa korporat/platform resmi berstandar industri (*enterprise privacy & security assurance*):
  - **Judul**: `"Privasi & Keamanan Data Terjamin"`
  - **Deskripsi**: `"Dokumen identitas Anda dienkripsi dan disimpan secara aman dalam sistem terproteksi. Data hanya digunakan untuk keperluan verifikasi kepemilikan kost dan tidak akan pernah dibagikan kepada penyewa atau pihak ketiga."`

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
  - Memperbarui judul dan deskripsi banner keamanan pada bagian upload KTP mitra pemilik kost.
- [`functions/public/pages/AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx):
  - Memperbarui judul dan deskripsi banner keamanan pada bagian upload KTP agen lapangan.
- [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Mencatat riwayat implementasi Progres 322.
- `WALKTHROUGH.md`:
  - Menerbitkan dokumentasi hasil pengujian dan perubahan tampilan.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Approval)
1. **Modifikasi Banner Keamanan di `MitraProfile.tsx`**:
   - Mengubah `<h4>` menjadi `"Privasi & Keamanan Data Terjamin"`.
   - Mengubah `<p>` menjadi `"Dokumen identitas Anda dienkripsi dan disimpan secara aman dalam sistem terproteksi. Data hanya digunakan untuk keperluan verifikasi kepemilikan kost dan tidak akan pernah dibagikan kepada penyewa atau pihak ketiga."`
2. **Modifikasi Banner Keamanan di `AgentProfile.tsx`**:
   - Menyelaraskan teks banner verifikasi agen agar konsisten dan profesional.
3. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
4. **Pencatatan & Git Repository**:
   - Mencatat ke `functions/PROGRESS.md` (Progres 322) dan memperbarui `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions` dan `main`.

---

## 4. Rencana Verifikasi
- [ ] Buka formulir verifikasi KTP di Dashboard Mitra & Profil Agen $\rightarrow$ Banner keamanan menampilkan judul *"Privasi & Keamanan Data Terjamin"* dengan penjelasan yang elegan, rapi, dan tanpa istilah teknis internal.
- [ ] Jalankan build project $\rightarrow$ Memastikan 100% kelulusan tanpa error.
