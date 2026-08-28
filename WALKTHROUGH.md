# Walkthrough: Penyelarasan 1:1 Editor Properti Terkelola Portal KostManager dengan Modal Peninjauan Hasil Survei Admin (Editable Direct Representation)

Pekerjaan transformasi modal editor properti terkelola pada Portal KostManager ([functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)) telah selesai dilaksanakan dan berhasil lulus uji kompilasi frontend 100% tanpa error.

Tampilan modal editor properti kini merupakan **representasi langsung 1:1** dari tampilan modal peninjauan hasil survei admin ([functions/public/components/admin/KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx)), namun dengan kemampuan edit langsung (*interactive editable*) di setiap elemen.

---

## 1. Daftar Perubahan Mendetail

### A. Header Modal & Top Info Strip (Visual 1:1)
- **Status & Type Badges**:
  - Badge `[● AKTIF TERKELOLA (AUTO-PILOT)]` dengan indikator titik hijau berdenyut (*pulsing dot*).
  - Selector Gender Pill `[Campur / Putra / Putri]` yang dapat langsung diubah via dropdown chic.
  - Property ID Badge: `[ID: #xxxxxxx]`.
  - Judul Kost: Teks besar `uppercase font-black` yang dapat diedit langsung (*inline input*).
  - Alamat Ringkas: Menampilkan alamat properti dengan ikon pin `📍`.
  - Tombol Tutup: Tombol bulat putih dengan bayangan halus di sudut kanan atas.
- **Top Info Strip**:
  - Avatar inisial pemilik warna oranye, nama pemilik, dan tombol direct **WhatsApp**.
  - Dropdown pencarian mitra pemilik terdaftar (`filteredOwners`) untuk mengganti pemilik properti dengan 1 klik.
  - Badge Mode Operasional: *"KostManager Auto-Pilot Studio"*.
  - Tombol cepat link publik: `[Lihat Web ↗]`.
- **Full-Width 3-Tab Navigator**:
  - `[🏢 1. DATA PROPERTI UMUM]` (dengan badge total foto gedung).
  - `[🛏️ 2. DATA KAMAR & PENGHUNI]` (dengan badge total unit kamar).
  - `[🛡️ 3. DATA MITRA & KERJASAMA]` (dengan badge '✓').

---

### B. Tab 1: Data Properti Umum (1:1 Editable)
- **Hero Carousel Foto Bangunan (Aspect 16/7, Dark Slate-950)**:
  - Frame gelap 16/7 dengan gradien sinematik persis modal review admin.
  - Top Badges:
    - Badge Kategori Foto `📸 {label}` lengkap dengan dropdown ganti label kategori preset (*Fasad Depan, Area Parkir, Koridor, Dapur Bersama, dll.*).
    - Tombol `+ Tambah Foto` (WebP file uploader).
    - Counter foto `{X} / {Y} FOTO`.
    - Tombol **Zoom In Lightbox** dan tombol **Hapus Foto**.
  - Bottom Caption Bar: Label kategori foto dokumentasi berhuruf tebal putih.
  - Tombol Chevron Kiri & Kanan transparan untuk berpindah slide.
  - Strip Thumbnail Bawah gelap dengan nomor `#1, #2` dan label di bawahnya.
- **Fasilitas Umum dengan Two-Way Carousel Sync**:
  - Grid 2-kolom kartu fasilitas umum dengan ikon rounded-xl.
  - **Two-Way Sync**: Mengklik kartu fasilitas langsung memutar slider foto ke foto dokumentasi fasilitas tersebut!
  - Tombol status badge: `[✓ AKTIF]` / `[+ AKTIFKAN]`.
  - Sub-Data Rincian Kendaraan Parkir: Tombol chips interaktif untuk `🏍️ Motor`, `🚗 Mobil`, dan `🚲 Sepeda`.
- **Alamat, Titik Koordinat & Google Maps Picker**:
  - 5 Kotak data administratif terstruktur:
    - 🏛️ Provinsi (editable dengan auto-detection)
    - 🏙️ Kabupaten / Kota (editable)
    - 📍 Kecamatan / Area (editable)
    - 🌐 Latitude (editable)
    - 🌐 Longitude (editable)
  - Textarea alamat lengkap real bangunan.
  - Frame Google Maps interaktif `LocationPicker` dengan draggable marker, auto-geocoding, dan tombol `Buka Google Maps ↗`.
- **Kampus & Landmark Terdekat**:
  - Kartu 2-kolom rute kampus dengan jarak, waktu tempuh jalan (`🚶 15 mnt`), motor (`🏍️ 4 mnt`), dan mobil (`🚗 7 mnt`), serta tombol `Lihat Rute di Google Maps ↗`.
  - Form input tambah kampus dan tombol hapus kampus.
- **Peraturan & Ketentuan Kost**:
  - Kartu bernuansa rose dengan ikon larangan `⛔` dan tombol hapus peraturan.
  - Form input tambah peraturan baru.

---

### C. Tab 2: Data Kamar & Penghuni (1:1 Editable)
- **4 Top KPI Glance Cards**:
  - 🚪 **Total Kamar**: `{totalRooms} Unit` (Biru)
  - 🔒 **Kamar Terisi**: `{occupiedRooms} Unit` (Amber)
  - ✨ **Kamar Kosong**: `{availableRooms} Unit` (Emerald)
  - 👥 **Total Penghuni**: `{totalOccupants} Orang` (Indigo)
- **Galeri Foto Kamar Hasil Pendataan**:
  - Carousel hero foto kamar dengan floating card detail kamar di kiri bawah (Nomor Kamar, Ukuran, Tarif Sewa, Fasilitas).
  - Thumbnail strip horizontal dengan filter per-unit kamar.
- **Accordion Tipe Kamar (Level 1 Parent)**:
  - Header Tipe Kamar: Icon Bed, Nama Tipe Kamar, Chip ukuran `📐 PxL`, chips fasilitas kamar & kamar mandi lengkap, tarif sewa bulanan, counter `✨ X Kosong` dan `🔒 Y Dihuni`.
  - Kontrol edit tipe kamar: Nama tipe kamar, tarif dasar, ukuran, dan tombol hapus tipe kamar.
- **Dua Sub-Parent Accordions Berpasangan (Level 2)**:
  - **`🔒 KAMAR SEDANG DIHUNI / TERISI`** (Tema Amber): Daftar unit kamar terisi.
  - **`✨ KAMAR KOSONG / SIAP HUNI`** (Tema Emerald): Daftar unit kamar kosong siap dipasarkan.
- **Detail Unit Kamar Interaktif**:
  - **Switch Status 1-Klik**: Tombol `[🔒 Dihuni]` / `[✨ Kosong]` yang secara instan memindahkan kamar antar sub-parent.
  - **Grid Data Penghuni 3 Kolom**:
    - 1. 👤 Nama Penghuni & jumlah penghuni (input editable).
    - 2. 📱 Kontak WhatsApp (input editable + link `Hubungi via WA ↗`).
    - 3. 📅 Periode Tagihan & Tanggal Jatuh Tempo (input editable).
  - **Spesifikasi & Fasilitas Kamar Terpasang**: Chips fasilitas interaktif dengan efek *photo-hover matching highlighting*.
  - **Dokumentasi Foto Unit Kamar**: 4 Kategori standar (*Interior, Kasur, Kamar Mandi, Jendela*) dengan tombol `+ Foto`, Zoom Lightbox, dan Hapus Foto.
  - **Catatan Kondisi Kamar**: Input catatan dan tombol Hapus Unit Kamar.
  - Tombol `+ Tambah Kamar ke Tipe Ini` dan `+ Tambah Tipe Kamar Baru`.

---

### D. Tab 3: Data Mitra, Kerjasama & Finansial (1:1)
- **Salinan S&K Perjanjian Auto-Pilot**: Teks syarat & ketentuan legalitas dengan badge `✓ Disetujui Mitra Secara Digital` dan 3 checklist persetujuan.
- **Data Pemilik & Rekening Bank Penampung**: Profil mitra pemilik dan data bank untuk transfer payout.
- **Omnichannel WhatsApp Booking Router**: Konfigurasi kontak customer service / pengelola untuk booking web.
- **Simulasi Finansial 3 Kartu**: Potensi Omset Penuh, Realisasi Sewa Berjalan, dan Estimasi Payout Pemilik (setelah potongan fee 10%).

---

### E. Sticky Action Footer
- Tombol `Batal`, `← Sebelumnya`, `Lanjut →`, dan `💾 Simpan Perubahan Properti`.

---

## 2. Hasil Pengujian & Verifikasi

### Uji Kompilasi Build Frontend (`npm.cmd run build`)
```text
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 2526 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                 7.30 kB │ gzip:   2.20 kB
../../public/assets/index-Br7TthoO.css                221.43 kB │ gzip:  28.43 kB
...
../../public/assets/Dashboard-B4JkRqiz.js           1,144.38 kB │ gzip: 244.12 kB
✓ built in 28.71s
```
**Status: 0 Error Kompilasi JSX/TypeScript.**

---

## 3. Panduan Pengujian bagi Pengguna (UI Verification)

1. Masuk ke halaman **KostManager Portal** (`/admin/kost-manager`).
2. Klik tombol kelola/edit pada salah satu properti terkelola (misalnya: *Kost Madani* atau properti lainnya).
3. **Verifikasi Header**:
   - Perhatikan status badge `AKTIF TERKELOLA (AUTO-PILOT)` dan pill gender.
   - Coba klik dropdown nama pemilik pada top info strip untuk mengganti pemilik atau klik tombol WhatsApp.
4. **Verifikasi Tab 1 (Data Properti Umum)**:
   - Amati hero carousel foto 16/7 bertema gelap. Gunakan chevron atau thumbnail bawah untuk berpindah slide.
   - Klik salah satu kartu fasilitas umum (misal: *Area Parkir*), perhatikan slider foto otomatis melompat ke foto area parkir.
   - Periksa 5 kotak data administratif wilayah (Provinsi, Kota, Kecamatan, Lat, Long) dan geser pin peta pada Google Maps picker.
   - Periksa kartu Kampus & Landmark terdekat dan kartu Peraturan Kost.
5. **Verifikasi Tab 2 (Data Kamar & Penghuni)**:
   - Perhatikan 4 kartu KPI (Total Kamar, Terisi, Kosong, Total Penghuni).
   - Perhatikan Galeri Foto Kamar di bagian atas dengan floating card info kamar.
   - Perhatikan Accordion Tipe Kamar (Level 1) dan dua sub-parent accordions:
     - `🔒 KAMAR SEDANG DIHUNI / TERISI` (Amber)
     - `✨ KAMAR KOSONG / SIAP HUNI` (Emerald)
   - Coba klik tombol status pada salah satu kamar untuk mengubah statusnya (misal dari Kosong ke Dihuni). Perhatikan kamar langsung berpindah sub-parent dan counter KPI terupdate secara real-time.
   - Coba ubah nama penghuni, nomor WA, tanggal jatuh tempo, atau unggah foto kamar.
6. **Verifikasi Tab 3 (Mitra & Kerjasama)**:
   - Perhatikan dokumen perjanjian kemitraan, rekening bank pemilik, dan simulasi omset serta payout pemilik.
7. Klik **💾 Simpan Perubahan Properti** dan pastikan dialog sukses muncul serta data tersimpan sempurna.
