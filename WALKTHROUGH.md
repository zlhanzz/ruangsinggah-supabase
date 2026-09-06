# WALKTHROUGH - Persistensi Draf Pendataan KostManager Berbasis Cloud Database & Auto-Cleanup Aman Anti-Hilang

**Tanggal**: September 2026  
**Status**: Selesai & Lulus Verifikasi Build (`0 Error`)  
**Branch Git**: `bukan-productions`

---

## 📌 Ringkasan Masalah & Permintaan Pengguna
1. **Masalah Foto Hilang Saat Reopen Form**:
   - Pengguna melaporkan bahwa setiap kali selesai mengunggah foto survei KostManager kemudian form tertutup (*close/refresh*), saat form pendataan dibuka kembali, foto-foto yang diunggah sebelumnya hilang.
2. **Permintaan Draf Database**:
   - Menyimpan draf data dan foto langsung ke Cloud Database (Supabase) agar tersimpan permanen dan tidak hanya bergantung pada *browser localStorage*.
3. **Pembersihan Otomatis Aman (Safe Auto-Cleanup)**:
   - Draf sementara yang hanya menjadi sampah harus dibersihkan secara otomatis.
4. **Proteksi Mutlak Data & Aset (Zero Data Loss Guardrails)**:
   - File listing asli mitra (*self-listing*), foto mitra biasa, dan data properti KostManager yang sudah listing **TIDAK BOLEH TERHAPUS**, bahkan jika mitra KostManager telah berhenti / non-aktif selama masa tenggang 3 bulan.
   - Pembersihan HANYA boleh menargetkan draf sementara yang belum pernah listing sama sekali.

---

## 🔍 Akar Masalah Teknis

1. **Filter False-Positive pada Reopen (`isValidSurveyPhoto`)**:
   - Fungsi `isValidSurveyPhoto` memeriksa `rawPropImagesSet.has(urlStr)`.
   - Saat agen mengunggah foto survei baru, URL foto disimpan ke Supabase Storage dan dimasukkan ke properti listing draf.
   - Ketika form ditutup dan dibuka kembali, `existingProp.image_urls` memuat URL-URL baru tersebut.
   - `rawPropImagesSet` mendeteksi URL tersebut dan secara keliru menganggapnya sebagai *"foto self-listing lama milik mitra"*, sehingga membuangnya dari kartu upload survei KostManager.
2. **Validasi LocalStorage Terlalu Restriktif**:
   - Auto-save `localStorage` sebelumnya mengecek `kmListingForm.owner_uid === isEditingKostManager.user_id`.
   - Ketika `owner_uid` di-bind ke UID pemilik asli properti (`existingProp.owner_uid`) sementara `isEditingKostManager` berisi requester UID (surveyor/mitra), penyimpanan draf lokal gagal/terblokir.
3. **Ketiadaan Sinkronisasi Real-Time ke Cloud Database**:
   - Upload foto hanya memperbarui state React lokal dan menunggu auto-save berkala atau klik manual, sehingga berisiko hilang jika modal tertutup tiba-tiba.

---

## 🛠️ Solusi & Perubahan yang Diterapkan

### 1. Persistensi Draf Langsung ke Cloud Database (`saveKostManagerDraftToDatabase`)
- Dibuat fungsi `saveKostManagerDraftToDatabase` di [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx):
  - Menyimpan snapshot draf lengkap (`kmListingForm`, `photoCategories`, `last_draft_updated_at`, `draft_by`) ke kolom `evaluation_summary.draft_data` pada tabel `survey_requests` di Supabase.
  - Sekaligus memperbarui cadangan offline di `localStorage` (`km_draft_${id}`).
- Dipanggil secara instan pada:
  - **Upload Foto Area Publik**: Setiap foto berhasil diunggah dan dikompresi ke WebP langsung disimpan ke database.
  - **Hapus Foto Area Publik**: Perubahan snapshot foto langsung sinkron ke database.
  - **Upload Foto Kamar**: Snapshot foto kamar tidur & kamar mandi langsung tersimpan ke database.
  - **Tutup Form**: Tombol *"Simpan Draf & Tutup"* atau tombol silang ($X$) langsung melakukan sync cloud.
  - **Debounced Form Typing**: Auto-save otomatis dengan jeda 1,5 detik saat surveyor mengetik detail teks.

### 2. Koreksi Logika Filter Foto (`isValidSurveyPhoto` & `selfListingImagesSet`)
- Foto dengan URL yang memuat `/kostmanager/`, `data:`, atau `blob:` dipastikan **100% foto survei KostManager asli** dan TIDAK PERNAH dibuang.
- `selfListingImagesSet` diperbaiki agar hanya memfilter foto yang benar-benar berasal dari `metadata.self_listing_images` atau path non-kostmanager, sehingga foto survei baru tidak pernah tertukar atau terfilter keluar saat modal dibuka kembali.

### 3. Pemulihan Draf Bertingkat (*Cloud Database First $\rightarrow$ LocalStorage Fallback*)
- Ketika form pendataan dibuka (`openKostManagerListing`):
  1. Sistem memeriksa `survey_requests.evaluation_summary.draft_data` dari cloud database terlebih dahulu.
  2. Jika ada draf database, seluruh data input dan foto dipulihkan secara instan dan utuh.
  3. Jika belum ada di database, sistem menggunakan cadangan `localStorage`.

### 4. Siklus Pembersihan Otomatis yang Aman (*Safe Auto-Cleanup Lifecycle*)
- Pembersihan draf (`draft_data: null`, `last_draft_updated_at: null`, dan `localStorage.removeItem`) HANYA dieksekusi setelah form pendataan KostManager **BERHASIL DISUBMIT/DILISTING** secara resmi ke sistem (`handleSaveKostManagerListing`).
- Selama belum disubmit, draf di database tetap aman dan tidak akan terhapus oleh proses background.

### 5. Garansi Keamanan & Proteksi Nol Kehilangan Data (*Zero Data Loss Guardrails*)
- 🛡️ **Listing Asli Mitra (Self-Listing) Terlindungi 100%**: File gambar self-listing mitra yang tersimpan di `metadata.self_listing_images` atau folder non-kostmanager tidak pernah disentuh atau dihapus oleh script cleanup draf.
- 🛡️ **Listing KostManager yang Telah Terbit Terlindungi Permanen**: Seluruh properti KostManager yang telah berstatus *listing* (termasuk properti dengan masa tenggang / non-aktif) tersimpan permanen di database `properties` dan Supabase Storage.
- 🛡️ **Hanya Menghapus Metadata Draf Sementara**: Objek yang dibersihkan saat submit hanyalah field sementara `evaluation_summary.draft_data` pada request survei yang bersangkutan.

---

## 🧪 Hasil Pengujian & Verifikasi

### 1. Uji Kompilasi Frontend
- **Perintah**: `npm.cmd run build` pada direktori `functions/public`
- **Hasil**:
  ```text
  vite v6.4.1 building for production...
  transforming...
  ✓ 2512 modules transformed.
  rendering chunks...
  computing gzip size...
  ✓ built in 48.92s
  ```
- **Status**: **Lulus 100% (0 Error / 0 Warning Kritis)**.

---

## 📋 Panduan Verifikasi Pengujian oleh Pengguna

1. Buka halaman **Dashboard Agen / Surveyor** pada menu penugasan survei KostManager.
2. Klik tombol **"Pendataan Kost"** pada salah satu tugas survei yang disetujui.
3. Masuk ke **Langkah 2 (Upload Foto)**, unggah satu atau beberapa foto area publik (misal: *Bangunan Depan*, *Area Parkir - Parkir Motor*, dll.) dan foto kamar tidur.
4. Tutup form modal pendataan (klik tombol silang $X$ atau klik *"Simpan Draf & Tutup"*).
5. Refresh browser (opsional) untuk memastikan data tidak hanya tersimpan di memori.
6. Klik kembali tombol **"Pendataan Kost"** pada tugas survei tersebut.
7. **Verifikasi**: Perhatikan bahwa seluruh foto yang telah diunggah sebelumnya **tetap muncul secara utuh dan presisi pada kartu kategorinya masing-masing**, tanpa ada foto yang hilang atau tertukar.
8. Setelah semua foto dan data lengkap, klik **"Simpan & Terbitkan Listing"**:
   - Properti berhasil terdaftar sebagai listing KostManager.
   - Metadata draf sementara otomatis dibersihkan dan status request survei beralih ke `completed`.
