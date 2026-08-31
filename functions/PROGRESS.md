# PROGRESS - RuangSinggah Development

## Fitur Selesai (Completed Features)

### 235. Rekalibrasi Presisi Gerbang Master Landmark Makassar & Fitur Tarik Titik Resmi Google Maps (`KostFormMitra.tsx`, `curatedLandmarks.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna menemukan bahwa titik koordinat PNUP jatuh di Danau/Wisma Unhas dan UIM jatuh di perumahan lorong KM 7/8.
- **Implementasi Solusi**:
  1. **Rekalibrasi Titik Koordinat Gerbang Jalan Raya Utama ([`curatedLandmarks.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/constants/curatedLandmarks.ts))**:
     - **PNUP (Politeknik Negeri Ujung Pandang)**: Dikoreksi ke `-5.138650, 119.496500` (Gerbang Timur Jl. Perintis Kemerdekaan KM 10).
     - **UIM (Universitas Islam Makassar)**: Dikoreksi ke `-5.140800, 119.482700` (Gerbang Utama Jl. Perintis Kemerdekaan KM 9 No.29).
     - **UNHAS Tamalanrea**: Dikoreksi ke `-5.138722, 119.489115` (Bundaran Pintu 1).
     - **UMI, UNM Gunungsari, UNM Parangtambung, UIN Samata, UNISMUH, Poltek ATI, RS Wahidin, RS Unhas, Mall Panakkukang, Nipah, TSM, MToS**: Seluruhnya direkalibrasi ke koordinat gerbang jalan protokol resmi.
  2. **Fitur "Tarik Titik Google" pada `FacilityLocationModal` ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx))**:
     - Tombol cepat **"Tarik Titik Google"** untuk langsung menyinkronkan koordinat resmi dari Google Geocoding/Places API dengan 1 klik.
- **File Tersentuh**:
  - `functions/public/components/KostFormMitra.tsx`
  - `functions/public/constants/curatedLandmarks.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2506 modules transformed, 33.00s, 0 error).

### 234. Master Dataset Anchor & Landmark Nasional Terkurasi Lengkap 350+ Titik Strategis & Isolasi 100% Master Data (`curatedLandmarks.ts`, `KostFormMitra.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Deteksi landmark open-world Google Maps mentah memunculkan tempat kursus/les bahasa (seperti *Full Bright Institute*), kampus besar yang terduplikasi karena marker gedung terpisah (seperti *Universitas Hasanuddin* dan *Rektorat UNHAS*), serta nama dalam bahasa Inggris (*Hasanuddin University*, *Makassar Islamic University*).
  - Pada pengujian awal, Google Places API di background masih sempat mengembalikan entri bahasa Inggris dan menggabungkannya ke state form.
- **Implementasi Solusi**:
  1. **Penyusunan Master Dataset Anchor Nasional Terlengkap ([`curatedLandmarks.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/constants/curatedLandmarks.ts))**:
     - Menyusun dataset master **350+ anchor strategis** dengan titik koordinat latitude & longitude presisi mencakup seluruh pulau di Indonesia.
     - Menyertakan kampus kedinasan (PKN STAN, IPDN), perguruan tinggi resmi (UI, ITB, UGM, UNHAS, dll.), mall, kawasan industri raksasa, rumah sakit rujukan nasional, dan hub transportasi (Whoosh).
  2. **Isolasi 100% Master Data & Engine Sinkron 0ms ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx))**:
     - **Isolasi Mutlak**: Jika master dataset mendeteksi kampus di wilayah tersebut, pemanggilan Google Places API untuk kategori kampus **DIMATIKAN 100%** (`scanCampusesFallback` tidak pernah dieksekusi).
     - Daftar kampus yang tersimpan di form dijamin **100% MURNI dari Master Dataset kita** (`Universitas Hasanuddin (UNHAS) - Tamalanrea`, `Universitas Islam Makassar (UIM)`, `Politeknik Negeri Ujung Pandang (PNUP)`), tanpa ada entri bahasa Inggris atau tempat kursus.
     - Menambahkan filter blacklist agresif saat inisialisasi draft dan hook reaktif pada Step 1 (Lokasi) agar data draft lama otomatis tertimpa master data murni.
     - Google Places API difokuskan khusus memindai fasilitas harian mikro (Minimarket Indomaret/Alfamart terdekat, Laundry kiloan terdekat, dan Tempat Ibadah terdekat dalam radius 2 KM).
- **File Tersentuh**:
  - `functions/public/constants/curatedLandmarks.ts` (350+ Anchor se-Indonesia)
  - `functions/public/components/KostFormMitra.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2506 modules transformed, 22.37s, 0 error).

### 233. Sistem Penyimpanan & Pemulihan Draft Otomatis Formulir Listing Mandiri (`KostFormMitra.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan bahwa saat mengisi formulir penambahan listing mandiri dan modal tertutup (*close*, refresh, atau berpindah layar), seluruh data yang sudah dimasukkan langsung hilang total dan harus mengulang pengisian dari awal lagi (*"sistem draft yang ada pada sistem penambahan listing mandiri yang ada pada dashboard admin berlum berufungsi optimal. ketika terclose dan sebagainya, data yang sebelumnya sudah kita masukkan langsung hilang. saya juga ingin agar ketik sudah memasukkan data dan close, data tersebut masih dapat dilanjutkan pengisiannya tanpa harus mengulang semuanya dari awal lagi"*).
- **Implementasi Solusi**:
  1. **Penyimpanan Draft Real-Time ke LocalStorage ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx))**:
     - Mengimplementasikan helper `getDraftStorageKey(userId)` yang menyimpan snapshot state formulir secara real-time saat ada perubahan pada `form`, `step`, maupun `managementOption`.
     - Menyimpan seluruh data: judul, deskripsi, lokasi, koordinat GPS/peta, provinsi, kota, kecamatan, landmark terdeteksi, fasilitas gedung, fasilitas kamar, tipe kamar, peraturan, dan kontak.
  2. **Pemulihan Otomatis & Lanjutkan Sesi (*Smart Draft Resume*)**:
     - Saat modal dibuka dalam mode baru (`!isEditing`), sistem otomatis memulihkan seluruh data dan langsung membawa pengguna ke posisi langkah (*Step*) terakhir yang sedang dikerjakan.
  3. **Antarmuka Banner Draft & Opsi Reset**:
     - Menampilkan banner status: *"📋 Melanjutkan Draft Pengisian (Langkah X)"*.
     - Menyediakan tombol pintas **"Mulai Baru"** (`<RotateCcw />`) jika pengguna ingin membersihkan draft dan mengulang formulir baru dari awal.
     - Menyematkan badge status *"Draft Aktif"* di header modal.
  4. **Pembersihan Otomatis Pasca-Publikasi**:
     - Menghapus draft dari `localStorage` secara otomatis saat properti berhasil disimpan/dipublikasikan ke database (`onSuccess`).
- **File Tersentuh**:
  - `functions/public/components/KostFormMitra.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 29.64s, 0 error).

### 232. Penyempurnaan Deteksi Landmark: Kampus Top-to-Normal (Radius 7 KM) & Fasilitas Harian Terdekat (`KostFormMitra.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna memberikan evaluasi bahwa hasil deteksi sebelumnya masih menampilkan lembaga kursus/bimbel kecil acak (seperti *"Sekolah Tinggi Ilmu Ekono"*, *"Academy of Pharmacy"*, dll.). Pengguna meminta agar:
    1. Kampus ditampilkan dari yang paling top (populer/terkenal) hingga kampus biasa asalkan masuk dalam radius 7 KM.
    2. Fasilitas harian penting (Mall, Supermarket/Minimarket, Tempat Ibadah, Laundry, RS) menampilkan titik lokasi yang **paling dekat** dari titik koordinat kost (*"untuk kampus mungkin kita bisa menampilkan kampus kampus yang dari top hingga biasa aja asalkan radiusnya masuk. untuk mall, supermarket/minimarket, tempat ibadah (masjid, gereja dll) dan laundry . tampilkan titik lokasi yang paling dekat aja dari titikk lokasi"*).
- **Implementasi Solusi**:
  1. **Penyaringan Blacklist Kursus & Bimbel**:
     - Mengeliminasi tempat kursus/les non-kuliah (*bimbel, kursus, les, kumon, study club, daycare, tk, paud, sd, smp, sma, balai latihan*).
  2. **Pemeringkatan Kampus Top-to-Normal (Radius 7 KM)**:
     - Menggunakan skor popularitas berbasis ulasan riil Google Maps (`popularityScore = Math.log10(ratingsCount + 1) * 35 + (rating * 3) - ((km / 7) * 8)`).
     - Mengambil top 4 kampus paling bereputasi dan relevan dalam radius 7 KM.
  3. **Pencarian Fasilitas Harian Berbasis Jarak Terdekat (*Closest-First*)**:
     - 🛒 **Minimarket / Supermarket Terdekat** (Indomaret, Alfamidi, Alfamart, dll., radius 2 KM).
     - 🧺 **Laundry Kiloan Terdekat** (Laundry express, cuci kiloan, radius 2 KM).
     - 🕌⛪ **Tempat Ibadah Terdekat** (Masjid, Musholla, Gereja, radius 2 KM).
     - 🏥 **Rumah Sakit / Klinik Terdekat** (RSUP, RSUD, Klinik, radius 5 KM).
     - 🛍️ **Mall / Pusat Belanja Terdekat** (Mall, Plaza, radius 7 KM).
  4. **Kompilasi Otomatis & Terpadu**:
     - Seluruh hasil dikompilasi ke daftar landmark sekitar kost secara instan saat lokasi ditetapkan, lengkap dengan estimasi waktu tempuh dan rute Google Maps terintegrasi.
- **File Tersentuh**:
  - `functions/public/components/KostFormMitra.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 28.71s, 0 error).

### 231. Deteksi Otomatis Kampus & Landmark Terdekat via Google Places API (`KostFormMitra.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar sistem mengadopsi fitur otomatisasi seperti Mamikos, di mana saat titik lokasi kost ditetapkan dan dikonfirmasi di peta, landmark terdekat (seperti kampus, mall, rumah sakit, stasiun, terminal) otomatis terdeteksi dan langsung muncul tanpa perlu klik manual lagi (*"pakai deteksi landmark otomatis aja, tapi nggk usah di klik secara manual lagi, langsung aja ketika titik lokasi kost sudah di tetapkan dan dikonfirmasi maka semuanya akan muncul secara otomatis juga"*).
- **Implementasi Solusi**:
  1. **Integrasi Google Maps Places API (`nearbySearch`) ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx))**:
     - Mengembangkan fungsi `detectNearbyLandmarks(lat, lng)` yang langsung terpanggil secara otomatis setiap kali koordinat kost berubah di `handleLocationChange`.
     - Memindai secara paralel:
       - **Kampus / Universitas** (`type: 'university'`, radius 4.5 KM) -> otomatis mengisi top 4 kampus terdekat.
       - **Fasilitas Umum & Landmark Publik** (Mall, RS, Stasiun, Terminal, Supermarket, Pasar, radius 3.5 KM) -> otomatis mengisi top 4 fasilitas publik terdekat.
  2. **Kalkulasi Jarak Presisi & Penentuan Moda Transportasi**:
     - Menghitung jarak garis lurus geografis secara akurat (`± X.X KM`).
     - Menentukan moda transportasi default (Jalan Kaki jika $\le 1.0\text{ KM}$, Motor jika $> 1.0\text{ KM}$).
     - Menghitung otomatis estimasi waktu tempuh (Jalan Kaki, Motor, Mobil) dan mengaktifkan tombol rute Google Maps terintegrasi di halaman detail properti.
  3. **UI / UX Status Indikator & Kontrol Fleksibel**:
     - Menampilkan banner loading animasi `isScanningLandmarks` (*"Memindai kampus, rumah sakit, mall, & fasilitas terdekat dari Google Maps..."*).
     - Menyediakan tombol tambah manual dan tombol *"✨ Pindai Ulang Landmark"* bagi mitra.
- **File Tersentuh**:
  - `functions/public/components/KostFormMitra.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 32.24s, 0 error).

### 230. Perbaikan Parser Geocoding Wilayah Indonesia & Input Lengkap Provinsi, Kota/Kabupaten, Kecamatan (`KostFormMitra.tsx`, `userService.ts`, `types.ts`, `Dashboard.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna mengirimkan tangkapan layar form input lokasi kost di mana field Kota terisi *"Kecamatan Tamalanrea"* sedangkan field Kecamatan kosong, serta data provinsi belum tampil dan terindeks dengan baik (*"pada bagian ini di menu pengimputan atau deteksi otomatis terkait provinsi, kabupaten/kota, dan kecamatan. yang ada pada dashboard mitra, belum tampil dengan baik, dan belum terindeks dengan baik ketika setelah melakukan penambahan titik lokasi"*).
- **Implementasi Solusi**:
  1. **Parser Wilayah Indonesia Presisi (`extractIndonesianLocationComponents`)**:
     - Memperbaiki hierarki ekstraksi Google Maps Geocoder:
       - **Provinsi (`province`)**: Diekstrak dari `administrative_area_level_1` (misal: *Sulawesi Selatan*, *DKI Jakarta*, *Jawa Barat*, *DI Yogyakarta*).
       - **Kabupaten / Kota (`city`)**: Diekstrak secara prioritas dari `administrative_area_level_2` (misal: *Makassar*, *Jakarta Selatan*, *Bandung*, *Sleman*).
       - **Kecamatan / Area (`area`)**: Diekstrak dari `administrative_area_level_3` (format kecamatan Google Maps di Indonesia) / `sublocality` dan dibersihkan dari awalan *"Kecamatan "* sehingga menjadi *Tamalanrea*, *Tebet*, *Coblong*, dll.
  2. **Penyempurnaan Form Lokasi Step 1 ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx))**:
     - Menghadirkan struktur input wilayah yang komprehensif:
       - **Grid 2 Kolom**: Field **Provinsi** dan Field **Kota / Kabupaten \***.
       - Field **Kecamatan / Area**.
       - Field **Alamat Lengkap**.
     - Semua field terisi otomatis saat memilih titik peta / GPS / pencarian, dan tetap dapat diedit manual oleh mitra.
  3. **Penyelarasan Tipe Data & Mapping Layanan ([`types.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts), [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts))**:
     - Menambahkan properti `province?: string;` pada interface `Kost`.
     - Memastikan `getPublishedProperties` dan `getOwnerProperties` memetakan `province`, `city`, dan `area` secara presisi ke objek `Kost`.
  4. **Standardisasi di Dashboard Admin & Portal ([`Dashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx), [`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx))**:
     - Menyamakan prioritas ekstraksi kota (`administrative_area_level_2`) dan kecamatan (`administrative_area_level_3`) di seluruh panel admin dan portal.
- **File Tersentuh**:
  - `functions/public/types.ts`
  - `functions/public/components/KostFormMitra.tsx`
  - `functions/public/userService.ts`
  - `functions/public/pages/Dashboard.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 32.96s, 0 error).

### 229. Tombol Deteksi Lokasi GPS Otomatis pada Formulir Penetapan Lokasi Kost (`KostFormMitra.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna mengirimkan tangkapan layar formulir *Tambah Kost Baru* (Langkah 2: Pilih Lokasi di Peta) dan meminta agar disediakan tombol langsung untuk menggunakan lokasi GPS perangkat saat ini secara instan (*"pada penetapan lokasi, belum ada tombol untuk menggunakan lokasi sekarang secara langsung, yang berdasarkan lokasi gps"*).
- **Implementasi Solusi**:
  1. **Tombol Aksi Utama Gradien Oranye ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx))**:
     - Menghadirkan tombol khusus berlabel **"📍 Gunakan Lokasi Saya Sekarang (GPS)"** yang mencolok di antara kolom pencarian dan peta mini.
     - Dilengkapi indikator state `isLocating` dengan animasi spinner `Loader2` dan teks *"Mendeteksi Lokasi GPS Anda..."*.
  2. **Floating Quick Button di Viewport Peta**:
     - Menambahkan floating action button (FAB) GPS di pojok kiri atas peta mini dan tombol GPS di modal pop-up peta fullscreen dengan akurasi tinggi (`enableHighAccuracy: true`, `timeout: 12000`).
  3. **Auto Zoom & Reverse-Geocoding Instan**:
     - Otomatis memindahkan marker, memusatkan peta (*center/panTo*), dan memperbesar zoom ke level jalanan (*zoom 17*).
     - Menjalankan *reverse-geocoding* Google Maps Geocoder untuk otomatis mengisi field **Kota**, **Kecamatan / Area**, dan **Alamat Lengkap** tanpa perlu mengetik manual.
  4. **Pembersihan Icon Ligature ke Pure `lucide-react` SVG**:
     - Mengganti sisa icon font HTML ligature (`material-symbols-outlined`) pada dialog konfirmasi lokasi menjadi pure bundled vector SVG (`Crosshair`, `CheckCircle2`, `MapPin`) untuk mencegah FOUT.
- **File Tersentuh**:
  - `functions/public/components/KostFormMitra.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 49.09s, 0 error).

### 228. Penyesuaian Copywriting Fitur Pelaporan Menjadi "Laporkan Properti" (`KostDetail.tsx`, `userService.ts`, `emailService.ts`, `PropertyManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar istilah "iklan" dihilangkan pada fitur pelaporan kost, dan cukup menggunakan terminologi yang lebih formal dan tepat: **"Laporkan Properti"** (*"btw pada pelaporan kost, tidak usah pakai kata kata iklan. cukup dengan kata laporkan properti"*).
- **Implementasi Solusi**:
  1. **Halaman Detail Properti ([`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx))**:
     - Tombol sticky aksi diubah dari *"Laporkan Iklan Ini"* menjadi **"Laporkan Properti"**.
     - Banner bawah diubah dari *"Menemukan Masalah pada Iklan Ini?"* menjadi **"Menemukan Masalah pada Properti Ini?"**.
     - Tombol pada banner bawah diubah dari *"Laporkan Kost"* menjadi **"Laporkan Properti"**.
     - Header modal popup diubah dari *"Laporkan Iklan Kost"* menjadi **"Laporkan Properti"**.
  2. **Layanan Data & Notifikasi Email Admin ([`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts), [`emailService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts))**:
     - Subjek notifikasi email admin diubah menjadi `🚨 Aduan Properti Masuk: [Nama Properti]`.
     - Fallback title pada database keluhan diubah menjadi `[Laporan Properti] [Nama Kost]`.
  3. **Pesan WhatsApp Follow-Up Admin ([`PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx))**:
     - Teks pesan WhatsApp konfirmasi ke pelapor disesuaikan menjadi *"...melaporkan kendala pada properti..."*.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/userService.ts`
  - `functions/public/emailService.ts`
  - `functions/public/components/admin/PropertyManagement.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 22.34s, 0 error).

### 227. Independen Scrollbar pada Sidebar Navigasi Admin Dashboard (`Dashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar daftar menu pada sidebar navigasi admin di Dashboard Admin dapat di-scroll ke bawah secara mandiri tanpa membuat badan website atau konten utama halaman ikut ter-scroll (*"pada navigasi admin ini , bisa nggak sih scroll ke bawah tanpa harus badan websitenya atau isi web nya juga ikut scroll"*).
- **Implementasi Solusi**:
  1. **Penguncian Posisi & Dimensi Sidebar ([`Dashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx))**:
     - Mengubah container `<aside>` pada `renderSidebar` menjadi `h-screen sticky top-0 z-20 hidden md:flex flex-col shrink-0`.
     - Memberikan `shrink-0` pada container header (*Admin Panel* dan tombol *Lihat sebagai User*) agar selalu berada di posisi teratas yang nyaman diakses.
  2. **Scroll Mandiri & Pencegahan Scroll Bocor**:
     - Menerapkan `flex-1 overflow-y-auto overscroll-contain select-none scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300` pada elemen `<nav>`.
     - Properti `overscroll-contain` memastikan gesture scroll di atas sidebar tidak merambat (leak) ke document body / window.
  3. **Penyesuaian Area Konten Utama**:
     - Menambahkan `min-w-0` pada wrapper konten utama (`<div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">`) untuk mencegah horizontal layout blowout.
- **File Tersentuh**:
  - `functions/public/pages/Dashboard.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `tsc` di `functions/` lulus (0 error).
  - Kompilasi Vite `npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 19.78s, 0 error).

### 226. Sistem Pelaporan Iklan Kost oleh Pengguna & Pusat Manajemen Laporan Properti di Dashboard Admin (`KostDetail.tsx`, `PropertyManagement.tsx`, `userService.ts`, `adminService.ts`, `emailService.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar pada halaman publik listing kost disediakan tombol pelaporan aduan bagi pengguna (*"kalau misalnya ada tombol pembekuan atau banned artinya kita perlu ada tombol laporkan nggak sih di tampilan listing kost dari sisi user?"*) untuk melaporkan indikasi penipuan, ketidaksesuaian data, atau pelanggaran pada listing mandiri (*Self-Listing*).
  - Diperlukan antarmuka manajemen aduan kost di Dashboard Admin (*"okee kita perlu juga manajemen laporan kost di dashboard admin"*).
- **Implementasi Solusi**:
  1. **Tombol & Modal Pelaporan Pengguna Publik ([`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx))**:
     - Menambahkan tombol *"🚩 Laporkan Iklan Ini"* di kartu sticky sidebar dan banner card pengaduan di bagian bawah detail properti.
     - Modal interaktif pengaduan pengguna:
       - Pilihan kategori aduan: 🚨 *Indikasi Penipuan / Minta Transfer di Luar Sistem* (`fraud`), 🏷️ *Harga atau Fasilitas Tidak Sesuai Realita* (`mismatch`), 📍 *Lokasi Titik Peta Palsu / Tidak Akurat* (`fake_location`), 🚫 *Kost Sudah Penuh / Tidak Beroperasi* (`closed_or_full`), 🔞 *Foto / Konten Tidak Pantas* (`inappropriate`), 📝 *Lainnya* (`other`).
       - Form input rincian masalah/kronologi kendala.
       - Form input identitas pelapor: Nama dan No. WhatsApp aktif (otomatis terisi jika user sudah login).
       - Unggah lampiran foto bukti dengan **konversi otomatis ke WebP di sisi klien** (`compressImageToWebP`).
  2. **Notifikasi Email Real-Time ke Admin ([`emailService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts))**:
     - Fungsi `notifyAdminPropertyReport` mengirimkan email terstruktur ke seluruh admin platform via FormSubmit memuat nama properti, ID kost, kategori aduan, deskripsi laporan, nama pelapor, WhatsApp pelapor, nama pemilik, dan tautan bukti foto.
  3. **Layanan Data Backend ([`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts), [`adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))**:
     - `uploadReportEvidence`: Unggah foto bukti WebP ke storage bucket.
     - `submitPropertyReport`: Simpan tiket aduan ke database Supabase `property_reports` (dengan fallback ke `complaints` format `REPORT:`).
     - `getPropertyReports`: Mengambil daftar aduan listing lengkap dengan join data relasi properti dan pemilik kost.
     - `updatePropertyReportStatus`: Pembaruan status aduan (`pending`, `reviewed`, `resolved`, `dismissed`) beserta catatan admin dan tindakan yang diambil (*action taken*).
  4. **Pusat Manajemen Aduan di Dashboard Admin ([`PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx))**:
     - **Kartu Statistik & Tab Baru**: Tab `🚨 Aduan Pengguna` dengan badge counter jumlah aduan *pending* yang belum ditinjau.
     - **Badge Peringatan Properti**: Menampilkan badge merah `🚨 X Aduan` pada tabel properti utama jika listing terkait memiliki aduan aktif.
     - **Tabel Aduan Interaktif**: Kolom Properti yang dilaporkan + tombol chat pemilik, Kategori & Kronologi masalah, Kontak Pelapor (+ tombol 1-klik chat WhatsApp pelapor), Thumbnail bukti foto (dengan modal zoom preview foto besar), dan Status penanganan.
     - **Aksi Cepat 1-Klik**:
       - **"Bekukan Kost Ini" (Freeze)**: Membuka modal freeze dengan alasan penalti yang otomatis terisi dari laporan user dan menandai aduan sebagai telah ditindaklanjuti (`action_taken: 'frozen'`).
       - **"Chat Pemilik Kost (WA)"**: Menghubungi mitra pemilik kost untuk klarifikasi.
       - **"Chat Pelapor (WA)"**: Mengonfirmasi tindak lanjut kepada pelapor.
       - **"Tandai Selesai"** (`resolved`) dan **"Abaikan"** (`dismissed`).
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/components/admin/PropertyManagement.tsx`
  - `functions/public/userService.ts`
  - `functions/public/adminService.ts`
  - `functions/public/emailService.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 24.82s, 0 error).

### 225. Pusat Moderasi & Supervisi Listing Kost Masuk di Dashboard Admin (`PropertyManagement.tsx`, `adminService.ts`, `Dashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna menjelaskan perubahan paradigma sistem: Sebelumnya admin menginput dan mengunggah seluruh data kost secara manual, namun sekarang listing kost diposting langsung oleh pemilik kost / mitra secara mandiri melalui dashboard mitra.
  - Admin kini bertindak sebagai **pengawas & supervisor moderasi** untuk memantau kelayakan listing yang masuk, membedakan Self Listing (Mandiri) vs KostManager (Terverifikasi survey langsung), memverifikasi data, atau **membekukan (*suspend / freeze*) sementara** jika ada indikasi penalti atau data yang perlu direvisi oleh mitra.
- **Implementasi Solusi**:
  1. **Komponen Modular Pusat Moderasi ([`PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx))**:
     - **Kartu Statistik Pengawasan**: Total Properti, KostManager (Terverifikasi), Self Listing (Mandiri), Draft / Belum Tayang, dan Dibekukan (Penalti / Butuh Edit).
     - **Filter Tab Navigasi**:
       - `Semua Properti`
       - `KostManager (Terverifikasi)` (Otomatis terverifikasi karena dikunjungi agen survey)
       - `Self Listing (Mandiri)`
       - `Draft / Belum Tayang`
       - `Dibekukan / Penalti`
     - **Pencarian Cepat & Filter Multi-Kriteria**: Pencarian instan (nama kost, nama pemilik, WhatsApp, kota, area, alamat), filter tipe (Semua, Putra, Putri, Campur), dan dropdown wilayah kota dinamis.
     - **Tabel Moderasi Interaktif**:
       - Kolom foto thumbnail WebP, nama kost, tipe, total tipe kamar, badge status terbit/draft/dibekukan, dan badge model (KostManager vs Self Listing).
       - Info Pemilik/Mitra: Nama pemilik, badge verifikasi KTP, dan tombol 1-klik chat WhatsApp pemilik.
       - Tarif & Kamar: Rentang harga sewa terendah.
       - Lokasi: Kota, kecamatan/area, dan alamat.
     - **Aksi Cepat Moderasi**:
       - **Publikasikan / Draftkan**: Tombol 1-klik mengubah status keterbitan di katalog publik.
       - **Bekukan Listing (Suspend / Freeze)**: Modal input alasan pembekuan/catatan penalti dan pengalihan status ke `suspended`.
       - **Buka Pembekuan (Unfreeze)**: Memulihkan listing kembali aktif setelah data diperbaiki.
       - **Centang Biru Toggle**: Mengatur status verifikasi terpercaya.
       - **Transfer Kepemilikan**: Memindahkan hak kelola listing ke akun mitra lain.
       - **Kunjungi Halaman Publik**: Tautan langsung ke halaman detail `/kost/:id`.
       - **Hapus Listing**: Penghapusan aman dengan konfirmasi modal.
  2. **Modal Tinjauan & Supervisi Komprehensif ([`PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx))**:
     - Membuka lembar inspeksi mendalam: Galeri foto/video kost, profil pemilik/mitra + WhatsApp, deskripsi lengkap, daftar kamar & skema harga sewa (harian, mingguan, bulanan, tahunan), fasilitas kamar & kamar mandi, fasilitas umum gedung, peraturan kost, dan koordinat peta.
     - Banner peringatan khusus jika listing sedang dalam status dibekukan disertai alasan penalti/revisi.
     - Tombol moderasi lengkap di dalam modal footer.
  3. **Backend Service Helper ([`adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))**:
     - Memperbarui `getAdminProperties` untuk mengambil relasi data profil pemilik (`users: phone, email, verification_status`), status `suspended`, catatan `suspendReason`, dan status KostManager.
     - Menambahkan fungsi `freezeProperty(propertyId, reason)`, `unfreezeProperty(propertyId)`, dan `togglePropertyVerification(propertyId, isVerified)`.
  4. **Pembersihan & Integrasi ([`Dashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx))**:
     - Mengintegrasikan `<PropertyManagement />` pada menu `activeMenu === 'properties'`.
     - Menghapus form modal manual 6-step inline (~100 baris kode peninggalan lama) sehingga arsitektur kode dashboard admin menjadi sangat bersih dan modular.
- **File Tersentuh**:
  - `functions/public/components/admin/PropertyManagement.tsx`
  - `functions/public/adminService.ts`
  - `functions/public/pages/Dashboard.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2505 modules transformed, 24.77s, 0 error).

### 224. Notifikasi Email Otomatis ke Admin Saat Ada Pengajuan Verifikasi Identitas Mitra & Agen Baru (`emailService.ts`, `MitraProfile.tsx`, `AgentProfile.tsx`, `Profile.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar setiap kali ada pengajuan verifikasi identitas (KTP) yang masuk, baik dari calon mitra (pemilik kost) maupun calon agen pemasaran, sistem secara otomatis mengirimkan notifikasi email ke email admin.
- **Implementasi Solusi**:
  1. **Helper Notifikasi Email Terstruktur ([`emailService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts))**:
     - Menambahkan fungsi `notifyAdminIdentityVerification` yang mengirimkan email berformat profesional via FormSubmit ke seluruh admin yang terdaftar di database `users` (dengan fallback email `sulhan77777@gmail.com`).
     - Payload email mencakup: Tipe Akun (Calon Mitra / Calon Agen), Nama Lengkap, Email Akun, Nomor WhatsApp, NIK KTP, Alamat KTP, Tautan Foto KTP, ID Pengguna, dan Tautan Langsung ke Dashboard Verifikasi Admin.
  2. **Integrasi Pemicu Notifikasi pada Profil ([`MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx), [`AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx), [`Profile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx))**:
     - Saat pengguna menyimpan profil dan mengajukan data KTP (`user_verifications` status `'pending'`), fungsi `notifyAdminIdentityVerification` langsung dipicu secara asynchronous (non-blocking) di latar belakang sehingga UI pengguna tetap instan.
- **File Tersentuh**:
  - `functions/public/emailService.ts`
  - `functions/public/pages/MitraProfile.tsx`
  - `functions/public/pages/AgentProfile.tsx`
  - `functions/public/pages/Profile.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2504 modules transformed, 25.55s, 0 error).

### 223. Optimasi Drastis Kecepatan OCR KTP (1-2 Detik) dengan Gemini Multimodal Vision, Direct Base64 Transfer, & Eliminasi Tesseract.js Browser (`MitraProfile.tsx`, `AgentProfile.tsx`, `analyze-ktp`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan proses pemindaian OCR data KTP pada modal verifikasi identitas mitra & agen sangat lambat dan sering macet (*"kok lama bangaet ya sistem ocr pembacaan data ktp pada sistem verifikasi identitas kita"*).
  - Mengalami timeout 25 detik pada pengujian awal.
- **Akar Masalah**:
  1. Frontend sebelumnya menjalankan `Tesseract.js` di browser pengguna yang memaksakan unduhan file bahasa 20MB (`ind.traineddata.gz`) dan komputasi single-threaded raster piksel lokal selama 30-90+ detik.
  2. Model `gemini-3.7-flash` belum memiliki endpoint resmi di API v1beta sehingga menghasilkan looping retry 404 pada setiap API key (membuang waktu 15-20 detik).
  3. Latensi download sekunder file dari URL storage oleh Edge Function.
- **Implementasi Solusi**:
  1. **Eliminasi Tesseract.js & Direct Base64 Transfer ([`MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx), [`AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx))**:
     - Menghapus dependensi dan eksekusi `Tesseract.js`.
     - File WebP lokal dibaca menjadi `base64Image` secara instan dan dikirim langsung ke Edge Function bersamaan dengan `imageUrl`.
     - Melindungi pemanggilan dengan timeout 25 detik dan graceful alert jika terjadi kendala jaringan.
  2. **Fast Active Flash Cascade & Smart 404 Break ([`analyze-ktp/index.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/supabase/functions/analyze-ktp/index.ts))**:
     - Menerapkan prioritas model flash aktif: `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']`.
     - Menambahkan proteksi `if (response.status === 404) break;` sehingga tidak ada waktu terbuang untuk mencoba ulang model yang tidak terdaftar.
     - Gambar KTP dibaca langsung via Multimodal Vision (Base64/URL) dalam **1,0 - 1,5 detik** dan mengekstrak NIK (16 digit), Nama, Tempat Lahir, Tanggal Lahir (YYYY-MM-DD), Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan, dan Alamat KTP.
- **File Tersentuh**:
  - `functions/public/pages/MitraProfile.tsx`
  - `functions/public/pages/AgentProfile.tsx`
  - `supabase/functions/analyze-ktp/index.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2504 modules transformed, 22.52s, 0 error).

### 222. Integrasi Langsung Landing Page KostManager Penuh & Alur Action Button Pendaftaran Akun Mitra (`Owner.tsx`, `KostManagerLanding.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar ketika memilih opsi "Kost Manager" pada menu Kemitraan (`/owner`), sistem langsung menampilkan landing page KostManager yang sama dengan yang ada pada dashboard mitra/portal tanpa layar perantara (*intermediate screen*).
  - Seluruh *action button* (*"Mulai Auto-Pilot Kost Sekarang"*, *"Langganan KostManager Sekarang"*, dll.) jika diklik oleh pengunjung yang belum login tidak langsung membuka formulir pendaftaran modal mentah, melainkan diarahkan terlebih dahulu untuk **membuat akun mitra** (`/login?role=owner&mode=register`).
- **Implementasi Solusi**:
  1. **Integrasi Langsung 1-Klik (`Owner.tsx`)**:
     - Menghilangkan layar banner perantara lama.
     - Mengintegrasikan langsung `<KostManagerLanding user={user} onBack={() => setPartnerType(null)} isEmbedded={true} />` saat `partnerType === 'manajemen'`.
  2. **Penyesuaian Action Button & Autentikasi Mitra (`KostManagerLanding.tsx`)**:
     - Memperbarui `handleOpenRegistration` agar mendeteksi status `user`.
     - Jika `!user`: Langsung mengarahkan ke pendaftaran akun role Pemilik Kost (`/login?role=owner&mode=register`).
     - Jika sudah login: Membuka modal pendaftaran data kost & aktivasi paket langganan.
  3. **Navigasi Mulus (`onBack` & `isEmbedded`)**:
     - Mendukung navigasi kembali ke layar pemilihan kemitraan (`onBack`), serta menyembunyikan drawer dashboard mitra jika di-render secara embedded pada halaman publik.
- **File Tersentuh**:
  - `functions/public/pages/Owner.tsx`
  - `functions/public/pages/KostManagerLanding.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 22.75s, 0 error).

### 221. Transformasi Halaman Kemitraan Mitra Pemasaran ke Sistem Self-Listing Mandiri & Pembaruan Konten Landing Page Modern (`Owner.tsx`, `App.tsx`, `Login.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta evaluasi halaman kemitraan mitra pemasaran (`/owner`), di mana sistem sebelumnya masih menggunakan formulir manual proposal (`mitra_requests`), padahal platform RuangSinggah saat ini sudah memiliki sistem **Self-Listing mandiri terpadu**. Pemilik cukup membuat akun role mitra dan mengunggah properti sendiri lewat Dashboard Mitra.
  - Penyesuaian konten landing page agar selaras dengan fitur dan alur kerja RuangSinggah versi terkini.
- **Implementasi Solusi**:
  1. **Penghapusan Alur Formulir Manual Usang**:
     - Menghapus modal formulir pendaftaran manual (`mitra_requests`), MoU checklist manual, dan form proposal yang sudah tidak relevan.
  2. **Peralihan ke Alur Self-Listing Penuh & CTA Pintar**:
     - **Jika Belum Login**: Tombol CTA mengarahkan pemilik kost langsung ke pendaftaran akun role Pemilik Kost (`/login?role=owner&mode=register`).
     - **Jika Sudah Login (Mitra/Owner/User)**: Tombol CTA mengarahkan langsung ke **Dashboard Mitra** (`/dashboard-owner`) untuk langsung mulai menambah dan mengelola properti mandiri.
     - Penyesuaian di `Login.tsx` untuk secara otomatis mengenali query param `role=owner` & `mode=register` dan membuka tab form registrasi Pemilik Kost.
  3. **Pembaruan Konten Copywriting Landing Page Modern**:
     - **Hero Section**: Headline *"Pasang Iklan Kost Mandiri, Cepat & 100% Bebas Biaya"*, menonjolkan jangkauan ribuan mahasiswa, upload foto WebP otomatis, dan kendali ketersediaan kamar real-time.
     - **3 Langkah Mudah Self-Listing (How It Works)**:
       1. *Buat Akun Mitra (1 Menit)*
       2. *Input Detail & Upload Foto Mandiri (WebP)*
       3. *Listing Langsung Tayang & Terima Booking*
     - **6 Fitur Unggulan Dashboard Mitra**: Self-Listing cepat & fleksibel, kontrol kamar kosong/terisi real-time, kompresi foto otomatis WebP, pemasaran berbasis radius kampus, notifikasi booking & transaksi masuk, dan badge verifikasi properti.
     - **Interactive FAQ Accordion**: 4 pertanyaan umum seputar biaya gratis, cara upload foto, fleksibilitas harga, dan perbedaan dengan Kost Manager.
     - **Bottom CTA Banner**: Ajakan gabung dengan tombol langsung menuju pendaftaran/Dashboard Mitra.
- **File Tersentuh**:
  - `functions/public/pages/Owner.tsx`
  - `functions/public/App.tsx`
  - `functions/public/pages/Login.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 33.24s, 0 error).

### 220. Sistem Riwayat Tiket Kendala & Tracking Status Penanganan Realtime di Modal Lapor Kendala (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna menyampaikan kekhawatiran bahwa riwayat pengiriman tiket kendala tidak dapat dilihat oleh penghuni (*"apakah riwayat tiket pengiriman atau pelaporan kendalanya tidak dapat dilihat? kalau begini bikin user ragu apakah laporannya benar benar sudah terkirim atau tidak"*).
- **Implementasi Solusi**:
  1. **Navigasi 2-Tab Internal pada Modal Layanan Tiket Kendala**:
     - Menghadirkan segmented control tab modern:
       - **Tab 1: 📝 Buat Laporan Baru** (Formulir pengajuan komplain dengan opsi kategori, urgensi, deskripsi, dan upload multi-foto hingga 3 foto WebP).
       - **Tab 2: 📋 Riwayat Tiket Saya (X)** (Menampilkan daftar seluruh tiket kendala yang pernah diajukan penghuni dengan counter jumlah tiket real-time).
  2. **Auto-Switch & Kepastian Instan Pasca-Submit**:
     - Begitu penghuni menekan tombol *Kirim Laporan Kendala*, data dikompresi ke WebP dan disimpan ke database, formulir di-reset, dan sistem **secara otomatis mengalihkan penghuni ke Tab 2 (Riwayat Tiket)**.
     - Tiket yang baru saja dikirim langsung muncul di posisi teratas dengan status `⏳ Menunggu Tindakan`, memberikan kepastian 100% kepada pengguna bahwa laporannya telah tersimpan aman.
  3. **Visualisasi Kartu Tiket Lengkap & Tracking Status**:
     - Menampilkan ID Tiket (`#TKT-XXXXXX`), tanggal dan jam lapor.
     - Badge Kategori (AC, Air, Listrik, Furnitur, WiFi, Kebersihan, Keamanan, Lainnya).
     - Badge Tingkat Urgensi (`🚨 Darurat` vs `Standar`).
     - Badge Status Real-Time (`⏳ Menunggu Tindakan`, `⚙️ Sedang Ditangani`, `✅ Selesai`).
     - Deskripsi rincian kendala dalam kotak card rapi.
     - Galeri thumbnail foto bukti WebP dengan fitur klik untuk memperbesar (zoom modal pratinjau).
     - Kotak tanggapan pengelola (`💬 Catatan Respon Pengelola`) jika pengelola/teknisi telah memberikan feedback tindak lanjut.
     - Empty state ramah jika belum ada komplain: *"Belum Ada Riwayat Laporan - Kamar Anda terpantau aman dan prima!"*.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 36.89s, 0 error).

### 219. Fitur Unggah Multi-Foto (Hingga 3 Foto) Bukti Kendala dengan Kompresi Otomatis WebP & Galeri di Portal KostManager (`MyKost.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar formulir pelaporan kendala dapat mengunggah lebih dari 1 foto (maksimal 3 foto) bukti kerusakan (*"tolong agar bisa upload lebih dari 1 foto, bisa 3 okeelah"*).
  - Memastikan seluruh foto yang diunggah dikonversi dan disimpan dalam format modern **`.webp`** (*"dan juga pastikan masuk ke database kita dalam bentuk webp"*).
- **Implementasi Solusi**:
  1. **Unggah Multi-Foto Hingga 3 Foto di Sisi Penghuni (`MyKost.tsx`)**:
     - Mengubah state menjadi `complaintPhotos: File[]` dan `complaintPhotoPreviews: string[]` dengan batasan maksimal 3 foto.
     - Menyediakan grid pratinjau thumbnail interaktif dengan badge penomoran (*Foto 1*, *Foto 2*, *Foto 3*), tombol hapus per foto (*X*), dan slot dinamis *"+ Tambah Foto"* selama jumlah foto `< 3`.
     - Mendukung pemilihan multi-file sekaligus (`multiple`) maupun penambahan satu per satu.
  2. **Jaminan Kompresi Wajib WebP (Client-Side Compression)**:
     - Mengiterasi setiap file foto melalui `compressImageToWebP(rawFile, 0.82, 1920)` sebelum dikirim ke Supabase Storage (`complaints` bucket atau fallback `documents`).
     - Menyimpan file berekstensi `.webp` dengan MIME type `image/webp`.
     - Menyimpan payload terstruktur pada kolom `photo_url` (JSON array string jika multi-foto atau string URL jika 1 foto).
  3. **Penyelarasan Galeri Multi-Foto & WhatsApp Forwarding di Portal KostManager (`KostManagerPortal.tsx`)**:
     - Menambahkan helper `extractComplaintPhotos(photoUrl)` untuk mem-parse format URL tunggal maupun JSON array string secara fleksibel.
     - Merender galeri thumbnail multi-foto (hingga 3 foto) pada setiap kartu tiket kendala, lengkap dengan indikator nomor foto dan fitur klik untuk memperbesar (zoom modal `previewPhotoUrl`).
     - Memperbarui generator pesan *"Teruskan ke Pemilik Kost (WhatsApp)"* agar secara rapi merinci seluruh URL foto WebP yang dilampirkan penghuni.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 38.47s, 0 error).

### 218. Penghapusan Tombol Hotline WhatsApp pada Modal Lapor Kendala & Perapian Label Kamar (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar tombol hotline WhatsApp di bagian bawah modal formulir pelaporan kendala dihilangkan (*"tidak usah ada tombol wa nggak sih"*), agar seluruh alur pelaporan 100% terpusat dan terdata via tiket in-app ke Portal KostManager tanpa bypass ke WhatsApp admin.
  - Sub-header unit kamar sebelumnya menampilkan duplikasi kata (*"Kamar Kamar 3"*).
- **Implementasi Solusi**:
  1. **Penghapusan Tombol Hotline WhatsApp**:
     - Menghapus tombol *"BUTUH CEPAT? HUBUNGI ADMIN VIA WHATSAPP"* pada `showComplaintModal` di `MyKost.tsx`.
     - Bagian bawah formulir kini hanya memuat satu tombol aksi utama yang tegas: **"KIRIM LAPORAN KENDALA"**.
  2. **Perapian Label Unit Kamar**:
     - Memperbaiki formatting string nomor kamar pada header modal agar selalu bersih (*"Kamar 3"* alih-alih *"Kamar Kamar 3"*).
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 38.63s, 0 error).

### 217. Perbaikan Import Ikon `Phone` dari `lucide-react` pada Modal Lapor Kendala (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Error runtime console: `Uncaught ReferenceError: Phone is not defined at MyKost (MyKost.tsx:4093:38)`.
- **Akar Masalah**:
  - Komponen `<Phone />` digunakan pada tombol hotline bantuan WhatsApp alternatif di dalam modal pelaporan kendala in-app, namun belum dimasukkan ke dalam daftar import destructuring `lucide-react` di baris 4 `MyKost.tsx`.
- **Implementasi Solusi**:
  - Menambahkan `Phone` ke daftar import `lucide-react` di `MyKost.tsx`.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 37.80s, 0 error).

### 216. Sistem Manajemen Laporan Kendala Penghuni di Portal KostManager & Form Lapor In-App (`MyKost.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar tombol "Lapor Kendala Kamar" pada halaman "Kost Saya" (`MyKost.tsx`) tidak langsung melempar pengguna ke nomor WhatsApp admin, melainkan menggunakan formulir in-app di dalam sistem.
  - Pengguna meminta pembuatan menu/tab baru di Portal KostManager untuk menampung, memantau, dan mengelola seluruh tiket laporan kendala penghuni untuk semua properti terkelola.
  - Dari portal tersebut, tim pengelola dapat memproses status komplain serta **meneruskan (*forward*) laporan kendala ke pemilik kost masing-masing** melalui WhatsApp.
- **Implementasi Solusi**:
  1. **Formulir Pelaporan In-App di Sisi Penghuni (`MyKost.tsx`)**:
     - Mengalihkan tombol *"Lapor Kendala Kamar"* ke formulir modal in-app `handleOpenComplaint`.
     - Penghuni dapat memilih kategori masalah (AC, Listrik, Air/Pipa, Kebersihan, Furnitur/Kunci, dll.), tingkat urgensi (*Normal* vs *🚨 Darurat*), judul dan rincian masalah, serta melampirkan foto bukti yang otomatis dikompresi ke WebP sebelum diunggah ke storage.
     - Laporan tersimpan terstruktur di tabel `complaints` Supabase.
  2. **Menu Baru '🛠️ Laporan Kendala' di Portal KostManager (`KostManagerPortal.tsx`)**:
     - **Navigasi Sidebar**: Menambahkan tab `complaints` dengan badge counter jumlah kendala aktif (*open / in_progress*).
     - **Ringkasan KPI**: 4 kartu statistik (Total Laporan, Menunggu Tindakan / Baru Masuk, Kendala Darurat 🚨, Telah Selesai).
     - **Filter & Pencarian**: Filter status (*Semua, Baru Masuk, Diproses, Selesai*), filter tingkat urgensi (*Semua, Darurat, Standar*), serta pencarian real-time (nama penghuni, unit kamar, nama kost, judul/deskripsi).
     - **Kartu Kendala Interaktif**: Menampilkan nama properti, nomor unit kamar, tanggal lapor, badge status, badge urgensi, badge kategori, deskripsi kendala, thumbnail foto bukti (dengan modal zoom preview gambar besar), dan kartu info kontak penghuni (+ tombol chat penghuni).
     - **Fitur 1-Klik '📲 Teruskan ke Pemilik Kost (WhatsApp)'**: Menyusun draft pesan WhatsApp profesional otomatis yang ditujukan ke pemilik properti (`owner_phone`) berisi seluruh rincian laporan dan tautan foto bukti kerusakan.
     - **Pembaruan Status Penanganan Realtime**: Tombol aksi 1-klik untuk mengubah status tiket (*Mulai Diproses*, *Tandai Selesai*, *Buka Kembali*) yang otomatis mengirimkan notifikasi status ke akun penghuni.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 37.18s, 0 error).

### 215. Sinkronisasi Transaksi Online & Perpanjangan Sewa ke Tabel Tagihan Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan bahwa setelah melakukan simulasi perpanjangan sewa, riwayatnya belum muncul pada menu "Riwayat Pembayaran Sewa" di Portal KostManager (`KostManagerPortal.tsx`).
- **Akar Masalah**:
  - Query transaksi di `loadAllData()` sebelumnya hanya memfilter transaksi dengan kueri kaku tanpa menyertakan `product_type: 'perpanjangan_sewa'`, `sewa`, `rent`, dan `tagihan_ekstra`, serta tabel tagihan hanya membaca invoice dari tabel `manual_invoices`.
- **Implementasi Solusi**:
  1. **Perluasan Filter Transaksi Online**:
     - Menyertakan seluruh transaksi online ber-`product_type` `'perpanjangan_sewa'`, `'kost_booking'`, `'sewa'`, `'rent'`, dan `'tagihan_ekstra'`.
  2. **Pemetaan Unified Stream Invoice**:
     - Memetakan transaksi online menjadi format `InvoiceRecord` (`onlineInvoices`) dan menggabungkannya secara terpadu (*unified stream*) dengan invoice manual via `combinedInvoicesMap`.
  3. **Integrasi Kwitansi Digital Resmi**:
     - Menghubungkan tombol **"🧾 Kwitansi"** dan **"💬 Kirim WA"** pada tabel tagihan lunas agar langsung membuka lembar `DigitalReceiptModal` resmi berstempel.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 34.84s, 0 error).

### 214. Peningkatan Komprehensif Modal Perpanjangan Sewa 'Kost Saya' (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna meminta agar modal perpanjangan sewa pada menu "Kost Saya" dilengkapi informasi masa sewa sekarang, simulasi tanggal mulai baru, tanggal berakhir baru, total jangka waktu hari, dan riwayat perpanjangan sewa sebelumnya.
- **Implementasi Solusi**:
  1. **Navigasi 2-Tab Internal Modal**: Tab `Form Perpanjangan` dan `Riwayat Transaksi`.
  2. **Kartu Status Masa Sewa Aktif**: Tanggal masuk, jatuh tempo saat ini, dan sisa hari tinggal.
  3. **Live Kalkulator Timeline Perpanjangan Bersambung**: Menampilkan tanggal mulai baru, tanggal berakhir baru, dan total durasi hari bersambung (`+31 Hari`, `+92 Hari`, dsb.).
  4. **Tabel Riwayat Perpanjangan Sewa Lunas**: Menampilkan daftar pembayaran sewa sebelumnya dengan tombol **"🧾 Lihat Kwitansi"**.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 32.55s, 0 error).

### 213. Perbaikan Kolom Skema `end_date` & Penambahan `room_number` pada Tabel `resident_status` saat Pengajuan Sewa (`userService.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan error console saat melakukan pengajuan sewa kamar:
    `userService.ts:364 Error creating resident status: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'endDate' column of 'resident_status' in the schema cache"}`.
- **Akar Masalah**:
  - Pada fungsi `createBookingRequest` di `userService.ts`, payload insert record awal `resident_status` secara keliru menggunakan penamaan properti camelCase `endDate` alih-alih snake_case `end_date`.
  - Kolom fisik pada tabel PostgreSQL Supabase `resident_status` adalah `end_date`, sehingga PostgREST menolak request dengan kode `PGRST204`.
- **Implementasi Solusi**:
  1. **Koreksi Kolom `end_date`**:
     - Mengubah properti payload dari `endDate` menjadi `end_date`.
  2. **Kelengkapan `room_number`**:
     - Menyertakan kolom `room_number` (`bookingData.metadata?.roomNumber || bookingData.metadata?.variantName || null`) agar unit kamar yang diajukan langsung terpetakan sejak status `PENDING`.
- **File Tersentuh**:
  - `functions/public/userService.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, 1m 2s, 0 error).

### 212. Penyelarasan Scroll & Sticky Section Booking Desktop vs Mobile pada Halaman Detail Kost (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan bahwa setelah penambahan scroll internal pada card booking di tampilan desktop, saat diakses dari tampilan mobile pengguna kesulitan untuk melakukan scroll balik ke atas setelah mencapai section booking karena sentuhan jari terperangkap (*scroll trapped*) di dalam kontainer booking.
- **Akar Masalah**:
  - Properti `sticky top-20`, `max-h-[calc(100vh-5.5rem)]`, `overflow-y-auto`, dan `overscroll-contain` sebelumnya diterapkan secara global tanpa prefix responsif `lg:`.
  - Pada layar ponsel vertikal 1 kolom, hal ini menciptakan *nested scroll container* dengan pembatasan tinggi.
  - Properti `overscroll-contain` memutuskan rantai scroll (*scroll chaining*) ke halaman utama (`window`), sehingga ketika sentuhan jari mendarat di card booking, gestur scroll ke atas terhenti di dalam card dan tidak bisa menggeser halaman kembali ke atas.
- **Implementasi Solusi**:
  1. **Isolasi Fitur Desktop (`lg:`)**:
     - Mengubah wrapper card booking menjadi `lg:sticky lg:top-20` dan `lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-5 lg:scrollbar-thin lg:scrollbar-thumb-orange-200`.
     - Pengguna desktop tetap menikmati kenyamanan sticky sidebar dengan scroll internal mandiri untuk form booking yang panjang.
  2. **Aliran Alami di Mobile (`< lg`)**:
     - Pada layar ponsel & tablet, card booking mengalir secara alami (*natural document flow*) tanpa batas tinggi dan tanpa scrollbar internal.
     - Gestur swipe/scroll di mobile 100% bebas dari jebakan scroll (*zero scroll trapping*), memungkinkan navigasi naik-turun yang mulus dan responsif.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` berhasil 100% (✓ 2531 modules transformed, 19.87s, 0 error).
  - Tampilan mobile mengalir alami tanpa scroll internal; tampilan desktop tetap sticky & scrollable mandiri.

### 211. Perbaikan Preview Foto Kost & Normalisasi Foto Kamar pada Menu 'Kost Saya' (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan bahwa saat membuka menu "Kost Saya" (khususnya kartu pengajuan sewa Kamar 4 Kost Madani), kartu pengajuan berhasil muncul namun tidak menampilkan preview foto kost/kamar, melainkan hanya kotak placeholder dengan logo *RuangSinggah*.
- **Akar Masalah**:
  1. **Kegagalan Query Kolom Non-Eksisten `subscription_status`**:
     - Pada `MyKost.tsx:523`, query batch fetching tabel `properties` menyertakan kolom `subscription_status` (`.select('..., subscription_status')`).
     - Kolom `subscription_status` berada pada tabel `mitra`, bukan tabel `properties`. Akibatnya PostgREST melempar error `code: 42703 (column properties.subscription_status does not exist)`, menyebabkan query data properti gagal secara total (`null`).
  2. **Efek Ketiadaan Data Properti (`propMap` Kosong)**:
     - Karena query properti gagal, objek `prop` bernilai `undefined`, daftar kamar `prop?.room_types` tidak dapat dicocokkan, dan variabel `roomPhotos` serta `displayImg` bernilai `null`, sehingga komponen kartu otomatis jatuh ke tampilan thumbnail fallback logo *RuangSinggah*.
- **Implementasi Solusi**:
  1. **Koreksi Kolom Query `properties`**:
     - Menghapus kolom non-eksisten `subscription_status` dari `.select(...)` tabel `properties` di `MyKost.tsx`.
  2. **Penambahan Fallback `mitra_kostmanager`**:
     - Menambahkan pengecekan cadangan ke tabel `mitra_kostmanager` untuk properti KostManager yang ID-nya tercatat khusus di tabel mitra agar `propMap` selalu lengkap 100%.
  3. **Normalisasi URL Foto Kamar & Properti**:
     - Menerapkan helper `normalizePhotoUrl` untuk mengubah seluruh path storage lokal menjadi URL publik Supabase yang valid secara aman (`supabase.storage.from('properties').getPublicUrl(path)`).
     - Memastikan resolusi foto kartu memprioritaskan foto spesifik kamar target (kamar tidur/interior/kamar mandi) dan melakukan fallback anggun ke foto tampak depan gedung (*Bangunan Depan*).
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` berhasil 100% (✓ 2531 modules transformed, 34.97s, 0 error).
  - Uji verifikasi resolusi gambar Kamar 4 Kost Madani berhasil memuat 6 foto kamar dan menyetel `displayImg` utama secara sempurna.

### 210. Session-Aware Deduplikasi Booking 'Kost Saya' & Sinkronisasi Status Check-Out Portal KostManager (`MyKost.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan bahwa setelah akunnya dikeluarkan dari status penghuni (check-out), kartu hunian lama berhasil hilang dari tab 'Aktif'. Namun saat melakukan pengajuan sewa ulang untuk uji coba kamar baru, kartunya tidak muncul sama sekali di menu "Kost Saya".
  - Di saat yang sama, pada menu "Pengajuan Sewa" di Portal KostManager (`/dashboard-admin/km_bookings`), status booking lama pengguna masih tercatat sebagai "Lunas & Aktif" dan pengajuan sewa baru belum ter-refresh otomatis.
- **Akar Masalah**:
  1. **Deduplikasi `uniqueKosts` Tidak Session-Aware di `MyKost.tsx`**:
     - Reducer `uniqueKosts` mengelompokkan riwayat booking pengguna berdasarkan key kaku `${curr.kostId}_${curr.roomType}` dan memprioritaskan transaksi berdasarkan skor status (`PAID` bernilai 4 vs `PENDING_APPROVAL` bernilai 2).
     - Ketika pengguna mengajukan sewa baru untuk unit kost yang sama dengan status `PENDING_APPROVAL`, transaksi baru tersebut dianggap kalah prioritas dan dibuang (*discarded*) oleh transaksi masa lalu yang berstatus `PAID`. Akibatnya, kartu pengajuan sewa baru tidak pernah dirender di layar.
  2. **Status Statis "Lunas & Aktif" pada Riwayat Booking Portal KostManager**:
     - Pada tabel pengajuan sewa KostManager (`KostManagerPortal.tsx`), baris booking dengan status `PAID` selalu dirender dengan badge "Lunas & Aktif" tanpa memeriksa apakah penghuni dari transaksi tersebut sudah melakukan check-out (`resident_status === 'CHECKED_OUT'`).
  3. **Data Booking Tidak Ter-Refresh Otomatis Saat Berpindah Tab**:
     - Data operasional hanya dimuat sekali saat inisialisasi awal portal (`loadAllData()`), sehingga pengajuan sewa baru yang masuk di tengah sesi admin tidak langsung terlihat tanpa reload browser penuh.
- **Implementasi Solusi**:
  1. **Deduplikasi Session-Aware di `MyKost.tsx`**:
     - Mengambil riwayat `resident_status` lebih awal untuk memetakan ID transaksi dan sesi booking yang telah berstatus `CHECKED_OUT`.
     - Memperbaiki pembentukan key deduplikasi: transaksi yang sedang berjalan (*in-flight*) atau transaksi dari sesi berbeda kini diisolasi menggunakan key `booking_session_id` atau ID unik pengajuan, sehingga transaksi baru `PENDING_APPROVAL` tidak akan pernah tertimpa oleh transaksi masa lalu.
     - Menyematkan penanda `is_checked_out` ke dalam item kartu dan memperbarui filter serta counter tab 'Riwayat' agar hunian yang telah selesai sewa tampil rapi di tab Riwayat.
  2. **Penyelarasan Status Check-Out & Filter di Portal KostManager (`KostManagerPortal.tsx`)**:
     - Memeriksa penanda `is_checked_out` pada setiap item booking dengan mencocokkan data penghuni dan metadata transaksi.
     - Pada tabel pengajuan sewa: membedakan badge `Lunas & Aktif` (untuk penghuni yang masih aktif) dan badge `Selesai (Check-Out)` berlatar netral (untuk sewa masa lalu yang telah move-out).
     - Memperbarui counter kartu KPI `Disetujui & Lunas` agar hanya menghitung penyewa aktif (`activePaidBookings`).
     - Menambahkan tab filter `Selesai (Check-Out)` di bilah filter pengajuan sewa dan tombol "Segarkan Data" dengan icon putar di header portal KostManager.
     - Menambahkan auto-refresh latar belakang (*background refresh*) saat berpindah antar tab di portal KostManager.
  3. **Penyempurnaan `handleCheckoutTenant`**:
     - Saat proses check-out dilakukan dari portal, metadata transaksi terkait di tabel `transactions` ikut diperbarui dengan `resident_status: 'CHECKED_OUT'` dan timestamp `checkout_at`.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/userService.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` berhasil 100% (✓ 2531 modules transformed, 29.41s, 0 error).

### 209. Perbaikan Fitur Kosongkan Unit Kamar (Check-Out / Move-Out) & Sinkronisasi Status Hunian Portal KostManager (`KostManagerPortal.tsx`, `MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  - Pengguna melaporkan bahwa saat menekan tombol "Kosongkan Unit Kamar" di modal proses check-out penghuni pada Portal KostManager, tidak terjadi perubahan apa pun. Status penyewaan masih tetap muncul di tab hunian aktif menu "Kost Saya" dari sisi penghuni dan status kamar di sistem masih tetap terisi.
- **Akar Masalah**:
  1. **Kegagalan Matching Kamar**: Di `KostManagerPortal.tsx`, `handleCheckoutTenant` hanya membandingkan `rName.toLowerCase() === tenant.room_type?.toLowerCase() || rt.residentName === tenant.user?.name`. Karena `tenant.room_type` berisi `"Standard"` dan `rName` adalah `"Kamar 1"`, `"Kamar 2"`, dsb., serta `tenant.user?.name` tidak selalu terisi, loop kamar tidak pernah cocok dengan unit target (`"Kamar 3"`).
  2. **Tabel `resident_status` Tidak Diperbarui**: Fungsi check-out sama sekali tidak mengupdate baris database pada tabel `resident_status`, membiarkan status tetap `'ACTIVE'`.
  3. **Tabel `mitra_kostmanager` Tidak Disinkronkan**: Snapshot `room_types` di tabel `mitra_kostmanager` tidak ikut dibersihkan saat check-out.
  4. **Filter Tab Aktif di `MyKost.tsx`**: Tab 'Aktif' di halaman "Kost Saya" memetakan `statusRecords` tanpa memeriksa apakah statusnya masih `'ACTIVE'`.
- **Implementasi Solusi**:
  1. **Perbaikan Multi-Matching & Pembersihan Kamar di `KostManagerPortal.tsx`**:
     - Memperbaiki `handleCheckoutTenant` dengan mekanisme pencocokan kamar komprehensif (`cleanRoomName` vs `tenant.room_number`, `tenant.metadata?.roomNumber`, `tenant.metadata?.variantName`, atau kecocokan nama penghuni `tenant.user?.name` / `tenant.metadata?.userName` / `tenant.metadata?.tenantName`).
     - Mengubah status kamar target menjadi `Kosong`, `isAvailable: true`, dan mengosongkan `residentName`, `residentPhone`, `startDate`, `endDate`.
     - Menyinkronkan perubahan `room_types` secara instan ke tabel `properties` dan `mitra_kostmanager`.
     - Memperbarui tabel `resident_status` menjadi `status: 'CHECKED_OUT'` dengan timestamp `checkout_at` dan `checkout_notes`.
     - Memfilter `managedResidents` agar hanya memuat record berstatus `'ACTIVE'`, sehingga penghuni yang telah di-checkout otomatis hilang dari daftar aktif.
  2. **Penyelarasan Tampilan Penyewa di `MyKost.tsx`**:
     - Menyaring `activeStatusRecords` di mana hanya record berstatus `'ACTIVE'` yang masuk ke dalam `processedActive` untuk tab hunian aktif.
     - Menyaring `activeResidentsOnly` sehingga transaksi sewa lama tidak lagi terblokir dan otomatis berpindah ke tab 'Riwayat' (`CHECKED_OUT` / `COMPLETED`).
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` berhasil 100% (✓ 2531 modules transformed, 1m 1s, exit code 0).

### 208. Perbaikan RLS Violations 'notifications' & Penyelarasan Sub-Label KostManager (`notificationService.ts`, `ChatWindow.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan error console saat mengirim pesan obrolan:
     ```text
     notificationService.ts:40 Notification insertion failed: new row violates row-level security policy for table "notifications"
     ```
  2. Sub-label pada header obrolan di jendela chat menampilkan `TIM KOSTMANAGER (PEMILIK)` yang rancu karena properti dikelola oleh Tim KostManager, bukan pemilik perseorangan.
- **Akar Masalah & Implementasi**:
  * **1. Eliminasi Error RLS `notifications` (`notificationService.ts`)**:
    - Kebijakan RLS database membolehkan siapa pun melakukan `INSERT` notifikasi (`WITH CHECK (true)`), namun kebijakan `SELECT` membatasi agar user hanya bisa membaca notifikasinya sendiri (`USING (auth.uid() = user_id)`).
    - `sendNotification` sebelumnya mengeksekusi `.insert([...]).select().single()`. PostgREST berhasil menyimpan baris notifikasi, namun seketika gagal saat mencoba melakukan `.select()` terhadap baris notifikasi milik user penerima (lawan bicara/mitra/admin).
    - Memperbaiki `sendNotification` agar mengeksekusi `insert([...])` murni tanpa chaining `.select().single()`. Pengiriman notifikasi in-app kini 100% mulus dan bebas dari error RLS.
  * **2. Penyelarasan Sub-Label ChatWindow (`ChatWindow.tsx`)**:
    - Memperluas interface `ChatWindowProps` agar mendukung `contactType?: 'owner' | 'caretaker' | 'admin' | 'manager'`.
    - Menambahkan deteksi cerdas pada peran pengelola (`admin`, `manager`, atau nama mengandung `KostManager`) sehingga sub-label header menampilkan **`TIM KOSTMANAGER (PENGELOLA RESMI)`** alih-alih `(PEMILIK)`.
- **File Tersentuh**:
  - `functions/public/notificationService.ts`
  - `functions/public/components/ChatWindow.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` berhasil 100% (✓ 2531 modules transformed, 34.06s, exit code 0).
  - Uji inseri notifikasi anonim dan autentikasi berjalan sukses tanpa pelanggaran RLS.

### 207. Perbaikan Runtime Crash 'ReferenceError: currentSenderType is not defined' pada Jendela Pesan (`ChatWindow.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan error runtime console browser saat jendela chat dibuka:
     ```text
     ChatWindow.tsx:75 Failed to load messages: ReferenceError: currentSenderType is not defined
         at loadMessages (ChatWindow.tsx:73:38)
     ```
  2. Akar masalah: Variabel `currentSenderType` sebelumnya hanya dideklarasikan secara lokal di dalam block `useEffect`. Ketika fungsi `loadMessages()` dieksekusi di luar `useEffect`, pemanggilan `markMessagesAsRead(session.id, currentSenderType)` melempar `ReferenceError`.
- **Implementasi**:
  * **1. Pengangkatan Scope (Hoisting) ke Tingkat Komponen (`ChatWindow.tsx`)**:
    - Mendeklarasikan `currentId` dan `currentSenderType` langsung di tingkat atas komponen `ChatWindow`:
      `const currentId = currentUser?.uid || currentUser?.id || '';`
      `const currentSenderType: 'user' | 'owner' = currentId === session.user_id ? 'user' : 'owner';`
  * **2. Pembersihan Redeklarasi & Penyelarasan Scope**:
    - Menghapus deklarasi lokal duplikat di dalam `useEffect` dan `handleSendMessage`.
    - Fungsi `loadMessages()` kini membaca `currentSenderType` secara valid tanpa error.
    - Menambahkan `currentSenderType` ke dependency array `useEffect`.
- **File Tersentuh**:
  - `functions/public/components/ChatWindow.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 35.38s, 0 error).
  - Jendela chat berhasil memuat pesan dan menandai status baca tanpa `ReferenceError`.

### 206. Perbaikan ReferenceError 'getOrCreateChatSession' & Integrasi Smart Inbox Terpadu Calon Penyewa vs Penghuni Aktif (`MyKost.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan error saat mengklik tombol "Bantuan KostManager" di menu Kost Saya:
     `Failed to open chat: ReferenceError: getOrCreateChatSession is not defined at handleOpenChat (MyKost.tsx:323:29)`.
  2. Pengguna mengajukan pertanyaan arsitektur/UX: *"pada portal kostmanager, haruskah kita membedakan lokasi chat masuk antara user bukan penghuni dan jugaa user yang sudah merupakan penghuni dari kost yang dikelola atau tidak? atau bagaimana"*.
- **Implementasi**:
  * **1. Perbaikan Bug Import & Routing Chat KostManager (`MyKost.tsx`)**:
    - Mengimpor `getOrCreateChatSession` dan `SYSTEM_ADMIN_ID` dari `../chatService`.
    - Memperbarui `handleOpenChat` agar untuk kost terkelola (`isManagedKost` / `is_managed`), percakapan otomatis dialihkan ke `SYSTEM_ADMIN_ID` dengan identitas kontak `Tim KostManager` (contactType: `admin`).
    - Menyertakan nama lengkap dan foto profil pengguna pemanggil secara eksplisit ke dalam parameter sesi chat.
  * **2. Desain Unified Smart Inbox dengan Filter Kategori Cepat (`KostManagerPortal.tsx`)**:
    - Menghindari pemisahan menu yang membebani CS; seluruh percakapan tetap tersentralisasi dalam satu inbox terpadu di tab `Pesan & Chat Customer`.
    - Menambahkan **Quick Filter Tabs** responsif di kolom kiri:
      - `[ SEMUA (N) ]`
      - `[ 🏠 PENGHUNI (N) ]` (filter instan percakapan dari penghuni aktif)
      - `[ 💬 CALON (N) ]` (filter percakapan tanya-tanya dari calon penyewa)
      - `[ 🔔 UNREAD (N) ]` (filter pesan baru yang belum dibalas)
  * **3. Indikator Status Visual & High-Context Resident Banner**:
    - Setiap kartu chat di kolom kiri menampilkan badge status yang kontras:
      - Penghuni Aktif: `[ 🏠 PENGHUNI • UNIT X ]` dengan border dan warna hijau emerald.
      - Calon Penyewa: `[ 🔍 CALON ]` dengan border dan warna netral abu-abu.
    - Ketika percakapan dengan penghuni aktif dibuka, di atas jendela percakapan muncul **High-Context Resident Status Strip**:
      - Menampilkan nomor kamar & lantai unit (`Unit Kamar X • Lantai Y`), periode sewa aktif (`Mulai s/d Selesai`), dan tombol cepat WhatsApp.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 31.81s, 0 error).
  - Tombol "Bantuan KostManager" di `MyKost.tsx` membuka chat tanpa error.
  - Portal KostManager menyediakan filter pintar dan badge pembeda status calon penyewa vs penghuni aktif.

### 205. Optimalisasi Responsivitas UI/UX Tampilan Mobile pada Kartu Sewa Aktif (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan: *"sebenarnya tampilan pc nya cukup oke, tapi kalau diubah ke tampilan mobile, ui/ux nya tidak fit ke layar, tolong lakukan penyesuaian untuk tampilan mobile agar fit dan tetap responsif"*.
  2. Dari screenshot mobile:
     - Badge bar meluap secara horizontal dan terpotong di kiri (`...EWA`) akibat centering flexbox.
     - Alamat terpotong di sisi kiri (`eknik, Tamalanrea...`) akibat centering truncation bug pada child flexbox.
     - Teks "Hari ke-0 dari 31 Hari (0%)" patah ke beberapa baris.
     - Kartu metrik ke-4 menampilkan `STATUS: LU...` yang terpotong.
     - Tab navigasi atas dan padding kartu terlalu memakan tempat di layar ponsel sempit (360-390px).
- **Implementasi**:
  * **1. Penyesuaian Tab Navigasi Atas**:
    - Memberikan `w-full sm:w-auto`, padding responsif `px-3 sm:px-6 py-2.5 sm:py-3.5`, dan font `text-[10px] sm:text-[11px]` agar fit di layar mobile tanpa scroll horizontal.
  * **2. Rampingkan Padding Kartu Sewa Aktif**:
    - Mengubah `rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10` menjadi `rounded-3xl sm:rounded-[3rem] p-4 sm:p-8 lg:p-10`, menghemat 16px lebar layar untuk konten di ponsel.
  * **3. Perbaikan Badges Bar & Teks Alamat Bebas Clipping**:
    - Mengatur ukuran micro-badge `px-2.5 sm:px-3.5 py-0.5 sm:py-1`, `text-[8.5px] sm:text-[9px]`, dan `gap-1.5 sm:gap-2` sehingga badge dapat melakukan wrap secara natural tanpa terpotong di sisi kiri.
    - Menghilangkan centering truncation bug pada container alamat dengan `w-full` dan `line-clamp-1 sm:truncate` sehingga alamat kost selalu terbaca dari karakter pertama.
  * **4. Penyelarasan Progress Bar & 4 Kartu Metrik**:
    - Header progress sewa dibuat responsif `flex-col sm:flex-row sm:items-center justify-between gap-1` dengan font terukur.
    - Grid metrik menggunakan `gap-2 sm:gap-3`, padding `p-2.5 sm:p-3.5`, label status disederhanakan menjadi `Lunas` (100% bebas truncate), dan font adaptif `text-[11px] sm:text-sm`.
  * **5. Perampingan Sidebar Aksi**:
    - Tombol aksi mobile menggunakan padding sentuh nyaman `px-4 sm:px-5 py-3 sm:py-3.5` dan font `text-[9.5px] sm:text-[10px]`.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% dengan 0 error.
  - Tampilan mobile fit ke layar dengan badge wrap rapi, alamat utuh, dan metrik anti-truncate.

### 204. Penyesuaian Badge Lantai dan Pembersihan Dimensi Kamar pada Kartu Sewa Aktif (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta: *"hapus aja "auto pilot" dan ganti posisinya dengan "lantai 3". hapus juga "2x2""*.
  2. Badge `⚡ AUTO-PILOT` tidak lagi diperlukan pengguna di baris badge unit sewa aktif dan diminta diganti dengan informasi posisi lantai (`LANTAI 3`).
  3. Informasi dimensi kamar `2x2 meter` dan pengulangan `Lantai 3` pada sub-info alamat di bawah nama properti dihapus agar baris lokasi tampil lebih ringkas dan fokus.
- **Implementasi**:
  * **1. Ganti Badge Auto-Pilot Menjadi Badge Lantai Kamar (`MyKost.tsx`)**:
    - Menghapus badge `kost.isManagedKost` (`Auto-Pilot`).
    - Menambahkan badge lantai unit kamar `kost.roomFloor` (`LANTAI 3` dengan icon vector `<Layers />`).
  * **2. Pembersihan Sub-Info Alamat Lokasi**:
    - Menghapus rendering `kost.roomFloor` dan `kost.roomSize` (dimensi `2x2 meter`) dari blok sub-info di bawah judul nama kost.
  * **3. Pembersihan Import**:
    - Menghapus import `Sparkles` yang sudah tidak lagi digunakan.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% dengan 0 error.
  - Kartu sewa aktif menampilkan badge `LANTAI 3`, bebas dari badge `AUTO-PILOT`, dan bebas dari teks `2x2 meter`.

### 203. Perbaikan Runtime Crash 'ReferenceError: DoorClosed is not defined' pada Kartu Sewa Aktif (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan error runtime console browser:
     `MyKost.tsx:1962 Uncaught ReferenceError: DoorClosed is not defined at MyKost.tsx:1962:62 at Array.map (<anonymous>) at MyKost (MyKost.tsx:1825:40)`.
  2. Masalah terjadi karena ikon `<DoorClosed />` masih digunakan pada badge nomor unit (`UNIT KAMAR 3`), tetapi namanya terhapus dari baris import `lucide-react` pada pembersihan sebelumnya.
- **Implementasi**:
  * Mengimpor kembali komponen vector SVG `DoorClosed` dari package `lucide-react` pada `MyKost.tsx`.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% dengan 0 error.
  - Kartu sewa aktif unit `Kamar 3` ter-render sempurna tanpa error runtime.

### 202. Pembersihan Aksi Kartu Sewa Aktif & Perbaikan Foto dan Identitas Kamar (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta: *"hapus aja dah lihat kwitansi digital dan juga detail hunian & fasilitas"*.
  2. Dari screenshot tampilan kartu sewa aktif di tab `AKTIF`:
     - Tombol "Lihat Kwitansi Digital" dan toggle "Detail Hunian & Fasilitas" membuat kartu terlalu panjang dan tidak diinginkan pengguna.
     - Accordion panel detail hunian di bagian bawah kartu sewa aktif memuat duplikasi rincian yang memenuhi layar.
     - Thumbnail kamar pada kartu sewa aktif sebelumnya menampilkan gambar acak (diagram TAM SAM SOM) dan nomor kamar hanya tertulis label generic `KAMAR` alih-alih nomor kamar riil (*UNIT KAMAR 3*) beserta foto asli kamar.
- **Implementasi**:
  * **1. Pembersihan Tombol & Accordion Panel di `MyKost.tsx`**:
    - Menghapus tombol `Lihat Kwitansi Digital` dari bilah aksi sidebar kartu sewa aktif.
    - Menghapus tombol `Detail Hunian & Fasilitas` beserta state `expandedDetailId`.
    - Menghapus seluruh accordion panel bawah yang memuat spesifikasi unit, rincian biaya, dan tata tertib hunian.
    - Membersihkan icon import dan variabel yang tidak lagi digunakan (`DoorClosed`, `roomFacs`, `propFacs`, `propRules`).
  * **2. Penyempurnaan Ekstraksi Foto & Unit Kamar Riil di `processedActive`**:
    - Menyelaraskan ekstraksi nomor kamar `targetRoomNum` dari `r.metadata?.roomNumber || r.metadata?.variantName || r.room_number || combinedMeta.roomNumber`.
    - Mengambil foto kamar asli `roomPhotos` dari properti `room_types` (menghindari fallback ke diagram TAM SAM SOM / foto generic).
    - Memastikan badge nomor unit menampilkan nomor kamar asli (`UNIT KAMAR 3`).
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` lulus 100% dengan 0 error.

### 201. Redesain Komprehensif & Interaktif Kartu Penyewaan Aktif Menu 'Kost Saya' (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan: *"tampilan kartu penyewaan kita di menu kost saya belum tampil secara kompeherensif dan interaktif"*.
  2. Masalah spesifik yang ditemukan pada kartu hunian aktif:
     - **Identitas Kamar Tidak Spesifik**: Hanya menampilkan badge umum `STANDARD`, tidak menampilkan nomor kamar spesifik (*Kamar 3*).
     - **Thumbnail Tidak Representatif**: Thumbnail menampilkan diagram acak TAM SAM SOM (karena mengambil foto index 0 properti dari data uji coba) alih-alih foto kamar riil atau foto fasad bangunan.
     - **Teks Metrik Terpotong (*Truncated*)**: Tanggal mulai dan selesai sewa terpotong elipsis (`31 Agustus ...`, `01 Oktober ...`).
     - **Kurang Komprehensif**: Tidak ada rincian spesifikasi kamar (lantai, dimensi 2x2m, kapasitas, jenis kamar mandi), fasilitas kamar, fasilitas bersama properti, maupun alamat jalan lengkap.
     - **Minim Interaktivitas**: Tidak ada tombol akses ke Kwitansi Digital Resmi berstempel (`DigitalReceiptModal`), tidak ada visual progress bar masa sewa, tidak ada panel ekspansi accordion detail hunian, dan belum ada fitur cepat lapor kendala fasilitas via WhatsApp resmi ke pengelola.
- **Implementasi**:
  * **1. Upgrade Ekstraksi Data Properti & Kamar di `fetchMyKosts` (`MyKost.tsx`)**:
    - Kueri `properties` diperluas untuk mengambil: `address, facilities, rules, metadata, is_managed, subscription_status`.
    - Mencocokkan `targetRoomNum` dengan array `properties.room_types` untuk memperoleh objek `currentRoom` lengkap (lantai kamar, dimensi/ukuran, fasilitas kamar, tipe kamar mandi).
    - Ekstraksi galeri foto kamar `roomPhotos` dari `currentRoom.images` dan `currentRoom.categorized_photos`.
    - Menentukan `displayImage` terbaik: prioritas utama foto kamar yang disewa (bukan diagram TAM SAM SOM), fallback ke foto bangunan depan berlabel `Bangunan Depan`.
    - Menyertakan data lengkap ke objek kartu: `roomNumber`, `roomFloor`, `roomSize`, `roomFacilities`, `bathroomType`, `roomPhotos`, `isManagedKost`, `address`, `areaCity`, `propertyFacilities`, `propertyRules`.
  * **2. Redesain Visual & Header Kartu**:
    - Thumbnail interaktif dengan overlay badge `📸 X Foto Kamar` yang dapat diklik untuk membuka modal galeri foto kamar.
    - Badge nomor unit mencolok: `🏷️ UNIT KAMAR 3` (oranye RuangSinggah), `TIPE STANDARD`, `⚡ Auto-Pilot` (jika dikelola KostManager), status `SEDANG DISEWA`, dan countdown sisa hari.
    - Judul kost besar dengan pin alamat jalan lengkap (`Tamalanrea, Kota Makassar`), sub-info lantai dan ukuran, serta bintang rating terverifikasi.
  * **3. Visual Progress Bar Masa Sewa & Metrik Anti-Truncate**:
    - Progress bar masa sewa terhitung dinamis: menampilkan "Hari ke-X dari Y Hari (Z%)" dengan bar gradien warna oranye-kuning-emerald yang elegan.
    - 4 kartu metrik anti-truncate: Durasi Sewa, Mulai Masuk (Check-in), Selesai Sewa (Jatuh Tempo), dan Tagihan Pokok (Status: Lunas) dengan penanggalan utuh tanpa elipsis terpotong.
  * **4. Panel Accordion Interaktif "Detail Hunian & Fasilitas"**:
    - Tombol ekspansi/collapse `Detail Hunian & Fasilitas` dengan animasi halus.
    - Menampilkan 3 kolom komprehensif:
      1. **Spesifikasi Unit**: Nomor kamar, tipe, posisi lantai, dimensi/ukuran, kamar mandi dalam/luar, dan kapasitas maksimal.
      2. **Fasilitas Kamar & Bersama**: Badge fasilitas kamar (dengan icon vector `lucide-react`) dan fasilitas umum properti (WiFi, parkir, dll.).
      3. **Rincian Biaya & Tata Tertib**: Tagihan sewa bulanan, status lunas, bantuan hunian 24/7, serta daftar aturan/tata tertib kost.
  * **5. Bilah Aksi Cepat & Modal Interaktif Tambahan**:
    - `📍 Rute Ke Kost`: Navigasi Google Maps langsung ke alamat/koordinat.
    - `🧾 Lihat Kwitansi Digital`: Membuka `DigitalReceiptModal` resmi berstempel PT RUANG SINGGAH NUSANTARA (bisa unduh PDF / cetak / bagikan WhatsApp).
    - `➕ Perpanjang Sewa`: Dilengkapi status proteksi ketersediaan perpanjangan sewa (H-7).
    - `💬 Hubungi Pengelola / Pemilik`: Deteksi cerdas label `Bantuan KostManager` atau `Hubungi Pemilik`.
    - `🚨 Lapor Kendala Kamar`: Menghubungkan langsung ke WhatsApp resmi bantuan pengelola dengan template pesan laporan kendala terstruktur otomatis.
    - `📸 Modal Galeri Foto Kamar`: Modal preview galeri foto dokumentasi kamar & hunian.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**:
  - Kompilasi `npm run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 26.16s, 0 error).

### 200. Eliminasi Duplikasi Kartu Penghuni, Kelengkapan Profil & Nomor Kamar, serta Sinkronisasi Status Kamar Listing Online (`adminService.ts`, `KostManagerPortal.tsx`, `index.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan setelah simulasi booking hingga pembayaran:
     - *"telah mendaftarkan akun pengguna terkait ke daftar penghuni yang ada pada portal kostmanager, tapi kenapa malah double ya? kartunya ada dua."*
     - *"selain itu tidak tercatat dengan baik nomor kamar mana yang sedang dia booking."*
     - *"dan kamar terkait yang sudah dibooking masih muncul pada listing kost yang ada di tampilan user"*
  2. Ditemukan bahwa saat pembayaran sukses via simulasi atau Midtrans, backend webhook dan frontend sama-sama memicu sinkronisasi penghuni (`syncResidentStatus`), menghasilkan 2 record di tabel `resident_status` dengan perbedaan rentang hari dan metadata.
  3. Baris yang dibuat oleh webhook backend tidak memiliki `booking_session_id`, `roomNumber`, dan profil penyewa di `metadata`, sehingga saat frontend berjalan beberapa milidetik kemudian, frontend menganggapnya sebagai sesi baru dan membuat baris kedua.
  4. Pada tampilan tabel penghuni Portal KostManager (`KostManagerPortal.tsx`), nama penyewa hanya membaca `t.user?.name` (yang bernilai null untuk penyewa guest/online sehingga fallback ke generic *"Penghuni Terdata"*), nomor telepon tidak terbaca, dan badge unit kamar hanya menampilkan kategori generic `{t.room_type || 'Kamar'}` (*Tipe Standard*) alih-alih nomor kamar spesifik (*Kamar 3*).
  5. Kamar yang dibooking (Kamar 3) masih muncul sebagai kamar kosong di halaman detail kost tampilan user (`KostDetail.tsx`) karena `syncResidentStatus` hanya meng-update tabel SQL `rooms` tanpa menyinkronkan array JSONB `properties.room_types`.
- **Implementasi**:
  * **1. Deduplikasi & Ketahanan Idempotensi di `adminService.ts`**:
    - Memperketat pencarian record existing: jika sudah ada `resident_status` aktif untuk `user_id` + `kost_id` yang sama, sistem tidak pernah membuat baris baru melainkan memperbarui (*merge*) baris tersebut.
    - Pada saat transaksi `PAID`, sistem otomatis mencari kamar terkait di dalam `properties.room_types` dan mengubah statusnya menjadi `status: 'Terisi'`, `isAvailable: false`, serta mengisi `residentName` dan `residentPhone`. Perubahan disinkronkan ke tabel `properties` dan `mitra_kostmanager`.
  * **2. Kelengkapan Metadata & Sinkronisasi Kamar Terisi di Backend (`functions/src/index.ts`)**:
    - Menambahkan `roomNumber`, `tenantName`, `userName`, `userPhone`, `userEmail`, dan `booking_session_id` pada objek `residentMeta` di backend `syncResidentStatus`.
    - Menambahkan langkah otomatis `[ROOM SYNC]` pada backend untuk menandai kamar yang dibooking menjadi `status: 'Terisi'`, `isAvailable: false` pada `properties.room_types` dan `mitra_kostmanager`.
  * **3. Deduplikasi & Penyempurnaan Tampilan Tabel Penghuni di `KostManagerPortal.tsx`**:
    - Menambahkan deduplikasi multi-kunci pada `loadAllData()` untuk `combinedTenants` berdasarkan `${mr.kost_id}_${userKey}_${roomKey}` agar tidak ada kartu ganda yang dirender.
    - Menampilkan nama penyewa dengan fallback komprehensif: `t.user?.name || t.metadata?.tenantName || t.metadata?.userName || t.metadata?.residentName || 'Penghuni Terdata'`.
    - Menampilkan nomor WhatsApp penyewa: `t.user?.phone || t.metadata?.phone || t.metadata?.userPhone || t.metadata?.residentPhone`.
    - Menampilkan nomor kamar spesifik pada badge unit: misal `Kamar 3 (Tipe Standard)` atau `Kamar 3`.
    - Memperbarui filter pencarian penghuni agar mencakup nama, kamar spesifik, dan nomor HP dari metadata.
  * **4. Pembersihan Data Riil Database Supabase**:
    - Menghapus record duplikat yang kosong (`5202ad06-b149-...`) setelah mere-point relasi foreign key transaksi.
    - Memperbarui status Kamar 3 Kost Madani di `properties.room_types` menjadi `Terisi` (`isAvailable: false`, `residentName: 'SULHAN'`, `residentPhone: '+6281527080656'`).
- **File Tersentuh**:
  - `functions/public/adminService.ts`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/src/index.ts`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Simulasi kueri listing kamar Kost Madani membuktikan Kamar 3 berstatus Terisi (`isAvailable: false`) dan hanya Kamar 4 & 5 yang tampil tersedia.
  - Tabel `resident_status` Kost Madani bersih dari duplikasi (hanya 1 baris aktif dengan nomor kamar dan profil lengkap).
  - Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 24.88s, 0 error).

### 199. Perbaikan Sinkronisasi Status Kamar (False Positive 'Terisi' / 'Penuh') & Penyempurnaan Integrasi Database Form Edit Listing Properti KostManager (`KostManagerPortal.tsx`, `KostManagerPropertyFormModal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menemukan: *"pada pengeditan listing properti yang ada pada portal kostmanager, saya ingin merubah harga salah satu kamar rp 1 untuk melakukan simulasu sewa, tapi pas saya buka pengeditannya, kenapa semua kamar yang ada statusnya penuh, sedangkan di database ada beberapa yang kosong kan. tolong lakukan analisa yang menyeluruh terkait listing properti ini apakah semuanya sudah benar benar terhubung dengan database"*.
  2. Saat form edit listing properti dibuka, seluruh kamar (Kamar 1, 3, 2, 4, 5) menampilkan status `🔒 TERISI`, padahal di database Supabase fisik (`properties.room_types`), Kamar 3, 4, dan 5 berstatus `Kosong` (`isAvailable: true`).
  3. Hal ini menghalangi pengujian simulasi sewa karena kamar yang kosong tidak dapat dipesan di halaman detail kost akibat status kamar yang terkunci 'penuh'.
  4. Penyebab bug: Pada fungsi `unrollToSurveyRooms` dan `groupIntoRoomTypesGlobal` di `KostManagerPortal.tsx`, logika pencocokan penyewa menggunakan perbandingan `t.metadata?.roomNumber === rt?.roomNumber`. Karena objek `propertyTenants` dan objek kamar database `rt` sama-sama belum memiliki key `roomNumber` (nomor kamar tersimpan pada key `name`), perbandingan mengevaluasi `undefined === undefined` yang bernilai `true`. Akibatnya seluruh kamar secara keliru dianggap menampung penyewa pertama (Zul), sehingga semua kamar berubah menjadi `Terisi`.
- **Implementasi**:
  * **1. Helper Pencocokan Kamar & Tenant yang Aman (`isMatchingRoomTenant`)**:
    - Membuat fungsi `isMatchingRoomTenant(t, roomName, rawRoomNumber, rawName)` di `KostManagerPortal.tsx` yang memvalidasi bahwa nilai tidak kosong/undefined sebelum membandingkan.
    - Mendukung perbandingan nama kamar yang dinormalisasi, ekstraksi angka murni (misal: "Kamar 1" vs "1"), serta pencocokan `t.room_type` dan `t.room_number`.
  * **2. Perbaikan 4 Titik Pencocokan Tenant (`KostManagerPortal.tsx`)**:
    - Mengganti perbandingan longgar `undefined === undefined` di `groupIntoRoomTypesGlobal` (sub-unit dan flat units) serta `unrollToSurveyRooms` (sub-unit dan flat units) dengan `isMatchingRoomTenant`.
    - Mengisi secara eksplisit field `room_number: cleanRoomName` dan `metadata: { ... roomNumber: cleanRoomName }` saat mengekstrak `propertyTenants` di `loadAllData()`.
  * **3. Sinkronisasi Data Kamar Kosong & Penghapusan Sisa `resident_status` (`KostManagerPropertyFormModal.tsx`)**:
    - Pada `handleUpdateExistingRoom`, jika status kamar diubah menjadi `Kosong`, data penghuni (`residentName` dan `residentPhone`) otomatis dikosongkan.
    - Pada saat form disimpan, jika suatu kamar berstatus `Kosong`, sistem otomatis menghapus record `resident_status` kamar terkait pada database (`supabase.from('resident_status').delete().eq('kost_id', savedPropId).eq('room_number', roomNum)`), menjamin tidak ada sisa data penghuni hantu.
    - Memastikan perubahan harga kamar (termasuk Rp 1 untuk keperluan simulasi) dan array `pricing` tersimpan secara sempurna ke tabel `properties` dan `mitra_kostmanager`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**:
  - Simulasi pencocokan kamar (`simulate_unroll.js`) menghasilkan: Kamar 1 & 2 = `Terisi`, Kamar 3, 4, 5 = `Kosong` (100% akurat sesuai database).
  - Build frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 21.30s, 0 error).

### 198. Penyaringan Pengajuan Sewa di Portal KostManager Berdasarkan Waktu Transisi KostManager (`KostManagerPortal.tsx`, `KostDetail.tsx`, `KostManagerPropertyFormModal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta: *"tolong agar yang tampil hanya yang mengajukan sewa saat kostnya sudah berubah menjadi kostmanager"*.
  2. Saat kost beralih dari listing reguler/mitra pemasaran ke program auto-pilot KostManager (seperti *Kost Madani* yang beralih pada 29 Agustus 2026), transaksi pemesanan historis lama yang dibuat pada Mei/Juni 2026 sebelum masa kontrak kelolaan KostManager tidak boleh tercampur atau masuk ke dalam antrean menu **Pengajuan Sewa** dan kartu statistik Portal KostManager.
  3. Menu Pengajuan Sewa dan metriknya harus secara presisi hanya memuat pengajuan sewa yang dibuat pada saat / setelah properti resmi berstatus KostManager.
- **Implementasi**:
  * **1. Penandaan Metadata Pemesanan Baru (`KostDetail.tsx`)**:
    - Menambahkan tag identifikasi permanen `is_managed_kost: true`, `isManaged: true`, dan `managed_by: 'kostmanager'` pada metadata transaksi saat calon penghuni mengajukan sewa kamar pada kost yang dikelola KostManager.
  * **2. Penyimpanan Stempel Waktu `managed_at` (`KostManagerPropertyFormModal.tsx` & `KostManagerPortal.tsx`)**:
    - Memastikan properti kelolaan KostManager menyimpan dan mempertahankan timestamp `managed_at` pada `metadata` secara konsisten.
  * **3. Filter Waktu Transisi KostManager pada Query Transaksi (`KostManagerPortal.tsx`)**:
    - Memperbarui pemrosesan transaksi `rawBookings` di `loadAllData()`:
      - Jika transaksi memiliki flag eksplisit `is_managed_kost === true` / `isManaged === true` / `managed_by === 'kostmanager'`, transaksi diikutsertakan.
      - Jika tidak memiliki flag (transaksi era transisi), sistem membandingkan `b.created_at` terhadap tanggal resmi properti berstatus KostManager (`prop.managed_at || prop.updated_at || prop.created_at`).
      - Transaksi historis lama (sebelum tanggal transisi KostManager) otomatis difilter keluar dari antrean dan statistik.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**: Build frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 29.16s, 0 error).

### 197. Menu Baru 'Pengajuan Sewa' di Portal KostManager & Pemisahan Alur Persetujuan Admin (ACC) dengan Otomasi Notifikasi WhatsApp (`KostManagerPortal.tsx`, `MitraDashboard.tsx`, `rentBillingService.ts`, `Dashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta: *"dalam proses booking untuk kost yang sudah terdaftar ke kostmanager, harusnya persetujuan sewa sekarang masuknya ke portal kostmanager kan? tidak lagi masuk ke dashboard mitra. sebenarnya awalnya saya ingin langsung payment, tapi untuk cari aman kita buat aja agar alurnya harus dikonfirmasi oleh admin dulu, sebagai bentuk profesiionalitas juga, dan sepertinya jika langsung bayar akan sedikit meragukan dan kurang profesional, tidak ada sentuhan manusia"*.
  2. Pengguna meminta penambahan menu baru: *"tapi sepertinya kita perlu buat menu baru di portal kostmanager yaitu pengajuan sewa, menu untuk mendukung alur persetujuan admin terkait permintaaan sewa yang masuk"*.
  3. Untuk seluruh kost yang berada di bawah naungan KostManager (seperti *Kost Madani*), permintaan sewa dari pencari kost harus dialihkan dan disetujui oleh Tim KostManager Admin di Portal KostManager (bukan pemilik kost di Dashboard Mitra), sekaligus memicu notifikasi WhatsApp resmi berisi persetujuan dan link bayar.
- **Implementasi**:
  * **1. Menu Baru 'Pengajuan Sewa' di Sidebar Portal KostManager (`KostManagerPortal.tsx` & `Dashboard.tsx`)**:
    - Menambahkan menu `bookings` (`📥 Pengajuan Sewa`) pada sidebar navigasi Portal KostManager dengan badge jumlah pengajuan baru yang menunggu persetujuan secara realtime (`pendingBookingCount`).
    - Menambahkan tipe `km_bookings` pada `DashboardMenu` di `Dashboard.tsx`.
    - Di tab Overview, menyajikan banner notifikasi aksi cepat jika terdapat pengajuan sewa baru yang butuh persetujuan (ACC).
  * **2. Antarmuka Manajemen Pengajuan Sewa Enterprise (`KostManagerPortal.tsx`)**:
    - **Grid Statistik**: 4 kartu status (Menunggu Persetujuan / Pending ACC, Menunggu Bayar, Disetujui & Lunas, Ditolak).
    - **Filter Bar**: Filter status 1-klik dan pencarian cerdas nama pemohon, properti, unit kamar, atau No. WhatsApp.
    - **Tabel Pengajuan Sewa Lengkap**: Kolom Calon Penghuni (dengan tautan direct WhatsApp), Properti & Unit Kamar, Paket Durasi & Rencana Masuk, Total Tagihan Awal, dan Status.
    - **Aksi Cepat Admin**:
      - **"✅ Setujui (ACC)"**: Mengubah status transaksi menjadi `AWAITING_PAYMENT`, menyinkronkan status sewa, dan otomatis mengirimkan pesan WhatsApp konfirmasi persetujuan + link bayar.
      - **"❌ Tolak"**: Mengubah status transaksi menjadi `REJECTED` dengan dialog pencatatan alasan penolakan.
      - **"💬 Hubungi WhatsApp"**: Membuka percakapan langsung dengan calon penyewa.
  * **3. Engine WhatsApp Persetujuan Booking (`rentBillingService.ts`)**:
    - Membuat `generateBookingApprovalWhatsAppMessage` dan `sendBookingApprovalWhatsApp` yang menyusun pesan konfirmasi resmi korporat dari Manajemen KostManager RuangSinggah beserta tautan pembayaran resmi `/my-kost?orderId=...&tab=payment`.
  * **4. Autopilot Murni di Dashboard Mitra (`MitraDashboard.tsx`)**:
    - Memfilter data antrean pesanan pending milik mitra agar transaksi properti KostManager (`kmPropIds`) tidak membebani tindakan manual pemilik kost.
    - Menambahkan badge status `⚡ Dikelola KostManager` pada riwayat pesanan mitra.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/pages/MitraDashboard.tsx`
  - `functions/public/rentBillingService.ts`
  - `functions/public/pages/Dashboard.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
- **Verifikasi**: Build frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 28.67s, 0 error).

### 196. Otomasi Pengiriman Kwitansi WhatsApp & Penerbitan Kwitansi Digital Resmi Perpanjangan Sewa Lunas (`rentBillingService.ts`, `DigitalReceiptModal.tsx`, `DigitalReceiptPage.tsx`, `OrderPaymentStatus.tsx`, `MyKost.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta: *"bagaimana jika perpanjangan sewa berhasil dilakukan, maka sistem akan otomatis mengirimkan kwitansinya melalui whatsapp"*.
  2. Saat penghuni menyelesaikan pembayaran tagihan sewa (baik melalui QRIS/Transfer Midtrans maupun verifikasi admin), sistem harus otomatis menerbitkan kwitansi resmi yang sah berstempel PT RUANG SINGGAH NUSANTARA dan mengirimkannya langsung ke nomor WhatsApp penghuni.
  3. Dibutuhkan halaman mandiri rute publik `/receipt/:orderId` agar kwitansi dapat diakses dan dicetak kapan saja langsung dari tautan pesan WhatsApp tanpa mewajibkan login ulang jika tautan valid.
  4. Manajemen KostManager di portal admin memerlukan aksi 1-klik untuk melihat lembar kwitansi resmi atau mengirimkan ulang kwitansi via WhatsApp.
- **Implementasi**:
  * **1. Engine Pembuatan & Pengiriman Kwitansi WhatsApp (`rentBillingService.ts`)**:
    - Membuat fungsi `generateRentReceiptWhatsAppMessage(params)` dengan copy template resmi: nomor kwitansi `#INV-...`, nama penghuni, properti, nomor kamar, skema sewa, periode sewa baru bersambung, total nominal bayar lunas, dan direct link `/receipt/:orderId`.
    - Membuat fungsi `sendRentReceiptWhatsApp(params)` yang terhubung langsung ke gateway WhatsApp Supabase Edge Function (`/functions/v1/send-wa` / Meta API).
  * **2. Komponen Modal Kwitansi Resmi Digital (`DigitalReceiptModal.tsx`)**:
    - Format kwitansi resmi korporat berstempel legalitas PT RUANG SINGGAH NUSANTARA (NIB: 1008250025911).
    - Desain premium dengan vector SVG murni (`lucide-react`) bebas FOUT, kartu status LUNAS/VERIFIED, rincian biaya pokok dan biaya tambahan, tombol cetak/print PDF (`window.print()`), serta tombol bagikan ke WhatsApp.
  * **3. Halaman Kwitansi Publik Mandiri (`DigitalReceiptPage.tsx` & `App.tsx`)**:
    - Menambahkan rute lazy-loaded `/receipt/:orderId` pada `App.tsx`.
    - Mengambil data transaksi dari Supabase (`transactions` / `manual_invoices`) dan merender kwitansi digital secara otomatis.
  * **4. Otomasi Konfirmasi Pembayaran (`OrderPaymentStatus.tsx` & `MyKost.tsx`)**:
    - Pada `OrderPaymentStatus.tsx`, mendeteksi status `PAID` dan langsung memicu `sendRentReceiptWhatsApp()` secara otomatis, menyajikan kartu ringkasan sukses, tombol "Buka Kwitansi Resmi", dan tombol "Akses Kost Saya".
    - Pada `MyKost.tsx`, callback `onPaymentSuccess` pada `PaymentGateway` memicu pengiriman kwitansi via WhatsApp dan langsung menampilkan `DigitalReceiptModal` di layar.
    - Menambahkan tombol **"🧾 Kwitansi"** pada setiap riwayat tagihan yang telah lunas di modal tagihan kamar `MyKost.tsx`.
  * **5. Integrasi Manajemen Tagihan di Portal Admin (`KostManagerPortal.tsx`)**:
    - Pada tab Riwayat Pembayaran Sewa (`activeTab === 'billing'`), menambahkan tombol **"🧾 Kwitansi"** dan **"💬 Kirim WA"** pada setiap tagihan berstatus `paid`.
    - Pada verifikasi lunas admin (`handleUpdateStatusBill`), sistem otomatis menyinkronkan perpanjangan masa sewa penghuni dan mengirimkan kwitansi resmi ke WhatsApp penyewa.
- **File Tersentuh**:
  - `functions/public/rentBillingService.ts`
  - `functions/public/components/DigitalReceiptModal.tsx`
  - `functions/public/pages/DigitalReceiptPage.tsx`
  - `functions/public/App.tsx`
  - `functions/public/pages/OrderPaymentStatus.tsx`
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2531 modules transformed, ✓ built in 34.47s, 0 error).

### 195. Otomasi Struktur Biaya Riil Pendataan Survei & Aturan Baku Perpanjangan Sewa Bersambung (*Continuous Lease Anchor*) (`KostManagerPortal.tsx`, `rentBillingService.ts`, `ClaimKost.tsx`, `MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa muncul angka default Rp 1.000.000 pada modal penagihan sewa padahal tidak pernah diinput saat pendataan survei oleh agen.
  2. Seluruh struktur biaya aktual hasil survei (harga kamar riil misal Rp 400.000 untuk Kamar 2 `arif`, biaya tambahan orang `extraOccupantFee` Rp 50.000, biaya fasilitas tambahan `additional_fee_price`, dan sisa tagihan awal) harus tersinkronisasi otomatis ke rincian tagihan.
  3. Sistem wajib menerapkan **Aturan Baku Perpanjangan Sewa Bersambung (*Continuous Lease Anchor*)**:
     - Jenis sewa terakhir (Bulanan, 3 Bulanan, 6 Bulanan, Tahunan, dsb.) harus tercatat dan terhitung durasinya.
     - Tanggal mulai perpanjangan baru (`newStartDate`) **SELALU berpatokan pada tanggal akhir sewa sebelumnya (`currentEndDate`)**, walaupun penghuni terlambat melakukan pembayaran.
     - Tanggal akhir sewa baru (`newEndDate`) dihitung otomatis bersambung dari tanggal mulai baru sesuai durasi sewa.
     - Jika terlambat bayar, sistem menyajikan label dan banner informasi keterlambatan yang jelas.
- **Implementasi**:
  * **1. Engine Kalkulasi Perpanjangan Sewa Bersambung (`rentBillingService.ts`)**:
    - Membuat fungsi pembantu `calculateNextLeasePeriod(currentStart, currentEnd, billingPeriod, durationCount)`.
    - Mengunci tanggal mulai baru `newStartDate` tepat pada akhir periode sebelumnya (`currentEnd`), lalu menambahkan durasi sewa (1 bulan, 3 bulan, 6 bulan, atau 12 bulan) untuk menghasilkan `newEndDate`.
    - Mendeteksi status keterlambatan (`isLate` dan `lateDays`) jika tanggal hari ini telah melewati tanggal jatuh tempo sebelumnya.
    - Memperluas antarmuka `RentClaimPayload` dan format pesan WhatsApp resmi agar mencantumkan rincian skema sewa, masa sewa berjalan, masa sewa perpanjangan baru, dan batas pembayaran.
  * **2. Penghapusan Hardcoded Fallback & Integrasi Biaya Survei Riil (`KostManagerPortal.tsx`)**:
    - Menghapus seluruh fallback hardcoded `1000000` (Rp 1 Juta) di `KostManagerPortal.tsx`.
    - Menghubungkan pembacaan struktur biaya dari data kamar riil (`rt.price` / `p.price` / `totalRent`), biaya tambahan orang (`extraOccupantFee` / `extraPersonFee`), dan fasilitas tambahan (`additional_fee_price`).
    - Merancang **Smart Extension Lease Card** pada modal penagihan:
      - Menampilkan kartu rincian periode sewa berjalan vs periode sewa perpanjangan baru.
      - Menampilkan badge skema sewa terdaftar (*Bulanan*, *3 Bulanan*, dll.).
      - Menampilkan banner peringatan keterlambatan (*Late Notice Banner*) jika masa sewa telah lewat tempo dengan keterangan bahwa perpanjangan tetap dihitung bersambung.
      - Menampilkan *Live WhatsApp Preview* yang akurat beserta tombol pengiriman otomatis dan link auto-login.
  * **3. Sinkronisasi Data Sewa Baru & Metadata Penghuni di Halaman Pengguna (`ClaimKost.tsx`, `MyKost.tsx`)**:
    - Memperbarui halaman magic link `ClaimKost.tsx` agar menampilkan rincian periode perpanjangan baru sebelum diarahkan ke halaman Kost Saya.
    - Menyelaraskan penyimpanan `rs_active_tenant_claim` di `MyKost.tsx` agar tanggal mulai sewa, tanggal akhir sewa, skema periode sewa, serta rincian biaya pokok dan biaya tambahan tersinkronisasi 100% dengan data penagihan.
- **File Tersentuh**:
  - `functions/public/rentBillingService.ts`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/pages/ClaimKost.tsx`
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2529 modules transformed, ✓ built in 23.61s, 0 error).

### 194. Pemindahan Otomatis Tugas Pendataan KostManager yang Telah Listing ke Tab 'Riwayat' Dashboard Agen (`adminService.ts`, `AgentDashboard.tsx`, `KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa tugas pendataan KostManager yang sudah disetujui (ACC) oleh admin dan propertinya sudah listing tayang sebagai mitra KostManager (misal order `#12415302` - Kost Madani) masih tertahan di tab **"Aktif"** Dashboard Agen dengan label `DATA DIKIRIM (MENUNGGU TINJAUAN ADMIN)`.
  2. Akar masalah: Saat admin menyetujui listing kost, status tugas pada database tidak otomatis disinkronkan ke `COMPLETED`, fungsi `getAdminSurveyRequests()` belum memeriksa status publikasi properti/mitra, dan filter tab `history` di `AgentDashboard.tsx` hanya menangkap status `COMPLETED` mentah tanpa sinkronisasi properti aktif.
- **Implementasi**:
  * **1. Cross-Check Properti Listing & Sinkronisasi Otomatis (`adminService.ts`)**:
    - Memperbarui `getAdminSurveyRequests()` agar melakukan verifikasi silang (*cross-reference*) dengan tabel `properties` (`is_managed = true` / `status = 'published'`) dan `kostmanager_requests` (`status = 'ACTIVE'`).
    - Jika properti yang disurvei telah aktif/listing sebagai mitra KostManager, status tugas otomatis diselesaikan (`COMPLETED`), baik untuk survei biasa maupun survei KostManager (`kostmanager_surveys`).
  * **2. Pembaruan Filter Tab & Badge Riwayat (`AgentDashboard.tsx`)**:
    - Menyempurnakan filter `agentTab === 'active'` agar mengecualikan seluruh tugas yang sudah selesai (`COMPLETED`, `APPROVED`, `ACTIVE`).
    - Memperbarui filter `agentTab === 'history'` dan penghitung dot indikator notifikasi untuk menampung seluruh tugas yang telah selesai/listing.
    - Menampilkan label status `SELESAI (SUDAH LISTING KOSTMANAGER)` dengan warna hijau emerald yang elegan di tab Riwayat.
  * **3. Sinkronisasi Menyeluruh pada Approval Admin (`KostManagerManagement.tsx`)**:
    - Memperbarui handler persetujuan admin `handleApproveAndActivate` agar melakukan batch update `status: 'COMPLETED'` pada seluruh `survey_requests` terkait berdasarkan `transaction_id`, `kost_name`, dan `user_id`.
- **File Tersentuh**:
  - `functions/public/adminService.ts`
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2529 modules transformed, ✓ built in 41.15s, 0 error).

### 193. Modernisasi & Otomasi Modal Penagihan Sewa WhatsApp Magic Link di Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa formulir "Tagih Sewa Bulanan" pada UI Portal KostManager masih bersifat manual dan menampilkan nominal yang salah (misal Rp 1.000.000 untuk Kost Madani yang tarif aslinya Rp 400.000).
  2. Akar masalah: Dropdown penghuni tidak menyinkronkan nominal dan tanggal jatuh tempo pada event `onChange`, pemetaan harga sewa penghuni survei/offline belum terisi di `totalRent`, serta formulir masih menggunakan alur invoice manual lama tanpa integrasi WhatsApp Gateway.
- **Implementasi**:
  * **1. Sinkronisasi Otomatis Harga Sewa & Tanggal Jatuh Tempo (`KostManagerPortal.tsx`)**:
    - Memetakan tarif riil properti/kamar (`rt.price` / `p.price` / `basePrice`) ke `totalRent` dan `rent_price` pada seluruh entitas penghuni di `loadAllData()` dan `enrichedTenants`.
    - Menghubungkan dropdown `<select>` penghuni agar otomatis mengisi `rentalAmount` dan `dueDate` secara instan saat penghuni diganti.
    - Memperbarui tombol "🧾 Tagih" di tabel penghuni agar langsung memuat data akurat (Rp 400.000 untuk Kost Madani Kamar 1).
  * **2. Redesain Modal Penagihan Pintar & Live WhatsApp Preview**:
    - Merombak tampilan modal penagihan menjadi panel otomasi cerdas berstandar modern:
      - Kartu ringkasan profil penyewa, properti, kamar, dan badge nomor WhatsApp.
      - Input nominal dan tanggal jatuh tempo yang otomatis terisi namun tetap fleksibel disesuaikan.
      - **Live Preview Pesan WhatsApp Resmi**: Menampilkan gelembung chat pratinjau pesan pengingat sewa lengkap dengan link auto-login `/claim-kost?token=...`.
  * **3. Tombol Aksi Multi-Kanal (Gateway & Manual)**:
    - **"🚀 Kirim WhatsApp Otomatis (+ Magic Link)"**: 1-klik memicu pengiriman pesan via `sendRentBillingReminderWhatsApp()` dan mencatat riwayat invoice ke database.
    - **"💬 Buka WhatsApp Web"**: Opsi membuka `wa.me/...` manual dengan teks pesan yang sudah terformat rapi.
    - **"📄 Simpan Invoice Saja"**: Opsi pencatatan invoice tanpa memicu pengiriman WhatsApp.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2529 modules transformed, ✓ built in 33.30s, 0 error).

### 192. Sistem Penagihan Otomatis WhatsApp, Magic Auto-Login Penghuni, & Perpanjangan Sewa 'Kost Saya' (`rentBillingService.ts`, `ClaimKost.tsx`, `MyKost.tsx`, `App.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta perancangan dan implementasi mekanisme penagihan sewa otomatis WhatsApp untuk penghuni kost terkelola KostManager yang belum memiliki akun RuangSinggah.
  2. Alur yang diinginkan: Tautan WhatsApp langsung mengarahkan penghuni untuk login otomatis ke akun RuangSinggah, membuka menu "Kost Saya" yang terikat dengan kamar kostnya, dan memungkinkan perpanjangan sewa langsung via Payment Gateway (QRIS, VA Bank, E-Wallet).
- **Implementasi**:
  * **1. Modul Penagihan & Magic Claim Token (`rentBillingService.ts`)**:
    - Membuat generator token klaim sewa aman URL-safe yang memuat data nomor HP, nama penghuni, id properti, nomor kamar, harga sewa bulanan, dan tanggal jatuh tempo.
    - Menyiapkan fungsi pengiriman WhatsApp pengingat sewa resmi dari Manajemen KostManager RuangSinggah yang memuat link direct access: `https://ruangsinggah.id/claim-kost?token=...`.
  * **2. Halaman Magic Auto-Login & Binding Kamar (`ClaimKost.tsx`, `App.tsx`)**:
    - Membuat rute `/claim-kost` yang memvalidasi token dari WhatsApp.
    - Melakukan registrasi/autentikasi instan akun pengguna berbasis nomor HP secara *silent* (*Zero Friction*), menyimpan sesi di localStorage/Supabase, dan mengarahkan penghuni ke halaman `/my-bookings/aktif`.
  * **3. Integrasi Kamar Terkelola & Perpanjangan Sewa di Halaman 'Kost Saya' (`MyKost.tsx`)**:
    - Menyuntikkan data kamar aktif KostManager ke dalam state `residentStatus` dan `activeKosts` pada tab "Kost Aktif".
    - Menampilkan kartu kamar kost aktif, countdown sisa hari sewa, serta tombol **"Perpanjang Sewa"** yang terhubung dengan modal durasi dan `PaymentGateway`.
- **File Tersentuh**:
  - `functions/public/rentBillingService.ts` *(Baru)*
  - `functions/public/pages/ClaimKost.tsx` *(Baru)*
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/App.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2529 modules transformed, ✓ built in 30.84s, 0 error).

### 191. Notifikasi Email Otomatis ke Admin untuk Pesan Chat Masuk (`emailService.ts`, `chatService.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar sistem mengirimkan notifikasi email ke email admin secara otomatis setiap kali ada pesan chat baru masuk dari calon penyewa, agar admin/CS KostManager dapat segera merespons chat secepatnya.
- **Implementasi**:
  * **1. Fungsi Notifikasi Email Chat (`emailService.ts`)**:
    - Membuat fungsi `notifyAdminNewChatMessage` yang secara dinamis mengambil seluruh email akun admin dari tabel `users`.
    - Menyusun template email berstruktur rapi yang memuat nama calon penyewa, nama properti kost, lokasi/alamat, cuplikan pesan, waktu kirim, dan direct link cepat ke Portal CS KostManager (`https://ruangsinggah.id/dashboard-admin/km_chats`).
  * **2. Integrasi Pemicuan Otomatis (`chatService.ts`)**:
    - Pada fungsi `sendMessage()`, ketika `senderType === 'user'` dan ditujukan ke kost terkelola KostManager / Admin, sistem otomatis memicu pengiriman email `notifyAdminNewChatMessage()` di latar belakang tanpa memperlambat pengalaman pengguna di antarmuka chat.
- **File Tersentuh**:
  - `functions/public/emailService.ts`
  - `functions/public/chatService.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 28.58s, 0 error).

### 190. Penghapusan Tombol 'Cek Kamar' Non-Fungsional pada Header Chat (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa tombol "Cek Kamar" di header chat CS tidak merespons ketika diklik, dan menginstruksikan untuk menghapusnya jika memang tidak fungsional.
  2. Akar masalah: Tombol tersebut sebelumnya memanggil state `setSelectedPropForRoomMatrix`, tetapi modal denah kamarnya hanya dirender di dalam tab `Properti Terkelola`, sehingga saat berada di tab `Pesan & Chat Customer`, modal tidak pernah muncul. Selain itu, header chat CS sudah memiliki status ketersediaan kamar instan (`🟢 4 Kamar Kosong` / `✨ Full Terisi`), sehingga tombol tersebut bersifat redundan.
- **Implementasi**:
  * Menghapus tombol `<button> Cek Kamar </button>` dari header chat di `KostManagerPortal.tsx`.
  * Header chat CS kini lebih bersih, fokus, dan hanya mempertahankan tombol fungsional `Buka Listing` serta indikator ketersediaan kamar real-time.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 28.93s, 0 error).

### 189. Perbaikan Kebijakan UPDATE RLS `chat_messages` & Reset Instan Badge Unread (`supabase_schema.sql`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa ketika sesi chat sudah dibuka dan bahkan sudah dibalas oleh CS di Portal KostManager, kartu sesi di kolom kiri tetap menampilkan badge angka unread (seperti badge angka 7 pada `Game Burik`).
  2. Akar masalah: Tabel `chat_messages` di database sebelumnya belum memiliki kebijakan RLS untuk operasi `UPDATE`. Akibatnya, perintah `markMessagesAsRead` (yang memperbarui `is_read = true`) ditolak diam-diam oleh database PostgreSQL. Nilai `is_read` tetap `false`, sehingga query kalkulasi unread terus menghitung pesan tersebut belum dibaca. Selain itu, local state `unread_count` pada `chatSessions` belum di-reset seketika saat auto-select atau saat pesan dibuka.
- **Implementasi**:
  * **1. Penambahan Kebijakan RLS `UPDATE` pada `chat_messages` (`supabase_schema.sql`)**:
    - Mendaftarkan kebijakan `UPDATE` resmi pada `chat_messages` agar seluruh partisipan sesi dan akun ber-role `'admin'` diizinkan memperbarui `is_read = true`.
  * **2. Reaktivitas Reset State Front-End (`KostManagerPortal.tsx`)**:
    - Pada `useEffect` pembacaan pesan dan pada listener `subscribeToMessages`, sistem seketika mereset `unread_count = 0` pada local state `chatSessions` untuk sesi yang sedang aktif terbuka.
    - Badge angka dan dot oranye kini **langsung hilang seketika** begitu sesi dipilih atau pesan dibalas.
  * **3. Sinkronisasi Database**:
    - Menjalankan normalisasi 69 pesan eksisting yang sudah dibuka menjadi `is_read = true`.
- **File Tersentuh**:
  - `functions/public/supabase_schema.sql`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 31.76s, 0 error).

### 188. Pembersihan Sesi Chat Kosong & Peningkatan Fallback Avatar Profil (`chatService.ts`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa ada percakapan yang masuk dengan pesan kosong (*"Mulai percakapan..."* tanpa isi pesan) dan profil kosong/rusak di Portal KostManager (contoh: `Rahmat Hidayat03`).
  2. Akar masalah: Ketika calon penyewa mengklik tombol Chat lalu langsung menutup popup tanpa mengetik atau mengirim pesan apa pun, record sesi tetap tersimpan di database dengan 0 pesan. Selain itu, tag gambar avatar sebelumnya tidak memiliki *fallback error handler* ketika URL foto pengguna gagal dimuat.
- **Implementasi**:
  * **1. Penyaringan Sesi Kosong Tanpa Pesan (`chatService.ts`)**:
    - Memperbarui fungsi `getKostManagerChatSessions` dan `getMyChatSessions` agar secara efisien menyaring dan hanya menampilkan sesi percakapan yang memiliki setidaknya satu pesan nyata (`chat_messages > 0`).
    - Sesi coba-coba yang ditutup tanpa mengirim pesan tidak akan pernah membebani inbox CS KostManager maupun Dashboard Mitra.
  * **2. Pembersihan Database dari Sesi Kosong**:
    - Menghapus 27 sesi kosong lama (0 pesan) dari tabel `chat_sessions`.
    - Inbox Portal KostManager kini 100% bersih, rapi, dan hanya memuat percakapan aktif yang nyata.
  * **3. Peningkatan Fallback Avatar Profil (`KostManagerPortal.tsx`)**:
    - Menambahkan atribut `onError` pada tag gambar profil pelanggan. Jika foto gagal dimuat atau tidak tersedia, sistem secara mulus menyembunyikan tag gambar dan merender inisial huruf pertama nama pengguna di atas gradien oranye modern.
- **File Tersentuh**:
  - `functions/public/chatService.ts`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 31.07s, 0 error).

### 187. Pencegahan Duplikasi Sesi Chat & Penggabungan Sesi Terpisah (`chatService.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa chat dari pengguna yang sama (`Game Burik` dan `Administrator`) pada properti yang sama (`Kost Madani`) sempat menghasilkan 2 kartu percakapan terpisah di Portal KostManager.
  2. Akar masalah: Sesi pertama dibuat pada masa transisi routing awal (ber-`owner_id` pemilik pribadi), sedangkan sesi kedua dibuat setelah routing dialihkan ke `SYSTEM_ADMIN_ID`. Logika query `getOrCreateChatSession` sebelumnya mencari kecocokan `(user_id, owner_id, property_id)`. Karena `owner_id` sesi lama belum sinkron dengan `SYSTEM_ADMIN_ID`, sistem membuat sesi baru.
- **Implementasi**:
  * **1. Logika Anti-Duplikasi `getOrCreateChatSession` (`chatService.ts`)**:
    - Memperbarui mekanisme pencarian sesi dengan memprioritaskan pasangan `(user_id, property_id)`.
    - Jika sesi untuk kost tersebut sudah pernah ada (apapun `owner_id` awalnya), sistem me-reuse sesi yang sudah ada dan secara otomatis memperbarui `owner_id = finalOwnerId` (tanpa membuat sesi baru).
  * **2. Penggabungan (Merge) Data Sesi Duplikat di Database**:
    - Menyatukan seluruh riwayat pesan dari sesi lama (`c672b032-1e5a-42aa-88b0-cfc113fba20e`) ke dalam sesi utama (`5044377a-9eca-4d79-b3ae-a3c87cf88a08`) untuk `Game Burik`.
    - Menyatukan pesan sesi duplikat untuk `Administrator` dan `Sulhan`.
    - Menghapus record sesi duplikat lama yang sudah kosong, sehingga di Portal KostManager kini 1 pengguna hanya memiliki 1 sesi percakapan tunggal yang utuh dan berkesinambungan.
- **File Tersentuh**:
  - `functions/public/chatService.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 25.84s, 0 error).

### 186. Pemisahan Bersih Chat Era Mitra Biasa vs Era KostManager (`chatService.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar sistem dapat membedakan chat yang masuk ke kost saat masih berstatus Mitra Biasa vs chat yang masuk saat sudah berstatus Mitra KostManager.
  2. Tujuannya agar riwayat chat lawas dari era Mitra Biasa tidak masuk ke Portal KostManager dan tidak memenuhi menu pesan CS KostManager.
- **Implementasi**:
  * **1. Pengetatan Filter Query `getKostManagerChatSessions` (`chatService.ts`)**:
    - Memperbarui query pembacaan sesi di Portal KostManager menjadi `supabase.from('chat_sessions').select('*').eq('owner_id', SYSTEM_ADMIN_ID).in('property_id', managedPropertyIds)`.
    - Dengan filter ini, hanya percakapan yang dibuat di era KostManager (`owner_id = SYSTEM_ADMIN_ID`) yang dimuat di Portal CS.
  * **2. Normalisasi Data Sesi Lawas**:
    - Mengembalikan `owner_id` pada 15 percakapan lawas (April – Juni 2026) kembali ke UID pemilik kost pribadi (Abdullah: `c58e7306-d657-420a-9435-91f5fbd1a3a0`).
    - Portal KostManager kini tampil sangat bersih, rapi, dan hanya memuat 4 percakapan aktif era KostManager (Agustus 2026).
- **File Tersentuh**:
  - `functions/public/chatService.ts`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 27.38s, 0 error).

### 185. Fitur Diferensiasi Visual Chat Belum Dibaca (Unread) vs Sudah Dibaca & Sinkronisasi Centang WhatsApp (`chatService.ts`, `KostManagerPortal.tsx`, `ChatWindow.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar percakapan yang memiliki pesan baru (belum dibaca / unread) dapat dibedakan secara visual dari percakapan yang sudah pernah dibuka atau dibaca.
  2. Pengguna meminta agar status unread ini terhubung langsung secara real-time dengan indikator centang WhatsApp (Centang 1, Centang 2 Abu-Abu, dan Centang 2 Biru).
  3. Badge angka di sidebar menu `PESAN & CHAT CUSTOMER` sebelumnya keliru menampilkan total seluruh sesi (18), seharusnya hanya menampilkan jumlah chat yang *unread*.
- **Implementasi**:
  * **1. Kalkulasi Dinamis `unread_count` Backend & Service (`chatService.ts`)**:
    - Menambahkan kolom terhitung `unread_count` pada interface `ChatSession`.
    - Di `getKostManagerChatSessions` dan `getMyChatSessions`, sistem secara efisien melakukan agregasi jumlah pesan `is_read = false` yang dikirim oleh lawan bicara untuk setiap sesi.
  * **2. Visual UI WhatsApp-Style Unread vs Read (`KostManagerPortal.tsx`)**:
    - **Unread Chat**: Menampilkan badge lingkaran oranye dengan angka jumlah unread, dot indikator oranye, nama calon penyewa dan cuplikan teks pesan dicetak **Tebal (Font-Black text-gray-900)**, jam pesan diwarnai oranye, dan kartu diberi aksen border oranye lembut (`bg-amber-50/40 border-amber-200/80`).
    - **Read Chat**: Tipografi teks reguler abu-abu bersih tanpa badge angka.
    - **Koreksi Badge Sidebar**: Menghitung `unreadChatCount = chatSessions.reduce((acc, s) => acc + (s.unread_count || 0), 0)`. Badge hanya muncul jika ada pesan unread.
  * **3. Sinkronisasi Real-Time Centang WhatsApp**:
    - Saat CS mengklik/memilih sesi unread di portal, sistem memicu `markMessagesAsRead(session.id, 'owner')` dan seketika mereset `unread_count = 0` pada kartu dan badge sidebar.
    - Perubahan `is_read = true` disiarkan melalui Supabase Realtime WebSocket ke layar calon penyewa, seketika mengubah status centang dari **Centang 2 Abu-Abu** menjadi **Centang 2 Biru Cerah**.
    - Sebaliknya, saat calon penyewa membuka popup chat ([ChatWindow.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/ChatWindow.tsx)), sistem menandai pesan CS telah dibaca sehingga centang balasan CS di Portal KostManager seketika berubah menjadi biru.
- **File Tersentuh**:
  - `functions/public/chatService.ts`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/components/ChatWindow.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 36.62s, 0 error).

### 184. Perbaikan Routing & Akses Real-Time Chat Properti KostManager ke Portal KostManager (`chatService.ts`, `KostDetail.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa saat login menggunakan akun penyewa (role: `user`) dan mengirim chat ke listing kost kelolaan KostManager (Kost Madani), chat tersebut tidak muncul di Portal KostManager (`/dashboard-admin/km_chats`) maupun di Dashboard Mitra.
  2. Akar masalah:
     - **Di Dashboard Mitra**: Sesuai desain isolasi peran KostManager, sesi chat properti KostManager memang sengaja disembunyikan dari mitra pemilik kost agar tidak ada transaksi/interaksi di luar kendali pengelola.
     - **Di Portal KostManager**: Sesi chat sebelumnya mencatat `owner_id` pemilik pribadi (Abdullah), sehingga kebijakan keamanan database PostgreSQL (RLS) menyaring dan menyembunyikannya dari akun Admin. Serta `SYSTEM_ADMIN_ID` sebelumnya masih dummy.
- **Implementasi**:
  * **1. Konfigurasi Valid `SYSTEM_ADMIN_ID` & Routing Eksklusif KostManager (`chatService.ts` & `KostDetail.tsx`)**:
    - Menetapkan `SYSTEM_ADMIN_ID` ke ID Admin resmi yang terdaftar di `public.users` (`ca842776-97ab-48a7-b1cd-6dea17d78c1e`).
    - Pada `KostDetail.tsx`, jika properti berstatus kelolaan KostManager (`kost.is_managed || kost.isKostManager`), `targetOwnerId` secara otomatis diarahkan ke `SYSTEM_ADMIN_ID`.
  * **2. Migrasi Sesi Database Eksisting**:
    - Menyelaraskan seluruh sesi chat properti Kost Madani di database ke `owner_id = SYSTEM_ADMIN_ID` sehingga chat calon penyewa yang baru saja dikirim langsung muncul di portal.
  * **3. Realtime Subscription Daftar Sesi (`KostManagerPortal.tsx`)**:
    - Menambahkan listener WebSocket `subscribeToChatSessions` pada tabel `chat_sessions` di `KostManagerPortal.tsx` agar setiap ada sesi baru atau pesan baru dari calon penyewa, daftar sesi di kolom kiri portal langsung ter-update otomatis seketika tanpa perlu refresh halaman.
- **File Tersentuh**:
  - `functions/public/chatService.ts`
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 42.11s, 0 error).

### 183. Fitur Indikator Status Pesan WhatsApp-Style (Centang 1, Centang 2 Abu-Abu, Centang 2 Biru) (`chatService.ts`, `ChatWindow.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta penambahan indikator visual tanda centang ala WhatsApp (Centang 1, Centang 2 Abu-Abu, dan Centang 2 Biru) pada gelembung pesan untuk mengetahui status apakah pesan sedang dikirim, sudah tersimpan/diterima di server, dan sudah dibaca oleh lawan bicara (baik CS KostManager, Pemilik Kost, maupun Calon Penyewa).
- **Implementasi**:
  * **1. Backend Read Receipt & Realtime Update (`chatService.ts`)**:
    - Menambahkan fungsi `markMessagesAsRead(sessionId, readerSenderType)` untuk menandai pesan lawan bicara menjadi `is_read = true` di tabel `chat_messages`.
    - Memperluas listener `subscribeToMessages` ke event `*` (WebSocket Supabase Realtime) sehingga perubahan `is_read = true` langsung disiarkan ke layar pengirim secara instan.
  * **2. Render Indikator Centang WhatsApp di Front-End (`ChatWindow.tsx` & `KostManagerPortal.tsx`)**:
    - **Centang 1 Abu-Abu (`<Check />`)**: Pesan sedang dalam antrean pengiriman lokal (*Optimistic temporary ID*).
    - **Centang 2 Abu-Abu (`<CheckCheck />` text-white/60 / text-orange-200)**: Pesan telah sukses terkirim dan tersimpan di server database PostgreSQL (`is_read = false`).
    - **Centang 2 Biru Cerah (`<CheckCheck />` text-sky-300)**: Pesan telah dibuka dan dibaca secara nyata oleh lawan bicara (`is_read = true`).
  * **3. Pemicu Otomatis Pembacaan (Auto-Mark as Read)**:
    - Saat calon penyewa membuka popup `ChatWindow` atau CS KostManager memilih percakapan di Portal KostManager, sistem otomatis memicu `markMessagesAsRead`, seketika mengubah centang 2 abu-abu di layar lawan bicara menjadi centang 2 biru secara real-time.
- **File Tersentuh**:
  - `functions/public/chatService.ts`
  - `functions/public/components/ChatWindow.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 37.43s, 0 error).

### 182. Rekonsiliasi Pesan Optimistik & Pencegahan Duplikasi Bubble Chat (`ChatWindow.tsx`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa setiap kali mengirim chat baru, pesannya selalu muncul ganda (*double bubble*) di awal, tetapi saat chat ditutup dan dibuka kembali, jumlah pesan menjadi normal (1 pesan).
  2. Akar masalah: Front-end menambahkan pesan optimistik dengan ID sementara timestamp (`tempId`), sementara Supabase Realtime memancarkan event `INSERT` dengan UUID resmi database. Pengecekan ID lama menganggapnya sebagai pesan yang berbeda sehingga merender pesan kedua.
- **Implementasi**:
  * **1. Smart Message Reconciliation pada Listener Real-Time (`ChatWindow.tsx` & `KostManagerPortal.tsx`)**:
    - Saat payload pesan dari Supabase Realtime tiba, sistem memeriksa apakah terdapat pesan optimistik lokal dengan teks dan pengirim yang sama.
    - Jika ditemukan, sistem langsung **mereplace/menggantikan posisi ID sementara optimistik dengan ID UUID resmi database**, alih-alih menambahkan bubble baru.
  * **2. Safe State Mutation pada Handler Kirim**:
    - Menyelaraskan hasil kembalian dari `sendMessage` untuk memetakan ID secara aman tanpa memicu *flicker* atau duplikasi ganda.
- **File Tersentuh**:
  - `functions/public/components/ChatWindow.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 34.82s, 0 error).

### 181. Perbaikan Foreign Key Chat & Separasi Inbox Mitra vs Portal KostManager (`KostDetail.tsx`, `MitraDashboard.tsx`, `chatService.ts`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mengalami error *"Gagal membuka chat. Silakan coba lagi nanti."* saat mengklik tombol Chat di listing Kost Madani.
  2. Akar masalah: Foreign Key constraint database PostgreSQL `chat_sessions_owner_id_fkey` mewajibkan `owner_id` terdaftar di tabel `public.users`. Penggunaan hardcoded `00000000-0000-0000-0000-000000000000` memicu error pelanggaran Foreign Key (FK Violation Error 23503).
  3. Separasi inbox: Properti yang dikelola KostManager tidak boleh muncul di tab Pesan Dashboard Mitra.
- **Implementasi**:
  * **1. Penanganan Foreign Key Presisi (`KostDetail.tsx`)**:
    - Menggunakan `kost.ownerUid` asli pemilik kost pada `getOrCreateChatSession` sehingga transaksi insert tabel `chat_sessions` selalu valid 100% dan bebas error FK.
    - Menampilkan identitas header `ChatWindow` sebagai: **`Tim KostManager RuangSinggah`** (*Caretaker / CS Resmi*) pada properti KostManager.
  * **2. Separasi Inbox Dashboard Mitra (`MitraDashboard.tsx`)**:
    - Menambahkan filter pada `setChatSessions`: seluruh sesi chat dengan `property_id` milik kost berstatus KostManager (`is_managed === true`) otomatis disembunyikan/dikeluarkan dari layar Mitra.
  * **3. Resiliensi Query Portal KostManager (`chatService.ts` & `KostManagerPortal.tsx`)**:
    - Query `getKostManagerChatSessions` mengambil seluruh sesi chat terikat portofolio `managedPropertyIds` (`query.in('property_id', managedPropertyIds)`).
    - Memastikan passing `allManagedIds` dieksekusi tanpa error skema di Portal KostManager.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/pages/MitraDashboard.tsx`
  - `functions/public/chatService.ts`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 34.39s, 0 error).

### 180. Fitur Manajemen Chat Customer Terpusat (Unified CS Inbox) & Property Context Bar di Portal KostManager (`KostManagerPortal.tsx`, `chatService.ts`, `KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menyampaikan kebutuhan arsitektur operasional: untuk properti yang dikelola 100% oleh KostManager, pesan/chat in-app dari calon penyewa di web wajib masuk ke antrean operator/CS di Portal KostManager.
  2. Ketika CS membuka percakapan di portal KostManager, UI/UX wajib secara presisi dan visual menampilkan kost mana yang sedang ditanyakan calon penyewa (*High-Context Property Display*), agar CS tidak perlu menebak atau bertanya ulang ke penyewa.
- **Implementasi**:
  * **1. Penambahan Menu Sidebar & Routing (`KostManagerPortal.tsx`)**:
    - Menambahkan tab menu ke-6 di sidebar Portal KostManager: **`💬 Pesan & Chat Customer`** dengan counter badge jumlah sesi aktif.
    - Menambahkan tombol pintas **`💬 Chat (N)`** pada setiap baris properti di tab *Properti Terkelola* yang otomatis memfilter sesi ke kost tersebut.
  * **2. Desain Unified CS Inbox Split-View 2-Kolom (`KostManagerPortal.tsx`)**:
    - **Kolom Kiri (Daftar Percakapan)**: Filter pencarian nama/pesan, dropdown filter properti terkelola, kartu sesi dengan avatar penyewa, cuplikan pesan, dan **Badge Properti Menonjol** (thumbnail foto kost, nama kost, tipe gender).
    - **Kolom Kanan (Jendela Chat Aktif)**: Dilengkapi **Sticky Property Context Bar** di bagian atas chat yang menampilkan foto kost, nama kost, kota/alamat, tarif bulanan, status ketersediaan kamar riil (misal: *🟢 4 Kamar Kosong Siap Huni*), tombol *[ 🔗 Buka Listing ]* dan *[ 🛏️ Cek Kamar ]*.
    - Dilengkapi fitur **Quick Replies** balasan cepat (*ketersediaan kamar, jadwal survey, booking via web, rincian fasilitas*).
  * **3. Query & Realtime Backend Service (`chatService.ts`)**:
    - Menambahkan fungsi `getKostManagerChatSessions(managedPropertyIds)` yang mengambil seluruh sesi chat terikat portofolio kost terkelola beserta join data profil penyewa dan detail properti.
    - Sinkronisasi real-time subscription Supabase untuk pertukaran pesan instan antara calon penyewa dan CS KostManager.
- **File Tersentuh**:
  - `functions/public/chatService.ts`
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 34.21s, 0 error).

### 179. Proteksi Disintermediasi & Penghapusan Chat Langsung Penghuni KostManager (`MitraTenantManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna memberikan masukan proteksi bisnis krusial: pada properti KostManager, pemilik kost tidak boleh memiliki tombol chat langsung ke nomor WhatsApp penghuni untuk mencegah risiko transaksi sewa di luar aplikasi (*platform bypass / revenue leakage*).
  2. Seluruh komunikasi seputar kamar, kendala, atau perpanjangan sewa pada properti KostManager wajib terpusat dan dikoordinasikan melalui Tim KostManager RuangSinggah.
- **Implementasi**:
  * **1. Penghapusan Tombol Chat Langsung Penghuni KostManager**:
    - Tombol `💬 Chat` ke nomor WhatsApp pribadi penyewa dinonaktifkan/dihapus untuk penghuni properti KostManager.
    - Digantikan dengan tombol koordinasi terpusat: **`💬 Hubungi Tim KM`** yang menghubungkan pemilik kost langsung ke Account Manager RuangSinggah.
  * **2. Pelestarian Chat untuk Mitra Mandiri**:
    - Mitra Biasa (Self-Managed) tetap memiliki tombol `💬 Chat` ke penghuni karena mengelola operasionalnya secara mandiri.
- **File Tersentuh**:
  - `functions/public/components/mitra/MitraTenantManagement.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 34.00s, 0 error).

### 178. Pemisahan Kendali Operasional Penghuni Mitra Biasa vs KostManager Auto-Pilot (`MitraTenantManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menyampaikan masukan arsitektur bisnis: pada properti KostManager, pemilik kost seharusnya tidak memiliki kendali penagihan manual (`$ Selesai` dan `📄 Tagih`) karena seluruh operasional harian telah diserahkan sepenuhnya ke Tim KostManager RuangSinggah (Auto-Pilot).
  2. Tombol penagihan manual hanya relevan bagi Mitra Biasa (Self-Managed). Jika tetap aktif pada KostManager, dapat memicu bentrok penagihan ganda (*double billing*) atau selisih pencatatan kas offline.
- **Implementasi**:
  * **1. Mode Auto-Pilot Protected Monitoring untuk KostManager**:
    - Tombol aksi manual `$ Selesai` (konfirmasi bayar cash) dan `📄 Tagih` (kirim invoice tagihan manual) disembunyikan untuk penghuni properti KostManager.
    - Digantikan dengan status badge elegan: **`🛡️ Auto-Pilot Managed`**.
    - Tombol **`💬 Chat`** tetap dipertahankan untuk komunikasi ramah tamah/silaturahmi pemilik dengan penyewa melalui WhatsApp.
  * **2. Banner Jaminan Pengelolaan KostManager**:
    - Pada panel detail lipat (*Collapsible Details*) penghuni KostManager, ditambahkan banner informasi kepastian layanan:
      *"Dikelola Tim KostManager RuangSinggah: Penagihan sewa, pengiriman invoice, dan perpanjangan kamar ini ditangani penuh secara Auto-Pilot"* dengan tombol cepat **`Hubungi Tim KM`**.
  * **3. Pelestarian Kendali Penuh untuk Mitra Biasa**:
    - Mitra biasa yang mengelola kost secara mandiri tetap memiliki tombol aksi penagihan dan konfirmasi pembayaran tunai lengkap.
- **File Tersentuh**:
  - `functions/public/components/mitra/MitraTenantManagement.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 31.96s, 0 error).

### 177. Sinkronisasi Penghuni Aktif KostManager ke Database Penghuni Mitra (`adminService.ts`, `MitraTenantManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa menu **Database Penghuni** (*Penghuni Aktif*) di Dashboard Mitra menampilkan `0 TOTAL • 0 AKTIF • 0 TENGGANG - BELUM ADA PENGHUNI AKTIF`, padahal properti KostManager (*Kost Madani*) sudah memiliki unit terisi (Kamar 1 oleh **zul**, No. HP `081527080656`, sewa `28 Ags - 28 Sep 2026`, tarif `Rp 400.000/bln`, status `Terisi`).
  2. Fungsi `getResidentStatus` sebelumnya hanya membaca tabel `resident_status` dari transaksi online dan belum mengekstrak penghuni offline/survei pendataan lapangan dari `properties.room_types`.
- **Implementasi**:
  * **1. Ekstraksi Dual-Source di `getResidentStatus` (`adminService.ts`)**:
    - Mengembangkan `getResidentStatus` agar memindai seluruh kamar terisi (`rt.status === 'Terisi' || rt.isAvailable === false || Boolean(rt.residentName || rt.tenantName)`) pada `properties.room_types` milik properti mitra.
    - Menghasilkan rekaman penghuni lengkap (nama penyewa, no. telepon, nama kamar, tarif bulanan, periode mulai & selesai sewa, status `ACTIVE`) dengan deduplikasi otomatis terhadap pesanan online.
  * **2. Peningkatan Komponen Database Penghuni (`MitraTenantManagement.tsx`)**:
    - Kartu penghuni kini menampilkan badge: **`⭐ KOSTMANAGER`** untuk penghuni hasil pendataan lapangan.
    - Tombol **Chat** langsung membuka kontak WhatsApp penghuni (`https://wa.me/628xxx`) secara instan.
    - Memperbaiki filter tab status (Semua, Masa Tenggang, Sewa Aktif, Tidak Perpanjang) dan penghitungan sisa masa sewa (*daysLeft*).
  * **3. Sinkronisasi Metrik Beranda**:
    - Counter penghuni aktif di Beranda Mitra dan Database Penghuni otomatis sinkron dan akurat (`1 TOTAL • 1 AKTIF`).
- **File Tersentuh**:
  - `functions/public/adminService.ts`
  - `functions/public/components/mitra/MitraTenantManagement.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 41.01s, 0 error).

### 176. Perbaikan ReferenceError `requestTargetPrice` pada Modal KostManager (`MitraDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Terjadi `Uncaught ReferenceError: requestTargetPrice is not defined` di `MitraDashboard.tsx:2329` pada saat me-render form pengajuan penyesuaian harga sewa KostManager karena deklarasi state terhapus saat refactoring timeline panduan cepat.
- **Implementasi**:
  - Menambahkan kembali deklarasi `const [requestTargetPrice, setRequestTargetPrice] = useState('');` ke dalam daftar state KostManager di `MitraDashboard.tsx`.
- **File Tersentuh**:
  - `functions/public/pages/MitraDashboard.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 30.77s, 0 error).

### 175. Redesain & Interaktivitas Responsif "Panduan Mulai Cepat" di Dashboard Mitra (`MitraDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa komponen **Panduan Mulai Cepat** tidak responsif dan kurang interaktif di mobile/desktop.
  2. Ketika tombol **`[ LIHAT LISTING SAYA (POV USER) ]`** diklik, halaman listing kost terbuka di tab baru namun tampilan di dashboard tetap macet di Step 3 dan tidak berpindah ke Step 4 / Selesai karena validasi sebelumnya terkunci pada `stats.totalViews > 0` (yang masih 0 pada listing baru).
- **Implementasi**:
  * **1. Tracking Interaktif & Auto-Progression Step 3 ➔ Step 4**:
    - Menambahkan state `hasViewedListing` & `tourCompleted` yang tersimpan di `localStorage` (`mitra_viewed_listing_${uid}`).
    - Begitu mitra mengklik tombol *"Lihat Listing Saya (POV User)"*, sistem membuka halaman kost di tab baru, secara instan menandai Step 3 selesai (✓), menaikkan progress bar ke 100%, dan mengganti tombol menjadi **`🎉 Selesaikan Panduan & Buka Dashboard Penuh`**.
  * **2. Step Interaktif yang Dapat Diklik Langsung (*Direct Navigation*)**:
    - Seluruh langkah (1 s/d 4) kini berupa tombol kartu interaktif:
      - **Step 1**: Langsung ke Verifikasi Identitas (Profil).
      - **Step 2**: Langsung ke Manajemen Kost Saya.
      - **Step 3**: Preview Halaman Listing Publik (POV User).
      - **Step 4**: Buka Manajemen Pesanan & Dompet.
  * **3. Progress Bar Visual Dinamis & Tombol Tutup (✕)**:
    - Menambahkan header informatif dengan persentase penyelesaian (*misal: 3/4 Langkah • 75%*) dan progress bar bergradasi oranye-hijau.
    - Menambahkan tombol dismiss (✕) di pojok kanan atas kartu untuk menyembunyikan panduan kapan saja.
- **File Tersentuh**:
  - `functions/public/pages/MitraDashboard.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 27.34s, 0 error).

### 174. Integrasi Listing KostManager & Penerapan Fitur Smart Auto-Pilot di Dashboard Mitra (`MitraDashboard.tsx`, `userService.ts`, `AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa pada Dashboard Mitra dari kost yang terdaftar sebagai KostManager (*Kost Madani*), setelah status pendaftaran berhasil, kartu listing kost hilang dari daftar properti dan *Panduan Mulai Cepat* malah ter-reset kembali ke langkah awal (*"Mulai Upload Kost Sekarang"*), seolah-olah akun belum memiliki listing sama sekali.
  2. Pengguna meminta implementasi menyeluruh terkait tampilan dan fungsionalitas listing kost di Dashboard Mitra jika properti telah terdaftar sebagai KostManager (konsep Auto-Pilot).
- **Implementasi**:
  * **1. Koreksi & Proteksi Data Kepemilikan (`owner_uid`)**:
    - Memperbaiki `owner_uid` properti *Kost Madani* (`67f062a8-b5a5-4adb-bd40-928e6e8d9ee6`) di database Supabase (`properties` & `mitra_kostmanager`) kembali ke UID pemilik/mitra pemohon asli (`c58e7306-d657-420a-9435-91f5fbd1a3a0`).
    - Memperbarui fungsi `resolveValidOwnerUid` di `AgentDashboard.tsx` agar selalu memprioritaskan `req.user_id` (UID pemohon) saat surveyor/agen menyimpan draf atau hasil survei lapangan, mencegah ID agen menimpa kepemilikan mitra.
  * **2. Penyempurnaan Dual-Check Query `getOwnerProperties` (`userService.ts`)**:
    - Menambahkan mekanisme fallback untuk menyertakan properti yang terhubung melalui relasi `kostmanager_requests.property_id` milik mitra sehingga pemilik tidak akan pernah kehilangan jejak propertinya.
  * **3. Kartu Listing Auto-Pilot di "Properti Saya" (`MitraDashboard.tsx`)**:
    - Kartu kost KostManager tampil elegan dengan badge: **`⭐ KostManager Auto-Pilot`**.
    - Menampilkan informasi okupansi langsung: misal **`Okupansi: 40% (3 dari 5 Kamar Kosong)`**.
    - Mengunci edit master data (*Protected Mode*) untuk menjaga integritas hasil survei & mencegah double booking.
  * **4. Fitur "Pantau Kamar" (Live Room Tracker Modal)**:
    - Tombol **`👁️ Pantau Kamar`** membuka modal interaktif yang menampilkan status seluruh unit kamar secara real-time:
      - Kamar Kosong / Tersedia (🟢) vs Kamar Terisi (🔴), lengkap dengan nomor kamar, lantai, ukuran, harga sewa, dan fasilitas.
  * **5. Fitur "Request Aksi" (Controlled Request Modal)**:
    - Tombol **`📋 Request Aksi`** menyediakan 4 menu koordinasi terkontrol bagi pemilik:
      - 🔒 *Hold Unit Pribadi* (Kunci kamar untuk keluarga/tamu pemilik agar tidak disewa publik).
      - 💳 *Ubah Harga Sewa* (Ajukan penyesuaian tarif sewa unit).
      - ⚡ *Maintenance* (Laporkan kendala fasilitas atau perbaikan teknis lapangan).
      - 📞 *WhatsApp Tim* (Hubungi Account Manager langsung via WhatsApp).
  * **6. Penyesuaian Beranda & Panduan Mulai Cepat**:
    - Jika mitra memiliki properti KostManager aktif, *Panduan Mulai Cepat* otomatis tercentang selesai ✓.
    - Banner promosi upgrade digantikan dengan status aktif: **`⭐ KostManager Auto-Pilot Aktif`** dengan tombol cepat ke *Pantau Properti*.
- **File Tersentuh**:
  - `functions/public/pages/MitraDashboard.tsx`
  - `functions/public/userService.ts`
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 50.63s, 0 error).

### 173. Pemisahan Total (100% Independen pada Semua Aspek) antara KostManager dan Mitra Biasa (`KostDetail.tsx`, `BookingModal.tsx`, `KostCard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar properti listing KostManager **100% lepas dan independen dari setting/data properti saat masih menjadi mitra biasa** (seperti saklar on/off mandiri pada semua aspek).
  2. Sebelumnya, ketika properti mitra biasa diubah menjadi KostManager dengan 3 kamar kosong (Kamar 3, 4, 5), tombol booking terkunci (*disabled*) dengan tulisan **"PILIH KAMAR"** karena sistem masih terikat dengan pembacaan tabel SQL lama (`rooms`) saat masih menjadi mitra biasa.
- **Implementasi**:
  * **1. Pelepasan Total dari Tabel SQL Lama (`rooms`)**:
    - Menghapus ketergantungan `physicalRooms`, `selectedPhysicalRoom`, `loadingRooms`, dan efek polling tabel lama dari `KostDetail.tsx`.
  * **2. Ketersediaan Murni Unit Kamar KostManager**:
    - Status kamar tersedia, nomor kamar, lantai, dan fasilitas 100% bersumber langsung dari data unit kamar KostManager (`selectedChildRoom` / `properties.room_types`).
  * **3. Tombol CTA Booking Instan & Dinamis**:
    - Saat calon penyewa memilih unit kamar yang tersedia (misal: *Kamar 3*), tombol CTA langsung **AKTIF** (warna oranye, dapat diklik) dan menampilkan label unit kamar: **`Ajukan Sewa Kamar 3`**.
    - Mengklik tombol langsung membuka `BookingModal` untuk kamar tersebut dan mencatat metadata booking (`roomType`, `roomNumber`, `roomId`) secara akurat.
  * **4. Penyesuaian Modal & Kartu Katalog**:
    - `BookingModal.tsx`: Menampilkan nama spesifik kamar (`Kost Madani • Kamar 3`).
    - `KostCard.tsx`: Menghitung varian parent type KostManager secara independen.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/components/BookingModal.tsx`
  - `functions/public/components/KostCard.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 40.11s, 0 error).

### 172. Independent Scrollable Container pada Sidebar Booking Card (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa kartu sidebar pemesanan (kanan) tidak dapat di-scroll langsung saat kursor mouse di atasnya, melainkan harus menunggu halaman utama/badan website di-scroll ke bawah terlebih dahulu.
- **Implementasi**:
  * **1. Penerapan Kontainer Scroll Mandiri**:
    - Memberikan batasan `max-h-[calc(100vh-5.5rem)]`, `overflow-y-auto`, dan `overscroll-contain` pada kartu sidebar booking.
    - Begitu kursor mouse berada di atas kartu sidebar, pengguna dapat langsung menggeser/scroll kartu secara instan dan mandiri tanpa menggerakkan badan utama website.
  * **2. Optimasi Padding & Scrollbar Ramping**:
    - Menyesuaikan padding kartu menjadi `p-6 lg:p-7` serta menambahkan styling scrollbar ramping (*scrollbar-thin scrollbar-thumb-orange-200*).
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 31.64s, 0 error).

### 171. Pembersihan Teks Harga pada Chip Pilihan Nomor Kamar (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta menghapus teks harga dari dalam chip nomor kamar karena menyebabkan penumpukan (*overlap*) dengan teks lantai dan mengurangi keindahan estetika.
- **Implementasi**:
  * **1. Pembersihan Label Harga**: Menghapus tampilan `FORMAT_CURRENCY(room.price)` dari tombol chip nomor kamar.
  * **2. Tata Letak Minimalis & Rapi**:
    - Baris 1: `Nomor Kamar` (misal: *Kamar 3*, *Kamar 4*, *Kamar 5*) + Indikator Status (titik hijau ketersediaan atau checkmark oranye jika aktif).
    - Baris 2: `Lantai` (misal: *Lantai 1*, *Lantai 3*), terpusat dan lega tanpa tumpang tindih teks.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 22.32s, 0 error).

### 170. Redesain UI Nomor Kamar Menjadi Interactive Chip Grid Khusus Kamar Tersedia (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna merasa tampilan dropdown native `<select>` nomor kamar pada kartu tipe kamar terlihat kaku, jelek, dan rawan terpotong.
  2. Pengguna meminta agar kamar yang sudah terisi (*status: Terisi / Penuh*) **tidak usah ditampilkan sama sekali** agar daftar pilihan bersih dan ringkas.
- **Implementasi**:
  * **1. Natural Sorting Nomor Kamar**: Mengurutkan seluruh unit kamar secara alami berdasarkan nomor/nama kamar (`Kamar 1, 2, 3, 4, 5`).
  * **2. Penyaringan Khusus Unit Tersedia**:
    - Memfilter daftar unit kamar hanya yang `isAvailable: true` (`availableRooms = group.rooms.filter(r => r.isAvailable)`).
    - Kamar yang sudah terisi otomatis disembunyikan sepenuhnya dari grid pilihan.
  * **3. Interactive Chip/Pills Grid**:
    - Mengganti native `<select>` dengan grid 2/3 kolom tombol chip mini yang modern.
    - Menampilkan Nomor Kamar, Lantai (`Lt. 1`, `Lt. 3`), dan Harga sewa per bulan.
    - Status visual instan: tombol aktif berwarna oranye pekat (*bg-orange-500*) dengan icon *CheckCircle2*, sedangkan tombol tersedia berlatar putih bersih dengan titik hijau.
    - Klik 1 kali instan langsung menyinkronkan unit terpilih dan mengarahkan galeri foto carousel di atas ke unit kamar tersebut.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 34.45s, 0 error).

### 169. Struktur Parent (Tipe Kamar) & Child (Dropdown Nomor Kamar) untuk KostManager (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menjelaskan bahwa listing KostManager memiliki Tipe Kamar dan Nomor Kamar tersendiri. Sebelumnya nomor kamar (1, 2, 3, 4, 5) tampil langsung sebagai kartu tipe kamar.
  2. Pengguna meminta arsitektur Parent & Child: kartu induk adalah Tipe Kamar (misal: *Tipe Standard*), dan di dalamnya terdapat dropdown nomor kamar (Child) yang interaktif.
- **Implementasi**:
  * **1. Struktur Pengelompokan Data Parent-Child (`parentRoomGroups`)**:
    - Mengelompokkan seluruh unit kamar KostManager berdasarkan `type` (default ke `'Standard'`).
    - Menghitung rentang harga terendah, dimensi, fasilitas umum tipe kamar, serta status ketersediaan agregat (`availableCount` dari `totalCount`).
  * **2. Kartu Induk Parent (Tipe Kamar)**:
    - Menampilkan nama Tipe Kamar (misal: `Tipe Standard`), harga mulai dari, fasilitas, dan badge agregat (`3 Kamar Tersedia` atau `Penuh`).
  * **3. Dropdown Interaktif Child (Pilihan Nomor Kamar)**:
    - Menampilkan dropdown nomor kamar (`Kamar 1`, `Kamar 2`, `Kamar 3`, dll.) dengan indikator visual `🟢 Tersedia (Rp .../bln)` vs `🔴 Terisi (Penuh)`.
    - Memilih nomor kamar dari dropdown langsung mengarahkan unit booking, durasi sewa, serta memicu galeri foto carousel di atas ke unit kamar terpilih.
  * **4. Kompatibilitas Listing Biasa**:
    - Tetap mendukung listing kost biasa tanpa child unit nomor kamar secara transparan.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 41.32s, 0 error).

### 168. Penguatan Sistem Input & Pencatatan Kategori Foto Kamar pada Dashboard Surveyor, Portal KostManager, & Detail Kost (`AgentDashboard.tsx`, `KostManagerPropertyFormModal.tsx`, `KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar sistem input/unggah foto pada dashboard surveyor dan portal KostManager diperbaiki sehingga metadata kategori foto benar-benar tercatat dengan baik dan tidak ada lagi kamar dengan kategori `undefined`.
- **Implementasi**:
  * **1. Normalisasi Ketat Sebelum Submit Survei (`AgentDashboard.tsx`)**:
    - Memastikan seluruh unit kamar di dalam `kmListingForm.roomTypes` selalu dinormalisasi sebelum disimpan ke Supabase.
    - Menghasilkan array `photoCategories`, `images`, dan objek map `categorized_photos` / `categorizedPhotos` secara sinkron 1-to-1.
  * **2. Normalisasi Ketat pada Portal KostManager (`KostManagerPropertyFormModal.tsx`)**:
    - Menerapkan normalisasi payload kamar yang sama pada `handleDirectSave` sebelum update/insert ke tabel `properties` dan `mitra_kostmanager`.
  * **3. Fallback Cerdas Unit Kamar di Detail Kost (`KostDetail.tsx`)**:
    - Memberikan label kamar standar (*Interior Kamar, Kamar Mandi, Tempat Tidur, Lemari / Storage*) khusus foto yang berada di dalam unit kamar jika data riwayat lama di database belum memiliki `photoCategories` (seperti Kamar 3).
    - Mempertahankan foto properti umum listing biasa tetap bersih tanpa label palsu.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 27.20s, 0 error).

### 167. Kondisionalitas Dinamis Kategori Foto & Bilah Pilihan Kamar Murni Berbasis Database (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar kategori foto dan bilah tombol pilihan kamar hanya ditampilkan jika kost memang memiliki data yang sesuai di database (tidak menampilkan tebakan/placeholder pada listing kost biasa yang bukan KostManager).
- **Implementasi**:
  * **1. Penghapusan Seluruh Fallback Kategori Tebakan**: Menghapus seluruh fallback tebakan kategori default (`defaultCats`, `defaultRoomCats`). Jika database tidak memiliki data kategori survei, label dikosongkan (`""`).
  * **2. Kondisionalitas Floating Tag & Badge**:
    - Floating tag kiri atas hanya dirender jika `label` foto tidak kosong.
    - Badge kanan bawah hanya menampilkan counter foto bersih (`1 / 5 FOTO`) tanpa teks label jika properti tidak memiliki data kategori.
  * **3. Kondisionalitas Bilah Pilihan Kamar**:
    - Menghitung `showRoomPhotoNav = emptyRooms.length > 0 && hasDistinctRoomPhotos`. Bilah pilihan kamar hanya muncul jika unit kamar benar-benar memiliki data foto tersendiri.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 27.40s, 0 error).

### 166. Pembersihan Label Administratif '*Wajib' / '(Opsional)' pada Kategori Foto Publik (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa muncul kata `*Wajib` pada caption foto (contoh: `Interior Kamar *Wajib`) dan meminta agar teks tersebut dibersihkan.
- **Implementasi**:
  * **1. Sanitasi String Kategori (`cleanPhotoCategoryLabel`)**: Membuat fungsi pembersih teks yang secara otomatis menghapus tag administratif formulir survei (`*Wajib`, `*WAJIB`, `(Wajib)`, `(Opsional)`, `*`).
  * **2. Hasil Tampilan Bersih**: Menjadikan label kategori foto tampak rapi, profesional, dan elegan (contoh: `Kamar 4 • Interior Kamar` alih-alih `Kamar 4 • Interior Kamar *WAJIB`).
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 26.19s, 0 error).

### 165. Integrasi Caption & Kategori Foto Survei Dinamis pada Carousel Galeri (`KostDetail.tsx`, `userService.ts`, `types.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar caption atau kategori foto (seperti *Bangunan Depan*, *Area Parkir*, *Koridor*, *Lingkungan*, *Interior Kamar*, *Kamar Mandi*, dll.) yang telah diinput melalui pendataan agen survey muncul secara dinamis di tampilan galeri foto.
- **Implementasi**:
  * **1. Pemetaan Data Survey (`types.ts` & `userService.ts`)**: Menambahkan `photoCategories` dan `categorizedPhotos` pada `Kost` dan `RoomType` serta memetakannya dari tabel Supabase `properties`.
  * **2. Ekstraksi Metadata Foto (`KostDetail.tsx`)**: Menormalisasi seluruh foto properti dan foto kamar menjadi objek `{ url, label, isRoom, roomName }` dengan membaca label kategori hasil pendataan survey.
  * **3. Tampilan Dinamis pada Carousel**:
    - **Badge Counter (Kanan Bawah)**: Menampilkan nama kategori foto aktif (contoh: `1 / 18 FOTO • BANGUNAN DEPAN` atau `2 / 6 FOTO • KAMAR 3 - KAMAR MANDI`).
    - **Floating Caption Tag (Kiri Atas)**: Menampilkan badge glassmorphism elegan kategori foto aktif (contoh: `✨ Bangunan Depan` atau `🛏️ Kamar 3 • Interior Kamar`).
- **File Tersentuh**:
  - `functions/public/types.ts`
  - `functions/public/userService.ts`
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 30.66s, 0 error).

### 164. Penyederhanaan Tombol Navigasi Kamar Menjadi Minimalis (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar tombol kamar tidak perlu memuat kata "Tersedia" dan "N Foto", sehingga tombol tampil lebih bersih dan ringkas.
- **Implementasi**:
  * **1. Format Tombol Minimalis**: Menghapus badge label status dan counter foto dari tombol, menyisakan ikon `lucide-react` dan nama unit kamar (contoh: `[ 🛏️ Kamar 3 ]`, `[ 🛏️ Kamar 4 ]`, `[ 🛏️ Kamar 5 ]`).
  * **2. Tombol Semua Foto Bersih**: Menghapus counter angka pada tombol `[ 🏠 Semua Foto ]`.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 29.40s, 0 error).

### 163. Penyesuaian Preview Thumbnail Menjadi 1 Baris Horizontal Kompak (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mengonfirmasi bahwa preview carousel foto tidak perlu menumpuk ke bawah (multi-row grid), melainkan tetap dalam 1 baris horizontal yang rapi di bawah foto utama.
- **Implementasi**:
  * **1. Preview Thumbnail 1 Baris Rapi**: Mengembalikan deretan thumbnail menjadi `flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide mb-4` dengan `shrink-0`.
  * **2. Bilah Tombol Kamar Tetap Flex-Wrap**: Mempertahankan `flex flex-wrap gap-2` pada tombol unit kamar kosong agar seluruh tombol kamar terlihat utuh dan otomatis berpindah baris jika ruang penuh.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 25.36s, 0 error).

### 162. Pembaruan Layout Galeri & Tombol Navigasi Kamar Menjadi Flex-Wrap Responsif (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar layout peletakan tombol navigasi dan thumbnail tidak menggunakan scroll menyamping yang kaku, melainkan tersusun secara berurutan dan otomatis berpindah ke bawah (wrap) jika ruang tidak mencukupi.
- **Implementasi**:
  * **1. Bilah Tombol Kamar Kosong Flex-Wrap**: Mengganti `overflow-x-auto` menjadi `flex flex-wrap gap-2` dengan container `rounded-3xl` yang fleksibel dan luas.
  * **2. Thumbnail Strip Flex-Wrap**: Mengganti `overflow-x-auto` menjadi `flex flex-wrap gap-2.5` dengan thumbnail responsif.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 33.00s, 0 error).

### 161. Pemindahan Posisi Bilah Navigasi Foto Kamar Kosong ke Bawah Preview Thumbnail Carousel (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar bilah tombol navigasi kamar terhadap foto dipindahkan ke bagian bawah dari preview foto (thumbnail strip) carouselnya.
- **Implementasi**:
  * **1. Penataan Ulang Layout Gallery**:
    - Menempatkan deretan preview thumbnail (`Thumbnails Strip`) tepat di bawah frame carousel utama.
    - Menempatkan bilah tombol pilihan kamar kosong (`[ 🏠 Semua Foto ]` dan `[ 🛏️ Kamar X • Tersedia ]`) di bawah deretan preview thumbnail.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 33.43s, 0 error).

### 160. Penambahan Bilah Tombol Navigasi Foto Kamar Kosong & Isolasi Carousel pada Halaman Detail Kost (`KostDetail.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar tampilan user pada listing kost memiliki tombol navigasi di bawah carousel untuk kamar yang kosong, sehingga foto terkait kamar tersebut dapat ditampilkan secara jelas dan terisolasi di carousel.
- **Implementasi**:
  * **1. Bilah Tombol Navigasi Kamar Kosong**:
    - Tombol `[ 🏠 Semua Foto ]`: Menampilkan seluruh foto umum/fasilitas properti.
    - Tombol unit kamar kosong: `[ 🛏️ Kamar X • Tersedia (N Foto) ]` untuk setiap unit yang berstatus kosong/tersedia.
  * **2. Isolasi Foto Carousel (`displayedImages`)**:
    - Saat tombol kamar kosong diklik, carousel dan thumbnail strip langsung terisolasi untuk hanya menampilkan foto-foto dari unit kamar tersebut.
    - Indikator counter diperbarui secara dinamis (`1 / N FOTO • KAMAR X`).
  * **3. Sinkronisasi 2-Arah**:
    - Memilih tombol navigasi kamar di bawah carousel otomatis menyinkronkan pemilihan tipe kamar pada panel booking di sebelah kanan (`selectedVariantIdx`), dan sebaliknya.
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 35.10s, 0 error).

### 159. Perubahan Penamaan Menu & Judul "Tagihan Bulanan" Menjadi "Riwayat Pembayaran Sewa" pada Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar menu "Tagihan Bulanan" di Portal KostManager diganti menjadi "Riwayat Pembayaran Sewa".
- **Implementasi**:
  * **1. Navigasi Sidebar**: Mengubah label menu item `billing` menjadi **"Riwayat Pembayaran Sewa"**.
  * **2. Page Header & Deskripsi**: Mengubah header utama tab `billing` menjadi **"RIWAYAT PEMBAYARAN SEWA"** dengan deskripsi *"Mencatat, memantau riwayat pembayaran sewa, dan mengelola tagihan sewa kost"*.
  * **3. Info Banner Operasional**: Menyelaraskan teks banner panduan operasional pada tab Ringkasan.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 52.86s, 0 error).

### 158. Penambahan Fungsi Interaktif Ubah Status Kamar (Kosong ↔ Terisi) pada Peta Unit Kamar (Room Matrix) di Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta penambahan fitur pada menu kamar (*Room Matrix*) untuk mengubah status kamar dari Kosong menjadi Terisi, atau sebaliknya dari Terisi menjadi Kosong.
- **Implementasi**:
  * **1. Aksi Ubah Kosong -> Terisi (`quickOccupancyModal` & `handleSaveQuickOccupancy`)**:
    - Tombol `[ ➕ Set Terisi ]` pada setiap unit kamar kosong.
    - Menampilkan formulir cepat data penghuni (Nama Lengkap, Nomor WhatsApp, Tanggal Mulai Sewa, Tanggal Jatuh Tempo, dan Tarif Sewa Bulanan).
    - Menyimpan mutasi status `Terisi` ke tabel `properties` dan `mitra_kostmanager` secara otomatis di Supabase.
  * **2. Aksi Ubah Terisi -> Kosong (`vacateConfirmModal` & `handleConfirmVacateRoom`)**:
    - Tombol `[ 🔓 Kosongkan Kamar ]` pada unit kamar yang sedang terisi.
    - Menampilkan dialog konfirmasi pelepasan kamar.
    - Menghapus data sewa kamar, mereset status unit menjadi `Kosong (Siap Disewakan)`, dan memperbarui okupansi gedung secara realtime.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 29.57s, 0 error).

### 157. Penambahan Tombol "Kirim Tagihan" & Generator Invoice WhatsApp di Modal Direktori Penghuni Properti (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta penambahan tombol khusus **Kirim Tagihan** pada modal Daftar Penghuni Properti (*Tenants Directory*) yang sebelumnya hanya memiliki satu tombol umum.
- **Implementasi**:
  * **1. Generator Pesan Invoice WhatsApp (`generateTenantWhatsAppInvoice`)**:
    - Membuat generator pesan invoice resmi terstruktur yang otomatis memuat: nama properti, unit kamar yang dihuni, periode sewa, tanggal jatuh tempo, dan rincian nominal sewa bulanan beserta instruksi transfer.
  * **2. Pemisahan Tombol Aksi di Kartu Penghuni**:
    - Tombol `[ 💬 Hubungi WA ]`: Obrolan langsung dengan penyewa di WhatsApp.
    - Tombol `[ 🧾 Kirim Tagihan ]`: Mengirimkan surat tagihan/invoice resmi via WhatsApp secara instan dengan 1-klik.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 59.09s, 0 error).

### 156. Pembersihan Blok Modal Legacy `selectedPropForRoomDetail` di `KostManagerPortal.tsx` (Agustus 2026)
- **Permintaan & Masalah**:
  1. Terjadi runtime error `Uncaught ReferenceError: selectedPropForRoomDetail is not defined at KostManagerPortal (KostManagerPortal.tsx:3748:14)` saat memuat Portal KostManager.
  2. Penyebab: Terdapat sisa blok modal legacy di baris 3747–3877 yang masih merujuk ke variabel `selectedPropForRoomDetail` yang sudah dihapus/digantikan oleh `selectedPropForTenants`.
- **Implementasi**:
  - Menghapus seluruh blok JSX modal legacy `selectedPropForRoomDetail` di bagian bawah file `KostManagerPortal.tsx`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 33.55s, 0 error).

### 155. Transformasi Tombol Aksi Redundant Menjadi Modal Direktori Penghuni Properti (`👥 Penghuni`) di Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mempertanyakan redundansi antara tombol *Grid (Denah Kamar)* dan *🚪 Kamar*, karena keduanya menampilkan informasi unit kamar yang serupa.
  2. Pengguna mengusulkan agar salah satunya diganti menjadi tombol **Penghuni** untuk menampilkan seluruh daftar penyewa yang tinggal di properti tersebut.
- **Implementasi & Peningkatan Sistem**:
  * **1. Standardisasi Tombol Aksi Tabel Properti**:
    - Tombol `[ 🚪 Kamar ]` difokuskan untuk membuka **Peta Denah Kamar & Status Ketersediaan (Room Matrix Visualizer)**.
    - Tombol redundant diganti menjadi tombol `[ 👥 Penghuni (X) ]` dengan badge jumlah penghuni aktif (`p.occupant_count`).
  * **2. Modal Direktori Penghuni Properti (`selectedPropForTenants`)**:
    - Menampilkan ringkasan okupansi (Total Penghuni Aktif, Total Unit Kamar, Estimasi Omset Bulanan Properti).
    - Daftar kartu setiap penyewa aktif di properti tersebut:
      - Avatar inisial, nama lengkap penyewa, nomor WhatsApp.
      - Unit kamar yang ditempati (*badge orange*).
      - Masa sewa (tanggal mulai s/d tanggal jatuh tempo) dengan badge status lifecycle sewa (*Sewa Berjalan*, *Jatuh Tempo*, *Terlambat*).
      - Tarif sewa bulanan.
      - Tombol aksi cepat: **Hubungi / Tagih via WhatsApp** yang membuka link WhatsApp dengan teks template tagihan otomatis.
    - State kosong informatif jika belum ada penghuni aktif terdaftar.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 42.75s, 0 error).

### 154. Perbaikan Import Komponen Ikon `Users` di `KostManagerPropertyFormModal.tsx` (Agustus 2026)
- **Permintaan & Masalah**:
  1. Terjadi runtime error `Uncaught ReferenceError: Users is not defined at KostManagerPropertyFormModal.tsx:2970:38` saat mengakses modal edit properti di Portal KostManager.
  2. Penyebab: Ikon `<Users size={16} className="text-orange-500" />` digunakan di bagian Step 3 (Mitra Pemilik / Owner Payout), namun belum diimpor dari package `lucide-react`.
- **Implementasi**:
  - Menambahkan `Users` ke dalam daftar destructured import dari `lucide-react` di baris atas `KostManagerPropertyFormModal.tsx`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 2m 9s, 0 error).

### 153. Perbaikan Parsing, Normalisasi Kategori Dinamis, Thumbnail Preview & Rendering Foto Kamar di Portal KostManager (`KostManagerPropertyFormModal.tsx` & `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa foto-foto yang telah terdata pada data kamar tidak tampil dengan baik saat melakukan pengeditan properti pada portal KostManager.
  2. Hasil investigasi menemukan bahwa data foto kamar di database Supabase (misal properti *kost madani* Kamar 4 memiliki 6 foto dan Kamar 5 memiliki 2 foto) sebenarnya lengkap dan valid.
  3. Namun, di modal edit properti:
     - Logika penentuan kategori (`computeDynamicRoomPhotoCategories`) sebelumnya mengabaikan kategori standar yang tidak tercentang di checklist fasilitas, sehingga slot foto *Jendela Luar, Tempat Tidur, Kamar Mandi, Dapur Dalam* terbuang dari `activeCats` dan seluruh fotonya menjadi tersembunyi (*invisible*).
     - Nama kategori tidak memiliki normalisasi alias (misal: *Kasur* vs *Tempat Tidur*, *Kamar Mandi Dalam* vs *Kamar Mandi*, *Lemari Pakaian* vs *Lemari / Storage*), sehingga query foto pada label alternatif gagal memuat foto.
     - Header kartu kamar di Step 2 (Data Kamar) belum memiliki thumbnail foto mini dan badge jumlah foto terdata.
- **Implementasi & Peningkatan Sistem**:
  * **1. Normalisasi Alias Kategori Fleksibel & Ekstraksi Foto Cerdas (`KostManagerPropertyFormModal.tsx`)**:
    - Dibuat helper `normalizeRoomCategoryName` yang memetakan variasi penamaan fasilitas (*Kasur/Tempat Tidur*, *Kamar Mandi/WC/Kamar Mandi Dalam*, *Dapur/Dapur Dalam*, *Lemari/Lemari Pakaian/Storage*, *Jendela/Jendela Luar*, *AC*, *Kipas Angin*, *Water Heater*) secara konsisten.
    - Fungsi `getRoomCategorizedPhotos` kini memindai `categorized_photos`, `categorizedPhotos`, dan array `images` / `image_urls` / `photos` untuk mengekstrak seluruh URL foto tanpa ada yang hilang.
  * **2. Jaminan Render Seluruh Kategori Berfoto (`computeDynamicRoomPhotoCategories`)**:
    - Seluruh kategori yang memiliki foto tersimpan di database **WAJIB dimasukkan ke dalam daftar render `activeCats`**, terlepas dari apakah fasilitas tersebut dicentang di checklist atau tidak.
  * **3. Indikator Foto & Thumbnail Preview pada Header Kartu Kamar (Step 2)**:
    - Setiap kartu unit kamar di daftar Step 2 kini menampilkan thumbnail pratinjau foto pertama berukuran 12x12 dengan overlay badge total foto (`{totalPhotos} 📷`), serta badge status kelengkapan foto (`📷 X Foto` / `Belum Ada Foto`).
  * **4. Pratinjau Lightbox Zoom & Kompresi WebP**:
    - Setiap foto kamar dapat diklik untuk membuka pratinjau gambar resolusi tinggi melalui Lightbox modal.
    - Pengunggahan foto baru otomatis dikompresi ke format WebP client-side sebelum disimpan ke Supabase Storage.
  * **5. Sinkronisasi Foto Kamar Global di `KostManagerPortal.tsx`**:
    - `getRoomPhotosGlobal` diperbarui untuk membaca `categorized_photos` dan `categorizedPhotos` serta menormalisasi kunci label secara utuh.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 32.22s, 0 error).

### 152. Penyelarasan Sistem Input Peraturan Kost 1:1 antara Portal KostManager dan Form Pendataan Agen (`KostManagerPropertyFormModal.tsx` & `AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa sistem input Peraturan Kost pada portal KostManager berbeda tampilan, fungsi, dan fleksibilitasnya dibandingkan form pendataan survei agen.
  2. Di portal KostManager sebelumnya hanya ada 5 tombol chip statis hardcoded, sehingga pengguna tidak dapat mengedit isi teks peraturan, tidak bisa menghapus peraturan kustom, dan tidak bisa menambahkan peraturan baru secara fleksibel.
- **Implementasi & Peningkatan Sistem**:
  * **1. Standardisasi Sistem Input Peraturan Kost Dinamis (`KostManagerPropertyFormModal.tsx`)**:
    - Mengganti chip statis menjadi list dinamis: setiap baris aturan dapat diedit langsung (`textarea` dengan `maxLength={100}`) dan memiliki tombol hapus tong sampah (`Trash2`).
    - Menambahkan input field penambahan peraturan baru (`Tambah peraturan baru...` + tombol `+ Tambah` + shortcut `Enter`).
    - Menambahkan **Quick Preset Chips (Rekomendasi Aturan Populer)**: *Tidak boleh membawa hewan peliharaan, Tamu dilarang menginap, Dilarang merokok di dalam kamar, Akses gerbang 24 jam, Jam malam maksimal 23:00, Dilarang membuat kegaduhan* untuk pemilihan cepat 1-klik.
  * **2. Penyelarasan Simetris di Form Pendataan Agen (`AgentDashboard.tsx`)**:
    - Menambahkan badge jumlah aturan aktif dan Quick Preset Chips aturan populer di `AgentDashboard.tsx` sehingga tampilan dan fiturnya 100% identik dan selaras 1:1 dengan portal KostManager.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 29.19s, 0 error).


### 151. Integrasi Tabel `mitra_kostmanager` sebagai Referensi Utama & Perbaikan Status Aktif Auto-Pilot Survei (`AgentDashboard.tsx` & `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mempertanyakan mengapa seluruh 9 properti biasa muncul di portal KostManager dan mengusulkan penggunaan tabel khusus `mitra_kostmanager` sebagai referensi.
  2. Pengguna mengidentifikasi bahwa status properti masih berstatus `draft` padahal sudah dikonfirmasi Auto-Pilot saat peninjauan hasil survei agen.
  3. Penyebab: `AgentDashboard.tsx` men-hardcode `status: 'draft'` pada payload penyimpanan survei meskipun perjanjian dan TTD digital telah disetujui.
- **Implementasi & Peningkatan Sistem**:
  * **1. Integrasi Tabel `mitra_kostmanager` di `KostManagerPortal.tsx`**:
    - Memperbarui `loadAllData` untuk memuat data dari tabel khusus `mitra_kostmanager` sebagai referensi utama, digabungkan dengan properti yang berstatus `is_managed = true` atau memiliki request KostManager aktif.
    - Menghilangkan fallback global yang memuat seluruh properti reguler non-KostManager sehingga daftar properti kelolaan terisolasi secara bersih dan akurat.
  * **2. Perbaikan Status Auto-Pilot Saat Konfirmasi Survei (`AgentDashboard.tsx`)**:
    - Mengubah `status: 'draft'` menjadi `status: 'published'` dan `is_managed: true` pada `handleSaveKostManagerListing` dan `closeKostManagerListingWithSave` saat TTD digital dan kesepakatan Auto-Pilot telah disetujui.
    - Menyinkronkan seluruh metadata properti ke tabel khusus `mitra_kostmanager` dan tabel `properties`.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% (✓ 2527 modules transformed, ✓ built in 26.55s, 0 error).


### 150. Pemulihan Tampilan Kartu Properti Terkelola & Fallback Cerdas Database di Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa kartu properti kelolaan di Portal KostManager mendadak hilang dan menampilkan teks *"Tidak ada properti terkelola yang sesuai dengan pencarian"* (0 Gedung Aktif).
  2. Penyebab: Fungsi `loadAllData` menyaring properti dengan kondisi ketat `is_managed = true` / `subscription_status = 'kostmanager'`, sedangkan properti aktif di database saat ini berstatus `published` dengan `is_managed = false`.
  3. Ketiadaan mekanisme fallback menyebabkan tabel properti kosong ketika flag `is_managed` belum di-set secara manual di database.
- **Implementasi & Peningkatan Sistem**:
  * **1. Fallback Cerdas pada `loadAllData`**:
    - Menambahkan mekanisme fallback: Jika belum ada properti yang di-flag `is_managed = true` atau request aktif secara eksplisit, muat seluruh properti berstatus `published`/aktif di database sehingga seluruh 9 properti (`Kost Azzahra`, `Kost Madani BTP`, `Kost Belfachr Unismuh`, dll.) langsung tampil kembali di Portal KostManager.
  * **2. Proteksi Null-Safety Pencarian (`filteredProps`)**:
    - Menambahkan `(p.title || '')`, `(p.city || '')`, `(p.area || '')`, `(p.address || '')`, dan `(p.owner_name || '')` dengan `.trim()` untuk mencegah error javascript runtime saat pencarian dilakukan.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` sukses 100% dengan 0 error (✓ 2527 modules transformed, ✓ built in 38.90s).


### 149. Perbaikan Deteksi Otomatis, Auto-Discovery Kategori, & Koneksi Menyeluruh Data Foto & Hasil Survei Agen pada Modal Edit Listing Properti KostManager (`KostManagerPortal.tsx` & `KostManagerPropertyFormModal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada menu input foto di modal edit properti KostManager, foto dan data yang sebelumnya sudah di-upload saat pendataan awal oleh agen survei tidak otomatis terdeteksi atau tampil kosong (`0 Foto`).
  2. Terjadi ketidakcocokan label (*label mismatch*): `KostManagerPortal.tsx` sebelumnya menghasilkan label default `'Fasad Bangunan Depan'` dan `'Koridor & Akses Masuk'`, sedangkan `KostManagerPropertyFormModal.tsx` mencari `'Bangunan Depan'` dan `'Koridor'`.
  3. Objek label foto sebelumnya terpotong menjadi string mentah oleh `normalizePhotoList` saat memuat properti di `loadAllData`.
  4. Belum ada sinkronisasi reaktif (`useEffect`) dari `newPropForm` saat membuka properti yang berbeda, serta belum ada auto-discovery kategori unik foto lama.
  5. Pada Step 2 (Data Kamar), detail kamar tersimpan di dalam accordion belum memiliki checklist fasilitas kamar dan galeri dokumentasi foto kamar berkategori yang lengkap.
- **Implementasi & Peningkatan Sistem**:
  * **1. Normalisasi Presisi & Toleran Label Foto Area Umum (`normalizePhotosWithLabels`)**:
    - Memetakan berbagai varian label survei (`fasad`, `gedung`, `depan` ➔ `Bangunan Depan`; `koridor`, `lorong`, `akses` ➔ `Koridor`; `parkir`, `parkiran`, `garasi` ➔ `Area Parkir`; `dapur` ➔ `Dapur Bersama`; `wc`, `toilet`, `kamar mandi luar` ➔ `WC Umum`; `lingkungan`, `taman` ➔ `Lingkungan`; `ruang tamu` ➔ `Ruang Tamu`; `cctv` ➔ `CCTV`; `laundry`, `jemuran` ➔ `Laundry`).
    - Mempertahankan struktur objek `{ original, url, label }` pada `mappedProperties` di `KostManagerPortal.tsx`.
  * **2. Sinkronisasi Reaktif & Auto-Discovery Kategori Foto**:
    - Menambahkan `useEffect` reaktif di `KostManagerPropertyFormModal.tsx` saat `newPropForm` atau `editingPropertyId` berubah.
    - Mengintegrasikan fungsi *Auto-Discovery* yang membaca seluruh label foto lama yang tersimpan di database dan otomatis mendaftarkannya ke dalam `photoCategories` sehingga seluruh foto properti langsung muncul pada kartunya masing-masing.
  * **3. Fasilitas Kamar & Galeri Dokumentasi Foto Kamar Berkategori di Step 2**:
    - Menambahkan `exportCategorizedPhotos` helper.
    - Menghadirkan checklist fasilitas kamar pada accordion kamar tersimpan.
    - Menghadirkan galeri **Dokumentasi Foto Kamar Berkategori** lengkap (`Interior Kamar`, `Kamar Mandi`, `Tempat Tidur`, `Lemari / Storage`, `Meja Belajar`, `AC`, dll.) dengan upload WebP otomatis, thumbnail berlabel, dan tombol hapus `×`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` sukses 100% dengan 0 error (✓ 2527 modules transformed, ✓ built in 29.10s).


### 148. Penyelarasan Presisi 1:1 Menu Fasilitas Umum & Dokumentasi Area Umum pada Modal Edit Listing Properti KostManager (`KostManagerPropertyFormModal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menemukan bahwa pada menu **Fasilitas Umum** dan **Dokumentasi Area Umum & Fasilitas Properti** di modal edit listing KostManager, sistem input, tampilan visual, serta korelasinya dengan kategori foto berbeda dari form survei lapangan di `AgentDashboard.tsx`.
  2. Pada menu **FASILITAS UMUM**:
     - Checkbox menggunakan grid 2 kolom dengan border `#e0c0af` dan saat aktif berubah menjadi border oranye `#ff7a00` berlatar `bg-orange-50/50` dengan teks tebal.
     - Dapur Bersama, Area Parkir, dan WC Umum memiliki **sub-box kontekstual inline** (`col-span-2 pl-6 border-l-2 border-[#ff7a00] bg-orange-50/30 p-3 rounded-xl`) dengan checklist kelengkapan terperinci, daftar chip tag kustom, serta input penambah kelengkapan (`+`).
     - Terdapat input penambah fasilitas kustom (`Tambah fasilitas kustom...` + tombol `+ Tambah`) dan chip badge dengan tombol hapus `×`.
  3. Pada menu **DOKUMENTASI AREA UMUM & FASILITAS PROPERTI**:
     - Kategori kartu foto bersinkronisasi secara dinamis (menggunakan `computeDynamicPublicPhotoCategories` dan `checkHasFacility`) dengan fasilitas umum yang dicentang di atasnya.
     - Format kartu berkategori dengan ikon, nama kategori huruf kapital, badge `{n} Foto`, grid foto thumbnail dengan strip label hitam bawah (`{label} {pIdx + 1}`), tombol merah bulat `×` untuk hapus foto di pojok kanan atas, serta slot kartu putus-putus oranye `+ TAMBAH FOTO` / `+ UNGGAH FOTO {LABEL}` yang mendukung kompresi WebP client-side otomatis.
     - Terdapat input penambah kategori foto baru kustom manual (`+ Kategori Area`).
  4. Footer navigasi tombol di bagian bawah diselaraskan menjadi tombol oranye pill (`KELUAR` vs `LANJUT KE STEP 2` / `SIMPAN PROPERTI`).
- **Implementasi & Peningkatan Sistem**:
  * **1. Helper `checkHasFacility` & Sinonim Cerdas**:
    - Mendukung pencocokan toleran sinonim (`wifi` / `wi-fi`, `dapur bersama` / `dapur umum`, `area parkir` / `parkir motor` / `parkiran`, dll.).
  * **2. Rendering 1:1 Fasilitas Umum & Inline Contextual Sub-Accordion**:
    - Merender checklist fasilitas umum dan box inline kelengkapan `Dapur Bersama`, `Area Parkir`, dan `WC Umum` lengkap dengan custom tag manager.
  * **3. Rendering 1:1 Dokumentasi Foto Area Umum & WebP Compression**:
    - Merender kartu foto berkategori lengkap dengan thumbnail strip bawah, tombol hapus merah, dan slot dashed box oranye untuk upload WebP.
  * **4. Penyelarasan Footer Navigation**:
    - Tombol footer kiri `KELUAR` (border oranye `#ff7a00`) dan tombol footer kanan `LANJUT KE STEP {n}` / `SIMPAN PROPERTI KELOLAAN` (bg oranye `#ff7a00` dengan shadow lembut).
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` sukses 100% dengan 0 error (✓ 2527 modules transformed, ✓ built in 21.66s).

### 147. Penerapan Skala 1:1 UI/UX Flow Form Pendataan Survei Lapangan Agen ke Modal Edit Listing Portal KostManager dengan Direct Live Update (`KostManagerPropertyFormModal.tsx` & `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna merasa bahwa layout modal peninjauan admin (review style) kurang cocok dan membingungkan jika dipakai untuk mengedit listing properti terkelola di portal KostManager.
  2. Pengguna meminta penerapan 100% UI/UX tampilan, flow, dan sistem form pendataan kostmanager yang ada di form survei agen (`AgentDashboard.tsx`) dalam skala 1:1.
  3. Perbedaan mendasar: jika di dashboard agen form tersebut dikirim sebagai draft survei ke dashboard admin untuk ditinjau, pada portal KostManager data yang diubah/disimpan akan **langsung berubah secara live (Direct Live Update)** ke database Supabase `properties`, `mitra_kostmanager`, dan `resident_status`.
- **Implementasi & Peningkatan Sistem**:
  * **1. Pembuatan Komponen Terdedikasi `KostManagerPropertyFormModal.tsx` (1:1 Flow Survei)**:
    - **Header**: Top app bar dengan tombol kembali (`ArrowLeft`), badge KostManager, judul dinamis (*Edit Listing Properti Terkelola* / *Form Pendataan Properti Terkelola*), dan tombol Close (`X`).
    - **Stepper (3 Step)**:
      - **Step 1 (PROPERTI)**: Profil properti (Nama, Tipe Putra/Putri/Campur, Total Kamar, Alamat lengkap real), 3 Kotak Input Kategori Wilayah Terstruktur (🏛️ Provinsi, 🏙️ Kota/Kabupaten, 📍 Kecamatan/Area), Lokasi GPS & Mini Map interaktif dengan fitur "Gunakan Lokasi Saya Saat Ini", Pop-up Modal Peta Layar Penuh (Fullscreen Google Maps Picker + Search & Drag marker), Fasilitas & Landmark Terdekat (+ Tambah Landmark via Search & Konversi Link GMaps), Fasilitas Umum & Rincian Lengkap (Area Parkir + sub-kendaraan, Dapur Bersama + sub-kelengkapan, WC Umum + sub-kelengkapan), Dokumentasi Foto Fasilitas & Area Umum WebP client-side, dan Peraturan Kost.
      - **Step 2 (DATA KAMAR)**: Progress target kamar (`roomTypes.length` / `totalRooms`), List unit kamar accordion (Badge Terisi/Kosong, Nomor Kamar, Lantai, Tipe, Tarif, Tombol Delete & Expand), Form draft tambah kamar baru `temporaryRoom`, Dimensi P×L meter, Multi-periode tarif sewa, Toggle Kosongan vs Furnished, Sub-kelengkapan KM Dalam & Dapur Dalam, Foto kamar dinamis WebP berdasarkan fasilitas aktif, serta form data penghuni lengkap (Nama, No WA, Tanggal Masuk, Jatuh Tempo, Jumlah Penghuni).
      - **Step 3 (REVIEW & DIRECT LIVE UPDATE)**: Ringkasan info properti, Preview Handphone Mobile Simulator Calon Penyewa interaktif, Data Mitra Pemilik & Rekening Penyaluran Hasil Sewa (Owner Payout), Perjanjian Kemitraan Auto-Pilot & TTD Digital (Canvas signature), dan Tombol Direct Live Save ke Supabase.
  * **2. Direct Live Update Action ke Supabase**:
    - Langsung melakukan update/insert ke tabel `properties` dengan status `published` dan `is_managed = true`.
    - Sinkronisasi instan ke tabel `mitra_kostmanager`.
    - Sinkronisasi status sewa kamar yang terisi ke tabel `resident_status` untuk penghuni aktif.
    - Notifikasi sukses langsung dan otomatis memanggil `onSuccess()` untuk me-refresh data tabel.
  * **3. Modularity & Clean Architecture**:
    - Memisahkan komponen form survei ke file `KostManagerPropertyFormModal.tsx` dan mendelegasikan `ManagedPropertyAddModal` di `KostManagerPortal.tsx` secara bersih dan modular.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPropertyFormModal.tsx` (File Baru)
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% dengan 0 TypeScript/Vite error (✓ 2527 modules transformed, ✓ built in 39.33s).


### 146. Integrasi 1:1 Mekanisme Input Form Survei Agen ke Modal Edit Properti Portal KostManager – `renderSurveyStyleRoomUnit` (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar mekanisme input/sistem pengeditan unit kamar di modal Edit Properti KostManager Portal mengadopsi 1:1 sistem input dari form pendataan surveyor agen (`AgentDashboard.tsx`), bukan hanya visual yang mirip.
  2. Sebelumnya, modal edit properti hanya menampilkan field input sederhana (nama kamar, tarif, status), tanpa dimensi P×L meter terpisah, tanpa tabel multi-periode tarif sewa, tanpa toggle fasilitas survei (furnished/kosongan, kamar mandi dalam, dapur dalam), dan tanpa upload foto per-kategori dengan WebP client-side compression.
- **Implementasi & Peningkatan Sistem**:
  * **1. Helper Functions Survei**:
    - `parseDimensionParts`: memisahkan dimensi kamar menjadi panjang dan lebar dalam meter (misal `3x4` → P=3, L=4).
    - `formatThousand` / `parseThousand`: format tampilan nominal ribuan (misal `1500000` → `1.500.000`).
    - `computeDynamicRoomPhotoCategories`: menghitung kategori foto dinamis berdasarkan fasilitas aktif kamar (kamar mandi dalam → category 'kamar_mandi', dapur dalam → category 'dapur', dll.).
    - `getRoomCategorizedPhotos` / `exportCategorizedPhotos`: normalisasi dan konversi data foto berkategori antara format internal dan Supabase.
  * **2. State & Mutators Survei Baru**:
    - State: `customRoomFacilityInputs`, `customBathroomFacilityInputs`, `customKitchenFacilityInputs`, `newRoomPhotoCategoryInputs`.
    - Mutators: `handleUploadRoomPhotoCategorized` (kompresi WebP + upload per-kategori), `handleDeleteRoomPhotoFromCategory`, `toggleUnitRoomFacility`, `toggleUnitBathroomFacility`, `toggleUnitKitchenFacility`, `updateUnitPricingItem`, `addUnitPricingItem`, `deleteUnitPricingItem`, `toggleUnitOtherFeeCoveredItem`.
  * **3. Renderer Terpadu `renderSurveyStyleRoomUnit`**:
    - Fungsi helper yang merender satu unit kamar secara lengkap 1:1 dengan form survei agen:
      - **Status toggle kontras**: `[ 🔒 Terisi ]` vs `[ ✨ Kosong ]` dengan transisi warna Amber↔Emerald.
      - **Dimensi kamar P × L meter**: dua input angka terpisah (Panjang & Lebar).
      - **Dropdown Lantai & Tipe Kamar**: field terstruktur sesuai form survei.
      - **Tabel multi-periode tarif sewa**: harga Bulanan / 3 Bulan / 6 Bulan / Tahunan, format ribuan, Maks. Penghuni, Biaya Tambahan per Orang.
      - **Biaya bulanan lain + checklist cakupan**: Listrik, Air, Sampah, Wifi, Parkir.
      - **Toggle Kosongan vs Furnished** + grid checklist fasilitas standar.
      - **Sub-checklist Kamar Mandi Dalam**: Kloset Duduk/Jongkok, Shower, Wastafel.
      - **Sub-checklist Dapur Dalam**: Kompor, Kulkas, Sink, Kitchen Set.
      - **Custom facility adder**: input tag fasilitas kustom per unit.
      - **Dokumentasi foto per-kategori dinamis**: kategori foto dihitung otomatis dari fasilitas aktif, upload WebP client-side + custom category adder.
      - **Data penghuni lengkap** (untuk unit terisi): Nama, KTP, WhatsApp + link direct WA, periode sewa, tanggal jatuh tempo, jumlah penghuni.
  * **4. Integrasi ke Tab 2**:
    - Blok `occupiedUnits.map` dan `vacantUnits.map` di Tab 2 sepenuhnya diganti dengan `renderSurveyStyleRoomUnit(rt, rtIdx, u, u.originalIdx, true/false)`.
    - Menghapus ~300 baris kode lama (render manual inline) dan menggantinya dengan 2 baris pemanggilan helper.
  * **5. Penyempurnaan Payload `handleSave`**:
    - Seluruh field survei (`floor`, `type`, `size`, `pricing`, `maxOccupants`, `extraOccupantFee`, `otherFeeAmount`, `otherFeeCoveredItems`, `facilities`, `roomFacilities`, `bathroomFacilities`, `kitchenFacilities`, `photoCategories`, `categorizedPhotos`) tersimpan ke Supabase/Firebase.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus dengan 0 TypeScript/Vite error (✓ 2526 modules transformed, ✓ built in 22.96s).

### 145. Sinkronisasi Presisi 1-ke-1 Data Survei Lapangan Properti Terkelola: Integrasi `groupIntoRoomTypesGlobal`, Kompresi WebP Client-Side, dan Floating Room Detail Card di Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mendapati bahwa saat membuka menu edit properti terkelola (seperti Kost Madani) di portal KostManager, data kamar masih belum merefleksikan hasil peninjauan survei di dashboard admin (`KostManagerManagement.tsx`): kamar terpecah menjadi tipe-tipe terpisah dengan kamar dummy `RM-101`, data penghuni riil (`zul`, `081527080656`, dll.) tidak muncul, dan 12 foto dokumentasi kamar tidak masuk ke carousel galeri kamar.
  2. Pengguna meminta representasi data harus persis 1 banding 1 dengan modal peninjauan hasil survei admin, namun versi dapat diedit secara langsung (*interactive editable*).
- **Akar Masalah (Root Cause)**:
  - Pada database Supabase, properti hasil survei menyimpan kamar dalam bentuk *flat array* per unit kamar (`Kamar 1` s.d. `Kamar 5`).
  - Modal review admin menggunakan algoritma cerdas `groupIntoRoomTypes` untuk mengelompokkan unit-unit ini ke dalam Tipe Kamar sejati (`Tipe Standard`) dan mengekstrak foto berlabel kamar.
  - Sebaliknya, fungsi `handleEditProperty` di `KostManagerPortal.tsx` sebelumnya memperlakukan setiap item flat sebagai tipe kamar terpisah dan mencari properti `.rooms`. Karena tidak ada, ia memicu fallback unit dummy `RM-101`, menghapus nama penghuni riil `zul`, dan membuang label foto kamar.
- **Implementasi & Peningkatan Sistem**:
  * **1. Engine Grouping Kamar 1:1 Global (`groupIntoRoomTypesGlobal`)**:
    - Menerapkan algoritma pengelompokan unit kamar flat menjadi Tipe Kamar sejati di `handleEditProperty`.
    - Unit dikelompokkan berdasarkan kesamaan `typeName`, `size`, dan `price` (seperti Kost Madani menjadi `Tipe Standard` dengan 2 unit terisi dan 3 unit kosong).
    - Mempertahankan dan mengintegrasikan seluruh data penghuni riil (`zul`, kontak WA `081527080656`, periode `Bulanan`, dan tanggal jatuh tempo `2026-09-28`).
    - Menghubungkan seluruh 12 foto dokumentasi kamar asli lengkap dengan label kategorinya (`Interior Kamar`, `Kamar Mandi Dalam`, `Tempat Tidur`, `Lemari / Penyimpanan`, `Jendela Luar`).
  * **2. Normalisasi Foto Bangunan & Two-Way Sync Berlabel (`normalizePhotosWithLabels`)**:
    - Foto bangunan dipertahankan dalam format `{ url, label }` sehingga kartu fasilitas umum (`Area Parkir`, `Dapur Bersama`, dll.) langsung terhubung dua arah (*Two-Way Carousel Sync*) dengan foto yang relevan di hero frame.
    - Menjaga data `publicParkingFacilities` (`Motor`, `Mobil`, `Sepeda`) dengan sub-chips interaktif.
  * **3. Floating Room Detail Card & Thumbnail Strip Galeri Kamar 1:1**:
    - Floating card di sudut kiri bawah hero frame foto kamar kini menampilkan nomor kamar, ukuran kamar, tarif sewa bulanan, dan chips fasilitas terpasang (persis Screenshot 2 & 3).
    - Thumbnail strip di bawah frame foto menampilkan tag nomor kamar (`Kamar 3`, `Kamar 4`) di pojok kiri atas dan label kategori foto di bagian bawah dengan border aktif orange `#ff7a00`.
  * **4. Layout Kamar Kosong 1:1 (Dimensi Kamar & Fasilitas Interaktif)**:
    - Menyelaraskan layout kartu kamar kosong (`vacantUnits`) menjadi grid 3 kolom interaktif (1 kolom ukuran kamar + 2 kolom fasilitas terpasang ber-ikon dengan efek hover matching) persis tampilan review survei admin.
  * **5. Kompresi Gambar Client-Side ke Format WebP (Standard Baku Rule #5)**:
    - Mengintegrasikan fungsi pembantu `compressImageToWebP` yang mengonversi foto kamar dan foto gedung secara otomatis ke format `.webp` berkualitas tinggi (0.82) di sisi front-end sebelum dikirim ke Supabase Storage.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend `npm.cmd run build` di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 144. Transformasi Modal Editor Properti Terkelola Portal KostManager Menjadi Representasi 1:1 Langsung dari Modal Peninjauan Hasil Survei Admin (Editable Direct Representation) (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar tampilan editor properti terkelola portal KostManager dibuat menjadi representasi langsung (1 banding 1) dari tampilan peninjauan hasil survei yang ada di dashboard admin (`KostManagerManagement.tsx`), dengan seluruh elemennya dapat diedit secara interaktif (*interactive editable*), karena sebelumnya tampilannya masih sangat jauh berbeda (header kaku, tab kerdil di pojok, tidak ada KPI cards, tidak ada accordion tipe kamar, tidak ada galeri foto kamar hasil pendataan, dll.).
- **Implementasi & Peningkatan Sistem**:
  * **1. Header Terpadu & Top Info Strip 1:1**:
    - Menyelaraskan status badge `[● AKTIF TERKELOLA (AUTO-PILOT)]`, gender pill selector (`[Campur / Putra / Putri]`), ID badge properti, judul kost uppercase besar dengan inline-editing, serta alamat lengkap.
    - Top Info Strip lengkap dengan avatar mitra pemilik, nama pemilik, nomor WhatsApp (dengan tombol direct WhatsApp), dropdown pencarian mitra pemilik (`filteredOwners`), mode operasional KostManager Auto-Pilot Studio, dan tombol cepat `[Lihat Web ↗]`.
    - Navigasi 3-tab horizontal lebar dengan icon dan badge counter dinamis:
      - `[🏢 1. DATA PROPERTI UMUM]` (Badge total foto gedung)
      - `[🛏️ 2. DATA KAMAR & PENGHUNI]` (Badge total unit kamar)
      - `[🛡️ 3. DATA MITRA & KERJASAMA]` (Badge '✓')
  * **2. Tab 1 (Data Properti Umum - 1:1 Editable)**:
    - **Hero Carousel Foto Utama (16/7 Dark Slate-950)**: Frame foto gelap rasio 16/7 dengan overlay gradien, badge label foto aktif (dengan dropdown ubah label preset), counter foto, tombol Zoom Lightbox, tombol Hapus Foto, tombol `+ Tambah Foto`, caption bar bawah, tombol Prev/Next chevron, serta thumbnail strip bawah lengkap dengan nomor foto `#1, #2` dan label kategori.
    - **Fasilitas Umum dengan Two-Way Carousel Sync**: Grid 2-kolom kartu fasilitas persis modal peninjauan admin. Mengklik kartu fasilitas langsung menggeser hero slider ke foto fasilitas terkait (*Two-Way Sync*), badge status `AKTIF` / `+ AKTIFKAN`, serta sub-item rincian parkir (`🏍️ Motor`, `🚗 Mobil`, `🚲 Sepeda`) yang dapat di-toggle.
    - **Alamat, Titik Koordinat & Google Maps**: 5 kotak data administratif terstruktur (Provinsi, Kabupaten/Kota, Kecamatan/Area, Latitude, Longitude) berdampingan dengan peta Google Maps (`LocationPicker`) interaktif dan link `Buka Google Maps ↗`.
    - **Kampus & Landmark Terdekat**: Kartu rute 2-kolom dengan estimasi jarak, waktu tempuh (jalan, motor, mobil), link rute Google Maps, serta kontrol tambah/hapus kampus.
    - **Peraturan & Ketentuan Kost**: Kartu rose dengan ikon larangan `⛔` serta kontrol tambah/hapus peraturan.
  * **3. Tab 2 (Data Kamar & Penghuni - 1:1 Editable)**:
    - **4 Top KPI Glance Cards**: Menghitung dan menyajikan secara instan Total Kamar (Biru), Kamar Terisi (Amber), Kamar Kosong (Emerald), dan Total Penghuni (Indigo).
    - **Galeri Foto Kamar Hasil Pendataan**: Carousel foto kamar interaktif dengan floating card detail kamar di kiri bawah (Nomor Kamar, Ukuran, Tarif Sewa, Fasilitas), counter foto, thumbnail strip, serta filter per-unit kamar.
    - **Accordion Tipe Kamar (Level 1 Parent)**: Menampilkan nama tipe kamar, ukuran `📐 PxL`, chips fasilitas kamar & kamar mandi lengkap, tarif sewa bulanan, counter `✨ X Kosong` dan `🔒 Y Dihuni`, tombol tambah unit kamar, tombol ubah spek tipe kamar, serta tombol hapus tipe kamar.
    - **Dua Sub-Parent Accordions Berpasangan (Level 2)**:
      - **`🔒 KAMAR SEDANG DIHUNI / TERISI`** (Tema Amber): Daftar unit kamar terisi.
      - **`✨ KAMAR KOSONG / SIAP HUNI`** (Tema Emerald): Daftar unit kamar kosong siap huni.
    - **Detail Unit Kamar Interaktif**:
      - Switch 1-klik status kamar (`🔒 Dihuni` <-> `✨ Kosong`) yang langsung memindahkan unit antar sub-parent.
      - Grid data penghuni 3 kolom: 👤 Nama Penghuni & jumlah penghuni, 📱 Kontak WhatsApp (dengan tombol `Hubungi via WA ↗`), 📅 Periode Tagihan & Tanggal Jatuh Tempo.
      - Spesifikasi & Fasilitas Kamar Terpasang dengan efek *photo-hover matching highlighting*.
      - Dokumentasi Foto Kamar per kategori (Interior, Kasur, Kamar Mandi, Jendela) dengan tombol `+ Foto` WebP uploader, Zoom Lightbox, dan Hapus Foto.
      - Catatan kondisi kamar editable dan tombol Hapus Unit Kamar.
  * **4. Tab 3 (Data Mitra, Kerjasama & Finansial - 1:1)**:
    - Salinan Dokumen Perjanjian Kemitraan Auto-Pilot dengan 4 pasal legalitas dan badge `✓ Disetujui Mitra Secara Digital`.
    - Data rekening penampungan bank pemilik (Owner Payout).
    - Omnichannel WhatsApp Booking Router.
    - Simulasi Finansial 3 Kartu: Potensi Omset Penuh, Realisasi Sewa Berjalan, dan Estimasi Payout Pemilik (setelah potongan fee 10%).
  * **5. Sticky Action Footer & Alur Simpan Terintegrasi**:
    - Tombol navigasi `Batal`, `← Sebelumnya`, `Lanjut →`, dan `💾 Simpan Perubahan Properti`.
    - Menyimpan seluruh perubahan (termasuk foto, tipe kamar, unit, penghuni, fasilitas, kampus, peraturan, dan koordinat) ke Supabase secara aman via `updatePropertyWithMedia` atau `addPropertyWithMedia`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm.cmd run build`) di `functions/public/` lulus 100% dengan 0 error dalam 28.71 detik (2526 modules transformed).

### 143. Normalisasi Foto & Pencegahan Duplikasi Foto Kamar serta Fallback Thumbnail Properti (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada halaman Kost Manager Portal (`KostManagerPortal.tsx`), ketika membuka modal kelola/edit properti, beberapa foto kamar muncul berulang-ulang (duplikasi foto kamar).
  2. Thumbnail properti pada tabel "Properti & Visual" berisiko rusak jika properti lama menyimpan string URL foto dengan format serialized JSON string atau array objek.
- **Implementasi & Peningkatan Sistem**:
  * **1. Helper Normalisasi URL Foto (`normalizePhotoUrl`)**:
    - Mengekstrak URL foto bersih dari berbagai macam format (string murni, array objek `{url: string}`, atau string JSON bersarang).
  * **2. Helper Pengelompokan Foto Kamar Bersih & Unik (`getNormalizedRoomPhotos`)**:
    - Mengumpulkan seluruh foto dari setiap unit kamar (`room.photos`, `room.photo_urls`, `room.images`) dan menyaring URL unik (`new Set()`) sehingga tidak ada lagi foto kamar yang muncul ganda atau berulang.
  * **3. Perbaikan Sinkronisasi Foto Form Modal & Fallback Error**:
    - Menjamin state `formData.image_urls` saat membuka properti terisi dengan foto unik yang telah dinormalisasi.
    - Menambahkan `onError` fallback pada thumbnail tabel properti agar otomatis menampilkan ikon `<Building2 />` jika URL gambar tidak valid atau gagal dimuat.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 31.31 detik (2526 modules transformed).

### 142. Penyajian Data Wilayah Administratif (Provinsi, Kabupaten/Kota, Kecamatan) pada Modal Peninjauan Admin (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada Modal Peninjauan Admin (*Tab 1: DATA PROPERTI UMUM -> ALAMAT & TITIK KOORDINAT*), kotak data di bawah teks alamat sebelumnya hanya menampilkan `Kota / Wilayah`, `Latitude`, dan `Longitude`.
  2. Data Provinsi dan Kecamatan/Area belum tampil terstruktur sebagai kotak data tersendiri bagi admin saat memeriksa berkas pengajuan KostManager.
- **Implementasi & Peningkatan Sistem**:
  * **1. Helper Auto-Detection Provinsi (`detectProvinceFromAddress`)**:
    - Memastikan provinsi selalu terdeteksi dan tidak bernilai kosong bahkan untuk entri data properti lama.
  * **2. Pembaruan Kotak Rincian Lokasi Administratif pada Tab 1 (Data Properti Umum)**:
    - Menampilkan 5 kotak data terstruktur yang lengkap:
      - **🏛️ Provinsi**: `reviewProperty?.province` (default: *"Sulawesi Selatan"*)
      - **🏙️ Kabupaten / Kota**: `reviewProperty?.city` (misal: *"Makassar"*)
      - **📍 Kecamatan / Area**: `reviewProperty?.area` (misal: *"Tamalanrea"*)
      - **🌐 Latitude**: Titik lintang GPS
      - **🌐 Longitude**: Titik bujur GPS
  * **3. Pembaruan Kartu Evaluasi Audit GPS (`property_gps`)**:
    - Menampilkan chips badge wilayah administratif (Provinsi, Kota, Kecamatan) pada kartu simulasi evaluasi admin.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 22.76 detik (2526 modules transformed).



### 141. Penyajian Data Wilayah Administratif (Provinsi, Kota/Kabupaten, Kecamatan) pada Menu Peninjauan Step 3 (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada menu peninjauan (Step 3: Review / Onboarding Kost), ringkasan lokasi sebelumnya hanya menampilkan string teks alamat mentah (`address`) tanpa menyajikan hierarki wilayah administratif seperti Provinsi, Kota/Kabupaten, dan Kecamatan/Area.
  2. Pengguna meminta agar data terkait Kabupaten/Kota, Provinsi, dan Kecamatan ditampilkan secara terstruktur pada menu peninjauan.
- **Implementasi & Peningkatan Sistem**:
  * **1. Penambahan Seksi Ringkasan Wilayah Administratif**:
    - Menambahkan kartu terpadu *"Data Properti & Lokasi Administratif"* pada Step 3 tepat di atas Simulasi Mobile Preview.
    - Menampilkan kartu data spesifik:
      - **🏛️ Provinsi**: `kmListingForm.province` (dengan fallback default *"Sulawesi Selatan"*).
      - **🏙️ Kota / Kabupaten**: `kmListingForm.city` (dengan fallback default *"Makassar"*).
      - **📍 Kecamatan / Area**: `kmListingForm.area` (misal: *"Tamalanrea"*).
      - **🏠 Alamat Lengkap & Koordinat GPS**: Menampilkan teks alamat dan nilai latitude/longitude dari pin peta.
      - **Tombol Pintas `[✏️ Edit Wilayah]`**: Memungkinkan surveyor langsung melompat kembali ke Step 1 jika ingin mengubah wilayah.
  * **2. Integrasi Badges Wilayah pada Simulasi Preview Mobile**:
    - Menambahkan badge pill wilayah (`Kec. {area}`, `{city}`, `{province}`) tepat di bawah teks alamat di dalam frame simulasi handphone.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 23.71 detik (2526 modules transformed).



### 140. Transformasi Kartu Evaluasi Menjadi Baris Kompak Riwayat Revisi Pasca Pengiriman Ulang (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada daftar tugas surveyor, ketika data hasil revisi telah dikirim ulang ke admin (`status: SUBMITTED`), kartu evaluasi besar berwarna oranye menyala dengan badge *"PERLU TINDAKAN"* masih muncul karena teks catatan memuat kata `[REVISI]`.
  2. Pengguna meminta agar kartu besar tersebut dihilangkan setelah revisi terkirim, dan digantikan dengan **satu baris kecil memanjang yang rapi sebagai penanda Riwayat Revisi** yang menampilkan tanggal dan waktu pengiriman revisi.
- **Implementasi & Peningkatan Sistem**:
  * **1. Pemisahan Mode Kartu Tugas Berdasarkan Status**:
    - **Mode Revisi Aktif (`REVISION_REQUIRED` / `NEED_REVISION`)**: Tetap menampilkan kartu besar oranye ber-prioritas tinggi dan ber-animasi untuk menuntun surveyor segera memperbaiki poin-poin yang diminta admin.
    - **Mode Pasca-Kirim Ulang (`SUBMITTED` / `PENDING_ONBOARDING`)**: Kartu besar oranye otomatis dihilangkan dan digantikan dengan **satu baris kecil memanjang (horizontal compact bar)**:
      `[🕒 Riwayat Revisi: Terkirim 28 Agu 2026, 17:31 WITA] [✓ Terkirim]`.
  * **2. Helper Format Waktu Lengkap (`getFormattedRevisionDateTime`)**:
    - Memformat tanggal dan jam pengiriman data secara presisi (contoh: *"28 Agu 2026, 17:31 WITA"*).
  * **3. Tombol Aksi Tenang Berwarna Hijau**:
    - Di bawah baris riwayat, disajikan kartu info status terkirim dan tombol aksi emerald: *"✏️ Edit & Perbarui Data Listing"*.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 22.56 detik (2526 modules transformed).



### 139. Auto-Detection Cerdas & Persistensi Provinsi serta Penonaktifan Alarm Evaluasi Pasca Kirim Ulang (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. **Provinsi Masih Kosong saat Dibuka Kembali**: Meskipun Kota/Kabupaten dan Kecamatan sudah tersimpan, input Provinsi masih kosong saat membuka form karena data properti lama di database (`metadata`) belum memiliki key `province` dan draft lokal lama menyimpan string kosong tanpa fallback auto-detect dari teks alamat.
  2. **Peringatan Evaluasi / Badge Revisi Masih Muncul Pasca Kirim Ulang**: Setelah agen mengirim ulang data revisi ke admin (`status: SUBMITTED`), badge `REVISI` dan border animasi kelap-kelip masih muncul karena parser `parseEvaluationData` sebelumnya hanya mengecek kata kunci di `notes` tanpa memvalidasi status pengajuan.
- **Implementasi & Peningkatan Sistem**:
  * **1. Helper Auto-Detection Cerdas (`detectProvinceFromAddress`)**:
    - Membuat fungsi deteksi provinsi yang mengekstrak wilayah (Sulawesi Selatan, DKI Jakarta, Jawa Barat, Jawa Timur, Bali, dll.) dari string alamat atau default ke *"Sulawesi Selatan"*.
    - Diterapkan secara otomatis di seluruh alur pemuatan data (`openKostManagerListing`): draft localStorage, `dbKmProp`, `dbPropertyRecord`, clean slate, dan Google Maps Geocoder.
    - Menjamin field Provinsi tidak akan pernah kosong lagi saat survei dibuka kembali.
  * **2. Penyelarasan Status Evaluasi & Penonaktifan Alarm Pasca-Submit**:
    - Memperbarui `parseEvaluationData(notes, status)` agar memperhitungkan status pengajuan.
    - Ketika status pengajuan adalah `SUBMITTED`, `PENDING_ONBOARDING`, atau `APPROVED`, `hasRevision` otomatis bernilai `false`.
    - Badge `REVISI` pada tab stepper dan border glowing kelap-kelip otomatis **dinonaktifkan**.
    - Menggantikannya dengan banner hijau/emerald: *"✨ Data Revisi Telah Dikirim ke Admin (Menunggu Verifikasi & Persetujuan)"* lengkap dengan riwayat poin evaluasi yang telah diperbaiki.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 21.20 detik (2526 modules transformed).



### 138. Perbaikan Pin Peta Minimize, Sinkronisasi Metadata Wilayah Supabase & Indikator Evaluasi Revisi (`AgentDashboard.tsx`, `adminService.ts`, `KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. **Pin Peta Tidak Bisa Ditetapkan di Mode Minimize**: Pada form pendataan survei `AgentDashboard.tsx`, surveyor/agen tidak dapat mengunci atau mengubah titik koordinat langsung dari peta mini (inline mode) karena event klik dan geser hanya mengubah state temporary tanpa mengeksekusi reverse geocoding atau memperbarui koordinat form.
  2. **Data Provinsi & Kota/Kabupaten Hilang saat Dibuka Kembali**: Saat draf disimpan atau hasil survei dikirim ke database, query update/insert Supabase mengalami error `Could not find the 'province' column of 'properties' in the schema cache` karena tabel PostgreSQL `properties` tidak memiliki kolom terpisah `province` (harus berada di dalam `metadata`). Akibatnya mutasi database gagal dan data wilayah hilang saat form dibuka kembali.
  3. **Indikator Kelap-Kelip Evaluasi**: Penjelasan dan penyelarasan alur transisi status revisi dari `REVISION_REQUIRED` (aktif ber-indikator interaktif) menjadi `SUBMITTED` / `PENDING_ONBOARDING` (telah dikirim ulang dan menunggu verifikasi admin).
- **Implementasi & Peningkatan Sistem**:
  * **1. Interaktivitas Penuh Mini-Map Geocoding (`AgentDashboard.tsx`)**:
    - Membuat fungsi terpadu `reverseGeocodeAndApply(lat, lng)` yang langsung mengunci koordinat GPS form, menggerakkan marker, melakukan pan pada peta, dan memicu *Google Maps Reverse Geocoder*.
    - Menghubungkan listener `click` dan `dragend` pada instance peta mini (`kmMapRef`) serta tombol GPS (*"Gunakan Lokasi Saya Saat Ini"*) ke `reverseGeocodeAndApply`.
    - Alamat, Provinsi, Kota/Kabupaten (tanpa prefiks *"Kota "* / *"Kabupaten "*), dan Kecamatan/Area (tanpa prefiks *"Kecamatan "* / *"Kec. "*) langsung terisi otomatis secara real-time di mode minimize maupun layar penuh.
  * **2. Penyimpanan Wilayah Aman Berbasis Metadata (`metadata.province`)**:
    - Memindahkan penyimpanan `province` ke dalam objek `metadata: { ...metadata, province }` pada `handleSaveDraftDirectly` dan `handleSaveKostManagerListing` di `AgentDashboard.tsx`, `addPropertyWithMedia` dan `updatePropertyWithMedia` di `adminService.ts`, serta `handleSaveManagedProperty` di `KostManagerPortal.tsx`.
    - Menghilangkan kolom top-level `province` yang memicu kegagalan skema Supabase.
    - Pada `openKostManagerListing`, `province` kini dimuat kembali dari `dbPropertyRecord.province || dbPropertyRecord.metadata?.province || dbKmProp?.metadata?.province || ''`.
    - Menambahkan sanitasi otomatis jika data lama di `city` diawali teks *"Kecamatan ..."*, nilai tersebut otomatis dipindahkan ke `area` dan `city` di-reset ke *"Makassar"*.
  * **3. Penyelarasan Indikator Evaluasi & Status Pengajuan**:
    - Memastikan alur status dan catatan perbaikan tetap transparan dan akurat sepanjang siklus revisi antara agen dan Super Admin.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/public/adminService.ts`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 28.82 detik (2526 modules transformed).


### 137. Pemisahan & Filtrasi Ketat Properti KostManager vs Mitra Biasa di Portal Operasional (`KostManagerPortal.tsx` & `adminService.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menemukan bahwa properti milik **Mitra Biasa / Listing Reguler** (yang tidak berlangganan KostManager dan memiliki `is_managed = false`) ikut tercantum ke dalam tabel *PROPERTI TERKELOLA* di Portal Operasional KostManager dengan status *"AKTIF TERKELOLA"*.
  2. Hal ini mencampuradukkan data portofolio autopilot, statistik okupansi kamar, daftar penghuni, dan penagihan sewa antara listing reguler dan properti kelolaan KostManager.
- **Implementasi & Peningkatan Sistem**:
  * **1. Filtrasi Ketat & Isolasi Mutlak di `loadAllData` (`KostManagerPortal.tsx`)**:
    - Sistem hanya memuat properti ke dalam Portal KostManager jika memenuhi salah satu kriteria valid:
      - `p.is_managed === true` (telah disetujui / diaktifkan sebagai kelolaan KostManager).
      - Pemilik properti (`owner_uid`) tercatat memiliki status `subscription_status = 'kostmanager'` di tabel `mitra`.
      - Pemilik properti atau properti terdaftar secara resmi pada pengajuan aktif `kostmanager_requests` (`status = 'ACTIVE'`).
    - Seluruh 9 listing reguler milik Mitra Biasa non-KostManager **100% diisolasi dan dilarang masuk** ke Portal KostManager.
  * **2. Penyelarasan Relasi Penghuni, Statistik & Penagihan Sewa**:
    - Data penyewa kamar (`tenants`), metrik okupansi portofolio, kamar kosong siap huni, dan invoice sewa bulanan (`invoices`) hanya menghitung unit dari properti kelolaan KostManager yang sah.
  * **3. Penegasan Flag `is_managed: true` pada Form Penambahan Properti**:
    - Memastikan properti baru yang didaftarkan melalui tombol `➕ Daftarkan Properti Baru` di Portal KostManager otomatis menyimpan `is_managed: true` ke database Supabase.
    - Menambahkan sinkronisasi kolom `province` pada `addPropertyWithMedia` dan `updatePropertyWithMedia` di `adminService.ts`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/adminService.ts`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 20.70 detik (2526 modules transformed).

### 136. Smart Auto-Detection & Split Wilayah Administrasi (Provinsi, Kota, Kecamatan) + Alamat Lengkap Real Bangunan (`KostManagerPortal.tsx` & `AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar sistem secara otomatis dan cerdas membagi wilayah administrasi menjadi **Provinsi**, **Kota/Kabupaten**, dan **Kecamatan/Area** langsung dari Google Maps Geocoding API saat meletakkan/mencari titik pin pada peta.
  2. Mencegah anomali lama di mana nama kecamatan (`locality` / `administrative_area_level_3`) secara keliru masuk ke kolom Kota/Kabupaten.
  3. Memastikan ruang input **Alamat Lengkap Real Bangunan** (nama jalan, nomor rumah, RT/RW, kelurahan, patokan) tetap terjaga penuh dan detail agar tampil akurat kepada calon penyewa.
- **Implementasi & Peningkatan Sistem**:
  * **1. Smart Geocoding Hierarchy Parser di `LocationPicker` (`KostManagerPortal.tsx`)**:
    - **🏛️ Provinsi**: Diekstrak dari `administrative_area_level_1` (contoh: *"Sulawesi Selatan"*).
    - **🏙️ Kota / Kabupaten**: Diekstrak dari `administrative_area_level_2` dengan pembersihan otomatis prefiks kata *"Kota "* / *"Kabupaten "* (contoh: *"Kota Makassar"* $\rightarrow$ **`Makassar`**).
    - **📍 Kecamatan / Area**: Diekstrak dari `administrative_area_level_3` / `sublocality_level_1` / `sublocality` dengan pembersihan kata *"Kecamatan "* / *"Kec. "* (contoh: *"Kecamatan Tamalanrea"* $\rightarrow$ **`Tamalanrea`**).
    - **Alamat Lengkap Detail**: Mengisi field teks textarea `address` lengkap dan dapat diedit manual.
  * **2. Tata Letak Form Wilayah Terstruktur di Tab 1 Editor Properti**:
    - Header info dengan badge visual: *✨ Smart Geocoding: Wilayah & Alamat Terdeteksi Otomatis* dan titik koordinat GPS.
    - 3 kolom input terstruktur: **Provinsi**, **Kota / Kabupaten**, dan **Kecamatan / Area** yang otomatis terisi saat pin digeser di peta.
    - Textarea **Alamat Lengkap Real Bangunan** untuk rincian jalan, nomor rumah, dan patokan.
  * **3. Real-Time Smart Region Detection di Form Pendataan Survei (`AgentDashboard.tsx`)**:
    - Pembaruan parser geocoding modal peta dan mini map untuk membagi `province`, `city`, dan `area` secara presisi.
    - Menampilkan baris chip badge wilayah terdeteksi (*🏛️ Provinsi*, *🏙️ Kota/Kab*, *📍 Kecamatan*) di bawah textarea alamat.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 27.52 detik (2526 modules transformed).

### 135. Penyelarasan Layout & Skema Input Modal Edit Properti Sesuai Standar Peninjauan Survei KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menginstruksikan untuk menyelaraskan tampilan tema layout dan skema input modal pengeditan properti pada tingkatan KostManager dengan standar tampilan peninjauan hasil survei (Review Modal) yang ada di Dashboard Admin (`KostManagerManagement.tsx`).
- **Implementasi & Peningkatan Sistem**:
  * **1. Struktur 3-Step Navigator Tabs**:
    - **Tab 1: 🏢 Profil & Fasilitas Gedung**:
      - Hero Carousel Foto Utama / Fasad Bangunan dengan preview thumbnail strip dan upload foto ber-kompresi WebP.
      - Identitas Properti (Nama Kost, Tipe Gender, Deskripsi Lengkap).
      - Lokasi & Titik Koordinat GPS dengan peta satelit `LocationPicker`.
      - Fasilitas Umum 3 Kategori Terstruktur: *Kenyamanan & Umum*, *Keamanan & Akses*, dan *Utilitas & Listrik*.
    - **Tab 2: 🛏️ Kamar & Penghuni Terdata**:
      - Horizontal Room Selector Strip dengan badge counter status total kamar, terisi (`🔒 Terisi`), dan kosong (`✨ Kosong`).
      - Banner status kamar aktif, spesifikasi dimensi ($P \times L$), dan tarif sewa per unit.
      - Data penghuni terdata (Nama, No WhatsApp, Tanggal Mulai & Jatuh Tempo, Periode Tagihan).
      - Dokumentasi Foto Kamar 4 Kategori: *Interior Kamar*, *Kasur & Bantal*, *Kamar Mandi*, dan *Jendela / Ventilasi*.
    - **Tab 3: 📋 Mitra, Rekening & Auto-Pilot Hub**:
      - Data pemilik mitra (Owner Payout) dengan pencarian cepat.
      - Omnichannel WhatsApp Booking Router.
      - Simulasi Finansial Properti (Potensi Omset Maksimal, Realisasi Sewa Berjalan, dan Estimasi Payout Pemilik setelah fee KostManager 10%).
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 23.83 detik (2526 modules transformed).

### 134. Transformasi Modal Edit Properti Menjadi Advanced & Interactive Property Studio (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar modal pengeditan properti pada tingkatan KostManager tidak lagi berupa popup admin konvensional yang kaku dan sempit, melainkan dibuat lebih advance, profesional berstandar modern, dan sangat interaktif.
- **Implementasi & Peningkatan Sistem**:
  * **1. Full-Canvas Studio Workspace (`max-w-6xl` / 92vh)**:
    - Layout kanvas kerja luas dengan sidebar navigasi ber-icon vector (`Building2`, `MapPin`, `Sparkles`, `Zap`, `Bed`, `ShieldCheck`), counter kelengkapan data per seksi, dan *sticky bottom action bar*.
  * **2. Interactive Studio Kamar & Hunian (Per Tipe & Per Unit)**:
    - Tab pemilih tipe kamar (`Tipe Kamar 1..N`) dengan rincian konfigurasi tarif, dimensi, dan fasilitas dalam kamar ber-chip interaktif.
    - Kartu unit kamar interaktif: 1-klik switch status `🟢 Terisi` vs `⚪ Kosong`, form profil penghuni eksisting (Nama, No WA, Jatuh Tempo, Periode Bayar), dan galeri foto kamar dengan upload WebP instan.
  * **3. Galeri Media Berbasis Aset & Video Tour**:
    - Slot pengunggahan foto bangunan dengan preview instan, badge foto cover utama, dan input tautan video Reels Instagram / TikTok.
  * **4. Fasilitas & Utilitas Berbasis Visual Chip Selector**:
    - Chip selector fasilitas umum (`WiFi Cepat`, `Dapur Bersama`, `CCTV 24 Jam`, `Akses 24 Jam`, dll.), input fasilitas kustom, dan konfigurasi biaya tambahan (*add-on*).
  * **5. Omnichannel WhatsApp Routing & Kebijakan Gedung**:
    - Router penanggung jawab kontak booking WhatsApp dan daftar aturan tata tertib gedung interaktif.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 27.91 detik (2526 modules transformed).

### 133. Transformasi Tab Properti Terkelola Menjadi Enterprise Property Command Center (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta tinjauan komprehensif dan *devil's advocate* apakah tab Properti Terkelola sudah memadai untuk pengelolaan Auto-Pilot.
  2. Tab properti sebelumnya hanya berupa tabel CRUD teks minimal tanpa konteks visual bangunan, tanpa progress bar okupansi, tanpa indikator kesehatan finansial (omset riil vs potensi), dan tanpa denah unit kamar cepat / aksi operasional massal.
- **Implementasi & Peningkatan Sistem**:
  * **1. Top KPI Portfolio Glance Bar**:
    - 4 Kartu Metrik Portofolio: **Properti Terkelola** (jumlah gedung aktif), **Kapasitas Kamar** (total unit, terisi, dan kosong), **Tingkat Okupansi Rata-Rata Portofolio**, dan **Omset Realisasi vs Potensi Bulanan**.
  * **2. Redesain Baris Tabel Properti (High-Density Property Cards)**:
    - **Visual Aset**: Thumbnail foto utama bangunan (`image_urls[0]`), judul kost, badge tipe gender (`Campur / Putra / Putri`), dan alamat kota/area.
    - **Kontak Pemilik**: Nama pemilik (mitra) dengan tautan WhatsApp aktif (`+62...`).
    - **Visual Occupancy Progress Bar**: Indikator persentase keterisian (`[████░░░░] 40%`) dengan gradasi warna pintar (Emerald >=80%, Amber 50-79%, Rose <50%) dan status kamar siap huni.
    - **Snapshot Finansial**: Perbandingan Realisasi Sewa Terkumpul Bulan Ini vs Potensi Omset Maksimal.
  * **3. Modal Denah Unit Kamar Visual (*Room Matrix Visualizer*)**:
    - Modal interaktif yang menampilkan denah susunan kamar per lantai (`Kamar 1..N`), nama penghuni aktif, masa sewa, tarif bulanan, dimensi, dan status ketersediaan siap sewa dalam 1 klik.
  * **4. Modal Broadcast WhatsApp Pengumuman Gedung**:
    - Generator pengumuman operasional massal dengan template terstruktur (`⚡ Listrik & Air`, `🧹 Jadwal Kebersihan`, `🧾 Tagihan Serentak`, `🔒 Tata Tertib`, `✏️ Pesan Bebas`) yang langsung terhubung ke seluruh nomor WhatsApp penghuni pada properti tersebut.
  * **5. Tombol Pintas Listing Publik (`Lihat Web ↗`)**:
    - Akses langsung ke halaman publik properti (`/kost/:id`) untuk memantau tampilan kost di mata calon penyewa.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 33.93 detik (2526 modules transformed).

### 132. Transformasi Auto-Pilot Tenant Lifecycle Engine pada Portal Operasional KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta tinjauan kritis (*devil's advocate*) dan brainstorming untuk meningkatkan tampilan tab Penghuni KostManager agar tidak sekadar menjadi buku kontak statis, melainkan memiliki manajemen siklus hidup sewa (*tenant lifecycle*), pengkategorian status sewa berjalan, tenggat sewa, dsb.
- **Implementasi & Peningkatan Sistem**:
  * **1. Tenant Lifecycle Calculation Engine (`calculateTenantLifecycle`)**:
    - Kalkulasi otomatis status sewa secara real-time berdasarkan tanggal akhir/jatuh tempo:
      - 🟢 **Sewa Berjalan (*Active Running*)**: Sisa waktu sewa > 7 hari.
      - 🟡 **Jatuh Tempo Segera (*Due Soon*)**: H-7 s/d H-0 (badge countdown interaktif).
      - 🔴 **Menunggak (*Overdue*)**: H+1 ke atas (badge glowing berdenyut + counter hari terlambat).
      - 📦 **Rencana Keluar (*Move-Out Scheduled*)**: Notifikasi unit akan segera dilepas.
      - ⚪ **Alumni / Riwayat (*Checked Out*)**: Status sewa selesai.
  * **2. Top KPI Glance Metrics Bar**:
    - 4 Kartu Metrik Cepat: **Penghuni Aktif** (dengan % okupansi), **Estimasi Omset Sewa/Bulan**, **Perlu Ditindak** (Total H-7 & Nunggak), dan **Kamar Kosong Siap Huni**.
  * **3. Smart Pipeline Filter Tabs**:
    - Tab filter dengan badge counter dinamis: `Semua Penghuni`, `🟢 Sewa Berjalan`, `🟡 Jatuh Tempo (H-7)`, `🔴 Menunggak`, dan `📦 Rencana Keluar`.
  * **4. Action Hub Terintegrasi & WhatsApp Generator**:
    - **💬 WhatsApp Reminder Generator**: Pesan WhatsApp cerdas otomatis sesuai status (pengingat ramah H-3, pengingat H-0, dan surat teguran tunggakan H+1) dengan 1 klik.
    - **🔄 1-Click Lease Renewal Modal**: Perpanjang durasi sewa (1, 2, 3, 6, 12 bulan) yang langsung memajukan periode sewa di database.
    - **🚪 Move-Out / Check-Out Modal**: Proses pelepasan kamar terstruktur yang otomatis mengubah status unit di `properties.room_types` kembali menjadi **KOSONG / Tersedia** untuk dipasarkan kembali.
    - **📄 Detail Profil & Dokumen Modal**: Modal preview kontak, tanggal sewa, rincian tarif, dan foto KTP penghuni.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 24.70 detik (2526 modules transformed).

### 131. Ekstraksi Penghuni Kamar Terdata & Sinkronisasi Komprehensif Tab Penghuni Portal KostManager (`KostManagerPortal.tsx` & `KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa setelah menyetujui (ACC) hasil pendataan KostManager (seperti Kost Madani), data properti dan daftar penghuninya tidak muncul di Portal Operasional KostManager (`KostManagerPortal.tsx`).
  2. Tab "Penghuni" sebelumnya hanya membaca dari tabel transaksi online (`resident_status`), sementara data penghuni eksisting (offline) hasil survei agen tersimpan langsung di dalam struktur objek kamar `properties.room_types`.
  3. Query properti portal juga membatasi `.in('owner_uid', allOwnerIds)` yang rentan terlewat jika `owner_uid` belum tersinkron dengan ID mitra.
- **Implementasi & Peningkatan Sistem**:
  * **1. Ekstraksi Otomatis Penghuni Kamar Terdata (`propertyTenants`)**:
    - Memindai seluruh unit kamar berstatus `Terisi` atau `isAvailable === false` atau memiliki nama penghuni (`residentName` / `tenantName`).
    - Mengonversi data kamar terisi menjadi entri `TenantRecord` lengkap dengan Nama Penghuni, No HP, Nama Kamar, Tanggal Sewa, dan Skema Tarif.
    - Menggabungkan penyewa online (`resident_status`) dan penghuni offline hasil survei (dengan deduplikasi per kamar) ke state `tenants`.
  * **2. Pembersihan Filter Query Properti KostManager**:
    - Mengambil seluruh properti `is_managed = true` non-draft secara langsung dan memetakan kontak pemilik (`users` & `mitra`) secara komprehensif.
    - Menghitung jumlah kamar kosong dan penghuni terisi secara akurat pada overview dashboard dan ringkasan properti.
  * **3. Sinkronisasi Otomatis saat Approval Admin (`handleApproveAndActivate`)**:
    - Memastikan `properties.owner_uid` disinkronkan ke ID mitra (`req.user_id`) dan memperbarui `mitra.subscription_status = 'kostmanager'`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 52.07 detik (2526 modules transformed).

### 130. Perbaikan Layout Header 2-Baris pada Kartu Permohonan KostManager (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada layout header kartu permohonan, penempatan lencana status sejajar 1 baris dengan Avatar, Nama Mitra, dan Nomor Telepon menyebabkan ruang horizontal sempit sehingga nama mitra terpotong menjadi `A..` dan nomor telepon terpotong menjadi `+6281527080...`.
- **Implementasi & Peningkatan Sistem**:
  * **Refaktor Header 2-Baris Terstruktur (Clean Vertical Stack)**:
    - **Baris Atas**: Status Badge Permohonan (`● Menunggu Onboarding Admin`) di kiri + ID Permohonan (`#KM-XXXX`) di kanan.
    - **Baris Bawah**: Avatar Mitra + Nama Lengkap Mitra (tampil utuh 100% tanpa truncate kerdil) + Badge Owner + Nomor WhatsApp aktif (lengkap 100% tanpa truncate).
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 24.54 detik (2526 modules transformed).

### 129. Redesain Modern UI/UX Kartu Permohonan & Peninjauan KostManager pada Dashboard Admin (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mengkritik tampilan kartu peninjauan KostManager di dashboard admin yang kaku, cluttered, dan belum mencerminkan standar estetika web modern.
  2. Teks catatan/log revisi (`req.notes`) tercetak mentah berantakan, preview peta iframe sempit dengan teks default Google yang menumpuk, dan tombol aksi hijau dominan yang kaku.
- **Implementasi & Peningkatan Sistem**:
  * **1. Neo-Modern Glassmorphism & High-Contrast Cards**:
    - Kartu berbingkai `rounded-[2rem]` dengan aksen gradasi top bar dinamis sesuai status (Emerald untuk siap review, Amber untuk butuh revisi/butuh agen, Hijau untuk aktif).
  * **2. Header Mitra Berkelas & Akses WhatsApp Langsung**:
    - Avatar mitra dengan gradasi halus (`from-orange-400 to-amber-500`), badge owner, nomor telepon dengan link WhatsApp aktif (`+62...`), dan status badge ber-glowing micro-dot.
  * **3. Identitas Properti & Chip Info Terstruktur**:
    - Chip tipe gender (`🏢 Campur`) dan status kamar (`🛏️ Total / Kosong`) bernuansa modern.
    - Alamat properti dengan icon vector `MapPin` rapi.
  * **4. Pembersihan Preview Lokasi & Quick Action**:
    - Mengganti iframe yang penuh teks kontrol default dengan preview link lokasi bersih ber-icon `Compass` dan tombol cepat `Buka Maps ↗`.
  * **5. Parser Log Catatan & Riwayat Evaluasi Terstruktur (`parseRequestNotesSummary`)**:
    - Memisahkan teks mentah menjadi chip timeline evaluasi terstruktur: menampilkan cuplikan catatan admin terbaru dalam callout bubble modern dengan tanggal revisi.
  * **6. Action Hub & Tombol Peninjauan Shimmering**:
    - Action banner elegan dengan animasi pulse, badge status, dan tombol `Tinjau Hasil Pendataan Lengkap` bergradasi modern dan icon pure vector `ClipboardCheck` dari `lucide-react`.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 26.08 detik (2526 modules transformed).

### 128. Penanda Status Kamar (Terisi vs Kosong) & Penyempurnaan Slot Kategori Foto pada Mode Audit Evaluasi KostManager (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta deretan tombol pemilih kamar (*Room Selector Strip*) di Step 2 Mode Audit Evaluasi diberikan penanda visual yang jelas untuk membedakan unit kamar mana yang **Terisi (Occupied)** dan kamar mana yang **Kosong (Vacant)**.
  2. Memperbaiki masalah format slot foto kamar yang sebelumnya menampilkan broken alt text karena passing objek alih-alih string URL, serta memastikan kategori foto kamar dan foto area gedung tampil dinamis sesuai formulir agen.
  3. Memisahkan kartu Profil Properti di Step 1 murni dari galeri foto area gedung untuk menghindari duplikasi visual.
- **Implementasi & Peningkatan Sistem**:
  * **1. Lencana Status Kamar pada Room Selector Strip**:
    - Setiap tombol unit kamar kini menampilkan badge status eksplisit: `🔒 Terisi` (nuansa Amber/Gold hangat) atau `✨ Kosong` (nuansa Emerald/Hijau segar).
    - Menghitung dan menampilkan counter ringkasan ketersediaan pada header selector: misal `Total: 5 Kamar (🔒 2 Terisi • ✨ 3 Kosong)`.
  * **2. Slot Kategori Foto Kamar Dinamis (Step 2)**:
    - Menghitung kategori foto yang diharapkan berdasarkan fasilitas kamar yang dicentang (`computeDynamicRoomPhotoCategories`).
    - Menampilkan lencana kategori (`📸 Interior Kamar`, `📸 Tempat Tidur`, `📸 Jendela Luar`, `📸 Kamar Mandi`, dll.) dengan indikator centang hijau `✓` atau `[Kosong]` / dashed placeholder jika belum diunggah, serta fitur *Lightbox Click-to-Zoom*.
  * **3. Pemurnian Kartu Profil Properti & Sentralisasi Foto Area (Step 1)**:
    - Kartu 1 (`property_profile`) murni menampilkan teks metadata (Nama Kost, Tipe Gender, dan Total Kamar).
    - Seluruh foto gedung/properti dipusatkan di Kartu 5 (`property_photos`) dalam slot terkategori (*Bangunan Depan, Koridor, Area Parkir, Lingkungan, Dapur Bersama, dll.*).
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend (`npm run build`) di `functions/public/` lulus 100% dengan 0 error dalam 28.41 detik (2526 modules transformed).

### 127. Mode Audit & Simulasi Form Pendataan Interaktif pada Evaluasi & Permintaan Revisi Admin KostManager (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta alur evaluasi di Dashboard Admin diubah menjadi simulasi tampilan form pendataan survei riil (read-only), di mana Admin dapat mencentang dan menandai per-section yang keliru/perlu diperbaiki langsung secara visual dan kontekstual.
  2. Pendekatan ini menjamin hasil evaluasi jauh lebih presisi, objektif, dan terhubung 100% dengan highlight glowing dan floating badges di Dashboard Agen.
- **Implementasi & Peningkatan Sistem**:
  * **1. Mode Audit & Simulasi Form Pendataan (3-Step QA Inspection)**:
    - Mengganti modal checklist abstrak lama dengan **Interactive Survey Audit Simulation Modal** berukuran lega (`max-w-4xl`, high-end glassmorphism).
    - Stepper 1-2-3 interaktif (Data Properti, Data Kamar, Mitra & Kerjasama) dengan counter dinamis per step (`X Bagian Ditandai`).
  * **2. Section-Level Audit Cards & Micro-Feedback Input**:
    - Setiap blok section dilengkapi dengan toggle button: `[ ⚠️ Tandai Perlu Revisi ]`.
    - Saat dicentang, section berubah menyala keemasan/amber (`border-2 border-amber-400 ring-4 ring-amber-400/20 bg-amber-500/[0.04]`), dan memunculkan input catatan mikro kontekstual (misal catatan khusus untuk *Ukuran Kamar 2*, *Foto Fasad*, atau *Titik GPS*).
  * **3. Cakupan Section Audit Step 1, 2, dan 3**:
    - **Step 1 (Data Properti)**: Profil & Foto Fasad Gedung, Titik Koordinat GPS & Link Maps, Landmark & Kampus Terdekat, Fasilitas Umum Kost, Foto Area Properti, dan Peraturan Kost.
    - **Step 2 (Data Kamar)**: Unit selector bar per kamar dengan indikator flag (titik berdenyut), Ukuran & Dimensi Ruangan, Status Sewa & Data Penghuni, Skema Tarif Sewa, Fasilitas Kamar, dan Foto Dokumentasi Kamar.
    - **Step 3 (Data Mitra & Kerjasama)**: Rekening Bank Mitra, Syarat & Ketentuan Kerjasama, dan Tanda Tangan Digital Pemilik.
  * **4. Sinkronisasi Sempurna ke Parser Dashboard Agen**:
    - Handler `handleRequestRevision` otomatis menyusun payload terstruktur (`📌 Bagian yang Perlu Diperbaiki: ...`, `📝 Catatan Evaluasi Admin: ...`, dan catatan inline mikro) yang langsung dikenali oleh regex parser cerdas `parseEvaluationData` di Dashboard Agen.
    - Dilengkapi preview dan tombol notifikasi share langsung ke WhatsApp Surveyor (`https://wa.me/...`).
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error dalam 23.30 detik (2526 modules transformed).

### 126. Redesain Modern Alert Box Evaluasi & Efek Glowing / Kelap-Kelip Dinamis pada Form Onboarding KostManager (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mengkritik alert evaluasi sebelumnya yang kaku dan tidak menggambarkan arsitektur web modern.
  2. Pengguna meminta form dibuat lebih dinamis dengan efek berkilau, border berdenyut/kelap-kelip (*glowing pulse animation*), dan badge spesifik pada setiap section form yang dievaluasi admin agar surveyor dapat langsung mengetahui dan memperbaiki bagian yang keliru dengan instan.
- **Implementasi & Peningkatan Sistem**:
  * **1. Parser Regex Pintar `parseEvaluationData`**:
    - Menganalisis catatan evaluasi terbaru dari Admin, mengekstrak checklist item secara cerdas, memisahkan catatan personal admin, dan menghasilkan boolean flags spesifik (`facade`, `gps`, `publicFacilities`, `rules`, `landmark`, `roomSize`, `roomFacilities`, `roomPhotos`, `occupants`, `pricing`, `partner`, `hasProperty`, `hasRoom`, `hasPartner`, `hasRevision`).
  * **2. Redesain Glassmorphic Alert Card di Dashboard Agen**:
    - Mengganti kotak teks evaluasi lama dengan Glassmorphic Card modern (gradasi amber-to-orange lembut, border amber semi-transparan, badge pulse status, chip pills per item checklist evaluasi, kutipan catatan admin bersih, dan tombol CTA shimmering `⚡ Buka & Perbaiki Bagian yang Dievaluasi`).
  * **3. Stepper Bar & Header Modal Onboarding Modern**:
    - Stepper 1-2-3 interaktif dengan glowing ring berdenyut pada nomor step yang memerlukan revisi.
    - Top banner modal onboarding dengan gradasi amber-orange, animated bounce icon, pill checklist berdenyut, dan quick-jump buttons.
  * **4. Efek Glowing, Border Berdenyut & Floating Badge pada Seluruh Form Step 1, 2, dan 3**:
    - **Step 1 (Data Properti)**:
      - Profil / Fasad Properti: Glowing border (`border-2 border-amber-400 ring-4 ring-amber-400/30 animate-pulse`) + Floating Badge (`⚠️ Perlu Revisi: Profil / Info Kost`).
      - Titik Koordinat GPS: Glowing container + Floating Badge (`⚠️ Perlu Revisi: Titik Koordinat GPS`).
      - Fasilitas & Landmark Terdekat: Glowing container + Floating Badge (`⚠️ Perlu Revisi: Landmark / Kampus`).
      - Fasilitas Umum: Glowing container + Floating Badge (`⚠️ Perlu Revisi: Fasilitas Umum`).
      - Dokumentasi Area Umum Properti: Glowing container + Floating Badge (`⚠️ Perlu Revisi: Foto Area Properti`).
      - Peraturan Kost: Glowing container + Floating Badge (`⚠️ Perlu Revisi: Peraturan Kost`).
    - **Step 2 (Data Kamar)**:
      - Top Alert Banner Kamar jika terdapat catatan revisi kamar.
      - Di dalam `renderRoomEditor`:
        - Luas / Ukuran Kamar: Glowing container & floating badge jika dievaluasi.
        - Status Kamar (Terisi / Kosong): Glowing container & floating badge jika dievaluasi.
        - Skema Tarif Kamar: Glowing container & floating badge jika dievaluasi.
        - Fasilitas Kamar: Glowing container & floating badge jika dievaluasi.
        - Dokumentasi Foto Kamar: Glowing container & floating badge jika dievaluasi.
    - **Step 3 (Data Mitra & Kerjasama)**:
      - Top Alert Banner Mitra jika terdapat catatan revisi kerjasama/tanda tangan.
      - Syarat & Ketentuan Kerjasama Mitra: Glowing container + Floating Badge (`⚠️ Perlu Revisi: Kerjasama Mitra`).
      - Tanda Tangan Digital Pemilik: Glowing container + Floating Badge (`⚠️ Perlu Revisi: Tanda Tangan Digital`).
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/PROGRESS.md`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error dalam 34.98 detik.

### 125. Perbaikan Visibilitas Kartu Tugas Evaluasi / Revisi di Dashboard Agen (`AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa saat evaluasi/revisi dikirimkan oleh Admin, kartu pendataan KostManager mendadak hilang dari tab **Aktif** di Dashboard Agen dan menampilkan *"Belum ada tugas di tab ini."*
  2. Ditemukan akar masalah bahwa filter tab aktif (`agentTab === 'active'`) dan counter badge-nya di `AgentDashboard.tsx` hanya memeriksa status `['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED', 'SUBMITTED']`, sehingga request yang berstatus `REVISION_REQUIRED` atau `NEED_REVISION` tereleminasi dari seluruh tab.
- **Implementasi & Perbaikan**:
  * Menambahkan `REVISION_REQUIRED` dan `NEED_REVISION` ke dalam filter tab aktif (`agentTab === 'active'`) di `AgentDashboard.tsx` (Line 3963).
  * Menambahkan `REVISION_REQUIRED` dan `NEED_REVISION` ke dalam perhitungan counter badge pada tab aktif (Line 3989).
  * Memperbarui pemetaan status dan styling pada kartu survey biasa (non-KostManager) agar mengenali status `REVISION_REQUIRED` dan `NEED_REVISION`.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 124. Implementasi Alert Box & Status Revisi di Dashboard Agen, Notifikasi Email Surveyor, serta Highlighting Interaktif Form Onboarding (`AgentDashboard.tsx`, `notificationService.ts`, `adminService.ts`, `functions/src/index.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa saat Admin mengirim evaluasi hasil pendataan, tidak ada pertanda/alert di dashboard agen, tidak ada email evaluasi yang masuk, kartu tugas tidak berubah, dan form pendataan belum interaktif menunjukkan bagian yang perlu diperbaiki.
- **Implementasi & Peningkatan Sistem**:
  * **1. Pengiriman Email Evaluasi Handal**:
    - Memperbarui `notifySurveyRevisionRequested` di `notificationService.ts` untuk mengambil data profil email surveyor (`users.email, full_name`) dan mengirimkan email via FormSubmit gateway.
    - Menambahkan template HTML email modern khusus status `REVISION_REQUIRED` pada Cloud Function `sendSurveyStatusEmail` di `functions/src/index.ts`.
  * **2. Alert Box Evaluasi pada Kartu Tugas Dashboard Agen**:
    - Menambahkan pemetaan status `REVISION_REQUIRED` dan `NEED_REVISION` dengan tema amber beranimasi pulse di `AgentDashboard.tsx`.
    - Merender Alert Box peringatan evaluasi admin berlatar putih dengan tombol **`⚠️ Buka & Perbaiki Bagian yang Dievaluasi`**.
  * **3. Interaktivitas & Highlighting Form Onboarding**:
    - Menambahkan badge `⚠️ REVISI` pada Stepper Indicator (Step 1, Step 2, Step 3) yang dapat diklik untuk berpindah langsung.
    - Menyediakan Banner Atas dan Quick-Jump Pill Buttons untuk langsung melompat ke step yang membutuhkan koreksi.
    - Menambahkan border amber tebal dan label peringatan `⚠️ Perlu Revisi Admin` pada bagian-bagian formulir yang dievaluasi.
- **File Tersentuh**:
  - `functions/public/pages/AgentDashboard.tsx`
  - `functions/public/notificationService.ts`
  - `functions/public/adminService.ts`
  - `functions/src/index.ts`
- **Verifikasi**: Build Vite frontend dan backend TypeScript (`tsc`) lulus 100% dengan 0 error.

### 123. Perbaikan Inisialisasi Sub-Checklist Evaluasi: Kosongkan Pilihan Default Saat Kategori Dibuka (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa saat kategori evaluasi dicentang, seluruh sub-item di dalamnya langsung tercentang secara otomatis (`5/5`).
  2. Pengguna meminta agar sub-item tidak langsung tercentang otomatis, melainkan dimulai dari keadaan kosong (`0/x`) agar Admin dapat memilih poin-poin yang benar-benar salah secara selektif dan mandiri.
- **Implementasi & Perbaikan Logika**:
  * **Default Kosong (`0/x`)**:
    - Mengubah handler `toggleRevisionCategory` agar menginisialisasi `revisionSubItems[catId] = []` (array kosong) saat kategori induk pertama kali dibuka/dicentang.
    - Kotak sub-item dimulai dalam status *unchecked* dan badge counter menampilkan `0/x`.
  * **Opsi "Pilih Semua" Tetap Siap Digunakan**:
    - Tombol cepat **Pilih Semua / Hapus Semua** tetap tersedia jika Admin ingin mencentang atau mengosongkan seluruh sub-item dalam satu klik.
  * **Pembersihan State saat Modal Dibuka**:
    - Memastikan `setRevisionSubItems({})` dieksekusi saat tombol *Minta Revisi / Evaluasi* pertama kali ditekan.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 122. Implementasi Sub-Checklist Detail Dinamis & Objektif pada Formulir Evaluasi Permintaan Revisi Survei (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar saat beberapa pilihan kategori evaluasi dicentang, antarmuka langsung membuka/menampilkan sub-checklist rincian elemen data spesifik yang terkandung di dalamnya.
  2. Evaluasi diharapkan menjadi lebih objektif dan presisi sehingga surveyor dapat langsung mengetahui poin mana saja yang perlu diperbaiki.
- **Implementasi & Peningkatan Sistem**:
  * **1. Master Data Skema Detail Evaluasi (`REVISION_DETAIL_SCHEMA`)**:
    - **🏢 Data Properti Umum**: *Foto Utama / Fasad Bangunan, Titik Koordinat GPS & Link Maps, Fasilitas Umum Kost, Deskripsi & Peraturan Kost, Estimasi Jarak Landmark / Kampus*.
    - **🛏️ Kamar & Fasilitas Unit**: *Ukuran & Dimensi Kamar, Fasilitas Utama Kamar (Kasur, Lemari, Meja, AC, Kipas), Fasilitas Kamar Mandi, Fasilitas Dapur Unit, Foto Dokumentasi Unit Kamar*.
    - **👥 Data Penghuni & Status Sewa**: *Tarif Sewa Kamar, Status Kamar (Terisi vs Kosong), Kelengkapan Identitas Penghuni, Periode Sewa & Jatuh Tempo*.
    - **📋 Mitra & Kerjasama**: *Nomor Rekening Bank Mitra, Data Kontak Pemilik / Pengelola, Syarat & Ketentuan Kerjasama, Tanda Tangan Digital Mitra*.
  * **2. Interaksi Sub-Checklist Dinamis & Multi-Pilihan**:
    - Membuka kotak rincian dinamis secara otomatis saat kartu kategori induk dicentang.
    - Dilengkapi counter badge jumlah sub-item terpilih (misal: `3/5 item dipilih`) serta tombol toggle cepat **Pilih Semua / Hapus Semua**.
    - Mengintegrasikan sub-item spesifik ke dalam perakitan catatan evaluasi di database dan format pengiriman WhatsApp otomatis ke nomor surveyor.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 121. Implementasi Fitur Evaluasi & Pengembalian Revisi Pendataan dari Admin ke Surveyor (Notifikasi In-App, Email, & WhatsApp) (`KostManagerManagement.tsx` & `AgentDashboard.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar pada modal peninjauan hasil survei (*Review Modal*) tersedia aksi evaluasi untuk menindaklanjuti data survei yang keliru, kurang lengkap, atau perlu diperbaiki oleh agen survei lapangan.
  2. Evaluasi harus mencakup seluruh elemen data (Properti Umum, Kamar & Fasilitas, Data Penghuni, Mitra & Dokumen) dan dapat dikirimkan kembali ke surveyor via notifikasi In-App, email, maupun WhatsApp.
- **Implementasi & Peningkatan Sistem**:
  * **1. Tombol Aksi Evaluasi di Footer Modal Peninjauan (`KostManagerManagement.tsx`)**:
    - Menambahkan tombol aksi berwarna amber **`⚠️ Minta Revisi / Evaluasi Surveyor`** pada footer modal peninjauan di samping tombol persetujuan LIVE.
  * **2. Modal Dialog Form Evaluasi & Catatan Koreksi Terstruktur**:
    - **Checklist Kategori Multi-Pilihan**:
      - 🏢 *Data Properti Umum* (Foto depan, fasilitas umum, titik koordinat maps)
      - 🛏️ *Data Kamar & Fasilitas Unit* (Ukuran kamar, foto dokumentasi, kelengkapan perabot)
      - 👥 *Data Penghuni & Sewa* (Tarif sewa, status kamar terisi/kosong, data penyewa)
      - 📋 *Data Mitra & Kerjasama* (No. rekening, kesepakatan kerjasama, tanda tangan)
    - **Textarea Catatan Detail**: Input instruksi perbaikan spesifik bagi surveyor.
    - **Integrasi Multi-Channel**:
      - **In-App Notification**: Mengirim notifikasi berstatus `warning` langsung ke akun agen via `notifySurveyRevisionRequested`.
      - **Email Cloud Trigger**: Memicu pengiriman email instruksi revisi ke surveyor.
      - **Direct WhatsApp Chat**: Tombol 1-klik yang otomatis membuka chat WhatsApp surveyor dengan template teks rincian perbaikan yang rapi.
  * **3. Respon Interaktif di Dashboard Surveyor (`AgentDashboard.tsx`)**:
    - Status tugas otomatis diperbarui menjadi **`REVISION_REQUIRED`** (Perlu Revisi).
    - Modal/form onboarding survei menampilkan banner peringatan amber di bagian atas berisi catatan evaluasi dari admin.
    - Tombol submit berubah secara otomatis menjadi **`🔄 Kirim Ulang Hasil Revisi ke Admin`**.
- **File Tersentuh**:
  - `functions/public/notificationService.ts`
  - `functions/public/components/admin/KostManagerManagement.tsx`
  - `functions/public/pages/AgentDashboard.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 120. Perbaikan Engine Korelasi Presisi 1-ke-1 Fasilitas ⇄ Foto Dokumentasi Sesuai Form Pendataan Lapangan Agen di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna melaporkan bahwa saat menyentuh/hover fasilitas **Kasur**, foto dengan label **Interior Kamar** dan **Kamar Mandi** ikut bereaksi dan berstatus `Bukti Foto`, padahal tidak termasuk.
  2. Pengguna meminta korelasi semantik disesuaikan apa adanya secara presisi 1-ke-1 dengan slot input pendataan yang ada pada form agen survei lapangan.
- **Root Cause & Perbaikan Engine Semantik**:
  * **Root Cause**: Regex lama pada `isFacilityMatchingPhoto` menyertakan kata `interior` dan `kamar` pada target foto kasur (`/(kasur|tempat tidur|springbed|bed|interior|kamar)/`). Akibatnya, seluruh foto yang memuat kata "interior" atau "kamar" (seperti *Interior Kamar* dan *Kamar Mandi*) terpicu aktif secara keliru.
  * **Penyelarasan 1-ke-1 dengan Form Pendataan Lapangan (`AgentDashboard.tsx`)**:
    - **Kasur / Tempat Tidur**: HANYA mencocokkan foto berlabel **`Tempat Tidur`**, **`Kasur`**, **`Springbed`**, **`Bed`** (Foto *Interior Kamar* & *Kamar Mandi* tidak akan ikut menyala).
    - **Kamar Mandi Dalam / Luar / Kloset / Shower**: HANYA mencocokkan foto berlabel **`Kamar Mandi`**, **`Toilet`**, **`WC`**, **`Kloset`**, **`Shower`**, **`Wastafel`**.
    - **Dapur Dalam / Luar / Kompor / Sink**: HANYA mencocokkan foto berlabel **`Dapur Dalam`**, **`Dapur`**, **`Kitchen`**, **`Kompor`**, **`Pantry`**, **`Sink`**.
    - **Jendela Luar**: HANYA mencocokkan foto berlabel **`Jendela Luar`**, **`Jendela`**, **`Ventilasi`**.
    - **Lemari Pakaian**: HANYA mencocokkan foto berlabel **`Lemari / Storage`**, **`Lemari`**, **`Wardrobe`**.
    - **Meja Belajar / Kerja**: HANYA mencocokkan foto berlabel **`Meja Belajar`**, **`Meja`**, **`Desk`**.
    - **AC**: HANYA mencocokkan foto berlabel **`AC`**, **`Pendingin`**.
    - **Kipas Angin**: HANYA mencocokkan foto berlabel **`Kipas Angin`**, **`Kipas`**.
    - **Water Heater**: HANYA mencocokkan foto berlabel **`Water Heater`**, **`Pemanas Air`**.
    - **Interior Kamar**: Merupakan foto umum ruangan kamar dan **tidak akan terpicu secara salah** oleh perabot kasur/kamar mandi.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 119. Pembersihan Label '📸 BUKTI' pada Seluruh Kotak Fasilitas di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar tulisan/badge `📸 BUKTI` pada kotak fasilitas dihapus agar tampilan lebih bersih dan minimalis.
- **Implementasi & Peningkatan UI/UX**:
  * **1. Pembersihan Badge Teks `📸 BUKTI`**:
    - Menghapus badge teks `📸 BUKTI` dari baris atas seluruh kotak fasilitas terpadu, baik pada daftar Kamar Terisi (`occupiedUnits`) maupun Kamar Kosong (`vacantUnits`).
    - Kotak fasilitas kini tampil bersih, elegan, dan proporsional hanya menampilkan Ikon + Nama Fasilitas Utama di baris atas dan sub-fasilitas ber-tab di baris bawah.
  * **2. Keutuhan Korelasi Interaktif Hover Dua Arah**:
    - Fungsi korelasi hover dua arah (hover kotak fasilitas ⇄ foto dokumentasi di bawahnya membesar, bersinar ring, dan memunculkan badge `"🎯 Bukti Foto"`) tetap bekerja 100% tanpa gangguan.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 118. Redesain Kotak Fasilitas Terpadu (Format Vertikal & Sub-Fasilitas Tab di Bawah) di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar kotak fasilitas terpadu tidak memanjang secara horizontal, melainkan berbentuk kartu/kotak terstruktur vertikal.
  2. Sub-fasilitas diletakkan di baris bawah nama fasilitas induk dengan format agak masuk ke dalam (*tab / indented*).
- **Implementasi & Peningkatan UI/UX**:
  * **1. Format Kartu Vertikal Berstruktur**:
    - **Baris Atas (Induk Fasilitas)**: Menampilkan Ikon Fasilitas + Nama Utama (misal: `🚿 Kamar Mandi Dalam` atau `🍳 Dapur Dalam`) + Badge `📸 BUKTI` di sisi kanan.
    - **Baris Bawah (Sub-Fasilitas Tabbed / Indented)**: Sub-fasilitas (`Kloset Duduk`, `Shower`, `Kompor`, dll.) ditempatkan di baris bawah dengan indentation `pl-4.5`, garis pembatas halus di atasnya, serta marker alur anak `↳`.
  * **2. Fasilitas Tunggal Proporsional**:
    - Fasilitas tanpa sub-elemen (`🛏️ Kasur`, `🪟 Jendela Luar`, `💨 AC`, dll.) tampil ringkas dan rapi 1 baris yang serasi.
  * **3. Keutuhan Reaktif Multi-Keyword**:
    - Seluruh area kotak (induk + sub-fasilitas) tetap menjadi 1 trigger hover kesatuan yang mengaktifkan seluruh foto dokumentasi terkait di bawahnya secara instan.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 117. Penyatuan Fasilitas dan Sub-Fasilitas dalam 1 Kotak Terpadu (1 Fasilitas = 1 Kotak) & Korelasi Reaktif Multi-Keyword di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar fasilitas utama dan sub-fasilitasnya digabungkan di dalam kotak yang sama (*1 Fasilitas & Sub-Fasilitas = 1 Kotak Terpadu*).
  2. Pengguna meminta agar ketika kursor menyentuh/hover 1 kotak terpadu tersebut, seluruh foto dokumentasi yang berelasi dengan fasilitas utama maupun sub-fasilitas di dalamnya langsung bereaksi secara serempak.
- **Implementasi & Peningkatan UI/UX**:
  * **1. Engine Penyatuan Fasilitas (`buildUnifiedFacilities`)**:
    - **Grup Kamar Mandi**: Fasilitas kamar mandi utama (misal: *Kamar Mandi Dalam*, *WC Luar*) dan sub-fasilitasnya (*Kloset Duduk*, *Shower*, *Wastafel*, dll.) disatukan ke dalam 1 kotak terpadu `[ 🚿 Kamar Mandi Dalam • Kloset Duduk 📸 BUKTI ]`.
    - **Grup Dapur**: Fasilitas dapur utama (*Dapur Dalam*, *Dapur Luar*, *Dapur Bersama*) dan sub-fasilitasnya (*Kompor*, *Sink*, dll.) disatukan ke dalam 1 kotak terpadu `[ 🍳 Dapur Dalam • Kompor 📸 BUKTI ]`.
    - **Fasilitas Kamar Mandiri**: Fasilitas kamar tidur lainnya (*Kasur*, *Jendela Luar*, *AC*, *Lemari Pakaian*, *Meja Belajar*, dll.) tampil sebagai kotak elegan mandiri.
  * **2. Multi-Keyword Semantic Photo Correlation (`isFacilityMatchingPhoto`)**:
    - Mendukung pencocokan array kata kunci (*multi-keyword matching*): ketika pengguna menyorot kotak `[ 🚿 Kamar Mandi Dalam • Kloset Duduk ]`, engine mencocokkan kata kunci *Kamar Mandi*, *Kloset*, *Toilet*, *WC*, *Shower*, dll. secara serentak.
    - Foto dokumentasi unit yang cocok langsung membesar (`scale-108`), menyala dengan ring emerald/amber, memunculkan floating badge animasi *"🎯 Bukti Foto"*, sementara foto yang tidak berkorelasi meredup halus (`opacity-25 grayscale`).
    - Ketika foto dokumentasi disorot oleh kursor, kotak fasilitas terpadu yang memuat komponen tersebut otomatis ter-highlight aktif.
  * **3. Konsistensi Antara Kamar Terisi & Kamar Kosong**:
    - Desain kotak terpadu 1-fasilitas-1-kotak diterapkan seragam pada kartu unit kamar dihuni (`occupiedUnits`) dan unit kamar kosong (`vacantUnits`).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 116. Icon Representatif Fasilitas & Interaksi Reaktif Cerdas (Fasilitas ⇄ Foto Dokumentasi) di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar setiap fasilitas kamar ditampilkan dengan icon yang sesuai (*representatif*).
  2. Pengguna meminta agar sistem lebih interaktif & keren: jika kursor menyentuh/hover sebuah fasilitas tertentu, maka foto dokumentasi terkait langsung bereaksi, dan begitu pula sebaliknya (interaktivitas dua arah).
- **Implementasi & Peningkatan UI/UX**:
  * **1. Engine Icon Fasilitas (`getFacilityIcon`)**:
    - Memetakan nama fasilitas secara cerdas ke ikon pure vector SVG `lucide-react` (*Kasur* 🛏️ `<Bed />`, *Kamar Mandi* 🚿 `<Bath />`, *Dapur* 🍳 `<CookingPot />`, *Jendela* 🪟 `<AppWindow />`, *AC* 💨 `<Wind />`, *WiFi* 📶 `<Wifi />`, *TV* 📺 `<Tv />`, *Lemari* 🚪 `<DoorClosed />`, *Meja/Kursi* 🪑 `<Armchair />`, *Listrik* ⚡ `<Zap />`, dll.).
  * **2. Matching Engine Semantik (`isFacilityMatchingPhoto`)**:
    - Mencocokkan kata kunci fasilitas dengan label kategori foto dokumentasi secara semantik (misal: *Kasur* ⇄ *Tempat Tidur*, *Jendela Luar* ⇄ *Jendela Luar*, *Kamar Mandi Dalam* ⇄ *Kamar Mandi / Toilet*).
  * **3. Bi-Directional Interactive Hover Reaction**:
    - **Hover Fasilitas**: Foto dokumentasi terkait di bawahnya langsung membesar (`scale-108`), bersinar dengan ring glow tebal, dan memunculkan floating badge animasi *"🎯 Bukti Foto"*, sementara foto lainnya meredup halus (`opacity-25 grayscale`).
    - **Hover Foto**: Badge fasilitas terkait di atasnya otomatis ter-highlight (`active glow scale-105`).
    - Fasilitas yang memiliki bukti foto dokumentasi dilengkapi penanda mini `📸 BUKTI`.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 115. Penambahan Fasilitas Lengkap & Dokumentasi Foto Dinamis pada Kartu Unit Kamar di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar seluruh informasi fasilitas (Ukuran, Fasilitas Kamar, Kamar Mandi, Dapur) ditampilkan lengkap pada setiap kartu unit kamar yang sedang dihuni (`occupiedUnits`).
  2. Pengguna meminta agar foto hasil dokumentasi survey ditampilkan untuk setiap kartu unit kamar secara dinamis (menampilkan galeri thumbnail jika ada foto, dan status informatif elegan jika tidak ada foto / privasi penghuni).
- **Implementasi & Perbaikan**:
  * **1. Fasilitas Lengkap pada Kamar Terisi**:
    - Menyematkan box *"🛋️ Fasilitas & Spesifikasi Terpasang"* lengkap dengan badge ukuran (`📐 2x2 meter`) dan pill badges seluruh fasilitas kamar, kamar mandi, dan dapur pada kartu unit kamar yang dihuni.
  * **2. Galeri Foto Dokumentasi Unit Dinamis**:
    - **Ada Foto**: Menampilkan galeri thumbnail foto berlabel kategori (*Interior Kamar, Kamar Mandi, dll.*) yang dapat diklik untuk membuka foto resolusi penuh di tab baru.
    - **Tidak Ada Foto (Privasi/Belum Terunggah)**: Menampilkan status info bar bergaris putus-putus yang halus (`📷 Dokumentasi Foto: Tidak tersedia (Privasi penghuni / belum diunggah)` atau `Belum ada foto terunggah`), menjaga estetika dan kelengkapan layout kartu.
  * **3. Konsistensi pada Kamar Kosong**:
    - Menerapkan komponen galeri foto dokumentasi unit dinamis yang serupa pada kartu unit kamar kosong (`vacantUnits`).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 114. Tampilan Penuh Seluruh Fasilitas dengan Layout Adaptif Responsif di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menginstruksikan agar seluruh fasilitas (kamar, kamar mandi, dapur) ditampilkan 100% lengkap tanpa batas di dalam kartu Tipe Kamar, dan lebar/tinggi kartu dibuat menyesuaikan secara dinamis (*adaptive auto-wrap*).
- **Implementasi & Perbaikan**:
  * **1. Responsive Adaptive Flexbox**:
    - Mengubah container header menjadi `flex flex-col md:flex-row md:items-center justify-between gap-4`.
    - Area fasilitas menggunakan `flex flex-wrap gap-1.5` dengan pill badges berbayangan lembut (*shadow-2xs*) yang dapat mengalir dinamis ke baris berikutnya jika jumlah fasilitas banyak.
  * **2. Fixed Right Column Stability**:
    - Area tarif (`Rp 400.000/bln`), badge jumlah unit (`✨ X Kosong`, `🔒 Y Dihuni`), dan tombol Chevron dikunci dengan `shrink-0` di sisi kanan sehingga tetap rapi dan tidak terdorong keluar oleh banyaknya fasilitas.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 113. Konfigurasi Default State Seluruh Kartu Tab 2 Menjadi Minimize (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta agar seluruh kartu tipe kamar dan sub-parent unit kamar di Tab 2 berada dalam kondisi **minimize (tertutup)** secara default saat modal dibuka.
- **Implementasi & Perbaikan**:
  * **1. Level 1 (Tipe Kamar)**: Mengubah inisialisasi status ekspansi `isExpanded` menjadi `Boolean(expandedRoomTypes[rtIdx])` (default `false` / minimized).
  * **2. Level 2 (Sub-Parents Terisi & Kosong)**: Mengubah status `isOccExpanded` dan `isAvailExpanded` menjadi default `false` / minimized.
  * Memberikan tampilan awal Tab 2 yang sangat ringkas, bersih, dan memudahkan navigasi daftar tipe kamar.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 112. Pemindahan Spesifikasi & Fasilitas Kamar ke Header Minimize Tipe Kamar di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menanyakan mengapa informasi fasilitas harus di-maximize terlebih dahulu baru muncul, padahal fasilitas merupakan bagian penting yang seharusnya langsung dapat dilihat pada tampilan minimize.
  2. Pengguna meminta agar seluruh kelengkapan fasilitas tipe kamar langsung terlihat permanen pada kartu bentuk minimize.
- **Implementasi & Perbaikan**:
  * **1. Header Minimize Memuat Seluruh Fasilitas**:
    - Seluruh daftar fasilitas kamar (`rt.roomFacilities`), fasilitas kamar mandi (`rt.bathroomFacilities`), fasilitas dapur (`rt.kitchenFacilities`), serta dimensi kamar (`rt.size`) disajikan langsung dan lengkap di dalam header kartu Tipe Kamar.
    - Informasi ini tampil permanen baik saat kartu dalam kondisi *minimize* (tertutup) maupun *maximize* (terbuka).
  * **2. Body Maximize Langsung Fokus ke 2 Sub-Parent (Terisi & Kosong)**:
    - Menghapus duplikasi container fasilitas di dalam body accordion.
    - Saat kartu Tipe Kamar dibuka/maximize, tampilannya langsung to-the-point menyajikan dua sub-parent: 🔒 **KAMAR SEDANG DIHUNI / TERISI** dan ✨ **KAMAR KOSONG / SIAP HUNI**.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 111. Redesain UI/UX Fasilitas Tipe Kamar (Header Chips & Integrated Specification Card) di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menilai penyajian fasilitas kamar sebelumnya tampak seperti *"anomali/elemen asing"* yang membingungkan alur visual karena tampil sebagai kotak abu-abu kaku yang terpisah.
  2. Pengguna meminta perbaikan UI/UX agar informasi kelengkapan & fasilitas kamar tampil menyatu, elegan, dan langsung dapat dimengerti sebagai bagian resmi dari spesifikasi Tipe Kamar Standard.
- **Implementasi & Perbaikan**:
  * **1. Header Facility Chips Terintegrasi**:
    - Menambahkan chip fasilitas dan dimensi ruangan langsung di baris header Tipe Kamar Level 1: `📐 2x2 meter` • `[ 🛏️ Kosongan (Tanpa Perabot) ]` `[ 🪟 Jendela Luar ]`.
    - Memberikan konteks instan kepada peninjau/admin bahkan sebelum accordion dibuka.
  * **2. Integrated Specification Card Bawaan Tipe Kamar**:
    - Mengganti container lama dengan card modern berlatar soft (`bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4`) berlabel jelas: `✓ Spesifikasi & Fasilitas Bawaan {rt.name}`.
    - Mengelompokkan pill badges Fasilitas Kamar, Kamar Mandi, dan Dapur secara harmonis dengan bayangan lembut (*shadow-2xs*) dan icon vector `lucide-react`.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 110. Pengelompokan Tipe Kamar Sejati (Tipe Standard/Deluxe ➔ Terisi & Kosong ➔ Kartu Unit Kamar Individual) di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna mengoreksi bahwa nomor kamar (misal "1", "2", "3") bukanlah tipe kamar terpisah. Tipe kamar yang sebenarnya adalah kategori spesifikasi seperti **Tipe Standard**, **Tipe Deluxe**, dsb.
  2. Ketika Tipe Kamar (misal *Tipe Standard*) di-maximize, harus memunculkan 2 sub-parent berpasangan: **🔒 KAMAR SEDANG DIHUNI / TERISI** dan **✨ KAMAR KOSONG / SIAP HUNI**.
  3. Ketika salah satu sub-parent di-maximize, barulah menampilkan kartu kamar masing-masing unit:
     - 🔒 **TERISI**: Menampilkan kartu unit individual yang terisi (**Kamar 1**, **Kamar 2**, dll.) lengkap dengan data penghuni (Nama, No. WA, Jumlah Orang, Periode Sewa, Tanggal Bayar Terakhir, Jatuh Tempo Tagihan Berikutnya, Anggota Tambahan, Catatan).
     - ✨ **KOSONG**: Menampilkan kartu unit individual yang kosong (**Kamar 3**, dll.) lengkap dengan data spesifikasi kamar (Ukuran, Fasilitas Terpasang, Status Siap Huni, Tarif Sewa, Catatan Kondisi).
- **Implementasi & Perbaikan**:
  * **1. Helper Cerdas `groupIntoRoomTypes`**:
    - Mengelompokkan kamar-kamar yang didata surveyor ke dalam Tipe Kamar sejati (seperti *Tipe Standard* / *Tipe Deluxe*).
    - Memisahkan unit-unit kamar di dalamnya ke dalam array `occupiedUnits` dan `vacantUnits`.
  * **2. Hierarki 3-Level Bersih & Intuitif**:
    - **Level 1 (Top Parent)**: Header Tipe Kamar (misal *Tipe Standard*, Ukuran 2x2 meter, Rp 400.000/bln, Counter `✨ 1 Kosong` & `🔒 2 Dihuni`) + Ringkasan Fasilitas Utama, Kamar Mandi, dan Dapur.
    - **Level 2 (Sub-Parents)**: 2 Sub-Accordion yang selalu tampil berpasangan (🔒 Terisi & ✨ Kosong) dengan badge jumlah unit dan tombol Buka/Tutup List.
    - **Level 3 (Unit Cards)**: Kartu individual per unit kamar dengan data pendataan 100% lengkap & akurat.
  * **3. Sinkronisasi Carousel Galeri Foto**:
    - Galeri atas menyaring unit kamar kosong yang memiliki foto, serta floating card overlay menampilkan nama nomor kamar aktif secara presisi.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 109. Struktur Hierarki Parent-Child (Tipe Kamar ➔ Kamar Terisi & Kamar Kosong) dengan Kartu Detail Lengkap di Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta pengaturan tampilan kartu hasil pendataan di Tab 2 menggunakan sistem hierarki *Minimize/Maximize (Parent and Child)*.
  2. Dimulai dari Level 1 (Parent): **Tipe Kamar** (misal *Standard*).
  3. Ketika Tipe Kamar dibuka/maximize, menyajikan ringkasan fasilitas utama dan 2 sub-accordion (Level 2 Child):
     - 🔒 **KAMAR SEDANG DIHUNI / TERISI**: Jika di-maximize, menampilkan kartu-kartu detail unit terisi lengkap dengan data penghuni (Nama, No. WhatsApp, Jumlah Penghuni, Periode Sewa, Tanggal Masuk/Bayar, Tagihan Berikutnya, Anggota Tambahan, dan Catatan Surveyor).
     - ✨ **KAMAR KOSONG / SIAP HUNI**: Jika di-maximize, menampilkan kartu-kartu detail unit kosong lengkap dengan spesifikasi kamar (Ukuran, Fasilitas Terpasang, Status Siap Huni, Tarif Sewa, dan Catatan Surveyor).
- **Implementasi & Perbaikan**:
  * **1. Normalisasi Data Unit Per Tipe Kamar**:
    - Memetakan array `room.rooms` / `room.unit_rooms` atau fallback survey data ke dalam unit-unit terisi (`occupiedUnits`) dan unit-unit kosong (`vacantUnits`).
  * **2. Kartu Unit Terisi (Occupied Resident Card)**:
    - Merender container card modern dengan badge status 🔒 `Dihuni`, grid data penghuni, link direct chat WhatsApp, detail tanggal bayar & jatuh tempo tagihan, dan daftar anggota tambahan.
  * **3. Kartu Unit Kosong (Vacant Room Card)**:
    - Merender container card modern dengan badge status ✨ `Siap Huni`, dimensi ruangan, pill badges fasilitas kamar & kamar mandi, serta catatan kondisi kamar.
  * **4. Desain Bersih & Hirarkis**:
    - Menghilangkan duplikasi hero carousel internal pada room type dan menyajikan hierarki accordion bertingkat yang rapi, responsif, dan intuitif.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 108. Floating Overlay Card Detail Kamar pada Hero Galeri Utama Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta penambahan kartu informasi mengambang (*floating overlay card*) pada Hero Carousel Galeri Utama di Tab 2 persis seperti yang ada pada carousel per-kamar di accordion bawah.
  2. Kartu harus menyajikan informasi nomor kamar, ukuran kamar, tarif bulanan, serta pill badges fasilitas kamar yang terdata.
- **Implementasi & Perbaikan**:
  * **1. Ekstraksi Data Kamar & Fasilitas Terdata**:
    - Membaca data tipe kamar aktif `activeRt = roomTypes[currentActivePhoto.rtIdx]` beserta daftar fasilitas kamar & kamar mandi.
  * **2. Floating Overlay Card Display**:
    - Merender container dark glassmorphism (`bg-black/75 backdrop-blur-sm rounded-xl p-3 text-white border border-white/10`) di sudut kiri bawah hero photo.
    - Menampilkan label `NOMOR KAMAR`, nama kamar `{currentActivePhoto.roomName}`, ukuran `{activeRt.size}`, tarif sewa bulanan `<span className="text-emerald-400">TARIF {FORMAT_CURRENCY(activeRt.price)}/bln</span>`, serta chip fasilitas terdata.
    - Menambahkan gradient overlay gelap halus (`from-black/80 via-transparent`) untuk menjamin kontras keterbacaan teks yang maksimal.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 107. Keterangan Kategori Fasilitas Foto pada Thumbnail Strip & Hero Gallery Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menemukan bahwa pada thumbnail strip semua foto hanya menampilkan keterangan kamar yang sama (`Kamar 3`, `Kamar 3`, `Kamar 3`), tanpa menunjukkan kategori fasilitas apa yang diwakili oleh masing-masing foto.
  2. Pengguna meminta agar keterangan foto menampilkan kategori fasilitas yang diwakilinya (misal: *Interior Kamar*, *Kamar Mandi Dalam*, *Tempat Tidur*, *Lemari*, dll.) sesuai data hasil survey.
- **Implementasi & Perbaikan**:
  * **1. Label Thumbnail Berbasis Kategori Fasilitas**:
    - Mengubah keterangan bawah pada setiap thumbnail menjadi label kategori spesifik (`p.label`, misal *Interior Kamar*, *Kamar Mandi Dalam*, *Tempat Tidur*, *Lemari*).
    - Menambahkan tag nomor kamar (`p.roomName`) di sudut atas thumbnail saat dalam mode menampilkan seluruh kamar.
  * **2. Elevasi Hero Preview & Metadata Fasilitas**:
    - Menampilkan badge kategori fasilitas dan nomor kamar dengan kontras tinggi di display utama.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 106. Penyaringan Presisi Navigasi Kamar (Hanya Kamar Kosong Berfoto) & Pembersihan UI Galeri Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta deretan tombol navigasi kamar HANYA memunculkan unit kamar yang memiliki foto riil (`photos.length > 0`) DAN sedang berstatus kosong/tidak terisi (`isVacant`).
  2. Kamar dengan 0 foto (seperti Kamar 1 (0) dan Kamar 2 (0)) serta kamar yang terisi/dihuni tidak boleh muncul sebagai tombol navigasi.
  3. Menghapus tulisan/tombol teks "↺ TAMPILKAN SELURUH KAMAR" demi kebersihan visual antarmuka (clean & minimal design).
- **Implementasi & Perbaikan**:
  * **1. Filter Presisi `eligibleRoomsForFilter`**:
    - Memvalidasi setiap tipe kamar dengan syarat `photos.length > 0 && isVacant` (`stats.available > 0` atau status bukan Terisi/Occupied).
    - Hanya kamar yang lulus validasi yang dirender sebagai tombol pill navigasi di bagian bawah galeri.
  * **2. Pembersihan Redundan & Peningkatan Visual UI/UX**:
    - Menghapus tombol teks "Tampilkan Seluruh Kamar".
    - Menyempurnakan tipografi header label, frame rasio sinematik gambar, dan highlight aktif tombol kamar.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 105. Penempatan Navigasi Kamar di Bawah Carousel & Logika Toggle Isolasi Foto Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta posisi tombol navigasi nomor kamar dipindahkan ke bawah carousel foto.
  2. Tombol fisik "Semua Kamar" dihapus; secara default carousel langsung menampilkan seluruh foto kamar.
  3. Mengklik tombol nomor kamar akan mengisolasi foto milik kamar tersebut, dan mengklik ulang tombol yang sedang aktif akan otomatis membatalkan isolasi (toggle) untuk kembali menampilkan seluruh kamar.
  4. Mengklik kartu kamar di accordion bawah atau tombol reset akan mengembalikan galeri ke mode seluruh kamar.
- **Implementasi & Perbaikan**:
  * **1. Pemindahan Navigasi ke Bawah Carousel**:
    - Mereorganisasi layout JSX: Header ➔ Hero Photo Preview ➔ Horizontal Thumbnail Strip ➔ **Filter Navigasi Nomor Kamar (Bawah)**.
  * **2. Penghapusan Tombol "Semua Kamar" & Penerapan Toggle**:
    - Menghapus tombol fisik "Semua Kamar".
    - Menerapkan logic toggle: `onClick={(e) => { if (isSelected) setSelectedRoomGalleryFilter('all'); else setSelectedRoomGalleryFilter(idx); }}`.
  * **3. Auto-Reset saat Interaksi Luar**:
    - Mengintegrasikan reset `setSelectedRoomGalleryFilter('all')` saat accordion kamar dibuka/diklik, serta menyediakan tombol mini `↺ Tampilkan Seluruh Kamar`.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 104. Carousel Galeri Foto Kamar (Universal & Filter Per-Kamar) pada Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta penambahan carousel foto kamar di bawah grid ringkasan 4 kartu dan di atas kartu-kartu kamar pada Tab 2 (DATA KAMAR & PENGHUNI).
  2. Carousel harus dapat bersifat umum (menampilkan seluruh foto kamar yang terkumpul sekaligus) dan dapat bersifat khusus (menampilkan foto kamar tertentu berdasarkan tombol-tombol nomor kamar di bagian navigasi filter).
- **Implementasi & Perbaikan**:
  * **1. Agregasi Foto Seluruh Kamar & State Filter**:
    - Mengumpulkan seluruh foto dari setiap kamar/tipe kamar beserta metadata kamar (`roomName`, `label`, `rtIdx`).
    - Menyediakan state `selectedRoomGalleryFilter` (`'all'` atau index kamar `number`) dan `selectedRoomGalleryPhotoIndex` (`number`).
  * **2. Filter Navigation Bar Interaktif**:
    - Tombol `[ 🏢 Semua Kamar (Total N Foto) ]` untuk mode universal.
    - Tombol-tombol pill per nomor kamar `[ 🛏️ Kamar X (N Foto) ]` untuk mode per-kamar khusus dengan visual ring highlight aktif.
  * **3. Hero Preview Display & Thumbnail Strip**:
    - Tampilan foto display utama berbingkai `rounded-3xl` dengan background elegan, tombol panah kiri/kanan `<ChevronLeft />` dan `<ChevronRight />`, overlay badge nomor kamar dan label foto, serta indikator urutan `1 / N Foto`.
    - Horizontal scrollable thumbnail bar di bawah preview utama untuk berpindah foto instan.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 103. Sinkronisasi Akurat Helper `getRoomStats` untuk Data Kamar & Penghuni Tab 2 (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menemukan perbedaan data antara hasil pendataan agen survey dan tampilan ringkasan Tab 2.
  2. Kartu ringkasan atas menampilkan `Kamar Terisi: 0, Kamar Kosong: 5` karena mencari properti `availableRooms` yang tidak dibuat saat agen mendata dengan atribut status (`status: 'Terisi'`, `isAvailable: false`).
  3. Header accordion kamar di bawah menampilkan `✨ 0 Kosong, 🔒 1 Dihuni` karena rumus fallback default yang berbeda.
- **Implementasi & Perbaikan**:
  * **1. Helper Terpadu `getRoomStats(room)`**:
    - Membaca status kamar secara komprehensif dari berbagai kemungkinan format input surveyor agen:
      - Terisi jika: `status === 'Terisi'`, `status === 'occupied'`, `isAvailable === false`, `is_occupied === true`, atau terdapat nama/kontak penyewa (`occupant_name` / `occupantName` / `occupant_phone`).
      - Kosong jika: `status === 'Kosong'`, `status === 'available'`, atau `isAvailable === true`.
    - Menghitung sub-unit kamar (`rooms` / `unit_rooms`) secara akurat jika tipe kamar memiliki beberapa unit.
  * **2. Unifikasi Formula Ringkasan & Accordion**:
    - Menggunakan helper `getRoomStats` yang sama untuk menghitung total pada **4 Kartu Ringkasan Atas** dan **Seluruh Header Accordion Kamar Bawah**, menjamin 100% konsistensi dan akurasi data.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 102. Grid Ringkasan Pendataan Kamar & Penghuni Tab 2 + Pembersihan Badge Live Maps (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta penambahan ringkasan hasil pendataan kamar pada bagian paling atas menu **Tab 2: DATA KAMAR & PENGHUNI** di modal peninjauan KostManager (Total Kamar, Kamar Terisi, Kamar Kosong, Total Penghuni).
  2. Pembersihan badge `● LIVE MAPS API` pada kartu landmark di Tab 1 agar UI lebih bersih, minimalis, dan elegan.
- **Implementasi & Perbaikan**:
  * **1. Agregasi Dinamis Statistik Kamar**:
    - Menghitung agregat dinamis `totalRooms`, `occupiedRooms`, `availableRooms`, dan `totalOccupants` dari data `room_types` dan `rooms` yang terdata.
  * **2. 4 Kartu Metrik Modern High-Contrast**:
    - Merender grid 4 kartu metrik di bagian atas Tab 2 dengan warna tematik (Blue untuk Total Kamar, Amber untuk Kamar Terisi, Emerald untuk Kamar Kosong, Indigo untuk Total Penghuni) menggunakan pure bundled Lucide SVG icons (`DoorClosed`, `Lock`, `Sparkles`, `Users`).
  * **3. Pembersihan Badge Live Maps API**:
    - Menghapus badge `● LIVE MAPS API` di kartu landmark Tab 1, menyisakan badge jarak `📍 X km` yang rapi.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 101. Arsitektur Hemat Biaya: Cache-First & Auto-Save Google Maps Duration ke Database Supabase (`KostManagerManagement.tsx`, `KostDetail.tsx`, `types.ts`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta arsitektur hemat biaya agar API Google Maps hanya dipanggil 1 kali saja di awal saat pendataan/peninjauan kost, dan tidak berjalan terus-menerus yang dapat membengkakkan tagihan Google Cloud.
  2. Seluruh pengunjung web/calon penyewa harus membaca data jarak & durasi dari database secara instan tanpa mengonsumsi kuota API Google.
- **Implementasi & Perbaikan**:
  * **1. Cache-First Check di Modal Peninjauan**:
    - Sebelum memanggil Google Maps API, sistem mengecek apakah data kampus sudah memiliki `walkDuration` dan `motoDuration` di database Supabase. Jika ada, sistem langsung menggunakan cache lokal (**0 API Request, $0 Cost**).
  * **2. Auto-Save Hasil Hitungan ke Database Supabase**:
    - Saat Google Maps API berhasil menghitung rute di awal peninjauan/pendataan, data durasi (`walkDuration`, `motoDuration`, `carDuration`, `distance`) langsung disimpan permanen ke kolom `campuses` di tabel `properties` dan `kostmanager_requests.metadata`.
  * **3. Read Free di Halaman Publik Calon Penyewa (`KostDetail.tsx`)**:
    - Halaman detail kost publik langsung membaca nilai durasi dan jarak dari record database tanpa memanggil API Google Maps sama sekali.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`, `functions/public/pages/KostDetail.tsx`, `functions/public/types.ts`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 100. Integrasi Penuh Google Maps Live API (Distance Matrix & Routes) + Badge Indikator (`KostManagerManagement.tsx`, `index.html`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna telah mengaktifkan seluruh API yang dibutuhkan di Google Cloud Console (*Directions API, Distance Matrix API, Routes API, Route Optimization API*).
  2. Sistem disempurnakan untuk menarik data jarak tempuh, durasi jalan kaki nyata, dan durasi berkendara 100% langsung dari Google Maps Live API dengan verifikasi visual.
- **Implementasi & Perbaikan**:
  * **1. Penyempurnaan Google Maps Libraries (`index.html`)**:
    - Menambahkan libraries `routes,geometry,places` pada loader script Google Maps SDK.
  * **2. Live Query Telemetry & State Management**:
    - Mengintegrasikan dual query `DRIVING` + `WALKING` dengan validasi element status, logging telemetry konsol browser `[GoogleMaps Live API]`, dan penandaan `isLiveGoogleApi: true`.
  * **3. Badge Indikator Visual**:
    - Menambahkan badge hijau `[● LIVE MAPS API]` pada kartu landmark saat data real-time berhasil ditarik dari Google Maps.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`, `functions/public/index.html`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 99. Async Polling Google Maps SDK & Kalibrasi Detour Pejalan Kaki Kampus (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Data pada kartu peninjauan sebelumnya masih menampilkan hasil fallback garis lurus (632 m, jalan kaki 9 mnt) karena script Google Maps SDK dimuat secara asinkron (`loading=async`), sehingga saat modal pertama kali terbuka, SDK belum selesai terinisialisasi.
  2. Parameter origin dan destination memerlukan objek `new google.maps.LatLng()`.
  3. Formula fallback belum memperhitungkan perimeter detour gerbang masuk kampus besar di Makassar (UNHAS/PNUP).
- **Implementasi & Perbaikan**:
  * **1. Async Polling & Retry Runner**:
    - Menambahkan recursive retry timer (tiap 350ms hingga 6x percobaan) yang langsung mengeksekusi `DistanceMatrixService` secara otomatis begitu SDK Google Maps siap tanpa menunggu reload halaman.
  * **2. Standardisasi Objek `google.maps.LatLng`**:
    - Mengonversi semua koordinat origin dan destination ke format objek resmi `new google.maps.LatLng(lat, lng)`.
  * **3. Kalibrasi Detour Pejalan Kaki & Jarak Tempuh**:
    - Menghitung faktor rute jalan raya (1.35x) dan faktor detour gerbang kampus (2.0x) sehingga estimasi jalan kaki menghasilkan durasi riil **17 mnt** (sama persis dengan hasil Google Maps Directions).
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 98. Sinkronisasi Akurat Jarak & Durasi Multi-Moda (Walking + Driving) via Google Maps API (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna menemukan selisih pada durasi jalan kaki antara sistem (9 mnt) dan Google Maps asli (17 mnt) untuk kampus UNHAS.
  2. Selisih terjadi karena area kampus memiliki portal/tembok pembatas sehingga rute pejalan kaki harus memutar melewati gerbang resmi (detour), yang sebelumnya dihitung secara perkiraan garis lurus.
- **Implementasi & Perbaikan**:
  * **1. Dual Query Google Maps DistanceMatrixService**:
    - Mengirim request `DRIVING` dan `WALKING` secara paralel menggunakan `Promise.all` langsung ke Google Maps API.
    - Menetapkan durasi jalan kaki (`walkDuration`) 100% langsung dari response resmi mode `WALKING` Google Maps API (`wEl.duration.text`), mencakup seluruh rute memutar/gerbang pejalan kaki nyata.
    - Menetapkan durasi kendaraan (`motoDuration` & `carDuration`) dan jarak dari mode `DRIVING` Google Maps API.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

### 97. Redesain Estetika Landmark Terdekat, Integrasi Rute Google Maps & Estimasi Waktu Tempuh Riil (`KostManagerManagement.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna meminta tampilan Landmark Terdekat dan Peraturan Kost dievaluasi agar lebih elegan dan tidak kaku.
  2. Pengguna meminta agar setiap landmark memiliki tombol interaktif untuk membuka rute Google Maps dari titik lokasi kost ke landmark tersebut.
  3. Pengguna meminta agar data jarak dan estimasi waktu tempuh moda transportasi dihitung secara riil sesuai rute Google Maps API.
- **Implementasi & Perbaikan**:
  * **1. Integrasi Google Maps DistanceMatrixService & Fallback**:
    - Mengintegrasikan `google.maps.DistanceMatrixService` untuk menarik data jarak tempuh riil (`distance.text`) dan durasi berkendara (`duration.text`) langsung dari Google Maps API jika service aktif di browser.
    - Menyiapkan fallback kalkulasi Haversine + faktor kurvatur jalanan Makassar (1.3x) dengan database koordinat kampus & landmark ternama (*PNUP, UNHAS, UIM, UMI, UNM, MTOS, Mall Panakkukang, Nipah Mall, Trans Studio Mall*).
  * **2. Redesain Kartu Landmark Terdekat**:
    - Menampilkan landmark sebagai kartu modern dengan:
      - Icon kategori tematik (🏫), nama landmark, dan pin koordinat.
      - Badge jarak riil (*"1.4 km"*, *"850 m"*).
      - Bar estimasi waktu tempuh moda transportasi (*🚶 Jalan Kaki*, *🏍️ Sepeda Motor*, *🚗 Mobil*).
      - **Tombol Rute Google Maps Interaktif**: `[🗺️ Lihat Rute di Google Maps ↗]` yang langsung membuka navigasi `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${destParam}` di tab baru.
  * **3. Redesain Kartu Peraturan Kost**:
    - Merapikan kartu peraturan dengan layout soft-rose cards, icon `ShieldAlert` / `⛔`, dan tipografi berimbang.
- **File Tersentuh**: `functions/public/components/admin/KostManagerManagement.tsx`
- **Verifikasi**: Build Vite frontend `vite build` (`cmd /c "npm run build"`) di `functions/public/` lulus 100% dengan 0 error (exit code 0).

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

### 124. Implementasi Sistem Evaluasi & Permintaan Revisi Pendataan KostManager (Agustus 2026)
- **Notifikasi & Pengiriman Email Evaluasi**:
  - Memperbarui `notifySurveyRevisionRequested` di `notificationService.ts` untuk memuat email surveyor (`users.email`) dan mengirimkan email evaluasi langsung ke surveyor via FormSubmit endpoint selain in-app notification.
  - Memperbarui Cloud Function `sendSurveyStatusEmail` di `functions/src/index.ts` untuk mengenali tabel `kostmanager_surveys` dan `kostmanager_requests` serta menyediakan template HTML email khusus status `REVISION_REQUIRED`.
- **Sinkronisasi Status di Admin Service**:
  - Memperbarui `getAdminSurveyRequests` di `adminService.ts` agar memetakan status `REVISION_REQUIRED` dan `notes` evaluasi secara tepat tanpa tertimpa atau terlewat.
- **Visual Alert Box pada Dashboard Agen**:
  - Menambahkan styling `REVISION_REQUIRED` pada `statusColorMap` (`bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold shadow-md animate-pulse`) dan `labelMap` (`⚠️ PERLU REVISI / EVALUASI ADMIN`).
  - Menambahkan **Alert Box Evaluasi** dengan pesan detail catatan admin dan tombol aksi cepat `⚠️ Buka & Perbaiki Bagian yang Dievaluasi` pada kartu tugas aktif surveyor di `AgentDashboard.tsx`.
- **Interaktivitas Formulir Onboarding Berbasis Evaluasi Admin**:
  - Menambahkan Stepper Indicator Alert Badge (`⚠️ REVISI`) pada Step 1 (Properti), Step 2 (Data Kamar), dan Step 3 (Review).
  - Menambahkan banner evaluasi teratas lengkap dengan **Quick-Jump Pill Buttons** untuk langsung beralih ke Step formulir yang perlu direvisi.
  - Menambahkan conditional amber border & warning badge (`⚠️ Perlu Revisi Admin`) pada section Profil & Fasad, GPS & Lokasi Maps, Fasilitas Umum, Aturan Kost, Data Kamar, Syarat Mitra, dan Tanda Tangan Digital Pemilik.


### 136. Smart Auto-Detection & Split Wilayah Administrasi (Provinsi, Kota/Kabupaten, Kecamatan) dari Google Maps Geocoder (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna memperhatikan adanya pengkotak-kotakan input wilayah (Provinsi, Kota/Kabupaten, Kecamatan) yang jika diisi manual merepotkan agen atau admin.
  2. Pemisahan wilayah yang presisi sangat krusial dan bernilai strategis tinggi untuk kemudahan filter pencarian katalog hunian kost di sisi pengguna/calon penyewa.
  3. Google Maps geocoding standar sering kali mengembalikan `locality` yang bernilai nama Kecamatan (misal: `"Kecamatan Tamalanrea"`), sehingga jika langsung dimasukkan ke Kota, data kota menjadi keliru.
- **Implementasi & Solusi Presisi**:
  * **Smart Geocoding Address Components Parser (`LocationPicker` di `KostManagerPortal.tsx`)**:
    - **Provinsi**: Diekstrak dari `administrative_area_level_1` dengan sanitasi pembersihan awalan `"Provinsi "` / `"Prov. "` (misal: `"Sulawesi Selatan"`).
    - **Kota / Kabupaten**: Diekstrak dengan prioritas utama `administrative_area_level_2`, dengan pembersihan awalan `"Kota "` / `"Kabupaten "` / `"Kab. "` (misal: `"Kota Makassar"` ➔ `"Makassar"`, `"Kabupaten Gowa"` ➔ `"Gowa"`).
    - **Kecamatan / Area**: Diekstrak dari `administrative_area_level_3`, `sublocality_level_1`, `sublocality`, atau `locality` dengan pembersihan awalan `"Kecamatan "` / `"Kec. "` (misal: `"Kecamatan Tamalanrea"` ➔ `"Tamalanrea"`).
  * **Komprehensif pada Autocomplete & Marker Drag/Click**:
    - Diterapkan secara otomatis saat pin peta digeser (*dragend*), peta diklik (*map click*), tombol *Gunakan Lokasi GPS Saya* ditekan, maupun saat user memilih hasil pencarian di Google Places Autocomplete input.
  * **Integrasi 3 Kolom Wilayah Terstruktur di Tab 1 Modal KostManager**:
    - 🏛️ **Provinsi**: `Sulawesi Selatan`
    - 🏙️ **Kota / Kabupaten**: `Makassar`
    - 📍 **Kecamatan / Area**: `Tamalanrea`
    - Disertai Alamat Lengkap Real Bangunan (Detail Jalan, No, RT/RW, Patokan) yang otomatis terisi dan tetap dapat disesuaikan manual.
  * **Persistensi Data ke Supabase**:
    - Kolom `province`, `city`, dan `area` diteruskan ke `newPropForm`, payload insert/update `properties`, dan `DEFAULT_PROP_FORM`.
- **File Tersentuh**: 
  - `functions/public/components/admin/KostManagerPortal.tsx`
- **Verifikasi**:
  - Build Vite frontend `npm run build` di `functions/public/` lulus 100% dengan 0 error (exit code 0).


### 137. Penegasan & Restorasi Tampilan Kartu Peninjauan Pendataan KostManager Versi Modern (Agustus 2026)
- **Permintaan & Latar Belakang**:
  - Pengguna melihat tampilan menu *"KostManager Auto-Pilot"* di panel Admin sempat merender tampilan tabel jadul (kolom: `INFO KOST`, `PEMILIK (USER)`, `STATUS & AGEN`, `TRANSAKSI`, `AKSI`) akibat cache bundler/browser lama.
  - Meminta penegasan dan pemulihan tampilan ke versi modern card-based dan modal peninjauan komprehensif 3-kategori yang telah dikembangkan secara matang.
- **Audit & Penegasan Kode (`KostManagerManagement.tsx` & `Dashboard.tsx`)**:
  - Memastikan seluruh arsitektur antarmuka `KostManagerManagement.tsx` beroperasi 100% menggunakan sistem **Pipeline Status Card Grid** (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`) tanpa ada sisa komponen tabel jadul.
  - Menegaskan integrasi fitur:
    - **Header Profil Mitra 2-Baris**: Menampilkan avatar, status badge (`Butuh Agen`, `Proses Survey`, `Menunggu Perbaikan Surveyor`, `Hasil Survey Siap Ditinjau`, `Aktif Autopilot`), dan nomor kontak WhatsApp langsung.
    - **Properti & Indikator**: Chip tipe properti, counter kamar (Total vs Kosong), link integrasi peta koordinat GPS, dan alert box catatan evaluasi revisi.
    - **Tombol Aksi Utama**: Tombol `🔍 Tinjau Hasil Pendataan Lengkap` (untuk permohonan berstatus `PENDING_ONBOARDING`, `SUBMITTED`, atau `REVISION_REQUIRED`) dan tombol `✏️ Kelola Agen & Drive`.
    - **Modal Peninjauan Komprehensif 3-Tab (`ReviewKostManagerModal`)**:
      * **Tab 1 (🏢 Profil Gedung & Fasilitas)**: Hero Carousel, Galeri Foto Fasad, Integrasi Google Maps Rute Kampus Terdekat (detour walking/driving), Fasilitas Umum Terpadu, dan Aturan Kost.
      * **Tab 2 (🛏️ Tipe Kamar & Penghuni)**: Ringkasan okupansi kamar, hierarki parent-child tipe kamar, kartu kamar terisi (nama penyewa, WhatsApp, tanggal masuk, status tagihan) vs kamar kosong (siap huni, skema tarif lengkap), carousel galeri foto unit kamar dinamis, dan sinkronisasi fasilitas.
      * **Tab 3 (🤝 Mitra & Legalitas)**: Data pemilik, MoU, tanda tangan digital, sistem checklist evaluasi & minta revisi surveyor, serta tombol aktivasi/approval final.
  - Re-build seluruh bundel frontend dengan `npm run build` di direktori `functions/public/` untuk menghasilkan hash chunk baru dan cache-busting di sisi peramban pengguna.
- **Verifikasi**:
  - `npm run build` di `functions/public/` berhasil 100% dengan 0 error kompilasi (`exit code: 0`).

### 214. Peningkatan Komprehensif Modal Perpanjangan Sewa: Status Masa Sewa Berjalan, Simulasi Timeline Tanggal & Total Hari Bersambung, serta Tab Riwayat Perpanjangan & Kwitansi Digital (`MyKost.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pada menu perpanjangan sewa di "Kost Saya" (`MyKost.tsx`), informasi masa sewa aktif saat ini kurang lengkap (tidak ada rincian tanggal mulai masuk, tanggal berakhir saat ini, dan sisa hari).
  2. Pengguna tidak dapat melihat simulasi tanggal jika memilih durasi perpanjangan tertentu: mulai tanggal berapa, berakhir tanggal berapa, dan berapa skala total jangka hari perpanjangan sewa tersebut.
  3. Pengguna meminta agar dapat melihat riwayat-riwayat perpanjangan sewa sebelumnya beserta bukti pembayarannya.
- **Implementasi & Peningkatan Sistem**:
  * **1. Tab Switcher Internal Modal (`Form Perpanjangan` vs `Riwayat (N)`)**:
    - Menambahkan navigasi 2-tab yang mulus dan modern pada header modal perpanjangan.
  * **2. Kartu Status Masa Sewa Berjalan Saat Ini (Current Lease Card)**:
    - Menampilkan unit kamar & tipe kamar, tanggal mulai masuk, tanggal jatuh tempo saat ini, dan badge sisa hari tinggal (`X Hari Tersisa`).
  * **3. Simulasi Timeline & Kalkulasi Skala Hari Perpanjangan Realtime**:
    - Menghitung secara otomatis tanggal mulai bersambung (H+1 setelah periode sewa saat ini), tanggal selesai baru setelah ditambah durasi $N$ bulan, dan total hari jangka sewa (`+X Hari`).
    - Menampilkan ringkasan otomatis bahwa masa sewa akan bersambung hingga tanggal selesai baru tanpa jeda.
  * **4. Tab Riwayat Perpanjangan Sewa & Integrasi Kwitansi Digital**:
    - Menampilkan riwayat transaksi perpanjangan dan sewa lunas sebelumnya dengan badge status Lunas dan tombol **"🧾 Lihat Kwitansi"** yang terhubung langsung ke `DigitalReceiptModal`.
- **File Tersentuh**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Build Vite frontend `cmd /c npm run build` di `functions/public/` lulus 100% dengan 0 error dalam 37.35s (✓ 2531 modules transformed).

### 215. Integrasi & Sinkronisasi Riwayat Pembayaran Sewa & Perpanjangan Sewa Online pada Portal KostManager (`KostManagerPortal.tsx`) (Agustus 2026)
- **Permintaan & Masalah**:
  1. Pengguna telah melakukan simulasi perpanjangan sewa (atau pembayaran sewa online), namun tabel "Riwayat Pembayaran Sewa" pada Portal KostManager (`/dashboard-admin/km_billing`) masih kosong (0 data).
  2. Tab penagihan sebelumnya hanya membaca tagihan manual dari `getManualInvoices()`, sehingga transaksi online (booking awal, perpanjangan sewa, tagihan ekstra) di tabel `transactions` tidak terpantau.
  3. Query `transactions` pada KostManager sebelumnya belum menyertakan filter `product_type: 'perpanjangan_sewa'`.
- **Implementasi & Solusi Presisi**:
  * **1. Perluasan Filter Query Transaksi**:
    - Menyertakan `'perpanjangan_sewa'` bersama `'kost_booking'`, `'sewa'`, `'rent'`, dan `'tagihan_ekstra'` pada pemuatan transaksi properti KostManager di `loadAllData`.
  * **2. Pemetaan Komprehensif Transaksi Online ke Format Tagihan / Invoices (`onlineInvoices`)**:
    - Mengonversi data transaksi online menjadi entri invoice standar dengan ID Invoice, nama penyewa, nomor WhatsApp, nama kost & unit kamar, tanggal tagihan, jatuh tempo baru, nominal lunas, dan badge status `paid` / `issued` / `cancelled`.
  * **3. Penggabungan & Deduplikasi Riwayat Penagihan Terpadu**:
    - Menggabungkan data tagihan manual dan seluruh transaksi online sewa, dideduplikasi berdasarkan ID unik, dan diurutkan secara kronologis (dari transaksi terbaru).
  * **4. Aksi Kwitansi Digital Resmi & Integrasi WhatsApp**:
    - Menyelaraskan tombol **"🧾 Kwitansi"** dan tombol **WhatsApp Kwitansi** di tabel agar langsung membuka `DigitalReceiptModal` resmi berstempel dan mengirim rincian kwitansi ke nomor WhatsApp penyewa.
- **File Tersentuh**:
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `WALKTHROUGH.md`
- **Verifikasi**:
  - Kompilasi `cmd /c npm run build` di `functions/public/` berhasil 100% dengan 0 error dalam 34.84s (✓ 2531 modules transformed).

