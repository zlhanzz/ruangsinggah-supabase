# Walkthrough: Pemisahan Tegas & Normalisasi Kampus Terdekat vs Fasilitas Publik Sekitar Kost pada Detail Listing (`KostDetail.tsx`)

Dokumen ini merangkum perbaikan komprehensif atas permasalahan pengelompokan landmark pada halaman detail properti kost pengguna (`KostDetail.tsx`), sanitasi data properti pada Supabase Database, serta harmonisasi penyimpanan data survei/KostManager.

---

## 1. Analisis Masalah & Hasil Perbaikan

| Seksi UI pada `KostDetail.tsx` | Kondisi Sebelum Perbaikan | Kondisi Setelah Perbaikan |
| :--- | :--- | :--- |
| **KAMPUS TERDEKAT** | **12 Lokasi Tercampur Aduk**: Menampilkan seluruh 12 landmark sekitar termasuk Mall (MToS), RSUP Dr. Wahidin, KIMA Daya, Terminal Regional Daya, Indomaret, Laundry, SPBU Pertamina, Masjid, dan Gereja. | **Tepat 3 Kampus Terdekat**: Hanya menampilkan perguruan tinggi murni (*Universitas Islam Makassar* 1.9 km, *Universitas Hasanuddin* 2.0 km, *Politeknik Negeri Ujung Pandang* 2.9 km). |
| **FASILITAS PUBLIK (Landmark Sekitar)** | **Keliru Menampilkan Perabot Internal Kost**: Menampilkan *"Parkir Motor"*, *"Kompor"*, *"Wastafel Cuci Piring"* dengan jarak dummy `'-'` dan durasi janggal `15m • 4m • 6m`. | **Tepat 9 Fasilitas Publik Eksternal**: Menampilkan landmark lingkungan sekitar dengan jarak riil, estimasi durasi berkendara/berjalan kaki yang akurat, serta tombol rute navigasi Google Maps. |
| **FASILITAS KOST (Internal Gedung)** | Fasilitas bersama gedung kost berpotensi hilang atau tidak konsisten jika hanya tersimpan di `public_facilities`. | **Terintegrasi Penuh & Lengkap**: Fasilitas bersama gedung kost (*Area Parkir*, *Dapur Bersama*, *WiFi*, *CCTV 24 Jam*, *Akses 24 Jam*, *Ruang Jemur*, *Kompor*, *Wastafel Cuci Piring*) tersaji secara elegan di grup Fasilitas Kost. |

---

## 2. File & Modifikasi yang Dilakukan

1. **[`functions/public/pages/KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)**:
   - **Penerapan Universal Smart Segregator**:
     - Mengumpulkan seluruh kandidat dari `kost.campuses` dan `kost.publicFacilities`.
     - **Blacklist Fasilitas Internal Kost**: Memblokir fasilitas gedung kost (`parkir motor`, `kompor`, `wastafel`, `dapur`, `wifi`, `cctv`, `kloset`, `kasur`, dll.) agar tidak pernah muncul di seksi landmark luar.
     - **Filter Kampus Murni (`isCampus`)**: Hanya meloloskan entitas berkategori `'campus'` atau nama perguruan tinggi (Universitas, Institut, Politeknik, Akademi, STIE, STIKES, UNHAS, UIM, PNUP, dll.) dan mengecualikan non-kampus (mall, RS, SPBU, tempat ibadah, laundry, terminal, industri).
     - **Filter Fasilitas Publik Murni**: Meloloskan landmark publik eksternal yang memiliki koordinat GPS dan jarak riil.
     - **Integrasi Fasilitas Kost**: Memastikan fasilitas bersama gedung kost (`Parkir Motor`, `Kompor`, `Wastafel Cuci Piring`) otomatis terintegrasi ke dalam seksi **"Fasilitas Kost"** (`structuredPublicFacilities` pada grup *Area Parkir* dan *Dapur Bersama*).
     - **Optimasi Meta Tag SEO**: Memperbarui `campusNearby` agar selalu memilih nama perguruan tinggi asli (bukan mall atau minimarket).
2. **Database Supabase (`properties` Kost Apalah Daya `bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`)**:
   - `campuses`: Tepat 3 kampus (*Universitas Islam Makassar (UIM)*, *Universitas Hasanuddin (UNHAS)*, *Politeknik Negeri Ujung Pandang (PNUP)*).
   - `public_facilities`: Tepat 9 fasilitas publik eksternal (*Makassar Town Square*, *RSUP Dr. Wahidin Sudirohusodo*, *KIMA Daya*, *Terminal Regional Daya*, *Indomaret Bung*, *sity laundry express*, *SPBU Pertamina*, *Masjid Al-Furqan*, *Gereja Katolik Maria Ratu Rosario*).
   - `facilities`: Mengamankan seluruh fasilitas kost (*WiFi*, *Area Parkir*, *Dapur Bersama*, *CCTV 24 Jam*, *Akses 24 Jam*, *Ruang Jemur*, *Parkir Motor*, *Kompor*, *Wastafel Cuci Piring*).
3. **[`functions/public/adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)** & **[`functions/public/components/admin/KostManagerPropertyFormModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPropertyFormModal.tsx)**:
   - Memastikan proses penyimpanan properti (saat disurvei, diedit oleh admin, atau dideaktivasi kembali ke mitra biasa) memisahkan landmark eksternal ke `campuses` (kampus) dan `public_facilities` (fasilitas publik luar), serta menyimpan fasilitas bersama gedung ke `facilities`.
4. **[`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)**:
   - Menyelaraskan kartu kontainer formulir evaluasi KostManager agar rapi, berbingkai bersih (`bg-white rounded-2xl p-5 border border-[#e0c0af] shadow-xs space-y-4`), dan responsif.

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
     ✓ built in 1m 55s
     ```
   - **Hasil**: 100% Lulus (0 error, 0 warning).
2. **Uji Sanitasi Database**:
   - Menjalankan kueri verifikasi ke Supabase:
     - `Kost Apalah Daya` -> `campuses`: 3 (UIM, UNHAS, PNUP).
     - `Kost Apalah Daya` -> `public_facilities`: 9 (MToS, RS Wahidin, KIMA Daya, Terminal Daya, Indomaret, Laundry, SPBU, Masjid, Gereja).
     - `Kost Apalah Daya` -> `facilities`: 9 item internal properti.

---

## 4. Panduan Verifikasi Pengguna (UI Testing Guide)

1. **Buka Halaman Detail Kost Apalah Daya**:
   - Akses URL: `/kost/bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f` (atau klik kartu Kost Apalah Daya dari katalog).
2. **Periksa Seksi "Kampus Terdekat"**:
   - Pastikan tertera header **"Kampus Terdekat (3 Lokasi)"** (bukan lagi 12 lokasi).
   - Pastikan hanya menampilkan:
     - *Universitas Islam Makassar (UIM)*
     - *Universitas Hasanuddin (UNHAS)*
     - *Politeknik Negeri Ujung Pandang (PNUP)*
   - Pastikan Mall, Rumah Sakit, SPBU, dan Minimarket tidak lagi bercokol di seksi ini.
3. **Periksa Seksi "Fasilitas Publik"**:
   - Pastikan tertera header **"Fasilitas Publik (9 Lokasi)"** (bukan lagi 3 perabot).
   - Pastikan menampilkan:
     - *Indomaret Bung No. 13* (Minimarket • 0.1 km)
     - *sity laundry express* (Laundry • 0.2 km)
     - *Masjid Al-Furqan Bung* (Tempat Ibadah • 0.3 km)
     - *SPBU Pertamina 74.902.22* (SPBU • 1.3 km)
     - *Gereja Katolik Maria Ratu Rosario* (Tempat Ibadah • 1.3 km)
     - *Makassar Town Square (MToS)* (Mall • 1.9 km)
     - *RSUP Dr. Wahidin Sudirohusodo* (Rumah Sakit • 2.5 km)
     - *Terminal Regional Daya* (Transportasi • 6.1 km)
     - *Kawasan Industri Makassar (KIMA Daya)* (Kawasan Industri • 7.1 km)
   - Seluruh item memiliki durasi berjalan kaki / berkendara yang proporsional dan tombol rute navigasi.
4. **Periksa Seksi "Fasilitas Kost"**:
   - Pastikan perabot bersama kost seperti *Parkir Motor*, *Kompor*, dan *Wastafel Cuci Piring* tampil rapi di dalam kartu Fasilitas Kost pada grup Area Parkir dan Dapur Bersama.
