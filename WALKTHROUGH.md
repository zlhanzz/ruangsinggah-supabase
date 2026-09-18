# Walkthrough: Sinkronisasi & Pemisahan Tegas Kampus vs Fasilitas Publik Serta Restorasi Foto Fasilitas & Kamar pada KostManager Reaktivasi

Dokumen ini merangkum perbaikan komprehensif pada pengelompokan **Kampus Terdekat** dan **Fasilitas Publik** di detail listing (`KostDetail.tsx`), serta penyelarasan pemulihan foto survei fasilitas bersama dan kamar saat reaktivasi KostManager di Dashboard Agen (`AgentDashboard.tsx`).

---

## 1. Ringkasan Perubahan & Hasil Perbaikan

| Area / Halaman | Kondisi Sebelumnya | Kondisi Setelah Perbaikan |
| :--- | :--- | :--- |
| **Kampus Terdekat (`KostDetail.tsx`)** | Mencampuradukkan seluruh 12 landmark (termasuk mall, RS, SPBU, tempat ibadah, minimarket, laundry) ke dalam seksi kampus. | Tepat hanya menampilkan **3 Perguruan Tinggi Murni**: *Universitas Islam Makassar (UIM)*, *Universitas Hasanuddin (UNHAS)*, dan *Politeknik Negeri Ujung Pandang (PNUP)*. |
| **Fasilitas Publik Sekitar (`KostDetail.tsx`)** | Menampilkan fasilitas perabotan gedung kost sendiri (*"Parkir Motor"*, *"Kompor"*, *"Wastafel Cuci Piring"*) dengan jarak dummy `-` dan durasi palsu. | Tepat hanya menampilkan **9 Landmark Publik Eksternal**: *Makassar Town Square (MToS)*, *RSUP Dr. Wahidin Sudirohusodo*, *Kawasan Industri Makassar (KIMA Daya)*, *Terminal Regional Daya*, *Indomaret Bung*, *sity laundry express*, *SPBU Pertamina*, *Masjid Al-Furqan*, *Gereja Katolik Maria Ratu Rosario* lengkap dengan durasi rute nyata dan tombol navigasi in-app peta. |
| **Fasilitas Bersama Gedung Kost** | Fasilitas internal kost campur aduk ke landmark luar lingkungan. | Fasilitas internal terwadahi secara terstruktur pada seksi **Fasilitas Umum & Gedung Kost** (*Dapur Bersama*, *Area Parkir*, *WiFi*, *CCTV 24 Jam*, dll.). |
| **Database Supabase (`properties`)** | Kolom `campuses` berisi 12 landmark campur aduk; kolom `public_facilities` berisi string perabot internal. | Kolom `campuses` bersih berisi 3 kampus; kolom `public_facilities` berisi 9 landmark publik luar dengan koordinat GPS dan estimasi durasi Google API. |
| **Step 1 Dashboard Agen (`AgentDashboard.tsx`)** | Slot foto fasilitas bersama (misal: *Parkir Motor*, *Dapur Bersama*) tidak mencocokkan foto survei yang berlabel sinonim (*Area Parkir*, *Fasilitas Bersama*). | Dilengkapi fungsi cerdas `isCategoryMatching` sehingga foto survei otomatis terpetakan ke slot kategori yang tepat tanpa hilang. |
| **Restorasi 10 Kamar KostManager** | Kamar yang belum terisi foto di draf survei bisa kehilangan foto arsipnya. | Sistem memulihkan foto dari arsip tipe kamar sejenis dan menyusun `categorized_photos` untuk seluruh kamar secara utuh. |

---

## 2. File yang Dimodifikasi

1. **[`functions/public/pages/KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)**:
   - Memfilter kandidat landmark dengan memisahkan tegas `isCampus` (hanya institusi pendidikan tinggi) dan `isPublicFacility` (landmark lingkungan luar kost).
   - Memfilter dan memblokir fasilitas perabot internal kost agar tidak pernah muncul di bawah seksi peta/landmark luar.
2. **[`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)**:
   - Menambahkan helper `isCategoryMatching` pada pratinjau kategori foto area umum di Step 1.
   - Memperbaiki sinkronisasi `draftRoomTypes` dan `loadedKmImageUrls` agar foto arsip KostManager terpulihkan lengkap untuk semua kamar dan fasilitas publik.
3. **Database Supabase (`properties`)**:
   - Baris properti Kost Apalah Daya (`bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`) diperbarui secara presisi dengan 3 kampus murni dan 9 fasilitas publik eksternal.

---

## 3. Hasil Pengujian & Verifikasi Build

1. **Uji Kompilasi Front-End**:
   - Menjalankan `npm.cmd run build` di direktori `functions/public`:
     ```
     vite v6.4.1 building for production...
     transforming...
     ✓ 2512 modules transformed.
     rendering chunks...
     computing gzip size...
     ✓ built in 58.99s
     ```
   - **Hasil**: 100% Lulus (0 compile error).
2. **Uji Database Query**:
   - Kueri Supabase REST API mengonfirmasi:
     - `campuses`: 3 lokasi kampus murni.
     - `public_facilities`: 9 lokasi landmark publik eksternal dengan koordinat GPS dan durasi perjalanan.

---

## 4. Panduan Verifikasi Pengguna (UI Testing Guide)

1. **Buka Halaman Detail Kost Apalah Daya**:
   - Akses `/kost/bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f` di browser.
2. **Scroll ke Seksi "Lokasi & Lingkungan"**:
   - Perhatikan bagian **Kampus Terdekat**:
     - Memuat tepat 3 lokasi: *Universitas Islam Makassar (UIM)*, *Universitas Hasanuddin (UNHAS)*, dan *Politeknik Negeri Ujung Pandang (PNUP)*.
   - Perhatikan bagian **Fasilitas Publik**:
     - Memuat tepat 9 lokasi: *Makassar Town Square (MToS)*, *RSUP Dr. Wahidin*, *KIMA*, *Terminal Regional Daya*, *Indomaret*, *Laundry*, *SPBU*, *Masjid*, *Gereja*.
     - Tiap item memiliki jarak riil, estimasi durasi jalan kaki / motor / mobil, serta tombol interaktif **Rute** yang menampilkan garis rute langsung pada peta di atasnya.
   - Pastikan **tidak ada lagi fasilitas kost** (*Parkir Motor*, *Kompor*, *Wastafel Cuci Piring*) yang muncul di bawah seksi landmark publik ini.
3. **Buka Seksi "Fasilitas Umum" di Atasnya**:
   - Periksa bagian *Area Parkir* dan *Dapur Bersama*:
     - Seluruh perlengkapan kost (*Parkir Motor*, *Kompor*, *Wastafel Cuci Piring*) tersaji rapi sebagai kelengkapan fasilitas kost.
