# IMPLEMENTATION PLAN - Penyederhanaan Layout Template Email Autentikasi

Rencana ini dibuat untuk menyederhanakan desain template email konfirmasi pendaftaran dan reset kata sandi dengan menghapus gambar logo yang dinilai kurang estetik serta menghilangkan bagian tautan alternatif di bagian bawah, menyisakan murni tombol CTA untuk kejelasan tindakan pengguna.

## 1. Analisis Masalah
- **Masalah**: Pengguna merasa logo di header email kurang estetik dan bagian link fallback cadangan di bawah tombol merusak estetika desain email.
- **Solusi**: 
  - Hapus tag `<img>` yang merujuk pada `logo.png` dari header email.
  - Hapus blok komentar dan elemen kontainer `<!-- Fallback URL -->` sepenuhnya dari email HTML.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/src/index.ts`:
   - Modifikasi variabel `emailHtml` di fungsi `handleCustomAuthEmail` untuk menghilangkan logo dan link fallback.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/src/index.ts`**:
   - Cari deklarasi `emailHtml` di `handleCustomAuthEmail`.
   - Hapus elemen image dan kontainer fallback link.
2. **Kompilasi & Deploy**:
   - Jalankan `cmd.exe /c npm run build` di folder `functions` untuk memvalidasi TypeScript.
   - Jalankan `cmd.exe /c firebase deploy --only functions` untuk mengunggah perubahan.

## 4. Rencana Verifikasi
- Memastikan build lokal sukses.
- Memastikan deploy ke Firebase berhasil.
