# WALKTHROUGH - Perbaikan Sinkronisasi Uncheck Fasilitas Induk, Pembersihan Sub-Fasilitas & Kategori Foto Pendataan KostManager

**Tanggal**: September 2026  
**Status**: Selesai & Lulus Verifikasi Build (`0 Error`)  
**Branch Git**: `bukan-productions`

---

## 📌 Ringkasan Masalah & Permintaan Pengguna

Pengguna melaporkan bahwa saat fasilitas induk (seperti **WC Umum**) di-uncheck (dihapus centangnya) pada form pendataan KostManager:
1. Sub-fasilitas di dalamnya tidak ikut ter-uncheck dan kategori upload foto untuk sub-fasilitas tersebut (*KLOSET DUDUK*, *SHOWER*) masih tetap muncul di daftar upload foto area properti.
2. Saat fasilitas induk **WC Umum** dicentang kembali, kotak centang sub-fasilitas di dalamnya langsung tercentang otomatis membawa pilihan lama, alih-alih dimulai dari pilihan bersih.

---

## 🔍 Rincian Perbaikan

1. **Pembersihan Menyeluruh Sub-Fasilitas saat Uncheck Induk**:
   - Menambahkan reset array `publicBathroomFacilities: []`, `publicKitchenFacilities: []`, dan `publicParkingFacilities: []` seketika saat fasilitas induk di-uncheck.
   - Membersihkan seluruh sinonim sub-fasilitas dari `facilities`.

2. **Inisialisasi Bersih & Default Standar saat Dicentang Kembali**:
   - `Area Parkir` $\rightarrow$ `['Parkir Motor']`.
   - `Dapur Bersama` $\rightarrow$ `['Kompor', 'Wastafel Cuci Piring']`.
   - `WC Umum` $\rightarrow$ `['Kloset Duduk', 'Shower']`.

3. **Penyempurnaan Sinkronisasi Kategori Upload Foto Dinamis**:
   - Kategori upload foto sub-fasilitas yang dikelola sistem otomatis disembunyikan seketika saat fasilitas induk di-uncheck dan tidak tertahan lagi oleh filter `manualExtras`.
   - Fungsi `handleSaveDraftDirectly` di `AgentDashboard.tsx` sebelumnya melakukan pembaruan langsung ke tabel `properties` dengan array foto survei `[]` (yang masih kosong di awal survei). Ini menimpa kolom `image_urls` asli milik mitra.
2. **Ketiadaan Fallback Cadangan pada `getOwnerProperties` & `KostFormMitra`**:
   - `getOwnerProperties` dan state inisialisasi form di `KostFormMitra.tsx` tidak membaca cadangan `metadata.self_listing_images` dan `metadata.self_listing_photos_meta`. Akibatnya, saat kolom utama `image_urls` kosong, Dashboard Mitra dan modal Edit Listing menampilkan 0 foto.
3. **Kondisi Fallback `transformPropertyRow`**:
   - Logika fallback gambar sebelumnya hanya membaca cadangan jika `!isManaged`, sehingga jika status properti adalah `is_managed: true` namun proses survei baru dimulai, listing publik kehilangan foto cadangan.

---

## 🛠️ Solusi & Perubahan yang Diterapkan

### 1. Pemisahan Fisik Draf Survei dari Tabel `properties` (`AgentDashboard.tsx`)
- Fungsi `handleSaveDraftDirectly` dan `closeKostManagerListingWithSave` dirombak total agar **HANYA** menyimpan draf survei ke kolom `survey_requests.evaluation_summary.draft_data` dan `localStorage`.
- **DILARANG KERAS** memutasi atau menyentuh tabel `properties` selama proses pengerjaan draf survei berlangsung. Tabel `properties` hanya diperbarui ketika survei telah selesai dan agen menandatangani dokumen serta menekan tombol publikasi resmi.

### 2. Penyimpanan Dedicated Layer KostManager (`mitra_kostmanager`)
- Data survei KostManager yang terverifikasi disimpan pada tabel khusus `mitra_kostmanager`.
- Data asli self-listing mitra (`self_listing_images`, `self_listing_photos_meta`, `self_listing_room_types`, `self_listing_facilities`, `self_listing_rules`, `self_listing_description`, `self_listing_categorized_photos`, `self_listing_photo_categories`) dicadangkan secara permanen dan terlindungi di dalam `properties.metadata`.

### 3. Multi-Tier Robust Fallback pada Service Data (`userService.ts`)
- **`getOwnerProperties`**: Menambahkan resolusi bertingkat (`row.image_urls` $\rightarrow$ `row.metadata?.self_listing_images` $\rightarrow$ `photosMeta`), menjamin Dashboard Mitra selalu menerima seluruh foto listing asli mitra secara utuh.
- **`transformPropertyRow`**: Menjamin fallback gambar, tipe kamar, fasilitas, dan peraturan ke `self_listing_*` jika `is_managed` false ATAU jika data utama kosong.

### 4. Proteksi Form Edit Listing Mitra (`KostFormMitra.tsx`)
- Inisialisasi state `form` saat `editingKost` dimuat diperbarui untuk mengambil foto dan data dari `imageUrls`, `photosMeta`, `metadata.self_listing_images`, dan `metadata.self_listing_photos_meta`.
- Tombol "Edit Listing" di dashboard mitra sekarang selalu menampilkan seluruh foto dan kamar yang telah diunggah mitra sebelumnya.

---

## 🧪 Hasil Pengujian & Verifikasi

### 1. Uji Kompilasi Frontend
- **Perintah**: `npm.cmd run build` pada direktori `functions/public`
- **Hasil**:
  ```text
  vite v6.4.1 building for production...
  transforming...
  ✓ 2512 modules transformed.
  rendering chunks...
  computing gzip size...
  ✓ built in 1m 5s
  ```
- **Status**: **Lulus 100% (0 Error / 0 Warning Kritis)**.

---

## 📋 Panduan Verifikasi Pengujian oleh Pengguna

1. **Pengujian di Dashboard Mitra (`/mitra`)**:
   - Buka Dashboard Mitra dan periksa kartu properti Anda.
   - Pastikan thumbnail cover listing muncul normal dan foto tidak hilang.
   - Klik tombol **Edit Listing**, masuk ke **Langkah 5 (Foto)**.
   - Pastikan seluruh foto yang sebelumnya diunggah mitra tampil lengkap dan badge menunjukkan jumlah foto yang benar (bukan 0 foto).
2. **Pengujian di Dashboard Agen Surveyor (`/agent`)**:
   - Buka form pendataan KostManager pada tugas survei.
   - Perhatikan bahwa draf survei tersimpan aman di database survei tanpa merusak atau mengubah foto listing asli mitra di Dashboard Mitra.
