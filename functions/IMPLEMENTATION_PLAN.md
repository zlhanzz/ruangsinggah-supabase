# IMPLEMENTATION PLAN - Pengisian Otomatis Data Objektif KTP Cerdas (Mitra & Agen)

Rencana ini dibuat untuk memperluas formulir verifikasi KTP (Step 2) dengan menyertakan input data objektif KTP secara lengkap (Nama, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan) dan mengisi seluruh data tersebut secara otomatis menggunakan parser cerdas OCR.

## 1. Analisis Masalah
- **Masalah Saat Ini**:
  Sistem OCR cerdas yang baru dibuat baru mengisi NIK dan Alamat Sesuai KTP. Pengguna masih harus mengisi Nama Lengkap, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, dan Pekerjaan secara manual di Step 1.
- **Dampak**:
  Pengalaman pengguna (UX) kurang instan. Jika data objektif KTP dapat diekstrak semua sekaligus dari foto KTP dan ditampilkan di formulir verifikasi (Step 2) untuk ditinjau, pengisian profil akan jauh lebih otomatis dan cepat.
- **Solusi**:
  - Memperluas fungsi `performOcr` di `MitraProfile.tsx` dan `AgentProfile.tsx` untuk mengekstrak data Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Status Perkawinan, dan Pekerjaan dari hasil pemindaian OCR.
  - Memformat Tanggal Lahir hasil ekstraksi (`DD-MM-YYYY` dengan koreksi noise) menjadi format standar HTML date (`YYYY-MM-DD`).
  - Menambahkan input field untuk data objektif KTP tersebut di formulir verifikasi (Step 2) agar pengguna dapat meninjau dan memperbaiki hasil pemindaian otomatis sebelum menyimpannya ke profil dasar.

## 2. Dampak Perubahan
Berkas yang akan diubah:
1. `functions/public/pages/MitraProfile.tsx`:
   - Memperbarui fungsi `performOcr` agar mengekstrak seluruh data objektif KTP.
   - Menambahkan input fields untuk Nama Lengkap KTP, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, dan Status Perkawinan pada UI Step 2.
2. `functions/public/pages/AgentProfile.tsx`:
   - Memperbarui fungsi `performOcr` untuk ekstraksi yang sama.
   - Menambahkan input fields yang sama pada panel verifikasi Agen.

## 3. Langkah-Langkah Eksekusi
1. **Perluas Logika Ekstraksi OCR di `MitraProfile.tsx` & `AgentProfile.tsx`**:
   - Tambahkan parser regex untuk `birth_place`, `birth_date` (dengan format ulang `YYYY-MM-DD`), `gender` (Pria/Wanita), `religion` (Islam/Kristen/Katolik/Hindu/Buddha/Konghucu), `relationship_status` (Single/Menikah), dan `occupation`.
2. **Perbarui Render Step 2 Form (KTP) di `MitraProfile.tsx`**:
   - Tampilkan field input hasil scan KTP tersebut agar sejajar dengan input NIK dan Alamat KTP.
3. **Perbarui Render Panel Verifikasi di `AgentProfile.tsx`**:
   - Tampilkan field input hasil scan KTP di dalam form pengajuan verifikasi Agen.
4. **Verifikasi Build**:
   - Jalankan `cmd.exe /c npm run build` untuk memverifikasi tidak ada kesalahan TypeScript.

## 4. Rencana Verifikasi
- Mengunggah foto KTP pada dashbord Mitra / Agen.
- Memastikan kolom NIK, Nama Lengkap, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, dan Alamat terisi otomatis secara akurat.
- Memastikan build Vite sukses.
