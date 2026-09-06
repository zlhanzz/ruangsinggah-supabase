# WALKTHROUGH - Perbaikan Kestabilan Draf Form Pendataan KostManager: Eliminasi Destructive Re-merge Fasilitas & Pemulihan Foto Survei saat Modal Ditutup / Refresh

**Tanggal**: September 2026  
**Status**: Selesai & Lulus Verifikasi Build (`0 Error`)  
**Branch Git**: `bukan-productions`

---

## 📌 Ringkasan Masalah & Pertanyaan Pengguna

Pengguna menanyakan:
> *"kenapa setiap kali form nya ke close dan terjadi refresh, foto pendataan yang sebelumnnya telah dilakukan terhapus, termasuk perubahan yang sudah dilakukan sebelumnnya entah itu di fasilitas dll tereset dan kembali ke settingan awal saat pertama kali pesanan pendataan survey ini diterima oleh agen. apakah sistem draft berbasis database kita tidak bekerja? kenapa hal ini bisa terjadi?"*

---

## 🔍 Akar Masalah Mengapa Hal Ini Terjadi

1. **Sistem Draf Database Sebenarnya Bekerja, Namun Tertimpa Kembali (*Destructive Re-Merging*)**:
   - Draf sebenarnya berhasil tersimpan di tabel `survey_requests.evaluation_summary.draft_data`.
   - Namun, saat modal dibuka kembali (`openKostManagerListing`), kode sebelumnya melakukan penggabungan *Set Union* yang agresif:
     ```ts
     const combinedSourceFacs = Array.from(new Set([
         ...(Array.isArray(parsed.kmListingForm?.facilities) ? parsed.kmListingForm.facilities : []),
         ...(Array.isArray(dbKmProp?.facilities) ? dbKmProp.facilities : []),
         ...(Array.isArray(dbPropertyRecord?.facilities) ? dbPropertyRecord.facilities : []),
         ...(Array.isArray(dbPropertyRecord?.metadata?.self_listing_facilities) ? dbPropertyRecord.metadata.self_listing_facilities : []),
         ...(Array.isArray(req.transaction?.metadata?.facilities) ? req.transaction.metadata.facilities : []),
         ...(Array.isArray((req as any).metadata?.facilities) ? (req as any).metadata.facilities : [])
     ]));
     ```
   - Akibatnya, setiap kali modal dibuka atau halaman di-refresh, fasilitas awal milik mitra dari `dbPropertyRecord` atau `transaction.metadata` dipaksa masuk kembali. Jika surveyor sebelumnya telah menghapus atau meng-uncheck fasilitas, pilihan tersebut langsung tertimpa dan ter-reset kembali ke setelan awal.

2. **Gagalnya Auto-Load Draf saat Refresh Karena Tipe Data UUID**:
   - Di hook `useEffect` pendeteksi parameter query browser `?onboarding_id=...`, terdapat kode:
     ```ts
     const reqId = parseInt(onboardingIdStr, 10);
     const found = surveyRequests.find(r => r.id === reqId);
     ```
   - Karena ID survei bertipe string UUID (misal: `'01f8e223-f8fd-43d2-bafa-ee0f00f8e202'`), pemanggilan `parseInt` menghasilkan `NaN`.
   - Perbandingan `r.id === NaN` selalu bernilai `false`, sehingga form survei gagal dimuat ulang secara otomatis dari URL saat terjadi browser refresh.

3. **Pembersihan Foto Survei yang Terlalu Agresif**:
   - Pada pembacaan galeri foto, terdapat filter validasi yang mengeliminasi foto jika URL tersebut cocok dengan foto mentah mitra. Jika surveyor menggunakan foto yang sudah tersimpan di draf, filter tersebut menganggapnya sebagai foto yang tidak valid dan menghilangkannya dari tampilan kartu upload.

4. **Ketiadaan Sinkronisasi Instan saat Tombol Tutup / Keluar Ditekan**:
   - Penutupan modal melalui tombol silang `(X)` atau footer `KELUAR` sebelumnya hanya mengandalkan debounce timer asinkron, sehingga perubahan detik-detik terakhir sebelum modal ditutup rentan tidak ter-commit ke database.

---

## 🛠️ Solusi & Perubahan yang Diterapkan

### 1. Prioritas Eksklusif Draf untuk Fasilitas & Sub-Fasilitas (`AgentDashboard.tsx`)
- Pada fungsi `openKostManagerListing`:
  - Jika draf database / local telah memiliki `parsed.kmListingForm.facilities` (bahkan jika berupa array kosong atau pilihan yang sudah diedit agen), sistem **HANYA** menggunakan data fasilitas draf tersebut.
  - Logika penggabungan union `Array.from(new Set([...dbPropertyRecord, ...transactionMetadata]))` dinonaktifkan jika draf valid sudah ada.
  - Fasilitas asli mitra hanya digunakan sebagai *initial seed* saat agen pertama kali membuka formulir pendataan untuk pesanan survei tersebut.

### 2. Penanganan String UUID Murni pada Auto-Load Refresh URL (`AgentDashboard.tsx`)
- Mengganti `parseInt(onboardingIdStr, 10)` dengan perbandingan string murni:
  ```ts
  const found = surveyRequests.find(r => String(r.id) === String(onboardingIdStr));
  ```
- Menambahkan *direct database fetch fallback* via Supabase Client jika array in-memory `surveyRequests` masih kosong saat browser selesai di-refresh, sehingga modal pendataan langsung terbuka kembali beserta seluruh datanya tanpa jeda.

### 3. Pemulihan Utuh Foto Survei Publik & Kamar
- Memastikan array foto publik (`kmListingForm.image_urls`) dan array foto tipe kamar (`roomTypes[].images`) dimuat kembali persis sesuai yang tersimpan di dalam draf.
- Mempertahankan label kategori foto dan sanitasi format objek `{ original, url, label }`.

### 4. Sinkronisasi Instan Ganda (Database + LocalStorage) saat Tutup Modal
- Saat agen menekan tombol **Keluar** di Step 1 atau tombol silang **(X)** di pojok kanan atas:
  - Draf langsung disimpan seketika ke `localStorage` (sebagai cadangan instan offline).
  - Draf langsung disimpan ke tabel `survey_requests.evaluation_summary.draft_data` di database Supabase via `saveKostManagerDraftToDatabase`.

---

## 🧪 Hasil Pengujian & Verifikasi

### 1. Uji Kompilasi Vite Frontend
- Perintah: `npm.cmd run build` pada direktori `functions/public`.
- Hasil: **LULUS 100% (0 error)**.
  ```bash
  vite v6.4.1 building for production...
  ✓ 2512 modules transformed.
  ✓ built in 42.38s
  ```

### 2. Skenario Pengujian User
1. Buka formulir pendataan KostManager dari pesanan survei agen (*ONBOARDING KOST - Survey Field App*).
2. Lakukan perubahan:
   - Uncheck fasilitas tertentu (misal: uncheck *Dapur Bersama* atau fasilitas umum lainnya).
   - Unggah foto pada salah satu kategori area (misal: Bangunan Depan / Fasad).
3. Tutup formulir dengan tombol **Keluar** atau tombol silang **(X)**.
4. Lakukan Refresh halaman browser (`F5` atau `Ctrl+R`).
5. Buka kembali formulir pendataan tersebut:
   - ✅ Fasilitas yang telah di-uncheck **tetap dalam keadaan uncheck** (tidak ter-reset ke setelan awal).
   - ✅ Foto yang telah diunggah **tetap ada** dan kartu area menampilkan jumlah foto yang benar (bukan 0 FOTO).
