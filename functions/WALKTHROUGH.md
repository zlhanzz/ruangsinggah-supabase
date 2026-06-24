# WALKTHROUGH — Sinkronisasi Fitur Properti Kelolaan Portal KostManager & Desain Premium Super Admin

Dokumen ini menjelaskan perubahan, penyelarasan fitur, dan perbaikan navigasi pada Portal KostManager (`KostManagerPortal.tsx`) agar setara dengan dashboard admin utama.

## Perubahan yang Dilakukan

### 1. Penyelarasan Desain Modal & Sidebar Kategori
* **Lokasi Perubahan**: [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerPortal.tsx)
* **Detail**:
  - Seluruh ikon emoji (📝, 📍, dll.) pada sidebar tabs modal properti KostManager telah dihapus.
  - Gaya visual tombol sidebar disamakan dengan panel super admin (`w-full text-left px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all`).

### 2. Integrasi Fitur & Form dari Dashboard Admin
* **Tab Info Dasar**: Menambahkan form **Omnichannel Contact** (WhatsApp Forwarding).
* **Tab Lokasi & Kampus**:
  - Integrasi input **Kampus Terdekat** & **Fasilitas Publik** lengkap dengan estimasi jarak dan opsi visualisasi waktu tempuh (jalan kaki / berkendara).
  - Ditambahkan tombol pencari koordinat latitude & longitude otomatis menggunakan OpenStreetMap Nominatim API berdasarkan nama lokasi.
* **Tab Fasilitas & Biaya**:
  - Menambahkan baris input **Biaya Tambahan (Additional Fees)** yang memuat Nama Biaya, Nominal, dan Ketentuan Penagihan.
* **Tab Media (Galeri Utama)**:
  - Tab baru yang ditambahkan di portal untuk mengelola media utama properti.
  - Mendukung multi-upload foto (drag & drop reorderable thumbnail), video tour (file lokal atau tautan eksternal), serta tautan akun media sosial properti (Instagram & TikTok).

### 3. Integrasi Uploader Berkas Media Supabase Storage
* **Detail**:
  - Proses penyimpanan (`handleSave` modal) kini menggunakan helper backend `addPropertyWithMedia` dan `updatePropertyWithMedia` dari `adminService.ts`.
  - File foto utama dan video yang diunggah dikonversi ke format yang sesuai dan diupload langsung ke bucket penyimpanan Supabase Storage.

### 4. Perbaikan Redirect Loop & Tombol "⬅️ Admin Utama"
* **Lokasi Perubahan**: [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerPortal.tsx)
* **Detail**:
  - Menghapus hook `useEffect` auto-redirect bermasalah (baris 195-199) yang memaksa menu `'kostmanager'` dialihkan kembali ke `'km_overview'`.
  - Kini tombol **⬅️ Admin Utama** merespons klik dengan baik dan membawa admin kembali ke panel pengelolaan properti KostManager tanpa terkena refresh/redirect loop.

### 5. Integrasi Foto Kamar Kosong ke Galeri Pemasaran
* **Lokasi Perubahan**: [KostDetail.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/KostDetail.tsx)
* **Detail**:
  - Menambahkan filter dan pemetaan array dinamis (`vacantRoomImages`) untuk mengambil semua foto kamar spesifik unit yang diunggah di tab "Tipe Kamar & Penghuni" KostManager.
  - Foto-foto tersebut digabungkan ke dalam array `imageUrls` utama galeri properti **hanya jika** status kamar tersebut tercatat secara sistem sebagai "Kosong" (tidak dihuni oleh penyewa).

### 6. Perbaikan Bug Upload Foto Ganda & Integrasi Konversi WebP
* **Lokasi Perubahan**: [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerPortal.tsx)
* **Detail**:
  - Mengubah logika state updater di `handleUploadRoomPhoto` dan `handleDeleteRoomPhoto` agar melakukan pemetaan/shallow copy secara aman (`map`) dan menghindari mutasi referensi objek state React secara langsung. Hal ini menghentikan duplikasi file akibat eksekusi ganda state updater di React Strict Mode.
  - Menambahkan pembersihan nilai input target file (`e.target.value = ''`) setelah upload selesai agar berkas yang sama dapat diunggah ulang jika dihapus.
  - Memastikan proses upload foto kamar memanggil `uploadFileAndGetURL`, yang secara otomatis memicu konversi WebP klien (`convertToWebP` di `adminService.ts`) sebelum data berkas diunggah ke bucket properti Supabase Storage.

### 7. Pemuatan Daftar Pemilik (Mitra) Menyeluruh & Penautan Kepemilikan Properti
* **Lokasi Perubahan**: [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerPortal.tsx)
* **Detail**:
  - Memperbarui `loadAllData` untuk mengambil seluruh daftar pengguna dengan `role` `'owner'` atau `'mitra'` dari database untuk diisi ke `ownersList` (untuk pilihan dropdown Mitra). Hal ini memungkinkan properti terkelola ditautkan dengan benar ke pemilik mana saja di RuangSinggah.id.
  - Menambahkan pencarian `owner_uid` dari tabel `properties` secara langsung dalam `allOwnerIds` sebelum early return, sehingga properti terkelola milik mitra mana pun tetap ter-load di portal KostManager dan data insightnya dapat dipantau oleh mitra di dashboard mereka sendiri.

### 8. Pemisahan Listing Biasa dengan Listing KostManager & Eksklusivitas Badge Verified
* **Lokasi Perubahan**: [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerPortal.tsx), [KostCard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/KostCard.tsx), [KostDetail.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/KostDetail.tsx), [Home.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/Home.tsx)
* **Detail**:
  - Menambahkan kolom `is_managed` pada berkas skema `supabase_schema.sql` untuk membedakan properti kelolaan KostManager dengan listing biasa.
  - Memfilter data di `KostManagerPortal` sehingga hanya memuat properti yang memiliki `is_managed = true` di database. Hal ini menyembunyikan seluruh listing kost biasa (baik self-listing pemilik biasa maupun postingan admin standar) dari dashboard KostManager.
  - Mengubah logika UI customer-facing (`KostCard`, `KostDetail`, dan daftar Rekomendasi Utama `Home`) agar lencana **"Verified"** / **"Terverifikasi"** hanya ditampilkan jika properti tersebut berstatus kelolaan KostManager (`isManaged === true`), menjadikannya label eksklusif untuk mitra KostManager.
### 9. Pencarian Instan Pemilik Properti / Mitra Terdaftar
* **Lokasi Perubahan**: [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerPortal.tsx)
* **Detail**:
  - Mengubah dropdown `<select>` statis di tab **Info Dasar** untuk memilih mitra menjadi komponen **Custom Searchable Dropdown** dengan kolom input teks pencarian dinamis.
  - Memfilter daftar pemilik kost/mitra secara instan berdasarkan nama atau nomor telepon yang diketik oleh admin.
  - Menyertakan tombol clear pencarian, state kosong ("Tidak ada mitra yang cocok"), serta handling klik di luar area dropdown (click outside) menggunakan ref global untuk kenyamanan UI/UX.

---

## Petunjuk Pengujian

1. **Jalankan Aplikasi secara Lokal**:
   ```powershell
   npm run dev
   ```
2. **Uji Penambahan / Pengeditan Properti**:
   - Masuk ke portal KostManager, klik **"+ Tambah Properti"** atau **"Edit"**.
   - Verifikasi hilangnya ikon emoji di tab sidebar dan pastikan biaya tambahan dapat diisi.
   - Uji pencarian koordinat lokasi dan upload media di tab **Media**.
   - Di tab **Info Dasar**, buka dropdown pemilik (mitra), ketik nama/nomor telepon mitra, pastikan penyaringan berjalan lancar, dan pilih mitra tersebut.
   - Klik simpan dan periksa apakah properti berhasil tersimpan di database.
3. **Uji Navigasi**:
   - Klik tombol **"⬅️ Admin Utama"** dan pastikan Anda diarahkan kembali ke Dashboard Admin tanpa hambatan.

