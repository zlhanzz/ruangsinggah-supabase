# IMPLEMENTATION PLAN: Penyederhanaan Header Foto & Penyembunyian Logika Internal Validasi dari Permukaan UI

## 1. Analisis Masalah & Kebutuhan

### A. Konteks & Masukan Pengguna
Pengguna mengamati card indikator kelayakan listing di header Langkah 5:
- *"menurut saya bagian ini tidak harus ada, lagi lagi ini adalah background logic atau backgroun prosess yang tidak harus muncul di permukaan"*
- Bagian tersebut menampilkan informasi internal:
  - "Syarat Kelayakan Listing: Lengkap & Siap Lanjut"
  - "Standar industri mewajibkan minimal 3 foto total..."
  - Checklist chips kategori wajib (`Bangunan Depan`, `Kamar: Standard`, `KM Dalam: Standard`)
  - "Caption foto terkunci secara otomatis..."
  - Counter `Total: 10 / 3 Foto Minimal`

### B. Evaluasi UX & Arsitektur Sistem
1. **Pemisahan Logika Bisnis (Background) vs Tampilan Pengguna (Surface UX)**:
   - Aturan validasi (Bangunan Depan wajib, Kamar wajib, KM Dalam wajib, dan minimal total 3 foto) adalah **background logic (business rule)** yang seharusnya bekerja di balik layar, bukan diekspos sebagai dashboard inspeksi yang membebani antarmuka pengguna.
   - Menggurui pengguna dengan teks justifikasi ("Standar industri mewajibkan...", "Caption terkunci otomatis...") justru menambah kebisingan visual (*visual noise*) dan mengaburkan esensi form pengunggahan foto.
2. **Desain Bersih & Elegan yang Lebih Tepat**:
   - Kembalikan header Langkah 5 ke bentuk ringkas, ramah, dan profesional:
     - Judul: **Dokumentasi Foto Properti & Kamar**
     - Deskripsi: *"Unggah foto properti dan kamar kost Anda untuk menarik minat calon penyewa."*
     - Counter sederhana: `📸 {totalAllPhotos} Foto Terunggah`
   - Kategori yang wajib diunggah sudah secara natural memiliki badge `Wajib` pada kartu masing-masing kategori (misal: *Bangunan Depan*, *Kamar*, *Kamar Mandi Dalam*), sementara fasilitas pendukung berbadge `Dianjurkan`.
   - Jika mitra mencoba menekan tombol "Lanjut" sebelum syarat wajib terpenuhi, notifikasi validasi form yang ramah akan memandu secara otomatis.

---

## 2. Dampak Perubahan

File yang akan disentuh:
- [functions/public/components/KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx):
  - Membersihkan sub-card "Syarat Kelayakan Listing", teks justifikasi standar industri, checklist chips, dan variabel kalkulasi header yang tidak terpakai.
  - Mengembalikan header Langkah 5 ke tampilan bersih, elegan, dan proporsional.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Modifikasi Header Langkah 5 di `KostFormMitra.tsx`**:
   - Menghapus blok sub-card checklist kelayakan listing (lines ~5994-6036).
   - Menyederhanakan deskripsi header menjadi ringkas dan bersahabat.
   - Menampilkan counter foto yang bersih (`📸 {totalAllPhotos} Foto Terunggah`).
   - Membersihkan variabel kalkulasi lokal yang tidak terpakai (`requiredCategories`, `missingRequiredList`, `isTotalMet`, `isAllRequiredMet`).
2. **Kompilasi & Build Frontend**:
   - Menjalankan `npm --prefix functions/public run build` untuk memverifikasi 0 error TypeScript dan bundler Vite.
3. **Kompilasi & Build Backend**:
   - Menjalankan `npm --prefix functions run build` untuk memastikan kelulusan `tsc`.
4. **Pencatatan Progres Anti-Amnesia**:
   - Mencatat ke [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) (entri **#457**).
5. **Penerbitan Dokumen Walkthrough**:
   - Memperbarui [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md).
6. **Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Visual**:
  - Header Langkah 5 tampil minimalis, bersih, dan konsisten dengan langkah-langkah lainnya tanpa ada kotak checklist atau pesan kuliah sistem.
  - Setiap kategori tetap memiliki penanda jelas (`Wajib` vs `Dianjurkan`).
  - Logika validasi background (minimal 3 foto & kelengkapan foto pokok) tetap aktif bekerja melindungi kualitas data saat tombol "Lanjut" diklik.
- **Verifikasi Build**:
  - `npm --prefix functions/public run build` lulus 100% dengan exit code 0.
