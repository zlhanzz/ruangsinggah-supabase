# Walkthrough - Notifikasi Email & In-App Admin untuk Listing Properti dalam Tahap Peninjauan (Review)

Dokumen ini merangkum penyelesaian implementasi sistem notifikasi otomatis ke Administrator RuangSinggah ketika seorang mitra mendaftarkan kost baru atau memperbarui data listing yang masuk ke dalam **Tahap Peninjauan Admin (Review)**.

---

## 1. Ringkasan Perubahan

### A. Service Notifikasi Admin (`functions/public/emailService.ts`)
- **Penambahan Fungsi `notifyAdminPropertyReview`**:
  - Mengirimkan email notifikasi ke seluruh administrator terdaftar di database `users` (`role === 'admin' || is_admin === true`) dengan fallback ke email admin utama `sulhan77777@gmail.com`.
  - Format subjek email adaptif:
    - Pendaftaran Baru: `🏠 Pengajuan Listing Kost Baru Menunggu Peninjauan: [Nama Kost]`
    - Pengajuan Ulang: `🔄 Pengajuan Ulang Listing Kost: [Nama Kost]`
  - Payload email komprehensif mencakup:
    - **Nama & ID Properti**: Identitas listing yang diajukan.
    - **Tipe Kost & Lokasi**: Tipe (Putra/Putri/Campur), Alamat Lengkap, Kota/Area.
    - **Harga Sewa Mulai**: Diformat rapi (misal: `Rp 1.000.000 / bulan`).
    - **Kamar**: Jumlah tipe kamar dan estimasi total unit kamar siap huni.
    - **Kontak Mitra**: Nama Lengkap Mitra, Alamat Email Akun, dan Nomor WhatsApp aktif.
    - **Foto Cover**: URL foto bangunan depan / fasad yang sudah terunggah di Supabase Storage.
    - **Status**: `Sedang Ditinjau (Draft / Pending Verification)`.
    - **Tautan Admin**: Tautan langsung ke Pusat Moderasi Dashboard Admin (`https://ruangsinggah.id/dashboard`).
  - **Notifikasi In-App**: Menyisipkan notifikasi ke tabel `notifications` untuk setiap akun admin secara paralel.

### B. Integrasi Formulir Pengajuan Mitra (`functions/public/components/KostFormMitra.tsx`)
- **Pendaftaran Listing Baru**:
  - Menangkap ID properti baru dari `addPropertyWithMedia`.
  - Memicu `notifyAdminPropertyReview` secara asinkron (*non-blocking*) dengan `isResubmission: false`.
- **Pengajuan Ulang Perubahan Draft/Revisi**:
  - Ketika mitra mengedit kost yang statusnya belum `published` (`!isCurrentlyPublished`), sistem memicu `notifyAdminPropertyReview` dengan `isResubmission: true`.
- **Pengalaman Pengguna Tetap Responsif**:
  - Pemicuan dilakukan di latar belakang (`catch` error logging), sehingga dialog alert sukses dan navigasi pengguna tidak terhambat oleh proses pengiriman email.

---

## 2. Hasil Pengujian & Kompilasi

### A. Kompilasi Frontend (`functions/public/`)
```bash
cmd /c npm run build
```
- **Hasil**: ✅ **Lulus 100% (0 error)**
- **Output**: `✓ 2510 modules transformed. built in 29.18s`

### B. Kompilasi Backend (`functions/`)
```bash
cmd /c npm run build
```
- **Hasil**: ✅ **Lulus 100% (0 error)** (`tsc` exit code 0)

---

## 3. Panduan Verifikasi Pengguna (User Testing)

1. Buka **Dashboard Mitra** $\rightarrow$ **Kelola Kost / Tambah Kost Baru** (`/dashboard-mitra/properties`).
2. Masukkan data kost (Info Dasar, Lokasi, Kamar, Fasilitas, dan Foto).
3. Klik tombol **"Publikasikan Kost"** di Langkah terakhir.
4. **Hasil yang Terjadi**:
   - Muncul alert konfirmasi: *"Pendaftaran kost berhasil diajukan! Listing baru Anda saat ini dalam tahap peninjauan (review) oleh tim RuangSinggah dan akan otomatis tayang setelah disetujui."*
   - Di kartu Dashboard Mitra, kost berstatus: **"SEDANG DITINJAU"** dan **"TAHAP PENINJAUAN ADMIN (ESTIMASI 1×24 JAM)"**.
   - Sistem di latar belakang secara otomatis mengirimkan email notifikasi pengajuan review lengkap beserta rincian kamar, harga, kontak WhatsApp mitra, dan foto cover ke email administrator agar dapat langsung diverifikasi di Dashboard Admin.
