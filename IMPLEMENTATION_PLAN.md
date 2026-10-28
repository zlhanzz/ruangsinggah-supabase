# IMPLEMENTATION PLAN: Kategori Kustom Fasilitas Umum & Sub-Kategori Khusus Setiap Tipe Kamar (Standar Industri)

## 1. Analisis Masalah & Kebutuhan

### Konteks & Masalah Saat Ini
1. Pada Langkah 5 (*Dokumentasi Foto Properti & Kamar*) di formulir mitra ([KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)), kotak input `+ KATEGORI` saat ini hanya berupa 1 kolom tunggal di bagian paling bawah halaman dengan placeholder umum (*"Tambah kategori foto lainnya (Cth: Rooftop, Kolam Renang, Balkon)..."*).
2. Ketika mitra menambahkan kategori kustom baru, kategori tersebut selalu diperlakukan secara datar (*flat*) sebagai area properti umum, dan tidak dapat dikhususkan untuk unit tipe kamar tertentu.
3. Kebutuhan Pengguna:
   - **Fasilitas Umum**: Input `+ KATEGORI` tetap tersedia untuk mendokumentasikan fasilitas umum/properti tambahan (contoh: *Rooftop, Kolam Renang, Balkon Bersama, Taman, Gazebo, Tempat Santai, Gym*, dll.).
   - **Khusus Setiap Tipe Kamar**: Setiap tipe kamar yang ditambahkan oleh mitra (contoh: *Tipe Standard, Tipe Deluxe, Tipe VIP*, dll.) memiliki kontrol mandiri untuk menambahkan **sub-kategori kustom khusus tipe kamar tersebut** (contoh: *Meja Belajar, Lemari Pakaian, Balkon Kamar, Jendela & Pemandangan, Ruang Kerja, Sudut Santai*, dll.).
   - Sub-kategori kamar ini harus tampil terikat rapi di bawah grup tipe kamar yang bersangkutan dan foto-foto yang diunggah ke dalamnya otomatis terasosiasi ke tipe kamar tersebut.
   - Sesuai standar industri dan aturan turn sebelumnya, seluruh kategori kustom (baik fasilitas umum maupun sub-kategori kamar) **wajib melewati proses AI Vision auto-detector banner (`isCustom: true`)**.

### Penyempurnaan Standar Industri (Audit Compliance)
1. **Pemisahan Tegas Tingkat Properti vs Tingkat Unit**:
   - Area Fasilitas Umum Properti dikelompokkan dalam container A.
   - Setiap Tipe Kamar dikelompokkan dalam container tersendiri yang memuat identitas tipe kamar, harga, foto kamar utama, KM dalam, dan sub-kategori kustom milik tipe kamar tersebut.
2. **Auto-Pruning & Tombol Hapus (`×`) (Pencegahan Form-Stuck)**:
   - Kategori kustom opsional yang belum ada fotonya tidak boleh mengunci (*blocking*) formulir saat validasi Langkah 5. Hanya kategori pokok bertanda `required: true` (**Bangunan Depan** dan **Kamar Tidur Utama**) yang wajib diisi minimal 1 foto.
   - Setiap kategori/sub-kategori kustom buatan mitra memiliki tombol hapus `×` di pojok kartu untuk membatalkan kategori yang tidak jadi digunakan.
   - Saat submit, kategori kustom kosong otomatis diabaikan (*auto-pruning*), sehingga database tetap bersih tanpa kategori yatim (*orphan categories*).
3. **Cascade Grouping & Persistence**:
   - Sub-kategori kamar diikat langsung ke nama/identitas tipe kamar (`customRoomCategories: Record<string, string[]>`).
   - Format identifier tersimpan: `Kamar: ${roomName} - ${subCat}` dengan label tampilan `${subCat} (${roomName})`.
   - Disimpan ke draft `localStorage` sehingga tahan reload/refresh halaman.

---

## 2. Dampak Perubahan File

- **File Utama yang Dimodifikasi**:
  1. [functions/public/components/KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx):
     - Memperbarui interface `PublicPhotoCategoryDef` dengan field pendukung: `isRoom?: boolean; roomName?: string; isCustom?: boolean; subCategoryName?: string;`.
     - Memisahkan state: `customCategories: string[]` (fasilitas umum) dan `customRoomCategories: Record<string, string[]>` (sub-kategori per tipe kamar).
     - Menambahkan state input teks per kamar: `roomSubCategoryInputs: Record<string, string>`.
     - Memperbarui helper `computeActivePhotoCategories` untuk menghasilkan sub-kategori kamar per unit tipe kamar.
     - Memperbarui validasi Langkah 5 (`validateCurrentStep(4)`) agar hanya memvalidasi `cat.required` (Bangunan Depan & Kamar Tidur Utama).
     - Memperbarui UI Langkah 5:
       - Section A: Menempatkan input `+ Kategori Umum` di bawah daftar fasilitas umum.
       - Section B: Mengelompokkan foto per tipe kamar dalam kartu container terpadu, dengan input `+ Sub-Kategori [Nama Kamar]` di setiap container kamar.
       - Menyematkan tombol hapus `×` pada kartu kategori kustom.
     - Menyimpan dan memuat `customCategories` dan `customRoomCategories` pada draft `localStorage`.
  2. [functions/public/autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts):
     - Memastikan `isBannerProneCategory` memproses sub-kategori kustom kamar sebagai `isCustom = true`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

### Langkah 1: Update Interface & State di `KostFormMitra.tsx`
- Tambahkan properti opsional di `PublicPhotoCategoryDef`: `isRoom?: boolean; roomName?: string; isCustom?: boolean; subCategoryName?: string;`.
- Deklarasikan `customRoomCategories` dan `roomSubCategoryInputs`.
- Tambahkan handler `handleAddGeneralCategory`, `handleRemoveGeneralCategory`, `handleAddRoomSubCategory`, dan `handleRemoveRoomSubCategory`.

### Langkah 2: Pembaruan `computeActivePhotoCategories` & Validasi
- Integrasikan `userCustomRoomCats: Record<string, string[]>` ke parameter `computeActivePhotoCategories`.
- Loop setiap `form.roomTypes` dan buat kategori baku (`required: true` untuk kamar tidur utama), KM dalam, Dapur dalam, dan sub-kategori kustom (`isCustom: true`).
- Perbaiki validasi `validateCurrentStep(4)`: hanya validasi kategori dengan `cat.required === true`.

### Langkah 3: Redesain UI Langkah 5 (Foto Properti & Kamar)
- Di akhir daftar Fasilitas Umum: Render input form `+ Kategori Fasilitas Umum`.
- Pada Section B (Tipe Kamar Dinamis): Loop setiap tipe kamar di `form.roomTypes`.
  - Tampilkan header Tipe Kamar yang elegan.
  - Tampilkan seluruh kartu kategori untuk kamar tersebut (Kamar Utama, KM Dalam, Dapur Dalam, dan Sub-kategori kustom).
  - Tampilkan tombol `×` pada kategori kustom.
  - Tampilkan mini input form `+ Sub-Kategori [Nama Kamar]` di bawah kartu kamar tersebut.

### Langkah 4: Sinkronisasi Draft & Submit
- Simpan `customCategories` dan `customRoomCategories` di `saveDraftDirect`.
- Muat kembali saat inisialisasi draft dari `localStorage`.
- Pastikan auto-pruning kategori kosong berjalan lancar saat submit.

### Langkah 5: Verifikasi Build & Git Push
- Jalankan kompilasi frontend `cmd.exe /c "npm --prefix functions/public run build"`.
- Catat riwayat ke `functions/PROGRESS.md` (entri #451).
- Perbarui dokumen `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.
