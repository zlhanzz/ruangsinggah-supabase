# IMPLEMENTATION PLAN: Standar Industri Deteksi Kategori Kaku (Koridor & Akses Masuk), Sensor Wajib Kategori Custom, dan Antrean Upload Terkontrol (*Controlled Concurrency Queue*)

## 1. Analisis Masalah & Kebutuhan

### A. Evaluasi Sistem Deteksi Kategori
1. **Kategori Baku Kaku (*Fixed Category Set*)**:
   - Sistem beralih dari kata kunci bebas ke **ID Kategori Baku & Kaku** (`'Bangunan Depan'`, `'Koridor'`, `'Area Parkir'`, `'Lingkungan'`).
   - Kategori **`Koridor & Akses Masuk`** (`id: 'Koridor'`) dijamin **100% PASTI dan KAKU** dipindai oleh sensor AI.
2. **Kategori Custom Buatan Mitra (*Custom Categories*)**:
   - Pengguna meminta: *"oh iyya pastikan juga kategori foto yang dibuat secara custom melewati proses sensor"*.
   - Setiap kategori tambahan yang dibuat secara fleksibel oleh mitra (seperti *Balkon*, *Rooftop*, *Pintu Masuk Samping*, *Area Bersantai*, dll.) **WAJIB 100% melewati proses auto-detector sensor banner**, karena area-area ini sering kali memuat spanduk nomor kontak/info sewa.
   - Hanya area interior kamar privat murni (`Kamar: ...` dan `Kamar Mandi: ...`) yang menggunakan jalur *Fast-Path Non-Banner*.

---

### B. Evaluasi Multi-Processing & Keamanan Arsitektur (Standar Industri)
1. **Masalah Upload Satu per Satu Kaku (`disabled=uploadingCategory`)**:
   - Tombol "+ Tambah Foto" saat ini dikunci (`disabled` dan `cursor-not-allowed`) selama proses upload berlangsung.
   - Mitra yang ingin mengunggah foto kedua di kategori yang sama atau kategori lain secara cepat terhalang atau memicu benturan status (*race condition* pada state tunggal `uploadingCategory`).
2. **Bahaya Multi-Processing Bebas Tanpa Batas (*Unbounded Parallel*)**:
   - Jika pengguna mengunggah 5-10 foto sekaligus tanpa batas paralel, HP mitra (RAM 3-4GB) berisiko crash (*canvas context lost* / tab reload) dan koneksi internet seluler tercekik.
3. **Penerapan Standar Industri (Pilihan C: Antrean Terkontrol / Non-Blocking Queue)**:
   - Sesuai standar industri platform kelas dunia (WhatsApp Web, Google Photos, Airbnb):
     - **UX Bebas**: Tombol upload **TIDAK DIKUNCI MATI**. Pengguna bebas mengunggah foto berkali-kali secara cepat di kategori mana pun.
     - **Pratinjau Instan (*Optimistic Preview*)**: Setiap foto yang baru dipilih langsung muncul seketika di kartu foto dengan loader `Sedang diproses...`.
     - **Worker Antrean di Latar Belakang (*Controlled Concurrency Limit = 2*)**: Sistem di latar belakang memproses maksimal 2 foto secara paralel (memastikan RAM HP aman dan koneksi stabil). Foto berikutnya mengantre secara otomatis dan diproses bergantian begitu slot sebelumnya selesai.
     - **Isolasi Mutlak (*Zero Contamination*)**: Setiap foto diikat dengan UUID unik (`crypto.randomUUID()`) dan `category` statis. Foto Koridor hanya akan pernah memperbarui slot Koridor, dan foto custom hanya memperbarui slot custom tersebut.

---

## 2. Rincian Teknis & Dampak Perubahan

File yang akan dimodifikasi:

1. **`functions/public/autoSensorService.ts`**:
   - Menetapkan himpunan kategori baku kaku:
     ```ts
     export const FIXED_BANNER_PRONE_CATEGORIES = new Set([
         'Bangunan Depan',
         'Koridor',
         'Area Parkir',
         'Lingkungan'
     ]);
     ```
   - Memperbarui fungsi deteksi:
     ```ts
     export function isBannerProneCategory(categoryName: string, isCustom = false): boolean
     ```
     - Jika `isCustom === true`, langsung kembalikan `true` (Wajib Sensor).
     - Jika ada di `FIXED_BANNER_PRONE_CATEGORIES`, langsung kembalikan `true`.
     - Ditambah fallback kata kunci untuk form admin/agen.

2. **`functions/public/adminService.ts`**:
   - Menyelaraskan fungsi `isBannerProneCategory` agar mencakup kategori kaku `'Koridor'`, `'Bangunan Depan'`, `'Area Parkir'`, `'Lingkungan'`, serta deteksi custom.

3. **`functions/public/components/KostFormMitra.tsx`**:
   - **ID Generator Global**: Menggunakan `crypto.randomUUID()` untuk menjamin 0 benturan ID antar thread upload.
   - **Membuka Kunci Tombol Unggah**: Menghapus atribut `disabled={uploadingCategory === cat.id}` dan class `cursor-not-allowed opacity-60`. Tombol "+ Tambah Foto" selalu responsif menerima foto baru.
   - **Reset Input File Otomatis**: Menambahkan `e.target.value = ''` seketika saat event `onChange` terpicu agar memilih foto yang sama atau foto baru berturut-turut selalu terdeteksi oleh browser.
   - **Integrasi Sensor Kategori Custom**: Menyertakan flag/pengecekan `customCategories.includes(category)` ke dalam pipeline pemrosesan foto, sehingga **seluruh kategori custom otomatis disensor AI**.
   - **Engine Antrean Terkontrol (*Concurrency Queue Worker Limit = 2*)**:
     - Mengimplementasikan worker antrean dengan batas konkurensi 2 proses paralel.
     - Setiap item foto mengikat kategori miliknya sendiri secara *immutable* di dalam payload.
     - Pembaruan state `newPhotoItems` murni menggunakan `prev => prev.map(...)` terarah berdasarkan `p.id === item.id`.
   - **Pembersihan Bersih (*Garbage Collection*)**: Jika pengguna menghapus foto saat proses upload Supabase Storage masih berjalan di latar belakang, file draft dibatalkan dan dihapus dari storage.

4. **`functions/PROGRESS.md`**:
   - Pencatatan progres Entri #273.

5. **`WALKTHROUGH.md`**:
   - Dokumentasi lengkap hasil pengujian dan panduan uji multi-processing serta sensor kategori custom.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 setelah di-ACC)

1. **Langkah 1: Terapkan Validasi Kategori Kaku & Custom di `autoSensorService.ts` & `adminService.ts`**
   - Tetapkan `FIXED_BANNER_PRONE_CATEGORIES` dengan `'Koridor'`, `'Bangunan Depan'`, `'Area Parkir'`, `'Lingkungan'`.
   - Pastikan kategori custom selalu menghasilkan `true` untuk sensor AI.
2. **Langkah 2: Terapkan Antrean Terkontrol & Hapus Locking di `KostFormMitra.tsx`**
   - Hapus pembatas `uploadingCategory` yang mengunci tombol input.
   - Bangun pipeline antrean `enqueuePhotoProcessing` dengan batas konkurensi 2 proses paralel.
   - Gunakan `crypto.randomUUID()` untuk ID unik tiap foto.
   - Terapkan pembaruan state murni terisolasi per ID.
   - Pastikan kategori custom memicu pemindaian banner AI.
3. **Langkah 3: Uji Kompilasi & Build**
   - Jalankan `npm --prefix functions/public run build` memastikan 0 error kompilasi TypeScript dan Vite.
4. **Langkah 4: Dokumentasi & Git Push**
   - Catat riwayat ke `functions/PROGRESS.md`.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Uji Sensor Koridor & Kategori Custom**:
  - Mengunggah foto spanduk pada kategori **Koridor & Akses Masuk**. Memastikan sistem otomatis menjalankan AI Vision scan dan menyamarkan nomor kontak dengan stempel `ruangsinggah.id`.
  - Membuat kategori custom baru (misal: "Balkon Luar" atau "Pintu Belakang") dan mengunggah foto spanduk. Memastikan sistem otomatis menjalankan AI Vision scan dan menyamarkan nomor kontak.
- **Uji Kecepatan Multi-Processing & Isolasi**:
  - Mengunggah 1 foto di kategori Koridor, lalu tanpa menunggu selesai, langsung mengunggah foto kedua di Koridor, dan foto ketiga di kategori Custom atau Bangunan Depan.
  - Memverifikasi ketiga foto tampil seketika di kartu masing-masing dengan loader.
  - Memverifikasi sistem memprosesnya secara bergantian (2 paralel) tanpa membuat browser lambat.
  - Memverifikasi masing-masing foto tetap berada di kategorinya sendiri tanpa tertukar (*zero contamination*).
- **Uji Build**:
  - `npm --prefix functions/public run build` lulus 100% (exit code 0).
