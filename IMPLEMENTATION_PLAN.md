# IMPLEMENTATION PLAN - Standarisasi Syarat Foto Minimum Sesuai Standar Industri & Penguncian Caption Pakem Berbasis Kausalitas Fasilitas

## 1. Analisis Kebutuhan & Masalah

### A. Masalah Syarat Kelulusan Foto (Wizard Step 5)
1. **Belum Ada Standarisasi Industri**: Calon penyewa sangat mementingkan kejelasan kondisi kamar mandi dalam dan total kualitas visual properti sebelum memutuskan untuk booking atau survei.
2. **Kamar Mandi Dalam Belum Wajib Foto**: Saat ini, jika tipe kamar memiliki *Kamar Mandi Dalam*, sistem belum mewajibkan fotonya. Padahal dalam industri properti sewa (Mamikos, Airbnb, Cove), kamar mandi dalam adalah faktor penentu nomor satu bagi calon penyewa.
3. **Ketiadaan Syarat Total Foto Minimum**: Saat ini listing secara teknis bisa lolos hanya dengan 2 foto (1 bangunan depan + 1 kamar). Listing dengan hanya 2 foto memiliki tingkat *trust* dan konversi booking yang sangat rendah di mata calon penyewa.
4. **Fasilitas Umum Perlu Rasional**: Fasilitas umum yang dicentang di Langkah 4 (seperti Dapur Bersama, Ruang Tamu, Parkir) tidak boleh memblokir pendaftaran secara kaku jika pemilik belum sempat memotret semuanya, namun harus tetap disediakan slotnya dengan status **"Dianjurkan"** untuk menjaga kelancaran pendaftaran (*prevent onboarding drop-off*).

### B. Masalah Pengeditan Caption Foto
1. **Inkonsistensi Kausalitas**: Setiap slot kategori foto muncul karena alasan kausalitas yang jelas (misal: slot *Dapur Bersama* muncul karena fasilitas Dapur Bersama dicentang di Langkah 4; slot *KM Dalam* muncul karena tipe kamar memiliki kamar mandi dalam).
2. **Resiko Perusakan Data oleh Mitra**: Tombol edit pensil (`<Edit3 />`) saat ini memungkinkan mitra mengubah caption foto menjadi teks acak yang tidak sesuai dengan wadah kategorinya, merusak sistem pencarian, filter galeri, dan lightbox tampilan detail kost.
3. **UI Berantakan & Beban Kognitif**: Keberadaan tombol edit caption pada setiap thumbnail foto menambah tombol yang tidak perlu dan membingungkan pengguna.

---

## 2. Solusi yang Direncanakan

### 1. Formulasi Syarat Foto Minimum (Standar Industri & Rasional)
- **Syarat Wajib Mutlak (*Required Categories*)**:
  1. **Minimal 1 Foto Bangunan Depan (Fasad)**: Wajib, untuk verifikasi fisik tampak luar gedung.
  2. **Minimal 1 Foto Kamar Tidur**: Wajib untuk **setiap Tipe Kamar** yang dibuat di Langkah 3.
  3. **Minimal 1 Foto Kamar Mandi Dalam**: Wajib untuk setiap tipe kamar yang memiliki fasilitas *Kamar Mandi Dalam*.
- **Syarat Total Foto Kumulatif Properti**:
  - Total foto di seluruh properti wajib **minimal 3 foto** kumulatif (standar minimal kualitas listing industri).
- **Slot Kategori Fasilitas Dinamis (Dapur Bersama, Ruang Tamu, Parkir, dll.)**:
  - Tetap otomatis muncul berdasarkan centangan fasilitas di Langkah 4, berstatus **"Dianjurkan"** (*Recommended*), tidak memblokir tombol Lanjut selama syarat pokok dan total minimal 3 foto sudah terpenuhi.
- **Indikator Visual & Validasi Ramah**:
  - Menampilkan ringkasan status di Langkah 5: checklist kategori wajib, badge "Dianjurkan", dan counter total foto (misal: *"Total Foto: 2 / 3 Minimum"*).
  - Pesan error spesifik jika belum memenuhi syarat saat tombol "Lanjut" diklik.

### 2. Penguncian Caption Foto Pakem (*Read-Only & Hard-Bound*)
- **Hapus Tombol Edit Caption Pensil (`<Edit3 />`)** pada seluruh thumbnail foto di grid.
- **Caption Otomatis Terkunci**: Setiap foto yang diunggah ke slot tertentu otomatis mengambil caption paten sesuai label kategori slot tersebut (`cat.label`).
- **Pembersihan State Modal Caption**: Menghapus modal edit caption pensil dari kode agar antarmuka menjadi bersih, ramping, dan modern.

---

## 3. Dampak Perubahan File

1. [functions/public/components/KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx):
   - Modifikasi `computeActivePhotoCategories`: set `required: true` pada `Kamar Mandi: ${roomName}` jika tipe kamar memiliki kamar mandi dalam.
   - Modifikasi validasi Step 4 di `validateCurrentStep`:
     - Validasi setiap kategori `required`.
     - Validasi total foto kumulatif $\ge 3$ foto.
   - Modifikasi render grid foto di Step 4:
     - Hapus tombol edit caption pensil `<Edit3 />`.
     - Pastikan caption otomatis paten mengikuti `cat.label`.
     - Tampilkan header panduan jumlah foto minimum dan badge status ("Wajib" vs "Dianjurkan").

---

## 4. Langkah-Langkah Eksekusi

### Langkah 1: Penyesuaian Metadata Kategori Foto & Status Wajib
- Pada `computeActivePhotoCategories`, jadikan slot `Kamar Mandi: ${roomName}` berstatus `required: true` jika `hasInsideBath` bernilai benar.

### Langkah 2: Peningkatan Logika Validasi Step 4 (`validateCurrentStep`)
- Periksa seluruh kategori dengan flag `required: true`.
- Periksa akumulasi total foto: `const totalPhotosCount = existingWithCats.length + newPhotoItems.length; if (totalPhotosCount < 3) return ...`.

### Langkah 3: Penguncian Caption & Pembersihan UI Thumbnail
- Hapus tombol pensil `<Edit3 />` pada mapping foto eksisting maupun foto baru.
- Hapus fungsi dan state `editingCaptionTarget` serta modal edit caption.
- Pasang caption paten otomatis saat file dipilih di `handleCategoryFilesUpload`.

### Langkah 4: Penambahan Indikator Visual Standar Kualitas Listing di UI
- Tampilkan box ringkasan syarat foto di bagian atas Langkah 5 dengan counter foto:
  - *Bangunan Depan: Wajib minimal 1 foto*
  - *Kamar Tidur: Wajib minimal 1 foto per tipe kamar*
  - *Kamar Mandi Dalam: Wajib minimal 1 foto (jika kamar mandi dalam)*
  - *Total Foto Keseluruhan: Minimal 3 foto (Saat ini: X foto)*

### Langkah 5: Kompilasi, Pengujian, Dokumentasi, & Git Push
- Uji kompilasi frontend (`npm --prefix functions/public run build`) dan backend (`npm --prefix functions run build`).
- Catat riwayat progres ke [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) (entri #455).
- Perbarui dokumen [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md).
- Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Validasi Tombol Lanjut**:
   - Jika Bangunan Depan kosong $\rightarrow$ Muncul pesan error spesifik dan tombol Lanjut tertahan.
   - Jika Kamar Tidur kosong $\rightarrow$ Muncul pesan error spesifik.
   - Jika tipe kamar memiliki Kamar Mandi Dalam dan fotonya kosong $\rightarrow$ Muncul pesan error spesifik.
   - Jika foto wajib di atas terpenuhi namun total foto baru 2 $\rightarrow$ Muncul pesan: *"Total foto properti saat ini baru 2 foto. Wajib minimal 3 foto secara keseluruhan untuk menjaga kualitas listing."*
   - Jika syarat di atas terpenuhi $\rightarrow$ Berhasil lanjut ke Langkah 6 (Peraturan Kost) dengan lancar.
2. **Uji Penguncian Caption**:
   - Thumbnail foto tidak menampilkan tombol pensil.
   - Caption foto otomatis tersimpan rapi sesuai nama kategori (misal: *"Dapur Bersama"*, *"Bangunan Depan"*).
3. **Uji Kelulusan Build**:
   - `npm run build` lulus 100% 0 error TypeScript.
