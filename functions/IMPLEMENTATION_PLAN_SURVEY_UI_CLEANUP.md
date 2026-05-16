# IMPLEMENTATION PLAN - Pembersihan UI Dashboard & Perbaikan Validasi Survey

## Analisis Masalah
1. **UI Terlalu Padat**: Halaman "Kost Saya" menampilkan pratinjau hasil survey secara langsung yang memakan banyak ruang dan membuat tampilan berantakan.
2. **Bug Validasi Agen**: Agen tidak bisa mengirim laporan survey jika deskripsinya sangat singkat karena adanya validasi minimal 5 karakter.
3. **Alur Konfirmasi**: Pengguna tidak memiliki akses mudah untuk melihat hasil survey sebelum melakukan konfirmasi selesai.

## Dampak Perubahan
- `functions/public/pages/MyKost.tsx`: Perubahan pada fungsi `renderSurveyCard` dan logika rendering tombol aksi.
- `functions/public/pages/AgentDashboard.tsx`: Perubahan pada konstanta validasi panjang teks.
- `functions/public/notificationService.ts`: Peningkatan detail pesan notifikasi.

## Langkah-Langkah Eksekusi
1. **Modifikasi MyKost.tsx**:
   - Menghapus blok kode yang merender pratinjau kategori survey di dalam card.
   - Refaktorisasi logika kondisional tombol untuk mendukung status `SUBMITTED` dan `COMPLETED` secara bersamaan.
2. **Modifikasi AgentDashboard.tsx**:
   - Mengubah `min: 5` menjadi `min: 1` pada input hasil survey untuk kategori Kamar, Kamar Mandi, dan Fasilitas.
3. **Penyempurnaan Notifikasi**:
   - Memastikan pemicu email berjalan pada status `HEADING_TO_LOCATION`, `RESCHEDULED`, dan `SUBMITTED`.

## Rencana Verifikasi
1. Buka dashboard "Kost Saya" sebagai user, pastikan card survey terlihat bersih (hanya info utama dan status).
2. Pastikan tombol "LIHAT HASIL SURVEY" membuka modal dengan benar.
3. Coba kirim laporan survey sebagai agen dengan teks singkat (misal: "OK") untuk memastikan validasi berhasil dilewati.
4. Periksa log email/notifikasi saat status berubah.
