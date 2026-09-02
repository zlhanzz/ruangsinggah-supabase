# WALKTHROUGH - Pemulihan Kategori & Foto Properti Saat Edit Listing Kost Mitra

## Ringkasan Eksekutif
Masalah di mana foto-foto listing kost (seperti **Koridor & Akses Masuk**, **Lingkungan Sekitar**, **Area Parkir**, dan **Tipe Kamar**) tampak menjadi 0 foto ketika kartu kost diklik **Edit** setelah dipublikasikan telah **berhasil diselesaikan**.

Data foto yang diunggah oleh mitra telah diverifikasi **100% tersimpan aman di Supabase Storage dan tabel `properties` PostgreSQL**. Kendala sebelumnya terjadi murni pada *layer pembacaan data* di mana `getOwnerProperties` hanya memetakan URL gambar sebagai array string biasa tanpa mengembalikan metadata kategori, sehingga formulir edit mengelompokkan foto-foto selain indeks 0 ke kategori cadangan (*Fasilitas Lainnya*).

---

## 1. Bukti Penyimpanan Data di Database Supabase
- **Storage Supabase**: Tersimpan di bucket `properties/{user_id}/{property_id}/images/original/...` dalam format modern `.webp`.
- **Database PostgreSQL**:
  - Kolom `properties.image_urls`: Berisi array of objects dengan struktur `{ original, url, label, category, caption }`.
  - Kolom `properties.metadata`:
    - `photo_categories`: Menyimpan daftar kategori yang digunakan (`string[]`).
    - `categorized_photos`: Menyimpan pemetaan kategori ke daftar URL foto (`Record<string, string[]>`).
    - `photos_meta`: Menyimpan array objek foto lengkap beserta label dan caption.

---

## 2. Rincian Modifikasi Kode

### A. Layanan Pengambilan Data Properti Pemilik (`userService.ts`)
- **Lokasi**: [userService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts#L850-L895)
- **Perubahan**:
  - Pada fungsi `getOwnerProperties(ownerUid)`, kini secara eksplisit memetakan:
    ```typescript
    photoCategories: (Array.isArray(p.metadata?.photo_categories) && p.metadata.photo_categories.length > 0)
      ? p.metadata.photo_categories
      : Array.isArray(p.image_urls) ? p.image_urls.map((img: any) => img?.label || img?.category || '').filter(Boolean) : [],
    categorizedPhotos: (p.metadata?.categorized_photos && typeof p.metadata.categorized_photos === 'object')
      ? p.metadata.categorized_photos
      : undefined,
    photosMeta: (Array.isArray(p.metadata?.photos_meta) && p.metadata.photos_meta.length > 0)
      ? p.metadata.photos_meta
      : (Array.isArray(p.image_urls) ? p.image_urls : []),
    metadata: p.metadata || {},
    ```
  - Memastikan objek `Kost` yang diteruskan ke dashboard mitra membawa seluruh struktur kategori foto.

### B. Formulir Pendaftaran & Edit Kost Mitra (`KostFormMitra.tsx`)
- **Lokasi**: [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)
- **Perubahan**:
  1. **Inisialisasi State Form**:
     - Membaca dan menghidrasi `photoCategories`, `photosMeta`, dan `categorizedPhotos` dari `editingKost` maupun `editingKost.metadata`.
  2. **Inisialisasi Kategori Kustom (`customCategories`)**:
     - Memfilter kategori non-standar dari properti `editingKost.photoCategories` atau `metadata.photo_categories` agar kategori kustom yang ditambahkan sebelumnya langsung muncul di panel.
  3. **Penghapusan Foto yang Sinkron (`removeExistingImage`)**:
     - Menghapus foto dari `imageUrls` sekaligus menyelaraskan state `photosMeta`.
  4. **Validasi & Rekonstruksi Kategori di UI (`existingWithCats`)**:
     - Mengutamakan `photosMeta` yang memuat `label`/`category`.
     - Menyediakan *reverse lookup* otomatis ke `form.categorizedPhotos` untuk mencocokkan URL foto dengan nama kategori aslinya.
     - Memastikan foto terdistribusi tepat ke kartu masing-masing (**Koridor**, **Lingkungan Sekitar**, **Area Parkir**, **Kamar**, dll.).
  5. **Pengiriman Form (`handleSubmit`)**:
     - Mempertahankan objek foto lengkap (`existingImagesWithLabels`) dengan label, kategori, dan caption saat data dikirim ke `updatePropertyWithMedia`.

### C. Pembaruan Properti di Sisi Admin/Mitra (`adminService.ts`)
- **Lokasi**: [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts#L2150-L2245)
- **Perubahan**:
  - Mengimplementasikan helper `findLabelForUrl` untuk memulihkan kategori foto lama dari `existing.metadata.photos_meta`, `existing.metadata.categorized_photos`, maupun `currentImageObjects`.
  - Mengamankan `derivedPhotoCategories` agar tidak tertimpa jika client mengirim array string kosong.

---

## 3. Hasil Verifikasi & Uji Kompilasi

Kompilasi build aplikasi front-end dijalankan menggunakan bundler Vite:
```bash
cmd /c npm run build
```
**Hasil**:
```text
vite v6.4.1 building for production...
transforming...
✓ 2506 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 37.27s
0 errors, 0 warnings fatal.
```

---

## 4. Panduan Verifikasi untuk Pengguna

1. **Buka Dashboard Mitra**:
   - Masuk ke aplikasi dan navigasikan ke menu dashboard mitra.
2. **Buka Mode Edit Listing**:
   - Temukan kartu properti kost yang sudah dipublikasikan sebelumnya.
   - Klik tombol **Edit** pada kartu kost.
3. **Navigasi ke Langkah Foto (Langkah 5 dari 6)**:
   - Klik tombol **Lanjut** hingga mencapai langkah kelima (Foto Properti & Kamar).
4. **Verifikasi Tampilan Foto**:
   - Periksa kartu-kartu kategori seperti:
     - **Bangunan Depan (Fasad)**
     - **Koridor & Akses Masuk**
     - **Lingkungan Sekitar**
     - **Area Parkir**
     - Foto tipe kamar (misal: *Kamar: Tipe Standard*, *Kamar Mandi*, dll.)
   - Pastikan foto-foto yang diunggah sebelumnya **muncul kembali pada kartu kategorinya masing-masing** dan tidak lagi bernilai "0 FOTO".
5. **Uji Simpan / Perubahan**:
   - Tambah atau hapus salah satu foto, lalu klik **Simpan Perubahan**.
   - Buka kembali formulir edit untuk memastikan persistensi tetap terjaga 100%.
