# Walkthrough: Fitur De-aktivasi Properti KostManager & Pemulihan Bersih ke Mitra Biasa (Self-Listing) dengan Restorasi Foto & Data Mandiri Asli Mitra

Dokumen ini merangkum penyelesaian fitur untuk memastikan bahwa properti terkelola KostManager yang sebelumnya merupakan listing mandiri mitra biasa (*self-listing*), dapat dinonaktifkan dari portofolio KostManager dan dikembalikan secara bersih menjadi listing mitra biasa, lengkap dengan seluruh foto dan data mandiri asli yang diunggah oleh mitra (bukan foto hasil survei agen).

---

## 1. Ringkasan Masalah & Solusi yang Diterapkan

| Masalah Sebelumnya | Solusi yang Diimplementasikan |
| :--- | :--- |
| **Ketiadaan Aksi De-aktivasi**: Tabel Properti Terkelola hanya memiliki opsi *Banned* atau *Hapus Permanen*. Jika dihapus, data properti musnah. | Menambahkan tombol aksi **"Kembalikan ke Mitra Biasa"** (`RotateCcw`) dan modal konfirmasi interaktif di Portal KostManager (`KostManagerPortal.tsx`) serta drawer onboarding (`KostManagerManagement.tsx`). |
| **Penimpaan Foto & Kamar**: Onboarding KostManager menimpa data listing dengan kamar individual dan foto surveyor (`/kostmanager/drafts/...`). | Membuat fungsi terpusat `deactivateKostManagerAndRestoreSelfListing` di `adminService.ts` yang memulihkan `image_urls`, `room_types`, `facilities`, `rules`, dan `description` kembali ke snapshot foto dan data mandiri milik mitra. |
| **Data Legacy "Kost Apalah Daya"**: Disurvei sebelum mekanisme snapshot otomatis sehingga belum memiliki `metadata.self_listing_*`. | Telah dilakukan backfill data: 33 foto asli mandiri mitra dari folder storage `properties/drafts/a29dd46f-7754-4da4-904e-6b90176bc15d/` beserta tipe kamar (Standard & Premium) telah tersimpan aman di `metadata.self_listing_*`. |
| **Pembersihan Portofolio KostManager**: Properti lama masih berpotensi terbaca di tabel terkelola jika hanya flag boolean yang diubah. | Record di tabel `mitra_kostmanager` dihapus/dibersihkan, status tiket di `kostmanager_requests` diubah menjadi `INACTIVE`, status langganan mitra dikembalikan ke `reguler` jika tidak ada properti terkelola lain, dan `invalidatePropertiesCache()` dipanggil. |

---

## 2. Detail Modifikasi File & Logika

### A. Service Terpusat De-aktivasi & Restorasi ([adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts))
- Mengimplementasikan `deactivateKostManagerAndRestoreSelfListing(propertyId: string)`:
  1. Mengambil data properti dan membaca `metadata.self_listing_images`, `self_listing_room_types`, `self_listing_facilities`, `self_listing_rules`, `self_listing_description`.
  2. Fallback cerdas: jika metadata kosong, mencari file mandiri di storage `drafts/${owner_uid}` dan menyaring keluar seluruh URL foto surveyor (`/kostmanager/drafts/` dan `/survey/`).
  3. Memperbarui tabel `properties`: menyetel `is_managed: false`, `status: 'published'` (agar properti langsung tayang normal sebagai kost reguler), serta mengembalikan foto dan tipe kamar mandiri mitra.
  4. Menghapus record properti dari tabel dedicated `mitra_kostmanager`.
  5. Memperbarui tiket `kostmanager_requests` terkait ke status `INACTIVE`.
  6. Mengembalikan `mitra.subscription_status` ke `'reguler'` jika pemilik tidak memiliki gedung KostManager lainnya.
  7. Memanggil `invalidatePropertiesCache()` agar katalog publik seketika tersinkronisasi.
- Memperbarui `deleteKostManagerRequest(id)` agar secara otomatis menjalankan pemulihan self-listing jika tiket yang dihapus terhubung dengan properti yang aktif terkelola.

### B. Antarmuka Portal KostManager ([KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx))
- Menambahkan tombol aksi operasional **"Nonaktifkan KostManager & Kembalikan ke Mitra Biasa"** (`RotateCcw`) berwarna amber/oranye di tabel Properti Terkelola (`activeTab === 'properties'`).
- Menyediakan modal konfirmasi dialog `propToDeactivate` dengan rincian data yang akan dipulihkan secara otomatis (foto mandiri mitra, tipe kamar mitra, status tayang tetap aktif, kontrol kamar manual).
- Mengintegrasikan handler `handleConfirmDeactivate` dengan pembaruan state lokal seketika.

### C. Antarmuka Manajemen Permintaan KostManager ([KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx))
- Menambahkan tombol **"Kembalikan ke Mitra Biasa"** di samping badge status aktif pada drawer peninjauan permintaan onboarding.
- Memperbarui dialog konfirmasi hapus tiket agar menginformasikan bahwa properti aktif akan dikembalikan secara aman ke self-listing mitra biasa.

### D. Backfill Data Properti Existing ("Kost Apalah Daya")
- Database Supabase untuk properti `bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f` telah disinkronisasikan:
  - `self_listing_images`: 33 berkas foto asli mandiri mitra dari folder `properties/drafts/a29dd46f-7754-4da4-904e-6b90176bc15d/`.
  - `self_listing_room_types`: Tipe Standard (Rp 800.000, 5 kamar) & Tipe Premium (Rp 1.300.000, 5 kamar).
  - `self_listing_facilities`: WiFi, Area Parkir, Dapur Bersama, CCTV 24 Jam, Akses 24 Jam, Ruang Jemur.
  - `self_listing_rules`: Akses 24 Jam, Dilarang Merokok di Dalam Kamar, dll.

---

## 3. Hasil Pengujian & Kompilasi

1. **Uji Kompilasi Vite & TypeScript (`npm run build`)**:
   - Direktori kerja: `functions/public`
   - **Hasil**: **LULUS 100% (Exit Code 0)** dalam `29.93s`.
   - 2.512 modul tertransformasi tanpa ada error tipe TypeScript maupun bundling Vite.

2. **Verifikasi Integritas Data Supabase**:
   - Query verifikasi terhadap properti `bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f` mengonfirmasi:
     - Cadangan data mandiri `self_listing_images` terisi 33 URL foto mandiri mitra.
     - Cadangan tipe kamar mandiri `self_listing_room_types` terisi 2 tipe kamar asli mitra.

---

## 4. Panduan Verifikasi bagi Pengguna / Admin

1. **Buka Menu Properti Terkelola KostManager**:
   - Masuk ke `/dashboard-admin/km_properties` (menu **Properti Terkelola**).
   - Pada kolom *Aksi Operasional* di setiap baris properti, perhatikan tombol baru berwarna oranye dengan ikon putar balik (`RotateCcw`) bertuliskan tooltip *"Nonaktifkan KostManager & Kembalikan ke Mitra Biasa (Self-Listing)"*.
2. **Uji Modal Konfirmasi Pengembalian**:
   - Klik tombol putar balik tersebut pada properti yang ingin dinonaktifkan.
   - Muncul modal konfirmasi elegan dengan rincian data yang akan dipulihkan (foto mandiri, tipe kamar mitra, tayang publik reguler).
   - Klik **"Konfirmasi Kembalikan ke Mitra Biasa"**.
3. **Periksa Hasil Pemulihan**:
   - **Di Portal KostManager**: Properti otomatis hilang dari daftar Properti Terkelola.
   - **Di Dashboard Mitra (`/dashboard-mitra/properties`)**:
     - Properti tampil sebagai listing mandiri biasa (badge KostManager Auto-Pilot hilang).
     - Kontrol jumlah kamar manual (+/- atau Atur Ketersediaan Kamar) kembali aktif.
     - Foto yang tampil adalah foto asli yang diunggah secara mandiri oleh mitra.
   - **Di Katalog Publik (`/listings` dan Beranda)**:
     - Badge biru "TERVERIFIKASI" hilang.
     - Foto dan tipe kamar kembali menampilkan data mandiri mitra.

---

## 5. Prosedur Git & Deploy
Sesuai aturan baku workspace, seluruh commit tersimpan aman di branch `bukan-productions`. User dapat melakukan deploy manual ke production kapan saja.
