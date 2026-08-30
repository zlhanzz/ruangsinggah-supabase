# Rencana Implementasi: Transformasi Halaman Kemitraan Mitra Pemasaran ke Sistem Self-Listing Mandiri & Pembaruan Konten Landing Page (`Owner.tsx`)

Dokumen ini merancang evaluasi dan perombakan komprehensif pada halaman **Kemitraan Kost / Mitra Pemasaran** ([`Owner.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Owner.tsx)), mengubah alur yang sebelumnya berbasis pengisian formulir manual menjadi **alur Self-Listing mandiri (Buat Akun Role Mitra -> Akses Dashboard Mitra -> Upload Properti Sendiri)** serta menyelaraskan seluruh konten *copywriting* dan *value proposition* dengan ekosistem RuangSinggah versi terbaru.

---

## 1. Analisis Masalah & Kebutuhan

### Masukan Pengguna:
> *"kita perlu melakukan evaluasi terkait mitra pemasaran, yang dimana sekarang sistemnya seharusnya bukan lagi formulir, karena sistem kita sudah memiliki self listing sehingga cukup buat akun dengan role mitra, kemudian upload sendiri. dan tentunya beberapa isi konten landing page nya sekarang sudah perlu disesuaikan dengan cara kerja ruang singgah versi sekarang"*

### Identifikasi Permasalahan:
1. **Alur Lama Berbasis Formulir Manual (Outdated)**:
   - Pada halaman kemitraan `/owner`, saat pemilik memilih "Mitra Pemasaran", sistem menampilkan tombol *"Ajukan Proposal Sekarang"* dan membuka modal formulir manual (`mitra_requests`).
   - Alur ini sudah tidak relevan karena RuangSinggah saat ini telah memiliki fitur **Self-Listing terintegrasi penuh** di mana pemilik kost dapat mendaftar dengan role `mitra` / `owner` dan langsung mengunggah properti/kamar secara mandiri lewat **Dashboard Mitra** (`/dashboard-owner`).
2. **Konten Copywriting & Cara Kerja Landing Page Belum Sinkron**:
   - Teks pada landing page lama masih mengindikasikan proses konvensional (verifikasi manual tunggu dihubungi), belum menonjolkan keunggulan sistem baru seperti:
     - **Self-Listing Cepat (< 5 Menit)**: Input tipe kamar, fasilitas, dan harga fleksibel.
     - **Upload Foto Modern WebP**: Foto berkualitas tinggi dengan kompresi otomatis super cepat.
     - **Manajemen Ketersediaan Kamar Real-time**: Kontrol kamar kosong/terisi langsung dari HP/laptop.
     - **Manajemen Booking & Transaksi Terpadu**: Notifikasi instan saat ada calon penghuni yang booking.
3. **Pilihan Kemitraan**:
   - Pilihan kemitraan tetap terstruktur rapi membedakan:
     - **Mitra Pemasaran (Self-Listing)**: 100% Gratis, pasang iklan & kelola listing sendiri di Dashboard Mitra.
     - **Kost Manager (Autopilot Management)**: Layanan manajemen penuh/operasional terpadu (mengarahkan ke info & landing Kost Manager).

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Rencana Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/Owner.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Owner.tsx) | Merombak total landing page Mitra Pemasaran: menghapus modal formulir manual, memperbarui copywriting 3 langkah mudah self-listing, menonjolkan fitur Dashboard Mitra, serta menghubungkan seluruh tombol CTA langsung ke pendaftaran/Dashboard Mitra sesuai status login. |
| 2 | [`functions/public/App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx) | Meneruskan state `user` ke komponen `<Owner user={user} />` agar halaman dapat mendeteksi apakah pemilik sudah login atau belum. |
| 3 | [`functions/public/pages/Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx) | Menambahkan penanganan URL query params `?role=owner&mode=register` agar jika diarahkan dari landing page, tab pendaftaran pemilik kost otomatis terpilih. |
| 4 | `functions/PROGRESS.md` | Pencatatan riwayat pekerjaan (Anti-Amnesia). |
| 5 | `WALKTHROUGH.md` | Dokumentasi panduan pengujian dan detail perubahan. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

### Langkah 1: Penyesuaian Penanganan Role & Redirect di `Login.tsx` & `App.tsx`
- Di [`Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx), tangkap query param `role=owner` / `role=mitra` dan `mode=register` / `mode=signup` agar langsung mengaktifkan tab form register role Pemilik Kost.
- Di [`App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx), berikan prop `user={user}` ke rute `<Owner user={user} />`.

### Langkah 2: Perombakan Konten & Alur Kerja di `Owner.tsx`

1. **Layar Awal (Pilihan Solusi Kemitraan)**:
   - **Kartu 1: Mitra Pemasaran (Self-Listing Mandiri)**:
     - Badge: `100% Gratis & Mandiri`
     - Deskripsi: *"Daftar akun mitra, upload foto & detail kamar langsung lewat Dashboard Mitra, dan terima calon penyewa tanpa ribet."*
     - Poin keunggulan: Self-Listing cepat, kelola ketersediaan kamar real-time, kompresi foto WebP, dan jangkauan ribuan mahasiswa.
     - Tombol CTA: *"Pilih Mitra Pemasaran"*.
   - **Kartu 2: Kost Manager (Autopilot Management)**:
     - Tetap menyajikan solusi pengelolaan operasional penuh bagi pemilik kost yang ingin terima beres.

2. **Landing Page Mitra Pemasaran (Modern Copywriting & Self-Listing)**:
   - **Hero Section**:
     - Headline: *"Pasang Iklan Kost Mandiri, Cepat & 100% Bebas Biaya"*
     - Sub-headline: *"Jangkau ribuan mahasiswa dan pencari hunian potensial. Daftarkan properti Anda dalam hitungan menit, kelola ketersediaan kamar secara mandiri di Dashboard Mitra, dan pantau booking secara real-time."*
     - CTA Dinamis:
       - Jika belum login: *"Daftar Akun Mitra & Mulai Listing (Gratis)"* -> `navigate('/login?role=owner&mode=register')`
       - Jika sudah login sebagai Mitra: *"Buka Dashboard Mitra & Tambah Listing"* -> `navigate('/dashboard-owner')`
       - Jika sudah login sebagai User: *"Buka Dashboard Mitra & Mulai Listing"* -> `navigate('/dashboard-owner')`
   - **3 Langkah Mudah Self-Listing (How It Works Baru)**:
     - **Langkah 1: 👤 Buat Akun Mitra (1 Menit)**: Daftar gratis menggunakan nomor WhatsApp & email aktif Anda.
     - **Langkah 2: 📸 Upload & Lengkapi Detail Kamar (Self-Listing)**: Masukkan fasilitas kamar & umum, tentukan tarif sewa fleksibel, dan upload foto kamar berformat WebP berkualitas tinggi.
     - **Langkah 3: 🚀 Properti Langsung Tayang & Terima Booking**: Listing Anda langsung aktif di katalog pencarian RuangSinggah.id dan siap menerima booking dari ribuan pencari kost.
   - **Fitur Unggulan Dashboard Mitra (Value Propositions)**:
     - ⚡ **Self-Listing Super Cepat**: Tambah dan perbarui informasi kamar kapan saja dari smartphone atau laptop Anda.
     - 📊 **Kontrol Ketersediaan Kamar Real-Time**: Update status kamar kosong atau terisi dalam 1-klik agar pencari kost selalu mendapat info akurat.
     - 💬 **Notifikasi Booking & Chat Calon Penghuni**: Terhubung langsung dengan calon penyewa terverifikasi.
     - 🎯 **Jangkauan Mahasiswa Berdasarkan Radius Kampus**: Listing otomatis diprioritaskan untuk pencari kost di sekitar area properti.
     - 🛡️ **Verifikasi Properti & Kepercayaan Tinggi**: Tampilan badge verifikasi meningkatkan minat penyewa hingga 2x lipat.
   - **Section FAQ / Pertanyaan Umum Seputar Self-Listing**:
     - Menjawab pertanyaan penting seputar biaya, kemudahan edit data, dan penarikan hasil sewa.
   - **Bottom CTA Section**:
     - Banner ajakan bergabung dengan tombol aksi langsung ke Dashboard Mitra / Pendaftaran Akun.

3. **Penghapusan Seluruh Kode Modal Formulir Manual Lama**:
   - Menghapus modal `isModalOpen`, `formData`, `hasAgreedMoU`, dan pemanggilan `supabase.from('mitra_requests').insert(...)` yang sudah usang.

### Langkah 3: Uji Kompilasi & Build
- Jalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 100% bebas error kompilasi TypeScript dan broken route.

### Langkah 4: Pencatatan Riwayat & Git Push
- Catat riwayat di `functions/PROGRESS.md` (Fitur #221).
- Terbitkan dokumen `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Navigasi Menu "Mitra Kost"**:
   - Akses `/owner` dari navbar, verifikasi tampilan pilihan kemitraan yang modern dan informatif.
2. **Uji Landing Page Mitra Pemasaran**:
   - Klik kartu "Mitra Pemasaran" dan periksa seluruh section Hero, 3 Langkah Self-Listing, Fitur Dashboard Mitra, dan FAQ.
3. **Uji CTA Button**:
   - **Kondisi Belum Login**: Klik tombol CTA -> Verifikasi diarahkan ke `/login?role=owner&mode=register` dengan tab Pemilik Kost dan form pendaftaran langsung terbuka.
   - **Kondisi Sudah Login**: Klik tombol CTA -> Verifikasi diarahkan langsung ke `/dashboard-owner` (Dashboard Mitra).
4. **Uji Build**:
   - Jalankan `npm run build` dan pastikan hasil `0 error`.
