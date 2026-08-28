# IMPLEMENTATION PLAN: Penerapan Mekanisme Input Form Pendataan Agen Survei pada Editor Properti Portal KostManager

## 📌 Analisis Masalah & Kebutuhan

### 1. Konteks & Permintaan Pengguna
Pengguna menyampaikan permintaan lanjutan:
> *"meskipun secara tampilan memakai tampilan yang mirip dengan peninjauan hasi pendataan, tapi bisa nggak sistem input atau sistem mekanisme inputnya saat pengeditan sama dengan form pendataan dari agen survey"*

Secara visual, antarmuka modal editor properti di Portal KostManager (`KostManagerPortal.tsx`) saat ini sudah mengadopsi tata letak yang menyerupai modal peninjauan hasil survei (Hero Slider, KPI Glance Cards, Accordion Tipe Kamar, Card Kamar Terisi Amber, Card Kamar Kosong Emerald, dsb). 

Namun, **mekanisme input saat pengeditan** masih menggunakan input sederhana/terbatas, belum memiliki kecanggihan dan struktur kendali yang ada pada **Form Pendataan Agen Survei Lapangan** (`AgentDashboard.tsx`), seperti:
1. **Input Dimensi Kamar Presisi**: Masih berupa string bebas, belum berupa kotak input terpisah `[Panjang] X [Lebar] meter`.
2. **Kendali Fasilitas Kamar & Sub-Fasilitas Context-Aware**:
   - Belum ada toggle cepat mode **`[ Kosongan (Tanpa Perabot) ]`** vs **`[ Furnished (Isian) ]`** yang otomatis mematikan/menonaktifkan checklist perabot.
   - Belum ada sub-checklist kontekstual otomatis saat fasilitas tertentu dicentang (misal: saat `Kamar Mandi Dalam` dicentang, otomatis muncul sub-item `Kloset Duduk`, `Kloset Jongkok`, `Shower`, `Wastafel` + custom adder; saat `Dapur Dalam` dicentang, otomatis muncul `Kompor`, `Kulkas`, `Wastafel Cuci Piring`, dsb).
   - Belum ada input custom facility adder dengan tag badge yang bisa dihapus.
3. **Skema Tarif / Harga Kamar Multi-Periode Dinamis**:
   - Belum mendukung daftar skema harga multi-periode (`Bulanan`, `3 Bulan`, `6 Bulan`, `Tahunan`) dengan separator ribuan otomatis (`formatThousand`), input Maksimal Penghuni, dan Biaya Tambahan Orang.
4. **Biaya Tambahan Bulanan Lainnya**:
   - Belum ada input nominal biaya tambahan bulanan (Rp/Bulan) serta checklist cakupannya (`Listrik`, `Air`, `Sampah`, `Wifi`, `Keamanan/Parkir`).
5. **Dokumentasi Foto Kamar per Kategori Dinamis (`computeDynamicRoomPhotoCategories`)**:
   - Pada form survei agen, slot upload foto kamar dibuat spesifik per-kategori fasilitas yang dicentang (`Interior Kamar`, `Kamar Mandi`, `Tempat Tidur`, `Lemari / Storage`, `Meja Belajar`, `AC`, `Jendela Luar`, dsb). Hal ini menjamin setiap fasilitas memiliki bukti foto yang sesuai dan terorganisir.
6. **Fasilitas Umum Context-Aware di Tab 1**:
   - Checkbox fasilitas umum dengan sub-kelengkapan dinamis untuk `Dapur Bersama`, `Area Parkir` (Motor, Mobil, Sepeda), dan `WC Umum`.

---

## 🎯 Tujuan Pengembangan
Mengintegrasikan seluruh sistem kendali dan mekanisme input dari Form Pendataan Agen Survei (`AgentDashboard.tsx`) ke dalam Modal Editor Properti di Portal KostManager (`KostManagerPortal.tsx`), dengan tetap mempertahankan estetika tampilan peninjauan survei (layout bersih, preview elegan, dan responsive).

---

## 📂 Dampak Perubahan (File yang Disentuh)
1. `functions/public/components/admin/KostManagerPortal.tsx`:
   - Penambahan fungsi pembantu parser dan formater: `parseDimensionParts`, `formatThousand`, `parseThousand`, `computeDynamicRoomPhotoCategories`, `getRoomCategorizedPhotos`, `exportCategorizedPhotos`.
   - Penyempurnaan mekanisme input Tab 1: Fasilitas Umum kontekstual dengan sub-kelengkapan parkir, dapur, dan WC umum.
   - Penyempurnaan mekanisme input Tab 2: Detail Kamar & Tipe Kamar dengan input dimensi terpisah `[P] X [L] meter`, dropdown Lantai & Tipe Kamar, toggle Kosongan vs Furnished, sub-kelengkapan Kamar Mandi Dalam & Dapur Dalam, skema tarif multi-periode, biaya tambahan, serta slot upload foto kamar per kategori berlabel dinamis.
2. `functions/PROGRESS.md`: Pencatatan histori progres (FASE 2).
3. `WALKTHROUGH.md`: Panduan pengujian user dan laporan hasil verifikasi (FASE 2).

---

## 🛠️ Langkah-Langkah Eksekusi (Incremental Execution)

### Langkah 1: Helper Functions & Engine Kategori Foto Dinamis
- Menambahkan fungsi pembantu dari `AgentDashboard.tsx` ke dalam `KostManagerPortal.tsx`:
  - `parseDimensionParts(dimStr)`: Memisahkan string ukuran (misal `"3x4 meter"`) menjadi `{ length: '3', width: '4' }`.
  - `formatThousand(val)` dan `parseThousand(str)`: Memformat angka ke format rupiah ribuan (misal `1.500.000`) saat diketik.
  - `computeDynamicRoomPhotoCategories(facilities, status, customKeys)`: Menghitung kategori foto kamar yang wajib/relevan berdasarkan fasilitas yang dicentang.
  - `getRoomCategorizedPhotos(room)` dan `exportCategorizedPhotos(categorized)`: Menjaga konsistensi data foto berlabel dalam struktur `categorizedPhotos` dan `images`.

### Langkah 2: Mekanisme Input Tab 1 (Fasilitas Umum Kontekstual)
- Mengganti checklist fasilitas umum dengan mekanisme context-aware dari survei:
  - Checkbox fasilitas umum (`WiFi`, `Dapur Bersama`, `Area Parkir`, `Ruang Tamu`, `CCTV`, `Laundry`, `WC Umum`).
  - Ketika `Area Parkir` aktif -> menampilkan sub-kelengkapan: `Parkir Motor`, `Parkir Mobil`, `Parkir Sepeda` + custom parking adder.
  - Ketika `Dapur Bersama` aktif -> menampilkan sub-kelengkapan: `Kompor`, `Kulkas`, `Dispenser`, `Wastafel Cuci Piring`, `Peralatan Masak`, `Meja Makan` + custom kitchen adder.
  - Ketika `WC Umum` aktif -> menampilkan sub-kelengkapan: `Kloset Duduk`, `Kloset Jongkok`, `Shower`, `Wastafel` + custom bathroom adder.

### Langkah 3: Mekanisme Input Tab 2 (Detail Kamar & Fasilitas Kamar Kontekstual)
- Pada kartu pengeditan kamar (baik Kamar Terisi maupun Kamar Kosong):
  - **Dimensi Kamar**: Input terpisah `[Panjang]` X `[Lebar]` `meter` yang otomatis memperbarui properti `size` dan `dimensions`.
  - **Pilihan Lantai & Tipe**: Dropdown `Lantai` (`Lantai 1`, `Lantai 2`, dst.) dan `Tipe Kamar` (`Standard`, `Premium`, `Deluxe`, `Kustom`).
  - **Status Kamar**: Tombol toggle `[ Terisi ]` vs `[ Kosong ]` dengan warna kontras hijau/oranye.
  - **Skema Harga Dinamis**:
    - Tombol `+ Tambah Skema Harga`.
    - Pilihan periode (`Bulanan`, `3 Bulan`, `6 Bulan`, `Tahunan`, `Mingguan`, `Harian`) + Input harga Rp dengan format ribuan.
    - Input `Maks. Penghuni per Kamar` & `Biaya Tambahan Orang (Rp/Bulan)`.
  - **Fasilitas Kamar & Sub-Fasilitas**:
    - Tombol toggle: **`[ Kosongan (Tanpa Perabot) ]`** vs **`[ Furnished (Isian) ]`**.
    - Checkbox fasilitas standar: `Kasur`, `Lemari`, `Meja Belajar`, `AC`, `Kipas Angin`, `Water Heater`, `Jendela Luar`, `Kamar Mandi Dalam`, `Dapur Dalam`.
    - Sub-kelengkapan `Kamar Mandi Dalam`: `Kloset Duduk`, `Kloset Jongkok`, `Shower`, `Wastafel` + custom adder.
    - Sub-kelengkapan `Dapur Dalam`: `Kompor`, `Kulkas`, `Wastafel Cuci Piring`, `Kitchen Set`, `Dispenser` + custom adder.
    - Custom facility adder input dengan chip tag yang bisa dihapus.
  - **Biaya Tambahan Bulanan Lainnya**:
    - Nominal (Rp/Bulan) + Checklist cakupan: `Listrik`, `Air`, `Sampah`, `Wifi`, `Keamanan/Parkir`.
  - **Dokumentasi Foto Kamar per Kategori Dinamis**:
    - Menghadirkan slot upload foto terpisah untuk setiap kategori fasilitas aktif (`Interior Kamar`, `Kamar Mandi`, `Tempat Tidur`, `Lemari / Storage`, `Meja Belajar`, `AC`, `Jendela Luar`, dsb).
    - Tombol upload per-kategori dengan kompresi WebP client-side otomatis.
    - Tombol tambah kategori foto kamar kustom.
  - **Data Penghuni Terisi**:
    - Nama Penghuni, Nomor HP/WhatsApp (dengan tombol chat WA), Jenis Langganan / Periode, Tanggal Mulai Sewa, dan Tanggal Jatuh Tempo.

### Langkah 4: Validasi & Kompilasi
- Menjalankan `npm.cmd run build` di `functions/public/` untuk memastikan tidak ada error TypeScript maupun bundling.
- Memverifikasi penyimpanan data payload kamar ke Supabase agar tetap kompatibel 100% dengan skema data yang ada.

---

## 🧪 Rencana Verifikasi & Pengujian
1. **Kompilasi TypeScript**: Memastikan `npm.cmd run build` lulus dengan exit code 0.
2. **Verifikasi Visual & Interaksi di Browser**:
   - Buka modal edit Kost Madani di Portal KostManager.
   - Periksa Tab 1: Coba centang/uncentang *Area Parkir* atau *Dapur Bersama* dan pastikan sub-kelengkapan muncul kontekstual.
   - Periksa Tab 2:
     - Ubah ukuran kamar menggunakan input `[Panjang]` X `[Lebar]` meter.
     - Klik toggle `[ Kosongan (Tanpa Perabot) ]` -> periksa checklist perabot dinonaktifkan secara otomatis.
     - Centang `Kamar Mandi Dalam` -> periksa sub-checklist Kloset, Shower, Wastafel muncul dan dapat dicentang.
     - Tambah skema harga (misal Tahunan) dan cek format rupiah ribuan.
     - Periksa slot foto kamar: pastikan muncul slot upload per-kategori (`Tempat Tidur`, `Kamar Mandi`, dsb).
     - Coba unggah foto dan pastikan terkompresi otomatis ke WebP.
     - Simpan properti dan pastikan data tersimpan sempurna tanpa error.

---

> [!IMPORTANT]
> **Protokol Siklus Kerja 2-Fase**: Saat ini Agent berada pada **FASE 1 (Perencanaan & Pengajuan)**. Agent **berhenti di sini** dan menunggu persetujuan (*Proceed / ACC*) dari Pengguna sebelum melakukan modifikasi kode pada FASE 2.
