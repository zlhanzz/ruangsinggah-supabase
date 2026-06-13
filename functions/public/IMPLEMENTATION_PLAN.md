# IMPLEMENTATION PLAN - Penyempurnaan Wizard Flow Edit Profil Mitra (Penyimpanan Draft & Scroll-to-Top)

Dokumen ini menjelaskan rencana perubahan visual dan perilaku transisi langkah (wizard flow) pada edit profil pemilik kost (Mitra) di `MitraProfile.tsx`.

## 1. Analisis Masalah
Sesuai instruksi USER:
- **Penyimpanan Draft**: Saat Mitra mengisi data di Step 1 dan mengklik "Lanjutkan", semua data utama (termasuk Kode Referral jika ada) harus otomatis tersimpan sebagai draft di sistem/database.
- **Scroll-to-Top**: Saat berpindah langkah (baik maju ke Step 2 maupun kembali ke Step 1), layar harus otomatis di-scroll kembali ke bagian atas halaman agar pengguna tidak tertinggal di posisi tombol bawah.
- **Visual RLS Notice**: Informasi keamanan data RLS (Row Level Security Notice) yang tadinya di bagian bawah Step 2 harus dipindahkan ke posisi paling atas Step 2 (langsung di bawah judul header Step 2).

## 2. Dampak Perubahan
File yang dimodifikasi:
1. `functions/public/pages/MitraProfile.tsx`:
   - Tambahkan fungsi `saveStep1Draft` untuk memperbarui tabel `users` dan `mitra` saat transisi.
   - Panggil `saveStep1Draft()` dan `window.scrollTo({ top: 0, behavior: 'smooth' })` pada handler tombol "Lanjutkan".
   - Tambahkan scroll-to-top saat tombol "Kembali" dan "Batal" ditekan.
   - Pindahkan blok rendering RLS Notice ke bagian paling atas kontainer Step 2.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi Kode**: Lakukan non-contiguous edit di `MitraProfile.tsx`.
2. **Kompilasi**: Jalankan `tsc --noEmit` untuk memvalidasi tidak ada error TypeScript.

## 4. Rencana Verifikasi
1. Klik "Edit Profil", ubah nama, masukkan referral, klik "Lanjutkan". Muat ulang halaman untuk memastikan perubahan sudah tersimpan (draft) meskipun proses verifikasi KTP belum diajukan.
2. Amati transisi step apakah layar otomatis digeser ke paling atas.
3. Pastikan RLS Notice tampil di bagian atas formulir KTP (Step 2).
