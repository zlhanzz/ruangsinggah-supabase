# Walkthrough: Sistem Riwayat Tiket Kendala & Tracking Status Penanganan Real-Time (`MyKost.tsx`)

Dokumentasi ini merangkum penyelesaian pengembangan **Fitur #220**, yaitu implementasi antarmuka **Riwayat Tiket Kendala Penghuni** dengan navigasi 2-tab internal di dalam modal kendala pada halaman **Kost Saya** (`MyKost.tsx`).

---

## 1. Ringkasan Perubahan

### A. Navigasi 2-Tab Internal pada Modal Kendala
- **Tab 1: 📝 Buat Laporan Baru**:
  - Formulir komprehensif pemilihan kategori (8 kategori fasilitas), tingkat urgensi (Normal vs Darurat), judul pokok, deskripsi rinci, dan upload hingga 3 foto WebP.
- **Tab 2: 📋 Riwayat Tiket Saya (X)**:
  - Dilengkapi badge counter jumlah tiket kendala yang diajukan oleh penghuni.
  - Memuat seluruh daftar tiket historis dari database Supabase (`complaints`).

### B. Auto-Switch & Kepastian Instan Pasca-Submit
- Saat penghuni menekan tombol **"Kirim Laporan Kendala"**:
  - Sistem mengompresi foto ke WebP dan mengunggah ke Supabase Storage.
  - Data tersimpan ke tabel `complaints`.
  - Formulir di-reset dan sistem secara **otomatis mengalihkan tab ke "Riwayat Tiket Saya"**.
  - Tiket baru langsung tampil di urutan paling atas dengan status `⏳ Menunggu Tindakan`, menghilangkan segala keraguan penghuni.

### C. Visualisasi Kartu Riwayat Tiket & Real-Time Tracking
- **Header Kartu**: ID Tiket unik (`#TKT-XXXXXX`), tanggal dan waktu lapor, badge urgensi (`🚨 Darurat` vs `Standar`), badge kategori, dan status penanganan real-time:
  - `⏳ Menunggu Tindakan` (Amber)
  - `⚙️ Sedang Ditangani` (Blue pulse)
  - `✅ Selesai` (Emerald)
- **Konten Kendala**: Pokok kendala, deskripsi detail kerusakan dalam card kontras.
- **Galeri Foto Bukti**: Thumbnail galeri multi-foto bukti kerusakan WebP yang dapat diklik untuk memperbesar gambar (*Modal Zoom Pratinjau*).
- **Catatan Respon Pengelola**: Kotak informasi feedback hijau (*"💬 Catatan Respon Pengelola"*) jika pihak pengelola/teknisi telah mengisikan catatan tindakan.
- **Empty State**: Tampilan visual menarik jika belum ada riwayat kendala (*"Belum Ada Riwayat Laporan - Kamar Anda terpantau aman dan prima!"*).

---

## 2. Hasil Pengujian & Kompilasi

### Uji Build Frontend (Vite)
```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 2531 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 36.89s
```
*Hasil:* **100% Lulus (0 Error, 0 Broken Link, Bebas FOUT icon SVG pure bundle)**.

---

## 3. Panduan Pengujian bagi Pengguna

1. Buka menu **Kost Saya** (`/my-bookings/aktif` atau `/my-kost`).
2. Klik tombol **"🚨 Lapor Kendala Kamar"** pada kartu kamar yang sedang aktif.
3. Di bagian atas modal, perhatikan adanya 2 tab:
   - **`📝 Buat Laporan Baru`**
   - **`📋 Riwayat Tiket (X)`**
4. Klik tab **"Riwayat Tiket"** untuk melihat seluruh riwayat tiket komplain Anda beserta status penanganannya (`⏳ Menunggu Tindakan`, `⚙️ Sedang Ditangani`, `✅ Selesai`).
5. Klik salah satu foto bukti kerusakan untuk menguji modal zoom perbesaran foto.
6. Coba buat laporan baru di tab **"Buat Laporan Baru"** dan klik **"Kirim Laporan Kendala"**:
   - Sistem akan otomatis mengarahkan Anda ke tab **"Riwayat Tiket"** dan menampilkan tiket baru Anda di posisi paling atas!
