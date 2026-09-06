# WALKTHROUGH - Pengembalian Sistem Cloning Otomatis Self-Listing Mitra & Modal Peringatan Verifikasi Surveyor Pendataan KostManager

**Tanggal**: September 2026  
**Status**: Selesai & Lulus Verifikasi Build (`0 Error`)  
**Branch Git**: `bukan-productions`

---

## 📌 Ringkasan Masalah & Permintaan Pengguna

Pengguna melaporkan:
1. **Cloning Data Self-Listing Tidak Otomatis Muncul**:
   - Data kost yang bersumber dari listing mitra biasa (fasilitas utama, sub-fasilitas parkir/dapur/WC umum, tipe kamar, alamat, lokasi GPS, dll.) tidak otomatis terisi ketika form pendataan KostManager dibuka oleh agen surveyor.
2. **Hilangnya Modal Peringatan Peninjauan Ulang Data**:
   - Sistem peringatan bagi agen surveyor:
     > *"Peninjauan Ulang Data: Beberapa data secara otomatis sudah terisi, lakukan peninjauan ulang untuk memastikan kesesuaian data sudah benar."*
     sebelumnya hilang / tidak muncul lagi saat form dibuka.

---

## 🔍 Akar Masalah Teknis

1. **Pencarian Property ID yang Terbatas pada `openKostManagerListing`**:
   - `propertyIdToFetch` sebelumnya hanya memeriksa `req.kost_id` dan `req.transaction_id`. Jika ID tersimpan di `req.transaction?.metadata?.propertyId`, `(req as any).property_id`, atau di tabel `properties` dengan `owner_uid`/`mitra_id` sesuai `req.user_id`, data properti eksisting tidak terdeteksi.
2. **Interferensi Draf Kosong / Prematur yang Menimpa Form**:
   - Ketika persistensi draf database diaktifkan sebelumnya, pembukaan awal sempat mencatat draf awal yang belum terisi. Saat form dibuka kembali, sistem langsung melakukan *early return* memuat draf kosong tersebut dan melewatkan proses cloning dari data properti asli (`dbPropertyRecord`).
3. **State `warningAccepted: true` Tersimpan di Draf**:
   - State `warningAccepted` tersimpan `true` di draf, sehingga kondisi modal `{isExistingPropertyMigration && !warningAccepted && (...)}` terlewati dan tidak tampil ke layar agen surveyor.

---

## 🛠️ Solusi & Perubahan yang Diterapkan

### 1. Multi-Kanal Resolusi Properti Eksisting (`openKostManagerListing`)
- Menambahkan fallback pencarian komprehensif:
  - Cek `req.kost_id` (jika UUID valid).
  - Cek `req.transaction?.metadata?.propertyId`, `(req as any).property_id`, `(req as any).propertyId`.
  - Cek metadata transaksi via query `transactions`.
  - Fallback query ke tabel `properties` dengan filter `owner_uid.eq.user_id` ATAU `mitra_id.eq.user_id`.
  - Pencocokan cerdas berdasarkan ID, nama kost persis (`title` $\leftrightarrow$ `kost_name`), pencocokan parsial nama kost, atau properti pertama milik mitra.

### 2. Pemulihan Mutlak Modal Peringatan Peninjauan Ulang Data
- Setiap kali `openKostManagerListing` dibuka dan `dbPropertyRecord` (atau `dbKmProp`) terdeteksi:
  - Sistem mengaktifkan `setIsExistingPropertyMigration(true)`.
  - Mereset `setWarningAccepted(false)` agar pop-up:
    > **"Peninjauan Ulang Data: Beberapa data secara otomatis sudah terisi, lakukan peninjauan ulang untuk memastikan kesesuaian data sudah benar."**
    **SELALU MUNCUL** setiap kali surveyor membuka tugas pendataan kost yang berasal dari listing mitra biasa.

### 3. Restorasi Penuh Cloning Data Self-Listing ke Form Surveyor
- Mengkloning seluruh data dari `dbPropertyRecord`:
  - **Identitas Properti**: `title`, `description`, `address`, `city`, `area`, `province`, `type` (Putra/Putri/Campur), `price`, `rules`, `campuses`, dan koordinat GPS `location` (`lat`, `lng`).
  - **Fasilitas & Sub-Fasilitas**: Normalisasi 13 fasilitas standar, sub-fasilitas dapur bersama (`Kompor`, `Kulkas`, `Dispenser`, dll.), sub-fasilitas parkir (`Parkir Motor`, `Parkir Mobil`, dll.), dan sub-fasilitas kamar mandi (`Kloset Duduk`, `Shower`, dll.) via `normalizeAndExtractPublicFacilities`.
  - **Kategori Foto Terintegrasi**: Memanggil `computeDynamicPublicPhotoCategories` sehingga kartu foto area publik langsung terkonfigurasi sesuai fasilitas yang tercentang.
  - **Data Kamar**: Mengkloning spesifikasi seluruh unit kamar (`room_types` berupa nama kamar, ukuran, harga/tarif, fasilitas kamar) dengan slot foto bersih (0 foto) untuk diisi foto survei autentik lapangan.
  - **Total Kamar**: Mengambil dari `dbPropertyRecord.total_rooms` atau hitungan metadata pesanan.

### 4. Sinkronisasi Cerdas Draf vs Properti Eksisting
- Ketika draf dimuat, jika draf memiliki fasilitas atau kamar yang kosong/belum lengkap, sistem secara cerdas melakukan *fallback merge* dengan data properti `dbPropertyRecord`.
- Foto survei baru yang telah diunggah pada sesi sebelumnya tetap dipertahankan dengan aman dan tidak hilang.

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
  ✓ built in 53.18s
  ```
- **Status**: **Lulus 100% (0 Error / 0 Warning Kritis)**.

---

## 📋 Panduan Verifikasi Pengujian oleh Pengguna

1. Buka halaman **Dashboard Agen / Surveyor** pada menu tugas survei KostManager.
2. Klik tombol **"Pendataan Kost"** pada salah satu tugas survei yang berasal dari listing mitra biasa.
3. **Verifikasi 1 (Modal Peringatan Muncul)**:
   - Pop-up modal **"Peninjauan Ulang Data"** langsung muncul di layar dengan pesan:
     *"Beberapa data secara otomatis sudah terisi, lakukan peninjauan ulang untuk memastikan kesesuaian data sudah benar."*
4. Klik tombol **"Saya Mengerti"**:
   - Modal tertutup dan menampilkan form Step 1 (PROPERTI).
5. **Verifikasi 2 (Data Properti & Fasilitas Otomatis Terisi)**:
   - Nama kost, alamat, kota, area, tipe kost, harga, dan koordinat GPS terisi otomatis dari data listing mitra.
   - Fasilitas yang sebelumnya terdaftar pada kost mitra (seperti *Dapur Bersama*, *WC Umum*, *Area Parkir*, *WiFi*, *Ruang Tamu*, dll.) beserta sub-fasilitasnya (misal: *Parkir Motor*, *Kompor*, dll.) **otomatis tercentang**.
   - Kartu dokumentasi area umum di bagian bawah otomatis memuat kategori foto yang terintegrasi dengan fasilitas/sub-fasilitas yang tercentang.
6. Klik **"Lanjut ke Step 2"**:
   - **Verifikasi 3 (Data Kamar Otomatis Terisi)**: Tipe kamar beserta nama, ukuran, fasilitas kamar, dan harga bulanan otomatis terisi dari data kost mitra, dengan slot foto kamar bersih siap untuk pengambilan foto survei baru.
