# IMPLEMENTATION PLAN (FASE 1)
## Fitur: Tombol Kontrol Foto Terkait Tipe Kamar pada Listing Kost Biasa (KostDetail.tsx)

---

### 1. Analisis Kebutuhan & Akar Masalah

#### A. Konteks & Perilaku Saat Ini
1. **Pada Listing Mitra KostManager (`kost.isManaged === true`)**:
   - Di bawah galeri foto utama (carousel), terdapat bilah tombol navigasi foto unit kamar:
     - Header: `Pilih Foto Unit Kamar`
     - Tombol: `[Semua Foto]`, `[Kamar 1]`, `[Kamar 2]`, dst.
   - Mengklik tombol unit kamar akan mengisolasi carousel foto sehingga hanya menampilkan foto unit kamar yang bersangkutan, serta menyinkronkan status nomor kamar yang dipilih.
2. **Pada Listing Kost Biasa (`!kost.isManaged` / Non-KostManager)**:
   - Bilah navigasi foto tersebut **tidak muncul sama sekali** (hilang dari tampilan).
   - **Penyebab Teknis**:
     - Pada baris 465–506 `KostDetail.tsx`, ekstraksi `roomPhotoItems` untuk listing biasa hanya membaca `rt.images || rt.image_urls`.
     - Padahal pada alur formulir Mitra Biasa (`KostFormMitra.tsx`), foto-foto kamar disimpan terpusat di `property.imageUrls`, `property.photosMeta`, dan `property.categorizedPhotos` dengan kategori khusus seperti:
       - `Kamar: Standard`
       - `Kamar Mandi: Standard` (atau `KM Dalam: Standard`)
       - `Dapur Dalam: Standard`
       - `Kamar: Premium`
       - `Kamar Mandi: Premium`, dst.
     - Karena `rt.images` kosong di database, `roomPhotoItems` menjadi array kosong `[]`, sehingga `hasDistinctRoomPhotos` bernilai `false` dan `showRoomPhotoNav` tidak pernah aktif.
3. **Kebutuhan Pengguna**:
   - Pengguna menginginkan listing kost biasa memiliki tombol kontrol navigasi foto terkait untuk **setiap tipe kamar** (seperti `Tipe Standard`, `Tipe Premium`), sama halnya dengan fitur pada KostManager yang menampilkan foto per unit kamar.
   - Mengklik tombol tipe kamar akan menampilkan foto-foto yang terkait dengan tipe kamar tersebut (foto interior kamar, kamar mandi dalam tipe tersebut, dapur dalam tipe tersebut, dll.).
   - Tersedia tombol `[Semua Foto]` (dan tombol reset `Lihat Semua Foto ↺`) untuk kembali menampilkan seluruh foto properti.
   - Sinkronisasi dua arah: mengklik tipe kamar di sidebar kanan booking card juga otomatis memfilter galeri foto ke tipe kamar tersebut, dan sebaliknya.

---

### 2. Dampak Perubahan File

Perubahan difokuskan secara presisi pada satu file utama tanpa merusak logika yang sudah berjalan stabil:
- **`functions/public/pages/KostDetail.tsx`**:
  1. **Enrichment Data Foto Kamar (`normalizedRooms`)**:
     - Memperkaya pemetaan kamar pada listing kost biasa (`!kost.isManaged`) agar selain membaca `rt.images`, juga secara cerdas mengekstrak foto-foto dari `propertyPhotos` / `photosMeta` / `categorizedPhotos` yang memiliki label atau kategori berelasi dengan tipe kamar tersebut (`Kamar: [Nama Tipe]`, `Kamar Mandi: [Nama Tipe]`, `KM Dalam: [Nama Tipe]`, `Dapur Dalam: [Nama Tipe]`, atau yang mengandung nama tipe kamar).
  2. **Penentuan Unit Navigasi Foto (`targetRoomUnits` & `hasDistinctRoomPhotos`)**:
     - Mendukung navigasi foto berbasis **Tipe Kamar** untuk kost biasa dan **Unit Kamar** untuk KostManager.
     - `showRoomPhotoNav` aktif jika terdapat foto yang terasosiasi dengan tipe kamar tersebut.
  3. **Tampilan UI Bilah Navigasi Foto (`showRoomPhotoNav`)**:
     - Header dinamis: `Pilih Foto Tipe Kamar` untuk kost biasa, dan `Pilih Foto Unit Kamar` untuk KostManager.
     - Tombol untuk setiap tipe kamar (misal: `[Tipe Standard]`, `[Tipe Premium]`) lengkap dengan ikon `<Bed />`, nama tipe kamar, dan indikator jumlah foto.
     - Tombol `[Semua Foto]` dengan ikon `<Home />` serta tombol reset `Lihat Semua Foto ↺`.
  4. **Sinkronisasi Dua Arah**:
     - Mengklik tombol tipe kamar di bilah foto akan menyinkronkan `selectedVariantIdx` dan `selectedParentTypeIdx` pada kartu booking sidebar.
     - Mengklik kartu tipe kamar di sidebar akan otomatis menyetel `activePhotoFilter` ke tipe kamar tersebut dan mereset slide carousel ke 0.

---

### 3. Rencana Langkah Eksekusi Bertahap (Fase 2)

#### Langkah 1: Memperkaya Pemetaan Foto Tipe Kamar pada `normalizedRooms` (`KostDetail.tsx`)
- Di dalam pemetaan listing kost biasa (`!Array.isArray(rt.rooms) || rt.rooms.length === 0`):
  - Cari foto-foto di `propertyPhotos` yang label/kategori/caption-nya mengandung:
    - `Kamar: ${rt.name}`
    - `Kamar Mandi: ${rt.name}` atau `KM Dalam: ${rt.name}`
    - `Dapur Dalam: ${rt.name}`
    - Atau kecocokan kata nama tipe kamar (`rt.name`).
  - Untuk kost dengan 1 tipe kamar saja, sertakan juga foto umum kamar (`Kamar`, `Interior Kamar`, `Kamar Mandi Dalam`) agar tetap dapat dinavigasi.
  - Gabungkan dengan `rt.images` (jika ada) dan lakukan de-duplikasi URL.
  - Masukkan ke dalam `roomPhotoItems` dan `images` pada objek room yang dinormalisasi.

#### Langkah 2: Mengoptimalkan State Navigasi Foto & Filter
- Pastikan `emptyRooms` / `targetRooms` menyertakan entitas tipe kamar pada listing biasa.
- Pastikan `activeFilteredRoom` dapat mencocokkan ID kamar atau nama tipe kamar sehingga `displayedPhotoItems` mengembalikan daftar foto tipe kamar tersebut saat dipilih.
- Fallback cerdas: jika tipe kamar tidak memiliki foto khusus, galeri tetap aman dan tidak menghasilkan layar kosong.

#### Langkah 3: Menyesuaikan Komponen UI Bilah Tombol Navigasi Foto
- Perbarui judul bilah:
  - KostManager: `PILIH FOTO UNIT KAMAR`
  - Kost Biasa: `PILIH FOTO TIPE KAMAR`
- Perbarui rendering tombol:
  - Menampilkan nama tipe kamar (`Tipe Standard`, `Tipe Premium`) dengan badge jumlah foto yang elegan.
  - State aktif menggunakan warna oranye tema RuangSinggah (`bg-orange-500 text-white`).
  - Handler klik menyinkronkan `activePhotoFilter`, `currentPhoto(0)`, dan `selectedVariantIdx`.

#### Langkah 4: Uji Kompilasi & Integrasi
- Jalankan `npm run build` di `functions/public/` untuk memastikan 0 error TypeScript/Vite.
- Catat progres ke `functions/PROGRESS.md` (Anti-Amnesia).
- Terbitkan `WALKTHROUGH.md`.
- Lakukan git commit dan push ke branch `bukan-productions`.

---

### 4. Rencana Verifikasi

1. **Uji Kompilasi**:
   - `cmd /c npm run build` di direktori `functions/public/` harus sukses 100% tanpa error kompilasi.
2. **Uji Validasi Data Riil**:
   - Verifikasi data listing "KOST APALAH DAYA" di Supabase yang memiliki 2 tipe kamar (`Standard` dan `Premium`) dengan foto masing-masing (`Kamar: Standard`, `Kamar Mandi: Standard`, `Kamar: Premium`, `Kamar Mandi: Premium`).
   - Memastikan tombol `[Tipe Standard]` dan `[Tipe Premium]` muncul di bawah carousel foto.
   - Memastikan ketika tombol `[Tipe Standard]` diklik, carousel hanya menampilkan foto-foto kamar Standard.
   - Memastikan ketika tombol `[Tipe Premium]` diklik, carousel hanya menampilkan foto-foto kamar Premium.
   - Memastikan tombol `[Semua Foto]` mengembalikan seluruh foto properti.
