# IMPLEMENTATION PLAN - Wizard Flow Verifikasi KTP & Verifikasi WhatsApp Dinamis (Pembaruan Draft & Foto Profil)

Rencana ini dibuat untuk menyempurnakan alur pengisian profil dan verifikasi identitas (KTP) pada Halaman Profil Mitra (`MitraProfile.tsx`), serta memindahkan input foto profil ke dalam Step 1 sebagai opsi tambahan.

## 1. Analisis Masalah & Kebutuhan
- **Relokasi Foto Profil**:
  - Saat ini input foto profil berada di bagian kartu atas (hero header) dan terpisah dari form pengeditan. Hal ini memicu kebingungan visual.
  - Untuk menyatukan alur, input foto profil akan dipindahkan ke dalam Halaman Form Langkah 1 (Step 1) sebagai input opsional.
  - Saat mode baca (`isEditing === false`), foto profil di bagian hero header hanya bertindak sebagai tampilan (read-only) tanpa tombol upload overlay.
  - Saat mode edit (`isEditing === true`), tombol upload pada hero header disembunyikan, dan opsi unggah foto profil dipindahkan ke bagian atas input Langkah 1 (Step 1).

- **Fungsi Draft**:
  - Menjaga draf data profil agar tersimpan dengan benar di database menggunakan query yang aman dan memeriksa kembalian error Supabase client.

## 2. Dampak Perubahan
File yang akan disentuh:
- `functions/public/pages/MitraProfile.tsx` (Pemindahan UI/Logic Foto Profil)

## 3. Langkah-Langkah Eksekusi
1. **Sembunyikan Hero Header pada Mode Edit**:
   - Bungkus komponen visual Profile Hero / Header dalam kondisi `!isEditing && (...)` agar disembunyikan sepenuhnya dari layar ketika pengguna sedang berada di formulir pengeditan.
2. **Tambah Input Foto di Form Step 1**:
   - Di dalam rendering `currentStep === 1`, sisipkan elemen preview foto profil dan tombol "Pilih Foto" dengan penanganan `isUploadingPhoto` yang sesuai.
3. **Verifikasi Build**:
   - Pastikan tidak ada error tipe data TypeScript dan bundler Vite berjalan lancar.


## 4. Rencana Verifikasi
- Masuk ke mode edit profil, verifikasi bahwa tombol unggah foto profil tidak lagi muncul di hero header atas.
- Verifikasi input foto profil baru muncul di bagian atas formulir Langkah 1 (Step 1).
- Unggah foto profil baru, pastikan berhasil terunggah dan status draf tersimpan.


