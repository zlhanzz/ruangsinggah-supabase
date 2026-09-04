# WALKTHROUGH - Optimasi Deteksi Fasilitas Sekitar Properti: Prioritas Ritel Tier 1 & Filter Anti-Sampah

Dokumen ini merangkum penyempurnaan algoritma pencarian dan deteksi otomatis fasilitas mikro harian (Minimarket, SPBU, Laundry, Tempat Ibadah) pada formulir tambah/edit properti di dashboard mitra dan dashboard agen.

---

## 1. Ringkasan Masalah & Kebutuhan

Sebelum perbaikan:
1. **Pencarian Minimarket** hanya menggunakan keyword umum `convenience_store` atau `minimarket`, sehingga sering mengambil warung kelontong kecil tanpa merek, kios pulsa, atau entri data berkualitas rendah di Google Maps.
2. **Pencarian Bahan Bakar (SPBU)** sering mendeteksi penjual bensin eceran (*Pertamini*, bensin botolan pinggir jalan) daripada SPBU resmi, yang mengurangi kredibilitas listing kost bagi calon penyewa.
3. **Data Sampah Google Maps**: Terkadang fasilitas yang terdeteksi berstatus toko tutup permanen, tempat pindah, atau nama tempat yang tidak mencerminkan fasilitas publik (misal: "Gudang...", "Rumah Pribadi...", dsb).

---

## 2. Solusi & Perubahan yang Diterapkan

### A. Algoritma Filter Entri Sampah / Non-Fasilitas (`isGarbageFacility`)
Ditambahkan fungsi filter heuristik untuk menolak tempat-tempat berkualitas rendah:
- Menolak entri dengan kata kunci negatif: `pertamini`, `bensin eceran`, `tambal ban`, `warung pulsa`, `konter pulsa`, `tutup permanen`, `pindah`, `bekas`, `gudang`, `kantor cabang ekspedisi`, `pos kamling`, `kosong`.
- Menolak entri yang namanya terlalu pendek (< 3 karakter) atau hanya berupa angka/kode.

### B. Prioritas Ritel Nasional Tier 1 untuk Minimarket
Diimplementasikan penapisan multi-query paralel dan verifikasi merek terpercaya:
- **Merek Terverifikasi (Tier 1)**: `Indomaret`, `Alfamart`, `Alfamidi`, `Circle K`, `FamilyMart`, `Lawson`, `Super Indo`.
- **Mekanisme Prioritas Cerdas**:
  - Melakukan pencarian spesifik untuk merek-merek Tier 1 hingga radius 3.5 KM.
  - Jika ditemukan minimarket Tier 1, sistem akan **memprioritaskan minimarket Tier 1 terdekat** untuk ditampilkan di kartu rekomendasi fasilitas kost, daripada toko kelontong tanpa merek yang kebetulan berjarak beberapa meter lebih dekat.
  - Tetap memiliki fallback ke convenience store umum yang valid jika tidak ada minimarket waralaba nasional dalam radius yang ditentukan.

### C. Prioritas SPBU Resmi Tier 1 untuk Pengisian Bahan Bakar
- **Merek Terverifikasi**: SPBU Resmi `Pertamina`, `Shell`, `BP`, dan `Vivo`.
- **Penolakan Keras Kios Eceran**: Menolak tempat bernama "Pertamini", "Pom Mini", "Bensin Botol", dsb.
- **Mekanisme Prioritas**:
  - Memprioritaskan SPBU resmi berlisensi yang terdekat hingga radius 5 KM.
  - Menjamin listing kost menampilkan jarak ke SPBU resmi tempat penyewa bisa mengisi BBM standar dengan aman.

### D. Penajaman Kualitas Laundry dan Tempat Ibadah
- Penapisan ketat untuk laundry kiloan vs industri tekstil / konveksi.
- Penapisan masjid / musholla dan gereja resmi yang aktif digunakan untuk ibadah umum.

---

## 3. Berkas yang Dimodifikasi

1. **[KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)**:
   - Menambahkan fungsi validasi dan penapisan `isGarbageFacility`.
   - Mengoptimalkan fungsi deteksi otomatis fasilitas mikro dengan pembobotan Tier 1 untuk minimarket dan SPBU resmi.
2. **[AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)**:
   - Menerapkan penapisan fasilitas serupa pada alur pendaftaran/manajemen properti oleh agen lapangan.
3. **[PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md)**:
   - Mencatat progres fitur nomor 331.

---

## 4. Hasil Verifikasi & Uji Kompilasi

1. **Kompilasi Frontend Vite (`functions/public`)**:
   ```bash
   cmd /c npm run build
   # Hasil: ✓ 2510 modules transformed.
   # Status: Exit code 0 (Berhasil, 0 error)
   ```
2. **Kompilasi Backend TypeScript (`functions`)**:
   ```bash
   cmd /c npm run build
   # Hasil: tsc compiler berhasil tanpa error
   # Status: Exit code 0 (Berhasil, 0 error)
   ```

---

## 5. Panduan Pengujian bagi Pengguna

1. Buka formulir tambah properti baru atau edit properti di **Dashboard Mitra** (`/mitra-dashboard`) atau **Dashboard Agen**.
2. Masukkan lokasi koordinat / pin peta properti kost.
3. Klik tombol **"Deteksi Fasilitas Sekitar Otomatis"**.
4. Perhatikan hasil fasilitas harian yang muncul:
   - Bagian **Minimarket** akan menampilkan cabang terdekat dari jaringan ritel resmi (seperti *Indomaret* atau *Alfamart*).
   - Bagian **SPBU** akan menampilkan stasiun pengisian resmi (seperti *SPBU Pertamina* atau *Shell*), dan tidak akan memunculkan kios eceran *Pertamini*.
   - Tidak ada entri toko fiktif/tutup.
