# IMPLEMENTATION PLAN — Transformasi 1:1 Modal Properti Terkelola Portal KostManager Mengadopsi Flow & UI/UX Form Pendataan Lapangan Agen (`AgentDashboard.tsx`)

**Tanggal Pengajuan**: 28 Agustus 2026  
**Status**: 📌 Menunggu Persetujuan User (FASE 1)  
**File Target**: `functions/public/components/admin/KostManagerPortal.tsx`

---

## 1. Analisis Masalah & Kebutuhan Pengguna

### Latar Belakang Masalah
- Pada iterasi sebelumnya, tampilan modal edit properti di Portal KostManager (`KostManagerPortal.tsx`) mengadopsi layout dari modal *peninjauan/audit admin* (`KostManagerManagement.tsx`). 
- Pengguna merasa layout peninjauan tersebut kurang cocok dan membingungkan untuk alur pengeditan aktif (*interactive property editor*).
- **Kebutuhan Pengguna**: Mengganti modal tambah/edit properti di Portal KostManager secara penuh (100%) menggunakan **tampilan visual, alur multi-step (Step 1, 2, 3), komponen input, dan flow yang ada di Form Pendataan Lapangan Agen KostManager (`AgentDashboard.tsx`) dalam skala 1:1**.

### Perbedaan Alur Utama:
1. **Di Dashboard Agen (`AgentDashboard.tsx`)**:
   - Agen mengisi formulir survei 3-step lalu menekan tombol Submit yang mengirim data ke dashboard admin sebagai draft pengajuan berstatus `SUBMITTED` / `PENDING_ONBOARDING` untuk ditinjau.
2. **Di Portal KostManager (`KostManagerPortal.tsx`)**:
   - Pengelola/Admin menggunakan formulir 3-step yang sama persis (1:1), namun ketika tombol simpan/selesaikan diklik, **data langsung disimpan dan diupdate secara langsung (Direct Live Update)** ke database properti terkelola Supabase/Firebase tanpa alur perantara review.

---

## 2. Dampak Perubahan File

- `functions/public/components/admin/KostManagerPortal.tsx` (Perombakan modal `ManagedPropertyAddModal` dan integrasi state stepper 1:1)
- `functions/PROGRESS.md` (Pencatatan riwayat progres entry #147 setelah eksekusi di Fase 2)
- `WALKTHROUGH.md` (Dokumentasi walkthrough final setelah eksekusi di Fase 2)

---

## 3. Rencana Arsitektur & Langkah-Langkah Eksekusi (1:1 Form Pendataan Agen)

### Tahap 1: Sinkronisasi State & Flow Stepper 3-Langkah (Step 1, Step 2, Step 3)
1. Menyelaraskan state form `kmListingForm` di modal `ManagedPropertyAddModal` agar memuat seluruh struktur data form survei:
   - `kmStep` (1 = Properti, 2 = Data Kamar, 3 = Review & Selesai).
   - `temporaryRoom` (state editor untuk kamar baru atau kamar yang sedang diedit).
   - `activeRoomIdx`, `expandedRoomIdx`, `activePhotoIdx`.
   - `deleteRoomConfirm` (modal konfirmasi hapus kamar).
   - State pendukung: peta interaktif modal pop-up (`isMapModalOpen`), geocoding autocomplete landmark/kampus terdekat, dan state upload kategori foto.

### Tahap 2: Implementasi STEP 1 — PROPERTI (1:1 Skala Agen)
Mengadopsi seluruh komponen Step 1 dari `AgentDashboard.tsx`:
1. **Profil & Kontak Properti**:
   - Input Nama Properti Kos.
   - Pilihan Tipe Kos (`Putra`, `Putri`, `Campur`).
   - Input Total Jumlah Kamar target.
   - Textarea Alamat Lengkap Real Bangunan.
2. **Wilayah Administratif Terstruktur**:
   - 3 Kotak Input: 🏛️ Provinsi, 🏙️ Kota/Kabupaten, 📍 Kecamatan/Area (otomatis terisi dari geocoding & dapat diedit).
3. **Lokasi GPS & Peta Terkunci**:
   - Frame mini-map dengan titik koordinat Lat/Lng terkunci.
   - Tombol *Buka Peta Pop-up (Layar Penuh)* (`isMapModalOpen`) dengan pencarian Google Places autocomplete dan pin drag-and-drop.
   - Tombol *Gunakan Lokasi Saya Saat Ini* (Geolocation API).
4. **Fasilitas & Landmark / Kampus Terdekat**:
   - List landmark/kampus yang sudah ditambahkan dengan koordinat.
   - Form tambah landmark dengan 2 mode: Autocomplete Google Places atau Konversi Link Google Maps / Short link GMaps.
5. **Fasilitas Umum Properti**:
   - Grid checkbox fasilitas: WiFi, Dapur Bersama, Area Parkir, Ruang Tamu, CCTV, Laundry, WC Umum.
   - **Sub-kelengkapan Dapur Bersama**: Kompor, Kulkas, Dispenser, Wastafel Cuci Piring, Peralatan Masak, Meja Makan + input kustom.
   - **Sub-kelengkapan Area Parkir**: Parkir Motor, Parkir Mobil, Parkir Sepeda + input kustom.
   - **Sub-kelengkapan WC Umum**: Kloset Duduk, Kloset Jongkok, Shower, Wastafel + input kustom.
   - Input penambahan fasilitas umum kustom.
6. **Dokumentasi Area Umum & Fasilitas Properti**:
   - Upload foto per-area berkategori (`Tampak Depan`, `Area Parkir`, `Dapur Bersama`, `Ruang Tamu`, `Bangunan Kost`, dll.).
   - Kompresi WebP client-side otomatis sebelum upload.
   - Input penambahan kategori area baru.
7. **Peraturan Kost**:
   - List peraturan dengan textarea max 100 karakter + tombol hapus.
   - Input penambahan peraturan baru.

### Tahap 3: Implementasi STEP 2 — DATA KAMAR (1:1 Skala Agen)
Mengadopsi seluruh sistem pengelolaan kamar dari `AgentDashboard.tsx`:
1. **Progres Pendataan Kamar**:
   - Banner status: `[ X / Y Kamar ]` (Kamar Terdata / Target Total Kamar).
2. **Daftar Kamar (Accordion Cards)**:
   - Card per kamar dengan nomor kamar, lantai, tipe kamar, badge `[ Terisi ]` (Green) vs `[ Kosong ]` (Orange), tombol Hapus Kamar dengan modal konfirmasi.
   - Klik accordion membuka editor kamar untuk kamar tersebut.
3. **Tombol "+ Tambah Kamar Baru"**:
   - Membuka form `temporaryRoom` jika target jumlah kamar belum tercapai.
4. **Editor Kamar Lengkap (`temporaryRoom` / Active Room Editor)**:
   - **Detail Kamar**: Nomor Kamar, Dropdown Lantai (Lantai 1-4/kustom), Dropdown Tipe Kamar (Standard/Premium/Deluxe/Kustom), Dimensi Kamar (Panjang X Lebar meter).
   - **Status Kamar**: Tombol toggle kontras `[ Terisi ]` vs `[ Kosong ]`.
   - **Salin Konfigurasi**: Dropdown salin tarif & fasilitas dari kamar yang sudah ada sebelumnya.
   - **Skema Tarif / Harga**: Multi-periode sewa (Bulanan, Tahunan, 6 Bulan, 3 Bulan, Mingguan, Harian) + Maks. Kapasitas Penghuni + Biaya Ekstra Orang per Bulan.
   - **Fasilitas Kamar**: Toggle Kosongan vs Furnished + Checklist Fasilitas (Kasur, Lemari, Meja, AC, Kipas, TV, Water Heater, dll.) + Sub-kelengkapan KM Dalam (Kloset Duduk/Jongkok, Shower, Wastafel) + Sub-kelengkapan Dapur Dalam (Kompor, Kulkas, Sink, Kitchen Set) + Input tag kustom.
   - **Biaya Bulanan Lainnya**: Nominal + Checklist cakupan (Listrik, Air, Sampah, Wifi, Parkir/Keamanan).
   - **Dokumentasi Foto Kamar**: Kategori foto dinamis terhitung otomatis dari fasilitas aktif (Interior Kamar, KM Dalam, Dapur Dalam, dll.) + tambah kategori foto kamar kustom + WebP compression.
   - **Informasi Penghuni (Jika Terisi)**: Nama Lengkap, Nomor HP/WhatsApp, Jenis Langganan, Tanggal Pembayaran Terakhir, Tanggal Jatuh Tempo Tagihan Berikutnya, Jumlah Penghuni Saat Ini, dan Form Anggota Penghuni Tambahan (jika > 1 orang).
   - Tombol **"Simpan Kamar"** & **"Batal"**.

### Tahap 4: Implementasi STEP 3 — REVIEW & LIVE UPDATE (1:1 Skala Agen)
Mengadopsi review screen dari `AgentDashboard.tsx` dengan penyesuaian Live Save:
1. **Ringkasan Profil & Lokasi Properti**:
   - Kartu info nama kost, tipe gender, alamat lengkap, dan koordinat GPS.
2. **Simulasi Tampilan Mobile App (Preview Phone Frame)**:
   - Phone frame interaktif yang mensimulasikan tampilan halaman detail kost di aplikasi calon penyewa (Carousel foto, badge terverifikasi, harga mulai dari, fasilitas, deskripsi).
3. **Ringkasan Data Kamar**:
   - Statistik Total / Terisi / Kosong.
   - Accordion review kamar lengkap dengan info penghuni (jika terisi), skema tarif, dan thumbnail foto kamar.
4. **Data Mitra Pemilik**:
   - Identitas pemilik properti, nomor WhatsApp, serta rekening bank pencairan bagi hasil.
5. **Syarat & Ketentuan / Konfirmasi Direct Update**:
   - Checkbox persetujuan data properti terkelola KostManager.
6. **Tombol Aksi Final**:
   - Tombol **"💾 Simpan Perubahan & Terbitkan Langsung (Live Update)"** yang secara langsung mengupdate record properti di Supabase tanpa perantara review status.

### Tahap 5: Bottom Navigation Bar Stepper
- Step 1: `[ Keluar ]` dan `[ Lanjut ke Step 2 ]`.
- Step 2: `[ Kembali ke Step 1 ]` dan `[ Lanjut ke Step 3 ]` (validasi kamar lengkap sesuai total kamar).
- Step 3: `[ Kembali ke Step 2 ]` dan `[ 💾 Simpan & Update Properti ]`.

---

## 4. Rencana Verifikasi & Uji Kelayakan

1. **Uji Kompilasi TypeScript & Vite**:
   - Menjalankan `npm.cmd run build` di `functions/public/` dan memastikan 0 error kompilasi.
2. **Verifikasi Flow 3-Step**:
   - Membuka modal Tambah/Edit Properti di Portal KostManager.
   - Memastikan navigasi Step 1 → Step 2 → Step 3 berjalan mulus.
3. **Verifikasi Input & Perubahan Data (Live Update)**:
   - Mengubah data umum di Step 1 (nama, fasilitas umum, koordinat, foto area).
   - Menambah / mengedit unit kamar di Step 2 (dimensi P×L, multi-tarif, foto kamar, data penghuni).
   - Menyimpan di Step 3 dan memverifikasi data langsung ter-update di database dan daftar properti portal.

---

> [!IMPORTANT]
> **Pemberitahuan Protokol FASE 1**:
> Dokumen ini adalah rancangan perencanaan. Tidak ada file kode yang diubah sebelum Anda menyetujui dokumen ini.
> Silakan klik tombol **Proceed** / berikan konfirmasi **"ACC"** jika Anda menyetujui rencana kerja ini.
