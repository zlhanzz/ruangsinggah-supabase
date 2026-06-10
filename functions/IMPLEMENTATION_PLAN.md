# IMPLEMENTATION PLAN - Perbaikan Z-Index Sidebar Overlay Pada Dashboard Mitra

Rencana ini dibuat untuk memperbaiki masalah tumpang tindih (overlap) antara sidebar mobile overlay dengan bar navigasi meluler (mobile bottom nav) di Dashboard Mitra.

## 1. Analisis Masalah
- **Masalah**:
  1. Kontainer sidebar seluler (`mobileSidebarOpen`) menggunakan kelas `z-50`.
  2. Komponen bar navigasi bawah seluler (`Bottom Nav`) juga menggunakan kelas `z-50`.
  3. Ketika sidebar dibuka, keduanya berada pada level tumpukan z-index yang sama, sehingga bar navigasi bawah tetap terlihat menumpuk di atas/bawah sidebar dan menghalangi visual.
- **Solusi**: Tingkatkan tingkat z-index dari kontainer sidebar mobile overlay menjadi `z-[100]` agar menutupi seluruh komponen navigasi bawah dan tombol simulasi waktu lainnya ketika aktif.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/pages/MitraDashboard.tsx`:
   - Ubah kelas `z-50` pada div kontainer `mobileSidebarOpen` menjadi `z-[100]`.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/public/pages/MitraDashboard.tsx`**:
   - Cari kontainer `mobileSidebarOpen` dan perbarui z-index-nya.
2. **Kompilasi Frontend**:
   - Jalankan `npm run build` di folder `functions/public` untuk memastikan build tetap berhasil.

## 4. Rencana Verifikasi
- Verifikasi bahwa ketika sidebar seluler dibuka, bar navigasi bawah sepenuhnya tertutup di bawah overlay gelap dan sidebar.
