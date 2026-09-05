# Walkthrough: Pemisahan Tahap Awal Pemilihan Metode Pendaftaran KostManager (Dedicated Step)

## Ringkasan Perubahan
Memisahkan alur pendaftaran KostManager (`functions/public/pages/KostManagerLanding.tsx`) menjadi **3 Tahapan Multi-Step Mandiri**, di mana calon mitra disajikan layar khusus untuk memilih metode pendaftaran terlebih dahulu di awal sebelum masuk ke tahapan pengisian / pemilihan data properti.

---

## Daftar Perubahan Spesifik

### 1. Layar Khusus Pemilihan Metode Pendaftaran (Dedicated Step 1: `modalStep = 'method'`)
- Menampilkan antarmuka awal yang fokus dan eksklusif dengan 2 kartu pilihan besar:
  - **Opsi A: Pilih dari Listing Kost Saya (Listing Terdaftar)**
    - Ikon besar `<Building2 />`, badge ketersediaan `{userKosts.length} Properti Tersedia`.
    - Deskripsi kemudahan sinkronisasi foto, spesifikasi kamar, dan lokasi GPS tanpa input ulang.
  - **Opsi B: Daftar Kost Baru Eksklusif (Input Manual)**
    - Ikon besar `<PlusCircle />`, badge `Kost Baru`.
    - Deskripsi panduan pengisian formulir data properti baru, GPS, dan pinpoint peta Google Maps dari awal.
- Tombol aksi *"Lanjut ke Data Properti →"* yang mengarahkan mitra ke Tahap 2 sesuai opsi yang dipilih.

### 2. Penyelarasan Tahap 2 Data Properti (`modalStep = 'form'`)
- **Navigasi Kembali Fleksibel**: Menyediakan tombol *"← Ganti Pilihan Metode"* dan *"Kembali ke Pilihan Metode"* agar mitra dapat kembali ke layar pemilihan metode dengan mudah.
- **Sub-flow Opsi A (Pilih dari Kost Saya)**:
  - Menampilkan grid kartu pemilih properti visual dengan foto thumbnail, tipe, kota, kamar, dan status KostManager.
  - Menampilkan banner preview foto cover resolusi tinggi dan mini-map lokasi koordinat.
  - Menampilkan konfirmasi data formulir yang tersinkronisasi otomatis.
- **Sub-flow Opsi B (Daftar Kost Baru Manual)**:
  - Menampilkan formulir input data kost baru lengkap (Nama Kost, Jenis Kost, Jumlah Kamar, Kamar Kosong, Link Maps, Ambil GPS, Pilih di Peta, dan Alamat).

### 3. Multi-Step Indicator Bar 3 Tahap
- Header modal diperbarui dengan indikator progres 3 langkah:
  1. `1. Pilih Metode`
  2. `2. Data Properti`
  3. `3. Syarat & MoU`

### 4. Tahap 3: Syarat & Ketentuan (MoU) & Pembayaran (`modalStep = 'mou'`)
- Menampilkan ringkasan data properti & paket langganan yang dipilih, Syarat & Ketentuan berformat dokumen resmi, checkbox persetujuan interaktif, dan tombol checkout pembayaran.

---

## Hasil Pengujian & Kompilasi
- **Uji Kompilasi Vite**: `cmd /c npm run build` di `functions/public`
  ```
  vite v6.4.1 building for production...
  transforming...
  ✓ 2511 modules transformed.
  ✓ built in 42.01s
  ```
  **Hasil**: 0 Error, 100% Lulus.

---

## Panduan Pengujian User
1. Buka halaman **KostManager** (atau klik tombol **"Langganan KostManager Sekarang"**).
2. Perhatikan bahwa modal kini **langsung menampilkan layar pemilihan metode yang bersih** dengan 2 kartu pilihan (*Pilih dari Listing Kost Saya* vs *Daftar Kost Baru Eksklusif*).
3. Klik salah satu kartu pilihan metode, lalu tekan tombol **"Lanjut ke Data Properti"**.
4. Jika memilih *Pilih dari Listing Kost Saya*, pilih properti dari kartu visual untuk melihat preview foto dan sinkronisasi datanya.
5. Anda dapat menekan tombol **"← Ganti Pilihan Metode"** kapan saja untuk kembali ke layar pemilihan awal.
6. Tekan **"Lanjut: Syarat & Ketentuan"** untuk menyetujui MoU dan melanjutkan ke pembayaran.
