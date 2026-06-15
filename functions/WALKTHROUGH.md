# WALKTHROUGH - Pengisian Otomatis Data Objektif KTP Cerdas (Mitra & Agen)

Dokumen ini menjelaskan daftar perubahan, hasil pengujian, dan instruksi deployment untuk fitur pengisian otomatis data objektif KTP yang lengkap di halaman profil Mitra dan Agen.

## 1. Daftar Perubahan
Modifikasi telah dilakukan secara bertahap pada halaman profil Agen (`AgentProfile.tsx`) agar setara dengan alur data objektif KTP baru yang ada di `MitraProfile.tsx`.

### Berkas yang Dimodifikasi:
1. **[AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx)**:
   - **Perluasan State `formData`**: Menambahkan field data objektif KTP: `gender`, `religion`, `occupation`, `relationship_status`, `birth_place`, dan `birth_date`.
   - **Pemuatan Profil (`loadProfile`)**: Memperbarui query data profil dari Supabase agar memuat seluruh field baru tersebut dari tabel `users`.
   - **Sistem Ekstraksi OCR Cerdas (`performOcr`)**: Mengintegrasikan parser regex pintar untuk mengekstrak Nama Lengkap, Tempat Lahir, Tanggal Lahir (diformat ulang ke `YYYY-MM-DD` standar HTML date picker), Jenis Kelamin (Pria/Wanita), Agama (Islam, Kristen, dll), Pekerjaan, dan Status Perkawinan (Single/Menikah) langsung dari KTP.
   - **Penyimpanan Terpadu (`handleSave` & `handleVerifySubmit`)**: Menyimpan seluruh data profil dasar hasil ekstraksi ke tabel `users` di Supabase untuk sinkronisasi otomatis.
   - **Penerapan Elemen UI Baru**: Menambahkan 7 kolom input baru (Nama Lengkap, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan) pada form verifikasi KTP (Step 2) dengan styling dark premium menggunakan CSS modern yang adaptif.

2. **[PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md)**:
   - Mencatat penyelesaian fitur ke dalam daftar progres pengembangan proyek.

## 2. Hasil Pengujian & Verifikasi
- **Verifikasi Build Vite**:
  Proses kompilasi lokal via command `cmd /c npm run build` berhasil dijalankan tanpa ada error TypeScript maupun bundler:
  ```bash
  vite v6.4.1 building for production...
  ✓ 2521 modules transformed.
  ✓ built in 34.42s
  ```

## 3. Petunjuk Deploy
Bagi pengguna, silakan jalankan perintah berikut untuk memperbarui server dan build produksi:

```bash
# Pindah ke direktori frontend web
cd functions/public

# Build aplikasi frontend untuk produksi
npm run build

# Jika ingin mendeploy hosting/fungsi ke Firebase/Supabase, jalankan deploy workflow Anda seperti biasa
```
