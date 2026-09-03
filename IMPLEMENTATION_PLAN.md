# IMPLEMENTATION PLAN: Redesain Tampilan Halaman Data Kost (E-Directory & Database Kost Area Kampus) di Products.tsx

## 1. Analisis Masalah & Kebutuhan
- **Kebutuhan Pengguna**:
  - Mengubah tampilan antarmuka halaman **Data Kost** (`Products.tsx` / `Page.PRODUCTS`) agar 100% selaras dengan desain referensi modern yang dilampirkan pengguna.
- **Elemen Desain yang Diterapkan**:
  1. **Hero Header & Search Bar Terpadu**:
     - Badge atas: `[ 🟠 DATA DIRECTORY TERUPDATE JANUARI 2025 / 2026 ]`.
     - Judul besar: `E-Directory & Database Kost Area Kampus` dengan aksen oranye gradasi.
     - Subtitle deskriptif mengenai direktori mahasiswa terintegrasi Makassar & Gowa.
     - Search & Filter Box terpadu (Input pencarian kampus/jalan/nama kost, dropdown kota, dropdown sortir, dan tombol aksi filter oranye).
     - 4 Feature Stats Pills: `6 Area Utama Kampus`, `1.200+ Kost Terdata Valid`, `100% Survey GPS & Lapangan`, `Format XLSX Siap Unduh`.
  2. **Wilayah Filter Bar**:
     - Baris filter horizontal dengan label `WILAYAH:` dan opsi pill: `[ Semua Area ]`, `[ Makassar ]`, `[ Gowa (Samata & Bontomarannu) ]`, `[ Maros ]`, serta dropdown kampus.
  3. **Katalog Area Direktori (Campus Cluster Grid)**:
     - Judul seksian: `KATALOG AREA DIREKTORI` `[ 6 Klaster Kampus ]` dengan status `🟢 Semua data terverifikasi`.
     - Kartu Klaster Kampus Modern:
       - Header terfavorit untuk area terpadat (misal: *UNHAS Tamalanrea* dengan pita banner *⭐ AREA TERFAVORIT & TERPADAT | 346+ KOST*).
       - Badge kota (`KOTA MAKASSAR`, `KABUPATEN GOWA`) & badge `Update 2025/2026`.
       - Nama kampus dan keterangan area spesifik.
       - Metrik kepadatan data kost dengan progress bar oranye dan rentang biaya sewa rata-rata.
       - Tag highlight area (misal: *Dekat Gerbang FT*, *Bebas Jam Malam*).
       - Tombol aksi ganda: `[ 👁️ DETAIL LISTING ]` (Dark) & `[ 📥 XLS ]` (Orange - Direct Buy/Download).
  4. **Sample Preview Struktur Data Excel (.xlsx)**:
     - Kartu interaktif cuplikan data spreadsheet enumerator riil.
     - Tabel representatif: `NAMA KOST`, `AREA KAMPUS`, `FASILITAS KOST`, `TIPE KAMAR`, `KONTAK PEMILIK (WA)`.
     - Catatan keterbukaan transparansi data 1.200+ kontak WhatsApp & titik koordinat GPS.
  5. **Keunggulan Database Kost RuangSinggah**:
     - 4 Kartu keunggulan: *Verifikasi Lapangan*, *Kontak Pemilik Langsung*, *Jarak & Navigasi Titik GPS*, dan *File Excel Siap Pakai*.
  6. **Integritas Fungsionalitas Penuh**:
     - Mempertahankan seluruh flow routing, auth check, modal detail produk, checkout invoice modal (`InvoiceModal`), integrasi payment gateway (`PaymentGateway`), serta email deep link handling (`order_id`).
     - Pure bundled SVG dari `lucide-react` (0 FOUT).

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/Products.tsx` (Perombakan layout UI visual, penambahan komponen katalog klaster kampus, preview spreadsheet table, dan keunggulan direktori)

---

## 3. Langkah-Langkah Eksekusi
1. **Penyelarasan Data Klaster Kampus & Fallback**:
   - Menghubungkan data `dbList` Supabase dengan parser metrik klaster kampus (kepadatan kost, rentang harga, tags area, dan status terfavorit).
2. **Penyusunan UI Seksian Hero & Search Bar**:
   - Membangun Hero Header modern, search input terpadu, dropdown filter kota/sortir, dan 4 feature stats pills.
3. **Penyusunan Wilayah Filter Bar**:
   - Mengintegrasikan filter cepat wilayah `Semua Area`, `Makassar`, `Gowa`, `Maros`, dan dropdown kampus.
4. **Penyusunan Grid Kartu Klaster Area Direktori**:
   - Membangun kartu klaster kampus dengan badge kota, progress bar kepadatan unit, rentang biaya rata-rata, tags fitur, serta tombol `DETAIL LISTING` dan `XLS`.
5. **Penyusunan Seksian Sample Preview Spreadsheet Excel**:
   - Membangun tabel preview cuplikan spreadsheet XLSX berdesain rapi dengan badge validasi 100%.
6. **Penyusunan Seksian 4 Keunggulan Directory**:
   - Membangun 4 kartu keunggulan berikon vector `lucide-react`.
7. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
8. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 301 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman `/products` di browser dan memverifikasi kesesuaian visual dengan screenshot referensi:
  - Hero header, search bar terpadu, dan 4 stats pills tampil rapi.
  - Filter wilayah berfungsi memfilter katalog kampus secara instan.
  - Kartu katalog kampus menampilkan metrik kepadatan unit dan tombol aksi ganda.
  - Tabel preview spreadsheet dan 4 kartu keunggulan tampil sempurna.
  - Menguji tombol `DETAIL LISTING` dan `XLS` untuk memastikan modal detail dan flow checkout berjalan normal.
