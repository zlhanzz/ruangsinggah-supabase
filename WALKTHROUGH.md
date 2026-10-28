# WALKTHROUGH - Standar Industri Deteksi Kategori Kaku (Koridor & Akses Masuk), Sensor Wajib Kategori Custom, dan Antrean Upload Terkontrol (Controlled Concurrency Queue Limit = 2)

## 📌 Ringkasan Pekerjaan
Pekerjaan ini menyelesaikan permintaan untuk:
1. Menerapkan auto-detector banner secara kaku pada kategori **Koridor** (`id: 'Koridor'`, label `'Koridor & Akses Masuk'`).
2. Memastikan **seluruh kategori foto kustom buatan mitra** (`customCategories`) wajib melewati proses pemindaian AI Vision banner sensor.
3. Menerapkan arsitektur **Standar Industri: Antrean Terkontrol (*Controlled Concurrency Queue*, Limit = 2 Paralel)**:
   - Tombol upload tidak lagi di-disable (`disabled` dihapus). Mitra dapat mengklik dan mengunggah foto secepat mungkin lintas kategori.
   - Setiap foto diproses secara terisolasi penuh dengan ID unik kriptografis (`crypto.randomUUID()`) dan mutasi state atomik, menjamin **0 kontaminasi (*zero contamination*)** antar foto.
   - Konkurensi dibatasi maksimal 2 worker paralel di latar belakang untuk mencegah *browser context lost / out-of-memory* pada perangkat HP mitra (RAM 3–4GB) dan menjaga kestabilan bandwidth seluler.

---

## 🛠️ Daftar Perubahan Kode

### 1. [autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts)
- **Himpunan Kategori Baku Fasilitas Publik**:
  ```typescript
  export const FIXED_BANNER_PRONE_CATEGORIES = new Set([
      'Bangunan Depan',
      'Koridor',
      'Area Parkir',
      'Lingkungan'
  ]);
  ```
- **Penambahan Kata Kunci Sensor**:
  Menambahkan kata kunci `'koridor'`, `'akses masuk'`, `'lorong'`, `'gang'`, `'tangga'` ke `BANNER_PRONE_KEYWORDS`.
- **Fungsi `isBannerProneCategory(categoryName, isCustom = false)`**:
  - Jika `isCustom === true` -> **selalu `true`** (seluruh kategori kustom buatan mitra wajib disensor).
  - Jika cocok dengan `FIXED_BANNER_PRONE_CATEGORIES` -> **`true`** (termasuk `'Koridor'`).
  - Fast-path pengecualian interior kamar (`kamar:`, `kamar mandi:`, `dapur dalam:`) -> `false`.
  - Pencocokan variasi kata kunci -> `true`.
- **Penerusan Parameter `isCustom`**:
  Memperbarui `processPhotoWithAutoSensor` dan `processImageUrlWithAutoSensor` agar menerima parameter `isCustom` dan meneruskannya ke fungsi evaluasi.

### 2. [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)
- Menyelaraskan fungsi `isBannerProneCategory(category, isCustom = false)` di modul admin agar mengenali kategori baku `'Koridor'` dan kata kunci `'akses masuk'`, `'lorong'`, `'gang'`, `'tangga'`, dan `'pintu masuk'`.

### 3. [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)
- **Penghapusan Kunci Tombol Upload (`disabled`)**:
  - Menghapus pembatasan `disabled={uploadingCategory === cat.id}` dan styling `cursor-not-allowed opacity-60` pada tombol `+ Tambah Foto` di seluruh kategori fasilitas umum dan tipe kamar.
  - Mitra dapat bebas mengunggah foto tambahan kapan saja tanpa harus menunggu foto sebelumnya selesai.
- **Generator ID Kriptografis Unik**:
  ```typescript
  const generateUniquePhotoId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
      }
      return `rs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.random().toString(36).substring(2, 9)}`;
  };
  ```
- **Controlled Concurrency Queue Runner (Limit = 2 Paralel)**:
  - Menggunakan `activeUploadsCountRef` dan `uploadTaskQueueRef`.
  - Jika ada tugas baru masuk saat 2 worker sedang aktif, tugas otomatis mengantre secara tertib (*FIFO queue*). Begitu salah satu selesai, antrean berikutnya langsung diproses otomatis.
- **Isolasi Mutlak (*Zero Contamination*)**:
  - Target kategori dan status custom diikat secara leksikal:
    ```typescript
    const isCustom = customCategories.includes(category);
    const targetCategory = category;
    ```
  - Mutasi state menggunakan callback atomik `setNewPhotoItems(prev => prev.map(p => p.id === item.id ? { ...p, ... } : p))` sehingga pembaruan status foto tidak pernah menimpa foto lain.
- **Garbage Collection Storage**:
  - Jika pengguna menghapus kartu foto saat upload cloud masih berlangsung, file di storage otomatis dibersihkan lewat `deleteDraftPhotosFromStorage`.
- **Pembaruan Re-Scan Manual**:
  - Tombol perisai re-scan dan fungsi `handleReScanBanner` kini menyertakan pemeriksaan `customCategories.includes(cat.id)`.

---

## 🧪 Hasil Pengujian & Kompilasi

### 1. Kompilasi Build Frontend (`functions/public`)
- Perintah: `cmd.exe /c "npm --prefix functions/public run build"`
- Status: **LULUS (Exit Code 0)**
- Waktu Build: **26.39s**
- Modul Ditransformasi: **2.512 modul**
- Error: **0 Error, 0 Warning Kritis**

### 2. Kompilasi Backend Functions (`functions`)
- Perintah: `cmd.exe /c "npm --prefix functions run build"`
- Status: **LULUS (Exit Code 0)**
- Hasil: `tsc` selesai tanpa error.

---

## 📱 Panduan Pengujian untuk Pengguna (User Testing Guide)

1. **Buka Formulir Tambah/Edit Kost Mitra**:
   - Masuk ke dashboard mitra dan buka modal Formulir Kost Mitra (Langkah 5: Foto Kost).
2. **Uji Kategori Koridor & Akses Masuk**:
   - Pilih kategori **"Koridor & Akses Masuk"**.
   - Unggah foto koridor atau lorong yang memiliki stiker/spanduk nomor telepon.
   - Amati: Foto langsung muncul dengan indikator overlay `"Sedang diproses..."` dan dalam 1-2 detik bagian spanduk tersamarkan otomatis dengan stempel `ruangsinggah.id`.
3. **Uji Kategori Kustom Mitra**:
   - Buat kategori baru secara kustom (misal: "Balkon Atas", "Gazebo Santai", dll.).
   - Unggah foto dengan spanduk kontak di kategori kustom tersebut.
   - Amati: Sistem otomatis memindai dan menyensor spanduk karena semua kategori kustom kini diwajibkan melewati AI Vision sensor.
4. **Uji Kecepatan Multi-Upload (Rapid Fast Upload)**:
   - Klik tombol `+ Tambah Foto` di kategori Bangunan Depan, lalu **langsung seketika** klik `+ Tambah Foto` di kategori Koridor atau Kamar tanpa menunggu.
   - Tombol `+ Tambah Foto` tidak terkunci (tidak *disabled*).
   - Seluruh kartu foto langsung muncul di kategorinya masing-masing tanpa ada foto yang tertukar atau tercampur (*zero contamination*).
   - Antrean diproses maksimal 2 secara paralel di background secara mulus tanpa membuat browser macet.
