# Rencana Implementasi: Representasi Langsung 1:1 Modal Editor Properti Terkelola Portal KostManager dari Modal Peninjauan Hasil Pendataan Admin (Editable Direct Representation)

Dokumen ini disusun untuk merespon instruksi pengguna yang menyertakan 5 screenshot referensi dari modal **Peninjauan Hasil Pendataan** di dashboard admin (`KostManagerManagement.tsx`). 

Tujuan utama adalah membuat modal **Editor Properti Terkelola** di **Portal KostManager** (`KostManagerPortal.tsx`) menjadi **representasi langsung 1 banding 1** dari modal peninjauan tersebut, namun **seluruh datanya dapat diedit secara langsung (*interactive editable*)**.

---

## 1. Analisis Masalah & Perbandingan dengan Screenshot Pengguna

Berdasarkan 5 screenshot yang diberikan oleh pengguna:
1. **Screenshot 1 (Tab 1: Data Properti Umum)**:
   - **Header & Top Info Strip**:
     - Status badge `[AKTIF (AUTO-PILOT)]` (hijau), pill gender `[CAMPUR]` (oranye), pill ID `[ID: #3701F42F]`.
     - Nama properti besar `KOST MADANI` dengan alamat di bawahnya `📍 VF9J+7GM, Jl. Politeknik, Tamalanrea Indah...`.
     - Baris info pemilik & surveyor: Avatar bulat oranye `[ a ] PEMILIK / MITRA KOST: abdullah` dengan tombol hijau `[WhatsApp]`, dan di kanan `SURVEYOR LAPANGAN: zhull` dengan tombol biru `[📁 FOLDER GDRIVE]`.
     - Tab strip: `[🏢 1. DATA PROPERTI UMUM  6]`, `[🛏️ 2. DATA KAMAR & PENGHUNI  5]`, `[🛡️ 3. DATA MITRA & KERJASAMA  ✓]`.
   - **Body Tab 1**:
     - Bagian Fasilitas Umum Kost: Kartu hijau `[ (P) ] AREA PARKIR` `📷 Sedang Ditampilkan di Slider` `[ 📷 FOTO AKTIF ]` dengan chip `🏍️ Parkir Motor`, dan kartu `[ 🚿 ] WC UMUM` `📷 Lihat Foto di Slider` `[ ✓ AKTIF ]`.
     - 2 Kolom Alamat & Peta:
       - Kiri: Card `[ 📍 ALAMAT & TITIK KOORDINAT ]` berisi teks alamat lengkap dan 5 kotak data administratif (`PROVINSI`, `KABUPATEN / KOTA`, `KECAMATAN / AREA`, `LATITUDE`, `LONGITUDE`).
       - Kanan: Card `PREVIEW GOOGLE MAPS` dengan link `[ 📍 BUKA GOOGLE MAPS ↗ ]` dan display peta Google Maps dengan pin merah.

2. **Screenshot 2 & 3 (Tab 2: Data Kamar & Penghuni - Galeri Foto Kamar)**:
   - Di bagian atas Tab 2, terdapat **Galeri Foto Kamar Hasil Pendataan**:
     - Hero carousel frame gelap (aspect-ratio lebar) dengan badge kategori di kiri atas (`[ 📷 INTERIOR KAMAR ]`), counter di kanan atas (`1 / 12`), floating card di kiri bawah (`NOMOR KAMAR: Kamar 3`, `2x2 meter`, `TARIF Rp 400.000/bln`, chips fasilitas `[Kosongan (Tanpa Perabot)]`, `[Jendela Luar]`), serta tombol panah navigasi kiri/kanan.
     - Di bawah carousel: Strip thumbnail horizontal dengan badge nomor kamar di atas (`Kamar 3`, `Kamar 4`) dan label kategori di bawah (`Interior Kamar`, `Kamar Mandi Dalam`, `Tempat Tidur`, `Lemari / Penyimpanan`, `Jendela Luar`). Thumbnail yang aktif memiliki border oranye.

3. **Screenshot 3 & 4 (Tab 2: Level 1 Accordion Tipe Kamar)**:
   - Accordion Header Tipe Kamar:
     - Ikon tempat tidur biru di dalam kotak `bg-blue-50 text-blue-600`.
     - Label kecil: `TIPE KAMAR #1`.
     - Nama tipe: `TIPE STANDARD`.
     - Chips spesifikasi: `[ 📐 2x2 meter ]`, `[ Kosongan (Tanpa Perabot) ]`, `[ Jendela Luar ]`.
     - Sisi kanan: `Rp 400.000/bln`, pill hijau `[ ✨ 3 Kosong ]`, pill oranye `[ 🔒 2 Dihuni ]`, dan icon chevron panah expand/collapse.
   - Body saat dibuka:
     - Dua Sub-Parent Accordions berpasangan:
       1. `[ 🔒 ] KAMAR SEDANG DIHUNI / TERISI  2 UNIT       BUKA LIST v` (Amber card, border-amber-200, bg-amber-50/80).
       2. `[ ✨ ] KAMAR KOSONG / SIAP HUNI  3 UNIT           BUKA LIST v` (Emerald card, border-emerald-200, bg-emerald-50/80).

4. **Screenshot 5 (Tab 2: Unit Kamar Terisi & Data Penghuni)**:
   - Saat sub-accordion `KAMAR SEDANG DIHUNI / TERISI` dibuka:
     - Kartu unit kamar bergaris tepi amber (`border-amber-200`).
     - Header unit: Ikon gembok amber `[ 🔒 ]`, teks `UNIT KAMAR`, badge `[ 🔒 Dihuni ]`, judul unit `Kamar 1`, dan sisi kanan `TARIF SEWA Rp 400.000/bln`.
     - **Grid Data Penghuni 3 Kolom**:
       - Kolom 1: `👤 NAMA PENGHUNI` (header teks amber), isi: `zul`, `1 Orang Penghuni`.
       - Kolom 2: `📱 KONTAK WHATSAPP` (header teks amber), isi: `081527080656`, link `Hubungi via WA ↗`.
       - Kolom 3: `📅 PERIODE & TAGIHAN` (header teks amber), isi: `Langganan: Bulanan`, `Bayar Terakhir: 2026-08-28`, `Tagihan Berikutnya: 2026-09-28`.
     - **Spesifikasi & Fasilitas Kamar Terpasang**: Chip fasilitas interaktif dengan teks `(Sorot fasilitas untuk melihat foto terkait ✨)` dan chip dimensi `📐 2x2 meter`.
     - **Dokumentasi Foto Unit**: Thumbnail foto unit kamar berlabel atau box placeholder jika belum diunggah.

### Penyebab Kesenjangan Pada Implementasi Sebelumnya:
1. **Algoritma Parsing Data Kamar (`handleEditProperty`)**:
   - Di `KostManagerManagement.tsx`, data properti yang didata surveyor disimpan dalam bentuk array unit kamar individual (`Kamar 1` s.d. `Kamar 5`), lalu dikelompokkan secara cerdas menggunakan algoritma `groupIntoRoomTypes`.
   - Di `KostManagerPortal.tsx`, pemanggilan edit sebelumnya mencoba membaca `rt.rooms` yang belum ada (karena datanya flat), sehingga gagal merekonstruksi 1 Tipe Standard berisi 5 unit, melainkan memecahnya menjadi dummy `RM-101` tanpa data penghuni `zul` dan tanpa 12 foto dokumentasi kamar.
2. **Normalisasi Foto Berlabel**:
   - Foto properti dan foto kamar di `KostManagerPortal.tsx` diubah menjadi array string mentah (hanya URL), sehingga label kategori seperti `Interior Kamar`, `Kamar Mandi Dalam`, `Area Parkir`, dsb. hilang dari carousel dan thumbnail strip.
3. **Struktur Tampilan Visual**:
   - Penataan grid, class Tailwind, badge, floating card, sub-accordion amber/emerald, dan 3 kolom data penghuni harus disalin langsung 1:1 dari JSX `KostManagerManagement.tsx`, lalu disematkan kontrol input langsung (*editable form inputs*) di setiap field datanya.

---

## 2. Dampak Perubahan (Files Touched)

1. [functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx):
   - **Menyalin & Mengadopsi Helper Parsing 1:1**:
     - `groupIntoRoomTypes`: Mengelompokkan kamar flat surveyor ke dalam Tipe Kamar Sejati dengan sub-grup `occupiedUnits` dan `vacantUnits`.
     - `getRoomPhotos`: Mengekstrak foto unit beserta label kategori (`{ url, label }`).
     - `normalizePhotos`: Mengekstrak foto bangunan beserta label kategori (`{ url, label }`).
     - `buildUnifiedFacilities` & `isFacilityMatchingPhoto`: Menjamin fasilitas kamar dan pencocokan sorot foto bekerja persis seperti modal review admin.
   - **Pembaruan `handleEditProperty`**:
     - Membaca `p.room_types` dan menerapkan `groupIntoRoomTypes` sehingga Kost Madani (dan properti lainnya) langsung memuat 1 Tipe Kamar berisi unit-unit aslinya (`Kamar 1` dihuni oleh `zul`, nomor telepon, tanggal bayar, fasilitas, dan seluruh 12 foto kamar) tanpa kehilangan data.
   - **Transformasi Visual Modal `ManagedPropertyAddModal` (Representasi Langsung 1:1 + Editable)**:
     - **Header**: Status badge, pill gender (bisa diklik ubah), ID badge, judul besar (inline edit nama properti), alamat singkat, tombol tutup bulat.
     - **Top Info Strip**: Pemilik kost (avatar bulat oranye, nama, tombol direct WA, dropdown ganti mitra), surveyor lapangan, dan tombol link folder.
     - **3-Tab Navigation**: `1. DATA PROPERTI UMUM` (badge jumlah foto gedung), `2. DATA KAMAR & PENGHUNI` (badge jumlah kamar), `3. DATA MITRA & KERJASAMA`.
     - **Tab 1 Body (1:1 Editable)**:
       - Hero carousel foto gedung 16/7 gelap dengan tombol tambah/hapus foto WebP, dropdown ganti label kategori, zoom lightbox, dan thumbnail strip bawah.
       - Fasilitas Umum Kost: Kartu hijau dengan status aktif/slider, rincian parkir (Motor, Mobil, Sepeda yang dapat di-toggle), dan two-way sync ke slider foto.
       - 2 Kolom: Kiri = Alamat & Titik Koordinat (5 kotak data wilayah: Provinsi, Kota, Area, Lat, Long + textarea alamat), Kanan = Preview Google Maps interaktif + tombol link Google Maps.
       - Kartu Kampus & Landmark terdekat (jarak, waktu jalan/motor/mobil, tombol tambah/hapus kampus).
       - Kartu Peraturan Kost (tombol tambah/hapus peraturan).
     - **Tab 2 Body (1:1 Editable)**:
       - 4 Top KPI Cards (Total Kamar, Kamar Terisi, Kamar Kosong, Total Penghuni) dengan styling persis baris 2572-2636 `KostManagerManagement.tsx`.
       - **Galeri Foto Kamar Hasil Pendataan**: Carousel hero foto kamar dengan floating card info nomor kamar, ukuran, tarif, chips fasilitas, navigasi kiri/kanan, dan strip thumbnail horizontal berlabel kamar & kategori persis Screenshot 2 & 3.
       - **Accordion Level 1 Tipe Kamar**: Header persis Screenshot 3 & 4 (Ikon kasur biru, label Tipe Kamar #1, nama tipe [editable], chips ukuran & fasilitas, tarif bulanan [editable], counter kosong/terisi, tombol tambah kamar, tombol hapus tipe).
       - **Dua Sub-Parent Accordions Berpasangan**:
         - `[ 🔒 ] KAMAR SEDANG DIHUNI / TERISI` (Amber) persis Screenshot 4.
         - `[ ✨ ] KAMAR KOSONG / SIAP HUNI` (Emerald) persis Screenshot 4.
       - **Kartu Unit Kamar Interaktif (Editable)** persis Screenshot 5:
         - Switch status 1-klik (`🔒 Dihuni` <-> `✨ Kosong`) yang secara instan memindahkan unit antar sub-parent.
         - Grid 3 Kolom Data Penghuni:
           - 👤 Nama Penghuni & jumlah orang (input teks editable).
           - 📱 Kontak WhatsApp (input nomor telp editable + direct link WA).
           - 📅 Periode & Tagihan (dropdown langganan bulanan/tahunan, tanggal bayar terakhir, tanggal jatuh tempo).
         - Spesifikasi & Fasilitas Kamar Terpasang (chips fasilitas interaktif dengan efek photo hover sync).
         - Dokumentasi Foto Unit: Menampilkan foto-foto kamar per unit dengan tombol tambah foto WebP, ganti label, dan hapus foto.
         - Catatan kondisi kamar & tombol hapus kamar.
       - Tombol `+ Tambah Kamar ke Tipe Ini` dan `+ Tambah Tipe Kamar Baru`.
     - **Tab 3 Body**: S&K kemitraan Auto-Pilot, data rekening penampung bank pemilik, omnichannel router, dan simulasi omset 3 kartu.
     - **Footer**: Tombol `Tutup`, `← Sebelumnya`, `Lanjut →`, dan `💾 Simpan Perubahan Properti`.
   - **Logika Penyimpanan (`handleSave`)**:
     - Mengemas kembali seluruh perubahan tipe kamar dan unit-unitnya ke dalam format array yang disimpan ke Supabase tabel `properties` dan memperbarui status penghuni.

---

## 3. Langkah-Langkah Eksekusi Bertahap

1. **Sinkronisasi Helper Parsing & Grouping**:
   - Memastikan helper `groupIntoRoomTypes`, `getRoomPhotos`, `normalizePhotos`, dan `buildUnifiedFacilities` diimplementasikan dengan presisi tinggi di `KostManagerPortal.tsx`.
2. **Perbaikan `handleEditProperty`**:
   - Memastikan saat tombol edit properti (misal: Kost Madani) diklik, data `room_types` diparsing melalui `groupIntoRoomTypes` sehingga Kost Madani membuka dengan 1 Tipe Standard, 5 unit kamar (2 terisi oleh penghuni `zul`, 3 kosong), dan 12 foto dokumentasi kamar yang lengkap.
3. **Penyelarasan Tampilan Tab 1**:
   - Menyalin struktur visual card fasilitas umum, kartu alamat 5-kotak, dan preview Google Maps agar 100% identik dengan Screenshot 1.
4. **Penyelarasan Tampilan Tab 2**:
   - Menyalin struktur galeri foto kamar dengan floating card dan strip thumbnail berlabel persis Screenshot 2 & 3.
   - Menyalin Level 1 Accordion dan dua Sub-Parent Accordions (Terisi [Amber] dan Kosong [Emerald]) persis Screenshot 4.
   - Menyalin Unit Card 3-kolom data penghuni, spesifikasi fasilitas ber-icon, dan dokumentasi foto persis Screenshot 5, dengan menjadikan setiap teks menjadi input editable yang nyaman digunakan.
5. **Uji Kompilasi & Build**:
   - Menjalankan `npm.cmd run build` pada folder `functions/public/` untuk memastikan 0 error kompilasi JSX/TypeScript.
6. **Dokumentasi & Anti-Amnesia**:
   - Mencatat progres ke `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
7. **Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions` sesuai aturan workspace.

---

## 4. Rencana Verifikasi

1. **Uji Build Frontend**:
   - Memverifikasi kompilasi Vite frontend melalui perintah terminal:
     `npm.cmd run build` di direktori `functions/public/`.
   - Wajib menghasilkan `0 errors` dan transformasi modul sukses.
2. **Uji Fungsionalitas & Visual UI**:
   - Membuka halaman KostManager Portal dan mengklik tombol edit pada **Kost Madani**.
   - Memverifikasi visual Tab 1: Menyamakan persis dengan Screenshot 1 (Header, fasilitas umum two-way sync, 5 kotak alamat, preview maps).
   - Memverifikasi visual Tab 2: Menyamakan persis dengan Screenshot 2, 3, 4, dan 5:
     - Hero carousel galeri foto kamar dengan 12 foto, floating card info kamar, dan thumbnail bar berlabel unit kamar (`Kamar 3`, `Kamar 4`, dsb.).
     - Accordion `TIPE STANDARD` dengan 3 Kosong dan 2 Dihuni.
     - Sub-parent `KAMAR SEDANG DIHUNI / TERISI (2 UNIT)` berwarna amber.
     - Sub-parent `KAMAR KOSONG / SIAP HUNI (3 UNIT)` berwarna emerald.
     - Data penghuni `zul`, nomor WA, tanggal bayar, fasilitas, dan foto dokumentasi pada unit kamar terisi.
   - Memverifikasi kemampuan edit: Mengubah nomor kamar, nama penghuni, kontak WA, status unit kamar, dan menyimpan perubahan.
