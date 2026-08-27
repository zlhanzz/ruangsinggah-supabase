# PROGRESS - RuangSinggah Development

## Fitur Selesai (Completed Features)

### 96. Penghapusan Card Deskripsi & Profil Kost pada Modal Peninjauan (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menyampaikan bahwa card *"DESKRIPSI & PROFIL KOST"* tidak perlu ada karena pada formulir pendataan KostManager di Dashboard Agen tidak terdapat input pengisian deskripsi kost.
  2. Menampilkan card fallback *"Tidak ada deskripsi rinci dari agen."* tidak relevan dan membuat tata letak kurang ringkas.
- **Implementasi & Perbaikan**:
  * **1. Pembersihan Card Deskripsi**:
    - Menghapus blok JSX card *"Deskripsi & Profil Kost"* dari Tab 1 (Data Properti Umum).
    - Menjadikan alur tampilan Tab 1 lebih bersih, langsung dari Hero Carousel & Fasilitas Umum ke Alamat & Peta GPS.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 95. Pembaharuan Aturan Baku: Wajib Git Push ke Branch Non-Production (`bukan-productions`) Setiap Selesai Progres (`AGENTS.md`, `GEMINI.md`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta penambahan aturan baku baru pada workspace rules agar setiap progres/fitur yang berhasil diselesaikan langsung di-push ke repository GitHub pada branch non-production (`bukan-productions`), untuk mencegah kehilangan progres dan menjaga backup awan selalu mutakhir.
  2. Agent tetap dilarang keras melakukan push langsung ke branch `main` atau deploy ke server production.
- **Implementasi & Perbaikan**:
  * **1. Pembaruan Dokumen Aturan Baku**:
    - Memperbarui Section 7 pada [`AGENTS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/AGENTS.md) dan [`GEMINI.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/GEMINI.md) menjadi *"7. Kebijakan Git Push Otomatis & Larangan Push ke Branch Main / Production"*.
    - Mewajibkan setiap agent melakukan git commit & git push ke remote branch `bukan-productions` setiap kali Fase 2 (eksekusi & build) selesai.
  * **2. Eksekusi Git Push**:
    - Seluruh perubahan pekerjaan sebelumnya (termasuk fitur #92, #93, #94) telah berhasil di-stage, di-commit, dan di-push langsung ke branch `bukan-productions` pada GitHub (`https://github.com/zlhanzz/ruangsinggah-supabase.git`).
- **File Tersentuh**: `AGENTS.md`, `GEMINI.md`, `functions/PROGRESS.md`
- **Verifikasi**: Perintah `git push origin bukan-productions` berhasil dieksekusi dengan status `bukan-productions -> bukan-productions` (Exit code 0).

### 94. Tampilan Caption Lengkap pada Thumbnail & Slide Hero Carousel (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar setiap foto pada carousel ditampilkan caption keterangannya secara lengkap dan jelas.
  2. Sebelumnya thumbnail di bawah carousel hanya berupa gambar kecil tanpa teks nama kategori foto.
- **Implementasi & Perbaikan**:
  * **1. Thumbnail Strip dengan Caption Lengkap**:
    - Memperbarui layout thumbnail menjadi kartu preview interaktif yang menampilkan gambar preview beresolusi baik, nomor urut foto (`#1`, `#2`, dll.), dan **teks caption nama kategori foto secara utuh** (*Bangunan Depan*, *Area Parkir*, *Koridor*, *Lingkungan*, *WC Umum*, *Dapur Bersama*, dll.) di bawah setiap gambar.
    - Highlight teks dan border `emerald-300` / `emerald-400` saat thumbnail aktif terpilih.
  * **2. Caption Bar Bawah pada Slide Utama**:
    - Menambahkan caption bar bergradasi gelap di bagian bawah slide utama dengan nama kategori foto berukuran tebal dan kontras tinggi (`Kategori Foto Dokumentasi #N` dan judul kategori foto).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 93. Sinkronisasi Interaktif 2-Arah Fasilitas Umum ➔ Hero Carousel & Smart Sub-Input Detection (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta kartu fasilitas umum terhubung secara interaktif dua arah dengan Hero Carousel Foto Properti (mengeklik kartu fasilitas langsung meluncurkan slide carousel ke foto fasilitas tersebut).
  2. Pengguna meminta sistem mendeteksi secara cerdas jika memang sub-input belum diisi (khusus fasilitas yang wajib sub-input seperti Area Parkir) dengan badge peringatan elegan, namun jika terisi, menampilkan sub-fasilitas dengan desain interaktif dan keren.
- **Implementasi & Perbaikan**:
  * **1. Two-Way Hero Carousel Synchronization**:
    - Memasang helper pencari index foto `getFacilityPhotoIndex` berbasis multi-keyword (*parkir*, *wc/toilet*, *dapur*, *wifi*, *ruang tamu*, *cctv*, *laundry*).
    - Event klik pada kartu fasilitas secara instan meluncurkan slide Hero Carousel ke foto dokumentasi terkait (`setSelectedHeroPhotoIndex(photoIndex)`).
    - **Active Glow & Indicator**: Jika slide carousel sedang menampilkan foto fasilitas tersebut, kartu fasilitas otomatis menyala aktif (`ring-4 ring-emerald-500/10 border-2 border-emerald-500 bg-emerald-50/90` dan badge berkedip `[📸 FOTO AKTIF]`).
    - Menambahkan subtitle interaktif `📸 Lihat Foto di Slider` / `📸 Sedang Ditampilkan di Slider`.
  * **2. Smart Sub-Input Detection**:
    - Mengevaluasi sub-input secara spesifik hanya pada fasilitas yang memiliki skema sub-input (misal: *Area Parkir* yang membaca `publicParkingFacilities`: Motor, Mobil, Sepeda).
    - **Jika terisi**: Menampilkan sub-chips interaktif lengkap dengan icon kendaraan (🏍️, 🚗, 🚲).
    - **Jika belum terisi (khusus fasilitas wajib)**: Menampilkan badge peringatan halus `[⚠️ RINCIAN KOSONG]` dan teks keterangan *"Jenis fasilitas parkir belum dispesifikasikan oleh surveyor saat pendataan."*.
    - **Fasilitas tanpa sub-input (*WiFi*, *WC Umum*, *Dapur*, *CCTV*, *Laundry*, *Ruang Tamu*)**: Tampil bersih dan aktif dengan badge hijau `[✓ AKTIF]`.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 92. Penyederhanaan Tampilan Fasilitas Umum Kost & Pembersihan Peringatan Evaluasi Data (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menyampaikan bahwa tidak semua fasilitas umum memiliki sub-input/rincian karena formulir pendataan tidak mewajibkannya.
  2. Evaluasi kelengkapan data yang memunculkan kotak merah `[SUB-DATA KOSONG]` dan teks peringatan tidak diperlukan dan mengganggu kenyamanan visual.
- **Implementasi & Perbaikan**:
  * **1. Pembersihan Status Peringatan Merah**:
    - Menghapus badge `[SUB-DATA KOSONG]`, latar merah `bg-red-50`, border merah `border-red-200`, dan teks evaluasi kelengkapan data.
  * **2. Penyeragaman Kartu Fasilitas Aktif Bersih**:
    - Seluruh fasilitas umum dirender dengan kartu bersih `bg-slate-50 border-slate-200/80` yang dilengkapi icon vektor `lucide-react`, judul fasilitas, dan badge hijau `[✓ AKTIF]`.
    - Jika fasilitas memiliki sub-data rincian (`hasSubData`), chip rincian tetap ditampilkan rapi di bagian bawah kartu.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 91. Pemulihan Total UI/UX Peninjauan KostManager dari Git Commit Stabil (`6494107`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Seluruh UI/UX Modal Peninjauan Hasil Pendataan KostManager di Dashboard Admin ter-reset total akibat serangkaian perombakan tidak disengaja oleh agent selama sesi ini.
  2. Pengguna meminta pemulihan ke kondisi Fitur #83 (titik terbaik sebelum kekacauan).
- **Implementasi & Perbaikan**:
  * **Restorasi dari Git**: Menjalankan `git checkout 6494107 -- "functions/public/components/admin/KostManagerManagement.tsx"` untuk mengembalikan file tepat ke kondisi commit terakhir yang stabil, yang mencakup seluruh fitur dari #70 s/d #83:
    - Hero Carousel Foto Properti (Tab 1) dengan thumbnail strip & label kategori.
    - Kartu Fasilitas Umum Kategoris: Card Aktif `[✓ AKTIF]` & Card Alert `[! SUB-DATA KOSONG]`.
    - Hero Carousel Foto Kamar (Tab 2) dengan card overlay mengambang (Tarif, Ukuran, Badge Fasilitas).
    - 3 Kotak Fasilitas Kamar Menyamping (Fasilitas Utama / Kamar Mandi WC / Dapur Dalam).
    - Grid Dokumentasi Foto Kamar dengan bar overlay label di bawah gambar.
    - Nested Accordion Tipe Kamar: Card Kuning Terisi `🔒 KAMAR SEDANG DIHUNI / TERISI` & Card Hijau Kosong `✨ KAMAR KOSONG / SIAP HUNI` + tombol `BUKA LIST ▾`.
    - Smart Room Name Formatter `"Kamar X"`.
    - Strip Baris Atas: `MITRA PEMILIK: [nama] [WhatsApp]` | `SURVEYOR LAPANGAN: [nama]` | `[↗ BERKAS GDRIVE]`.
    - 3 Tab Utama: `🏢 1. DATA PROPERTI UMUM [N FOTO]` | `🛏️ 2. DATA KAMAR & PENGHUNI [N TIPE]` | `🛡️ 3. DATA MITRA & KERJASAMA`.
  * **Penambahan Impor `lucide-react`**: Menambahkan statement impor komponen ikon SVG (`FolderOpen`, `Building2`, `Bed`, `ShieldCheck`, `Camera`, `ChevronLeft`, `ChevronRight`, `Bath`, `CookingPot`, `ChevronUp`, `ChevronDown`, `ParkingCircle`, `Sparkles`, `AlertCircle`, `Check`, `ZoomIn`, `Layers`) agar tidak ada `ReferenceError` di browser.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus ✓ dengan `2526 modules transformed` dalam `30.64s`.

### 90. Pemasangan Impor Ikon Vector `lucide-react` (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Terjadi runtime error `Uncaught ReferenceError: FolderOpen is not defined` di browser saat membuka modal peninjauan.
- **Implementasi & Perbaikan**:
  * Menambahkan statement impor `lucide-react` secara native di bagian atas [`KostManagerManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx) (`FolderOpen`, `Building2`, `Bed`, `ShieldCheck`, `Camera`, `ChevronLeft`, `ChevronRight`, `Bath`, `CookingPot`, `ChevronUp`, `ChevronDown`, `ParkingCircle`, `Sparkles`, `AlertCircle`, `Check`, `ZoomIn`, `Layers`).
  * Menjamin 100% ter-bundle di dalam JavaScript lokal tanpa FOUT atau delay koneksi eksternal.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 89. Pemulihan Utuh 100% Antarmuka Modal Peninjauan Berdasarkan 4 Screenshot Asli (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna memberikan 4 bukti screenshot asli antarmuka peninjauan KostManager yang pernah dibangun dan meminta pemulihan 100% presisi sesuai screenshot tersebut.
- **Implementasi & Perbaikan**:
  * **1. Strip Baris Atas & 3 Tab Utama (Screenshot 3 & 4)**:
    - Baris Atas: `MITRA PEMILIK: [nama] [WhatsApp]` | `SURVEYOR LAPANGAN: [nama]` | `[↗ BERKAS GDRIVE]`.
    - Tab Utama: `🏢 1. DATA PROPERTI UMUM [N FOTO]` | `🛏️ 2. DATA KAMAR & PENGHUNI [N TIPE]` | `🛡️ 3. DATA MITRA & KERJASAMA`.
  * **2. Tab 1: Data Properti Umum (Screenshot 4)**:
    - Main Carousel Foto Properti & Thumbnail Strip (`Bangunan Depan`, `Koridor`, `Lingkungan`, `Area Parkir`, `WC Umum`, `Foto Lainnya`).
    - Kartu Fasilitas Umum `AREA PARKIR [✓ AKTIF]` & Kartu Merah Alert `WC UMUM [! SUB-DATA KOSONG]` (*"Induk fasilitas terdaftar, namun rincian spesifik tidak diisi oleh agen survey saat pendataan."*).
  * **3. Tab 2: Data Kamar & Penghuni (Screenshot 1, 2, & 3)**:
    - **Hero Carousel Foto Kamar (Screenshot 3)**: Slider foto kamar dengan card overlay mengambang di kiri bawah (`Nomor Kamar`, `Ukuran & Lantai`, `TARIF Rp X/bln`, badge fasilitas) & thumbnail strip penomoran kamar.
    - **KELENGKAPAN & FASILITAS KAMAR (Screenshot 1)**: 3 Kotak Kategori Fasilitas Kamar Menyamping:
      - 🛏️ **FASILITAS UTAMA** (Slate Card): `Jendela Luar`, `Kamar Mandi Dalam`, `Dapur Dalam`, `Kasur`.
      - 🚿 **KAMAR MANDI / WC** (Ice Blue Card): `Kloset Duduk`.
      - 🍳 **DAPUR DALAM** (Warm Amber/Kuning Card): `Kompor`, `Kulkas`, `Wastafel Cuci Piring`, `Kitchen Set`, `Dispenser`.
    - **DOKUMENTASI FOTO KAMAR (N) (Screenshot 1)**: Grid thumbnail foto kamar dengan bar overlay gelap di bagian bawah (`JENDELA LUAR`, `INTERIOR KAMAR "WAJIB"`, `KAMAR MANDI`, `DAPUR DALAM`, `TEMPAT TIDUR`).
    - **NESTED ACCORDION TIPE KAMAR (Screenshot 2)**: Header Tipe Kamar + Card Kuning/Amber `🔒 KAMAR SEDANG DIHUNI / TERISI [2 UNIT]` (`BUKA LIST v`) & Card Hijau `✨ KAMAR KOSONG / SIAP HUNI [3 UNIT]` (`BUKA LIST v`).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 88. Pemulihan Penuh Fasilitas Terpadu & Galeri Carousel Interaktif Dua Arah (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta pemulihan fitur terbaik di mana kartu fasilitas dan galeri carousel foto pada Tab 1 (Data Properti Umum) dan Tab 2 (Data Kamar & Penghuni) saling terhubung secara interaktif dan dinamis.
- **Implementasi & Perbaikan**:
  * **1. Tab 1: Fasilitas Umum Terpadu Tersinkronisasi Dua Arah (`Klik Fasilitas ➔ Jump Foto Carousel`)**:
    - Memasang listener klik pada kartu fasilitas publik (*Area Parkir*, *Dapur*, *WC Umum*, *WiFi*, dll.). Mengeklik kartu fasilitas secara otomatis **meluncurkan (*scroll & jump*)** carousel foto utama properti ke gambar fasilitas terkait.
    - Saat carousel berpindah, kartu fasilitas yang sesuai secara otomatis menyala (*Active Glow* `ring-2 ring-emerald-500 bg-emerald-50/90` & badge *"FOTO AKTIF"*).
  * **2. Tab 2: Galeri Carousel Terisolasi Per Unit Kamar & Synced Room Facilities**:
    - Menyediakan barisan **Tombol Selektor Unit Kamar Kosong** (`🚪 Kamar 3`, `🚪 Kamar 4`, `🚪 Kamar 5`) yang mengisolasi galeri foto per unit kamar.
    - Kartu fasilitas kamar (*Kasur*, *AC*, *Kloset Duduk*, *Dapur Dalam*) tersinkronisasi interaktif dengan carousel foto kamar.
  * **3. Pemasangan Ikon Vector & State Management**:
    - Diimpor secara native dari package `lucide-react` (`FolderOpen`, `ParkingCircle`, `Sparkles`, `AlertCircle`, `Check`, `ZoomIn`, `Layers`, `Building2`, `Bed`, `ShieldCheck`, `Camera`, `ChevronLeft`, `ChevronRight`, `Bath`, `CookingPot`, `ChevronUp`, `ChevronDown`).
    - Menyediakan state variable `currentPropertyPhotoIndex` untuk mengontrol posisi slide carousel secara real-time.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 87. Pemulihan Utuh Unifikasi Modal Peninjauan 3-Tab Modern (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Terjadi pembatalan sementara (*revert*) yang membuat antarmuka Modal Peninjauan KostManager sempat kembali ke versi 4-tab legacy.
  2. Pengguna meminta agar seluruh kemajuan dan progres fitur yang pernah dicapai (Unifikasi 3-Tab Modern: Data Properti Umum, Data Kamar & Penghuni, Data Mitra & Kerjasama) dipulihkan 100% secara utuh.
- **Implementasi & Perbaikan**:
  * **1. Pemulihan Modal 3-Tab Modern**:
    - **Tab 1: 1. DATA PROPERTI UMUM** (Ikon `<Building2 />` - Badge `N FOTO`): Menampilkan Hero Carousel Galeri Foto Utama Properti (Simulasi Tampilan Pengguna Publik) di paling atas, deskripsi kost, titik koordinat GPS & preview embed interactive Google Maps, landmark kampus terdekat, kelompok fasilitas umum, dan peraturan kost.
    - **Tab 2: 2. DATA KAMAR & PENGHUNI** (Ikon `<Bed />` - Badge `N TIPE`): Menampilkan peninjauan kamar terstruktur berbasis Nested Accordion (Grup Tipe Kamar ➔ Sub-Accordion Kosong/Siap Huni & Terisi ➔ Kartu Detail Kamar Individual lengkap dengan foto kamar, harga sewa, ketersediaan unit, ukuran kamar, serta 3 kategori fasilitas kamar).
    - **Tab 3: 3. DATA MITRA & KERJASAMA** (Ikon `<ShieldCheck />` - Badge `TERVERIFIKASI` / `LENGKAP`): Menampilkan profil pemilik/mitra, kontak WhatsApp, email, rekening bank pencairan mitra, status legalitas surat kerjasama auto-pilot, serta tombol akses berkas Google Drive.
  * **2. Pengintegrasian Ikon Vector SVG & State Variables**:
    - Impor lengkap dari package `lucide-react` (`FolderOpen`, `Building2`, `Bed`, `ShieldCheck`, `Camera`, `ChevronLeft`, `ChevronRight`, `Bath`, `CookingPot`, `ChevronUp`, `ChevronDown`).
    - Pendeklarasian `selectedHeroPhotoIndex`, `selectedRoomTypeIndex`, `selectedIsolatedPhotoIndex`, `selectedRoomNumber`, `expandedRoomTypes`, dan `expandedStatusSections`.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 86. Perbaikan Runtime ReferenceErrors & Impor Ikon Vector Lucide-React (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Terjadi console runtime error `Uncaught ReferenceError: FolderOpen is not defined` saat membuka modal peninjauan admin.
  2. Terjadi console runtime error `Uncaught ReferenceError: setSelectedHeroPhotoIndex is not defined` saat fungsi `openReviewModal` mengeksekusi reset indeks carousel foto.
- **Implementasi & Perbaikan**:
  * **1. Impor Vektor SVG Lucide-React**:
    - Mengimpor seluruh komponen ikon vektor SVG murni dari `lucide-react` (`FolderOpen`, `Building2`, `Bed`, `ShieldCheck`, `Camera`, `ChevronLeft`, `ChevronRight`, `Bath`, `CookingPot`, `ChevronUp`, `ChevronDown`).
    - Menjamin **0ms delay**, **0 network request CDN**, dan 100% bebas dari FOUT/kedipan teks ligature.
  * **2. Pendeklarasian Carousel State Variables**:
    - Menginisialisasi 4 state variables penahan indeks carousel foto dan unit kamar terpilih:
      - `selectedHeroPhotoIndex`
      - `selectedRoomTypeIndex`
      - `selectedIsolatedPhotoIndex`
      - `selectedRoomNumber`
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 85. Restrukturisasi Unifikasi Modal Peninjauan 3-Tab Modern (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mempertanyakan tampilan peninjauan hasil pendataan di Dashboard Admin kembali ke versi lama yang tidak memiliki struktur 3-Tab modern (Data Properti Umum, Data Kamar & Penghuni, Data Mitra & Kerjasama).
  2. Pengguna meminta seluruh pencapaian pengembangan web sebelumnya (seperti Hero Carousel foto utama properti, galeri terisolasi per kamar, nested accordion, dan otorisasi pemasaran) dipulihkan ke versi terjauh yang pernah dicapai.
- **Implementasi & Perbaikan**:
  * **1. Restrukturisasi Unifikasi Modal Peninjauan 3-Tab Modern**:
    - **Tab 1: 1. DATA PROPERTI UMUM** (Ikon `<Building2 />` - Badge `N FOTO`): Menampilkan Hero Carousel Galeri Foto Utama Properti (Simulasi Tampilan Pengguna Publik) lengkap dengan badge kategori foto, penunjuk angka `1 / N FOTO`, tombol navigasi panah kiri/kanan `<ChevronLeft />` / `<ChevronRight />`, thumbnail navigation strip, deskripsi kost, titik koordinat GPS & preview embed Google Maps, landmark kampus terdekat, fasilitas umum, dan peraturan kost.
    - **Tab 2: 2. DATA KAMAR & PENGHUNI** (Ikon `<Bed />` - Badge `N TIPE`): Menampilkan peninjauan kamar terstruktur berbasis Nested Accordion (Grup Tipe Kamar ➔ Sub-Accordion Kosong/Siap Huni & Terisi ➔ Kartu Detail Kamar Individual lengkap dengan foto kamar, harga sewa, ketersediaan unit, ukuran kamar, serta 3 kategori fasilitas kamar).
    - **Tab 3: 3. DATA MITRA & KERJASAMA** (Ikon `<ShieldCheck />` - Badge `TERVERIFIKASI` / `LENGKAP`): Menampilkan profil pemilik/mitra, kontak WhatsApp, email, rekening bank pencairan mitra, status legalitas surat kerjasama auto-pilot, serta tombol akses berkas Google Drive.
  * **2. Perbaikan Sintaks Tree Closure & Kelulusan Kompilasi**:
    - Merapikan struktur pembuka/penutup JSX container dan meletakkan penutup modal pada posisi presisi di dalam lingkup komponen.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 84. Redesain Visual Fasilitas Kamar Berbasis Kategori Grouping Modern (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Fasilitas utama, sub-fasilitas WC, dan sub-fasilitas dapur ditampilkan bercampur aduk dalam 1 deret flex-wrap horizontal tanpa pemisah hierarki visual.
  2. Terdapat awalan teks debug mentah yang kaku seperti `"WC: Kloset Duduk"`, `"Dapur: Kompor"`, `"Dapur: Kulkas"`.
- **Implementasi & Perbaikan**:
  * **1. Categorized Grouping Card Grid (3 Kelompok Kategori)**:
    - **🛌 Group 1: Fasilitas Utama Kamar** (Ikon `<Bed />` - Tema Slate): Menampilkan `Kasur`, `Jendela Luar`, `AC`, dll.
    - **🚿 Group 2: Kamar Mandi Dalam / WC** (Ikon `<Bath />` - Tema Ice Blue): Menampilkan item WC bersih tanpa awalan `"WC: "` (misal: `Kloset Duduk`, `Shower`, `Water Heater`).
    - **🍳 Group 3: Dapur Dalam Kamar** (Ikon `<CookingPot />` - Tema Warm Amber): Menampilkan item Dapur bersih tanpa awalan `"Dapur: "` (misal: `Kompor`, `Kulkas`, `Wastafel Cuci Piring`, `Kitchen Set`, `Dispenser`).
  * **2. Automatic Cleansing & Parsing**:
    - Memasang parser regex (`/^wc:\s*/i` dan `/^dapur:\s*/i`) untuk secara otomatis mengabstraksi dan membersihkan teks prefix mentah.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 83. Penghapusan Informasi Lantai dari Header Tipe Kamar & Pembersihan Format Kartu Kamar (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mempertanyakan adanya label `Lantai` pada ringkasan **Tipe Kamar** (misal `• Lantai Lantai 2`), padahal sebuah tipe kamar bisa tersebar di berbagai lantai yang berbeda.
  2. Terdapat bug kata ganda `"Lantai Lantai 2"` pada pembentukan string sebelumnya.
- **Implementasi & Perbaikan**:
  * **1. Penghapusan Lantai dari Header Tipe Kamar**:
    - Menghapus rendering informasi lantai dari header ringkasan Tipe Kamar pada Accordion Tingkat 1.
    - Header Tipe Kamar kini hanya fokus menampilkan `Ukuran Rata-rata: 3x4 meter`.
  * **2. Penyempurnaan & Sanitasi Format Lantai di Kartu Kamar Individual**:
    - Informasi lantai tetap dipertahankan secara presisi pada setiap **kartu detail kamar individual** (Accordion Tingkat 3).
    - Memasangkan regex sanitasi (`/^lantai\b/i`) untuk mencegah pembentukan kata ganda, sehingga tampil rapi sebagai **`Lantai 1`** atau **`Lantai 2`**.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 82. Redesain Kontras Visual & Pemisah Batas Kartu Data Kamar (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan kartu data kamar di atas dan di bawahnya sangat sulit dibedakan batasnya karena warna background yang cenderung sama (`bg-white` pada container transparan).
  2. Kotak statistik internal (`Total Unit`, `Unit Kosong`, dll.) sering membingungkan atau dikira sebagai kartu kamar baru.
- **Implementasi & Perbaikan**:
  * **1. Garis Aksen Tebal (Left Border Accent Bar)**:
    - Kamar Kosong: Aksen garis tebal hijau **`border-l-[6px] border-l-emerald-500`**.
    - Kamar Terisi: Aksen garis tebal oranye/amber **`border-l-[6px] border-l-amber-500`**.
  * **2. Border Outer 2px & Floating Shadow**:
    - Kartu kamar diberi **`border-2 border-slate-300`** dengan bayangan **`shadow-md shadow-slate-300/40 hover:shadow-xl`** sehingga kartu tampil "mengambang" secara jelas di atas background.
  * **3. Kontras Background Kontainer Sub-Accordion**:
    - Background container Sub-Accordion Kamar Kosong dipertegas menjadi **`bg-emerald-50/40 border-2 border-emerald-200/90`**.
    - Background container Sub-Accordion Kamar Terisi dipertegas menjadi **`bg-amber-50/40 border-2 border-amber-200/90`**.
  * **4. Pemisahan Visual Kotak Statistik Internal**:
    - Kotak internal (`Total Unit`, `Unit Kosong`, dll.) diberi warna khas (`bg-emerald-100/70 border-emerald-300` / `bg-amber-100/70 border-amber-300`) sehingga berbeda tegas dari bodi utama kartu.
  * **5. Peningkatan Spacing Kartu**:
    - Jarak antar kartu dinaikkan menjadi `gap-6` (`space-y-6`).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 81. Smart Formatter Awalan Kata "Kamar " pada Seluruh Penampilan Hasil Pendataan (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Surveyor saat menginput data pendataan kamar terkadang hanya mengisi angka nomor kamar mentah (misal `"4"`, `"3"`, `"5"`).
  2. Saat ditampilkan di peninjauan admin, angka mentah tersebut muncul tanpa konteks kata (misal tombol selektor carousel: `🛏️ 4  2 FOTO`), sehingga membingungkan.
- **Implementasi & Perbaikan**:
  * **1. Helper Smart Formatter (`formatRoomDisplayName`)**:
    - Membuat helper yang secara otomatis mendeteksi dan mengecek nama kamar.
    - Jika terinput angka mentah `"4"` ➔ Otomatis tampil **`Kamar 4`**.
    - Jika terinput `"Kamar 4"` ➔ Tetap tampil **`Kamar 4`** (tanpa penggandaan kata ganda).
  * **2. Penerapan di Seluruh Elemen UI Tab 2**:
    - Tombol selektor unit kamar kosong di bawah carousel: **`🛏️ Kamar 3`**, **`🛏️ Kamar 4`**, **`🛏️ Kamar 5`**.
    - Badge overlay header slider galeri foto: **`Kamar 4`**.
    - Judul kartu detail kamar pada list accordion terisi dan kosong: **`Kamar 4`**.
    - Label modal lightbox foto kamar: **`Kamar 4`**.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 80. Redesain Tab 2 Data Kamar & Penghuni Menjadi System Nested Accordion Hirarkis (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta baris `FILTER TIPE KAMAR:` (button filter horizontal) dihapus karena membingungkan.
  2. Pengguna meminta peninjauan kamar dikelompokkan secara bertingkat (Nested Accordion): Kategori Tipe Kamar ➔ 2 Sub-Accordion Minimize (`Terisi` vs `Kosong`) ➔ Kartu Detail Kamar.
- **Implementasi & Perbaikan**:
  * **1. Penghapusan Filter Button Block**:
    - Menghapus blok markup `NAVIGASI FILTER JENIS TIPE KAMAR` (`FILTER TIPE KAMAR:`).
  * **2. Implementasi Accordion Tingkat 1 (Kategori Tipe Kamar)**:
    - Kamar dikelompokkan langsung per Tipe (misal: `Tipe Standard`, `Tipe Deluxe`).
    - Dilengkapi tombol toggle Minimize/Maximize (`ChevronUp` / `ChevronDown`), badge jumlah unit, ukuran rata-rata, dan ringkasan kamar kosong vs dihuni.
  * **3. Implementasi Accordion Tingkat 2 (Sub-Accordion Status: Terisi vs Kosong)**:
    - Di dalam setiap Tipe Kamar, terdapat 2 Sub-Accordion:
      - **🟢 Sub-Accordion KAMAR SEDANG DIHUNI / TERISI** (Default: Minimize / terlipat dengan badge unit).
      - **🟠 Sub-Accordion KAMAR KOSONG / SIAP HUNI** (Default: Minimize / terlipat dengan badge unit).
  * **4. Implementasi Accordion Tingkat 3 (Kartu Detail Kamar)**:
    - Hanya saat Sub-Accordion (Terisi atau Kosong) di-maximize, seluruh kartu detail kamar yang sesuai kategori tersebut baru ditampilkan secara utuh.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Perbaikan Ikon**: Mengimpor `ChevronUp` dan `ChevronDown` secara eksplisit serta membersihkan duplikasi pengimporan `ChevronRight` dari `lucide-react`.
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 79. Perbaikan Logika Parser Dimensi Kamar (Split-Based Parsing) & Konfirmasi Arsitektur Database (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan angka tidak bisa diketik pada kotak input Luas Kamar (karena regex lama mereset input saat kotak kedua masih kosong).
  2. Pengguna mempertanyakan kesiapan arsitektur database untuk menampung input ukuran kamar tersebut.
- **Implementasi & Perbaikan**:
  * **1. Perbaikan Logika Auto-Parser (`parseDimensionParts`)**:
    - Mengganti regex ketat dengan metode pemisahan karakter berbasis `str.split(/[\times xX×]/)`.
    - Mengizinkan pengisian parsial (misal: mengetik `3` di kotak Panjang menyimpan `"3x meter"`, dan parser secara presisi menguraikan `length: "3"` dan `width: ""`). Angka `3` bertahan di layar dan pengguna dapat mengetik `4` di kotak Lebar dengan mulus.
  * **2. Konfirmasi Arsitektur Database**:
    - Memastikan bahwa Supabase DB pada tabel `properties` (kolom JSONB `room_types`) dan `kostmanager_requests` sudah 100% siap dan secara native membaca field `r.size` / `r.dimensions` ini sejak awal.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 78. Pembersihan Placeholder Tulisan Bayangan (3 dan 4) pada Input Dimensi Luas Kamar (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada kotak input dimensi Luas Kamar, terdapat placeholder tulisan bayangan `3` pada kotak Panjang dan `4` pada kotak Lebar yang membingungkan agen survey.
  2. Pengguna meminta tulisan bayangan tersebut dihapus agar kotak input bersih total saat belum diisi.
- **Implementasi & Perbaikan**:
  - Menghapus atribut `placeholder="3"` dan `placeholder="4"` dari kotak input dimensi pada form **Kamar Baru (`temporaryRoom`)** dan **Edit Kamar Tersimpan (`renderRoomEditor`)**.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 77. Redesain Input Luas Kamar Menjadi Format Model Dimensi `[Panjang] X [Lebar] meter` (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta format input Luas/Ukuran Kamar diubah agar lebih praktis dan rapi, tanpa tombol pilih cepat atau single text input.
  2. Format yang diinginkan: Dua kotak input dimensi terpisah dengan akhiran satuan meter: `[ Panjang ] X [ Lebar ] meter` (contoh: `[ 3 ] X [ 4 ] meter`).
  3. Terjadi `Uncaught ReferenceError: parseDimensionParts is not defined` karena lingkup deklarasi helper sebelumnya berada di luar fungsi komponen.
- **Implementasi & Perbaikan**:
  * **1. Lingkup Helper Auto-Parser Dimensi (`parseDimensionParts`)**:
    - Memindahkan fungsi helper `parseDimensionParts` tepat ke dalam lingkup body komponen `AgentDashboard` sehingga dapat diakses tanpa error oleh `renderRoomEditor` maupun form `temporaryRoom`.
  * **2. Komponen UI Input Dimensi Terstruktur**:
    - Mengganti single text input dan tombol pilih cepat dengan komponen input berpasangan `[ Panjang Input (w-24) ]  X  [ Lebar Input (w-24) ]  meter`.
    - Diterapkan pada form **Tambah Kamar Baru (`temporaryRoom`)** dan form **Edit Kamar Tersimpan (`renderRoomEditor`)**.
    - Otomatis merangkai nilai menjadi format standar `"3x4 meter"` yang tersimpan ke database.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 76. Pemulihan Editor Detail Kamar Tersimpan & Penambahan Field Luas / Ukuran Kamar (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Ketika kartu pendataan kamar sudah disimpan dan di-expand kembali (edit mode), section input `DETAIL KAMAR` (Nomor Kamar, Lantai, Tipe Kamar) sebelumnya tidak muncul sehingga tidak bisa diedit oleh agen survey.
  2. Belum tersedia field input untuk **Luas / Ukuran Kamar** (misal: `3x4 meter`) pada form pendataan kamar baru maupun kamar tersimpan.
- **Implementasi & Perbaikan**:
  * **1. Pemulihan Box Editor Detail Kamar Tersimpan (`renderRoomEditor`)**:
    - Menambahkan kembali box editor `DETAIL KAMAR (Dapat Diedit)` di paling atas accordion kamar yang tersimpan:
      - **Nomor Kamar** (`rt.name`): Input text yang langsung memperbarui nama kamar tersimpan.
      - **Lantai** (`rt.floor`): Select dropdown (`Lantai 1`, `Lantai 2`, `Lantai 3`, `Lantai 4`, dll.).
      - **Tipe Kamar** (`rt.type`): Select dropdown (`Standard`, `Premium`, `Deluxe`, `Tipe Kustom...`).
      - **Luas / Ukuran Kamar** (`rt.size` / `rt.dimensions`): Input text + tombol quick preset.
      - **Status Kamar** (`rt.status`): Tombol `TERISI` vs `KOSONG` (yang tersinkronisasi otomatis dengan foto kamar).
  * **2. Penambahan Field Luas / Ukuran Kamar (`size` / `dimensions`)**:
    - Ditambahkan pada form **Tambah Kamar Baru (`temporaryRoom`)** dan **Edit Kamar Tersimpan (`renderRoomEditor`)**.
    - Menyediakan input text kustom (placeholder: `contoh: 3x4 meter`) dan tombol **Quick Presets** (`3x3m`, `3x4m`, `4x4m`, `3x5m`) untuk pengisian kilat di lapangan.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 75. Pembersihan Teks Pembantu pada Header Carousel Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada header carousel kamar kosong Tab 2, terdapat teks penjelasan *"Foto di carousel terisolasi per kamar yang dipilih"*.
  2. Pengguna meminta agar teks tersebut dihapus agar antarmuka peninjauan admin lebih bersih, rapi, dan minimalis.
- **Implementasi & Perbaikan**:
  - Menghapus tag teks penjelasan dari header sub-section carousel Tab 2.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 74. Pemulihan Penuh Tab 1 Data Properti Umum & Carousel Terisolasi Per Unit Kamar Kosong pada Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Konten pada Tab 1 (Data Properti Umum) sebelumnya terpotong saat penyesuaian layout sehingga tampil kosong ketika tab dibuka.
  2. Pada carousel kamar kosong Tab 2, pengguna meminta agar foto antar kamar tidak bercampur aduk: disediakan barisan tombol selektor kamar (`Kamar 3`, `Kamar 4`, `Kamar 5`), dan ketika salah satu kamar diklik, carousel dan thumbnail di bawahnya hanya menampilkan foto-foto milik kamar tersebut secara eksklusif.
- **Implementasi & Perbaikan**:
  * **Pemulihan Utuh Tab 1 (Data Properti Umum)**:
    - `1.1 Hero Carousel Galeri Foto Properti` (Simulasi Tampilan Pengguna Publik dengan 1 Frame Slider + Thumbnail Strip).
    - `1.2 Fasilitas Umum & Kelengkapan` (Kartu Terpadu Tersinkronisasi Dua Arah: Klik Fasilitas ➔ Jump ke Foto Terkait & Active Glow + Peringatan Merah Audit Surveyor).
    - `1.3 Header Identitas Properti & Tarif Mulai`.
    - `1.4 Lokasi, Patokan Jalan, Titik Koordinat GPS & Peta Embed Google Maps`.
    - `1.5 Kampus & Landmark Terdekat` (dengan tombol uji rute navigasi).
    - `1.6 Peraturan & Tata Tertib Kost`.
  * **Pemisahan Galeri Carousel Per Unit Kamar pada Tab 2**:
    - Menambahkan barisan **Tombol Selektor Unit Kamar Kosong** (`🚪 Kamar 3 (4 Foto)`, `🚪 Kamar 4 (1 Foto)`, `🚪 Kamar 5 (2 Foto)`).
    - Carousel dan thumbnail strip di bawahnya **HANYA** menampilkan foto-foto dari unit kamar yang sedang dipilih secara terisolasi tanpa mencampur foto kamar lain.
    - Menampilkan informasi spesifik kamar terpilih (Nama, Tipe, Ukuran, Lantai, Tarif, dan Fasilitas).
    - Di bawah carousel tetap tersaji **Navigasi Filter Tipe Kamar** dan **Peninjauan Kamar Terstruktur Berjenjang** (*Grup Tipe Kamar ➔ Sub-Kategori Kosong vs Dihuni ➔ Kartu Detail Kamar*).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 73. Carousel Kamar Siap Huni, Navigasi Filter Tipe Kamar & Pengelompokan Berjenjang pada Tab 2 Data Kamar & Penghuni (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada peninjauan admin Tab 2 (Data Kamar & Penghuni), data kamar sebelumnya ditampilkan dalam satu daftar linear panjang tanpa pengelompokan yang jelas antara tipe kamar dan status hunian.
  2. Pengguna meminta:
     - Menambahkan **Carousel Kamar Siap Huni / Kosong** di bawah ringkasan okupansi untuk menyorot unit-unit kamar yang siap dipasarkan.
     - Menambahkan **Navigasi Filter Jenis Tipe Kamar** (*Semua Tipe, Standard, VIP, dll.*) di bawah carousel.
     - Mengelompokkan peninjauan kamar secara berjenjang (*Nested Categorization*): Dikelompokkan per **Tipe Kamar** (misal: *Standard*, *Premium*), di dalamnya dikelompokkan lagi berdasarkan **Status Okupansi** (*Kosong / Siap Huni* vs *Sedang Dihuni*), dan di dalamnya menampilkan kartu data detail kamar masing-masing.
- **Implementasi & Perbaikan**:
  * **2.1 Banner Ringkasan Okupansi Kamar**: Tipe Kamar, Total Seluruh Unit, Kosong / Siap Huni, Sedang Dihuni.
  * **2.2 Hero Carousel Kamar Siap Huni / Kosong**:
    - Menampilkan unit kamar yang berstatus kosong dengan rasio aspect-[16/9] tajam.
    - Dilengkapi badge hijau `✨ Siap Huni / Kosong`, badge tipe kamar, overlay informasi melayang di kiri bawah (Nama kamar, ukuran, lantai, tarif, dan fasilitas ringkas), counter slide, tombol panah kiri `<` / `>` melayang, dan strip thumbnail kamar kosong.
  * **2.3 Navigasi Filter Jenis Tipe Kamar**:
    - Tombol filter pill: `Semua Tipe (${total})`, `Standard (${count})`, `VIP (${count})`, dll.
  * **2.4 Peninjauan Detail Kamar Terstruktur Berjenjang**:
    - **Header Grup Tipe Kamar**: Card elegan berisi nama tipe, ukuran rata-rata, lantai, total unit, dan ringkasan unit kosong vs terisi.
    - **Sub-Kategori 1: Kamar Kosong / Siap Huni (🟢)**: Grid kartu detail kamar kosong siap pasarkan.
    - **Sub-Kategori 2: Kamar Sedang Dihuni (🔒)**: Grid kartu detail kamar terisi lengkap dengan box rincian penghuni aktif (Penghuni utama, telepon WhatsApp, jenis langganan, tanggal pembayaran terakhir, tagihan berikutnya, dan anggota tambahan).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 72. Sinkronisasi Interaktif Dua Arah antara Kartu Fasilitas Umum & Carousel Foto Properti di Modal Peninjauan Admin (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada form pendataan agen survey, pemilihan fasilitas umum menentukan kategori foto yang diambil di lapangan (foto Area Parkir, WC Umum, Dapur Bersama, dll.).
  2. Pengguna meminta agar kartu fasilitas pada modal peninjauan admin terhubung secara interaktif dengan carousel foto di atasnya: ketika salah satu fasilitas diklik, carousel langsung menampilkan foto terkait, dan ketika carousel digeser, kartu fasilitas yang bersesuaian otomatis menyala/ter-highlight.
- **Implementasi & Perbaikan**:
  * **Bi-Directional Interactive Synchronization**:
    - **Klik Kartu Fasilitas ➔ Jump ke Foto Carousel**:
      - Ketika admin mengklik salah satu kartu fasilitas (misal: *WC UMUM*, *AREA PARKIR*, *DAPUR BERSAMA*, dll.), sistem otomatis mencocokkan kata kunci kategori foto dan melompatkan carousel ke slide foto tersebut (`setCurrentPropertyPhotoIndex(matchedIndex)`), serta melakukan auto-scroll halus ke carousel.
    - **Geser Carousel ➔ Active Highlight pada Kartu Fasilitas**:
      - Saat foto di carousel digeser (melalui tombol panah atau thumbnail), kartu fasilitas yang bersesuaian otomatis mendapatkan active state menyala (`ring-2 ring-[#ff7a00] bg-orange-50/50 scale-[1.01] shadow-md`), icon oranye, dan badge animasi `📷 Foto Aktif (#N)`.
    - **Indikator Keterikatan Foto**:
      - Setiap kartu fasilitas menampilkan badge status ketersediaan foto (`📷 Lihat Foto #N` jika ada, atau `Tanpa Foto` jika surveyor tidak mendata foto spesifik fasilitas tersebut).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 71. Reorganisasi Hierarki Tab 1 Modal Peninjauan Admin: Penempatan Fasilitas Umum di Bawah Carousel & di Atas Identitas Properti (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada modal peninjauan onboarding di dashboard admin (Tab 1: Data Properti Umum), section *Fasilitas Umum & Kelengkapan* sebelumnya berada di bawah section kampus/landmark.
  2. Pengguna meminta agar section Fasilitas Umum dinaikkan posisinya menjadi tepat di bawah Carousel Foto dan di atas Identitas Properti agar alur pembacaan data fasilitas utama kost langsung terlihat setelah melihat foto.
- **Implementasi & Perbaikan**:
  * **Alur Hierarki Tab 1 yang Runtut & Padu**:
    - `1.1 Hero Carousel Galeri Foto Properti` (Slider interaktif 1 frame besar).
    - `1.2 Fasilitas Umum & Kelengkapan` (Modern Integrated Cards dengan Audit Warning Merah jika kelalaian surveyor).
    - `1.3 Identitas Properti & Ringkasan Tarif Mulai` (Judul kos, tipe kos, total kamar, tarif mulai).
    - `1.4 Lokasi, Patokan Jalan, Titik Koordinat GPS & Peta Google Maps`.
    - `1.5 Kampus & Landmark Terdekat` (dengan tombol uji rute navigasi).
    - `1.6 Peraturan & Tata Tertib Kost`.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 70. Desain Carousel Galeri Foto Properti di Modal Peninjauan Admin Sesuai UI/UX Pengguna Publik (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Tampilan galeri foto properti sebelumnya menggunakan *mosaic grid* 2 kolom yang membuat proporsi foto terbagi dan terasa sempit di dalam modal admin.
  2. Pengguna meminta agar galeri foto diubah menjadi tampilan **Carousel / Slider Penuh** yang proporsional, persis seperti UI/UX saat pengguna publik membuka kos di `KostDetail.tsx`.
- **Implementasi & Perbaikan**:
  * **Full-Frame Interactive Carousel Slider**:
    - Merombak total komponen teratas Tab 1 menjadi Carousel interaktif penuh 1 frame besar dengan rasio aspek proporsional (`aspect-[16/9]` / `max-h-[380px]`), sudut rounded modern, dan background gelap berkelas.
    - Dilengkapi tombol panah navigasi kiri `<` (`ChevronLeft`) dan kanan `>` (`ChevronRight`) dengan efek glassmorphism yang melayang di sisi frame.
    - Dilengkapi badge kategori foto aktif di sudut kiri atas (*⭐ Bangunan Depan, 🏢 Koridor, 🅿️ Area Parkir, 🌳 Lingkungan*) dan counter foto di sudut kanan bawah (*X / N FOTO*).
    - Tombol perbesar Lightbox resolusi penuh di tengah saat kursor di-hover.
  * **Interactive Thumbnail Strip**:
    - Deretan thumbnail di bawah carousel dengan active ring indicator oranye (`ring-2 ring-[#ff7a00]`) yang dapat diklik untuk melompat slide foto secara instan.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 69. Simulasi Tampilan User: Penempatan Hero Galeri Foto Properti di Bagian Teratas Tab Peninjauan Admin (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada modal peninjauan onboarding properti kost di dashboard admin (Tab 1: Data Properti Umum), galeri foto properti sebelumnya berada di urutan terbawah setelah peraturan kos.
  2. Admin harus scroll jauh ke bawah untuk mengecek kualitas foto properti dan tidak mendapatkan gambaran visual langsung (*realistic simulation*) bagaimana kos tersebut akan tampil di mata pengguna/pencari kos di halaman publik (`KostDetail.tsx`).
- **Implementasi & Perbaikan**:
  * **Interactive Hero Showcase Mosaic (Top Section Tab 1)**:
    - Menempatkan **Galeri Foto Properti di posisi paling teratas Tab 1** mengadopsi tata letak modern ala Airbnb / Traveloka / RuangSinggah publik.
    - **Foto Utama Besar (Left Showcase)**: Menampilkan foto utama (Bangunan Depan) dalam rasio proporsional yang tajam dengan label badge elegan dan aksi zoom Lightbox.
    - **Grid Sub-Foto (Right Mosaic 2x2)**: Menampilkan foto area umum pendukung (Koridor, Area Parkir, Lingkungan, dll.).
    - **Overlay `+N Foto Lainnya` & Quick Thumbnail Strip**: Jika foto berjumlah lebih dari 4 atau 5, item terakhir menampilkan overlay jumlah foto ekstra dan bar thumbnail lengkap di bawahnya untuk akses cepat ke seluruh galeri.
  * **Struktur Urutan Tab 1 yang Teratur & Natural**:
    - `1.1 Galeri Foto Properti (Simulasi Tampilan User)`
    - `1.2 Identitas Properti & Ringkasan Tarif`
    - `1.3 Lokasi, Patokan Jalan, Titik Koordinat GPS & Peta Google Maps`
    - `1.4 Kampus & Landmark Terdekat (Uji Rute Navigasi)`
    - `1.5 Fasilitas Umum & Sub-Kelengkapan (Modern Cards dengan Audit Warning Merah)`
    - `1.6 Peraturan & Tata Tertib Kost`
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 68. Penghapusan Sub-Fasilitas Fiktif & Penandaan Peringatan Evaluasi Kelalaian Surveyor di Modal Peninjauan Admin (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada peninjauan fasilitas umum di dashboard admin, sebelumnya terdapat *smart fallback* yang otomatis mengasumsikan dan memunculkan tag sub-kelengkapan (seperti `Kloset Duduk / Jongkok` atau `Shower / Bak Air` pada WC Umum, dan `Kompor / Wastafel` pada Dapur Bersama) meskipun agen survey tidak mengisinya di lapangan.
  2. User meminta agar data fiktif tersebut dihapus total. Jika sub-input tidak diisi oleh surveyor, cukup tampilkan fasilitas induknya saja dan tandai dengan peringatan warna merah sebagai bahan evaluasi admin terhadap kelalaian surveyor lapangan.
- **Implementasi & Perbaikan**:
  * **Pembersihan Fallback Fiktif (*Pure Real Data*)**:
    - Menghapus seluruh asumsi default/fallback pada `parkingSubs`, `kitchenSubs`, dan `bathroomSubs`. Sub-kelengkapan kini hanya diambil murni dari metadata hasil survei lapangan.
  * **Indikator Warning Evaluasi Warna Merah (*Audit Alert Box & Badge*)**:
    - Jika fasilitas yang membutuhkan rincian (*Area Parkir*, *WC Umum*, *Dapur Bersama*) didaftarkan oleh surveyor namun sub-kelengkapannya tidak diisi:
      - Badge status berubah menjadi merah: **`⚠️ Sub-Data Kosong`** (`bg-rose-100 text-rose-700 border-rose-300`).
      - Di bagian bawah kartu ditampilkan kotak peringatan merah lembut: *"Kelengkapan belum diinput (Induk fasilitas terdaftar, namun rincian spesifik tidak diisi oleh agen survey saat pendataan)"*.
      - Border kartu berubah menjadi beraksen merah (`border-2 border-rose-300 bg-rose-50/30`) agar admin dapat langsung mengenali ketidaklengkapan data survei.
    - Fasilitas umum standar (WiFi, CCTV, Laundry, dsb.) atau fasilitas yang sub-kelengkapannya terisi lengkap tetap menampilkan status hijau normal (`✓ Aktif`).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 67. Retensi Otomatis Tanda Tangan Digital & Persetujuan Syarat pada Mode Edit/Pembaruan Pendataan Surveyor (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Ketika surveyor membuka kembali form pendataan onboarding untuk mengedit atau memperbarui data properti (seperti revisi harga, fasilitas, koordinat GPS, foto kamar, dll.), tanda tangan digital dan persetujuan syarat yang sudah sah ditandatangani oleh pemilik kost sebelumnya ter-reset menjadi kosong.
  2. Tombol submit `🔄 Perbarui & Kirim Ulang ke Admin` menjadi terkunci (*disabled*) dan memaksa surveyor meminta tanda tangan dan centang ulang kepada pemilik kos.
- **Implementasi & Perbaikan**:
  * **Pemuatan Otomatis Tanda Tangan Digital Tersimpan (`openKostManagerListing`)**:
    - Sistem secara otomatis mengambil dan memuat tanda tangan digital tersimpan dari database (`req.signature_data`, `survey_requests`, `kostmanager_surveys`, `properties.metadata.signature_data`, atau draf lokal `localStorage`).
    - Jika tanda tangan tersimpan ditemukan, state `signatureData` langsung diisi dan `agreedToTerms` otomatis diset ke `true`.
  * **UI Step 3 Adaptif & Cerdas**:
    - Checkbox Syarat & Ketentuan otomatis tercentang secara default.
    - Pada section Tanda Tangan Digital Pemilik, jika tanda tangan sudah ada:
      - Menampilkan badge status hijau `✓ Tersimpan` (`CheckCircle2`).
      - Menampilkan preview gambar tanda tangan digital pemilik yang sah.
      - Menampilkan callout konfirmasi bahwa tanda tangan tersimpan dari survei sebelumnya dan tidak wajib ditandatangani ulang.
      - Menyediakan tombol aksi `"✏️ Tanda Tangan Ulang"` jika agen memang ingin mengubah atau memperbarui tanda tangan tersebut.
    - Tombol **`🔄 Perbarui & Kirim Ulang ke Admin`** langsung aktif (*enabled*) dan siap dikirim tanpa hambatan.
  * **Sinkronisasi Metadata & Draf**:
    - Memasukkan `signatureData` dan `agreedToTerms` ke dalam draf autosave `localStorage` dan payload `properties.metadata`.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 66. Redesain Total UI/UX Fasilitas Umum & Kelengkapan Menjadi Modern Integrated Facility Cards di Modal Peninjauan Admin (Agustus 2026)
- **Permintaan & Masalah**:
  1. Tampilan fasilitas umum sebelumnya terfragmentasi: chips fasilitas diletakkan di atas lalu di bawahnya muncul kotak-kotak terpisah dengan warna mencolok yang tidak seragam (oranye vs biru), menimbulkan kesan murahan, kaku, dan membuang ruang layout (*visual clutter*).
- **Implementasi & Perbaikan**:
  * **Unified Modern Facility Cards (Grid Responsif 2-3 Kolom)**:
    - Merombak total section menjadi grid kartu fasilitas terpadu yang modern, elegan, dan harmonis.
    - Setiap kartu fasilitas dilengkapi:
      - Icon vector pure SVG `lucide-react` tematik (Parkir, Dapur, WC, WiFi, CCTV, Laundry, dsb.) dengan kontainer bergradasi lembut.
      - Nama fasilitas berhuruf tebal dan subtitle kategori fungsional (*Area Kendaraan, Fasilitas Masak, Sanitasi Publik, Koneksi Internet, Keamanan 24 Jam*).
      - Badge status hijau emerald lembut `Aktif / Tersedia`.
  * **Sub-Kelengkapan Melekat Menyatu di Dalam Kartu (Integrated Sub-Tags)**:
    - Untuk fasilitas yang memiliki rincian (misal: *Parkir Motor / Mobil / Kanopi* pada Area Parkir, atau *Kloset Duduk / Shower* pada WC Umum), sub-kelengkapan langsung dirender di bagian bawah kartu fasilitas terkait sebagai tag pill putih berbayang halus yang rapi, tanpa kotak terpisah yang membingungkan.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 65. Evaluasi & Perombakan Total Modal Peninjauan Onboarding Admin: Pembersihan Data Fiktif, Navigasi Rute Kampus, Hierarki Sub-Fasilitas, & Data Penuh Penghuni/Billing Kamar Terisi (Agustus 2026)
- **Permintaan & Masalah**:
  1. Adanya elemen data fiktif pada peninjauan properti umum (seperti teks deskripsi panjang dan "spesifikasi operasional listrik/air") yang tidak pernah diinput oleh surveyor pada form pendataan.
  2. Daftar kampus & fasilitas terdekat sebelumnya hanya berupa teks statis tanpa tombol aksi untuk menguji/melihat rute jalan navigasi dari titik koordinat GPS kost ke kampus tujuan.
  3. Sub-kelengkapan fasilitas umum (Area Parkir Motor/Mobil/Sepeda, Dapur Bersama, WC Umum) tidak tersinkronisasi ke database dan tidak tampil secara jelas.
  4. Pada tipe kamar yang berstatus "Terisi", peninjauan admin sama sekali tidak menampilkan data lengkap penghuni (nama, nomor WhatsApp, jenis langganan sewa, tanggal bayar terakhir, tanggal jatuh tempo tagihan berikutnya, dan anggota penghuni tambahan) yang telah didata oleh surveyor.
  5. UI/UX sebelumnya kaku dan membutuhkan perombakan visual modern card-based yang lega, elegan, dan informatif.
- **Implementasi & Perbaikan**:
  * **Sinkronisasi Metadata & Pembersihan Data Non-Input (`AgentDashboard.tsx` & `KostManagerManagement.tsx`)**:
    - Menyertakan objek `metadata` (`publicParkingFacilities`, `publicKitchenFacilities`, `publicBathroomFacilities`, `addressNotes`) saat agen menyimpan draft/final listing properti ke tabel `properties` dan `mitra_kostmanager`.
    - Menghapus blok deskripsi dummy dan spesifikasi operasional fiktif pada peninjauan admin, digantikan dengan **Ringkasan Identitas Properti** riil.
  * **Aksi Interaktif Uji Rute & Jarak Kampus Google Maps**:
    - Setiap item kampus/landmark terdekat dilengkapi tombol aksi **`🧭 Rute`** yang membuka Google Maps Directions langsung dari titik koordinat kost (`origin=${lat},${lng}`) ke kampus tujuan (`destination=${campusName}`).
  * **Hierarki Sub-Kelengkapan Fasilitas Umum Terpadu**:
    - Menampilkan fasilitas umum utama bersama sub-kelengkapan detailnya secara hierarkis (Area Parkir ➔ rincian Motor/Mobil/Sepeda/Kanopi; Dapur Bersama ➔ Kompor/Kulkas/Dispenser/Wastafel; WC Umum ➔ Kloset/Shower/Wastafel).
  * **Tampilan Penuh Data Penghuni & Penagihan Sewa pada Kamar Terisi**:
    - Pada kartu kamar berstatus `🔒 Sedang Dihuni`, kini dirender **Box Informasi Penghuni Aktif & Penagihan Sewa**:
      - 👤 Nama Lengkap Penghuni Utama.
      - 📱 Nomor WhatsApp dengan tombol direct chat `wa.me/`.
      - 💳 Jenis Langganan Sewa (Bulanan, 3 Bulan, 6 Bulan, 1 Tahun, dsb.).
      - 🗓️ Tanggal Pembayaran Terakhir (`startDate`).
      - ⏰ Tanggal Jatuh Tempo Tagihan Berikutnya (`endDate`).
      - 👥 Total Jumlah Penghuni Saat Ini (`currentOccupants`).
      - 👥 Daftar Anggota Penghuni Tambahan (Nama & WhatsApp tiap anggota).
  * **UI/UX Modern Card-Based**:
    - Desain premium berskala luas, rounded-3xl, typography font-black uppercase, status badge kontras, dan integrasi penuh icon vector pure SVG `lucide-react`.
- **File Tersentuh**: 
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` sukses 100% dengan 0 error (exit code 0).


### 64. Restorasi & Perombakan Modal Peninjauan Admin Menjadi 3 Kategori Komprehensif di KostManagerManagement (Agustus 2026)
- **Permintaan & Masalah**:
  1. Peninjauan onboarding properti di Dashboard Admin sebelumnya terbagi ke dalam 4 tab terfragmentasi (`Info & Lokasi`, `Galeri Foto`, `Tipe Kamar`, `Legalitas`), membuat admin harus berpindah-pindah tab untuk meninjau data properti dan fotonya.
  2. Kerapian visual dan kelengkapan data pendataan agen surveyor lapangan membutuhkan ruang (*dedicated space*) yang tertata jelas, terstruktur, dan tidak berdesakan.
- **Implementasi & Perbaikan**:
  * **Penyederhanaan Menjadi 3 Kategori Utama**:
    1. **🏢 1. DATA PROPERTI UMUM** (`reviewActiveTab === 'property'`):
       - Profil & Deskripsi Kost (nama, gender kost, profil lengkap).
       - Lokasi & Akses GPS (alamat lengkap, catatan petunjuk patokan/arah, koordinat lat/lng, peta Google Maps interaktif, daftar kampus/landmark terdekat).
       - Fasilitas Umum & Sub-Kelengkapan (chips fasilitas umum, sub-detail Area Parkir, Dapur Bersama, dan WC Umum).
       - Spesifikasi Operasional (Listrik token/termasuk, Air PDAM/sumur, Jam malam/akses 24 jam) & Peraturan Kost.
       - Galeri Foto Area Umum Properti Berkategori (dengan filter pills kategori & zoom lightbox).
    2. **🛏️ 2. DATA KAMAR & PENGHUNI** (`reviewActiveTab === 'rooms'`):
       - Banner ringkasan unit (Total varian tipe kamar, Total unit properti, Total kamar kosong siap huni, Total kamar terisi/dihuni).
       - Kartu detail per-tipe kamar yang lega: Status 🔒 *Sedang Dihuni* vs ✨ *Kosong/Siap Huni*, unit ketersediaan, kapasitas maks penghuni, biaya tambahan orang/bulan, skema tarif lengkap (Bulanan, 3 Bulan, 6 Bulan, Tahunan, Mingguan, Harian).
       - Kelengkapan fasilitas kamar, kamar mandi, dan dapur dalam.
       - Dokumentasi foto kamar dengan zoom lightbox & callout privasi kamar terisi.
    3. **🤝 3. DATA MITRA & KERJASAMA** (`reviewActiveTab === 'partnership'`):
       - Profil Pemilik/Mitra (Avatar inisial, nama, tombol direct WhatsApp, email akun, rekening pencairan hasil sewa).
       - Metadata surveyor lapangan (nama agen, waktu survei, status kelayakan data, tombol Google Drive berkas mentah).
       - Dokumen Perjanjian Pengelolaan Auto-Pilot & checklist klausul legalitas kemitraan.
       - Bukti Tanda Tangan Digital Mitra (`signature_data`) dengan status *Digital Signature Verified*.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 63. Diferensiasi Visual & Penjelasan Status Kamar Terisi vs Kosong pada Peninjauan Admin di KostManagerManagement (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada modal peninjauan onboarding properti di Dashboard Admin (`KostManagerManagement.tsx`), kartu tipe kamar tidak membedakan secara jelas status kamar yang terisi/dihuni dan kamar yang kosong/siap huni.
  2. Data `availableRooms` sebelumnya menggunakan operator `|| 1`, sehingga jika `availableRooms === 0` (kamar penuh/terisi), angka ketersediaan kamar kosong keliru ditampilkan menjadi `1`.
  3. Ketika kamar berstatus terisi dan belum memiliki foto, sistem hanya menampilkan pesan generik `"Foto spesifik tipe kamar ini belum diunggah."`, sehingga admin bisa salah mengira bahwa agen/surveyor lalai, padahal kamar tersebut memang sedang ditempati penghuni aktif dan surveyor tidak memiliki izin akses privasi ke dalam kamar.
- **Implementasi & Perbaikan**:
  * **Normalisasi Status Okupansi Kamar**:
    - Mendeteksi `isOccupied` secara komprehensif (`room.status === 'Terisi'`, `room.isOccupied === true`, `room.isAvailable === false`, atau `availableRooms === 0`).
    - Memperbaiki kalkulasi `totalRooms` dan `availableRooms` tanpa fallback destruktif `|| 1`.
  * **Diferensiasi Visual Kartu & Badge Status**:
    - **Kamar Terisi (Sedang Dihuni)**: Menampilkan badge amber berikon `<Lock />` `Sedang Dihuni`, border amber lembut (`bg-amber-50/20 border-amber-200/80`), dan box ketersediaan bernilai `0 (Penuh)`.
    - **Kamar Kosong (Siap Huni)**: Menampilkan badge emerald berikon `<Sparkles />` `Kosong / Siap Huni`, dan box ketersediaan bernilai unit kosong riil.
  * **Pesan Kontekstual Dokumentasi Foto**:
    - **Kamar Terisi Tanpa Foto**: Menampilkan box callout informatif:
      `🔒 Kamar Sedang Dihuni (Akses Foto Terbatas) — Kamar ini terdata sedang terisi penuh oleh penghuni aktif. Surveyor lapangan tidak memiliki izin akses privasi untuk memotret ke dalam ruangan kamar.`
    - **Kamar Kosong Tanpa Foto**: Menampilkan pesan standar bahwa foto belum diunggah oleh surveyor.
    - **Kamar Terisi Dengan Foto**: Menampilkan badge `Foto Kamar Terisi` di header galeri.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 62. Dynamic Inline Layout & Fluid Natural Shifting Sub-Inputs pada Checklist Fasilitas di AgentDashboard (Agustus 2026)
- **Permintaan & Masalah**: Layout checklist fasilitas dan sub-input kelengkapan sebelumnya terkesan kaku karena sub-input muncul terpisah di bawah seluruh grid utama (out-of-context). Pengguna menginginkan sub-input kelengkapan muncul langsung secara inline tepat di bawah opsi fasilitas yang dicentang dan secara dinamis serta natural menggeser opsi fasilitas lainnya ke urutan berikutnya ke bawah.
- **Implementasi & Perbaikan**:
  * **Step 1 (Fasilitas Umum)**:
    - Membungkus setiap fasilitas umum dalam `<React.Fragment key={fac}>`.
    - Merender sub-input kelengkapan (`Dapur Bersama`, `Area Parkir`, `WC Umum`) secara **inline contextual** dengan class `col-span-2 pl-6 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl animate-fadeIn` tepat di bawah kartu checkbox induknya.
    - Menghapus blok sub-input terpisah yang berada di luar grid utama.
    - Ketika user mencentang salah satu dari ketiga fasilitas tersebut, box sub-input langsung muncul membentang 2 kolom dan otomatis menggeser fasilitas setelahnya ke baris baru secara dinamis.
  * **Step 2 (Fasilitas Kamar - Form Tambah Kamar Baru `temporaryRoom`)**:
    - Mengintegrasikan sub-input `Kamar Mandi Dalam` (Kloset Duduk/Jongkok, Shower, Wastafel, custom tags) dan `Dapur Dalam` (Kompor, Kulkas, Wastafel, Kitchen Set, Dispenser, custom tags) secara inline di dalam mapping loop fasilitas kamar.
    - Menggunakan animasi transisi `animate-fadeIn` dan spanning 2-kolom (`col-span-2`).
  * **Step 2 (Fasilitas Kamar - Kamar Terdaftar `renderRoomEditor`)**:
    - Menerapkan pola dynamic inline yang sama persis pada accordion editor kamar terdaftar untuk menjaga keseragaman UX menyeluruh.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build TypeScript `tsc` & Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions` dan `functions/public/` sukses 100% dengan 0 error (exit code 0).


### 61. Standarisasi Kategori Foto "Area Parkir" & Penambahan Sub-Input Kelengkapan Parkir di AgentDashboard (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada checklist fasilitas umum "Area Parkir", kategori foto yang ter-generate sebelumnya langsung spesifik bernama "Parkir Motor" atau "Parkiran" karena default data lama dan alias mapping yang belum terstandarisasi.
  2. Pengguna menginginkan sub-input kelengkapan pada opsi "Area Parkir" untuk memilih jenis parkir yang tersedia (Parkir Motor, Parkir Mobil, Parkir Sepeda, serta fasilitas kustom).
- **Implementasi & Perbaikan**:
  * **Standarisasi Kategori Foto "Area Parkir"**:
    - Memperbarui `computeDynamicPublicPhotoCategories` agar seluruh alias (`area parkir`, `parkir`, `parkiran`, `parkir motor`, `parkir mobil`) dipetakan secara konsisten ke nama kategori **`"Area Parkir"`**.
    - Memperbarui initial state `facilities` dan default fallback menjadi `['WiFi', 'Area Parkir', 'Dapur Bersama']` dan `photoCategories` default menjadi `['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan']`.
    - Menjamin backward-compatibility untuk foto dan draft lama yang tersimpan dengan label `parkiran` / `parkir motor` agar otomatis terbaca sebagai `Area Parkir`.
  * **Sub-Input Kelengkapan Area Parkir di Step 1**:
    - Menambahkan state `customPublicParkingFacilityInput: string` dan field `publicParkingFacilities: string[]` pada `kmListingForm`.
    - Menambahkan komponen box sub-input **Kelengkapan Area Parkir** di bawah grid fasilitas umum ketika **Area Parkir** dicentang, dengan opsi checkbox:
      - ☑️ **Parkir Motor**
      - ☑️ **Parkir Mobil**
      - ☑️ **Parkir Sepeda**
      - ➕ Input adder & custom tags untuk menambahkan kelengkapan kustom (misal: *Kanopi*, *Parkir Luas*, *Basement*).
  * **Persistensi Data**:
    - Menyimpan `publicParkingFacilities` ke localStorage draf dan `metadata` database Supabase saat draf properti disimpan.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build `cmd /c "npm run build"` lulus 100% — 0 TypeScript compilation error (exit code 0).

### 60. Penyederhanaan UI/UX Dokumentasi Foto (Eliminasi Istilah "Angle" & Caption Berdasarkan Kategori) di AgentDashboard (Agustus 2026)
- **Permintaan & Masalah**: Pengguna merasa terminologi "Angle" (seperti `Multi-Angle per Kategori`, `Foto / Angle`, `Tambah Angle`, `Angle 1, Angle 2`) kaku dan tidak natural. Serta paragraf deskripsi panjang yang tidak diperlukan membuat tampilan padat.
- **Implementasi & Perbaikan**:
  * **Eliminasi Istilah "Angle"**:
    - Menghapus subtitle `Multi-Angle per Kategori` pada header dokumentasi foto kamar.
    - Mengubah badge jumlah foto dari `X Foto / Angle` menjadi `X Foto`.
    - Mengubah label tombol tambah dari `+ Tambah Angle` menjadi `+ Tambah Foto`.
    - Mengubah tooltip tombol hapus foto menjadi `Hapus foto ini`.
  * **Pembersihan Teks Penjelasan (Deskripsi Ringkas & Bersih)**:
    - Menghapus paragraf penjelasan panjang `Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing...` di seluruh form kamar agar tampilan lebih compact dan elegan.
  * **Caption Foto Dinamis Berdasarkan Nama Kategori**:
    - Mengubah caption overlay thumbnail foto dari `Angle 1`, `Angle 2`, dst. menjadi format kategori + nomor urut (contoh: `Interior 1`, `Interior 2`, `Jendela Luar 1`, `Kamar Mandi 1`, dst.).
  * **Cakupan Penerapan**:
    - Form Tambah Kamar Baru (`temporaryRoom`).
    - Accordion Kamar Terdaftar (`renderRoomEditor`).
    - Dokumentasi Foto Area Umum (Step 1).
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build `cmd /c "npm run build"` lulus 100% — 0 TypeScript compilation error (exit code 0).

### 59. Pop-Up Konfirmasi Hapus Kamar — WizardFlow Step 2 AgentDashboard (Agustus 2026)
- **Masalah**: Tombol hapus (ikon Trash2) pada card kamar di WizardFlow Step 2 langsung menghapus data kamar tanpa konfirmasi, berisiko menghapus data secara tidak sengaja.
- **Implementasi & Perbaikan**:
  * Tambah state `deleteRoomConfirm: { open: boolean; idx: number | null }` di `AgentDashboard.tsx`.
  * Modifikasi `onClick` tombol Trash2: dari langsung filter+delete menjadi hanya membuka state modal (`setDeleteRoomConfirm({ open: true, idx })`).
  * Tambah komponen modal konfirmasi (`position: fixed`, z-index 9999) yang menampilkan:
    - Ikon Trash2 dalam lingkaran merah
    - Nama kamar yang akan dihapus (atau nomor urut jika nama kosong)
    - Tombol **Batal** → tutup modal tanpa aksi
    - Tombol **Ya, Hapus** → eksekusi hapus + update `activeRoomIdx` + tutup modal
  * Klik backdrop (area luar modal) juga menutup modal (Batal).
  * Logika hapus (`filter roomTypes`, adjust `activeRoomIdx`) dipindah ke dalam handler tombol Ya, Hapus.
- **File Tersentuh**: `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build `tsc` lulus 100% — 0 TypeScript error (exit code 0).

### 58. Eliminasi FOUT (Flash of Unstyled Text) Ikon & Migrasi ke Bundled Pure Vector SVG (Lucide React) di AgentDashboard (Agustus 2026)
- **Masalah**: Tampilan kartu tugas sempat memunculkan teks mentah seperti `calendar_today`, `schedule`, `bolt`, `phone`, `location_on` sesaat setelah skeleton loader selesai (FOUT/Flash of Unstyled Text) karena browser menunggu unduhan file font dari CDN Google Fonts (`fonts.googleapis.com`).
- **Implementasi & Perbaikan**:
  * **Migrasi Penuh ke Bundled Pure Vector SVG (`lucide-react`)**:
    - Mengganti seluruh 100% pemanggilan tag ligature Google Font `<span className="material-symbols-outlined">` pada `AgentDashboard.tsx` dengan komponen vector SVG React dari `lucide-react` (`Calendar`, `Clock`, `Zap`, `Phone`, `MapPin`, `Navigation`, `CheckCircle2`, `Trash2`, `Plus`, `Bed`, `Bath`, `Fan`, `ImagePlus`, `ChevronDown`, dll.).
    - Semua ikon kini terkompilasi langsung di dalam bundle JavaScript lokal aplikasi.
  * **Keuntungan & Hasil**:
    - ✅ **0 Network Request untuk Ikon**: Tidak ada lagi proses unduhan font terpisah dari server luar.
    - ✅ **0 FOUT (Bebas Teks Mentah)**: Ikon langsung muncul secara instan **0 milidetik** bersamaan dengan render kartu data.
    - ✅ **Transisi Mulus**: Tampilan kartu data tampil sempurna dan optimal tanpa kedipan teks ikon.
  * Build verification `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% tanpa error (exit code 0).

### 57. Arsitektur Structured Categorized Photos (Record<string, string[]>) untuk Isolasi Total Foto Kamar (Agustus 2026)
- **Permintaan & Masalah**: Terjadi kasus foto tertukar, berpindah kategori, atau duplikat akibat *Index Drift* pada dua array paralel terpisah (`images` dan `photoCategories`). Diperlukan arsitektur penyimpanan data foto yang konkrit, terisolasi, dan aman untuk produksi jangka panjang.
- **Implementasi & Perbaikan**:
  * **Arsitektur Objek Terstruktur (`categorized_photos`)**:
    - Mengubah model penyimpanan foto kamar menjadi key-value dictionary mandiri:
      `categorized_photos: { "Interior Kamar *Wajib": ["url1", "url2"], "Jendela Luar": ["url3"], ... }`.
    - Setiap kategori memiliki bucket URL tersendiri yang berdiri sendiri.
    - Menambah/menghapus foto pada satu kategori **100% terisolasi** dan mustahil menggeser, menimpa, atau mencemari foto di kategori lain.
  * **Helper Normalisasi & Kompatibilitas Database**:
    - `getRoomCategorizedPhotos`: Mengekstrak/menormalisasi data kamar baik dari format baru maupun format lama tanpa kehilangan foto.
    - `exportCategorizedPhotos`: Menghasilkan array flat `images` dan `photoCategories` secara otomatis untuk kompatibilitas penuh dengan Supabase, Dashboard Admin (`KostManagerManagement.tsx`), dan halaman publik (`KostDetail.tsx`).
  * **Penerapan Menyeluruh di UI**:
    - Diterapkan pada Accordion Kamar (`renderRoomEditor`), Form Tambah Kamar Baru (`temporaryRoom`), dan fungsi sinkronisasi fasilitas (`updateRoomFacilitiesWithPhotos` & `updateTemporaryRoomFacilitiesWithPhotos`).
  * Build verification `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% tanpa error (exit code 0).

### 56. Perbaikan Bug Hilangnya Foto Terunggah Saat Mengubah Checklist Fasilitas Kamar (Agustus 2026)
- **Masalah**: Ketika surveyor telah mengunggah foto pada suatu kategori (misalnya *Interior Kamar*), kemudian kembali ke atas untuk mencentang fasilitas lain (misalnya *Jendela Luar*, *Kamar Mandi*, atau *AC*), foto yang telah diunggah sebelumnya tiba-tiba menghilang.
- **Penyebab**:
  * Pada fungsi `updateRoomFacilitiesWithPhotos` dan `updateTemporaryRoomFacilitiesWithPhotos`, terdapat logika pemetaan 1-ke-1 lama (`dynamicCats.map(cat => oldImages[oldCats.indexOf(cat)])`) yang me-reset dan menimpa array `images` setiap kali `roomFacilities` diperbarui.
- **Perbaikan**:
  * Menghapus pemetaan destruktif tersebut dan menjaga array `images` serta `photoCategories` tetap 100% utuh saat checklist fasilitas kamar dicentang/diubah.
  * Mengintegrasikan auto-update label interior kamar (`*Wajib` vs `(Opsional)`) ketika status kamar beralih antara *Terisi* dan *Kosong* tanpa merusak file foto.
  * Build verification `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% tanpa error (exit code 0).

### 55. Sistem Multi-Foto (Multi-Angle) per Kategori Dokumentasi Foto (Agustus 2026)
- **Permintaan**: Mengizinkan surveyor untuk mengunggah lebih dari satu foto untuk satu kategori/fasilitas yang sama (misalnya untuk *Interior Kamar*, surveyor dapat mengambil beberapa foto dari sudut/angle yang berbeda seperti sudut pintu masuk, sudut jendela, dan sudut meja kerja).
- **Implementasi & Perbaikan**:
  * **Arsitektur UI Grouped Category Cards**:
    - **Step 2 (Accordion Kamar & Tambah Kamar Baru)**: Setiap kategori foto aktif (wajib, dinamis dari fasilitas, maupun kustom) disajikan sebagai kontainer kartu kategori tersendiri lengkap dengan header berikon, nama kategori, dan badge counter jumlah foto (`X Foto / Angle`).
    - **Step 1 (Dokumentasi Area Umum & Fasilitas Properti)**: Diterapkan pola kartu grup yang sama untuk area publik (Bangunan Depan, Koridor, Parkiran, Dapur Bersama, dll.).
  * **Galeri Thumbnail Angle & Tombol Tambah**:
    - Menampilkan seluruh foto yang diunggah dalam galeri thumbnail rapi dengan badge penomoran sudut (`Angle 1`, `Angle 2`, dst.).
    - Tombol hapus individual (`✕`) pada setiap thumbnail untuk menghapus sudut foto tertentu tanpa merusak foto sudut lainnya atau menghapus kategori.
    - Slot upload interaktif bertuliskan `+ Tambah Angle` / `+ Unggah Foto [Kategori]` yang mendukung pemilihan banyak file sekaligus (`input type="file" multiple`) maupun kamera HP.
  * **100% Backward Compatible**:
    - Tetap menyimpan data dalam array flat `images` dan `photoCategories` sehingga Dashboard Admin (`KostManagerManagement.tsx`), Halaman Publik (`KostDetail.tsx`), dan query Supabase langsung membaca seluruh foto dan label kategori tanpa perlu migrasi skema tabel database.
  * Build verification `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% tanpa error (exit code 0).

### 54. Perbaikan Syntax Error Babel & Posisi Deklarasi Hook pada AgentDashboard (Agustus 2026)
- **Masalah**: Muncul error Vite React-Babel `Unexpected token, expected "," (7589:28)` dan error deklarasi variabel `Block-scoped variable 'kmListingForm' used before its declaration` pada `AgentDashboard.tsx`.
- **Penyebab**:
  * Pada baris ~7113, terdapat penutupan berlebih `})()})}` pada blok IIFE `temporaryRoom` yang merusak hierarki tag JSX Step 2 dan navigation bar di bawahnya.
  * Hook `useEffect` auto-sync Step 1 diletakkan sebelum deklarasi state `const [kmListingForm, setKmListingForm] = useState(...)`.
- **Perbaikan**:
  * Mengoreksi penutupan tag JSX di akhir blok `temporaryRoom` menjadi `})()}`, `</div>`, dan `)}` yang berpasangan presisi dengan `<div className="space-y-6">` dan `{kmStep === 2 && (`.
  * Memindahkan deklarasi hook `useEffect` sinkronisasi fasilitas Step 1 ke posisi setelah deklarasi state `kmListingForm`.
  * Menjalankan build verifikasi `vite build` di `functions/public/` dan sukses terkompilasi 100% tanpa error (exit code 0).

### 53. Sistem Dinamis Slot Input Foto Dokumentasi Berdasarkan Fasilitas Terpilih (Agustus 2026)
- **Permintaan**: Pada formulir pendataan KostManager (`AgentDashboard.tsx`), sistem slot input foto dokumentasi dibuat dinamis. Ketika fasilitas tertentu dicentang atau ditambahkan (baik fasilitas area umum/properti pada Step 1 maupun fasilitas kamar pada Step 2), otomatis muncul slot input kategori foto dokumentasi yang bersesuaian tanpa menghilangkan foto yang telah diunggah sebelumnya.
- **Implementasi & Perbaikan**:
  * **Helper Dynamic Categories Generator**:
    - `computeDynamicPublicPhotoCategories`: Menghasilkan kategori foto Step 1 (Dasar: *Bangunan Depan*, *Koridor*, *Lingkungan*; Tambahan dinamis: *Parkiran*, *Dapur Bersama*, *Ruang Tamu*, *WC Umum*, *CCTV*, *Laundry*, serta fasilitas kustom).
    - `computeDynamicRoomPhotoCategories`: Menghasilkan kategori foto Step 2 (Dasar: *Interior Kamar *Wajib* atau *Interior Kamar (Opsional)* jika terisi; Tambahan dinamis: *Kamar Mandi*, *Dapur Dalam*, *Tempat Tidur*, *Lemari / Storage*, *Meja Belajar*, *AC*, *Kipas Angin*, *Jendela Luar*, *Water Heater*, serta fasilitas kamar kustom).
  * **Auto-Sync Step 1 (Area Umum)**: Mengintegrasikan `useEffect` sinkronisasi fasilitas properti ke `photoCategories` dan array `images` tanpa data loss.
  * **Auto-Sync Step 2 (Kamar Accordion & Tambah Kamar Baru)**:
    - Mengintegrasikan fungsi sinkronisasi fasilitas ke kategori foto pada tombol status (*Terisi* vs *Kosong*), switch *Kosongan* vs *Furnished*, checkbox fasilitas standar, tag kelengkapan kustom, serta penambahan kategori manual (*+ Foto Kamar*).
    - Menambahkan input field *Detail Kamar* (Nomor Kamar, Lantai, Tipe Kamar) di dalam accordion editor kamar yang sedang diedit.
  * Build verification `npm run build` (`tsc`) lulus 100% tanpa TypeScript/JSX error (exit code 0).

### 52. Penyempurnaan Label Kategori Foto Kamar & Pemetaan Slot Foto (Agustus 2026)
- **Masalah**: Label foto kamar pada kartu kamar di Tab 3 menggunakan nomor urut generic (`Foto Kamar 1`, `Foto Kamar 2`), yang menimbulkan kesalahpahaman seolah-olah foto tersebut adalah milik kamar lain yang dicampur dalam satu tempat.
- **Perbaikan**:
  * **`KostManagerManagement.tsx`**: Mengganti penamaan fallback menjadi nama bagian ruangan yang jelas (*Interior Kamar*, *Kamar Mandi Dalam*, *Tempat Tidur*, *Lemari / Penyimpanan*, *Foto Tambahan*). Menjaga mapping index slot foto asli sehingga slot yang dilewati tidak menggeser kategori foto lainnya.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 51. Penampilan Dokumentasi Foto Kamar pada Tab Tipe Kamar & Fasilitas di Dashboard Admin (Agustus 2026)
- **Masalah**: Foto-foto kondisi kamar yang telah diunggah surveyor saat pendataan tidak muncul pada Tab 3 ("Tipe Kamar & Fasilitas") saat dilakukan peninjauan oleh Admin di Dashboard Admin.
- **Perbaikan**:
  * **`KostManagerManagement.tsx`**: Menambahkan normalisasi foto kamar (`room.images || room.image_urls || room.photos`) dan merender galeri thumbnail foto kondisi kamar lengkap dengan label kategorinya (*Kamar Tidur*, *Kamar Mandi Dalam*, *Jendela*, dll.) pada setiap kartu tipe kamar di Tab 3.
  * Mengintegrasikan setiap foto kamar dengan penampil **Lightbox Modal Zoom** layar penuh beresolusi tinggi saat foto diklik.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 50. Perbaikan Penyimpanan Tanda Tangan Digital & Salinan Syarat Ketentuan KostManager (Agustus 2026)
- **Masalah**: Tanda tangan digital yang digambar agen di Step 3 tidak muncul di Dashboard Admin ("Tanda tangan digital belum terlampir") dan Tab Legalitas belum memuat salinan lengkap teks Syarat & Ketentuan (*Terms and Conditions*) yang disepakati mitra.
- **Perbaikan**:
  * **`AgentDashboard.tsx`**: Memperbarui `handleSaveKostManagerListing` agar secara eksplisit menyertakan `signature_data: signatureData` saat meng-update `kostmanager_surveys` dan `survey_requests`. Menambahkan restorasi otomatis tanda tangan saat membuka formulir survey.
  * **`KostManagerManagement.tsx`**: Memperbarui query `openReviewModal` agar mengambil `signature_data` dari `kostmanager_surveys` dan fallback relasi. Menyajikan dokumen salinan resmi Syarat & Ketentuan Kemitraan KostManager (Auto-Pilot) 4 pasal perjanjian lengkap dengan stempel verifikasi digital.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 49. Pembaruan Protokol Kerja 2-Fase AI Agent (Pemisahan Plan & Walkthrough) (Agustus 2026)
- **Permintaan**: Mengatur aturan workspace (*rules MD*) agar dokumen `IMPLEMENTATION_PLAN.md` dan `WALKTHROUGH.md` tidak dikeluarkan dalam satu proses yang bersamaan. Setiap instruksi fitur baru wajib disajikan dalam `IMPLEMENTATION_PLAN.md` terlebih dahulu, lalu Agent wajib berhenti dan menunggu persetujuan (ACC/Proceed) dari User sebelum mengeksekusi kode dan menerbitkan `WALKTHROUGH.md`.
- **Perubahan**:
  * Membuat dan memperbarui file aturan baku:
    - [`.agents/rules/protocol.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/.agents/rules/protocol.md)
    - [`GEMINI.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/GEMINI.md)
    - [`AGENTS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/AGENTS.md)
    - [`C:\Users\ZHULL\.gemini\config\rules\user_global.md`](file:///C:/Users/ZHULL/.gemini/config/rules/user_global.md)
  * Menegaskan siklus 2-Fase:
    1. **Fase 1 (Perencanaan)**: Agent hanya menyusun `IMPLEMENTATION_PLAN.md` dengan `RequestFeedback: true`, lalu berhenti menunggu ACC User.
    2. **Fase 2 (Eksekusi & Walkthrough)**: Setelah di-ACC, Agent mengeksekusi modifikasi kode, verifikasi build, mencatat di `PROGRESS.md`, dan menerbitkan `WALKTHROUGH.md`.

### 48. Sistem Peninjauan Hasil Pendataan KostManager Lengkap & Komprehensif (Agustus 2026)
- **Permintaan**: Menambahkan antarmuka inspeksi dan review hasil pendataan lapangan KostManager secara lengkap, mendalam, dan modern pada Dashboard Admin (`KostManagerManagement.tsx`), bukan antarmuka generik sederhana (AI slop).
- **Perbaikan**:
  * **Card Action & Visual Highlight**: Kartu berstatus `PENDING_ONBOARDING` / `SUBMITTED` kini memiliki highlight border emerald glowing, banner informasi dinamis, serta tombol aksi utama **`"🔍 Tinjau Hasil Pendataan Lengkap"`**.
  * **Review Modal Menyeluruh (`ReviewKostManagerModal`)**:
    - **Header & Quick Chat**: Tampilan profil mitra + tombol langsung chat WhatsApp, surveyor lapangan, dan tombol tautan Google Drive.
    - **Tab 1 (🏢 Info & Lokasi GPS)**: Deskripsi properti, titik koordinat Latitude/Longitude, Google Maps iframe embed, landmark/kampus terdekat berjarak, fasilitas umum berikon, dan peraturan kost.
    - **Tab 2 (📸 Galeri Foto Berkategori)**: Filter kategori foto (Bangunan Depan, Koridor, Kamar, Parkiran, dsb.) + **Lightbox Modal Zoom** untuk melihat foto layar penuh resolusi tinggi.
    - **Tab 3 (🛏️ Tipe Kamar & Inventaris)**: Kartu spesifikasi tipe kamar (ukuran, harga sewa, jumlah ketersediaan kamar, fasilitas kamar tidur & kamar mandi).
    - **Tab 4 (✍️ Legalitas & Tanda Tangan)**: Kanvas render tanda tangan digital asli mitra/surveyor berformat sertifikat legalitas, timestamp pendataan, dan klausul persetujuan kemitraan.
    - **Sticky Action Bar**: Tombol aksi cepat **`"🚀 Setujui & Aktifkan Layanan Auto-Pilot (LIVE)"`** yang secara otomatis mengaktifkan status di `kostmanager_requests`, `properties`, `kostmanager_surveys`, dan `survey_requests`.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 47. Perbaikan Sinkronisasi Status Submit Survey KostManager Agen & Admin (Agustus 2026)
- **Masalah**: Setelah agen menekan "Selesaikan & Submit", status kartu di Dashboard Agen tetap "SEDANG SURVEY" dan di Dashboard Admin tetap "SEDANG DISURVEY". Hal ini terjadi karena `isEditingKostManager.id` mereferensikan tabel `kostmanager_surveys` (bukan `survey_requests`), sehingga query update `survey_requests` tidak cocok, sementara tabel `kostmanager_surveys` & `kostmanager_requests` tidak ter-update dengan presisi.
- **Perbaikan**:
  * **`AgentDashboard.tsx`**: Meng-update secara eksplisit 3 tabel database saat submit: `kostmanager_surveys` (`status: 'SUBMITTED'`), `kostmanager_requests` (`status: 'PENDING_ONBOARDING'`), dan `survey_requests` (`status: 'SUBMITTED'`).
  * **`adminService.ts`**: Memperbarui `getAdminSurveyRequests()` agar mengembalikan `computedStatus = 'SUBMITTED'` apabila `ks.status === 'SUBMITTED'` atau `ks.request?.status === 'PENDING_ONBOARDING'`.
  * **`KostManagerManagement.tsx`**: Memperbarui badge & label status di Dashboard Admin untuk `PENDING_ONBOARDING` / `SUBMITTED` menjadi **`"Menunggu Onboarding Admin"`** (Hijau Emerald) dan memasukkannya ke tab filter **`📥 Butuh Verifikasi`**.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 46. Update UI Kartu Pendataan KostManager Setelah Submit ke Admin (Agustus 2026)
- **Masalah**: Setelah agen survey menyelesaikan pendataan dan menekan submit, kartu pendataan KostManager pada Dashboard Agen tidak memberikan sinyal visual yang cukup jelas bahwa data telah dikirim ke Admin. Teks tombol sebelumnya ("Lihat Detail Listing") juga membingungkan agen karena tidak menunjukkan bahwa data listing masih bisa diedit.
- **Perbaikan**:
  * **Status Badge**: Mengubah badge status `SUBMITTED` menjadi warna **Emerald/Teal** bertuliskan **`"DATA DIKIRIM (MENUNGGU TINJAUAN ADMIN)"`**.
  - **Informative Banner**: Menambahkan banner pemberitahuan berwarna Emerald di kartu `AgentDashboard.tsx` yang menjelaskan bahwa data telah dikirim ke Admin dan agen tetap dapat mengeditnya kapan saja.
  - **Action Button**: Mengubah label tombol aksi utama pada kartu menjadi **`"✏️ Edit & Perbarui Data Listing"`**.
  - **Modal Step 3 Submit Text**: Mengubah label tombol submit modal Step 3 saat mengedit survey status `SUBMITTED` menjadi **`"🔄 Perbarui & Kirim Ulang ke Admin"`**.
  - Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 45. Perbaikan ReferenceError fetchedUser is not defined pada AgentDashboard (Agustus 2026)
- **Masalah**: Muncul error runtime `Uncaught (in promise) ReferenceError: fetchedUser is not defined at openKostManagerListing (AgentDashboard.tsx:1391)` saat agen survey menekan tombol membuka listing.
- **Perbaikan**:
  * Memindahkan deklarasi `let fetchedUser: any = null;` ke luar dan sebelum blok `try { ... }` pada fungsi `openKostManagerListing` di [`AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx).
  * Variabel `fetchedUser` sekarang dapat diakses secara merata di seluruh alur fungsi `openKostManagerListing`.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 44. Perbaikan PostgreSQL Error 23502 (mitra_id NOT NULL constraint) pada AgentDashboard (Agustus 2026)
- **Masalah**: Gagal menyimpan listing properti dengan pesan `Error saving listing: {code: '23502', message: 'null value in column "mitra_id" of relation "properties" violates not-null constraint'}` saat ID mitra bernilai kosong `""`.
- **Perbaikan**:
  * Membuat fungsi helper `resolveValidOwnerUid` di [`AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) yang memvalidasi UUID dari form, request survey, profil mitra, relasi user, hingga ID agen yang sedang login.
  * Menggunakan `resolveValidOwnerUid` pada `saveKostManagerDraftToDatabase`, `handleSaveKostManagerListing`, dan `openKostManagerListing` untuk menjamin `mitra_id` dan `owner_uid` selalu terisi UUID valid dan tidak pernah NULL.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 43. Perbaikan Resolusi Profil Pemilik/Mitra Asli di AgentDashboard (Agustus 2026)
- **Masalah**: Bagian "Data Pemilik / Mitra" pada formulir survey agent menampilkan data dummy `Budi Santoso`, `budi.santoso@email.com`, dan `+62 812-3456-7890`.
- **Perbaikan**:
  * Menghapus seluruh nilai fallback dummy `Budi Santoso` di [`AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx).
  * Mengimplementasikan *Multi-Level Owner Profile Resolution* untuk membaca profil pemilik dari tabel `users` (kolom `name` & `full_name`), relasi `properties`, data `req.user`, dan metadata transaksi (`ownerName`, `ownerPhone`, `ownerEmail`).
  * Jika data belum diisi pengguna, menampilkan placeholder bersih seperti `-` atau `Pemilik / Mitra Kost`.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 42. Perubahan Teks Tombol Lokasi GPS Menjadi 'Gunakan Lokasi Saya Saat Ini' (Agustus 2026)
- **Permintaan**: Mengubah label teks tombol lokasi GPS di bawah preview peta mini agar lebih intuitif.
- **Perbaikan**:
  * Mengubah label teks tombol dari `KUNCI KOORDINAT PRESISI SAAT INI` menjadi **`Gunakan Lokasi Saya Saat Ini`** pada `AgentDashboard.tsx`.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 41. Penanganan & Optimasi Warning Browser Touch Intervention Google Maps (Agustus 2026)
- **Masalah**: Muncul pesan peringatan `[Intervention] Ignored attempt to cancel a touchstart/touchmove/touchend event...` pada konsol browser saat peta disentuh/di-scroll pada simulasi mode HP.
- **Penjelasan & Perbaikan**:
  * Peringatan ini **bukan error/crash**, melainkan *Browser Intervention Warning* dari Chrome/Chromium saat Google Maps JS API mencoba memanggil `preventDefault()` pada gestur touch yang bertipe `cancelable: false` agar scroll halaman tetap mulus (60fps).
  * Menambahkan atribut CSS `touch-action: none;` pada div kontainer peta Google Maps di `AgentDashboard.tsx` dan `KostFormMitra.tsx` untuk menginformasikan browser bahwa gesture peta dikendalikan secara khusus.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 40. Fitur Pop-Up Grafis Konfirmasi Perubahan Titik Lokasi Peta (Agustus 2026)
- **Masalah**: Sentuhan atau klik tidak sengaja pada area preview peta mini langsung menggeser koordinat properti secara otomatis.
- **Perbaikan**:
  * Menambahkan **Pop-Up Grafis Konfirmasi** (`pendingLocationChange`) pada `AgentDashboard.tsx` dan `KostFormMitra.tsx`.
  * Saat peta diklik atau marker diseret, titik lokasi tidak langsung berpindah. Sistem menampilkan modal grafis interaktif berisi perbandingan **Lokasi Saat Ini** vs **Titik Baru (Dipilih)** dengan tombol **"Batal (Tetap)"** dan **"Ya, Ubah Lokasi"**.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 39. Penyederhanaan Tombol Pop-Up Peta di AgentDashboard (Agustus 2026)
- **Masalah**: Jumlah tombol pemicu pop-up peta terlalu banyak (tombol atas, tombol melayang di preview, dan tombol bawah), membuat tampilan area Lokasi GPS padat.
- **Perbaikan**:
  * Menghapus tombol pemicu pop-up di samping label header "Lokasi GPS".
  * Mempertahankan **hanya 1 tombol tunggal** yang melayang di preview peta: **"Buka Peta Pop-up (Layar Penuh)"**.
  * Mengembalikan tombol bawah menjadi 1 tombol tunggal penuh: **"Kunci Koordinat Presisi Saat Ini"**.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 38. Perbaikan Gestur Peta 1-Jari (gestureHandling: 'greedy') (Agustus 2026)
- **Masalah**: Saat membuka peta pada simulasi mode HP (DevTools) atau perangkat seluler, penggeseran peta dengan 1 jari menampilkan peringatan *"Use two fingers to move the map"*.
- **Perbaikan**:
  * Menambahkan opsi `gestureHandling: 'greedy'` pada seluruh 7 konstruktor `new google.maps.Map` di 5 file (`AgentDashboard.tsx`, `KostFormMitra.tsx`, `Dashboard.tsx`, `KostManagerPortal.tsx`, `KostManagerLanding.tsx`).
  * Peringatan 2 jari hilang 100% dan penggeseran peta + marker dapat dilakukan secara responsif cukup dengan **1 jari**.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 37. Fitur Modal Pop-Up Peta Layar Penuh (Fullscreen Map Picker) (Agustus 2026)
- **Masalah**: Preview peta mini pada formulir pendataan berukuran kecil (~160px), sehingga gestur menggeser/zoom pada peta sering terganggu oleh scroll halaman formulir. Tombol-tombol kontrol Google Maps juga memakan sebagian besar area peta mini.
- **Perbaikan**:
  * **`AgentDashboard.tsx`**: Menambahkan tombol **"🔍 Perbesar Peta (Pop-up)"** dan **"Peta Layar Penuh"** di Lokasi GPS. Mengimplementasikan Modal Pop-Up Layar Penuh (`fixed inset-0 z-[99999]`) berukuran tinggi 92vh, dilengkapi Search Bar Autocomplete Google Places, tombol quick locator "Lokasi GPS Saya", marker draggable dengan animasi DROP, pembacaan koordinat real-time, dan tombol "Kunci & Gunakan Lokasi Ini".
  * **`KostFormMitra.tsx`**: Mengintegrasikan modal pop-up layar penuh berfitur sama pada komponen `MapPicker` formulir mitra biasa.
  * Build verification `npm run build` lulus 100% tanpa TypeScript error (`tsc` exit code 0).

### 36. Perbaikan Maps Embed Preview Kartu KostManager (Agustus 2026)
- **Masalah**: Preview peta pada kartu pendataan KostManager di Dashboard Agen (`AgentDashboard.tsx`) menampilkan pesan error Google Maps Platform rejected request karena menyematkan iframe dengan endpoint `maps/embed/v1/place` yang memerlukan pengaktifan layanan *Maps Embed API* terpisah di Google Cloud Console.
- **Perbaikan**:
  * Mengganti URL `src` iframe di `AgentDashboard.tsx` dari `https://www.google.com/maps/embed/v1/place?...` menjadi URL standar `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`.
  * Format ini konsisten dengan `KostDetail.tsx` dan `KostManagerManagement.tsx` dan langsung merender lokasi peta tanpa membutuhkan API activation tambahan di GCP Console.
  * Build verification `npm run build` lulus 100% tanpa error (`tsc` exit code 0).

### 35. Migrasi Peta Leaflet/OpenStreetMap → Google Maps Platform (Agustus 2026)
- **Masalah**:
  1. Semua komponen peta di aplikasi menggunakan Leaflet + OpenStreetMap yang kurang akurat untuk POI (Point of Interest) lokal Indonesia, sehingga nama tempat sering tidak dikenal atau tidak lengkap.
  2. Nominatim (reverse geocoder OSM) kadang gagal menemukan nama area/kecamatan lokal yang familiar di Indonesia.
  3. Terdapat inkonsistensi: kartu pesanan KostManager di dashboard admin sudah menggunakan Google Maps embed, sementara semua komponen picker masih Leaflet.
- **Perbaikan**:
  * **`index.html`**: Menghapus script Leaflet CSS + JS (`unpkg.com/leaflet@1.9.4`). Hanya menyisakan Google Maps JS API (`libraries=places`) yang sudah tersedia.
  * **`Dashboard.tsx`**: Komponen `LocationPicker` (form tambah/edit properti admin & mitra) dimigrasi ke `google.maps.Map`, `google.maps.Marker` draggable, dan `google.maps.Geocoder` untuk reverse geocoding. Ditambahkan `google.maps.places.Autocomplete` pada search bar.
  * **`KostManagerPortal.tsx`**: Komponen `LocationPicker` dimigrasi ke Google Maps dengan pola yang sama. Height dipertahankan 300px.
  * **`KostManagerLanding.tsx`**: Komponen `LocationPicker` (form registrasi KostManager publik) dimigrasi. Height 220px dipertahankan.
  * **`AgentDashboard.tsx`** (2 instance):
    - **Landmark map picker** (`kmLandmarkMapInstance`): `L.map` → `google.maps.Map`, click listener diperbarui ke format `e.latLng.lat()/lng()`.
    - **Main GPS picker** (`kmMapInstance`): Sama, ditambah listener `dragend` pada marker (sebelumnya tidak ada di implementasi Leaflet lama), sehingga drag marker juga memperbarui `kmListingForm.location`.
  * **Memory management**: Cleanup `useEffect` menggunakan `google.maps.event.clearInstanceListeners()` untuk mencegah memory leak, menggantikan `.remove()` Leaflet.
  * **Build verification**: `npm run build` lulus dengan exit code 0, 2526 modul, tanpa TypeScript error.

### 34. Perbaikan Penyerapan Data Landmark & Persistensi Draf Otomatis KostManager (Agustus 2026)
- **Masalah**:
  1. Data landmark (kampus terdekat) yang sudah diisi oleh mitra biasa tidak terisi secara otomatis ketika surveyor membuka wizard onboarding KostManager.
  2. Data draf kamar rahasia yang sudah diinput surveyor (seperti nomor "101") berisiko hilang ketika modal ditutup secara tidak sengaja atau halaman direfresh karena draf hanya disimpan di local storage peramban.
- **Perbaikan**:
  * **API Mapping**: Menambahkan kolom `property_id` pada select subquery di `getAdminSurveyRequests` dan memetakannya langsung sebagai `kost_id` di frontend.
  * **Direct Resolution**: Memperbarui `openKostManagerListing` di `AgentDashboard.tsx` agar langsung menggunakan `req.kost_id` sebagai `propertyIdToFetch`, melompati kueri redundan ke tabel `transactions`.
  * **Auto-Heal Drafts**: Menambahkan filter restrukturisasi pada draf lokal di mana jika draf mendeteksi array `campuses` kosong namun properti database aslinya memiliki data, campuses tersebut secara otomatis digabungkan kembali ke draf agar datanya tidak hilang.
  * **Penyimpanan Draf Database**:
    - Membuat fungsi `handleSaveDraftDirectly` untuk mengupsert data draf survei secara instan ke tabel `properties` (dengan status `'draft'`) dan tabel `mitra_kostmanager` secara online di Supabase.
    - Mengintegrasikan penyimpanan otomatis draf database pada transisi step navigasi, ketika tombol "Simpan Kamar Baru" ditekan, dan ketika surveyor menutup modal.
    - Menambahkan tombol manual "Simpan Draf" (warna emerald) di header modal dengan konfirmasi alert.
    - Menambahkan pemulihan otomatis array `roomTypes` dari database `dbKmProp` ke draf lokal apabila terdeteksi kosong.

### 33. Perbaikan Sinkronisasi Status Penugasan Surveyor KostManager & Pembersihan Tombol Kelola (Agustus 2026)
- **Masalah**:
  1. Klik tombol "Tugaskan" agen pada Dashboard Admin tidak mengubah status orderan KostManager dan tugas tidak masuk ke tab "Permintaan" di Dashboard Agen. Masalah ini disebabkan oleh kegagalan operasi INSERT pada tabel `kostmanager_surveys` dengan status `'PENDING_ASSIGNMENT'` yang melanggar check constraint `kostmanager_surveys_status_check` (hanya mengizinkan `'SURVEYING'`, `'SUBMITTED'`, `'APPROVED'`).
  2. Tombol "Kelola" di kartu orderan KostManager pada Dashboard Admin membingungkan alur operasional karena penugasan agen sudah dipindahkan langsung secara inline di dalam kartu.
  3. Adanya bug di mana kolom `status` pada relasi `request` tidak ditarik di subquery `getAdminSurveyRequests` (`adminService.ts`). Hal ini mengakibatkan `ks.request?.status` bernilai `undefined` saat runtime, yang menyebabkan kegagalan pemetaan status dinamis ke `'PENDING_ASSIGNMENT'` sehingga kartu pesanan baru langsung masuk ke tab **Aktif** agen secara prematur.
- **Perbaikan**:
  * **Penyelesaian Check Constraint & Pemetaan Dinamis**: Memperbarui status insert awal pada tabel `kostmanager_surveys` menjadi `'SURVEYING'` yang valid agar lolos check constraint database.
  * **Perbaikan Subquery Field Status**: Menambahkan kolom `status` di subquery seleksi data `request` pada fungsi `getAdminSurveyRequests` (`adminService.ts`) agar nilai status `'AGENT_ASSIGNED'` terbaca dengan benar oleh logika pemetaan.
  * **Status Hybrid Dinamis**: Menambahkan logika pemetaan dinamis di fungsi `getAdminSurveyRequests` (`adminService.ts`). Jika status survei KostManager adalah `'SURVEYING'` dan status request utama `kostmanager_requests` masih `'AGENT_ASSIGNED'`, status dipetakan menjadi `'PENDING_ASSIGNMENT'`. Hal ini memicu tugas masuk secara andal ke tab **Permintaan (Pending)** agen.
  * **Alur Terima & Tolak Tugas**: Menyempurnakan fungsi `updateSurveyRequest` (`adminService.ts`) untuk menangani respon dari surveyor:
    - **Diterima**: Mengubah status request KostManager menjadi `'SURVEYING'` sehingga berpindah ke tab **Aktif** surveyor.
    - **Ditolak**: Menghapus baris survei terkait dari `kostmanager_surveys` dan mengembalikan status request utama ke `'PENDING_ASSIGNMENT'` agar dapat ditugaskan ulang oleh Admin.
  * **Pembersihan UI & Tombol Kelola**: Menghapus tombol "Kelola" secara permanen dari kartu orderan KostManager di `KostManagerManagement.tsx` melalui penyesuaian skrip pembangunan layout `apply_admin_premium_layout.js`.

### 32. Restorasi Desain Grid Premium & Tab Filter Admin KostManager (Agustus 2026)
- **Masalah**: Desain premium kartu dan pipeline tab status filter di `KostManagerManagement.tsx` sempat ter-reset ke layout tabel horizontal bawaan karena script `reapply_all_changes_chronologically.js` melakukan reset/checkout file tersebut ke status HEAD bersih tanpa mengaplikasikan kembali modifikasi UI tersebut.
- **Perbaikan**:
  * Menulis script otomatis `apply_admin_premium_layout.js` di folder `functions/scratch/` yang bertugas menyuntikkan state tab filter, data modal profil mitra, Google Maps embed mini, koordinat GPS dinamis, inline actions (dropdown penunjukan agen langsung pada kartu), serta merombak total rendering tabel menjadi layout grid responsif (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) premium.
  * Mendaftarkan script tersebut ke dalam array pengeksekusi di `reapply_all_changes_chronologically.js` untuk menjamin tidak ter-reset kembali di masa depan.
  * Mendeklarasikan state peninjauan (`selectedPropertyDetails`, `loadingProperty`, `showReviewAccordion`) secara langsung di script agar selalu terdefinisi andal pada dashboard admin.

### 31. Arsitektur Properti Hybrid (Mitra Biasa vs KostManager) & Perbaikan Koordinat Peta (Agustus 2026)
- **Masalah**: 
  1. Properti yang berhenti berlangganan atau tidak aktif KostManager (`is_managed = false`) tidak dapat fallback secara aman menggunakan tipe kamar global di halaman detail kost, karena data kamar fisik dipecah secara mendalam di tabel `rooms`.
  2. Preview koordinat peta di kartu tugas dashboard agen (`AgentDashboard.tsx`) menampilkan titik lokasi yang salah (milik properti lain dari owner yang sama) karena kueri lookup menyaring menggunakan `owner_uid` bukan `kost_id` / `property_id` spesifik.
- **Perbaikan**:
  * Memodifikasi `fetchCoords` di `AgentDashboard.tsx` agar memprioritaskan penyaringan koordinat menggunakan `req.kost_id` spesifik sebelum jatuh ke fallback `owner_uid`.
  * Mengembangkan parser cerdas dan mesin agregasi kamar di dalam `syncPropertyRooms` (`adminService.ts`) agar secara otomatis mengelompokkan kamar fisik hasil survei berdasarkan nama tipe kamarnya, mengkalkulasi ketersediaan kamar global (`availableRoomCount`), lalu memperbaruinya di kolom JSONB `properties.room_types` dan kolom `properties.price` sebagai fallback.
  * Mengintegrasikan pemanggilan `syncPropertyRooms` ke akhir fungsi simpan survei `handleSaveKostManagerListing` di `AgentDashboard.tsx`, serta penambahan/pembaruan properti di `adminService.ts`.
  * Memodifikasi halaman detail kost publik (`KostDetail.tsx`) agar memuat data nomor kamar fisik secara interaktif dari tabel `rooms` apabila `kost.isManaged = true`, memvalidasi pemilihan kamar, dan menyisipkan metadata `roomNumber` serta `roomId` ke dalam alur transaksi booking/sewa kamar.

### 30. Perbaikan Warning Overlay & Persistensi Draf Peninjauan Ulang Data KostManager & URL Cleanup (Agustus 2026)
- **Masalah**: Warning overlay untuk peninjauan ulang data properti hasil migrasi tidak muncul ketika data draf dimuat dari dedicated `mitra_kostmanager` (`kmProp`). Selain itu, status warning ini ter-reset (overlay menghilang) saat draf dimuat ulang dari `localStorage` browser. Di samping itu, query properties fallback dan query penyimpanan data `handleSaveKostManagerListing` memicu error sintaks database `22P02` (invalid input syntax for type uuid: "undefined") karena variabel `propertyIdToFetch` berisi string `"undefined"` dari transaksi metadata yang belum divalidasi. Masalah lainnya adalah URL parameter `onboarding_id` tetap tertinggal di peramban setelah form ditutup.
- **Perbaikan**:
  * Menambahkan penyetelan status `setIsExistingPropertyMigration(true)` dan `setWarningAccepted(false)` ketika data KostManager dimuat pertama kali dari tabel `mitra_kostmanager`.
  * Memodifikasi fungsi penyimpanan draf agar menyertakan variabel `isExistingPropertyMigration` dan `warningAccepted` ke dalam `draftData` di `localStorage`.
  * Memodifikasi pemuatan draf `localStorage` agar merestorasi status kedua variabel tersebut saat form dibuka kembali oleh agen survey.
  * Menambahkan UUID pattern guard `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` di area properties fallback query (`openKostManagerListing`) serta lookup property query saat penyimpanan (`handleSaveKostManagerListing`) untuk menyaring string non-UUID `"undefined"` secara aman.
  * Memperbarui fungsi `closeKostManagerListing` dan callback simpan sukses agar menghapus parameter `'onboarding_id'` secara eksplisit menggunakan objek `URLSearchParams` secara terprogram sebelum memanggil `setSearchParams`, menjamin peramban kembali ke route dashboard yang bersih.



### 29. Sinkronisasi Siklus Pembangunan Ulang (Anti-Reset) & Perbaikan Review Admin (Agustus 2026)

- **Masalah**: Setiap kali skrip pembangun ulang `reapply_all_changes_chronologically.js` dijalankan, perubahan di luar `AgentDashboard.tsx` ter-reset. Selain itu, fitur detail kelola properti di Admin Dashboard (`KostManagerManagement.tsx`) selalu gagal terinjeksi karena skrip pencari salah mencocokkan pola `onClick={async () => {` padahal aslinya fungsi sinkron biasa.
- **Perbaikan**:
  * Memperbarui `reapply_all_changes_chronologically.js` agar secara otomatis membersihkan (`git checkout HEAD`) file `KostManagerManagement.tsx` di awal proses untuk mencegah modifikasi bertumpuk.
  * Memperbaiki pencocokan regex di `add_admin_review_kostmanager.js` agar sesuai dengan format signature `onClick={() => {` yang asli, sehingga fitur logging dan review properti kelolaan KostManager di Admin Dashboard berhasil diinjeksi 100%.

### 28. Penyelarasan GPS Ekstraktor & Prefill Kamar (Agustus 2026)
- **Masalah**: Jumlah kamar acuan awal (`initialTotalRooms`) dan koordinat awal (`initialCoords`) tidak otomatis ter-prefill dari metadata transaksi atau catatan registrasi mitra karena skrip `apply_gps_fixes.js` sebelumnya tidak terdaftar di daftar run otomatis. Selain itu, jika data jumlah kamar disimpan langsung pada root request (`req.total_rooms`/`req.totalRooms`) alih-alih di metadata, prefill tersebut tetap gagal.
- **Perbaikan**:
  * Menulis skrip `apply_gps_fixes_v2.js` dengan regex yang lebih fleksibel dan mencocokkan UUID guard terbaru.
  * Memastikan draft loader di local storage tidak melakukan `return` secara instan, melainkan menggabungkannya sehingga database dapat meng-override dengan data ter-update.
  * Mendaftarkan skrip `apply_gps_fixes_v2.js` ke daftar eksekusi akhir `reapply_all_changes_chronologically.js`.
  * Memperbarui parser metadata jumlah kamar agar turut mencari data pendaftaran root `req.total_rooms` / `req.totalRooms`, serta mendukung pencocokan regex case-insensitive yang fleksibel terhadap catatan notes (`Total Kamar:`, `Jumlah Kamar:`, `Kamar:`).
  * Menyelaraskan target pencarian string `cardMapFind` di `apply_gps_fixes_v2.js` menggunakan indentasi 49 spasi untuk mencocokkan struktur file upstream asli. Ini memastikan ekstraksi otomatis koordinat `lat` & `lng` dari notes/URL google maps diaktifkan pada preview map task card.
  * Menambahkan state `requestsCoords` dan hook `useEffect` auto-resolver yang secara cerdas akan mendeteksi transaksi KostManager dengan metadata kosong (atau koordinat default Makassar), lalu melakukan kueri batch lookup ke tabel `properties` berdasarkan `owner_uid = req.user_id` untuk mendapatkan koordinat lokasi real properti dari kolom `location` objek JSON.





### 27. Perbaikan ReferenceError: isExistingPropertyMigration + UUID Guard (Agustus 2026)
- **Masalah 1**: State variables `isExistingPropertyMigration` dan `warningAccepted` tidak dideklarasikan karena script injeksi sebelumnya gagal menemukan target pola di file yang sudah dimodifikasi.
- **Masalah 2**: Error `invalid input syntax for type uuid: "undefined"` muncul di console saat agen membuka form pendataan, karena `propertyId` dari `transactions.metadata` bisa berisi string non-UUID atau `undefined`.
- **Perbaikan**:
  * Membuat script baru `fix_missing_states_and_uuid.js` yang mendeklarasikan state `const [isExistingPropertyMigration, setIsExistingPropertyMigration] = useState(false)` dan `const [warningAccepted, setWarningAccepted] = useState(false)` setelah state `kmActiveTab`.
  * Menambahkan validasi format UUID (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) sebelum nilai `propertyId` dari metadata transaksi digunakan untuk query ke Supabase.
  * Menambahkan `setIsExistingPropertyMigration(true)` saat `existingProp` berhasil ditemukan di tabel `properties`.
  * Script ini sudah ditambahkan ke `reapply_all_changes_chronologically.js` sehingga selalu dijalankan ulang saat regenerasi.

### 26. Refactor Warning Popup: Dari Ternary JSX ke Absolute Overlay (Agustus 2026)
- **Masalah**: Pendekatan ternary JSX (`? : (`) untuk menampilkan popup peringatan migrasi properti menyebabkan ketidakseimbangan closing tags (`</div>` dan `)}`) yang tidak bisa dikompilasi oleh esbuild.
- **Perbaikan**:
  * Mengganti pendekatan ternary dengan **absolute overlay** (`position: absolute, inset-0, z-50`) yang dirender di *dalam* content div `bg-[#f8f9ff]`, sehingga tidak mempengaruhi struktur closing tags sama sekali.
  * Overlay muncul di atas seluruh konten form menggunakan `backdrop-blur-sm` untuk efek premium.
  * Script baru: `add_warning_overlay.js` menggantikan `inject_warning_popup_inline.js` yang bermasalah.
  * Build berhasil: `Dashboard-BZua4NmM.js` (817.55 kB) dikompilasi tanpa error.

### 25. Panel Kontrol Eksklusif "Kosongan vs Furnished" dengan Visual Menarik & Dinamis (Agustus 2026)
- **Masalah**: Centang "Kosongan" di tengah-tengah fasilitas lain terlihat kaku dan kurang mencerminkan alur pendataan modern.
- **Perbaikan**:
  * Mengganti checkbox "Kosongan" dengan **Segmented Pill Switcher (Pill Toggle)** yang diletakkan di bagian atas panel fasilitas kamar (berupa pilihan **[Kosongan]** vs **[Furnished (Isian)]**).
  * Menampilkan visualisasi canggih: Ketika opsi **[Kosongan]** aktif, semua checkbox fasilitas perabot fisik (Kasur, Lemari, Meja Belajar, AC, Kipas Angin, Water Heater) secara dinamis berubah menjadi **setengah transparan (low opacity - 40%)** dan **dinonaktifkan (disabled / pointer-events-none)**.
  * Memungkinkan input tata letak struktural (Kamar Mandi Dalam, Jendela Luar, Dapur Dalam) tetap dapat diisi meskipun status kamar adalah Kosongan.
  * Menjaga kompatibilitas data dengan Supabase: status "Kosongan (Tanpa Perabot)" tetap tersimpan dengan format array yang sama agar terintegrasi sempurna dengan halaman detail properti di sisi pengguna.

### 24. Peringatan Kesesuaian Data Saat Agen Survey Melakukan Migrasi Properti (Agustus 2026)
- **Masalah**: Saat pendataan properti yang sebelumnya terdaftar sebagai Mitra biasa (migrasi) diaktifkan, data-data properti lama (nama, alamat, tipe, dll.) terisi secara otomatis (*pre-filled*). Hal ini berpotensi membuat agen survey langsung melanjutkan proses tanpa meninjau kesesuaian data yang sebenarnya di lapangan.
- **Perbaikan**:
  * Menambahkan overlay pop-up peringatan interaktif bertema peringatan (kuning-oranye) yang memblokir layar wizard pendataan jika terdeteksi bahwa properti yang sedang diedit sudah ada di database (`existingProp` ditemukan).
  * Meminta agen untuk mengonfirmasi peninjauan ulang data dengan mengklik tombol **"Saya Mengerti"** sebelum alur pengisian form pendataan diizinkan untuk dilanjutkan.
  * Menyinkronkan status verifikasi peringatan agar direset setiap kali wizard ditutup atau draf baru dibuka.

### 23. Ekstraksi Koordinat GPS Otomatis dari Link Google Maps (Agustus 2026)
- **Masalah**: Preview peta OSM dan koordinat pada kartu pendataan KostManager serta inisialisasi pin lokasi pada wizard pendataan di Dashboard Agen selalu menampilkan koordinat default/fallback Makassar (`-5.147665, 119.432731`). Hal ini karena tautan Google Maps yang diinput mitra saat mendaftar tidak otomatis diterjemahkan menjadi koordinat Latitude dan Longitude.
- **Perbaikan**:
  * Menambahkan fungsi pembantu `extractCoordinates` menggunakan ekspresi reguler untuk mengekstrak Latitude & Longitude dari berbagai format Google Maps URL (seperti query `q=`, path `@`, daddr, maupun format koordinat mentah).
  * Menjalankan fungsi ekstraksi ini pada berbagai field asal data pendaftaran mitra (`meta.googleMapsLink`, `meta.google_maps_url`, `req.kost_name`, dan `req.notes`).
  * Menyinkronkan koordinat hasil ekstraksi agar langsung ter-render pada komponen peta preview kartu agen serta menjadi titik awal peta picker saat agen membuka formulir pendataan.

### 22. Auto-Prefill Jumlah Kamar Berdasarkan Input Awal Mitra (Agustus 2026)
- **Masalah**: Pada formulir pendataan KostManager di wizard step 1, kolom total jumlah kamar ter-render kosong atau bernilai default `0`. Agen survey harus mengetik ulang angka jumlah kamar secara manual meskipun mitra telah menginput jumlah kamar saat mendaftar/order layanan untuk pertama kalinya.
- **Perbaikan**:
  * Menambahkan pendeteksian otomatis jumlah kamar awal (`initialTotalRooms`) dari data metadata transaksi atau catatan (*notes* dari mitra) saat wizard `openKostManagerListing` diinisialisasi.
  * Menerapkan fallback nilai otomatis ini jika properti baru dibuat atau kueri database untuk `total_rooms` bernilai kosong/0. Agen kini langsung melihat angka kamar default yang telah terisi sesuai isian mitra sebelumnya.

### 21. Redesign UI/UX Kartu Pesanan Pendataan KostManager dengan Design Tokens & Stitch (Agustus 2026)
- **Masalah**: Tampilan kartu pesanan pendataan KostManager sebelumnya di dashboard agen tidak selaras dengan mockup baru, serta memiliki elemen spacing, border line, dan penataan tanggal/jam yang kurang presisi.
- **Perbaikan**:
  * **Integrasi Design Tokens di CSS**: Menambahkan variabel spacing kustom (`stack-sm`, `stack-md`, `stack-lg`, `margin-page`, `gutter-grid`), typography (`label-bold`, `body-lg`, `headline-md`, dll.), dan float shadow (`shadow-soft-float`) ke dalam `@theme` di `index.css` agar sejalan dengan system token milik Stitch UI.
  * **Header Terkalibrasi**: Tanggal dan jam pesanan dipisah menjadi badge individu yang rapi di bagian atas kartu lengkap dengan ikon `calendar_today` dan `schedule` dari Material Symbols.
  * **Layout v2 Terpadu**: Mengubah struktur flexbox kartu agar memuat layout grid dan card-within-card Stitch dengan border line kontras.
  * **Fungsionalitas Riil Terintegrasi**: Mengintegrasikan nominal komisi dinamis, info status terpadu dengan warna dinamis, navigasi rute GPS dengan OpenStreetMap, kontak pemilik dengan sensor WA, dan tombol-tombol alur survey (terima, tolak, OTW, pendataan, isi listing) di setiap tab dashboard agen.

### 20. Perbaikan Kartu Riwayat Survey Biasa & Pendataan KostManager di Dashboard Agen (Agustus 2026)
- **Masalah**: Pesanan survei biasa yang telah diproses/diselesaikan agen sebelumnya tidak muncul di tab Riwayat dan sempat kembali ke tab Permintaan sebagai "MENUNGGU AGEN" (`PENDING_ASSIGNMENT`). Selain itu, detail isi laporan survei (fasilitas, penilaian, bukti foto, dll.) tampak kosong saat dibuka di tab Riwayat.
- **Root Cause**:
  * `adminService.ts` (`getAdminSurveyRequests`): Memanggil `autoSyncAllSurveys(user.id)` pada sesi agen (non-admin). Karena sesi agen memiliki RLS terbatas, `syncSurveyRequest` gagal mendeteksi record lama dan membuat record DUPLIKAT baru berstatus `PENDING_ASSIGNMENT` untuk transaksi yang sudah diproses.
  * `adminService.ts` (Data Terpisah): Record lama (asli) yang menyimpan data `evaluation_summary` terpisah dari record duplikat auto-sync baru yang ber-`evaluation_summary` kosong `{}`.
  * `AgentDashboard.tsx` (`openSurveyEditor`): Terjadinya perubahan kunci ID akibat auto-sync sehingga draf lokal yang pernah tersimpan di `localStorage` pada browser agen belum terhubungkan secara otomatis.
- **Perbaikan**:
  * `adminService.ts`: Mengimplementasikan rutinitas konsolidasi otomatis `repairSurveyRequestStatuses()` yang menyatukan data `evaluation_summary` terlengkap, `result_drive_link`, dan informasi agen dari seluruh record per `transaction_id` ke record utama Supabase, serta mengekstrak fallback dari `transaction.metadata`.
  * `AgentDashboard.tsx`: Menambahkan `assigned_agent_id: uid` pada payload tombol "Terima Tugas", menyertakan status `'SUBMITTED'` ke dalam filter tab `history` (`['COMPLETED', 'CANCELLED', 'ACTIVE', 'SUBMITTED']`), serta mengimplementasikan pemindaian draf bertingkat (`openSurveyEditor`) yang otomatis memindai `localStorage` browser agen untuk merekonstruksi dan menyinkronkan ulang data `evaluation_summary` yang pernah diisi ke Supabase.
  * `supabase_schema.sql`: Memperbarui RLS policy `surveys_select_own` dan `surveys_update_agent` untuk mengizinkan `assigned_agent_id IS NULL`.
- **Hasil**: Seluruh pesanan survei biasa terdahulu yang sempat kembali ke tab Permintaan telah **secara otomatis dipulihkan statusnya kembali ke `COMPLETED` di Supabase**, berpindah ke tab **Riwayat**, dan seluruh data laporan survei (checklist Jenis Kost, Kamar, WC, Dapur, Air, WiFi, Bintang Penilaian, Catatan, & Bukti Foto WA) **tampil dengan utuh dan lengkap**.

### 19. Redesign UI/UX Kartu Pesanan KostManager Dashboard Agen (Agustus 2026)
- **Masalah**: Tampilan kartu pesanan KostManager di `AgentDashboard.tsx` kurang optimal, menggunakan label "Onboarding Kost Madani" yang membingungkan, menampilkan input catatan/jadwal yang tidak relevan, serta memiliki ukuran text/avatar profil mitra dan tanggal/waktu yang sangat kecil dan pudar.
- **Perbaikan UI/UX**:
  * **Pemberian Label & Tema Khusus**: Mengubah badge header menjadi `⚡ Pendataan Kostmanager` dengan aksen tema warna Emerald/Green khas KostManager untuk membedakannya secara jelas dari survei biasa.
  * **Profil Mitra Terbaca & Jelas**: Menampilkan avatar profil mitra 56x56 (`w-14 h-14`), label "Mitra Pemesan Kostmanager", nama mitra berukuran besar (`text-lg font-black text-gray-900`), dan nomor telepon mitra dengan badge berkontras tinggi.
  * **Tanggal & Waktu Berkontras Tinggi**: Mengubah warna dan background badge tanggal & waktu pesanan menjadi hitam pekat (`text-gray-900 font-black`) dengan background kontras terang (`bg-emerald-100` & `bg-white` border emerald) agar sangat mudah dibaca.
  * **Peta GPS Mini & Integrasi Navigasi**: Menambahkan preview peta GPS interaktif OpenStreetMap mini (iframe) dan tombol navigasi langsung "📍 Buka Rute GPS / Google Maps" beserta koordinat GPS lengkap.
  * **Informasi Kamar & Properti Lengkap**: Menampilkan badge "Total Jumlah Kamar" vs "Jumlah Kamar Kosong" serta tipe kost (Putra/Putri/Campur).
  * **Pembersihan Elemen**: Menghapus `req.notes` ("Catatan Pemesan") dan jadwal survei yang tidak dibutuhkan pada alur KostManager.

### 18. Perbaikan Alur Penugasan Agen KostManager (Agustus 2026)
- **Masalah**: Setelah admin menetapkan agen survey, kartu tugas langsung muncul di tab "Aktif" di dashboard agen, melewati tab "Permintaan".
- **Root Cause**: `handleQuickAssignAgent` di `KostManagerManagement.tsx` meng-set status ke `AGENT_ASSIGNED` saat assign. Padahal, di `AgentDashboard.tsx`, tab "Permintaan" hanya menampilkan status `PENDING_ASSIGNMENT`.
- **Perbaikan**:
  * `KostManagerManagement.tsx` baris 152: Status saat admin assign agen diubah dari `AGENT_ASSIGNED` → `PENDING_ASSIGNMENT`.
  * `adminService.ts` (`updateKostManagerRequest`): Menambahkan handling `PENDING_ASSIGNMENT` dalam sinkronisasi ke `kostmanager_surveys` (pemetaan status dan insert pertama).
  * `adminService.ts` (`updateKostManagerRequest`): Menambahkan mapping `PENDING_ASSIGNMENT` dalam sinkronisasi backward-compatible ke `survey_requests`.
- **Alur yang Benar Sekarang**: Admin assign → `PENDING_ASSIGNMENT` (tab "Permintaan") → Agen terima → `AGENT_ASSIGNED` (tab "Aktif") → Agen survey → `PENDING_ONBOARDING` → Admin aktivasi → `ACTIVE`.

### 17. Perombakan UI/UX & Kelengkapan Informasi KostManager Admin (Agustus 2026)
- **Reposisi Hierarki & Profil Mitra Interaktif (DIPERBAIKI)**:
  * Memindahkan profil Mitra Pengaju ke bagian teratas badan kartu sebelum profil properti (kost) untuk hierarki informasi yang logis.
  * Mendesain profil mitra secara minimalis dan menjadikannya dapat diklik untuk membuka Modal Detail Popup lengkap.
  * Memperbaiki bug kegagalan query profil mitra dengan membagi query bersarang PostgREST menjadi kueri sekuensial yang aman (kueri `users` lalu kueri `mitra` secara terpisah dengan fallback dinamis) serta menyelaraskan field `business_name`.
- **Desain Grid Kartu Premium & Peta GPS Mini**:
  * Menggantikan tabel horizontal yang sempit dengan layout grid kartu responsif (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) berdesain premium menggunakan Tailwind CSS.
  * Mengintegrasikan **Iframe Google Maps Mini (interaktif)** langsung di dalam kartu pesanan jika koordinat GPS (`latitude` & `longitude`) tersedia di metadata transaksi.
- **Kelengkapan Informasi Properti**:
  * Menampilkan **Total Jumlah Kamar** secara dinamis yang diambil dari metadata transaksi pendaftaran (`totalRooms`), disandingkan dengan jumlah kamar kosong.
- **Pemisahan Visibilitas Survei Jasa Survey vs KostManager (DIPERBAIKI)**:
  * Memetakan tipe tugas (`task_type`) secara dinamis di `getAdminSurveyRequests` (`adminService.ts`). Jika kolom `notes` mengandung kata `"KostManager Onboarding"`, maka ia dideteksi sebagai `'kostmanager'`. Jika tidak, ia bertipe `'survei_biasa'`.
  * Mengecualikan data survei bertipe `'kostmanager'` dari halaman kelola **"Layanan Jasa Survey"** (`SurveyManagement.tsx`) milik Admin.
  * Menyaring keluar transaksi tipe `'kostmanager'` dan `'kostmanager_subscription'` dari data transaksi survei komersil di `loadSurveyTransactions` (`Dashboard.tsx`).
- **Sistem Tab Filter Pipeline**:
  * Menambahkan tab filter navigasi status di bagian atas halaman ("Semua permohonan", "🔴 Butuh Agen", "⚡ Proses Survey", "📥 Butuh Verifikasi", "🟢 Aktif Autopilot") lengkap dengan badge counter dinamis.
- **Aksi Cepat Langsung di Kartu (Inline Actions)**:
  * Mengintegrasikan dropdown select agen survey lapangan dan tombol "Tugaskan" langsung pada kartu permohonan berstatus `PENDING_ASSIGNMENT` tanpa harus membuka modal kelola.
- **Penyederhanaan Modal Tinjauan**:
  * Merancang ulang modal tinjauan survei agar fokus pada peninjauan data properti terelasi hasil input lapangan agen (deskripsi, koordinat GPS, fasilitas, landmark, data kamar & penyewa terdata, galeri foto kamar) serta tombol aktivasi Auto-Pilot.

### 16. Perbaikan Visibilitas Properti & Filter Invoice Prematur KostManager (Agustus 2026)
- **Pencegahan Onboarding Prematur**:
  * Menghapus pembaruan `is_managed = true` secara otomatis di `syncKostManagerRequest` (`adminService.ts`) saat transaksi baru saja dibayar.
  * Mengubah status `is_managed` pada properti baru/lama yang disubmit oleh agen menjadi `false` terlebih dahulu di `AgentDashboard.tsx`.
- **Aktivasi Resmi Oleh Admin**:
  * Mengonfigurasi tombol "Aktifkan Layanan Auto-Pilot" di `KostManagerManagement.tsx` agar mengupdate `status: 'published'` sekaligus `is_managed: true` pada tabel `properties` secara bersamaan setelah laporan survei diapprove.
- **Hasil**: Properti yang sedang disurvei tidak akan muncul prematur di portal KostManager milik admin/mitra sebelum disetujui, dan data penghuni dummy tidak akan ter-render prematur.

### 15. Alur Submit & Review KostManager (ACC Admin) (Agustus 2026)
- **Submit oleh Agen**:
  * Mengubah status properti awal yang disimpan menjadi `'draft'` di `AgentDashboard.tsx` (sebelumnya langsung `'published'`).
  * Mengubah status pembaruan `survey_requests` menjadi `'SUBMITTED'` (sebelumnya langsung `'COMPLETED'`).
  * Memperbaiki bug pada update status `kostmanager_requests` dengan mencocokkan `transaction_id` alih-alih request ID, serta turut menyimpan `property_id` agar terhubung.
- **Review & ACC oleh Admin**:
  * Menambahkan panel detail peninjauan (Accordion/Dropdown Preview) berisi detail data properti hasil survei (deskripsi, koordinat gps peta, fasilitas, landmark, tipe kamar beserta harga/penghuni/foto kamar) di modal kelola `KostManagerManagement.tsx`.
  * Menyesuaikan tombol "Aktifkan Layanan Auto-Pilot" agar turut mempublikasikan properti (`status: 'published'`) dan memicu status `survey_requests` menjadi `'COMPLETED'` secara otomatis.

### 14. Pemindahan Input Hunian ke Skema Tarif (Agustus 2026)
- **Reposisi Field**:
  * Memindahkan input "Maksimal Penghuni" dan "Biaya Tambahan / Orang" dari panel Detail Kamar ke dalam panel Skema Tarif / Harga Kamar agar tata letak lebih rapi dan relevan dengan komponen harga.

### 13. Input Maksimal Penghuni & Biaya Tambahan (Agustus 2026)
- **Maksimal Penghuni & Biaya Tambahan**:
  * Menambahkan input "Maksimal Penghuni" (type="number") dan "Biaya Tambahan / Orang" (type="text" dengan format ribuan otomatis) di dalam panel Detail Kamar pada form temporaryRoom maupun activeRoomIdx.

### 12. Pemformatan Ribuan Input Harga Sewa (Agustus 2026)
- **Ribuan Separator Dot**:
  * Menambahkan helper formatThousand dan parseThousand untuk memformat masukan angka desimal/bulat dengan pemisah ribuan titik (dot separator).
  * Mengubah tipe masukan input harga skema tarif bulanan, mingguan, harian, dll. dari type="number" menjadi type="text" dengan pemformat otomatis secara langsung pada formulir.

### 11. Sinkronisasi URL Routing & Auto-Save State Onboarding (Agustus 2026)
- **Auto-Save State & Restore**:
  * Mengintegrasikan penyimpanan draf otomatis untuk seluruh state edit onboarding (kmListingForm, kmStep, temporaryRoom, activeRoomIdx, kmActiveTab, photoCategories) ke localStorage.
  * Menghubungkan active onboarding ke URL query parameter `?onboarding_id=[ID]`.
  * Memulihkan secara otomatis state form onboarding yang aktif beserta detail isian draft ketika halaman dimuat ulang (refresh) tanpa kembali ke halaman tugas survei aktif.

### 10. Perbaikan Nesting Sub-Input Dapur Dalam & Filter Tag (Agustus 2026)
- **Perbaikan Peletakan & Filter**:
  * Memperbaiki kesalahan peletakan sub-input "Dapur Dalam" agar dirender di luar blok IIFE Kamar Mandi Dalam.
  * Memfilter "Dapur Dalam" agar tidak dirender sebagai tag kustom di bagian bawah.

### 9. Fitur Sub-Fasilitas Dapur Dalam (Agustus 2026)
- **Sub-Input Dapur Dalam**:
  * Menambahkan checkbox "Dapur Dalam" pada daftar fasilitas kamar utama.
  * Membuat panel isian bersarang (nested) untuk "Dapur Dalam" yang berisi checklist kelengkapan dapur standar (Kompor, Kulkas, Wastafel Cuci Piring, Kitchen Set, Dispenser) dan input teks tambah kelengkapan kustom secara dinamis.

### 8. Perubahan Kategori Foto Utama: Tempat Tidur (Agustus 2026)
- **Penggantian Kategori**:
  * Mengganti nama kategori bawaan ketiga dari "View / Jendela" menjadi "Tempat Tidur" di seluruh setelan fallback uploader foto kamar.

### 7. Kategori Foto Kamar Kustom & Tanpa Batas (Agustus 2026)
- **Unggah Foto Kamar Dinamis**:
  * Mengganti daftar foto kamar statis dengan opsi dinamis (photoCategories kustom) di level tipe kamar.
  * Menambahkan bidang masukan teks dan tombol "+ Foto Kamar" di bawah grid galeri pada form temporaryRoom dan rt (activeRoomIdx) untuk menambahkan kategori foto secara bebas.
  * Menyinkronkan fungsi hapus foto kustom (indeks >= 4) agar ikut membersihkan kategori penampungnya secara otomatis.

### 6. Penghapusan Bidang Tanggal Kamar Siap Huni (Agustus 2026)
- **Penghapusan readyDate**:
  * Menghapus input "Tanggal Kamar Siap Huni" (readyDate) sepenuhnya karena status kamar kosong langsung dianggap siap dihuni saat didata.
  * Menyesuaikan nama kontainer pada editor kamar aktif menjadi "Harga Sewa Kamar".

### 5. Fitur Salin Konfigurasi Kamar (Agustus 2026)
- **Kloning Data Kamar**:
  * Menambahkan dropdown pembantu di bagian atas input lanjutan untuk menyalin konfigurasi dari kamar lain yang sudah terdaftar.
  * Fitur ini menyalin skema harga (price & pricing) serta semua fasilitas kamar/kamar mandi guna menghindari pengisian manual yang berulang.

### 4. Input Pilihan Lantai Netral di Detail Kamar Baru (Agustus 2026)
- **Netralisasi Pilihan Lantai**:
  * Menghapus pra-seleksi otomatis "Lantai 1" saat menambahkan kamar baru di Wizard Step 2.
  * Menambahkan opsi placeholder "Pilih Lantai" yang dinonaktifkan secara bawaan.
  * Memperketat validasi agar agen wajib memilih lantai secara manual sebelum input form kelanjutan terbuka secara dinamis.

### 3. Penggantian Tombol Simpan Draft menjadi Keluar & Auto-Save (Agustus 2026)
- **Tombol Keluar**:
  * Mengganti label tombol "Simpan Draft" di Wizard Step 1 menjadi "Keluar".
  * Draft tersimpan secara otomatis di sisi klien (localStorage) dan akan langsung terhapus saat data berhasil dikirim. Hal ini memastikan penyimpanan bersifat sementara dan tidak membebani database utama.

### 2. Validasi Jumlah Kamar Berdasarkan Target Acuan
- **Input Total Kamar di Step 1**:
  * Menambahkan bidang **Total Jumlah Kamar** di bagian bawah tipe kost pada Wizard Step 1.
  * Mencegah navigasi ke Step 2 jika total kamar belum diisi atau kurang dari 1.
- **Validasi Kunci Progres di Step 2**:
  * Menampilkan banner real-time **Progres Pendataan Kamar (X / Y Kamar)**.
  * Menonaktifkan tombol **Tambah Kamar Baru** secara otomatis jika target kapasitas telah terpenuhi.
  * Mengunci navigasi **Lanjut ke Step 3** (menonaktifkan tombol dan mengubah label tombol menjadi "Kamar Belum Lengkap") kecuali jumlah kamar terdata sama persis dengan target acuan yang diinput di Step 1.

### 1. Rekonstruksi Alur Input Detail & Status Kamar
- **Integrasi Status Kamar**:
  * Memindahkan bidang pilihan **Status Kamar** (Terisi / Kosong) menjadi bagian input terakhir di dalam kartu **Detail Kamar** (di bawah Tipe Kamar).
  * Menghapus tampilan pembuka yang memisahkannya secara independen di bagian atas.
- **Tahapan Progresif Form**:
  * Saat pertama kali menambahkan kamar baru, sistem hanya akan merender kartu **Detail Kamar** saja (Nomor, Lantai, Tipe, Status).
  * Bidang input berikutnya (Tarif, Fasilitas, Foto, Informasi Penghuni) disembunyikan seluruhnya dan baru akan dimunculkan setelah keempat komponen di dalam Detail Kamar terisi lengkap.

### 1. Reposisi Modul Dokumentasi Foto Kamar (Agustus 2026)
- **Aksesibilitas Foto Kamar**:
  * Memindahkan modul **Dokumentasi Foto Kamar** keluar dari blok kondisional kamar kosong sehingga dapat diakses dan diisi baik ketika status kamar Terisi maupun Kosong.
  * Tetap mempertahankan label dinamik **"(Opsional)"** jika status dipilih Terisi, dan **"*Wajib"** jika status dipilih Kosong.

### 1. Dokumentasi Foto Kamar Opsional untuk Kamar Terisi (Agustus 2026)
- **Visualisasi Dinamis Status Foto Kamar**:
  * Mengubah label "Interior Kamar *Wajib" menjadi **"Interior Kamar (Opsional)"** secara dinamis khusus ketika status kamar dipilih sebagai **Terisi**.
  * Memperbarui deskripsi pembantu (helper text) secara kondisional agar menginformasikan agen bahwa pemotretan kamar bersifat opsional dan hanya dilakukan jika pemilik/penghuni berkenan.

### 1. Eliminasi Total Modul Dokumen Penghuni Kamar Terisi (Agustus 2026)
- **Penghapusan Total Dokumen Penghuni**:
  * Menghapus seluruh modul **Dokumen Penghuni** dari Langkah 2 Wizard (Data Kamar).
  * Menghapus input berkas **Bukti Bayar / Kontrak** (`paymentProofUrl`) secara permanen, sehingga tidak lagi meminta berkas dokumen apapun untuk mempercepat alur survei lapangan.

### 1. Eliminasi Input Unggah KTP Penghuni Kamar Terisi (Agustus 2026)
- **Pembersihan Dokumen KTP Penghuni**:
  * Menghapus secara permanen kolom unggah **Foto KTP** (`residentKtpUrl`) dari modul **Dokumen Penghuni** di Langkah 2 Wizard (Data Kamar).
  * Menyederhanakan tata letak kolom menjadi satu baris penuh (`flex flex-col gap-1`) yang berfokus penuh hanya pada berkas **Bukti Bayar / Kontrak** saja.

### 1. Sistem Pencatatan Status Lunas/Sisa Tagihan Penghuni (Agustus 2026)
- **Status Pembayaran (Lunas / Belum Lunas)**:
  * Menambahkan tombol toggle pilihan **Status Pembayaran** (Lunas / Belum Lunas) di bagian **Informasi Penghuni** (Langkah 2).
  * Jika status dipilih **Lunas**, sistem akan memproses penagihan di masa depan berdasarkan **Tagihan Berikutnya**.
  * Jika status dipilih **Belum Lunas**, sistem memicu kemunculan input angka **Sisa Tagihan (Rp)** secara kondisional agar tagihan baru dengan nominal sisa tersebut langsung diterbitkan ke penghuni saat ini.

### 1. Sistem Manajemen Langganan & Tagihan Penghuni Wizard (Agustus 2026)
- **Dropdown Jenis Langganan Dinamis**:
  * Menambahkan dropdown pilihan **Jenis Langganan** pada bagian **Informasi Penghuni** (khusus kamar dengan status Terisi).
  * Opsi pilihan jenis langganan dimuat secara dinamis mencocokkan skema tarif/harga kamar yang telah ditentukan di atas (seperti Bulanan, Tahunan, dll).
- **Label Tanggal & Tagihan Baru**:
  * Mengubah label **Mulai Masuk** menjadi **Tanggal Pembayaran Terakhir** agar lebih presisi.
  * Mengubah label **Selesai Sewa** menjadi **Tagihan Berikutnya** untuk mengakomodasi alur billing berlangganan bergulir yang tepat.

### 1. Sistem Multi-Tarif, Fasilitas Kustom, & Sub-Fasilitas WC Dinamis (Agustus 2026)
- **Modul Skema Tarif / Harga Kamar Fleksibel**:
  * Menambahkan editor profil multi-tarif dinamis (`pricing: [{ period, price }]`) pada form penambahan dan pengeditan kamar di Langkah 2 Wizard.
  * Mendukung pengaturan harga berbasis periode kustom: **Bulanan**, **3 Bulan**, **6 Bulan**, **Tahunan**, **Mingguan**, dan **Harian**.
  * Menerapkan logika kelipatan default (12x harga bulanan) jika tarif tahunan tidak diisi secara eksplisit.
- **Fasilitas Kamar Mandi Dalam Beranak & Kustom**:
  * Memindahkan modul Fasilitas Kamar agar selalu muncul baik untuk kamar status Terisi maupun Kosong.
  * Menggeser opsi checklist **Kamar Mandi Dalam** ke posisi paling akhir pada daftar utama untuk kerapian tata letak.
  * Menyediakan sub-checklist kelengkapan fasilitas kamar mandi dalam secara dinamis: **Kloset Duduk**, **Kloset Jongkok**, **Shower**, dan **Wastafel**.
  * Dilengkapi kolom input teks dan tombol tambah untuk mendata kelengkapan fasilitas WC kustom secara bebas.
- **Fasilitas WC Umum Beranak & Kustom pada Wizard Properti (Langkah 1)**:
  * Menambahkan opsi **WC Umum** pada checklist Fasilitas Umum Properti.
  * Menyediakan sub-checklist kelengkapan WC Umum secara dinamis: **Kloset Duduk**, **Kloset Jongkok**, **Shower**, **Bak Mandi**, **Cermin**, dan **Wastafel**.
  * Dilengkapi kolom input teks dan tombol tambah kelengkapan WC Umum kustom yang secara dinamis tersimpan ke dalam JSONB `metadata.publicBathroomFacilities` pada tabel `properties` dan `mitra_kostmanager`.
- **Pembaruan Skema Database**:
  * Menambahkan kolom `metadata` (`JSONB DEFAULT '{}'`) pada tabel `mitra_kostmanager` di [supabase_schema.sql](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/supabase_schema.sql) untuk menyimpan properti metadata kustom secara aman.

### 1. Restorasi UI/UX & Fungsi Input KostManager Stepper (Agustus 2026)
- **Wizard Stepper Input Properti & Kamar Baru (3 Langkah)**:
  * Mengintegrasikan layout desain baru berdasarkan Google Stitch untuk pengisian data KostManager oleh Agen Survey di [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/AgentDashboard.tsx).
  * Membagi proses pengisian data properti menjadi 3 langkah terarah: **Langkah 1 (Properti)**, **Langkah 2 (Data Kamar)**, dan **Langkah 3 (Review & Kirim)**.
  * Di Langkah 1, menyediakan form pengisian Nama Properti, Tipe Kos (grup selector Putra/Putri/Campur), Alamat Lengkap, tombol "Kunci Koordinat Presisi Saat Ini" dengan sensor GPS browser, kelola checklist fasilitas umum & penambahan fasilitas kustom, 4 slot foto dokumentasi area umum (Depan, Koridor, Area Umum, Lingkungan), penambahan landmark terdekat dengan GPS, serta penambahan peraturan kost yang dinamis.
  * Di Langkah 2, menyediakan panel pengelolaan tipe-tipe kamar (nama, ukuran, harga, jumlah kamar, kapasitas, ketersediaan, kelola fasilitas kamar, dan upload foto kamar).
  * Di Langkah 3, menyediakan ringkasan (review) data sebelum dikirimkan ke Supabase.
  * Mengintegrasikan warna-warna tema Stitch ke dalam `@theme` Tailwind di [index.css](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/index.css) sehingga render layout terlihat sangat premium dan konsisten.

### 2. Pendaftaran Langganan KostManager Cerdas (Smart Onboarding) & Pelacakan GPS (Juli 2026)
- **Diferensiasi Tugas Agen & Form Listing Detail Kamar**:
  * Menambahkan pendeteksi tipe tugas pada `AgentDashboard.tsx` (`isKostManager`) untuk membedakan antara **Jasa Survey** reguler dengan **Tugas Pendataan KostManager**.
  * Menampilkan tag visual yang mencolok (**`⚡ KostManager Onboarding`** vs **`🔍 Jasa Survey`**) pada masing-masing kartu tugas agen.
  * Menyediakan formulir listing properti & kamar terintegrasi (**`⚡ Isi Listing & Kamar`**) khusus untuk tugas pendataan KostManager.
  * Formulir ini membagi pendataan menjadi 2 tab interaktif: *Info Properti* (nama, deskripsi, kota, area, alamat, koordinat peta/GPS, fasilitas umum) dan *Tipe Kamar & Foto* (nama tipe, ukuran, harga bulanan, jumlah kamar kosong, checklist fasilitas kamar/WC, dan upload foto kamar per unit).
  * Data properti yang diinput oleh agen akan langsung dibuat/diperbarui di tabel `properties` dengan status `is_managed = true` dan ditautkan ke ID mitra pengaju.
  * Setelah agen menyelesaikan pengisian dan menekan "Simpan & Kirim Listing", status pengajuan otomatis diubah menjadi `PENDING_ONBOARDING` (siap diaktifkan autopilot oleh admin) dan status survey diubah menjadi `COMPLETED`.
  * **Kurasi Tampilan & Kontak Otomatis KostManager**: Menyembunyikan tombol "Chat User" pada tugas pendataan KostManager (karena hanya melibatkan 1 orang yaitu mitra/pemilik itu sendiri) dan memperluas tombol "Chat Pemilik Kost" menjadi full-width. Secara otomatis mendeteksi dan mengambil nomor WhatsApp terdata langsung dari profil pengguna (`users.phone`) sebagai fallback jika data `owner_phone` bawaan transaksi kosong atau bernilai dash (`-`).
  * **Harga/Komisi Khusus KostManager**: Memperbarui fungsi kalkulasi pendapatan agen (`getSurveyEarnings`) agar tugas pendataan KostManager secara otomatis menampilkan nominal harga berlangganan KostManager yang dibayarkan oleh pemilik (misalnya Rp 150.000) alih-alih menggunakan nilai flat komisi survei standar (Rp 50.000).
  * **Perbaikan Layout Kartu Tugas (Anti-Cutoff)**: Meredesain penempatan nominal harga komisi/pendapatan pada kartu tugas di `AgentDashboard.tsx` dengan memindahkannya ke satu baris khusus (*dedicated row*) di bawah baris tag status. Hal ini menjamin angka nominal harga tidak akan pernah terpotong (*cutoff*) oleh elemen dekorasi latar belakang kartu dan terbaca secara sempurna dengan tipografi yang sangat kontras dan elegan.
  * **Integrasi Koordinat & Tracking Peta Lapangan**: Memperbarui komponen rute peta pada kartu tugas agen agar secara cerdas membaca koordinat GPS (`latitude` & `longitude` atau objek `location`) langsung dari metadata transaksi pembayaran onboarding yang telah diinput secara grafis oleh mitra pemilik. Menampilkan teks informasi titik koordinat serta menyediakan tautan tombol rute GPS instan yang mengarahkan agen navigasi ke titik tepat koordinat properti tersebut.
  * **Penyelesaian Isu Akses Metadata (RLS Policy)**: Menemukan kendala di mana data objek `transaction` terambil bernilai `null` pada dashboard agen survei karena dibatasi oleh kebijakan keamanan Row Level Security (RLS) pada tabel `transactions`. Mengatasi hal tersebut dengan menambahkan kebijakan RLS baru `transactions_select_agent` di database Supabase yang memperbolehkan agen survey terverifikasi melihat data transaksi yang ditugaskan kepada mereka.
  * **Fleksibilitas Pemilihan Listing Eksisting**: Menghilangkan filter ketat `is_managed = false` saat memuat pilihan kost milik mitra di [KostManagerLanding.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx). Hal ini memungkinan mitra yang ingin mendaftarkan ulang, memperbarui, atau melakukan tes ulang pendaftaran KostManager pada listing yang sudah ada tetap dapat memilih properti mereka di dropdown "Pilih dari Kost Saya".
  * **Sinkronisasi Status Langganan Properti Terkelola**: Memperbaiki logika load data di [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) agar memverifikasi status langganan pemilik (`subscription_status = 'kostmanager'` atau request aktif). Jika status mitra adalah `free`, properti yang pernah didaftarkan tidak akan ditampilkan di portal operasional KostManager admin secara otomatis demi kepatuhan bisnis.
  * **Rute URL Progress KostManager di Menu Profil**:
    * Mengintegrasikan rute URL sub-menu `/dashboard-mitra/profile/km-progress` untuk membuka secara otomatis modal "Progress KostManager" (di bawah tab Profil -> Status Program & Layanan).
    * Mengubah klik card pada pilihan "Status Program & Layanan" di [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MitraProfile.tsx) agar langsung menavigasikan ke rute `/dashboard-mitra/profile/km-progress` alih-alih memicu state lokal.
    * Memperbarui [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MitraDashboard.tsx) untuk menangkap sub-rute profil dan meneruskan prop `autoOpenKmProgress` ke komponen [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MitraProfile.tsx).
    * Ketika pembayaran pendaftaran sukses, tombol sukses bayar di [PaymentGateway.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/PaymentGateway.tsx) akan memandu mitra dengan tulisan **"Lihat Status Pengajuan"** dan secara otomatis mengarahkannya langsung ke `/dashboard-mitra/profile/km-progress` untuk melihat progress secara instan.
    * Ketika modal progress ditutup, sistem secara otomatis mengembalikan URL ke `/dashboard-mitra/profile` dengan mulus, dan sebaliknya, menutup modal ketika navigasi kembali dilakukan.
  * **Perbaikan Alur Penerimaan Tugas Surveyor (Permintaan ke Aktif)**:
    * Memperbaiki logika penetapan agen di [KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerManagement.tsx) agar saat admin menugaskan agen survey untuk pendataan KostManager, status pengajuan tetap berada pada status `PENDING_ASSIGNMENT` alih-alih langsung diubah menjadi `AGENT_ASSIGNED`.
    * Perubahan ini memastikan tugas onboarding KostManager masuk ke tab **"Permintaan"** terlebih dahulu pada dashboard agen/surveyor terkait, sehingga agen memiliki kesempatan untuk mengeklik tombol **"Terima Tugas"** sebelum tugas berpindah ke tab **"Aktif"** secara sah.
- **Titik Koordinat Peta Grafis Interaktif (Leaflet Maps)**:
  * Mengintegrasikan komponen peta interaktif Leaflet (`LocationPicker`) pada formulir pendaftaran onboarding manual mitra baru di `KostManagerLanding.tsx`.
  * Memungkinkan mitra menentukan titik lokasi secara grafis dengan mengklik peta atau menyeret marker merah.
  * Secara otomatis menghasilkan tautan Google Maps (Google Maps Link) dan melakukan reverse-geocoding (Nominatim API) untuk mengisi kolom Alamat Kost secara instan.
  * Menyelaraskan marker peta secara real-time dengan koordinat GPS browser saat tombol "Ambil GPS" diklik.
- **Pembersihan Layout Dashboard Admin (`KostManagerManagement.tsx`)**:
  * Menghapus input "Catatan Lokasi / Tautan GPS" yang membingungkan dari modal kelola pendaftaran admin.
  * Menghapus widget "Status Saat Ini" di dalam modal kelola karena status sudah ditampilkan secara transparan di luar modal (di baris tabel utama).
- **Pemuatan Daftar Agen & Otomatisasi Google Drive**:
  * Menghapus restriksi session auth ketat pada `getSurveyAgents` agar data agen tetap dapat dimuat andal di localhost.
  * Menyediakan tombol "Buat Folder Otomatis" di sebelah input link Google Drive pada modal kelola admin, lengkap dengan fallback mock link Google Drive jika cloud function sedang offline.
  * Secara otomatis membuat mock link Google Drive pada saat sinkronisasi pembayaran sukses di backend (`syncKostManagerRequest`).
  * Menambahkan kebijakan RLS `users_select_agents_public` pada tabel `users` di database Supabase untuk mengizinkan pemuatan profil agen survey.
- **Seleksi Kost Eksisting vs Manual (Case 1 & Case 2)**:
  - Menambahkan pendeteksi properti milik mitra yang belum dikelola (`is_managed = false`) pada halaman landing page KostManager (`KostManagerLanding.tsx`).
  - Menampilkan pilihan dinamis untuk mendaftarkan kost eksisting ("Pilih dari Kost Saya") atau mendaftar manual jika merupakan mitra baru.
  - Memilih kost eksisting secara otomatis mengimpor detail nama, tipe, kamar, dan alamat kost ke formulir pendaftaran.
  - Secara otomatis menarik koordinat lokasi (`latitude` & `longitude`) dari listing kost lama, merumuskannya menjadi tautan Google Maps, serta merender peta interaktif **Google Maps Embed** langsung di dalam modal formulir pendaftaran di bawah dropdown kost pilihan.
  - Mengunci input text field "Link Google Maps" menjadi *read-only* dengan visualisasi terarsir agar data GPS aman dari salah ketik oleh mitra ketika memilih opsi kost eksisting. Silakan menginput maps link secara manual hanya jika memilih opsi daftar baru.
- **Fulfillment Transaksi & Sinkronisasi Database (`adminService.ts` & `index.ts`)**:
  - Menyematkan `propertyId` pada metadata transaksi langganan jika pengguna memilih properti eksisting.
  - Menambahkan logika pada `syncKostManagerRequest` agar saat status transaksi berubah menjadi `PAID`, sistem secara otomatis mengupdate properti tersebut menjadi dikelola (`is_managed = true`) dan meng-upgrade status langganan pemilik di tabel `mitra` menjadi `'kostmanager'`.
  - Mengalirkan data tautan Google Maps ke dalam kolom `notes` pada data `survey_requests` agar dapat dibaca oleh tim surveyor lapangan.
- **Pelacakan Rute Lokasi GPS & Pemantauan Status Pengajuan (Mitra, Admin, & Agen)**:
  - **Dashboard Mitra (`MitraProfile.tsx`)**: Menambahkan pemantauan status pengajuan KostManager langsung di menu profil mitra. Menampilkan kartu pelacakan dengan **Progress Stepper UI** interaktif yang memvisualisasikan 5 tahapan proses secara *real-time*: `Diajukan` (Pembayaran Sukses) -> `Verifikasi` (Ditinjau oleh Admin) -> `Agen Ditunjuk` (Menampilkan nama agen) -> `Proses Survey` (Menampilkan jadwal kunjungan) -> `Selesai` (Kost aktif dikelola autopilot).
  - **Dashboard Admin (`KostManagerManagement.tsx`)**: Menambahkan kolom `metadata` pada query data transaksi serta menampilkan tautan tombol "📍 Lacak Rute GPS" yang responsif agar admin dapat melacak rute lokasi kost secara instan.
  - **Dashboard Agen (`AgentDashboard.tsx`)**: Menambahkan pendeteksi format link GPS pada kolom catatan tugas survey untuk menampilkan tombol interaktif "📍 Buka Rute GPS / Maps" yang membawa agen survey langsung ke titik koordinat kost dengan navigasi Google Maps.
  - **Alur Pasca-Pembayaran**: Mengubah arah navigasi setelah transaksi pembayaran KostManager berhasil agar langsung merujuk ke menu profil di dashboard mitra (`/dashboard-mitra/profile`), bukan lagi ke halaman daftar pesanan user. Hal ini mempermudah mitra untuk langsung memantau perkembangan status survey kostnya.
  - **Kartu Status Layanan & Program Kemitraan**: Menambahkan komponen *"Status Program & Layanan"* yang menarik dan informatif di profil mitra untuk menunjukkan jenis kemitraan aktif (`Mitra Reguler` vs `Calon Mitra KostManager (Proses Upgrade)` vs `Mitra KostManager (Autopilot)`). Menyediakan tombol "Upgrade ke KostManager" yang tampil secara andal (bila kemitraan belum aktif `'kostmanager'`) untuk mengarahkan mitra reguler langsung ke halaman pendaftaran. Kartu ini didesain interaktif (dapat diklik) untuk membuka **Modal Ruang Pemantauan Progress** yang menyajikan riwayat pengajuan, detail data agen, tanggal survey, rute GPS, dan visualisasi progress stepper.
  - **Sinkronisasi Database Pelacakan Progres**: Menambahkan kolom `survey_date` (DATE), `survey_time` (TIME), dan `notes` (TEXT) ke dalam tabel `kostmanager_requests` di berkas `supabase_schema.sql` dan database Supabase. Memperbarui handler `adminService.ts` untuk mensinkronisasi data jadwal survey, agen, dan catatan lokasi secara bi-direksional penuh antara tabel `survey_requests` dan `kostmanager_requests`.







### 2. Integrasi CDN Caching Cloudflare Workers untuk Supabase Storage (Juli 2026)
- **Implementasi Caching Proxy Global**:
  - Mengubah fungsi pencari URL absolut `ensureAbsoluteUrl` di `userService.ts` agar mendeteksi URL bawaan Supabase dan secara dinamis mengubahnya menjadi URL proxy CDN Cloudflare `https://media.ruangsinggah.id`.
  - Menghemat penggunaan egress/bandwidth Supabase Storage secara signifikan karena gambar dan media akan di-cache secara permanen di server CDN Cloudflare.
  - Mempercepat waktu loading gambar kost di sisi browser pengunjung website.

### 2. Pengaturan Harga & Durasi Langganan Dinamis KostManager (Juni 2026)
- **Manajemen Paket Langganan di Portal Admin (Super Admin)**:
  - Menambahkan menu baru "Harga Langganan" pada Sidebar Portal Operasional KostManager (`KostManagerPortal.tsx`) yang terhubung dengan SPA routing (`km_packages`).
  - Menyediakan UI tabel daftar paket langganan aktif/nonaktif lengkap dengan detail Label, Durasi (bulan), Harga, dan status Aktif.
  - Menyediakan modal form dinamis untuk Menambah, Mengubah (Edit), dan Menghapus paket langganan.
  - Membuka validasi input durasi berlangganan kustom (1 s/d 12 bulan) serta nominal harga.
- **Skema Database & API Client (`adminService.ts` & `types.ts`)**:
  - Menambahkan tabel `public.kostmanager_packages` di file skema (`supabase_schema.sql`) dengan kolom: `id`, `duration_months`, `price`, `label`, `is_active`, dan `created_at`.
  - Mengimplementasikan helper database client: `getKostManagerPackages`, `saveKostManagerPackage`, dan `deleteKostManagerPackage` dengan fallback statis `DEFAULT_KOSTMANAGER_PACKAGES` demi ketahanan aplikasi sebelum migrasi SQL dijalankan user.
  - Mendefinisikan interface `KostManagerPackage` di `types.ts`.
- **Integrasi Landing Page & Checkout Pembayaran (`KostManagerLanding.tsx`)**:
  - Mengambil data paket langganan aktif dari database Supabase dan menampilkannya secara dinamis di landing page KostManager.
  - Memungkinkan calon mitra memilih paket durasi berlangganan secara interaktif.
  - Menampilkan ringkasan biaya berlangganan dan durasi secara dinamis pada modal Syarat & Ketentuan MoU.
  - Mengintegrasikan harga paket dinamis (`packagePrice`) ke dalam parameter `amount` komponen `PaymentGateway` serta metadata pembayaran yang disetor saat proses transaksi.

### 2. Integrasi Portal Operasional KostManager & Detail Kamar (Juni 2026)
- **Penambahan Properti Terkelola Baru**:
  - Menyediakan tombol *"+ Tambah Properti"* di tab Properti Terkelola untuk memicu formulir modal pendaftaran properti baru dengan skema detail.
  - Memisahkan modal ke dalam sub-komponen `ManagedPropertyAddModal` untuk menghindari pelanggaran *Rules of Hooks*.
  - Mengimplementasikan tata letak split-view kategori (sidebar kiri) dan accordion mobile yang identik dengan super admin penambahan kost.
  - Form mencakup Info Umum (Nama Kost, Alamat, Kota, Tipe Kost, Harga), Tipe Kamar, dan Pemetaan Status Kamar (Kosong / Terisi).
  - Khusus kamar dengan status *"Terisi"*, form secara dinamis meminta detail Nama Penghuni, No HP Penghuni, Paket Sewa, dan Tanggal Jatuh Tempo Sewa.
  - Integrasi penyimpanan otomatis memasukkan data properti ke `properties` dan data penyewa aktif ke `resident_status` Supabase.
- **Desain Layout Sidebar Kiri**:
  - Merancang ulang navigasi Portal KostManager dari tab horizontal di atas menjadi layout Sidebar vertikal di sebelah kiri (`aside` w-64) agar konsisten dengan gaya default Dashboard Admin utama.
  - Memosisikan tombol "Admin Utama" ke bagian paling bawah Sidebar kiri.
  - Mengatur area konten sebelah kanan menjadi flex-grow scrollable container.
- **Integrasi Halaman Utama**:
  - Mengimpor komponen `KostManagerPortal` di `Dashboard.tsx` dan merendernya secara kondisional ketika status menu aktif diawali dengan `km_` (Portal Operasional).
  - Mengoptimalkan pembungkus layout di `Dashboard.tsx` dengan menghapus padding (`p-4 sm:p-6 lg:p-8`) dan container `max-w-7xl` agar Sidebar Portal menyentuh tepi layar.
- **Gerbang Akses Portal**:
  - Menambahkan tombol *"Buka Portal Operasional KostManager"* di bagian header `KostManagerManagement.tsx` untuk mempermudah navigasi langsung Admin.
- **Manajemen Detail Kamar Terperinci**:
  - Menghadirkan tombol *"Detail Kamar"* pada tabel properti terkelola.
  - Menampilkan modal interaktif detail kamar yang memetakan kamar terisi (menyajikan identitas lengkap penghuni, WhatsApp, NIK, masa sewa, dan tanggal jatuh tempo) serta tombol cepat penerbitan tagihan manual.
  - Memetakan kamar kosong dengan lencana khusus *"Siap Dipasarkan"* untuk mempermudah Admin memantau ketersediaan unit yang akan dipromosikan.
- **Fitur Lengkap Edit Properti Kelolaan & Rekonstruksi Kamar**:
  - Menambahkan tombol *"Edit"* di sebelah tombol *"Detail Kamar"* pada tabel properti terkelola.
  - Memungkinkan admin mengedit detail properti (deskripsi, lokasi koordinat peta, fasilitas, tipe kamar, rules) dengan aman.
  - Mengimplementasikan alur rekonstruksi kamar otomatis saat mode edit: kamar terisi ditarik datanya dari tabel `resident_status` lengkap dengan informasi penyewa, dan kamar kosong direkonstruksi sejumlah `availableRoomCount` tipe kamar bersangkutan.
  - Memperbarui `handleSave` pada `ManagedPropertyAddModal` agar mendeteksi status edit untuk melakukan `UPDATE` ke database Supabase serta mencegah duplikasi data penyewa yang sudah aktif.
- **Integrasi SPA Routing Lengkap & Anti-Amnesia**:
  - Mengintegrasikan rute internal KostManager (`km_overview`, `km_properties`, `km_tenants`, `km_billing`) ke tipe `DashboardMenu` di `Dashboard.tsx`.
  - Menerapkan sinkronisasi URL dua arah (URL-based SPA routing) sehingga menu yang aktif di Portal KostManager tersinkron secara reload-proof di address bar browser.
- **Fitur Upload Foto Unit Kamar**:
  - Menambahkan area upload foto kamera 📷 di setiap unit kamar pada formulir detail tipe kamar.
  - Menyimpan array URL foto kamar (`images`) langsung ke dalam properti `rooms` di objek JSONB `room_types` di database Supabase.
  - Menyediakan visualisasi pratinjau thumbnail mini serta tombol hapus foto `❌` pada client-side.
  - Mendukung pemulihan (reconstruction) detail data foto kamar lama/baru saat mode pengeditan properti diaktifkan.
- **Perbaikan Redirection Loop Navigasi & Justifikasi Database**:
  - Mengatasi kendala tombol kembali "⬅️ Admin Utama" pada Portal KostManager yang macet dengan memisahkan rute `'kostmanager'` dari `isKostManagerPortal`. Hal ini membuat menu utama KostManager dirender dalam layout panel admin standar.
  - Menjelaskan alasan teknis pemilihan skema JSONB `room_types` satu-tabel (pada tabel `properties`) alih-alih tabel relasional khusus demi menjamin keutuhan data (Single Source of Truth) dan menjaga kompatibilitas penuh dengan sistem pencarian serta booking utama RuangSinggah.



### 2. KostManager Auto-Pilot & Survey Integration (Juni 2026)
- **Desain & Aksen Warna Oranye Standard**:
  - Merombak visual landing page KostManager (`KostManagerLanding.tsx`) agar selaras dengan skema warna cerah RuangSinggah menggunakan oranye hangat (`orange-500` / `orange-600`), latar belakang putih (`bg-white` / `bg-slate-50`), serta ornamen visual modern.
- **Simplifikasi Alur Order Langganan**:
  - Menyederhanakan formulir pemesanan KostManager di modal agar hanya meminta info minimal: *Nama Kost*, *Jenis Kost*, *Jumlah Kamar Kosong*, *Alamat Lengkap*, dan *Persetujuan Syarat & Ketentuan*. Data diri otomatis menggunakan data profile aktif user yang login.
- **Pemicuan Otomatis Survey Lapangan**:
  - Mengintegrasikan logika pasca-pembayaran (`updateTransactionStatus` di `adminService.ts`) agar ketika transaksi berlangganan KostManager berstatus `PAID`, secara otomatis membuat entri tugas survey di tabel `survey_requests`.
  - Admin dapat langsung menugaskan agen dari tab baru "KostManager Auto-Pilot" di dashboard admin.
- **Progress Card Kepemilikan Kost**:
  - Menghadirkan kartu pantau progres visual interaktif untuk properti KostManager di halaman "Kost Saya" (`MyKost.tsx`) agar owner dapat memantau status secara langsung (Menunggu Survey, Sedang Disurvey, Aktif).
- **Banner KostManager di Menu Kost Saya**:
  - Menampilkan kembali banner promo premium KostManager di menu "Kost Saya" (`properties`), ditempatkan tepat di atas tombol "+ Tambah" kost.
  - Menyelaraskan tema warna banner di tab `properties` dan `overview` menjadi warna oranye/amber khas RuangSinggah (`bg-gradient-to-br from-orange-600 via-amber-500 to-orange-700`) serta menyambungkan aksi tombol "Pelajari KostManager" agar bernavigasi dengan benar ke landing page.


### 2. Perhitungan Pendapatan Agen Survei Berbasis Transaksi Riil (Juni 2026)
- **Akurasi & Stabilitas Pendapatan**:
  - Mengubah kalkulasi pendapatan total (`totalEarnings`) dan transaksi masuk (`inTx`) di `AgentDashboard.tsx` agar menggunakan fungsi kalkulasi presisi `getSurveyEarnings(r)`.
  - Fungsi ini melakukan pencocokan UUID deterministik request survei dengan index kost di array `metadata.kostList` transaksi dari database.
  - Menghitung pendapatan secara statis berdasarkan harga per unit kost yang benar-benar dibayarkan user saat transaksi (termasuk diskon database 30% jika berhak), bukan dihitung secara dinamis dari database global yang bisa berubah sewaktu-waktu.
  - Menghilangkan pembagian dinamis bermasalah yang hanya menyaring dari tugas ter-assign milik agen itu sendiri (yang memicu ketidakpasan data jika tugas dibagi ke beberapa agen).
- **Dukungan Metadata Transaksi**:
  - Memperluas select query `transaction:transaction_id` di `getAdminSurveyRequests()` pada `adminService.ts` agar memuat kolom `metadata`.
  - Menambahkan tipe `metadata?: any;` pada interface `SurveyRequest` di `types.ts` untuk memastikan paritas tipe data TypeScript.
- **Konfigurasi Komisi Bagi Hasil Dinamis**:
  - Memperluas antarmuka `CatalogManagement.tsx` di panel admin dengan menambahkan input angka **"Komisi Agen (Rp per kost disurvei)"** dinamis dengan prefiks "Rp".
  - Menyimpan konfigurasi nominal Rupiah tersebut ke tabel `app_settings` dengan kunci `survey_catalog` (`agent_commission_flat`).
  - Memuat nominal komisi flat Rupiah secara dinamis di `AgentDashboard.tsx` pada saat inisialisasi komponen dan menggunakannya langsung dalam menghitung wallet balance / pendapatan agen survei secara presisi.
- **Penguncian & Log Transaksi Komisi Agen**:
  - Mengunci data komisi flat yang aktif dengan menyematkannya langsung ke payload metadata transaksi (`agent_commission_flat`) saat checkout di `SurveyCheckout.tsx`.
  - Mengimplementasikan aturan **Cutoff Tanggal 16 Juni 2026**: Semua transaksi dari awal hingga 15 Juni 2026 dikunci komisinya sebesar **Rp 35.000** (100% komisi dari harga jasa survey Rp 35.000 flat, tanpa potongan platform).
  - Memperbaiki query database `getAdminSurveyRequests()` di `adminService.ts` agar memuat kolom `created_at` dan `payment_method` dari relasi sub-query `transactions` ke frontend.
  - Memperbarui `getSurveyEarnings()` di `AgentDashboard.tsx` agar memanfaatkan `trx?.created_at || r.created_at` secara dinamis demi memastikan filter cutoff tanggal 16 Juni selalu berjalan presisi tanpa kegagalan filter.
  - Untuk transaksi pada tanggal 16 Juni 2026 dan setelahnya, komisi dicocokkan berdasarkan snapshot transaksi, atau dicocokkan dinamis berdasarkan garis waktu dari log perubahan katalog survey (`changeLogs` di tabel `app_settings` Supabase).
  - Menyederhanakan visualisasi pendapatan di Dashboard Agen: menghapus seluruh banner/badge komisi besar di bawah kartu, dan menggantinya dengan **teks nominal oranye polos berukuran besar (contoh: Rp 35.000)** langsung di jajaran metadata tag teratas (di samping tag ID dan Tipe Survey). Menyajikan info komisi riil secara minimalis, bersih, dan menyatu dengan identitas visual web app.

### 2. Paritas Halaman Profil Agen & Manajemen Agen Admin dengan Mitra (Juni 2026)
- **Wizard Penyelarasan Profil Agen (`AgentProfile.tsx`)**:
  - Mengimplementasikan alur wizard 2-langkah (Step 1: Data Profil & OTP WhatsApp, Step 2: Verifikasi Identitas & Dokumen KTP) yang identik dengan `MitraProfile.tsx`.
  - Menerapkan fitur **Double OTP WhatsApp**: OTP Sesi 1 via email (Brevo) untuk membuka kunci pengeditan WhatsApp, diikuti OTP Sesi 2 via WhatsApp (Meta API) untuk memverifikasi nomor telepon baru secara aman.
  - Mengunci email secara permanen (read-only) untuk paritas keamanan.
  - Menampilkan `referral_code` milik agen sendiri secara read-only dilengkapi tombol "Salin" untuk dibagikan kepada calon mitra. Menghilangkan field input `referred_by` (kode referral yang mengundang) yang tidak dibutuhkan oleh agen.
  - **Perbaikan Deteksi Status & Tombol Aksi**: Memperbaiki visual status di mana Agen yang sudah terverifikasi (`verified`) sebelumnya salah terdeteksi sebagai "Belum Terverifikasi" di dashboard profil. Menyelaraskan tombol aksi agar berubah secara dinamis menjadi "Simpan Semua Data" pada Step 1 (bukan lagi "Lanjutkan") saat akun telah terverifikasi, persis seperti alur pada profil Mitra.
  - Mengintegrasikan auto-save draf di backend saat berpindah step, pemosisian RLS Security Notice di baris teratas Step 2, auto scroll-to-top dinamis saat navigasi wizard, serta fitur cancel/batal dengan rollback data dinamis dari database.
- **Pembaruan Manajemen Agen Admin (`AgentManagement.tsx`)**:
  - Merestrukturisasi tampilan manajemen agen admin menjadi 3 tab interaktif: "Permintaan Verifikasi" (requests), "Daftar Agen Aktif" (active), dan "Akun Diblokir" (blocked), meniru struktur `MitraManagement.tsx`.
  - Menambahkan fitur penolakan pendaftaran agen dengan input alasan kustom detail, tombol **Blokir Kemitraan** (banned), dan tombol **Pulihkan Akses** (unban) untuk memulihkan akun agen dari pemblokiran.
  - Mengimplementasikan penghitung penolakan otomatis (`rejection_count`). Jika verifikasi agen ditolak sebanyak 3 kali secara kumulatif, sistem secara otomatis memblokir (ban) akses kemitraan agen tersebut demi menjaga kualitas surveyor.
- **Dukungan Backend & Integrasi Dashboard (`adminService.ts` & `Dashboard.tsx`)**:
  - Menambahkan endpoint `getBannedAgents()`, `banAgentRequest()`, dan `unbanAgentRequest()` ke dalam `adminService.ts`.
  - Memperluas penanganan status update verifikasi agen di `updateAgentVerificationStatus()` untuk memproses alasan penolakan kustom, penghitung otomatis ban, sinkronisasi RLS tabel privat `user_verifications`, pemulihan peran (`role` kembali ke `'user'`), dan trigger email otomatis status kemitraan via Brevo SMTP.
  - Mengintegrasikan state dan callback pemuatan agen yang diblokir (`bannedAgents`) ke dalam `Dashboard.tsx` serta meneruskannya dengan aman ke sub-komponen management.

### 2. Sistem Double OTP Perubahan Nomor WhatsApp & Penguncian Email Mitra (Juni 2026)
- **Perbaikan Crash, Tampilan Ganda WhatsApp, Spam Resend, & Perapian Layout**: Mengatasi masalah `ReferenceError: phoneEditStep is not defined` yang menyebabkan blank putih saat tombol "Edit Profil" diklik, meniadakan render nomor WhatsApp duplikat dengan menyatukannya ke alur layout kondisional, menyembunyikan tombol header resend begitu OTP dikirim untuk mencegah spam, serta menyelaraskan visual Tempat & Tanggal Lahir menggunakan `ProfileItemRead` standar dengan ikon visual (`MapPin`, `Calendar`) pada mode baca.
- **Email Read-Only Permanen**: Mengunci alamat email Mitra secara permanen di formulir profil (`MitraProfile.tsx`) sehingga bernilai read-only. Menghapus tombol "Ubah" dan dialog verifikasi email untuk mencegah modifikasi email demi alasan keamanan.
- **Sesi Double OTP WhatsApp**: 
  - **OTP Keamanan (Sesi 1)**: Mengintegrasikan Firebase Cloud Function `sendOtpEmail` berbasis REST API Brevo SMTP (`https://api.brevo.com/v3/smtp/email`) untuk mengirimkan 6-digit OTP ke alamat email terdaftar Mitra saat mereka meminta perubahan nomor WhatsApp. Verifikasi OTP ini harus berhasil sebelum input nomor WhatsApp baru terbuka.
  - **OTP Nomor WhatsApp Baru (Sesi 2)**: Setelah verifikasi email sukses, Mitra memasukkan nomor baru dan memicu pengiriman OTP via template WhatsApp OTP (`otp_verification`) langsung ke nomor baru tersebut. Perubahan data nomor WhatsApp ke database hanya disimpan apabila verifikasi OTP WhatsApp sesi kedua ini berhasil.
- **Visual Wizard Double OTP**: Menyusun tata letak stateful (`phoneEditStep` dari `'none'`, `'security_otp'`, `'new_phone_input'`, hingga `'new_phone_otp'`) dengan box instruksi yang interaktif di `MitraProfile.tsx`.

- **Ekstraksi Berbasis AI & Vision (Edge Function)**: Menambahkan Supabase Edge Function `analyze-ktp` yang memanfaatkan model `gemini-3-flash-preview` untuk menganalisis gambar KTP langsung dari Storage (Multimodal Vision) atau teks hasil pemindaian OCR. AI secara otomatis mengoreksi typo/kesalahan baca, menyaring noise stiker laptop/tombol keyboard, menstandardisasi format data, dan memproduksi struktur JSON yang bersih.
- **Kompresi & Resizing Gambar Client-side**: Mengintegrasikan batasan dimensi maksimal 1200px (lebar/tinggi secara proporsional) pada fungsi `convertToWebP` di `adminService.ts` dan menghubungkannya pada alur unggah KTP di `MitraProfile.tsx` serta `AgentProfile.tsx`. Hal ini memotong ukuran berkas dari ~7.5MB menjadi di bawah 150KB, mengeliminasi error crash `WORKER_RESOURCE_LIMIT` (Status 546) pada Edge Function Deno karena konsumsi CPU/memori yang tinggi, sekaligus mempercepat proses upload.
- **Sistem Fallback Tangguh (Resilient Hybrid)**: Menghubungkan client-side profile Mitra dan Agen untuk memanggil API AI Edge Function terlebih dahulu. Jika terjadi kegagalan/timeout pada sisi AI, sistem secara otomatis beralih (*fallback*) ke ekstraksi Regex lokal, menjamin kelancaran UX tanpa hambatan.

### 2. Pengisian Otomatis Data Objektif KTP Cerdas Mitra & Agen (Juni 2026)
- **Melengkapi Formulir Step 2 (Verifikasi KTP)**: Memperluas panel input KTP dengan data objektif lengkap (Nama Lengkap KTP, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan) secara serasi pada `MitraProfile.tsx` dan `AgentProfile.tsx`.
- **Ekstraksi Otomatis OCR**: Menyempurnakan pemrosesan hasil pindai OCR cerdas (Tesseract.js) untuk mengekstrak seluruh data tersebut secara otomatis dengan normalisasi format tanggal lahir ke format HTML date (`YYYY-MM-DD`) serta koreksi noise OCR, sehingga pengisian profil dapat terisi otomatis secara objektif dan instan.
- **Penyimpanan Terpadu**: Menghubungkan penyimpanan data profil dasar hasil verifikasi ini langsung ke tabel `users` database Supabase saat pengajuan disimpan atau dikirim.

### 2. Peningkatan Keandalan & Sistem Cerdas OCR KTP Mitra & Agen (Juni 2026)
- **Smart NIK Extractor**: Mengintegrasikan algoritma pembersih noise OCR (mengoreksi kesalahan deteksi karakter umum seperti `O` -> `0`, `I/l` -> `1`, `B` -> `8`) dan melakukan pencarian fallback multi-tingkat (pencocokan kata & baris) untuk mendeteksi 16 digit NIK secara akurat terlepas dari kualitas/posisi KTP.
- **Smart Address Builder**: Mengatur parser baris alamat KTP secara dinamis untuk mendeteksi data wilayah (RT/RW, Kelurahan, Kecamatan) dan menggabungkannya ke dalam format alamat terstruktur.

### 2. Perbaikan UX & Validasi Kolom Halaman Profil User (Juni 2026)
- **Tanda Wajib Tanggal Lahir**: Menambahkan asterisk merah `*` pada kolom "Tanggal Lahir" di [Profile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/Profile.tsx). Kolom ini wajib diisi untuk kalkulasi syarat usia transaksi minimal 17 tahun, namun sebelumnya tidak memiliki tanda bintang merah sehingga membingungkan pengguna yang mengosongkannya.
- **Koreksi Tombol Aksi Menyesatkan**: Mengubah nama tombol di mode baca (*read-only*) dari yang sebelumnya berlabel `"Simpan Profile"` (tapi memicu aksi kembali/`onBack`) menjadi `"Kembali"`. Ini memperbaiki kekeliruan navigasi di mana pengguna menyangka profil disimpan lewat tombol tersebut.

### 2. Penyelarasan Layout OTP WhatsApp Mitra pada Desktop (Juni 2026)
- **Desain Grid Proporsional**: Mengeluarkan kontainer verifikasi OTP WhatsApp dari dalam kontainer input No. WhatsApp agar tidak merusak keselarasan kolom di desktop.
- **Penerapan `md:col-span-2`**: Menerapkan lebar penuh untuk kotak OTP di tampilan desktop sehingga membentang secara seimbang di bawah baris input Nama Lengkap dan No. WhatsApp, menghilangkan ruang kosong timpang (ompong) di bawah kolom Nama Lengkap tanpa merusak kerapian tampilan seluler yang responsif.

### 2. Integrasi Verifikasi Email untuk Upgrade Peran Pemilik Kost (Juni 2026)
- **Gerbang Keamanan Upgrade**: Mengaktifkan alur verifikasi email konfirmasi (magiclink) saat akun pencari kost (`user`) mendaftar sebagai Pemilik Kost (`owner`), sehingga role tidak diupgrade secara langsung melainkan membutuhkan persetujuan klik tautan email terlebih dahulu.
- **Kustomisasi Brevo Email**: Mengintegrasikan tipe `'magiclink'` pada Cloud Function `handleCustomAuthEmail` untuk mengirimkan email HTML premium bertema upgrade Pemilik Kost dengan subjek dan tata letak yang relevan.
- **Definisi Kirim Ulang**: Mengimplementasikan `handleResendUpgradeEmail` pada `Login.tsx` untuk mempermudah pengiriman ulang email konfirmasi apabila tidak masuk ke inbox.

### 2. Eliminasi Tombol Intip Password Ganda (Double Eye Icon) (Juni 2026)
- **Hapus Mata Bawaan Browser**: Menambahkan CSS global rule `input::-ms-reveal` dan `input::-ms-clear` di `index.css` untuk menyembunyikan ikon penampil sandi native bawaan Microsoft Edge/Windows.
- **Konsistensi Visual**: Menjaga agar hanya tombol mata kustom premium RuangSinggah yang elegan, fungsional, dan seragam tampil pada semua input kata sandi di halaman Login maupun Daftar.

### 3. Perbaikan Real-Time Banner Error Login & Pembersihan Alert Native Browser (Juni 2026)
- **Reaktivitas URL Search Params**: Mengintegrasikan hook `useSearchParams` pada `Login.tsx` dan memasukkannya ke dalam dependency list `useEffect` untuk mendeteksi perubahan parameter URL secara real-time.
- **Pesan Instan Mismatch & Blocked**: Memastikan pesan kesalahan "role mismatch" (ketika akun biasa mencoba login di portal pemilik kost) dan "akun diblokir" (blocked/banned) tampil secara instan di UI tanpa harus merefresh halaman web secara manual.
- **Penghapusan Alert Native Dialog**: Menghilangkan popup browser native (`alert()`) yang mengganggu estetika pada login sukses (pengalihan langsung secara instan) dan menggantinya dengan inline banner hijau premium pada sukses update kata sandi.

### 4. Manajemen Akun Diblokir & Otorisasi Pemulihan Akses (Unban) Admin (Juni 2026)
- **Tab Akun Diblokir**: Menambahkan tab khusus "Akun Diblokir" pada switcher halaman Manajemen Mitra di Dashboard Admin untuk mempermudah identifikasi dan monitoring akun-akun mitra/owner yang diblokir permanen.
- **Otorisasi Unban (Pulihkan Akses)**: Menyediakan tombol "Pulihkan Akses" untuk Admin guna mengaktifkan kembali akun mitra yang diblokir. Alur unban ini akan mengubah `verification_status` kembali ke `'unverified'`, mereset `rejection_count` ke `0`, dan memicu email pemberitahuan otomatis ke pengguna bahwa akses kemitraan mereka telah diaktifkan kembali.
- **Pemulihan Peran saat Unban**: Memperbaiki logika `unbanMitraRequest` agar turut memulihkan peran (`role`) pengguna kembali menjadi `'owner'` di database `users`. Sebelumnya, pengguna yang di-unban tetap terdaftar sebagai peran `'user'` biasa sehingga memicu penolakan *role mismatch* saat mencoba masuk kembali ke portal Pemilik Kost.
- **Otomatisasi Email Unbanned**: Mengintegrasikan template email premium "Akses Kemitraan Diaktifkan Kembali" pada Cloud Function `sendMitraStatusEmail` menggunakan Brevo API.

### 5. Penayangan, Penyeragaman Format Kode Referral, State Sync Global, & Penyempurnaan Wizard Edit Profil Mitra (Juni 2026)
- **Tampilan Input Referral Dinamis**: 
  - Input Kode Referral Agen (`referred_by`) ditampilkan di Step 1 (page awal edit profile) secara kondisional menggunakan aturan: `formData.verification_status !== 'verified' && !hasInitialReferral`.
  - Jika pemilik kost (Mitra) belum diverifikasi (`verified`) DAN belum memiliki kode referral tersimpan di database (`referred_by` kosong), input referral akan muncul.
  - Jika pemilik kost sudah terverifikasi oleh admin atau sudah pernah menginputkan referral sebelumnya, input referral akan disembunyikan agar tidak terinput 2 kali.
- **Penyimpanan Draft Otomatis (Step 1)**:
  - Begitu tombol **Lanjutkan** diklik, semua data yang telah diisi di Step 1 (termasuk referral code) secara otomatis tersimpan ke database (`users` dan `mitra`) sebagai draft aktif.
- **Sinkronisasi State Global (State Sync)**:
  - Memperbarui `fetchUserData` di `App.tsx` agar memuat data `referred_by` dari tabel `mitra` secara paralel bersama dengan tabel profile dasar lainnya.
  - Menyediakan global event listener `RS_USER_UPDATED` pada Window object di `App.tsx` yang dipicu setiap kali draft atau profil disimpan di `MitraProfile.tsx`. Hal ini memperbarui context state `user` di seluruh dashboard (termasuk nama/foto di sidebar) secara instan tanpa reload halaman web.
  - Memastikan `loadProfile` di `MitraProfile.tsx` selalu dijalankan pada saat komponen dimuat guna mengambil data mutakhir langsung dari database.
- **Scroll-to-Top Otomatis**:
  - Mengintegrasikan fungsi scroll otomatis `window.scrollTo({ top: 0, behavior: 'smooth' })` pada transisi wizard (saat Lanjutkan, Kembali, dan Batal) untuk memastikan layar langsung memuat dari bagian teratas.
- **Relokasi RLS Security Notice**:
  - Memindahkan posisi RLS Security Notice di Step 2 (Verifikasi KTP) ke bagian paling atas (di bawah judul slide), memberikan kesan jaminan privasi data sebelum pengguna mengunggah foto KTP.
- **Fitur Reset saat Batal/Tutup**:
  - Menambahkan fungsi `handleCancel` yang menyatukan alur pembatalan (tombol "BATAL" dan tombol silang "X"). Saat batal ditekan, status editing dinonaktifkan, step dikembalikan ke 1, dan `loadProfile()` dipanggil untuk membuang perubahan data sementara yang belum disimpan (rollback state).
- **Format Alphanumeric Murni**:
  - Mengubah generator kode referral agen survey dan trigger database di `supabase_schema.sql` agar tidak menyertakan tanda hubung/strip (`-`), sehingga menghasilkan kode murni alphanumeric seperti `AGXXXXXX` yang unik per agen. Placeholder input referral di form pendaftaran dan profile juga disinkronkan ke format baru ini.
- **Fitur Reset saat Batal/Tutup**:
  - Menambahkan fungsi `handleCancel` yang menyatukan alur pembatalan (tombol "BATAL" dan tombol silang "X"). Saat batal ditekan, status editing dinonaktifkan, step dikembalikan ke 1, dan `loadProfile()` dipanggil untuk membuang perubahan data sementara yang belum disimpan (rollback state).
- **Format Alphanumeric Murni**:
  - Mengubah generator kode referral agen survey dan trigger database di `supabase_schema.sql` agar tidak menyertakan tanda hubung/strip (`-`), sehingga menghasilkan kode murni alphanumeric seperti `AGXXXXXX` yang unik per agen. Placeholder input referral di form pendaftaran dan profile juga disinkronkan ke format baru ini.

### 2. Penyempurnaan Alur Wizard Verifikasi KTP & OTP WhatsApp Dinamis Mitra (Juni 2026)
- **WhatsApp OTP Dinamis**:
  - Kolom input OTP kini tersembunyi secara default dan hanya muncul secara dinamis jika status verifikasi nomor WhatsApp adalah belum diverifikasi (`waOtpVerified` bernilai `false`).
  - Setelah nomor berhasil diverifikasi dengan memasukkan kode OTP 6-digit secara benar, input OTP akan disembunyikan secara otomatis, dan ikon centang hijau (`BadgeCheck`) premium diposisikan langsung di dalam input nomor telepon serta di header label.
  - Jika nomor telepon diubah, status verifikasi akan otomatis direset (`waOtpVerified` diubah ke `false`) sehingga mengharuskan pengiriman OTP ulang.
- **Wizard Flow Verifikasi Identitas (KTP)**:
  - Pemisahan proses edit data profil dan pengajuan KTP menjadi alur bertahap (wizard).
  - **Slide 1**: Mengisi identitas utama (Nama, No. WhatsApp - wajib verifikasi OTP, Email, Tempat/Tanggal Lahir, Alamat Domisili).
  - **Akses Slide 2 Dinamis**: Tombol "Lanjutkan ke Verifikasi KTP" hanya akan muncul secara dinamis setelah seluruh kolom data utama di Slide 1 diisi dengan lengkap dan nomor WhatsApp telah terverifikasi via OTP.
  - **Slide 2**: Formulir KTP (Unggah Foto KTP, NIK 16-Digit, Alamat KTP, dan RLS security notice).
- **Pembatasan Akses Pasca-Verifikasi**:
  - Jika status verifikasi akun adalah `verified` (telah disetujui), maka Slide 2 (KTP) disembunyikan sepenuhnya dari wizard dan tidak dapat diakses lagi. Tombol simpan data langsung muncul pada Slide 1 untuk mempermudah pembaruan data profil dasar saja.
  - Jika status verifikasi ditolak (`rejected`), Slide 2 tetap dapat diakses oleh Mitra untuk mengevaluasi data KTP yang salah dan mengunggah ulang dokumen verifikasi yang benar sebelum menekan tombol "Simpan & Ajukan Verifikasi".

### 2. Integrasi Formulir Terpadu Edit Profil & Verifikasi Identitas Mitra (Juni 2026)
- **Formulir Edit Profil Terpadu (Single Unified Form)**: Menyatukan formulir input edit profil dan dokumen verifikasi identitas (KTP) ke dalam satu halaman formulir terpadu yang kohesif saat status `isEditing === true`. Menghilangkan layout dua kolom terpisah ketika edit aktif agar posisi input verifikasi tidak menumpuk di bagian bawah layar smartphone (mobile view).
- **Pembersihan Rekening Bank & Penyederhanaan Verifikasi**:
  - Menghapus informasi Rekening Bank sepenuhnya dari halaman profil pemilik kost (Mitra) karena data ini sudah dikelola terpisah di menu Dompet.
  - Menghapus kartu petunjuk edukatif "Kenapa Harus Verifikasi?" untuk menghemat ruang dan menyederhanakan formulir.
- **Penyempurnaan Data Profil**:
  - Menambahkan Alamat Email (read-only), Tempat Lahir, dan Tanggal Lahir (dilengkapi dengan pemilih tanggal dinamis) ke dalam formulir profil.
  - Menjaga keutuhan tombol pengiriman OTP WhatsApp, notifikasi perlindungan data RLS Supabase, dan auto-pindai KTP berbasis OCR (Tesseract.js).
- **Alur UX Kolaboratif & Responsif**:
  - Saat mode baca (`isEditing === false`), profil ditampilkan dalam card informatif terpisah, dilengkapi card status verifikasi saat ini (Belum Terverifikasi, Sedang Ditinjau, Terverifikasi, Ditolak).
  - Ketika tombol "Edit Profil" atau "Lengkapi & Verifikasi" ditekan, antarmuka bertransformasi menjadi satu formulir pengisian data terpadu dengan judul "Lengkapi Profil & Verifikasi", dilengkapi tombol aksi "Batal" dan "Simpan Semua Data" di bagian bawah.

### 2. Kustomisasi Template Email Autentikasi & Pembersihan Database Auth (Juni 2026)
- **Desain HTML Email Responsif & Premium**: Mengganti email konfirmasi pendaftaran (`signup`) dan reset kata sandi (`recovery`) yang sebelumnya berupa teks polos menjadi format HTML premium. Dilengkapi logo resmi RuangSinggah.id, skema warna oranye gradien, typography bersih, tombol Call-to-Action (CTA) berbayang, dan fallback URL link.
- **Pembersihan Data Yatim (Orphaned Profiles)**: Menyelesaikan kendala `unexpected_failure` saat klik link verifikasi email dengan membersihkan profil usang (data yatim) di tabel `public.users` yang melanggar unique constraint email.
- **Perbaikan Alur Reset Sandi (Password Recovery)**: Menambahkan penanganan event `PASSWORD_RECOVERY` pada callback autentikasi di `App.tsx` untuk mengalihkan sesi ke form penyetelan kata sandi baru (`/login?mode=recovery`), serta menyesuaikan pengalihan dashboard agar tidak mem-bypass form reset sandi saat mode recovery aktif.

### 2. Peningkatan Desain, Styling, dan Visual Dashboard Mitra (Owner) (Juni 2026)
- **Desain Tipografi & Hirarki Teks Premium**: Mengurangi penggunaan `font-black` (bobot 900) yang terlalu dominan pada navigasi dan label umum, digantikan dengan kombinasi `font-bold` dan `font-semibold` yang lebih bersih, elegan, dan profesional.
- **Navigasi Desktop & Mobile yang Estetik**:
  - Mempercantik sidebar desktop dengan hover transition halus dan warna aktif bergradasi jingga ke amber (`bg-gradient-to-r from-orange-500 to-amber-500`).
  - Mengoptimalkan mobile bottom nav dengan sudut melengkung `rounded-2xl`, transisi aktif yang menonjol (`scale-105` dan bayangan lembut), serta label teks yang lebih tertata rapi.
- **Stat Cards & Informasi Pengguna**: Memperbarui visual kartu statistik dengan bayangan ultra-tipis (`shadow-[0_8px_30px_rgba(0,0,0,0.01)]`) dan kontras yang lebih tajam. Box profil pengguna di sidebar kini memiliki border halus `border-gray-100/40`.
- **Dompet Digital Mewah**: Mendesain ulang kartu saldo utama pada panel Dompet (Wallet) dengan tema gelap bergradasi (`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900`) untuk memberikan kesan dompet digital yang premium.

### 2. Optimasi Menyeluruh Dashboard Mitra (Owner) (Juni 2026)
- **Sistem Tarik Dana (Wallet/WD) Pemilik Kost**:
  - Menghubungkan tombol "Tarik Dana Sekarang" pada dashboard pemilik dengan alur penarikan dana terverifikasi.
  - Menambahkan modal konfirmasi penarikan yang menampilkan detail rekening bank (bank, no rek, atas nama) dan total nominal dengan validasi batas saldo minimal Rp 10.000.
  - Memperbarui fungsi pengiriman data ke database Supabase pada tabel `withdrawal_requests` (mengisi kolom `agent_id` menggunakan UID pemilik) dan mengirim notifikasi email ke Admin via FormSubmit.
  - Mengubah tampilan saldo dompet agar merujuk ke `stats.availableBalance` secara dinamis (didapat dari total pendapatan sewa dikurangi total penarikan non-rejected).
- **Penggabungan Riwayat Transaksi Dompet (Unified History)**:
  - Menggabungkan riwayat pembayaran pesanan sewa (`bookings` berstatus PAID/COMPLETED) sebagai arus masuk (IN) dan pengajuan penarikan dana (`withdrawal_requests`) sebagai arus keluar (OUT) ke dalam satu linimasa transaksi tunggal secara kronologis.
- **Manajemen Properti/Kost Aktif**:
  - Menghidupkan tombol "Preview" kost agar mengalihkan pengguna ke halaman detail kost publik `/kost/:id` yang sesuai.
  - Menambahkan tombol aksi Hapus Kost (ikon `Trash2` berwarna merah) lengkap dengan dialog konfirmasi aman untuk menghapus iklan langsung dari database Supabase (`properties`).
- **Penanganan Dependensi Hilang (Compile Safety)**:
  - Menambahkan impor `getOrCreateChatSession` yang sebelumnya terlewat untuk menghindari error runtime pada inisiasi chat pemilik kost.

### 3. Verifikasi OTP WhatsApp pada Pendaftaran Mitra & Pemindahan Info Referral (Juni 2026)
- **Interseptor Pendaftaran Pemilik Kost**: Menambahkan gerbang verifikasi 2-Faktor sebelum pengiriman tautan konfirmasi email.
- **Pengiriman OTP Otomatis**: Menghasilkan OTP 6-digit acak dan mengirimkannya melalui Meta Cloud API (`sendWhatsAppTemplate`) dengan fallback aman.
- **UI Premium & Responsif**: Halaman input OTP minimalis yang responsif, lengkap dengan countdown kirim ulang 60 detik dan tombol pembatalan.
- **Pemindahan Banner Referral Agen**: Menyingkirkan kartu/banner Program Kemitraan Agen (Referral) dari halaman beranda/overview [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/AgentDashboard.tsx) dan memindahkannya ke dalam tab Profil di [AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/AgentProfile.tsx) dengan tambahan fungsionalitas tombol "Salin" kode referral secara langsung.
- **Desain Header Rekomendasi Utama Ultra-Kompak**: Merombak total bagian "Kost Pilihan Hari Ini" di [Home.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/Home.tsx) pada layar mobile agar tidak memakan banyak ruang vertikal. Judul dan tombol navigasi disusun berdampingan secara horizontal (*side-by-side*), teks tombol otomatis menyesuaikan menjadi "Lihat Semua" dengan ikon panah minimalis, serta mengurangi tinggi padding bagian tersebut agar tetap keren, simpel, informatif, dan fungsional.

### 4. Perombakan Sistem Survey Multi-Kost (Mei 2026)
- **Consolidated Order-based Detail Page**: Merombak tampilan model "N-card" yang terpisah menjadi 1 halaman detail pesanan berbasis transaksi yang elegan, bersih, dan premium di `MyKost.tsx`.
- **Granular Multi-Kost Sync (`adminService.ts`)**: Modifikasi `syncSurveyRequest` untuk secara otomatis mengiterasi dan menyisipkan N baris `survey_requests` unik untuk setiap kost yang didaftarkan (terhubung melalui `transaction_id` yang sama).
- **Dashboard Petugas Terkonsolidasi (`SurveyManagement.tsx`)**: Mengelompokkan seluruh survey_requests berdasarkan transaksi di panel Admin/Agen, memungkinkan petugas mengelola status, checklist, foto, dan komunikasi per unit kost secara terpadu.
- **Progress Tracking & Independensi**: Visualisasi persentase penyelesaian kost secara real-time dan pemberian kebebasan bagi pengguna untuk mengonfirmasi atau melihat laporan setiap unit kost secara instan tanpa menunggu seluruh kost selesai.
- **Order-Level Agent Assignment**: Penyederhanaan dashboard Admin dengan memungkinkan penetapan Agen Surveyor dilakukan cukup 1 kali pada level pemesanan (mencakup semua unit kost yang disurvey di dalamnya), mengatur Drive Links secara terpusat, dan menyembunyikan aspek penilaian dari Admin saat proses awal.
- **Order Tab Synchronization**: Memperbaiki perilaku Tab "Kost Saya" (Diajukan/Aktif/Riwayat) agar kartu Order tidak terpecah ke tab berbeda. Order akan tetap di tab "Aktif" meskipun ada 1 unit yang sudah "Selesai", dan baru pindah ke "Riwayat" jika seluruh unit di dalam transaksi tersebut sudah "Selesai".

### 2. Edukasi & Artikel Pilihan (SEO & GEO Optimization) (Mei 2026)
- **Halaman Hub Artikel & Edukasi (`Articles.tsx`)**: Pembuatan antarmuka premium untuk memuat daftar panduan dan artikel editorial. Didesain ulang sepenuhnya menjadi Portal Berita & Media Premium berstandar Google News, lengkap dengan Laporan Utama (Featured Hero Card), kategori kanal navigasi horizontal, kolom pencarian instan, sidebar detail artikel dengan rekomendasi bacaan populer, profil kontributor penulis, tautan berbagi sosial, dan kotak berlangganan newsletter mingguan.
- **Injeksi Data Terstruktur JSON-LD Dinamis**: Menyuntikkan schema `Article` terstruktur secara dinamis di `<head>` dokumen saat artikel tertentu dibaca untuk kemudahan web crawling dan AI search crawlers.
- **Pilar Artikel Kontekstual (Entity-Rich)**: Menulis 3 artikel penjelasan entitas (Mengenal RuangSinggah.id / PT Ruang Singgah Nusantara, Panduan Jasa Survey Kost, dan optimasi KostManager) untuk memperkaya pemahaman mesin pencari dan AI (SGE/Gemini/SearchGPT).
- **Sistem CMS Editor Visual Admin (`ArticleManagement.tsx`)**: Menambahkan panel manajemen artikel interaktif di dashboard admin dengan real-time rendering, editing format visual HTML/Markdown, auto-slug generator, dan kalkulator waktu baca otomatis.
- **Integrasi Editor Visual TinyMCE (`@tinymce/tinymce-react`)**: Mengganti editor visual dengan TinyMCE standard industri yang kompatibel dengan React 19. Dilengkapi dengan fitur drag-and-drop & copy-paste gambar, visual image resizing (menyeret pojok gambar), pembuatan tabel, pemilih font/ukuran/warna, serta integrasi uploader gambar otomatis ke Supabase Storage (bucket `banners` di folder `articles/`).
- **Dukungan Thumbnail Cover Artikel & Penyelarasan Layout Reader**: Menghadirkan uploader gambar cover/thumbnail untuk artikel baru dengan live preview di admin. Menghapus input pemilih emoji cover (`icon`) dan gradient cover (`gradient`) dari form admin CMS agar antarmuka lebih bersih dan modern sesuai standar industri properti proper. Memperbaiki halaman detail artikel (`Articles.tsx`) agar mendukung styling inline format visual (perataan gambar, tabel border, lists, blockquote oranye), perbaikan rendering eksplisit elemen Heading (H1-H6) dan Paragraf agar presisi sesuai masukan editor visual, serta menyinkronkan data thumbnail cover ke skema JSON-LD untuk mempermudah Google Search Snippet dan AI Search crawling.

### 3. Optimalisasi Pembayaran Midtrans Production (Mei 2026)
-   **DANA & GoPay Professional Flow**: Implementasi Snap Redirect untuk DANA dan Direct Charge Deeplink untuk GoPay.
-   **Otomatisasi Redirect**: Browser otomatis membuka aplikasi e-wallet setelah pemilihan metode.
-   **Metadata Profil Lengkap**: Sinkronisasi Nama, Email, HP, dan Alamat pembayar ke Midtrans Production untuk keamanan transaksi.
-   **Categorized Payment UI**: Pengelompokan metode pembayaran (VA, E-Wallet, Retail) dengan desain premium.
-   **Integritas Label Transaksi**: Penyesuaian nama produk (Database, Survey, Booking) di database Supabase dan Midtrans.
-   **Penyelesaian Data Loss**: Pemulihan file `Products.tsx` dan `SurveyService.tsx` yang sempat kosong.

### 4. Sistem Pelacakan Real-Time Survey Kost (Timeline Tracker) (Mei 2026)
- **Tombol Lacak Interaktif**: Mengubah status statis ("Menunggu" / "Cari Agen") di baris unit kost dashboard pengguna menjadi tombol interaktif "Lacak" yang berdenyut (*pulse animation*) untuk meningkatkan kejelasan tindakan pengguna.
- **Modal Stepper Timeline**: Pembuatan Modal Timeline Tracker interaktif dan elegan di halaman `MyKost.tsx` yang memetakan tahapan survei secara berurutan: Menunggu Pembayaran, Mencari Agen, Agen Ditetapkan, Menuju Lokasi, Proses Audit Lapangan, hingga Laporan Selesai.
- **Informasi & Chat Surveyor**: Menampilkan profil lengkap surveyor (nama, foto) serta tombol pintas chat WhatsApp langsung dari dalam modal pelacakan.
- **Pintasan Aksi Kontekstual**: Menyediakan tombol konfirmasi penyelesaian (jika laporan terunggah) atau unduhan laporan detail hasil survei secara instan dari dalam modal pelacakan.
- **Pembersihan Bug Kompilasi**: Melakukan refactoring properties objek duplikat (`monthMap` dan `existing_facility_id`) untuk memastikan keberhasilan build Vite.

### 5. Pemasaran & Keandalan SEO (SEO & GEO Crawlability) (Mei 2026)
- **Aturan robots.txt Ramah AI (GEO Optimization)**: Mengonfigurasi berkas `robots.txt` agar ramah terhadap crawler AI Generative seperti GPTBot, Google-Extended, ClaudeBot, dan PerplexityBot. Mengizinkan mereka merayap halaman publik dan artikel editorial, serta tetap memblokir rute privat/dashboard admin guna menghindari kebocoran data.
- **Input Alt-Text Gambar Cover CMS (`ArticleManagement.tsx`)**: Menambahkan kolom input Alt-Text deskripsi gambar cover artikel yang diunggah. Wajib diisi jika gambar cover diset, guna mempermudah indeks Google Images dan pencarian visual oleh AI Search Engines.
- **Penyelarasan Alt-Text & Rendering Gambar detail (`Articles.tsx`)**: Memetakan kolom `image_alt` dari database Supabase dan merender seluruh tag `img` artikel (pada cover detail, featured post, list card, dan artikel populer) dengan atribut `alt` yang dinamis untuk aksesibilitas yang optimal.
- **Injeksi Meta Tag SEO/OpenGraph Dinamis via React Helmet (`Articles.tsx`)**: Memasang komponen `<Helmet>` dari `react-helmet-async` untuk menyuntikkan judul dinamis, deskripsi meta, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`), serta Twitter Card tags secara dinamis pada saat pengguna membaca artikel tertentu.
- **Sitemap XML Dinamis berbasis Cloud Function (`index.ts`)**: Membuat Firebase HTTPS Cloud Function `/sitemap` yang melakukan query langsung ke database Supabase (`articles`) untuk menghasilkan berkas sitemap XML dinamis.
- **Penghapusan Sitemap Statis & Konfigurasi Rewrites (`firebase.json` & `firebase-hosting.json`)**: Menghapus berkas `sitemap.xml` statis lama dari direktori public dan menambahkan rewrite rule pada `firebase.json` serta `firebase-hosting.json` lokal agar permintaan `/sitemap.xml` diarahkan secara dinamis ke Cloud Function.

### 6. Perbaikan Otomatisasi Google Drive Per Unit Kost (Mei 2026)
- **Logika Sinkronisasi Tingkat Backend (`syncSurveyRequestsBackend`)**: Memigrasikan pemisahan dan pembuatan entri database `survey_requests` dari client-side ke backend. Hal ini memastikan setiap unit kost yang dipesan dalam transaksi multi-kost terdaftar secara granular sejak checkout dibuat, mandiri dari tindakan pengguna di browser.
- **Pemberkasan Drive Granular Multi-Kost**: Merombak fungsi webhook/simulator pembayaran (`completeSurveyProcess`) agar mendukung pencarian multi-row. Sistem secara otomatis melakukan loop pada seluruh kost dalam satu transaksi, memanggil Google Drive API secara terpisah untuk membuat folder individual, dan memperbarui status serta link Drive (`result_drive_link`) secara granular per unit kost.
- **Standarisasi Penamaan Folder**: Memperbarui format penamaan folder (baik melalui pemicu pembayaran otomatis maupun pembuatan manual) menjadi `Survey - [Nama Kost] - [ID Survey 8 Karakter]` guna mencegah bentrok nama file/folder di Google Drive.
- **Tombol Cepat Pembuatan Folder Drive Manual**: Menambahkan tombol "Buat Folder" di samping nama kost pada Modal Edit Order. Tombol ini hanya muncul jika tautan Drive masih kosong, mempermudah admin memicu pembuatan folder secara manual apabila proses otomatisasi gagal.

### 7. Alur Konfirmasi Penugasan Agen Survey (Mei 2026)
- **Konfirmasi Tab Permintaan (Pending)**: Memperbaiki alur penugasan agen survey oleh admin agar tidak langsung aktif (`AGENT_ASSIGNED`). Status tugas kini tetap `PENDING_ASSIGNMENT` saat admin menetapkan agen, memaksa agen untuk mengonfirmasi (menerima atau menolak) tugas terlebih dahulu di tab **Permintaan** pada dashboard agen.
- **Transisi Status yang Benar**: Status berubah menjadi `AGENT_ASSIGNED` dan pindah ke tab **Aktif** hanya setelah agen menekan tombol **Terima Tugas**. Jika agen memilih **Tolak**, penugasan agen dibatalkan (dihapus) dan tugas dikembalikan ke pool admin untuk ditugaskan kembali.

### 8. Penyederhanaan Kategori Jenis Kost pada Evaluasi Survey (Mei 2026)
- **Hanya Checkbox**: Menyederhanakan kategori **Jenis Kost** pada form evaluasi survey dengan menyembunyikan input bintang penilaian keseluruhan, catatan teks/ulasan, dan bukti foto. Kategori ini sekarang murni hanya menampilkan checkbox pilihan tipe kost (Putra, Putri, Campur, Pasutri).

### 9. Pilihan Kamera HP vs Galeri via Action Sheet (Mei 2026)
- **Menu Pilihan Bawah Layar**: Mengganti trigger input langsung dengan Action Sheet (bottom sheet dialog) bergaya native iOS/Android. Ketika Agen mengklik tombol "Tambah Foto", muncul pilihan:
  - **Kamera HP**: Membuka kamera bawaan secara langsung menggunakan atribut `capture="environment"`, memaksa sistem Android/iOS (termasuk Google Pixel) untuk mengambil foto instan.
  - **Galeri / File**: Membuka galeri foto untuk memilih berkas yang sudah ada dengan dukungan banyak berkas (`multiple`).

### 10. Perizinan Folder Google Drive Tulis (Writer) (Mei 2026)
- **Akses Tulis Publik (Anyone with Link can Edit)**: Mengubah perizinan folder Google Drive yang terbuat otomatis untuk setiap survei dari `reader` menjadi `writer`. Hal ini memungkinkan Agen lapangan mengunggah berkas foto/dokumentasi survei secara langsung menggunakan akun Google pribadi mereka tanpa terhambat status hak akses privat folder.

### 11. Sinkronisasi Perutean (Routing) & Auto-Draft Laporan (Mei 2026)
- **Wildcard Redirect**: Menambahkan pengalihan otomatis di `Dashboard.tsx` agar ketika pengguna mengakses URL dasar `/dashboard-agent` langsung, URL secara bersih dialihkan ke `/dashboard-agent/overview`.
- **Search Parameter Sync**: Menyinkronkan sub-tab tugas ("Permintaan", "Aktif", "Riwayat") di dashboard agen dengan URL parameter `?status=pending/active/history` via `useSearchParams`. Melindungi kondisi aktif tab agar tidak ter-reset kembali ke tab "Permintaan" saat browser direfresh secara tidak sengaja.
- **Auto-Draft via LocalStorage**: Menyimpan data isian formulir laporan survei (`surveyForm`) secara otomatis di latar belakang menggunakan `localStorage` dengan kunci unik `survey_draft_${surveyId}`.
- **Auto-Restore & Reset Banner**: Draf laporan yang belum terkirim otomatis dipulihkan saat Agen membuka kembali modal pengisian laporan. Ditambahkan banner visual elegan "Memulihkan draf laporan otomatis" beserta tombol **Mulai Ulang** untuk menghapus draf lama jika surveyor ingin mengisi form kembali dari awal. Draf otomatis dihapus dari memori begitu laporan berhasil dikirim ke database.

### 12. Sistem Penjadwalan Ulang (Reschedule) & Notifikasi Terpadu (Mei 2026)
- **Modal Reschedule Agen Lapangan (`AgentDashboard.tsx`)**: Menyediakan modal input tanggal baru, waktu baru, dan alasan perubahan jadwal (reschedule) saat Surveyor mengajukan penjadwalan ulang pada tugas aktif.
- **Notifikasi Multi-Saluran Real-Time & Email (`notificationService.ts`)**: Mengirim notifikasi otomatis ke pengguna lewat push notification in-app dan email dengan menyertakan detail jadwal terbaru serta alasan spesifik yang diinput oleh Surveyor.
- **Banner Peringatan Penjadwalan Ulang & Sinkronisasi Timeline Tracker (`MyKost.tsx`)**: Menampilkan banner visual peringatan berwarna oranye yang menonjol di bagian atas modal pelacakan pengguna untuk menginformasikan jadwal baru dan alasannya. Menyesuaikan visual timeline pelacakan agar status `RESCHEDULED` terpetakan secara presisi sebagai bagian dari tahap "Surveyor Ditetapkan" dengan status deskripsi yang berubah menjadi "Jadwal Diperbarui".
- **Pencatatan Riwayat Reschedule Kronologis (Audit Trail)**: Mengintegrasikan array `reschedule_history` di dalam kolom JSONB `evaluation_summary` pada tabel `survey_requests`. Setiap kali penjadwalan ulang diajukan oleh agen, rincian jadwal (tanggal, waktu, alasan, timestamp pengajuan) dicatat secara kumulatif dan kronologis.
- **Visualisasi Riwayat Pelacakan User (`MyKost.tsx`)**: Menampilkan daftar "Riwayat Penjadwalan Ulang" bergaya linimasa/timeline vertikal di dalam tracker modal pengguna, diurutkan dari pengajuan terbaru.
- **Sinkronisasi Real-Time Pengguna & Surveyor**: Menambahkan Supabase Postgres Realtime Subscription untuk tabel `survey_requests` di sisi user (`MyKost.tsx`) serta sinkronisasi dinamis hook `useEffect` untuk memperbarui modal pelacakan secara real-time tanpa perlu me-refresh halaman web secara manual.
- **Handling Notifikasi Admin Tanpa Blokir (`emailService.ts`)**: Mengubah logging kegagalan notifikasi admin dari `console.error` menjadi `console.warn` informatif untuk mencegah spam kesalahan bertipe merah pada konsol browser ketika dijalankan di localhost/lingkungan offline.

### 13. Notifikasi Transaksi Admin Menggunakan FormSubmit (Mei 2026)
- **Dinamis ke Seluruh Admin**: Memperbarui `emailService.ts` agar mengambil daftar email seluruh pengguna dengan role `admin` (atau `is_admin === true`) secara dinamis dari database Supabase (`users` table).
- **Pengiriman via FormSubmit**: Mengirimkan email notifikasi transaksi secara asinkron ke setiap admin menggunakan FormSubmit (`https://formsubmit.co/ajax/{email}`), menghemat kuota Brevo yang diprioritaskan hanya untuk pengguna.
- **Notifikasi Pembuatan Transaksi**: Menghubungkan pembuatan transaksi baru (sewa kost, database, jasa survey) dari `PaymentGateway.tsx` (`handlePay`) agar memicu email notifikasi ke admin dengan status PENDING.
- **Notifikasi Pembayaran Berhasil**: Memastikan admin ter-notifikasi ketika status transaksi berubah menjadi PAID (Pembayaran Berhasil).

### 14. Perbaikan Peta Situs (Sitemap) Dinamis & Validasi GSC (Juni 2026)
- **Aturan Hosting Spesifik v2 Cloud Functions**: Mengubah aturan rewrite `/sitemap.xml` di `firebase.json` dan `firebase-hosting.json` menggunakan format penargetan Cloud Functions v2 (menyebutkan `functionId` dan `region` secara eksplisit) untuk mencegah Hosting memulangkan berkas HTML fallback.
- **Penyelarasan Rute & Prioritas**: Mengganti rute lama tidak valid di sitemap (`/survey`, `/faq`, `/hubungi-kami`) dengan rute aktif (`/survey-service`, `/contact`, `/syarat-ketentuan`, `/listings`, `/products`, `/owner`) dan mengatur prioritas perayapan secara logis.
- **Integrasi Properti Kost Dinamis**: Mengueri tabel `properties` Supabase secara langsung dari Cloud Function `sitemap` untuk memetakan rute detail kost `/kost/:id` aktif dengan prioritas tinggi `0.9` ke dalam dokumen sitemap XML secara dinamis.

### 15. Programmatic SEO (pSEO) Halaman Kampus & Area Makassar (Juni 2026)
- **Rute URL SEO Dinamis**: Menambahkan rute `/kost-dekat/:campusSlug` dan `/kost-area/:areaSlug` di `App.tsx` agar mengarah ke halaman Listings.
- **Sinkronisasi Parameter Slug**: Menyinkronkan parameter slug URL ke filter state pencarian di `Listings.tsx` secara otomatis berdasarkan data kampus dan area aktif dari database Supabase.
- **Injeksi Meta Tag Kustom (`react-helmet-async`)**: Menyusun Title, Description, dan Canonical URL secara dinamis dan menuliskannya ke elemen `<head>` situs (misal untuk `/kost-dekat/unhas` dan `/kost-area/jl-sahabat`).
- **Internal Linking Populer**: Menghapus daftar tautan Kampus Populer dan Area Populer di `Footer.tsx` untuk menjaga estetika profesionalisme website, digantikan dengan fokus pada sitemap xml dinamis.
- **Penyuntingan Sitemap XML Dinamis**: Memperbarui Cloud Function `sitemap` di `index.ts` untuk mengueri data kampus & area aktif properti unik dan merendernya sebagai URL sitemap resmi.

### 16. Potongan 30% Jasa Survey untuk Pembeli Database Kost (Juni 2026)
- **Verifikasi Kepemilikan Database**: Mengintegrasikan `getUserTransactions` di `SurveyCheckout.tsx` untuk mendeteksi transaksi database berstatus `'PAID'` milik pengguna.
- **Diskon Dinamis Per Unit Kost**: Menghitung `totalPrice` menggunakan reducer dinamis, menerapkan potongan 30% (`unitPrice * 0.7`) khusus pada unit kost yang bersumber dari `'database'` bagi pengguna yang berhak.
- **Banner Edukasi & Promosi UI**: Menambahkan banner hijau pemberitahuan diskon aktif serta banner kuning edukatif di Step 2 untuk pengguna yang belum memiliki database properti.
- **Rincian Harga Ringkasan & Sukses**: Memperbarui breakdown rincian harga di Step 4 dan halaman sukses pembayaran agar transparan menampilkan potongan harga.
- **Metadata Transaksi Pembayaran**: Menyinkronkan bendera `has_database_discount` dan nilai `discount_amount` ke dalam `paymentMetadata` transaksi di Supabase/Midtrans.

### 17. Sinkronisasi Visibilitas Pesanan Survey Pending (Juni 2026)
- **Sinkronisasi Transaksi Pending (`syncSurveyRequest`)**: Memperbarui logika sinkronisasi client-side agar tidak mengabaikan transaksi survey pending. Transaksi pending kini dimasukkan ke tabel `survey_requests` dengan status awal `AWAITING_PAYMENT` agar dapat terpetakan di UI tab "Diajukan".
- **Scan Menyeluruh (`autoSyncAllSurveys`)**: Mengubah pendeteksian transaksi survey dari murni PAID menjadi pencarian menyeluruh seluruh transaksi survey (`autoSyncAllSurveys`), memicu sinkronisasi otomatis atas order baru maupun pending pada saat memuat halaman "Kost Saya".

### 18. Perbaikan Visibilitas Pesanan Survey untuk Akun Biasa (Juni 2026)
- **Eliminasi Dini Return pada `fetchMyKosts`**: Memperbaiki bug di mana pesanan survey tidak dimuat bagi pengguna biasa yang belum memiliki hunian aktif. Masalah diselesaikan dengan membungkus logika pemrosesan data hunian dalam kondisi `if (data && data.length > 0)` dan menghapus interupsi `return;` awal agar pengambilan data rekomendasi dan `survey_requests` tetap dieksekusi secara sukses untuk semua pengguna.

### 19. Perbaikan Status Pesanan Survey yang Reset Kembali ke Diajukan (Juni 2026)
- **Persistensi Status Progres**: Memperbaiki logika `targetStatus` di fungsi `syncSurveyRequest` agar mempertahankan status berjalan (`existing.status`) yang berada di database. Hal ini mencegah background auto-sync (`autoSyncAllSurveys`) menimpa status aktif/selesai kembali ke status `'PENDING_ASSIGNMENT'` (tab Diajukan) secara terus-menerus.

### 20. Integrasi Dompet Dinamis & Penarikan Saldo Agen (Juni 2026)
- **Kalkulasi Bagi Hasil Otomatis (70/30)**: Mengubah perhitungan pendapatan agen di `AgentDashboard.tsx` agar menggunakan nilai riil transaksi survei (dikali 70% sebagai bagian agen) dari database.
- **Sistem Penarikan Database**: Menghubungkan formulir penarikan saldo dan data rekening bank agen dengan database melalui tabel `withdrawal_requests` dan metadata autentikasi pengguna, menggantikan data mock/dummy sebelumnya.

### 21. Perbaikan Profil Rekening Penarikan Agen & Sinkronisasi Database (Juni 2026)
- **Penyimpanan Dua Arah (Database + Auth)**: Memperbarui fungsi `saveBankSettings` di `AgentDashboard.tsx` agar menyimpan data rekening secara langsung ke tabel `users` publik di database Supabase menggunakan update API, sekaligus memperbarui metadata Auth pengguna untuk memicu event `USER_UPDATED` secara otomatis.
- **Pemuatan Berbasis Database**: Mengubah inisialisasi pemuatan profil rekening di `AgentDashboard.tsx` dari yang sebelumnya membaca `user.user_metadata` (tidak tersedia pada state parent) menjadi membaca langsung dari properti `user.bank_name`, `user.bank_account`, dan `user.bank_account_name` yang berasal dari database, memastikan data rekening tetap utuh dan konsisten saat halaman di-reload.

### 22. Pemisahan Data Sensitif KTP & Rekening Bank (Juni 2026)
- **Tabel Baru untuk Data Sensitif**: Membuat tabel privat `user_verifications` (untuk data KTP) dan `user_bank_accounts` (untuk data Rekening Bank) dengan kebijakan RLS ketat agar data sensitif ini tidak dapat dibaca oleh pengguna lain secara tidak sengaja melalui tabel `users` publik.
- **Konsolidasi Frontend (App.tsx)**: Mengintegrasikan parallel-fetching data dari ketiga tabel saat user melakukan login di `App.tsx` (`fetchUserData`), sehingga component di frontend tetap menerima objek user lengkap tanpa merusak alur state yang ada.
- **Pembaruan Alur Penyimpanan**: Memperbarui `Profile.tsx`, `MitraProfile.tsx`, `AgentProfile.tsx`, `MitraDashboard.tsx`, dan `AgentDashboard.tsx` agar menyimpan data verifikasi KTP dan data rekening langsung ke tabel privat masing-masing.

### 23. Pembaruan Estetika & Keteraturan Modal Konfirmasi Penarikan (Juni 2026)
- **Redesain Tata Letak Modal**: Merapikan visual modal konfirmasi penarikan pada `AgentDashboard.tsx` dan `Dashboard.tsx` agar menggunakan tata letak card terstruktur, penempatan ikon bank `🏦`, serta pemisahan visual yang jelas untuk nominal penarikan.
- **Pembersihan Tipografi**: Menghapus kapitalisasi penuh (screaming text) pada teks judul, deskripsi, dan label, menggantinya dengan casing tulisan yang bersih, modern, dan profesional.
- **Tombol Aksi Bersanding**: Mengubah susunan tombol aksi utama (Konfirmasi/Batal) menjadi bersanding (side-by-side) dengan penyesuaian efek shadow dan hover yang premium.

### 24. Perbaikan Visibilitas Saldo & Transaksi Dompet Agen (Juni 2026)
- **Sinkronisasi Rute Wallet**: Menambahkan `'wallet'` ke dalam `DashboardMenu` di `Dashboard.tsx` dan memperbarui event trigger pemuatan data agar memanggil `loadSurveyRequests` saat `activeMenu === 'wallet'`. Ini memperbaiki bug di mana saldo pendapatan agen tiba-tiba menjadi Rp 0 dan riwayat transaksi terakhir kosong setelah halaman ter-reload di menu dompet.

### 25. Otomatisasi Notifikasi Email WD via FormSubmit (Juni 2026)
- **Notifikasi Tanpa WA**: Menambahkan helper `notifyAdminWithdrawalRequest` di `emailService.ts` untuk mengirim notifikasi rincian pengajuan penarikan dana agen secara langsung ke seluruh admin via FormSubmit.
- **De-aktivasi WhatsApp Redirect**: Menonaktifkan tautan eksternal WhatsApp pada form pengajuan penarikan dana agen di `AgentDashboard.tsx` sehingga data dikirim di latar belakang secara asinkron tanpa mengalihkan browser pengguna.

### 26. Dashboard Panel Kelola WD Admin (Juni 2026)
- **Komponen Manajemen Baru (`WithdrawalManagement.tsx`)**: Membuat panel administrasi terpusat untuk menampilkan, memfilter, menyetujui, dan menolak pengajuan penarikan dana dari agen.
- **Aksi Persetujuan Manual**: Mendukung verifikasi manual (transfer secara mandiri oleh admin) lalu memperbarui status penarikan menjadi Selesai (`approved`) atau Ditolak (`rejected`) dengan satu kali klik.
- **Menu Navigasi Sidebar**: Menambahkan rute visual navigasi "Kelola WD" 💸 di sidebar admin untuk efisiensi kelola.

### 27. Perbaikan Duplikasi Order Survey & Race Condition (Juni 2026)
- **ID Deterministik (`generateDeterministicUuid`)**: Membuat generator UUID deterministik berbasis hash string `transactionId_index` untuk mengidentifikasi baris target secara unik.
- **Eliminasi Ganda di Database**: Memodifikasi fungsi `syncSurveyRequest` agar menetapkan ID deterministik ini sebelum operasi penulisan, yang secara otomatis mencegah terjadinya duplikasi record meskipun fungsi sinkronisasi dipanggil secara asinkron atau konkuren (race condition). Panggilan duplikat/konkuren sekarang akan meng-update baris data yang sama secara aman.

### 28. Grafik Dinamis Aktivitas Survey 7 Hari Terakhir & Desimal Y-Axis (Juni 2026)
- **Visualisasi Bergulir 7 Hari Terakhir**: Mengubah visualisasi aktivitas survey pada dashboard agen dari yang sebelumnya statis/dummy dan kaku pada Senin-Minggu menjadi rentang bergulir (*rolling*) 7 hari terakhir (H-6 hingga hari ini) agar data yang disajikan lebih relevan dan tidak kosong di awal minggu.
- **Sumbu Y Non-Desimal**: Menambahkan properti `allowDecimals={false}` pada sumbu Y (`<YAxis>`) agar skala grafik hanya menampilkan bilangan bulat, menghindari nilai desimal yang tidak logis untuk jumlah tugas survey.

### 29. Sistem Penilaian (Rating & Feedback) Agen Survey (Juni 2026)
- **Alur Modal Konfirmasi Ulasan**: Mengubah konfirmasi instan penyelesaian survey pada User (`MyKost.tsx`) agar memicu modal ulasan interaktif (Rating Bintang 1-5 & Teks Masukan) untuk menilai kepuasan kinerja agen lapangan.
- **Visual Bintang Dinamis di Agen Dashboard**: Memperbaiki visualisasi bintang ulasan dan rating rata-rata di dashboard agen (`AgentDashboard.tsx`) agar dinamis mencerminkan penilaian riil database (`user_rating` & `user_comment`) alih-alih data dummy/statis.

### 30. Perbaikan Loop Render Kelola WD Admin (Juni 2026)
- **Eliminasi Infinite Render Loop**: Memisahkan status loading global milik parent (`Dashboard.tsx`) dari `WithdrawalManagement.tsx` with beralih ke state `localLoading` lokal. Hal ini mencegah siklus unmount/remount tanpa henti yang sebelumnya mengakibatkan glitches/flickering dan loading selamanya ketika mengakses menu Kelola WD di Dashboard Admin.

### 31. Perbaikan Relasi Database Kelola WD Admin (Juni 2026)
- **Manual Mapping/Join di Client-Side**: Mengganti join resource `.select('*, agent:users(...)')` di `WithdrawalManagement.tsx` dengan pemanggilan data bertahap dan melakukan pemetaan (matching) manual berbasis `Map` di frontend. Ini mengatasi error PostgREST `PGRST200` akibat tidak adanya foreign key eksplisit di database antara tabel `withdrawal_requests` dan `users`, sehingga pengajuan penarikan dana agen dapat tampil dengan sukses di dashboard admin.

### 32. Penurunan Batas Saldo Minimal Penarikan Agen Survey (Juni 2026)
- **Batas Withdraw 10k**: Mengubah validasi saldo minimal penarikan di `AgentDashboard.tsx` dan `Dashboard.tsx` dari Rp 50.000 menjadi Rp 10.000, serta menyelaraskan notifikasi pesan alert agar sesuai dengan batas minimum baru.

### 33. Perbaikan Akurasi Penjadwalan Grafik Aktivitas Surveyor (Juni 2026)
- **Deteksi Tanggal Kerja Dinamis**: Mengubah dasar penentuan tanggal grafik di `AgentDashboard.tsx` dari yang sebelumnya kaku pada `updated_at` (yang ditimpa tanggal konfirmasi pelanggan) menjadi menggunakan pembacaan properti `submitted_at` di `evaluation_summary` atau ekstraksi epoch timestamp dari nama file foto bukti.
- **Auto-logging `submitted_at`**: Menambahkan penyimpanan tanggal submission secara otomatis (`submitted_at: new Date().toISOString()`) pada skema `evaluation_summary` saat surveyor mengirimkan laporan baru.

### 34. Pembersihan Focus Ring Outline Hitam pada Grafik Recharts (Juni 2026)
- **Reset Outline Focus**: Menambahkan global CSS reset pada `index.css` dan properti `wrapperStyle` pada `<RechartsTooltip />` di `AgentDashboard.tsx` untuk menghilangkan outline hitam tebal (focus ring) yang mengganggu estetika saat bar grafik di-hover/di-click oleh pengguna.

### 35. Perbaikan Responsivitas Layout Dompet & Pendapatan Agen (Juni 2026)
- **Pencegahan Horizontal Overflow**: Mengintegrasikan `min-w-0` pada flexbox row transaksi dan menerapkan efek `truncate` pada properti judul transaksi (`tx.title`) yang sering kali diisi oleh URL Google Maps panjang. Ini mencegah container membesar ke kanan.
- **Penyelarasan Teks Tab Navigasi**: Menurunkan ukuran font tab dompet menjadi `text-[10px] sm:text-xs` dan memperpendek letter spacing menjadi `tracking-wider` agar muat dalam area layar handphone tanpa terpotong.

### 36. Menyembunyikan Footer Global di Halaman Dashboard & Perbaikan Layout Dompet (Juni 2026)
- **Kondisional Footer di `App.tsx`**: Mengubah variabel `isDashboardPage` agar mencakup Admin (`Page.DASHBOARD_ADMIN`), Agent (`Page.DASHBOARD_AGENT`), Mitra (`Page.DASHBOARD_MITRA`), dan Owner (`Page.DASHBOARD_OWNER`) dashboard, lalu menyembunyikan footer global di halaman-halaman tersebut (`{!isDashboardPage && <Footer ... />}`). Ini menghasilkan dashboard yang bersih dan menghilangkan horizontal overflow yang disebabkan footer global pada viewport seluler.
- **Integrasi Fitur Logout Agen**: Mengalirkan callback `onLogout` dari `App.tsx` via `Dashboard.tsx` ke `AgentDashboard.tsx`. Menyediakan tombol "Keluar Akun" (penghapusan session login dengan ikon `LogOut`) pada sidebar desktop dan mobile overlay untuk proses sign-out yang aman dari Supabase Auth, serta menghapus opsi "Kembali ke Beranda" agar dashboard tetap fokus pada operasional agen.

### 37. Sistem Kode Referral Khusus Agen Survey (Juni 2026)
- **Autogenerasi Kode Referral Agen**: Mengimplementasikan autogenerasi kode referral berformat `AG-XXXXXX` pada `AgentDashboard.tsx` apabila profil agen terdeteksi belum memiliki kode referral. Kode ini disimpan otomatis ke dalam database Supabase.
- **Pembaruan UI Dashboard & Profil**: Menampilkan banner info program kemitraan (referral) dengan gradien warna premium orange-kuning lengkap dengan tombol "Salin Kode" pada dashboard agen, serta menayangkan field non-editable "Kode Referral" pada detail halaman profil agen (`AgentProfile.tsx`).
- **Skema database**: Menambahkan dokumentasi kolom `referral_code` unik pada file `supabase_schema.sql` untuk memudahkan sinkronisasi struktur tabel.

### 38. Sistem Afiliasi Referral Agen & Pendaftaran Tersegmentasi dengan Tabel Terpisah (Juni 2026)
- **Desain UI Gateway Switcher Terpadu (`Login.tsx`)**: Mendesain ulang formulir auth dengan switch tab modern dan premium di bagian paling atas kartu utama yang berlaku untuk mode **LOGIN** maupun **REGISTER** guna membagi peran pendaftar secara eksplisit: "Pencari Kost" (peran: `user`) dan "Pemilik Kost" (peran: `owner`).
- **Judul & Teks Dinamis**: Menyesuaikan judul, subjudul, dan deskripsi formulir secara dinamis berdasarkan peran aktif dan mode auth yang sedang diakses.
- **Input Kode Referral Kondisional**: Menambahkan field input Kode Referral Agen ("AG-XXXXXX") opsional yang hanya muncul ketika pendaftar memilih peran "Pemilik Kost" (Mitra). Input otomatis diselaraskan ke format huruf kapital (*uppercase*) dan dibersihkan dari spasi berlebih untuk menghindari kesalahan penulisan.
- **Pelekatan Afiliasi Metadata Registrasi**: Menghubungkan parameter `role` dan `referred_by` ke payload metadata fetch request saat mendaftar lewat API serverless Cloud Function.
- **Normalisasi Database & Trigger (`supabase_schema.sql`)**: Membuat tabel terpisah `public.agents` dan `public.mitra` yang terhubung 1-to-1 dengan tabel `public.users` lengkap dengan kebijakan keamanan Row Level Security (RLS). Memodifikasi fungsi trigger database `handle_new_user()` agar otomatis memetakan dan menyisipkan data profil ke tabel `agents` atau `mitra` yang sesuai berdasarkan peran akun saat konfirmasi email berhasil, serta mendukung migrasi retroaktif data user lama dengan aman.
- **Integrasi Dashboard & Profil Agen (`AgentDashboard.tsx` & `AgentProfile.tsx`)**: Menyesuaikan pembacaan dan pembaruan kode referral agar terhubung langsung dengan tabel `public.agents` alih-alih `public.users`.

### 39. Perbaikan Trigger Konfirmasi Email & Alur Login Registrasi (Auth) (Juni 2026)
- **Perbaikan Sintaks SQL pada ON CONFLICT**: Mengatasi error `500 unexpected_failure (Error updating user)` saat verifikasi link email diklik dengan cara memperbaiki sintaks PostgreSQL pada trigger `handle_new_user()`. Kualifikasi nama skema penuh (`public.`) telah dihapus pada bagian `DO UPDATE SET` (`public.users.role` -> `users.role` dan `public.mitra.referred_by` -> `mitra.referred_by`) karena bertentangan dengan aturan standar SQL PostgreSQL dan memicu kegagalan kompilasi/eksekusi runtime.
- **Explicit Type Casting enum**: Menambahkan casting tipe data `::public.user_role` pada nilai string `role` yang di-insert agar sesuai dengan tipe data kolom asli `role` di tabel `public.users` database.
- **Interseptor Redirect Verifikasi (No Auto-Login)**: Memperbaiki perilaku auto-login otomatis setelah link email diklik pada alur PKCE (`?code=...`). Menambahkan deteksi parameter `code` (tanpa `mode=recovery`) pada interseptor `App.tsx` agar langsung memaksa `signOut()` dan mengalihkan pengguna ke `/login?verified=true` untuk memasukkan email dan password secara manual sesuai dengan alur UX yang diharapkan.
- **Penyelarasan Berkas Skema**: Menyesuaikan berkas dokumentasi skema lokal `supabase_schema.sql` serta membuat file SQL perbaikan siap-pakai `fix_trigger.sql` agar dapat langsung dieksekusi oleh pemilik database.

### 40. Penyederhanaan Layout Template Email Autentikasi (Juni 2026)
- **Penghapusan Logo**: Menghapus tag logo `<img>` dari header email pada template email kustom (`handleCustomAuthEmail`) di Cloud Functions untuk menghasilkan tampilan visual yang lebih bersih dan minimalis.
- **Penyederhanaan CTA**: Menghilangkan bagian kontainer `<!-- Fallback URL -->` yang berisi tautan alternatif mentah di bagian bawah email, menyisakan hanya tombol CTA utama yang rapi dan fungsional.

### 41. Batasan Gerbang Login Unik per Role & Menu Dashboard Mitra (Juni 2026)
- **Pencegahan Login Salah Gerbang**: Membatasi pengguna biasa (`user`) agar tidak bisa masuk to portal mitra (`owner`). Jika mencoba masuk via tab Pemilik Kost, sesi langsung ditutup (`signOut`) dan diarahkan ke login dengan pesan kesalahan yang sesuai.
- **Tampilan User Biasa untuk Mitra**: Mengizinkan Pemilik Kost (`owner`) masuk melalui portal user (`user`), tetapi secara visual diatur agar bertindak dengan peran `user` biasa sehingga tidak bisa mengakses menu dashboard mitra.
- **Normalisasi Peran Database**: Memastikan peran database `'mitra'` dikonversi dengan benar menjadi `'owner'` sebelum pemeriksaan login dilakukan guna mencegah kegagalan login bagi pemilik kost lama.
- **Pemulihan Otomatis Chunk Load Error**: Mengintegrasikan listener global pada `error` dan `unhandledrejection` untuk mendeteksi kegagalan dynamic import modul (Chunk Load Error) akibat proses build/deploy baru, serta memicu penyegaran halaman (`window.location.reload()`) secara otomatis agar pengguna langsung menerima versi web terbaru.
- **Hamburger Menu Seluler (Dashboard Mitra)**: Menambahkan header atas khusus seluler di `MitraDashboard.tsx` dengan ikon `Menu` untuk memicu pembukaan overlay sidebar navigasi pada perangkat smartphone.
- **Tombol Logout Akun Eksklusif**: Mengalirkan callback `onLogout` global ke dashboard mitra dan menyediakan tombol "Keluar Akun" (merah, ikon `LogOut`) yang benar-benar mematikan sesi autentikasi Supabase, serta menghapus tombol "Kembali ke Beranda" sepenuhnya sesuai instruksi pengguna.
- **Perbaikan Resolusi Overlap Z-Index**: Mengubah z-index kontainer sidebar seluler dari `z-50` menjadi `z-[100]` sehingga menutup bar navigasi bawah seluler (`z-50`) sepenuhnya saat sidebar aktif tanpa saling bertumpang tindih.

### 42. Redesain Menu Penghuni Aktif Dashboard Mitra (Juni 2026)
- **Kartu Penghuni Kolapsibel (Collapsible Card)**: Mengurangi ruang vertikal layar secara signifikan dengan menyembunyikan detail sekunder ("Paket & Durasi", "Jadwal Sewa", dan "Rincian Tagihan") di dalam accordion yang dapat dibuka/tutup secara interaktif menggunakan tombol chevron.
- **Optimasi Layout & Spacing**:
  - Mengurangi padding kartu dari `p-6 lg:p-12` menjadi `p-4 md:p-6` agar lebih padat dan rapi.
  - Memperkecil ukuran foto profil (avatar) dari `w-24 h-24 lg:w-32 lg:h-32` menjadi `w-14 h-14 md:w-16 md:h-16`.
  - Memperkecil ukuran tipografi nama dari `text-3xl lg:text-5xl` menjadi `text-lg md:text-xl` agar lebih proporsional pada tampilan mobile.
- **Ringkasan Informasi collapsed**: Saat dalam keadaan tertutup (collapsed), kartu tetap menyajikan informasi esensial yang sangat informatif (Nama, Badges Kost & Status Aktif/Tenggang/Lunas, Sisa Hari Sewa, Tanggal Selesai Sewa, dan Total Tagihan Bulanan).
- **Aksi Cepat Kompak**: Menyusun ulang tombol aksi ("Tandai Selesai", "Tagih", "Chat") ke dalam baris horizontal yang ramping dan hemat tempat.
- **Header Halaman Kompak & Estetis (De-bulking)**: Menghapus box/card pembungkus judul halaman yang besar, memindahkan judul halaman langsung ke background dengan indikator status sewa yang ringkas, serta menyisakan satu tombol Refresh saja.
- **Filter Row Ultra-Ramping**: Menyatukan input pencarian dan dropdown properti menjadi satu baris horizontal setinggi `h-10` dengan font `text-xs`, serta mengeliminasi tombol refresh sekunder yang redundan.
- **Tab Status Horizontal Scroll**: Mengatur tab kategori filter status agar berderet secara horizontal menggunakan `overflow-x-auto flex-nowrap scrollbar-none` untuk mencegah penumpukan baris baru ke bawah di layar smartphone.

### 43. Perbaikan Bug Draf Profil Mitra & Penambahan Kolom Database (Juni 2026)
- **Penambahan Kolom `whatsapp_verified`**: Menambahkan kolom `whatsapp_verified` ke dalam definisi tabel `public.users` dan melengkapinya dengan perintah migrasi `ALTER TABLE` pada berkas `supabase_schema.sql` agar sinkronisasi draf nomor WhatsApp yang terverifikasi tersimpan secara permanen di database.
- **Penanganan Silent Error Supabase**: Memperbaiki pemanggilan `.update()` dan `.upsert()` Supabase di `MitraProfile.tsx` agar mendestruktur object `{ error }` dan men-throw error tersebut ke block `catch`. Ini menghentikan bug silent error di mana pembaruan database gagal akibat kolom tidak lengkap tetapi frontend tetap melaju ke halaman berikutnya seolah-olah berhasil.
- **Notifikasi Error Pengguna**: Menampilkan pesan kesalahan detail via `alert` jika proses penyimpanan draf profil utama gagal agar pengguna mendapatkan petunjuk yang jelas ketika data draf gagal masuk database.
- **Pemuatan Latar Belakang (Silent Loading) Dashboard Mitra**: Mengubah fungsi `loadData` di `MitraDashboard.tsx` agar mendukung parameter `silent`. Panggilan sinkronisasi saat prop `user` diperbarui atau real-time event chat/booking kini dilakukan secara *silent* (tanpa memicu layar loading spinner penuh). Hal ini memperbaiki bug di mana komponen `MitraProfile` ter-unmount secara otomatis dan kehilangan seluruh state aktifnya (seperti `isEditing` dan `currentStep`) saat draf Step 1 berhasil disimpan.
- **Relokasi Foto Profil ke Form Langkah 1**: Menghapus tombol unggah foto profil dari kartu atas (hero header) dan memindahkannya ke dalam grid form Langkah 1 (Step 1) sebagai input opsional terintegrasi. Kartu atas (Profile Hero / Header) kini juga disembunyikan sepenuhnya ketika mode edit aktif (`isEditing === true`) untuk mencegah duplikasi visual dan menghemat ruang layar.



### 44. Penyempurnaan Detail Verifikasi Identitas Calon Mitra untuk Evaluasi Admin (Juni 2026)
- **Pengambilan Detail Verifikasi Terintegrasi (`adminService.ts`)**:
  - Mengubah fungsi `getAdminMitraRequests` agar mengambil data verifikasi dari tabel `user_verifications` (termasuk nomor KTP, alamat KTP, dan foto KTP) serta data pelengkap profil dari tabel `users` (tempat/tanggal lahir, alamat domisili) berdasarkan `user_id` secara paralel.
- **Tampilan UI Evaluasi Admin Komprehensif & Konkrit (`MitraManagement.tsx`)**:
  - Merancang ulang layout grid detail data calon mitra pada antrean verifikasi identitas (tab "Antrean Pendaftar").
  - Menampilkan informasi secara konkrit: Email, No. WhatsApp, Tempat & Tanggal Lahir (dengan format tanggal Indonesia yang rapi), No. KTP, Alamat Domisili, dan Alamat KTP.
  - Membantu admin melakukan evaluasi silang (cross-match) yang valid antara dokumen identitas KTP dan data domisili profil sebelum melakukan persetujuan/penolakan pendaftaran mitra.

## Fitur Dalam Pengerjaan (In Progress)
-   Monitoring konsistensi Webhook Midtrans vs Supabase untuk transaksi multi-kost.
-   Uji E2E transaksi nyata di Production (Smallest Amount).

### 45. Otomatisasi & Penyelesaian Deploy Email Status Mitra (Juni 2026)
- **Sukses Deployment Cloud Function (`sendMitraStatusEmail`)**: Menyelesaikan build TypeScript (`tsc`) backend tanpa error dan sukses mendeploy Cloud Function ke Firebase. Cloud Function ini menangani pengiriman email notifikasi otomatis via Brevo API ke calon mitra saat pendaftaran mereka disetujui atau ditolak dengan alasan penolakan yang diinput oleh admin di Dashboard Admin.

### 46. Sistem Blokir Kemitraan Permanen & Batas Penolakan Maksimal (Juni 2026)
- **Tombol Blokir Kemitraan Manual**: Menambahkan tombol "Blokir Kemitraan" di Dashboard Admin pada tab "Antrean Pendaftar". Admin dapat memblokir secara permanen akses pengajuan kemitraan dari user/calon mitra nakal dengan menyertakan alasan konkrit.
- **Batas Otomatis 3 Kali Penolakan**: Menambahkan pelacakan kolom `rejection_count` pada database. Jika pengajuan verifikasi/kemitraan ditolak sebanyak 3 kali berturut-turut, sistem secara otomatis mengubah status pengguna menjadi `banned` (akses diblokir permanen) dan menurunkan status peran akun kembali ke `user` biasa.
- **Proteksi Halaman Mitra Profile**: Memperbarui halaman `MitraProfile.tsx` untuk membaca status `banned`. Jika terdeteksi, panel pengisian form dan tombol edit akan dinonaktifkan sepenuhnya dan diganti dengan pesan peringatan permanent ban.
- **Email Penegasan Ban via Brevo**: Memperbarui Cloud Function `sendMitraStatusEmail` untuk mendeteksi status `banned` dan mengirimkan email penegasan pemblokiran akun dengan template gelap yang dirancang khusus.

### 47. Kelengkapan Informasi Verifikasi Calon Mitra di Dashboard Admin (Juni 2026)
- **Ekstraksi Field Tambahan KTP**: Memperbarui mapping pengambilan data verifikasi mitra di fungsi `getAdminMitraRequests` pada `adminService.ts` untuk menyertakan data tambahan Step 2 dari database: Jenis Kelamin (`gender`), Agama (`religion`), Pekerjaan (`occupation`), dan Status Perkawinan (`relationship_status`).
- **Visualisasi Grid Komprehensif**: Menambahkan elemen UI baru pada kartu pengajuan di komponen `MitraManagement.tsx` (Antrean Pendaftar) untuk merender Jenis Kelamin, Agama, Status Perkawinan (diterjemahkan secara rapi: "Belum Kawin" untuk `Single`, "Kawin" untuk `Menikah`), dan Pekerjaan agar dapat dicocokkan langsung oleh admin dengan dokumen KTP fisik.

### 48. Penyempurnaan Tampilan Profil, Alur Sinkronisasi Nama, Kunci Verifikasi & Proteksi Email/WA (Juni 2026)
- **Pembersihan Redundansi Tempat/Tanggal Lahir**: Menghapus input Tempat dan Tanggal Lahir dari Langkah 1 (Step 1) edit profil mitra untuk memusatkan input tersebut hanya pada Langkah 2 (Verifikasi KTP) sesuai data resmi.
- **Sinkronisasi Nama Real-time**: Menyelaraskan nama profil (Langkah 1) dengan nama di KTP (Langkah 2) menggunakan sinkronisasi state yang sama secara real-time.
- **Kunci Identitas Terverifikasi**: Menonaktifkan seluruh input identitas KTP di Langkah 2 setelah status akun calon mitra diverifikasi (`verified`) oleh Admin untuk mencegah manipulasi data pasca-acc.
- **Penguncian Email & WhatsApp OTP via Email**: Mengunci input email secara permanen (read-only) demi mencegah pengambilalihan akun secara ilegal. Apabila Mitra mengganti nomor WhatsApp, verifikasi wajib dilakukan dengan menggunakan kode OTP yang dikirimkan ke alamat email terdaftar (default) mereka.
- **Penyembunyian Data KTP Rahasia**: Menghapus seluruh visualisasi data identitas KTP resmi (Langkah 2) dari halaman profil utama read-only Mitra demi privasi dan kerahasiaan data pengguna. Halaman profil kini hanya memuat kartu data dasar & kontak.

## Rencana Selanjutnya (Future Plans)
-   Integrasi laporan keuangan otomatis berbasis transaksi Midtrans.
-   Sistem penarikan dana (payout) otomatis untuk Mitra.

### 49. Banner Campaign Referral Agen + Artikel Program (Juni 2026)
- **Artikel Kampanye Program Referral** (`Articles.tsx`): Menambahkan artikel baru dengan slug `program-referral-agen-ajak-mitra-bonus-50rb` di array `articles[]`. Artikel berisi penjelasan lengkap program referral Rp 50.000/mitra, alur kerja 4-langkah, tips argumentasi kepada pemilik kost, tips sukses lapangan, dan syarat ketentuan program.
- **Banner Campaign Fungsional** (`AgentDashboard.tsx`): Menambahkan banner bergradasi orange-amber di antara grafik "Aktivitas Survey 7 Hari Terakhir" dan section "Tanggapan Pengguna" di tab Overview. Banner memuat judul kampanye, deskripsi singkat, dan tombol navigasi "→" yang jika diklik mengarahkan ke halaman artikel penjelasan campaign.
- **Ticker Nama Mitra Referral**: Di bawah banner terdapat strip tipis oranye yang menampilkan nama pemilik kost yang sudah bergabung via kode referral agen (hanya 3 huruf awal + `***` untuk privasi). Ticker bergulir otomatis setiap 3 detik menggunakan `setInterval`. Jika belum ada referral sama sekali, strip menampilkan pesan motivasi "Belum ada mitra yang bergabung via kode referralmu — Mulai sekarang →".
- **Fetch Data Referral Dinamis**: Menambahkan query `supabase.from('users').select('name, created_at').eq('referred_by', agentReferralCode).eq('role', 'mitra')` yang dieksekusi saat agen login untuk memuat riwayat mitra yang bergabung via referral kode agen yang bersangkutan.

### 50. Fitur Buat Tagihan Manual (Manual Invoice) di Dashboard Admin (Juni 2026)
- **Komponen Baru `ManualBillManagement.tsx`**: Diletakkan di `components/admin/` sebagai komponen standalone yang menangani seluruh logika form + preview bill + print CSS.
- **3 Jenis Tagihan Didukung**:
  - **Komisi Sewa Kost**: Input nama kost, nominal sewa, dan persentase komisi. Nilai komisi dihitung secara otomatis real-time (`rentalAmount × commissionPercent / 100`). Bill menampilkan tabel khusus 4 kolom: Nama Kost | Nominal Sewa | Komisi% | Nilai Komisi.
  - **Jasa Survey**: Multi-item baris bebas (nama jasa + harga satuan + qty → subtotal otomatis).
  - **Database Kost**: Sama dengan jasa survey, multi-item baris.
- **Identitas RuangSinggah.id Jelas**: Header bill bergradasi oranye-amber menampilkan brand name, nama PT, alamat, dan kontak perusahaan.
- **Total Tagihan**: Ditampilkan bold besar di bagian bawah setiap preview bill, dihitung otomatis sesuai jenis tagihan.
- **Print ke PDF**: Tombol "🖨️ Cetak PDF" memanggil `window.print()`. CSS `@media print` yang diinjeksi langsung memastikan hanya area `#bill-print-area` yang tercetak, semua elemen lain (sidebar, form, nav) tersembunyi. Format halaman A4 dengan margin 1.5cm.
- **Preview Real-time**: Panel preview di sisi kanan merefleksikan perubahan form secara langsung tanpa submit. Auto-visible di layar desktop ≥ 1024px.
- **Nomor Bill Auto-generate**: Format `RS-BILL-YYYYMMDD-XXXX` dengan 4 digit angka acak, dihasilkan saat komponen mount. Bisa diedit manual jika perlu.
- **Integrasi Dashboard Admin**: Menu "🧾 Buat Tagihan" ditambahkan ke sidebar admin. Tipe `DashboardMenu` diperluas dengan value `'manual_bill'`. Render dikondisikan `activeMenu === 'manual_bill' && isAdmin`.

### 51. Integrasi Layanan KostManager & Landing Page Premium Mitra (Juni 2026)
- **Halaman Landing Page KostManager (`KostManagerLanding.tsx` & `/kostmanager`)**: Membuat halaman arahan premium untuk mempublikasikan seluruh keuntungan KostManager (survey gratis oleh agen lapangan, pemasaran prioritas di web dan medsos, penagihan digital otomatis). Menambahkan video demo pemutar youtube yang handal untuk semua peramban, serta menyajikan penawaran langganan Rp100.000 / tahun dan formulir pendaftaran kemitraan yang tersimpan ke tabel `mitra_requests` dengan status pending.
- **Banner Dashboard Mitra (`MitraDashboard.tsx`)**: Menyediakan banner interaktif premium bergradasi di atas tab "+ TAMBAH" pada menu "Kost Saya" yang mengarahkan Mitra secara langsung ke landing page `/kostmanager` untuk mempelajari benefit layanan.
- **Hapus Alur Onboarding Awal Form (`KostFormMitra.tsx`)**: Menghilangkan modal dialog pemilihan pengelolaan ("Bagaimana Anda ingin mengelola listing ini?") yang sebelumnya muncul saat tombol "+ TAMBAH" diklik, sehingga Mitra dapat langsung fokus mengisi 6 langkah formulir data properti secara mandiri.
- **Koreksi Media Preview**: Menata kembali struktur markup render preview untuk unggah foto baru dari galeri agar tersaji presisi.

### 52. Sinkronisasi Fitur Properti Kelolaan Portal KostManager & Desain Premium Super Admin (Juni 2026)
- **Penyelarasan Tampilan & Penghapusan Ikon Emoji**:
  - Menghapus ikon emoji pada sidebar tabs modal tambah properti KostManager (`ManagedPropertyAddModal` di `KostManagerPortal.tsx`).
  - Menyamakan tema visual tab bar dengan dashboard admin menggunakan class font dan tracking yang premium (`w-full text-left px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all`).
- **Penambahan Biaya Tambahan (Additional Fees)**:
  - Mengintegrasikan field "Biaya Tambahan" (Nama Biaya, Nominal, dan Ketentuan Penagihan) pada tab "Fasilitas & Biaya" Portal KostManager layaknya di Dashboard Admin.
- **Penyelarasan Fitur Lokasi & Kampus (Estimasi Jarak)**:
  - Menyisipkan visualisasi estimasi jarak & waktu tempuh kampus terdekat serta fasilitas publik terdekat (menggunakan Nominatim search & kalkulator estimasi waktu jalan kaki/berkendara).
- **Integrasi Tab Media & Upload Berkas**:
  - Menambahkan tab "Media" untuk multi-upload gambar utama listing (dengan drag-and-drop reordering), video tour (file local/link youtube), dan link media sosial (Instagram & TikTok).
  - Menggunakan helper `addPropertyWithMedia` dan `updatePropertyWithMedia` dari `adminService.ts` untuk memproses upload file media asli ke Supabase Storage.
- **Navigasi Anti Redirect Loop**:
  - Menghapus auto-redirect `useEffect` yang tidak perlu pada Portal KostManager sehingga tombol "⬅️ Admin Utama" dapat diklik untuk kembali ke panel admin tanpa terjebak redirect loop.
- **Integrasi Foto Kamar Kosong ke Galeri Pemasaran**:
  - Menyinkronkan foto-foto unit kamar yang diunggah pada tab "Tipe Kamar & Penghuni" ke dalam galeri pemasaran publik (`KostDetail.tsx`) secara dinamis, terbatas hanya untuk unit kamar yang tercatat berstatus kosong ("kosong") dan belum dihuni oleh penyewa.
- **Perbaikan Bug Upload Foto Ganda & Validasi WebP**:
  - Memperbaiki bug rendering upload foto kamar ganda (double images) dengan cara memperbarui `handleUploadRoomPhoto` dan `handleDeleteRoomPhoto` menggunakan mapping state non-mutating (safe React update) dan mereset nilai target input (`e.target.value = ''`).
  - Memastikan proses upload foto kamar memanfaatkan utilitas `convertToWebP` di `adminService.ts` sehingga seluruh foto unit dikonversi secara otomatis menjadi berkas format `.webp` yang ringan untuk meminimalkan beban bandwidth pemasaran.
- **Pemuatan Daftar Pemilik (Mitra) Menyeluruh**:
  - Memperbarui query pengisian `ownersList` di `KostEditModal` agar mengambil seluruh daftar pengguna ber-role `'owner'` atau `'mitra'` dari database. Ini mempermudah admin KostManager menautkan kepemilikan properti kelolaan ke mitra mana saja di RuangSinggah.id.
  - Memastikan semua properti kelolaan KostManager yang ada di database ter-load di portal dengan menambahkan pencarian `owner_uid` dari tabel `properties` secara langsung dalam `allOwnerIds` sebelum early return, sehingga data insight dapat terdata dan dipantau oleh mitra di dashboard-nya.
- **Pemisahan Listing Biasa dengan Listing KostManager**:
  - Menambahkan kolom `is_managed` (`BOOLEAN DEFAULT FALSE`) pada skema database `properties` untuk membedakan properti kelolaan KostManager dengan properti/listing biasa.
  - Memfilter properti di Portal KostManager (`KostManagerPortal.tsx` di `loadAllData`) agar **hanya memuat** properti yang memiliki `is_managed = true`. Listing biasa (self-listing mitra maupun upload admin standar) tidak akan dimunculkan lagi di dashboard KostManager.
  - Menyelaraskan komponen UI publik (`KostCard.tsx`, `KostDetail.tsx`, dan `Home.tsx` Rekomendasi Utama) agar label/badge **"Verified"** atau **"Terverifikasi"** bersifat eksklusif hanya untuk properti kelolaan KostManager (`isManaged === true`), tidak muncul untuk listing biasa.








### 53. Fitur Dropdown Cari Pemilik/Mitra Properti Kelolaan KostManager (Juni 2026)
- **Komponen Custom Searchable Dropdown**: Menggantikan dropdown `<select>` statis untuk pemilihan pemilik/mitra properti di portal KostManager (`KostManagerPortal.tsx`) dengan searchable dropdown custom.
- **Pencarian Real-time Nama & No HP**: Memungkinkan admin/pengelola untuk mengetik sebagian nama atau nomor telepon mitra pada kolom input teks filter. Daftar mitra disaring secara dinamis berdasarkan masukan kata kunci tersebut.
- **Visualisasi & Animasi Premium**: Menambahkan visualisasi state aktif/pilih, tombol reset (Clear) instan, state jika data kosong ("Tidak ada mitra yang cocok"), serta transisi CSS lembut dan scrollbar dropdown yang rapi.
- **Pencegahan Klik Luar (Click Outside)**: Menggunakan event listener mousedown global dan React Ref (`ownerDropdownRef`) untuk menutup dropdown panel secara otomatis jika pengguna mengklik di luar area dropdown.
