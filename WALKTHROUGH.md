# Walkthrough: Modernisasi & Responsivitas Form Pendaftaran KostManager (Standar Industri & Preview Foto Properti)

## Ringkasan Perubahan
Pembaruan komprehensif pada antarmuka formulir pendaftaran KostManager (`functions/public/pages/KostManagerLanding.tsx`) untuk menciptakan pengalaman onboarding calon mitra yang modern, elegan, berstandar industri, dan 100% responsif pada perangkat mobile maupun desktop.

---

## Daftar Perubahan Spesifik

### 1. Visual Property Selector & Showcase Preview Properti Eksisting
- **Penarikan Data Lengkap**: Memperluas query database Supabase `properties` untuk mengambil kolom foto (`images`, `image_urls`, `image_url`) dan detail tambahan (`price`, `status`).
- **Fungsi Pembantu Resolusi Foto**: Menambahkan `getKostCoverImage` untuk mengekstrak URL foto utama secara handal dengan fallback placeholder yang elegan.
- **Selectable Property Cards**: Mengganti `<select>` dropdown teks polos dengan kartu pemilih kost visual interaktif yang menampilkan:
  - Foto thumbnail properti.
  - Judul kost, badge tipe (*Putra / Putri / Campur*), badge lokasi (*Kota/Area*).
  - Jumlah kamar dan badge status KostManager.
  - Checkmark indicator aktif dan styling *active ring* oranye.
- **Selected Property Showcase Banner**: Menampilkan preview banner beresolusi tinggi ketika properti dipilih, lengkap dengan badge sinkronisasi otomatis dan mini-map lokasi interaktif.

### 2. Arsitektur Modal Responsif & Progress Bar Multi-Step
- **Adaptive Modal Shell**: Menggunakan layout `max-h-[92vh] sm:max-h-[88vh]` dengan rounded corners modern, shadow halus, dan backdrop blur.
- **Sticky Header & Footer**: Memastikan judul, step indicator, dan tombol navigasi (*Batal*, *Lanjut: Syarat & Ketentuan*, *Setuju & Lanjut Pembayaran*) selalu terlihat dan tidak pernah terpotong pada layar smartphone sempit.
- **Multi-Step Indicator Bar**: Menampilkan pill progress visual antara Langkah 1 (*Data Properti*) dan Langkah 2 (*Syarat & Ketentuan / Pembayaran*).

### 3. Segmented Control & Polishing Form Input
- **Segmented Radio Cards**: Pilihan metode (*Pilih dari Kost Saya* vs *Daftar Kost Baru*) dengan ikon `<Building2 />` dan `<PlusCircle />` serta indikator active pulse.
- **Modern Input Fields**: Input Nama Kost, Jenis Kost, Jumlah Kamar, Kamar Kosong, Link Google Maps, dan Alamat didesain dengan visual border focus ring yang bersih dan ikon pendukung.
- **GPS & Google Maps Integration**: Tombol deteksi lokasi GPS dan pinpoint Google Maps Location Picker yang responsif dan rapi.

### 4. Step 2 (Syarat & Ketentuan / MoU) Berstandar Industri
- **Order & Property Summary Card**: Ringkasan properti kost yang dipilih, durasi paket langganan, dan nominal biaya langganan yang transparan sebelum checkout.
- **Structured Terms Box**: Menata klausul Syarat & Ketentuan ke dalam 4 poin terstruktur dengan icon badge.
- **Interactive Consent Card**: Checkbox persetujuan interaktif dengan highlight border aktif saat dicentang.

---

## Hasil Pengujian & Kompilasi
- **Uji Kompilasi Vite**: `cmd /c npm run build` di `functions/public`
  ```
  vite v6.4.1 building for production...
  transforming...
  ✓ 2511 modules transformed.
  ✓ built in 41.80s
  ```
  **Hasil**: 0 Error, 100% Lulus.

---

## Panduan Pengujian User
1. Buka halaman **KostManager** (atau klik tombol **"Langganan KostManager Sekarang"**).
2. Perhatikan modal pendaftaran yang kini tampil elegan dengan Multi-Step Indicator.
3. Pada opsi *"Pilih dari Kost Saya"*, perhatikan kartu-kartu properti kost Anda yang kini menampilkan **foto thumbnail**, tipe kost, dan kota.
4. Klik salah satu kartu properti dan perhatikan **Showcase Preview Properti Terpilih** dengan cover foto besar dan data tersinkronisasi otomatis.
5. Tekan tombol **"Lanjut: Syarat & Ketentuan"** untuk melihat ringkasan pesanan dan persetujuan MoU yang elegan sebelum melanjutkan ke pembayaran.
