# Walkthrough: Peninjauan Data Pribadi KTP & Daftar Properti Terkait pada Manajemen Mitra Aktif

Dokumen ini mencatat implementasi sistem peninjauan data pribadi KTP dan daftar properti listing untuk manajemen mitra aktif di Admin Panel RuangSinggah (`/dashboard-admin/mitra`).

---

## 1. Ringkasan Perubahan

### A. Optimalisasi Data Fetching di `adminService.ts`
- **Sebelumnya**: Fungsi `getUserFullDetails(userId)` hanya mengambil kolom ringkas properti (`id, title, city, status`) tanpa detail foto, alamat lengkap, harga sewa, jumlah kamar, dan status KostManager.
- **Sesudahnya**:
  - Query properti diperluas mengambil: `id, title, city, area, address, status, price, image_urls, room_types, is_managed, is_verified, created_at` berdasarkan `owner_uid = userId`.
  - Data `user_verifications` (foto fisik KTP, NIK, alamat KTP, catatan verifikasi) dan `user_bank_accounts` (nama bank, nomor rekening, nama pemilik) tergabung utuh.

### B. Penyempurnaan Kartu Mitra Aktif di `MitraManagement.tsx`
- **Tombol Utama "Detail & Properti"**:
  - Tombol utama di samping tombol "Chat" kini aktif dan memanggil `onViewProfile(mitra.id)`.
- **Pembersihan Duplikasi Tombol**:
  - Menghapus tombol kecil duplikat "Detail" di baris bawah, sehingga baris bawah kartu rapi dan terfokus pada aksi administratif (`Blokir` dan `Hapus`).
- **Badge Indikator Cepat**:
  - Menampilkan badge jumlah kost yang terdaftar: `🏠 X Kost`.
  - Menampilkan badge status verifikasi KTP: `Terverifikasi ✓` (hijau), `Ditinjau` (kuning), atau `Belum Verifikasi` (abu-abu).

### C. Pengembangan Modal Inspeksi 2 Tab di `Dashboard.tsx`
- **Tab 1: Data Pribadi & KTP**:
  - **Pratinjau Dokumen KTP Fisik**:
    - Menampilkan foto asli KTP dalam bingkai beresolusi tinggi dengan tombol **Perbesar Gambar** (lightbox fullscreen) dan **Buka Tab Baru**.
    - Jika belum mengunggah KTP, menampilkan indikator jelas bahwa dokumen belum diunggah.
  - **Data Identitas Sipil**:
    - NIK (16 Digit), Nama Lengkap Sesuai KTP.
    - Tempat & Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan.
    - Alamat KTP & Alamat Domisili.
    - Status Verifikasi WhatsApp (OTP) & Email.
  - **Rekening Bank Penarikan Saldo**:
    - Menampilkan Nama Bank, Nomor Rekening, dan Atas Nama Pemilik Rekening jika mitra telah menyetel profil rekening.
- **Tab 2: Properti Terkait**:
  - Menampilkan ringkasan total unit kost terdaftar.
  - Kartu visual untuk setiap properti listing milik mitra:
    - Foto utama properti, judul kost, kota & area.
    - Harga sewa bulanan (`Rp X.XXX.XXX / bln`).
    - Status listing (`Published` / `Draft`).
    - Badge KostManager Auto-Pilot (jika terdaftar di program KostManager).
    - Jumlah tipe kamar kost.
    - Tombol langsung **"Buka Halaman Kost"** (`/kost/:id`) di tab baru untuk inspeksi langsung halaman publik.
    - Tombol cepat **"+ Transfer Properti Baru"** ke mitra tersebut.

---

## 2. Hasil Verifikasi Kompilasi (Build Test)

Uji kompilasi frontend Vite dijalankan dengan `cmd.exe /c npm run build`:
```bash
cmd.exe /c npm run build
```

**Output Log**:
```
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.92 kB │ gzip:   2.29 kB
../../public/assets/index-D7vvDS89.css                 300.23 kB │ gzip:  36.01 kB
../../public/assets/MitraDashboard-CGLvcUqJ.js         428.03 kB │ gzip:  93.38 kB
../../public/assets/Dashboard-CbImymLa.js            1,416.51 kB │ gzip: 311.25 kB
✓ built in 30.59s
```
*Hasil*: **0 Error Kompilasi, Lulus 100%**.

---

## 3. Panduan Pengujian bagi Pengguna (User Testing)

1. Buka Admin Panel pada menu **Kelola Mitra** (`/dashboard-admin/mitra`).
2. Pilih tab **Mitra Aktif**:
   - Perhatikan kartu setiap mitra kini memiliki:
     - Badge jumlah properti listing di pojok kanan atas (`🏠 X Kost`).
     - Baris **VERIFIKASI KTP** dengan status (`Terverifikasi ✓` / `Ditinjau` / `Belum Verifikasi`).
     - Tombol **"Detail & Properti"** (biru) di samping tombol **"Chat"**.
     - Baris bawah kartu rapi dengan 2 tombol administratif: **Blokir** dan **Hapus**.
3. Klik tombol **"Detail & Properti"** pada salah satu mitra aktif:
   - Modal detail komprehensif terbuka.
   - Pada tab **"Data Pribadi & KTP"**:
     - Tinjau foto fisik KTP asli mitra. Klik gambar atau tombol *"Perbesar Gambar"* untuk melihat dalam tampilan lightbox fullscreen.
     - Periksa data NIK 16 digit, nama lengkap, tempat/tanggal lahir, agama, status perkawinan, pekerjaan, alamat KTP, serta rekening bank penarikan saldo.
   - Klik tab **"Properti Terkait"**:
     - Tinjau daftar seluruh properti kost yang dimiliki oleh mitra tersebut lengkap dengan foto, harga bulanan, kota/area, status publikasi, dan tipe kamar.
     - Klik tombol *"Buka Halaman Kost"* untuk langsung membuka halaman detail kost di tab baru.
