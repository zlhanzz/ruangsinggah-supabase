# Walkthrough: Penataan Alur Pendaftaran KostManager (Formulir di Awal & Syarat dan Ketentuan di Akhir)

## Ringkasan Perubahan
Alur pendaftaran program **KostManager** pada modal pendaftaran (`KostManagerLanding.tsx`) telah dirombak menjadi sistem 2 tahap (*2-Step Onboarding Flow*):
1. **Langkah 1**: Formulir Data Properti / Kost (Pilihan Kost Terdaftar atau Input Kost Baru, Tipe, Kamar, GPS / Peta Lokasi, Alamat Lengkap).
2. **Langkah 2**: Syarat & Ketentuan Layanan KostManager (MoU), Checkbox Persetujuan, Tombol Kembali ke Formulir, dan Tombol Pembayaran.

---

## 1. Detail Implementasi pada [`KostManagerLanding.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx)

1. **State Kendali Langkah Alur (`modalStep`)**:
   - Menambahkan state `modalStep: 'form' | 'mou'` (default `'form'`).
   - Saat modal dibuka (`handleOpenRegistration`), sistem selalu memulai pada **Langkah 1: Formulir Data Kost**.

2. **Langkah 1: Formulir Data Properti / Kost (`modalStep === 'form'`)**:
   - Menampilkan indikator langkah: `Langkah 1 dari 2: Data Kost`.
   - Pemilihan properti milik mitra yang sudah terdaftar atau input kost baru secara manual (Nama Kost, Tipe Hunian, Jumlah Kamar, Peta Lokasi GPS Leaflet, Alamat Lengkap).
   - Validasi data sebelum lanjut ke MoU via tombol **"Lanjut: Syarat & Ketentuan"** (`handleProceedToMoU`).

3. **Langkah 2: Syarat & Ketentuan KostManager (MoU) & Persetujuan (`modalStep === 'mou'`)**:
   - Menampilkan indikator langkah: `Langkah 2 dari 2: Syarat & Ketentuan Program`.
   - Menampilkan dokumen MoU resmi (Ruang Lingkup Layanan, Hak & Kewajiban, Pembagian Hasil & Pembayaran, Masa Berlaku & Terminasi).
   - Checkbox persetujuan: *"Saya telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan Layanan KostManager RuangSinggah."*.
   - Tombol **"Kembali ke Formulir"**: Memungkinkan mitra merevisi isian data properti langkah 1 tanpa kehilangan data.
   - Tombol **"Setuju & Lanjut Pembayaran"** (`handleSubmitPayment`): Memvalidasi persetujuan MoU dan membuka modal gateway pembayaran komitmen.

---

## 2. Hasil Pengujian & Kompilasi

- **Kompilasi Frontend Vite**:
  ```bash
  cmd /c npm run build (di functions/public)
  ```
  **Status**: `✓ 2511 modules transformed. ✓ built in 30.64s` (**0 Error, 0 Warning Kritis**).

---

## 3. Panduan Pengujian untuk Pengguna (User Testing Steps)

1. **Buka Landing Page KostManager**:
   - Pastikan login dengan akun mitra yang sudah terverifikasi (`verification_status: 'verified'`).
   - Akses `/kostmanager`.
2. **Buka Modal Pendaftaran**:
   - Klik tombol **"Daftar KostManager Sekarang"** atau tombol **"Pilih Paket & Daftar"**.
   - Perhatikan bahwa modal langsung menampilkan **Langkah 1: Formulir Data Kost** (bukan MoU).
3. **Isi Formulir Langkah 1**:
   - Pilih properti terdaftar atau isi data kost baru (nama, tipe hunian, jumlah kamar, pin lokasi peta, alamat lengkap).
   - Klik tombol oranye **"Lanjut: Syarat & Ketentuan"**.
4. **Tinjau Langkah 2 (Syarat & Ketentuan / MoU)**:
   - Sistem berpindah ke **Langkah 2: Syarat & Ketentuan Program**.
   - Tinjau seluruh poin MoU.
   - Coba klik tombol **"Kembali ke Formulir"** $\rightarrow$ data yang sebelumnya diisi tetap utuh.
   - Klik kembali **"Lanjut: Syarat & Ketentuan"**.
5. **Setujui & Lanjut Pembayaran**:
   - Centang checkbox persetujuan syarat & ketentuan.
   - Klik tombol **"Setuju & Lanjut Pembayaran"** $\rightarrow$ modal pembayaran biaya komitmen KostManager terbuka.
