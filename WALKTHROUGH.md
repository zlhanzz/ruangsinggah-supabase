# Walkthrough: Sistem Manajemen Laporan Kendala Penghuni di Portal KostManager & Form Lapor In-App

Dokumentasi ini merangkum penyelesaian pengembangan **Fitur #216**, yaitu integrasi formulir pelaporan kendala in-app pada halaman "Kost Saya" dan menu manajemen laporan kendala di Portal KostManager terpusat beserta fitur penerusan (*forwarding*) WhatsApp ke pemilik kost.

---

## 1. Ringkasan Perubahan

### A. Sisi Penghuni (`MyKost.tsx`)
- **Tombol "Lapor Kendala Kamar" In-App**: Mengalihkan tombol pelaporan kamar aktif dari pembuka WhatsApp chat ke formulir modal internal (`handleOpenComplaint`).
- **Formulir Terstruktur**:
  - Pilihan kategori masalah (*AC & Ventilasi, Listrik & Lampu, Air & Pipa, Kamar Mandi, Kebersihan, Furnitur / Pintu / Kunci, WiFi & Internet, Lainnya*).
  - Pilihan tingkat urgensi (*Standar / NORMAL* vs *🚨 DARURAT / EMERGENCY*).
  - Judul kendala dan deskripsi rincian masalah.
  - Unggah foto bukti kerusakan dengan **kompresi otomatis WebP di sisi klien** sebelum dikirim ke Supabase Storage.
- **Penyimpanan Database**: Laporan tersimpan di tabel `complaints` Supabase dengan status `open`.

### B. Sisi Portal KostManager (`KostManagerPortal.tsx`)
- **Tab Sidebar Baru**: Menambahkan menu **"🛠️ Laporan Kendala"** lengkap dengan badge counter jumlah laporan aktif (*open / in_progress*).
- **Header & Kartu Ringkasan (KPI Cards)**:
  - 📋 **Total Laporan**: Total seluruh komplain masuk untuk kost terkelola.
  - ⏳ **Menunggu Tindakan**: Jumlah laporan baru yang belum ditangani.
  - 🚨 **Kendala Darurat**: Jumlah laporan berkategori darurat/urgent yang membutuhkan penanganan secepatnya.
  - ✅ **Telah Selesai**: Jumlah komplain yang telah tuntas diperbaiki.
- **Filter & Pencarian Pintar**:
  - Filter Status (*Semua, Baru Masuk, Sedang Diproses, Selesai*).
  - Filter Urgensi (*Semua Urgensi, 🚨 Darurat, Standar*).
  - Search bar real-time (mencari nama penghuni, nomor kamar, nama kost, kategori, maupun deskripsi).
- **Kartu Kendala Interaktif & Modal Zoom Foto**:
  - Menampilkan badge properti, unit kamar, waktu lapor, badge status, badge urgensi, badge kategori, dan rincian masalah.
  - Thumbnail foto bukti kerusakan dengan fitur modal zoom preview layar penuh.
  - Info kontak penghuni dengan tombol **"💬 Chat Penghuni"** via WhatsApp.
- **Fitur 1-Klik "📲 Teruskan ke Pemilik Kost (WhatsApp)"**:
  - Mengambil nomor WhatsApp pemilik kost dari properti terkait.
  - Menyusun pesan profesional terformat rapi yang memuat nama kost, unit kamar, nama penghuni, nomor telepon, tingkat urgensi, waktu lapor, pokok masalah, deskripsi kerusakan, dan tautan foto bukti WebP.
- **Pembaruan Status Penanganan**:
  - Tombol 1-klik untuk mengubah status tiket: `⚙️ Mulai Diproses`, `✅ Selesai Ditangani`, `↩️ Buka Kembali`.
  - Mengirim notifikasi otomatis ke akun penghuni saat status tiket diperbarui.

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
✓ built in 37.18s
```
*Hasil:* **100% Lulus (0 Error, 0 Broken Link, Bebas FOUT icon SVG pure bundle)**.

---

## 3. Panduan Pengujian bagi Pengguna

### A. Pengujian Pelaporan Kendala (Sisi Penyewa)
1. Buka menu **Kost Saya** (`/my-bookings/aktif` atau `/my-kost`).
2. Pada kartu kamar yang sedang disewa aktif, klik tombol **"🚨 Lapor Kendala Kamar"**.
3. Pilih kategori kendala (misal: *AC & Ventilasi* atau *Air & Pipa*), pilih urgensi (*Normal* atau *Darurat*), isi judul dan rincian masalah, lalu unggah foto bukti kerusakan.
4. Klik tombol **"Kirim Laporan Kendala"**.
5. Sistem akan mengompresi foto ke WebP dan menyimpan tiket laporan ke tabel `complaints`.

### B. Pengujian Manajemen di Portal KostManager (Sisi Pengelola/Admin)
1. Buka **Portal KostManager** di menu Admin (`/dashboard-admin/km_complaints` atau klik tab **"🛠️ Laporan Kendala"** di sidebar).
2. Periksa kartu ringkasan KPI dan pastikan tiket kendala yang baru dibuat muncul di grid.
3. Klik foto thumbnail bukti kerusakan untuk memperbesar foto di modal zoom.
4. Klik tombol **"📲 Teruskan ke Pemilik Kost (WhatsApp)"** untuk memverifikasi pembukaan chat WhatsApp otomatis ke nomor pemilik kost dengan rincian laporan lengkap.
5. Klik tombol **"⚙️ Mulai Diproses"** lalu **"✅ Tandai Selesai"** untuk menguji perubahan status secara real-time.
