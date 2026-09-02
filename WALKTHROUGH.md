# WALKTHROUGH: Perbaikan Foto Hilang Pasca-Edit Listing Mitra & Penegasan Alur Edit vs Publish Baru

## 1. Ringkasan Perubahan
Telah diselesaikan perbaikan terhadap akar masalah hilangnya foto listing (broken image) pasca-editing dari Dashboard Mitra, serta penegasan arsitektur alur antara **Listing Baru** (harus review & ACC admin) dengan **Editing Listing Lama** (langsung tayang instan jika sudah berstatus published).

---

## 2. Detail Perubahan Kode

### A. Helper Normalisasi Path Storage & Pencegahan Salah Hapus (`functions/public/adminService.ts`)
- **Fungsi `normalizeStorageRelativePath`**:
  - Mengekstrak path relatif objek storage (seperti `user123/property456/images/original/123.webp`).
  - Kebal terhadap perbedaan domain, baik direct Supabase (`https://<project-ref>.supabase.co/...`), CDN proxy (`https://media.ruangsinggah.id/...`), maupun path relatif.
- **Pembaruan `itemsToDelete` & `videosToDelete`**:
  - Menggunakan helper `isImagePathKept` berbasis `normalizeStorageRelativePath`.
  - Mencegah sistem menghapus file foto dari Supabase Storage jika foto tersebut sebenarnya masih dipertahankan oleh mitra.
- **Pembaruan `findLabelForUrl`**:
  - Menghubungkan label/kategori foto secara presisi dengan mencocokkan path storage normalisasi.
- **Pembaruan `deleteFileFromStorage`**:
  - Ditingkatkan agar dapat mem-parse URL dengan path proxy CDN secara mulus dan aman.

### B. Perlindungan Status Listing Saat Edit (`adminService.ts` & `KostFormMitra.tsx`)
- **Logika Status di `updatePropertyWithMedia`**:
  - Jika listing yang diedit sudah `status === 'published'`, maka status tetap **`published`** dan `is_verified: true`.
  - Perubahan data (harga, deskripsi, fasilitas, foto baru) langsung tampil di halaman detail pencari properti tanpa perlu menunggu persetujuan admin dari awal lagi.
  - Jika listing yang diedit masih berstatus `'draft'` atau sedang revisi, statusnya tetap `'draft'` untuk ditinjau admin.
- **Pesan Umpan Balik Kontekstual di `KostFormMitra.tsx`**:
  - Menampilkan informasi yang jelas kepada mitra sesuai status listing:
    - *Edit Listing Tayang*: *"Perubahan berhasil disimpan! Data kost Anda telah langsung diperbarui pada listing publik."*
    - *Edit Listing Draft*: *"Perubahan draft berhasil disimpan! Menunggu peninjauan oleh tim admin RuangSinggah."*
    - *Publish Baru*: *"Pendaftaran kost berhasil diajukan! Listing baru Anda saat ini dalam tahap peninjauan (review) oleh tim RuangSinggah dan akan otomatis tayang setelah disetujui."*

---

## 3. Hasil Pengujian & Kompilasi

- **Uji Kompilasi TypeScript / Vite**:
  ```bash
  cmd /c npm run build
  ```
  **Hasil:**
  ```text
  ✓ 2509 modules transformed.
  ✓ built in 34.61s
  Exit code: 0 (0 error)
  ```

---

## 4. Panduan Pengujian untuk Pengguna / Mitra

1. **Uji Edit Listing Aktif (Published)**:
   - Buka **Dashboard Mitra** $\rightarrow$ Menu **Kost Saya**.
   - Pilih salah satu properti yang sudah tayang (*Aktif / Published*), lalu klik **Edit**.
   - Ubah harga, nama/deskripsi, atau tambahkan/ganti foto pada Step 5.
   - Klik **Simpan Perubahan** / **Publikasikan**.
   - **Hasil**: Muncul notifikasi bahwa data kost langsung ter-update di listing publik, dan saat halaman detail dibuka, seluruh foto tampil utuh tanpa ada yang broken link / hilang.

2. **Uji Pendaftaran Listing Baru**:
   - Klik **+ Daftarkan Kost Baru**.
   - Lengkapi seluruh langkah formulir hingga Step 5 dan submit.
   - **Hasil**: Listing masuk dengan status **⏳ Sedang Ditinjau (Draft)** menunggu persetujuan dari Super Admin.
