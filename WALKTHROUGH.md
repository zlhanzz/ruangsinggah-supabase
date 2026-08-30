# Walkthrough - Fitur #226: Sistem Pelaporan Iklan Kost & Pusat Manajemen Aduan Admin

Dokumen ini merinci implementasi fitur tombol pelaporan iklan kost di sisi pengguna publik dan pusat penanganan tiket aduan properti di Dashboard Admin RuangSinggah.

---

## 1. Ringkasan Perubahan

### A. Sisi Pengguna Publik (`KostDetail.tsx`)
- **Tombol Pengaduan**:
  - Tombol *"🚩 Laporkan Iklan Ini"* ditempatkan pada kartu aksi sticky sidebar (di bawah tombol *Chat Pemilik*).
  - Banner Card pengaduan *"Menemukan Masalah pada Iklan Ini? Laporkan Kost"* di bagian bawah detail kamar dan spesifikasi properti.
- **Modal Interaktif Laporan**:
  - **Kategori Masalah**:
    1. 🚨 *Indikasi Penipuan / Minta Transfer di Luar Sistem* (`fraud`)
    2. 🏷️ *Harga atau Fasilitas Tidak Sesuai Realita* (`mismatch`)
    3. 📍 *Lokasi Titik Peta Palsu / Tidak Akurat* (`fake_location`)
    4. 🚫 *Kost Sudah Penuh / Tidak Beroperasi* (`closed_or_full`)
    5. 🔞 *Foto / Konten Tidak Pantas* (`inappropriate`)
    6. 📝 *Lainnya* (`other`)
  - **Form Input**: Rincian kronologi, Nama pelapor, dan Nomor WhatsApp aktif (auto-fill jika user sudah login).
  - **Kompresi WebP Sisi Klien**: Setiap foto bukti yang diunggah otomatis dikompresi ke WebP sebelum diunggah ke storage.
  - **Notifikasi Email Real-Time**: Laporan memicu pengiriman email notifikasi otomatis ke tim admin melalui FormSubmit.

---

### B. Sisi Dashboard Admin (`PropertyManagement.tsx`)
- **Tab Baru & Metrik Statistik**:
  - Kartu statistik ke-6: `🚨 Aduan Pengguna` dengan penghitung jumlah aduan pending yang butuh penanganan.
  - Tab Navigasi `🚨 Aduan Pengguna` dengan badge counter animasi.
- **Badge Peringatan Listing**:
  - Pada tabel properti utama, listing yang memiliki aduan user akan menampilkan badge merah `🚨 X Aduan`, dan jika diklik akan langsung memfilter tiket aduan properti terkait.
- **Tabel Manajemen Tiket Aduan**:
  - Menampilkan nama properti, tombol chat pemilik, kategori & teks aduan, waktu kirim, identitas pelapor + tombol chat pelapor, thumbnail bukti foto (dengan modal zoom preview besar), dan status laporan.
- **Aksi Cepat 1-Klik**:
  - **Bekukan Kost Ini (Freeze)**: Membuka modal freeze properti di mana alasan pembekuan otomatis terisi dari laporan user, mengubah status listing menjadi `suspended`, dan otomatis menandai tiket laporan sebagai telah diselesaikan (`action_taken: 'frozen'`).
  - **Chat Pemilik (WhatsApp)**: Pre-filled pesan klarifikasi ke pemilik properti.
  - **Chat Pelapor (WhatsApp)**: Pre-filled pesan konfirmasi ke nomor pelapor.
  - **Tandai Selesai (`resolved`)** & **Abaikan (`dismissed`)**.

---

## 2. File yang Disentuh

1. [`functions/public/pages/KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx): Tombol pengaduan, modal pelaporan, dan kompresi WebP.
2. [`functions/public/components/admin/PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx): Tab laporan, badge aduan di tabel listing, tabel tiket aduan, modal zoom bukti, dan aksi pembekuan 1-klik terintegrasi.
3. [`functions/public/userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts): Helper `uploadReportEvidence` dan `submitPropertyReport`.
4. [`functions/public/adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts): Helper `getPropertyReports` dan `updatePropertyReportStatus`.
5. [`functions/public/emailService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts): Helper `notifyAdminPropertyReport`.
6. [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md): Pencatatan riwayat progres Fitur #226.

---

## 3. Hasil Pengujian & Kompilasi

- Kompilasi build frontend dengan Vite:
```
vite v6.4.1 building for production...
transforming...
✓ 2505 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 24.82s
0 errors, 0 lint warnings
```

---

## 4. Panduan Verifikasi Pengguna

1. **Uji Laporan Publik**:
   - Buka halaman salah satu kost di browser (misal: `/kost/:id`).
   - Klik tombol *"Laporkan Iklan Ini"* di sidebar kanan atau di banner bawah.
   - Pilih kategori masalah, isi deskripsi, masukkan nomor WhatsApp, unggah foto bukti, lalu klik *"Kirim Laporan"*.
2. **Uji Moderasi di Dashboard Admin**:
   - Buka Dashboard Admin -> Menu *"Manajemen Kost"*.
   - Amati kartu statistik dan klik tab *"🚨 Aduan Pengguna"*.
   - Periksa tiket laporan yang baru masuk:
     - Klik thumbnail bukti foto untuk memperbesar gambar (*zoom modal*).
     - Klik tombol *"Chat Pelapor"* atau *"Chat Mitra"* untuk memastikan format tautan WhatsApp terbuka dengan pesan prefill.
     - Klik *"Bekukan Kost"* untuk melihat otomatisasi form alasan penalti dan perubahan status listing menjadi `suspended`.
