# Rencana Implementasi: Modernisasi & Responsivitas Form Pendaftaran KostManager (Standar Industri & Preview Foto Properti)

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  1. **Tampilan Kurang Responsif & Modern**: Modal formulir pendaftaran KostManager terasa kaku pada perangkat mobile. Tombol navigasi/aksi bawah berisiko terpotong pada layar sempit, dan hierarki visual antar elemen input belum memenuhi standar UI/UX industri modern (seperti Airbnb / Traveloka / Mamikos).
  2. **Ketiadaan Preview Foto Properti**: Saat memilih opsi *"Pilih dari Kost Saya"*, sistem saat ini hanya menyediakan `<select>` dropdown teks polos dan peta mentah, tanpa menampilkan thumbnail/foto utama properti, kartu ringkasan visual, maupun badge status properti yang jelas.
  3. **Visual Hierarchy & Multi-Step**: Indikator langkah (Step 1 Data Properti, Step 2 Syarat & Ketentuan) masih berupa teks polos dan belum memiliki *step progress indicator* yang interaktif dan mewah.
- **Tujuan Pengembangan**:
  1. Merombak desain modal pendaftaran KostManager menjadi *responsive dialog / mobile-friendly bottom sheet* yang adaptif, bersih, dan modern.
  2. Mengimplementasikan **Visual Property Selector Card & High-Resolution Preview Banner** lengkap dengan foto properti (diambil dari kolom `image_urls`/`images`), badge jenis kost, jumlah kamar, lokasi, dan status langganan.
  3. Menyediakan navigasi multi-step yang intuitif (*Progress Bar / Step Pills*), form input dengan *icon prefix* & *micro-animations*, serta *order summary card* pada tahap Syarat & Ketentuan (MoU).

---

## 2. Dampak Perubahan
File yang akan disentuh:
- `functions/public/pages/KostManagerLanding.tsx`
  - Memperluas query database Supabase `properties` agar mengambil data gambar (`images`, `image_urls`, `price`, `status`).
  - Menambahkan utilitas resolusi cover image properti yang aman dan anti-broken link.
  - Merombak arsitektur markup modal menjadi modern responsive container (sticky blurred header & footer, smooth scrolling body).
  - Mengganti dropdown teks biasa dengan **Visual Property Selector Cards** (grid/carousel kartu properti dengan foto thumbnail, nama kost, tipe, kota, kamar) dan **Selected Property Preview Banner**.
  - Memperbarui styling seluruh field formulir (input Nama Kost, Jenis Kost, Jumlah Kamar, Kamar Kosong, Link Google Maps, dan Alamat) dengan visual design sistem modern.
  - Mempercantik Step 2 (MoU / Syarat & Ketentuan) dengan *Subscription & Property Summary Card* sebelum checkout pembayaran.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)
1. **Langkah 1: Optimasi Fetching Data Properti Pemilik**:
   - Perbarui query Supabase pada `loadUserKosts` untuk mengambil `id, title, type, room_types, address, city, area, location, is_managed, images, image_urls, price, status`.
   - Implementasikan fungsi helper `getKostPhoto(kost)` untuk mengekstrak foto utama dari berbagai format JSON Supabase.
2. **Langkah 2: Modernisasi Modal Container & Progress Header**:
   - Buat kontainer modal responsif dengan `max-h-[90vh] sm:max-h-[85vh]`, backdrop blur, rounded corners modern, dan sticky header/footer.
   - Tambahkan *Multi-Step Indicator Bar* (Langkah 1: Data Properti, Langkah 2: Syarat & Ketentuan).
3. **Langkah 3: Implementasi Visual Property Selector & Rich Preview**:
   - Buat kartu pilihan kost interaktif dengan foto thumbnail, label status, jenis kost, dan checkmark badge.
   - Buat card preview properti terpilih dengan cover banner besar, ringkasan data, dan peta mini terintegrasi.
4. **Langkah 4: Polishing Input Form & Micro-Interactions**:
   - Tambahkan icon pendukung (`Building`, `Users`, `DoorOpen`, `MapPin`, `Sparkles`) pada setiap field.
   - Optimalkan integrasi geolocation GPS dan pinpoint Google Maps agar rapi dan responsif di mobile.
5. **Langkah 5: Penyempurnaan Step 2 Syarat & Ketentuan (MoU)**:
   - Tampilkan ringkasan pesanan paket langganan dan properti terpilih.
   - Desain ulang kotak Syarat & Ketentuan berformat dokumen profesional dengan checkmark persetujuan interaktif.
6. **Langkah 6: Kompilasi, Verifikasi, dan Git Push**:
   - Jalankan `npm run build` di `functions/public` untuk memastikan 0 error kompilasi.
   - Catat progres ke `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Lakukan commit dan push ke GitHub branch `bukan-productions`.

---

## 4. Rencana Verifikasi
1. **Verifikasi Kompilasi**:
   - Menjalankan `npm run build` di `functions/public` hingga lulus tanpa error TypeScript.
2. **Verifikasi Tampilan Responsif (Mobile & Desktop)**:
   - Memastikan modal terbuka rapi di layar HP (lebar < 640px) dan desktop tanpa ada tombol yang terpotong.
3. **Verifikasi Visual Selector & Preview Foto**:
   - Memastikan saat memilih *"Pilih dari Kost Saya"*, foto kost muncul dengan jelas, thumbnail kartu dapat diklik untuk berganti properti, dan preview banner menampilkan detail kost terpilih secara instan.
4. **Verifikasi Alur Daftar Kost Baru (Manual)**:
   - Memastikan peralihan ke *"Daftar Kost Baru (Manual)"* mengosongkan form dan memungkinkan input manual serta pemilihan peta koordinat tanpa kendala.
5. **Verifikasi Syarat & Ketentuan**:
   - Memastikan validasi form bekerja sebelum lanjut ke Step 2, ringkasan paket muncul, dan checkbox persetujuan mengaktifkan tombol pembayaran.
