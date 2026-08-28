# WALKTHROUGH: Penyelarasan Presisi 1:1 Editor Properti Portal KostManager dengan Modal Peninjauan Hasil Survei Admin (Interactive Editable)

## 📌 Ringkasan Pengerjaan
Kami telah berhasil menyelesaikan penyelarasan **1:1 presisi penuh** antara modal editor properti terkelola di **Portal KostManager** (`KostManagerPortal.tsx`) dengan modal **Peninjauan Hasil Pendataan Survei Admin** (`KostManagerManagement.tsx`), dengan seluruh data dan fiturnya kini **langsung dapat diedit (interactive editable)**.

Sebelumnya, saat membuka properti hasil survei (seperti Kost Madani), data kamar terpecah menjadi item tipe kamar terpisah dengan kamar dummy `RM-101`, data penghuni riil (`zul`) hilang, dan 12 foto dokumentasi kamar tidak muncul di hero carousel galeri kamar. Hal ini disebabkan oleh format data mentah database (flat array unit kamar) yang belum di-grouping cerdas saat tombol edit diklik.

Kini, dengan penerapan algoritma `groupIntoRoomTypesGlobal`, `normalizePhotosWithLabels`, dan sinkronisasi `propResidents`, data Kost Madani dan seluruh properti terkelola lainnya tampil **1 banding 1 persis** seperti yang tampak pada screenshot referensi Anda.

---

## 🔍 Detail Perubahan & Hasil Penyelarasan 1:1

### 1. Tab 1: Properti Umum & Alamat (Persis Screenshot 1)
- **Two-Way Carousel Sync**: Mengklik kartu fasilitas umum (seperti *Area Parkir*, *Dapur Bersama*, *WC Umum*) akan langsung menggeser hero frame foto ke foto fasilitas dokumentasi yang bersangkutan.
- **Sub-Chips Rincian Parkir Interaktif**: Pada kartu `Area Parkir`, terdapat sub-chips kendaraan (`🏍️ Motor`, `🚗 Mobil`, `🚲 Sepeda`) yang dapat diaktifkan/dinonaktifkan secara independen.
- **Alamat & Google Maps 2 Kolom**: 5 kotak data administratif terstruktur (Provinsi, Kabupaten/Kota, Kecamatan/Area, Latitude, Longitude) berdampingan langsung dengan peta satelit Google Maps interaktif (`LocationPicker`) dan tombol rute `Lihat Rute di Google Maps ↗`.
- **Informasi Surveyor & Folder GDrive**: Header info strip menampilkan nama Surveyor Lapangan serta link akses cepat `Folder GDrive`.

### 2. Tab 2: Galeri Foto Kamar Hasil Pendataan (Persis Screenshot 2 & 3)
- **Floating Detail Card Kiri Bawah**:
  - Menampilkan `NOMOR KAMAR` (misal: `Kamar 3` atau `Kamar 4`), dimensi ukuran (`2x2 meter`), tarif sewa (`TARIF Rp 400.000/bln`), serta chips fasilitas kamar (`[Kosongan (Tanpa Perabot)]`, `[Jendela Luar]`).
- **Counter & Badge Kategori Foto**:
  - Badge kategori foto aktif di kiri atas frame: `📸 INTERIOR KAMAR`, `📸 KAMAR MANDI DALAM`, `📸 TEMPAT TIDUR`, `📸 LEMARI / PENYIMPANAN`, `📸 JENDELA LUAR`.
  - Counter foto di kanan atas: `1 / 12`, `2 / 12`, dst.
- **Thumbnail Strip Horizontal Berlabel**:
  - Setiap thumbnail memuat badge nomor unit di pojok kiri atas (`Kamar 3`, `Kamar 4`, dll.) dan badge nama fasilitas di bagian bawah.
  - Thumbnail yang aktif memiliki bingkai oranye tebal `#ff7a00` dengan ring bercahaya.

### 3. Tab 2: Level 1 Accordion Tipe Kamar & Sub-Parent Accordions (Persis Screenshot 3, 4 & 5)
- **Header Level 1 (Tipe Kamar)**:
  - Ikon tempat tidur biru dalam rounded badge.
  - Nama Tipe Kamar editable (`TIPE STANDARD`).
  - Chips ukuran kamar `📐 2x2 meter` (editable) dan fasilitas lengkap.
  - Tarif sewa `Rp 400.000/bln` (editable).
  - Badge counter: `✨ 3 Kosong` dan `🔒 2 Dihuni`.
- **Dua Sub-Parent Accordions Berpasangan (Level 2)**:
  - **`[ 🔒 ] KAMAR SEDANG DIHUNI / TERISI [2 UNIT]` (Amber)**
  - **`[ ✨ ] KAMAR KOSONG / SIAP HUNI [3 UNIT]` (Emerald)**
  - Masing-masing sub-accordion memiliki tombol toggle `BUKA LIST v` / `TUTUP LIST ^`.
- **Unit Card Kamar Terisi (Persis Screenshot 5)**:
  - Header unit: Ikon gembok amber, status switch button `[🔒 Dihuni (Klik untuk Kosongkan)]`, input nama kamar (`Kamar 1`), tarif sewa, dan tombol hapus kamar.
  - **Grid Data Penghuni 3 Kolom (Direct Editable)**:
    - 👤 **Nama Penghuni**: input teks nama penghuni (`zul`) & jumlah orang (`1 Orang`).
    - 📱 **Kontak WhatsApp**: input no handphone (`081527080656`) & tombol tautan `Hubungi via WA ↗`.
    - 📅 **Periode & Tagihan**: dropdown periode (`Bulanan`, `Triwulan`, `Tahunan`) & date picker jatuh tempo (`2026-09-28`).
  - **Fasilitas & Spesifikasi Terpasang**: Chips interaktif dengan efek korelasi hover (`[ 🪄 Kosongan (Tanpa Perabot) ]`, `[ 🪟 Jendela Luar ]`).
  - **Dokumentasi Foto Unit**: Thumbnail foto dengan zoom lightbox, tombol hapus, dan tombol upload WebP cepat (`+ interior`, `+ kasur`, `+ wc`, `+ jendela`).
- **Unit Card Kamar Kosong (1:1 Layout)**:
  - Header unit: Ikon bintang hijau, status switch button `[✨ Kosong (Klik untuk Pasang Penghuni)]`, input nama kamar (`Kamar 3`, `Kamar 4`, `Kamar 5`).
  - **Grid Spesifikasi 3 Kolom**: 1 kolom ukuran kamar (`2x2 meter`) + 2 kolom fasilitas terpasang interaktif.
  - Menampilkan seluruh foto unit kamar kosong yang terkumpul saat survei.

### 4. Standar Baku Kompresi WebP Client-Side (Rule #5)
- Seluruh pengunggahan foto baru (foto kamar maupun foto gedung) diproses melalui `compressImageToWebP` di browser sebelum dikirim ke Supabase Storage, menghasilkan file `.webp` berukuran ringan tanpa menurunkan ketajaman visual.

---

## 🧪 Hasil Pengujian & Verifikasi Kompilasi

Kompilasi build frontend dijalankan menggunakan `npm.cmd run build` di folder `functions/public/`:
```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 2526 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 29.27s
```
**Status: 100% LULUS dengan 0 error kompilasi.**

---

## 📋 Panduan Pengujian untuk Pengguna (User Testing Guide)

1. Buka browser dan login ke **Dashboard Admin** RuangSinggah.
2. Masuk ke menu **KostManager** -> **Portal KostManager** (`/kostmanager-portal`).
3. Pada tabel properti terkelola, cari baris properti **Kost Madani** (atau properti hasil survei lainnya).
4. Klik tombol **`✏️ Kelola & Edit Properti`**.
5. **Uji Tab 1 (Data Properti Umum)**:
   - Perhatikan hero foto gedung: klik kartu fasilitas *Area Parkir* -> slider foto otomatis berpindah ke foto Area Parkir (*Two-Way Sync*).
   - Cek toggle sub-chips `Motor`, `Mobil`, `Sepeda`.
   - Periksa 5 kotak alamat dan peta Google Maps interaktif.
6. **Uji Tab 2 (Data Kamar & Penghuni)**:
   - Perhatikan 4 KPI Cards di bagian atas: `Total Kamar: 5`, `Kamar Terisi: 2`, `Kamar Kosong: 3`, `Total Penghuni: 2`.
   - Lihat hero carousel foto kamar: floating card di kiri bawah menampilkan `Kamar 3`, `2x2 meter`, `Rp 400.000/bln`, dan chips fasilitas.
   - Cek thumbnail strip horizontal berlabel dengan counter foto `1 / 12`.
   - Buka Level 1 Accordion: `TIPE STANDARD`, `Rp 400.000/bln`, `✨ 3 Kosong`, `🔒 2 Dihuni`.
   - Buka Sub-Parent `[ 🔒 ] KAMAR SEDANG DIHUNI / TERISI`: lihat `Kamar 1` dengan nama penghuni `zul`, kontak `081527080656`, periode `Bulanan`, dan tanggal jatuh tempo.
   - Uji tombol switch status: klik `[🔒 Dihuni]` -> kamar berpindah ke grup `Kamar Kosong`. Klik `[✨ Kosong]` -> kamar berpindah kembali ke grup `Kamar Dihuni`.
   - Seluruh teks dapat diedit langsung.
7. Klik tombol hijau **`💾 Simpan Perubahan Properti`** untuk menyimpan data ke database.
