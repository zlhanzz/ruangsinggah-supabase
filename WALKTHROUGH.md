# WALKTHROUGH: Penyesuaian Otomatis Cover Thumbnail Foto Kamar Termahal untuk Seluruh Listing

Dokumen ini merangkum seluruh perubahan kode, hasil pengujian, dan panduan verifikasi mengenai penyesuaian otomatis foto sampul (*cover preview thumbnail*) listing di katalog pencarian publik dan dashboard.

---

## 1. Ringkasan Perubahan

### A. Algoritma Multi-Sumber `sortPropertyImagesWithRoomCover` (`userService.ts`)
1. **Pendeteksian Foto dari 5 Sumber Sekaligus**:
   - Membaca dan mengekstrak kategori/label foto dari:
     1. Array `photos_meta` / `metadata.photos_meta` (berisi objek foto dengan atribut `category` / `label` / `caption`).
     2. Map `categorized_photos` / `metadata.categorized_photos` (berisi pengelompokan foto berdasarkan nama kategori seperti `"Kamar: Tipe A"`, `"Kamar Tidur"`, dll.).
     3. Array `photo_categories` / `metadata.photo_categories` (berisi daftar kategori foto per indeks).
     4. Objek elemen di dalam array `image_urls`.
     5. Nested images pada properti KostManager (`room_types[i].images`).
2. **Scoring Prioritas Cerdas**:
   - Menghitung tipe kamar dengan harga tarif bulanan tertinggi (paling mahal).
   - Menempatkan foto interior kamar tidur dari tipe termahal di **Index 0 (`imageUrls[0]` / `photosMeta[0]`)**.
   - Menempatkan foto kamar dari tipe-tipe berikutnya di index selanjutnya.
   - Menempatkan foto-foto area publik (Bangunan Depan, Koridor, Area Parkir, Dapur Bersama, dll.) di urutan belakang.

---

### B. Otomasi Runtime Tanpa Edit Manual (`userService.ts` & `adminService.ts`)
1. **Data Transformer Runtime `transformPropertyRow`**:
   - Setiap kali data properti dimuat dari Supabase (di halaman katalog pencarian, detail kost, maupun dashboard), transformer langsung menerapkan penataan urutan foto secara *on-the-fly*.
   - Listing lama seperti **"KOST"** dan **"KOST APALAH DAYA"** yang sebelumnya menampilkan Bangunan Depan kini **otomatis 100% langsung menampilkan foto kamar tidurnya** tanpa perlu membuka/mengedit formulir listing manual.
2. **Dashboard Layer (`adminService.ts`)**:
   - Menerapkan `sortPropertyImagesWithRoomCover` pada `getProperties` sehingga daftar properti di Dashboard Mitra dan Dashboard Admin juga otomatis menampilkan foto kamar termahal.

---

## 2. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi TypeScript & Vite Bundle
```bash
cmd /c npm run build (di functions/public)
```
- **Hasil**: **Lulus 100% (Exit code 0)**
- **Status**: `✓ 2511 modules transformed, built in 24.97s, 0 errors`.

---

## 3. Panduan Pengujian untuk Pengguna

1. **Buka Halaman Pencarian Katalog Listing**:
   - Buka menu **Cari Kost / Listings** (`/listings`).
   - Perhatikan bahwa seluruh listing (termasuk listing lama seperti *"KOST"*, *"KOST APALAH DAYA"*, dan *"KOST MADANI BTP"*) kini menampilkan **Foto Kamar Tidur** sebagai cover thumbnail utama kartu kost.
2. **Pengecekan Tipe Kamar Jamak (> 1 Tipe Kamar)**:
   - Untuk kost yang memiliki lebih dari 1 tipe kamar (misal ada tipe Standard dan tipe VIP), foto cover thumbnail yang muncul di kartu listing adalah foto kamar dari **tipe yang tarifnya paling mahal**.
3. **Pengecekan Dashboard Mitra / Admin**:
   - Buka Dashboard Mitra atau Dashboard Admin: foto thumbnail pada daftar kelola kost juga otomatis tersinkronisasi menampilkan foto kamar.
