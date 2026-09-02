# IMPLEMENTATION PLAN: Pemulihan Foto Per Kategori Saat Edit Listing Kost Mitra

## 1. Analisis Masalah & Kebutuhan

### A. Pertanyaan Pengguna
> *"ketika selesai klik publish, kenapa hampir semua foto kecuali foto bangunan depan hilang saat kita klik tombol edit pada kartu kost setelah publish? apakah foto kost itu tidak benar benar tersimpan di database supabase untuk mitra biasa?"*

### B. Hasil Investigasi & Fakta Sistem
1. **Apakah foto benar-benar tersimpan di database Supabase untuk mitra biasa?**
   - **YA, 100% TERSIMPAN DENGAN AMAN.**
   - Seluruh file foto berhasil diunggah ke Supabase Storage (`properties/{userId}/{propertyId}/...`) dalam format WebP berkualitas tinggi.
   - Di tabel `properties` PostgreSQL Supabase, kolom `image_urls` menyimpan array objek foto lengkap dengan label kategori, dan kolom `metadata` menyimpan:
     - `metadata.photo_categories`: daftar kategori foto (misal: `["Bangunan Depan", "Koridor", "Area Parkir", "Lingkungan"]`).
     - `metadata.categorized_photos`: mapping kategori ke URL foto.
     - `metadata.photos_meta`: daftar objek citra lengkap dengan `category`, `label`, dan `caption`.

2. **Akar Masalah (Root Cause): Mengapa saat klik Edit, foto selain Bangunan Depan hilang (0 Foto)?**
   - **Omission Mapping pada `getOwnerProperties` (`functions/public/userService.ts`)**:
     Ketika mitra membuka dashboard, properti diambil melalui fungsi `getOwnerProperties(uid)`. Pada fungsi ini, `row.image_urls` diubah menjadi array string URL datar (`images = ['url1', 'url2', ...]`), sementara field `photosMeta`, `photoCategories`, `categorizedPhotos`, dan `metadata` **TIDAK DI-RETURN**.
   - **Dampaknya pada Formulir Edit (`KostFormMitra.tsx`)**:
     Saat mitra mengklik tombol **Edit** pada kartu kost, objek properti `p` yang masuk ke state `editingKost` hanya memiliki array string URL tanpa label kategori.
     Pada Langkah 5 (Foto), logika `existingWithCats` memeriksa:
     - Indeks 0 -> Karena tidak ada label kategori, di-fallback ke `'Bangunan Depan'` (sehingga hanya foto ini yang muncul).
     - Indeks 1, 2, 3, dst. -> Dialihkan ke `'Fasilitas Lainnya'` (bukan ke `'Koridor'`, `'Area Parkir'`, atau `'Lingkungan'`). Akibatnya, kartu kategori wajib seperti "Koridor & Akses Masuk", "Area Parkir", dan "Lingkungan Sekitar" semuanya menampilkan **0 FOTO**.

---

## 2. Dampak Perubahan (Files Affected)

1. `functions/public/userService.ts`:
   - Memperbarui fungsi `getOwnerProperties(ownerUid)` agar memetakan dan mengembalikan `photosMeta`, `photoCategories`, `categorizedPhotos`, dan `metadata` dari baris database properti secara lengkap.
2. `functions/public/components/KostFormMitra.tsx`:
   - Memperkuat logika pemulihan foto pada Langkah 5 (`existingWithCats`):
     - Membaca dari `form.photosMeta` bila tersedia.
     - Melakukan pencocokan balik (*reverse lookup*) ke `form.categorizedPhotos` berdasarkan URL jika properti lama tidak memiliki label objek.
     - Menginisialisasi state `customCategories` dari `editingKost.photoCategories` agar kategori foto kustom yang dibuat mitra tidak hilang.
3. `functions/public/adminService.ts`:
   - Memperkuat fungsi `updatePropertyWithMedia`: menjaga kesinambungan label kategori foto dari `existing.metadata` / `currentImageObjects` sehingga penyimpanan ulang tidak akan menghapus kategori yang ada.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Approval)

### Langkah 1: Penguatan Data Fetching di `functions/public/userService.ts`
- Pada `getOwnerProperties(ownerUid)`:
  - Bangun `photosMeta` menggunakan `getDisplayImageObject` dari `row.metadata?.photos_meta` atau `row.image_urls`.
  - Sertakan field `photoCategories`, `categorizedPhotos`, `photosMeta`, dan `metadata` pada objek `Kost` yang di-return, setara dengan implementasi di `getPublishedPropertyDetails`.

### Langkah 2: Penyempurnaan Mapping Foto & Kategori di `functions/public/components/KostFormMitra.tsx`
- Pada inisialisasi state `customCategories`:
  - Ambil kategori tambahan non-standar yang ada di `editingKost.photoCategories` agar kategori kustom langsung aktif di form edit.
- Pada `existingWithCats` (Langkah 5):
  - Prioritaskan pembacaan foto dari `form.photosMeta` yang memuat `category`, `label`, dan `caption`.
  - Tambahkan fallback cerdas ke `form.categorizedPhotos`: jika ada foto URL yang cocok dengan daftar URL suatu kategori di `categorizedPhotos`, otomatis petakan ke kategori tersebut.

### Langkah 3: Pengamanan Penyimpanan Edit di `functions/public/adminService.ts`
- Pada `updatePropertyWithMedia`:
  - Pastikan sinkronisasi foto yang dipertahankan (`keptImageStrings`) mempertahankan label kategori dari `currentImageObjects` dan `existing.metadata`.

### Langkah 4: Pengujian Kompilasi & Dokumentasi
- Jalankan kompilasi TypeScript & Vite build: `cmd /c npm run build`.
- Catat riwayat perubahan ke `functions/PROGRESS.md`.
- Buat laporan walkthrough di `WALKTHROUGH.md`.
- Lakukan Git commit dan push ke branch non-production `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` dan memastikan 0 error kompilasi TypeScript.
2. **Verifikasi Alur UI (Simulasi Edit Mitra)**:
   - Buat/buka kost yang sudah dipublikasikan yang memiliki foto di berbagai kategori ("Bangunan Depan", "Koridor & Akses Masuk", "Lingkungan Sekitar", "Area Parkir").
   - Klik tombol **Edit** pada kartu kost di `MitraDashboard`.
   - Buka Langkah 5 (Foto):
     - Pastikan "Bangunan Depan" memiliki fotonya.
     - Pastikan "Koridor & Akses Masuk" memiliki fotonya (bukan 0 Foto).
     - Pastikan "Lingkungan Sekitar" memiliki fotonya (bukan 0 Foto).
     - Pastikan "Area Parkir" memiliki fotonya (bukan 0 Foto).
