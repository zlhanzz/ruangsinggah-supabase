# IMPLEMENTATION PLAN: Perbaikan Alur Listing & Prioritas Foto Kamar Termahal Sebagai Cover Preview Properti

Dokumen ini berisi rencana komprehensif untuk memperbaiki penentuan foto sampul (*cover/preview*) properti pada alur listing Mitra Dashboard dan KostManager/Surveyor Portal.

---

## 1. Analisis Masalah & Kebutuhan

### A. Kondisi Saat Ini (Problem)
1. **Cover Properti Keliru (Menampilkan Bangunan Depan/Fasad)**:
   - Pada alur pendaftaran kost Mitra (`KostFormMitra.tsx`), logika pengurutan foto secara eksplisit memaksa kategori `'Bangunan Depan'` berada di urutan terdepan (`index 0`).
   - Pada alur pendaftaran KostManager / Surveyor (`KostManagerPropertyFormModal.tsx` & `AgentDashboard.tsx`), foto yang disimpan di `image_urls` didominasi oleh foto area publik (dimulai dari Bangunan Depan), sementara foto interior kamar disimpan terpisah di dalam array `room_types[i].images`.
   - Akibatnya, pada katalog pencarian publik, kartu properti (`KostCard`), dashboard mitra, dan simulasi preview mobile, foto pertama (`imageUrls[0]`) yang tampil sebagai representasi utama kost adalah tampak depan gedung luar/fasad, bukan kamar tidur.
2. **Kebutuhan Logika Multi Tipe Kamar**:
   - Calon penyewa mencari kost terutama berdasarkan kondisi dan kenyamanan interior kamar tidur.
   - Sesuai instruksi User, foto utama yang ditampilkan sebagai preview listing **HARUS Foto Kamar**.
   - Jika suatu properti memiliki lebih dari 1 tipe kamar (misal: Standard Rp 800rb, Deluxe Rp 1,5jt, VIP Rp 2,2jt), sistem **WAJIB memilih foto kamar dari tipe kamar dengan harga paling mahal (tertinggi)** sebagai cover utama (`imageUrls[0]`).

---

## 2. Dampak Perubahan (File yang Disentuh)

1. `functions/public/components/KostFormMitra.tsx`:
   - Penyesuaian logika penyusunan & pengurutan foto sebelum submit (`allImagesList` & `newPhotoItems`).
   - Implementasi helper pemilih foto kamar dari tipe kamar berharga tertinggi.
   - Pembaruan teks label & badge panduan di UI Step 4 Media (menunjukkan foto kamar termahal sebagai Cover Utama preview).

2. `functions/public/components/admin/KostManagerPropertyFormModal.tsx`:
   - Penyesuaian logika `handleDirectSave` agar menyatukan foto kamar dari tipe kamar berharga termahal ke urutan terdepan (`index 0`) pada array `image_urls`.
   - Penyesuaian tampilan simulasi mobile preview di Step 3 agar mencerminkan cover foto kamar termahal.

3. `functions/public/pages/AgentDashboard.tsx`:
   - Penyesuaian pembentukan payload `propertyPayload.image_urls` saat onboarding / survey KostManager disimpan, dengan memprioritaskan foto kamar dari tipe kamar termahal ke `index 0`.

4. `functions/public/adminService.ts`:
   - Integrasi helper pengurutan cover photo pada `addPropertyWithMedia` dan `updatePropertyWithMedia` agar memastikan integritas `image_urls[0]` selalu mengutamakan foto kamar termahal jika data kamar tersedia.

5. `functions/public/userService.ts`:
   - Pembaruan fungsi `transformPropertyRow` untuk menjamin konsistensi pengambilan `imageUrls[0]` pada saat properti dimuat dari database jika terdapat foto kamar pada `room_types`.

---

## 3. Langkah-Langkah Eksekusi (Secara Bertahap)

### Langkah 1: Pembuatan Helper Standar Penentu Foto Kamar Termahal
- Membuat fungsi utilitas `resolveListingPhotosWithRoomCover`:
  1. Menerima data daftar foto area publik dan daftar `roomTypes` (beserta foto masing-masing tipe kamar).
  2. Menemukan tipe kamar dengan harga tertinggi berdasarkan tarif bulanan efektif (`getRoomEffectivePrice` / `pricing.find(bulanan)` / `price`).
  3. Mengambil foto pertama dari tipe kamar termahal tersebut.
  4. Menyusun array gambar dengan urutan:
     - **Index 0**: Foto Utama Kamar Termahal (Cover Preview Utama).
     - **Index 1..n**: Foto-foto kamar lainnya dari seluruh tipe kamar.
     - **Index n+1..dst**: Foto-foto area publik (Bangunan Depan, Koridor, Area Parkir, Dapur Bersama, Fasilitas, dll.).
  5. *Fallback Graceful*: Jika tipe kamar termahal belum memiliki foto, ambil foto kamar dari tipe kamar lain yang memiliki foto. Jika belum ada foto kamar sama sekali, gunakan foto area umum yang tersedia.

### Langkah 2: Refactor Alur Form Listing Mitra (`KostFormMitra.tsx`)
- Mengganti logika pengurutan lama yang memprioritaskan `'Bangunan Depan'` dengan logika baru yang menaruh foto tipe kamar termahal di `index 0`.
- Memperbarui teks panduan di Step 4 Media agar Mitra memahami bahwa foto kamar terbaik/termahal akan menjadi cover utama listing di halaman pencarian.

### Langkah 3: Refactor Alur Listing KostManager (`KostManagerPropertyFormModal.tsx` & `AgentDashboard.tsx`)
- Memperbaiki pembentukan `image_urls` pada proses penyimpanan properti KostManager agar menggabungkan foto-foto kamar ke dalam `image_urls` dengan foto kamar tipe termahal di posisi terdepan.
- Memperbarui widget Mobile Simulator di Step 3 agar menampilkan foto kamar termahal sebagai cover.

### Langkah 4: Sinkronisasi di Backend Layer (`adminService.ts` & `userService.ts`)
- Memastikan `addPropertyWithMedia` dan `updatePropertyWithMedia` di `adminService.ts` menerapkan urutan foto yang benar sebelum insert/update ke tabel `properties`.
- Memastikan `transformPropertyRow` di `userService.ts` secara cerdas mengembalikan `imageUrls` dengan cover kamar termahal saat dibaca dari database.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi Build**:
   - Menjalankan `npm.cmd run build` di direktori `functions/public` untuk memastikan 0 error tipe TypeScript dan bundle lulus 100%.
2. **Verifikasi Skenario Listing Mitra**:
   - Tambah/edit kost dengan 1 tipe kamar -> pastikan foto kamar berada di cover `imageUrls[0]`.
   - Tambah/edit kost dengan multiple tipe kamar (misal: Tipe A @ Rp 1.000.000 dan Tipe B VIP @ Rp 2.500.000) -> pastikan foto kamar Tipe B VIP otomatis menjadi cover utama di `imageUrls[0]` dan muncul di katalog pencarian.
3. **Verifikasi Skenario KostManager**:
   - Pengisian properti di modal KostManager -> pastikan Step 3 Mobile Preview dan data tersimpan di database menempatkan foto kamar termahal di cover.

---

> [!IMPORTANT]
> **Menunggu Persetujuan**: Sesuai protokol siklus 2-fase pada `AGENTS.md` dan `GEMINI.md`, AI Agent berhenti di sini untuk meminta persetujuan / masukan dari User sebelum mengeksekusi modifikasi file kode.
