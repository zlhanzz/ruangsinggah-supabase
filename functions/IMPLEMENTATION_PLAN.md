# IMPLEMENTATION PLAN - Kustomisasi Template Email Autentikasi RuangSinggah.id

Rencana ini dibuat untuk meningkatkan estetika dan profesionalisme email konfirmasi pendaftaran (signup) dan reset kata sandi (recovery) dengan menggunakan template HTML custom yang responsif, dilengkapi logo/grafis, typography yang modern, serta tombol call-to-action (CTA) yang jelas.

## 1. Analisis Masalah
- **Gejala**: Saat ini email verifikasi registrasi dan reset kata sandi menggunakan plain text atau format HTML yang sangat sederhana (`<p>Halo! Silakan klik link berikut untuk melanjutkan: <a href="...">Klik Di Sini</a></p>`). Tampilan ini kurang profesional dan tidak memiliki identitas visual RuangSinggah.id (orange branding).
- **Solusi**: Mengganti template email di fungsi Cloud Function `handleCustomAuthEmail` pada `functions/src/index.ts` dengan desain HTML email premium yang konsisten dengan desain web RuangSinggah.id (menggunakan warna oranye `#f97316`, card minimalis dengan bayangan lembut, font yang bersih, tombol CTA yang menonjol, serta fallback link).

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/src/index.ts`:
   - Memodifikasi payload `htmlContent` di dalam Cloud Function `handleCustomAuthEmail` untuk mengirimkan HTML terformat indah dengan tombol dan logo.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/src/index.ts`**:
   - Di dalam `handleCustomAuthEmail`, buat konstruktor HTML berdasarkan tipe email (`signup` vs `recovery`).
   - Implementasikan template HTML dengan header, logo RuangSinggah.id, konten deskriptif, tombol CTA oranye, instruksi keamanan, dan footer.
2. **Kompilasi Cloud Function**:
   - Jalankan `npm run build` di direktori `functions` untuk memvalidasi sintaks TypeScript.
3. **Deploy (jika diperlukan)**:
   - File siap dideploy oleh pengguna dengan perintah `npm run deploy`.

## 4. Rencana Verifikasi
- Memastikan build lokal sukses tanpa error.
- Melakukan verifikasi unit test pendaftaran/auth lokal jika memungkinkan.
- Mendokumentasikan perubahan dalam `WALKTHROUGH.md` dan `PROGRESS.md`.
