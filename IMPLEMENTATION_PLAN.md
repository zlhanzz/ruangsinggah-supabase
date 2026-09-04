# IMPLEMENTATION PLAN: Implementasi Master Data Landmark GPS & Micro Scan Fasilitas Harian pada Pendataan KostManager di Dashboard Agen

## 1. Analisis Masalah & Kebutuhan (Problem & Requirements Analysis)

### A. Latar Belakang & Masalah Saat Ini
1. **Standar Komprehensif di Dashboard Mitra (`KostFormMitra.tsx`)**:
   - Memadukan 2 lapisan deteksi lokasi cerdas:
     - **Lapisan 1 (Master Data Terkurasi Nasional - 0ms & Bebas Kuota)**: Mengambil data titik anchor utama (350+ kampus resmi, rumah sakit rujukan, mall besar, kawasan industri, dan pusat bisnis CBD) via `findNearbyCuratedLandmarks(centerLat, centerLng, 7.0)`.
     - **Lapisan 2 (Micro Scanning Google Places API)**: Memindai fasilitas harian terdekat yang sangat dibutuhkan anak kost:
       - 🛒 **Minimarket** (Indomaret, Alfamart, Alfamidi, Circle K, dll. - rankBy distance, radius $\le 2.5\text{ KM}$, tepat 1 terdekat).
       - 🧺 **Laundry Kiloan** (Laundry, cuci setrika - radius $\le 2.5\text{ KM}$, tepat 1 terdekat).
       - 🕌 **Tempat Ibadah** (Masjid / Musholla & Gereja terdekat - radius $\le 2.5 - 3.5\text{ KM}$, tepat 1 terdekat).
       - ⛽ **SPBU / Pom Bensin** (Pertamina, Shell, SPBU - radius $\le 4.0\text{ KM}$).
     - **Multi-layer Sanitization**: Filter ketat (`isGarbageFacility`, `isInvalidCampus`, `isValidMicroFacility`) guna menolak entitas non-fasilitas publik (seperti jasa servis printer, fotocopy, bengkel, konter pulsa, salon, dll.).
     - **Badge Estimasi Rute Realistis**: Waktu tempuh 🚶 Jalan Kaki, 🏍️ Sepeda Motor, dan 🚗 Mobil.
2. **Kondisi Dashboard Agen (`AgentDashboard.tsx`)**:
   - Pada modal pendataan KostManager (`isEditingKostManager` Step 1), agen sebelumnya masih mengandalkan pengetikan manual atau geocoder pencarian satu per satu, tanpa auto-sync master data dan tanpa pemindaian mikro otomatis.
3. **Tujuan Pengembangan**:
   - Menerapkan **arsitektur dan prinsip yang sama persis** ke dalam `AgentDashboard.tsx` agar proses survei dan pendataan KostManager oleh Agen berjalan super cepat, otomatis, akurat, dan lengkap dengan fasilitas mikro harian.

---

## 2. Dampak Perubahan (Impact Analysis)

### File yang Disentuh:
1. **`functions/public/pages/AgentDashboard.tsx`**:
   - Impor helper & dataset dari `../constants/curatedLandmarks` (`findNearbyCuratedLandmarks`, `calculateHaversineDistance`).
   - Impor ikon murni dari `lucide-react` (`Sparkles`, `GraduationCap`, `Building2`, `Trash2`, `Plus`, `Loader2`, `Search`, `LinkIcon`, `ExternalLink`, dll.).
   - Tambahkan fungsi sanitasi:
     - `isInvalidCampus(name)`
     - `isGarbageFacility(name)`
     - `isValidMicroFacility(category, place)`
   - Tambahkan state `isScanningLandmarks` dan abort controller ref `landmarkScanAbortRef`.
   - Implementasikan fungsi `detectNearbyLandmarks(centerLat, centerLng)` yang menggabungkan Master Data Terkurasi (0ms) + Micro Scan (Minimarket, Laundry, Masjid/Musholla, Gereja, SPBU).
   - Pasang pemicu auto-scan saat:
     - Form dibuka pertama kali (`openKostManagerListing`).
     - Agen menekan tombol *"Gunakan Lokasi Saya Saat Ini"*.
     - Koordinat dikunci dari pop-up peta fullscreen (*"Kunci & Gunakan Lokasi Ini"*).
     - Link / koordinat Google Maps dikonversi.
     - Koordinat GPS diubah melalui reverse geocoding.
   - Perbarui tampilan JSX bagian **"Fasilitas & Landmark Terdekat"** pada Step 1 form KostManager dengan kartu berdesain modern, badge rute waktu tempuh, tombol hapus/edit, tombol *"✨ Pindai Ulang Landmark (Master Data & Mikro)"*, serta form tambah manual.
2. **`functions/PROGRESS.md`**:
   - Pencatatan riwayat progres 329 setelah selesai.
3. **`WALKTHROUGH.md`**:
   - Panduan pengujian fitur bagi pengguna.

---

## 3. Langkah-Langkah Eksekusi (Execution Steps)

### Langkah 1: Impor Master Data & Fungsi Sanitasi
- Mengimpor `findNearbyCuratedLandmarks` dan `calculateHaversineDistance` di `AgentDashboard.tsx`.
- Menerapkan fungsi helper sanitasi `isInvalidCampus`, `isGarbageFacility`, dan `isValidMicroFacility`.

### Langkah 2: Pembuatan Fungsi Deteksi Terpadu (`detectNearbyLandmarks`)
- **Tahap 1 (0ms Instan)**: Jalankan `findNearbyCuratedLandmarks(centerLat, centerLng, 7.0)` untuk kampus, mall, RS, dan kawasan bisnis. Langsung perbarui `kmListingForm.campuses` seketika.
- **Tahap 2 (Google Places Micro Scan)**:
  - Memindai Minimarket terdekat (Indomaret/Alfamart) dalam radius 2.5 KM.
  - Memindai Laundry kiloan terdekat dalam radius 2.5 KM.
  - Memindai Masjid / Musholla & Gereja terdekat dalam radius 2.5 - 3.5 KM.
  - Memindai SPBU terdekat dalam radius 4.0 KM.
  - Memindai Kampus Fallback (hanya jika master data kampus kosong).
- **Tahap 3 (Penggabungan & Sanitasi)**:
  - Bersihkan seluruh hasil dengan filter `isGarbageFacility`.
  - Hitung durasi waktu tempuh realistis (🚶 Jalan Kaki, 🏍️ Motor, 🚗 Mobil).
  - Simpan daftar gabungan ke `kmListingForm.campuses`.

### Langkah 3: Integrasi Event Pemicu GPS
- Pasang `detectNearbyLandmarks` pada:
  - `openKostManagerListing` (saat membuka form pendataan).
  - `reverseGeocodeAndApply` (saat klik "Gunakan Lokasi Saya Saat Ini").
  - `handleConfirmModalLocation` (saat simpan dari pop-up peta).
  - Konversi link / koordinat Maps.

### Langkah 4: Redesain Antarmuka Section Landmark di Step 1 Modal KostManager
- Ganti daftar teks sederhana dengan kartu interaktif:
  - Header dengan icon kategori (🎓 Kampus, 🏥 RS, 🛍️ Mall, 🏢 Bisnis, 🛒 Minimarket, 🧺 Laundry, 🕌/⛪ Ibadah, ⛽ SPBU).
  - Input nama yang dapat disesuaikan.
  - Baris rute waktu tempuh: `🚶 X Mnt` • `🏍️ Y Mnt` • `🚗 Z Mnt` serta jarak `± N KM`.
  - Tombol hapus individual.
  - Tombol *"✨ Pindai Ulang Landmark (Master Data & Mikro)"* dengan indikator progress scanning.
  - Form penambahan manual via pencarian autocomplete Google Places & konversi tautan GMaps.

### Langkah 5: Kompilasi, Verifikasi Build, & Dokumentasi
- Jalankan kompilasi frontend Vite `cmd /c npm run build` di `functions/public`.
- Jalankan kompilasi TypeScript `cmd /c npm run build` di `functions`.
- Catat entri riwayat pada `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
- Lakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi (Verification Plan)

### A. Uji Kompilasi
- Memastikan `npm run build` berhasil 100% (0 error).
- Memastikan 0 font ligature Google CDN (100% pure bundled SVG `lucide-react`).

### B. Uji Fungsionalitas di Dashboard Agen
1. Buka **Dashboard Agen** (`/dashboard-agen`).
2. Masuk ke salah satu tugas KostManager (klik *"📷 Mulai Pendataan"* / *"⚡ Isi Listing & Kamar"*).
3. Pada **Step 1 (Informasi Properti)**:
   - Amati koordinat GPS: Master data kampus/anchor utama terdeteksi seketika (0ms), diikuti pemindaian mikro (Minimarket, Laundry, Tempat Ibadah, SPBU).
   - Periksa kartu landmark: Menampilkan nama, kategori, jarak KM, dan rincian waktu tempuh rute (🚶 Jalan Kaki, 🏍️ Motor, 🚗 Mobil).
   - Klik tombol **"✨ Pindai Ulang Landmark"**: Memastikan proses scan mikro dan master data terpanggil ulang dengan mulus.
   - Coba tombol **"+ Tambah Landmark Baru"**: Tambah landmark manual via pencarian atau link Google Maps.
   - Coba tombol **"Hapus"** pada salah satu fasilitas.
4. Lanjutkan pengisian hingga Step 2 & 3 lalu klik Simpan: Memastikan data landmark (`campuses`) tersimpan dengan presisi ke Supabase database.
