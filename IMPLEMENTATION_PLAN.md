# IMPLEMENTATION PLAN: Perbaikan Foto Hilang Pasca-Edit Listing Mitra & Penegasan Alur Edit vs Publish Baru

## 1. Analisis Masalah & Pertanyaan Pengguna

### A. Akar Masalah Foto Hilang / Broken Image Pasca-Edit
Dari hasil investigasi mendalam pada alur kerja data dari front-end ke database dan cloud storage:
1. **Perbedaan Domain URL (Proxy CDN vs Supabase Direct)**:
   - Saat Mitra membuka Dashboard Mitra, daftar properti dibaca via `getOwnerProperties(uid)` di `userService.ts`.
   - Fungsi `ensureAbsoluteUrl` secara otomatis mengubah domain penyimpanan Supabase (`https://<project-ref>.supabase.co/...`) menjadi domain CDN proxy resmi (`https://media.ruangsinggah.id/...`).
   - Ketika Mitra mengklik tombol **"Edit"**, objek properti dengan URL `media.ruangsinggah.id` tersebut diumpankan ke dalam form `KostFormMitra.tsx`.
2. **False Negative pada Pengecekan Foto yang Dihapus (`itemsToDelete`)**:
   - Saat Mitra menekan "Simpan Perubahan", data dikirim ke fungsi `updatePropertyWithMedia()` di `adminService.ts`.
   - Pada baris pengecekan foto yang dihapus:
     ```typescript
     const itemsToDelete = currentImageObjects.filter((imgObj: any) => {
       const isKept = keptImageStrings.some(keptUrl =>
         keptUrl === imgObj.original || keptUrl === imgObj.webp || ...
       );
       return !isKept;
     });
     ```
   - Karena `imgObj.original` di database masih berupa `supabase.co` sedangkan `keptUrl` dari form berupa `media.ruangsinggah.id`, perbandingan string eksak menghasilkan `false`.
   - Sistem salah menduga bahwa **seluruh foto lama telah dihapus oleh mitra**, lalu memanggil `deleteFileFromStorage()` yang secara fisik **menghapus file gambar dari Supabase Storage**!
   - Akibatnya, URL yang tersimpan di database menjadi broken link (error 404) dan tampilan foto di sisi user pencari properti menjadi kosong / broken image icon.

---

### B. Penegasan Alur: Listing Baru (Publish Baru) vs Listing Lama (Editing)
Pengguna menanyakan:
> *"apakah jangan jangan meskipun sebelumnya sudah pernah di acc oleh admin dan berhasil listing, ketika dilakukan pengeditan, alurnya masih sama ? harus acc dulu dari admin? kita perlu ada perbaikan sih jika seandainya begitu, sistem kita harus membedakan yang mana yang baru publissh dan yang mana hanya melakukan editing"*

**Prinsip Desain & Alur yang Harus Ditegakkan**:
1. **Listing Baru (Pendaftaran Baru Pertama Kali)**:
   - Dijalankan melalui fungsi `addPropertyWithMedia`.
   - Status awal **WAJIB `'draft'`** dengan `is_verified: false`.
   - Memerlukan review dan verifikasi/ACC dari Super Admin sebelum dapat tayang di katalog publik.
2. **Editing Listing Lama (Yang Sudah Pernah di-ACC & Tayang)**:
   - Dijalankan melalui fungsi `updatePropertyWithMedia`.
   - **Jika properti sebelumnya SUDAH berstatus `'published'`**: Maka saat mitra melakukan pengeditan (misal update fasilitas, ubah harga sewa, perbaiki deskripsi, atau ganti/tambah foto), properti **TETAP berstatus `'published'`** (langsung ter-update secara instan tanpa harus antre ACC admin dari awal lagi).
   - **Jika properti sebelumnya masih berstatus `'draft'` atau `'revision'` (sedang/butuh revisi)**: Properti tetap berstatus `'draft'` untuk menunggu peninjauan admin.

---

## 2. Dampak Perubahan File

1. **`functions/public/adminService.ts`**:
   - Menambahkan helper normalisasi storage path `extractStorageRelativePath(url: string)` agar komparasi file gambar di `updatePropertyWithMedia`, `findLabelForUrl`, dan fungsi manajemen media lainnya 100% kebal terhadap perbedaan domain (`media.ruangsinggah.id` vs `supabase.co`).
   - Mencegah `itemsToDelete` menghapus foto yang sebenarnya masih dipertahankan oleh mitra.
   - Memastikan bahwa jika properti yang diedit sudah `status === 'published'`, status tetap terjaga `'published'` dan `is_verified: existing.is_verified` (tidak ter-reset ke draft).
2. **`functions/public/components/KostFormMitra.tsx`**:
   - Memastikan payload saat edit (`isEditing`) membawa status yang tepat (`editingKost.status === 'published' ? 'published' : 'draft'`).
   - Memberikan pesan feedback / alert yang jelas: Jika listing aktif diedit, beritahukan bahwa perubahan langsung tayang. Jika listing draft diedit, beritahukan bahwa pengajuan dikirim untuk review.
3. **`functions/public/userService.ts`**:
   - Memastikan helper `getDisplayImageUrl` dan `ensureAbsoluteUrl` konsisten dan aman saat data bolak-balik antara pembacaan dan pembaruan.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

### Langkah 1: Penguatan Normalisasi Path Storage di `adminService.ts`
- Implementasi fungsi pembantu `normalizeStorageRelativePath(url: string)`:
  ```typescript
  export function normalizeStorageRelativePath(urlStr: string): string {
    if (!urlStr || typeof urlStr !== 'string') return '';
    const trimmed = urlStr.trim();
    // Ekstrak bagian path setelah /storage/v1/object/public/<bucket>/ atau ambil path relatifnya
    const match = trimmed.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (match && match[1]) {
      return match[1].split('?')[0]; // path bersih tanpa query params
    }
    return trimmed.split('?')[0];
  }
  ```
- Memperbarui `itemsToDelete` pada `updatePropertyWithMedia`:
  ```typescript
  const normalizedKeptPaths = keptImageStrings.map(normalizeStorageRelativePath).filter(Boolean);
  
  const itemsToDelete = currentImageObjects.filter((imgObj: any) => {
    const origPath = normalizeStorageRelativePath(imgObj.original || imgObj.url || (typeof imgObj === 'string' ? imgObj : ''));
    const webpPath = normalizeStorageRelativePath(imgObj.webp || '');
    const thumbPath = normalizeStorageRelativePath(imgObj.thumbnail || '');
    
    const isKept = normalizedKeptPaths.some(keptPath => 
      keptPath === origPath || 
      (webpPath && keptPath === webpPath) || 
      (thumbPath && keptPath === thumbPath) ||
      (origPath && (keptPath.endsWith(origPath) || origPath.endsWith(keptPath)))
    );
    return !isKept;
  });
  ```
- Memperbarui `findLabelForUrl` dengan pencocokan path yang dinormalisasi.

### Langkah 2: Perlindungan Status Properti pada Alur Edit
- Pada `updatePropertyWithMedia`, tentukan status akhir secara aman:
  ```typescript
  const targetStatus = isAdmin 
    ? (kostData.status || existing.status || 'draft')
    : (existing.status === 'published' ? 'published' : 'draft');
  const targetVerified = isAdmin
    ? (kostData.isVerified !== undefined ? kostData.isVerified : existing.is_verified)
    : (existing.status === 'published' ? (existing.is_verified ?? true) : false);
  ```
- Dengan demikian, jika mitra mengedit kost yang sudah disetujui admin, statusnya tetap `published` dan langsung tayang. Jika baru mendaftar, tetap `draft` menunggu persetujuan.

### Langkah 3: Penyesuaian Pesan Feedback di `KostFormMitra.tsx`
- Pada submit berhasil:
  - Jika `isEditing && editingKost?.status === 'published'`: Tampilkan notifikasi "Perubahan berhasil disimpan! Data kost Anda telah langsung diperbarui di listing publik."
  - Jika `isEditing && editingKost?.status !== 'published'`: Tampilkan "Perubahan draft berhasil disimpan! Menunggu peninjauan admin."
  - Jika listing baru: Tampilkan "Pengajuan kost berhasil dikirim! Menunggu peninjauan tim RuangSinggah."

### Langkah 4: Uji Kompilasi & Build
- Menjalankan `npm run build` di `functions/public/` untuk memastikan 0 error kompilasi TypeScript.
- Memperbarui `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
- Melakukan git commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

| Skenario Pengujian | Hasil yang Diharapkan |
|---|---|
| **Edit Listing Published** | Data ter-update, foto lama TIDAK terhapus dari storage, status tetap `published`, foto tetap muncul di halaman detail. |
| **Hapus Salah Satu Foto Saat Edit** | Hanya foto yang dihapus yang dibersihkan dari storage, foto lainnya tetap utuh. |
| **Tambah Foto Baru Saat Edit** | Foto baru terunggah dan ditambahkan ke daftar galeri, foto lama tidak terganggu. |
| **Pendaftaran Listing Baru** | Listing masuk dengan status `draft` dan `is_verified: false` untuk di-review admin. |
| **Kompilasi TypeScript** | `npm run build` berhasil 100% dengan 0 error. |

---

> **Status:** Menunggu persetujuan (*Proceed / ACC*) dari Pengguna sebelum eksekusi kode (Fase 2).
