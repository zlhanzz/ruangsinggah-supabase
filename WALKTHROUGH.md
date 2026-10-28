# WALKTHROUGH - Pemisahan Kategori Kustom Fasilitas Umum Properti dan Sub-Kategori Khusus Tipe Kamar Sesuai Standar Industri

## 📌 Ringkasan Pekerjaan
Pekerjaan ini menyelesaikan permintaan untuk:
1. **Memisahkan Kategori Kustom** pada formulir pendaftaran/edit kost mitra (Langkah 5: Foto Properti & Kamar):
   - Kategori kustom untuk **Fasilitas Umum / Area Properti** (contoh: *Rooftop, Kolam Renang, Balkon Bersama, Taman, Gazebo, Gym*, dll.).
   - Sub-kategori kustom **khusus untuk setiap Tipe Kamar** yang ditambahkan di Langkah 3 (contoh: *Meja Belajar, Lemari Pakaian, Balkon Kamar, Jendela*, dll.) yang menjadi sub-kategori terikat dari unit tipe kamar tersebut.
2. **Audit & Penyelarasan dengan Standar Industri (Airbnb, Booking.com, Mamikos)**:
   - Pemisahan hierarki tingkat properti (*property-level spaces*) vs tingkat unit (*unit/room-level spaces*).
   - *Auto-pruning* dan tombol hapus (`×`): Kategori kustom yang tidak memiliki foto tidak boleh memblokir pengiriman formulir (*anti form-stuck*). Hanya kategori pokok berstatus `required: true` (**Bangunan Depan** dan **Kamar Tidur Utama**) yang wajib diisi.
   - *Cascade grouping*: Relasi sub-kategori kamar diikat langsung ke unit tipe kamar.
   - Seluruh kategori kustom (baik umum maupun kamar) **wajib melewati proses AI Vision auto-detector banner (`isCustom: true`)**.

---

## 🛠️ Daftar Perubahan Kode

### 1. [autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts) & [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)
- **Deteksi Banner pada Sub-Kategori Kamar Kustom**:
  Format identifier sub-kategori kamar adalah `Kamar: [roomName] - [subCat]` (contoh: `Kamar: Deluxe A - Meja Belajar`).
  Fungsi `isBannerProneCategory` diperbarui agar otomatis memindai AI Vision jika kategori memiliki penanda kustom atau tanda pemisah sub-kategori:
  ```typescript
  export const isBannerProneCategory = (categoryName: string, isCustom = false): boolean => {
      if (!categoryName) return false;
      const trimmed = categoryName.trim();
      
      // Kategori custom buatan mitra atau sub-kategori kamar wajib selalu disensor
      if (isCustom || trimmed.includes(' - ')) return true;
      ...
  ```
- **Null Safety & Urutan Evaluasi**:
  Memastikan `trimmed` dideklarasikan setelah validasi null check awal untuk mencegah potensi `ReferenceError`.

---

### 2. [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)
- **Ekstensi Antarmuka `PublicPhotoCategoryDef`**:
  ```typescript
  export interface PublicPhotoCategoryDef {
      id: string;
      label: string;
      icon: any;
      required: boolean;
      description: string;
      isRoom?: boolean;
      roomName?: string;
      isCustom?: boolean;
      subCategoryName?: string;
  }
  ```
- **Fungsi Dinamis `computeActivePhotoCategories`**:
  - Menerima parameter `userCustomRoomCats: Record<string, string[]> = {}`.
  - Menghasilkan daftar kategori fasilitas umum (standar + kustom umum).
  - Menghasilkan daftar kamar tidur utama untuk setiap tipe kamar yang ada di formulir (`Kamar: ${roomName}`).
  - Menghasilkan sub-kategori kustom spesifik untuk masing-masing tipe kamar:
    - ID: `Kamar: ${roomName} - ${subCat}`
    - Label: `${subCat} (${roomName})`
    - `isRoom: true`, `isCustom: true`, `subCategoryName: subCat`
    - `required: false` (opsional, anti *form-stuck*).
- **State & Manajemen Kategori Kustom**:
  - `customRoomCategories: Record<string, string[]>`: Menyimpan relasi `{ [roomName]: string[] }`.
  - `roomSubCategoryInputs: Record<string, string>`: Mengelola text input per-kamar saat mitra mengetik nama sub-kategori baru.
  - Inisialisasi draft dari `localStorage` dan objek `editingKost`.
  - `saveDraftDirect`: Menyimpan referensi `customCategoriesRef` dan `customRoomCategoriesRef`.
- **Handler Penambahan & Penghapusan Terpisah**:
  - `handleAddGeneralCategory(name)`: Menambahkan kategori fasilitas umum kustom.
  - `handleRemoveGeneralCategory(catName)`: Menghapus kategori umum kustom + membersihkan foto terkait dari state dan storage.
  - `handleAddRoomSubCategory(roomName)`: Menambahkan sub-kategori khusus kamar tertentu.
  - `handleRemoveRoomSubCategory(roomName, subCatName)`: Menghapus sub-kategori kamar + membersihkan foto kamar terkait dari state dan storage.
- **Penyelarasan Validasi Langkah 5 (`validateCurrentStep`)**:
  - Hanya mewajibkan kategori yang berstatus `cat.required === true` (yaitu **Bangunan Depan** dan **Kamar Tidur Utama**).
  - Kategori kustom umum maupun sub-kategori kamar yang belum sempat diunggah fotonya diabaikan (*auto-pruned*), sehingga mitra tidak mengalami bug *form-stuck*.
- **Pembaruan Layout UI Langkah 5**:
  - **Section Fasilitas Umum**:
    - Kartu foto fasilitas umum standar dan kustom.
    - Tombol `×` merah elegan pada kartu kategori kustom untuk menghapus kategori secara instan.
    - Formulir mini `+ Kategori Umum` berada tepat di bawah daftar fasilitas umum dengan input teks dan tombol tambah.
  - **Section Tipe Kamar (Dipecah per Unit Kamar)**:
    - Mengelompokkan kartu foto per tipe kamar (`(form.roomTypes || []).map(...)`).
    - Menampilkan kartu Kamar Tidur Utama (Wajib).
    - Menampilkan kartu-kartu sub-kategori kustom milik kamar tersebut lengkap dengan tombol `×`.
    - Formulir mini `+ Sub-Kategori ${roomName}` di bawah masing-masing kamar untuk menambahkan ruang/sudut khusus (misal: Meja Kerja, Lemari, Balkon Pribadi).

---

## 🧪 Hasil Pengujian & Kompilasi

1. **Frontend Build (`npm --prefix functions/public run build`)**:
   - Status: **LULUS (Exit Code: 0)**
   - Waktu build: **41.05s**
   - Modul tertransformasi: **2512 modules**
   - Output asset Vite dihasilkan sempurna di `functions/public/dist` dan disinkronkan ke root `public/`.
2. **Backend Build (`npm --prefix functions run build`)**:
   - Status: **LULUS (Exit Code: 0)**
   - TypeScript compiler (`tsc`) berhasil tanpa error tipe data.

---

## 📋 Panduan Verifikasi Pengujian bagi Pengguna

1. **Buka Formulir Pendaftaran / Edit Kost Mitra**:
   - Masuk ke dashboard mitra dan buka formulir pendaftaran/edit kost.
2. **Isi Langkah 3 (Tipe Kamar)**:
   - Tambahkan setidaknya 1 atau 2 tipe kamar (misal: *Deluxe AC* dan *Standar Non-AC*).
3. **Buka Langkah 5 (Foto Properti & Kamar)**:
   - **Bagian Fasilitas Umum**:
     - Coba ketik nama fasilitas baru di input *Nama Fasilitas Umum Baru* (misal: `Rooftop Santai`) lalu klik **+ Kategori Umum**.
     - Perhatikan kartu baru `Rooftop Santai` muncul dengan badge kustom dan tombol `×`.
     - Coba klik tombol `×` untuk memastikan kategori dapat dihapus kembali.
   - **Bagian Tipe Kamar**:
     - Perhatikan setiap tipe kamar kini memiliki blok tersendiri.
     - Pada kamar *Deluxe AC*, ketik nama sub-kategori (misal: `Meja Belajar`) lalu klik **+ Sub-Kategori Deluxe AC**.
     - Kartu `Meja Belajar (Deluxe AC)` muncul di bawah kamar tersebut. Kategori ini terisolasi dan tidak muncul di tipe kamar lain.
4. **Uji Unggah Foto & Sensor**:
   - Unggah foto pada kategori kustom atau sub-kategori kamar.
   - Sistem akan memproses kompresi WebP, melakukan deteksi banner otomatis via AI Vision, dan menyimpan foto secara aman.
5. **Uji Validasi Form (Anti Form-Stuck)**:
   - Tambahkan sub-kategori kamar tanpa mengunggah foto ke dalamnya.
   - Klik tombol **Lanjut ke Langkah 6** atau **Simpan Draft**. Formulir dapat lanjut dengan mulus tanpa terblokir.
