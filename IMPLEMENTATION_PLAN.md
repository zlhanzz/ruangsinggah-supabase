# Rencana Implementasi: Penyelarasan 1:1 Editor Properti Terkelola KostManager dengan Tampilan Peninjauan Hasil Survei Admin (Editable Direct Representation)

Dokumen ini merinci rencana transformasi modal editor properti terkelola pada Portal KostManager ([functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)) agar menjadi **representasi langsung (1:1 visual & struktural)** dari tampilan modal peninjauan hasil survei yang ada di Dashboard Admin ([functions/public/components/admin/KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx)), dengan kemampuan edit langsung (*interactive editable*).

---

## 1. Analisis Masalah & Kebutuhan

### A. Situasi Saat Ini vs Kebutuhan Pengguna
- **Ekspektasi Pengguna**:
  Pengguna meminta agar tampilan editor properti terkelola portal KostManager dibuat menjadi representasi langsung (1 banding 1) dari tampilan peninjauan hasil survey yang ada di dashboard admin, di mana tampilannya persis sama namun seluruh elemennya dapat diedit (*editable*).
- **Kondisi Modal Saat Ini**:
  1. **Header**: Modal editor saat ini menggunakan bar judul kerdil dengan tombol tab 1-2-3 yang ditaruh di pojok kanan atas, tidak memiliki status badge dinamis, tidak memiliki badge tipe gender, tidak memiliki alamat lengkap di header, dan belum memiliki info strip pemilik & surveyor seperti di modal peninjauan admin.
  2. **Tab 1 (Data Properti Umum)**:
     - Hero carousel foto gedung belum memiliki rasio 16/7 gelap dengan badge kategori foto, counter foto, dan caption bar bawah khas peninjauan admin.
     - Fasilitas umum saat ini berupa tombol toggle biasa, belum berwujud kartu 2-kolom dengan icon rounded-xl, sinkronisasi dua arah ke slider foto (*"Lihat Foto di Slider"*), badge *"FOTO AKTIF"*, dan sub-item rincian parkir (Motor, Mobil).
     - Rincian alamat & titik koordinat belum ditampilkan dalam 5 kotak data terstruktur (Provinsi, Kota/Kabupaten, Kecamatan/Area, Latitude, Longitude) bersebelahan dengan preview peta Google Maps.
     - Belum menampilkan kartu kampus & landmark terdekat dengan rute Maps dan kartu peraturan kost bernuansa rose.
  3. **Tab 2 (Data Kamar & Penghuni)**:
     - Belum menampilkan **4 Top KPI Cards** (Total Kamar, Kamar Terisi, Kamar Kosong, Total Penghuni).
     - Belum menampilkan **Galeri Foto Kamar Hasil Pendataan** dengan hero carousel, floating room detail card, dan filter per unit kamar.
     - Struktur kamar saat ini menggunakan deretan tombol unit datar (*flat horizontal buttons*) lalu form per kamar, bukan struktur **Accordion Tipe Kamar (Level 1)** dengan dua sub-parent accordion: **`🔒 KAMAR SEDANG DIHUNI / TERISI`** (Amber) dan **`✨ KAMAR KOSONG / SIAP HUNI`** (Emerald).
     - Unit card belum mencerminkan layout 3-kolom peninjauan (Nama Penghuni, Kontak WA + direct link, Periode Tagihan & Jatuh Tempo) dan fasilitas dengan photo-matching hover.
  4. **Tab 3 (Mitra & Kerjasama)**:
     - Belum menyajikan Salinan Dokumen Perjanjian Kemitraan (Auto-Pilot) dengan badge verifikasi digital.

---

## 2. Dampak Perubahan

### File yang Tersentuh:
- [functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx):
  - Merombak total `ManagedPropertyAddModal` agar mengadopsi markup, kelas Tailwind, hierarki komponen, dan styling visual yang 100% identik dengan modal peninjauan di `KostManagerManagement.tsx`.
  - Menanamkan kontrol edit langsung (*inline edit, file uploaders, one-click status toggles, unit add/delete*) pada setiap seksi tanpa merusak tampilan 1:1.
- [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Pencatatan progres Anti-Amnesia untuk Entry #144.

---

## 3. Rencana Eksekusi Bertahap (Fase 2 Setelah ACC)

### Langkah 1: Penyelarasan Header Modal & Top Info Strip (Visual 1:1)
1. **Header Bar**:
   - Status Badge: `[● AKTIF TERKELOLA]` / `[KOSTMANAGER AUTO-PILOT]`.
   - Gender Badge: `[CAMPUR / PUTRA / PUTRI]` (dapat diklik untuk beralih tipe gender).
   - ID Badge: `ID: #{editingPropertyId ? editingPropertyId.substring(0, 8) : 'BARU'}`.
   - Judul Kost: Teks besar, font-black, uppercase, dengan tombol edit judul inline.
   - Alamat Singkat: `📍 {newPropForm.address}`.
   - Close Button: Tombol bulat putih &times; di sudut kanan atas.
2. **Top Info Strip**:
   - Kolom Kiri: Avatar Mitra Pemilik + Nama Pemilik + Nomor WhatsApp aktif + Dropdown pencarian ganti pemilik.
   - Kolom Kanan: Status Pengelolaan Auto-Pilot / Surveyor Lapangan + Link Cepat Preview Publik Web `[Lihat Web ↗]`.
3. **Full-Width 3-Tab Navigation Bar**:
   - Tab 1: `[ 🏢 1. DATA PROPERTI UMUM ]` (Badge total foto)
   - Tab 2: `[ 🛏️ 2. DATA KAMAR & PENGHUNI ]` (Badge total kamar)
   - Tab 3: `[ 🛡️ 3. DATA MITRA & KERJASAMA ]` (Badge '✓')
   - Indikator tab aktif bernuansa emerald/slate mewah.

---

### Langkah 2: Transformasi Tab 1 (Data Properti Umum - 1:1 Editable)
1. **Hero Carousel Foto Utama (Aspect 16/7, Dark Slate-950)**:
   - Tampilan frame gelap 16/7 dengan gradient overlay dan caption bawah.
   - Top Badges: Kategori foto aktif `📸 {label}`, counter `X / Y Foto`, tombol Zoom Lightbox, tombol Hapus Foto, dan tombol `+ Tambah Foto Gedung`.
   - Thumbnail Strip bawah bernuansa dark slate dengan nomor foto `#1, #2` dan label foto.
2. **Fasilitas Umum Kost dengan Two-Way Carousel Sync & Sub-Input**:
   - Grid 2-kolom kartu fasilitas umum persis review modal dengan icon `w-9 h-9 rounded-xl`.
   - Klik kartu langsung menggeser hero slider ke foto fasilitas terkait (*Two-Way Carousel Sync*).
   - Kontrol edit: Tombol centang/toggle aktif per kartu, serta sub-rincian (misal Area Parkir: `🏍️ Motor`, `🚗 Mobil`).
   - Opsi `+ Tambah Fasilitas Umum`.
3. **Alamat, Titik Koordinat & Preview Google Maps**:
   - Kolom Kiri: Kartu Alamat & Titik Koordinat dengan 5 kotak data terstruktur:
     - 🏛️ Provinsi (editable)
     - 🏙️ Kabupaten / Kota (editable)
     - 📍 Kecamatan / Area (editable)
     - 🌐 Latitude (editable)
     - 🌐 Longitude (editable)
     - Textarea Alamat Lengkap Real Bangunan (jalan, nomor, RT/RW, patokan).
   - Kolom Kanan: Peta interaktif `LocationPicker` dengan pencarian alamat Google Geocoding dan tombol `Buka Google Maps ↗`.
4. **Kampus & Landmark Terdekat**:
   - Kartu 2-kolom dengan rute jarak Google Maps (`📍 1.2 km`, `🚶 15 mnt`, `🏍️ 4 mnt`, `🚗 7 mnt`).
   - Kontrol edit: Form input tambah landmark dan tombol hapus landmark.
5. **Peraturan & Ketentuan Kost**:
   - Kartu rose dengan icon larangan `⛔` 1:1 dengan review modal.
   - Kontrol edit: Input tambah peraturan dan tombol hapus.

---

### Langkah 3: Transformasi Tab 2 (Data Kamar & Penghuni - 1:1 Editable)
1. **4 Top KPI Glance Cards**:
   - 🚪 **Total Kamar**: `{totalRooms} Unit` (Blue theme)
   - 🔒 **Kamar Terisi**: `{occupiedRooms} Unit` (Amber theme)
   - ✨ **Kamar Kosong**: `{availableRooms} Unit` (Emerald theme)
   - 👥 **Total Penghuni**: `{totalOccupants} Orang` (Indigo theme)
2. **Galeri Foto Seluruh Kamar & Filter Per-Kamar**:
   - Frame carousel foto kamar dengan floating card detail kamar di kiri bawah (Nomor Kamar, Ukuran, Tarif, Fasilitas chips) dan thumbnail strip.
   - Dropdown/Filter per unit kamar.
3. **List Tipe Kamar (Level 1 Parent Accordion)**:
   - Header Tipe Kamar: Icon Bed, Nama Tipe Kamar, Chip ukuran `📐 3x4 meter`, chip fasilitas kamar lengkap, tarif sewa bulanan, counter `✨ X Kosong` dan `🔒 Y Dihuni`.
   - Kontrol edit: Ubah nama tipe kamar, tarif dasar, ukuran, dan fasilitas kamar.
4. **Dua Sub-Parent Accordions (Level 2 Children)**:
   - **`🔒 KAMAR SEDANG DIHUNI / TERISI`** (Tema Amber):
     - Daftar unit yang sedang dihuni.
   - **`✨ KAMAR KOSONG / SIAP HUNI`** (Tema Emerald):
     - Daftar unit yang sedang kosong siap dipasarkan.
5. **Detail Unit Kamar (1:1 Editable di Dalam Accordion)**:
   - **Top Bar**: Nomor Kamar (editable), Switch 1-klik Status (`🔒 Dihuni` <-> `✨ Kosong`), Tarif Sewa (editable).
   - **Grid Data Penghuni (3 Kolom)**:
     - 1. 👤 Nama Penghuni & jumlah penghuni (input editable).
     - 2. 📱 Kontak WhatsApp (input editable + link `Hubungi via WA ↗`).
     - 3. 📅 Periode & Tagihan (Select Langganan: Bulanan/Triwulan/Tahunan, Tanggal Bayar Terakhir, Tanggal Jatuh Tempo).
   - **Spesifikasi & Fasilitas Kamar**: Interactive chips dengan photo-hover highlighting dan toggle fasilitas.
   - **Dokumentasi Foto Unit Kamar**: Galeri thumbnail foto kamar per kategori (Interior, Kasur, Kamar Mandi, Jendela) dengan tombol `+ Foto` (WebP uploader instan), zoom lightbox, dan hapus foto.
   - **Catatan Kondisi Kamar**: Textarea catatan surveyor/pengelola.
   - **Aksi Unit**: Tombol `+ Tambah Unit Kamar Baru` dan `Hapus Unit Kamar`.

---

### Langkah 4: Transformasi Tab 3 (Mitra, Kerjasama & Finansial - 1:1 Editable)
1. **Dokumen Perjanjian Kemitraan (Auto-Pilot)**:
   - Tampilan salinan Syarat & Ketentuan Penggunaan KostManager 1:1 dengan review modal, lengkap dengan badge `✓ Disetujui Mitra Secara Digital`.
2. **Data Pemilik & Rekening Bank**:
   - Profil mitra pemilik terpilih dan informasi nomor rekening bank untuk transfer payout.
3. **Omnichannel WhatsApp Booking Router**:
   - Konfigurasi penanggung jawab kontak booking WhatsApp calon penyewa.
4. **Simulasi Finansial 3 Kartu**:
   - Potensi Omset Penuh, Realisasi Sewa Berjalan, dan Estimasi Payout Pemilik (setelah potongan fee 10%).

---

### Langkah 5: Sticky Footer & Alur Simpan
- Tombol `Batal`, `← Sebelumnya`, `Lanjut →`, dan `💾 Simpan Perubahan Properti`.
- Payload tersimpan secara presisi ke tabel `properties` (termasuk `room_types`, `facilities`, `image_urls`, `metadata.province`, dll.) via `updatePropertyWithMedia` atau `addPropertyWithMedia`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi Build Frontend**:
   - Jalankan `npm run build` pada direktori `functions/public/` untuk memastikan **0 error kompilasi TypeScript dan JSX**.
2. **Uji Tampilan Visual (1:1 Verification)**:
   - Buka modal peninjauan survey di admin (`KostManagerManagement.tsx`) dan buka modal editor properti di `KostManagerPortal.tsx` (misal untuk Kost Madani).
   - Bandingkan header, hero carousel, fasilitas, alamat/GPS, kampus, peraturan, KPI cards, galeri kamar, dan accordion tipe kamar untuk memastikan kesamaan 1:1.
3. **Uji Fungsionalitas Edit**:
   - Ganti status kamar dari Kosong menjadi Terisi (dan sebaliknya).
   - Edit nama penghuni, nomor WA, tanggal jatuh tempo.
   - Coba upload dan hapus foto kamar/gedung.
   - Simpan properti dan pastikan data di tabel properti terkelola serta database Supabase terperbarui secara akurat tanpa error.
