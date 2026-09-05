# WALKTHROUGH: Perbaikan Alur Listing & Prioritas Foto Kamar Termahal Sebagai Cover Preview Properti

Dokumen ini merangkum seluruh perubahan kode, hasil verifikasi, dan panduan pengujian terkait penataan foto sampul (*cover preview*) properti agar menampilkan foto kamar dari tipe kamar berharga termahal.

---

## 1. Daftar Perubahan

### A. Mitra Dashboard Form Listing (`KostFormMitra.tsx`)
1. **Penghapusan Prioritas Bangunan Depan**:
   - Menghapus aturan lama yang memposisikan kategori `'Bangunan Depan'` secara paksa di urutan pertama (`index 0`).
2. **Logika Sorting Berdasarkan Tipe Kamar Termahal**:
   - Menghitung tarif sewa bulanan tertinggi di antara seluruh tipe kamar (`form.roomTypes`).
   - Menerapkan fungsi *scoring* prioritas foto:
     - **Skor 10**: Foto interior kamar dari tipe kamar termahal (`Kamar: [Nama Tipe Termahal]`) $\rightarrow$ Ditempatkan di **Index 0 (Cover Utama)**.
     - **Skor 15**: Foto fasilitas kamar (KM Dalam / Dapur Dalam) tipe kamar termahal.
     - **Skor 20+**: Foto-foto kamar dari tipe kamar berikutnya (berurutan dari harga tertinggi ke terendah).
     - **Skor 100+**: Foto area publik (Bangunan Depan, Koridor, Area Parkir, Dapur Bersama, Fasilitas Lainnya).
3. **Peningkatan Antarmuka (UI) Step 4 Media**:
   - Menambahkan badge visual eksklusif: `⭐ Cover Utama (Kamar Termahal)` pada kategori kamar berharga tertinggi.
   - Menampilkan badge `Cover Utama` di sudut kiri atas thumbnail foto kamar termahal pertama.
   - Memperbarui teks peringatan di bagian atas formulir: *"Foto kamar dari tipe kamar berharga termahal akan otomatis dijadikan Foto Cover Utama pada preview pencarian."*

---

### B. KostManager & Surveyor Portal (`KostManagerPropertyFormModal.tsx` & `AgentDashboard.tsx`)
1. **Penyusunan `image_urls` Terpadu**:
   - Saat menyimpan listing properti kelolaan KostManager, sistem secara otomatis mengekstrak foto-foto kamar dari seluruh unit kamar, mengurutkannya berdasarkan tarif bulanan kamar tertinggi, dan menaruhnya di urutan terdepan (`index 0..n`) sebelum foto-foto area umum.
2. **Widget Simulasi Tampilan Mobile (Step 3)**:
   - Memperbarui logika render cover simulasi preview smartphone agar langsung menampilkan foto kamar tidur dari unit termahal.

---

### C. Backend Layer & Data Transformer (`adminService.ts` & `userService.ts`)
1. **Helper `sortPropertyImagesWithRoomCover` (`adminService.ts`)**:
   - Mengintegrasikan pengurutan gambar otomatis pada fungsi `addPropertyWithMedia` dan `updatePropertyWithMedia` sehingga data `image_urls` yang tersimpan di PostgreSQL Supabase selalu terurut dengan benar.
2. **Normalisasi Cerdas `transformPropertyRow` (`userService.ts`)**:
   - Memastikan saat data dibaca dari database, array `imageUrls` secara cerdas mengedepankan foto kamar dari tipe kamar berharga termahal ke `imageUrls[0]`, sehingga seluruh kartu listing pencarian publik (`KostCard`), katalog pencarian, dan dashboard mitra langsung menampilkan foto kamar tidur terbaik.

---

## 2. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi TypeScript & Vite Bundle
```bash
npm run build
```
- **Hasil**: **Lulus 100% (Exit code 0)**
- **Waktu Build**: 46.32 detik
- **Status Modul**: 2.511 modul ter-bundle dengan sempurna tanpa ada error tipe ataupun syntax.

---

## 3. Panduan Pengujian untuk Pengguna

1. **Pengujian Listing Mitra**:
   - Masuk ke **Dashboard Mitra** $\rightarrow$ Tambah Kost Baru atau Edit Kost.
   - Buat minimal 2 tipe kamar (misal: *Kamar Standard* @ Rp 800.000 dan *Kamar VIP* @ Rp 2.000.000).
   - Masuk ke **Langkah 5 (Dokumentasi Foto)**.
   - Perhatikan bahwa kategori **"Kamar: Kamar VIP"** memiliki badge `⭐ Cover Utama (Kamar Termahal)`.
   - Unggah foto pada kamar VIP dan foto tampak gedung/fasad depan.
   - Simpan / Publikasikan properti.
   - Buka halaman katalog pencarian (`/listings`) atau Dashboard Mitra: Properti Anda akan menampilkan foto kamar VIP sebagai cover utama!

2. **Pengujian KostManager / Admin**:
   - Buka portal **KostManager** $\rightarrow$ Tambah/Edit Properti.
   - Lengkapi unit kamar di Step 2 dengan foto kamar masing-masing tipe.
   - Lanjut ke Step 3 (Review): Perhatikan bahwa frame simulasi mobile simulator menampilkan foto kamar termahal sebagai gambar sampul.
