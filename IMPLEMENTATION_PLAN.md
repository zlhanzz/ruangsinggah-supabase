# IMPLEMENTATION PLAN: Penyajian Jumlah Kamar Tersedia pada Tipe Kamar Listing Mitra Biasa di KostDetail.tsx

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Pada listing Mitra Biasa (Non-KostManager), badge ketersediaan pada kartu tipe kamar di sidebar dan badan utama listing hanya menampilkan teks generik `"Tersedia"`, berbeda dengan KostManager yang menampilkan `"X Kamar Tersedia"`.
  - Properti milik Mitra Biasa memiliki data `availableRoomCount` / `availableRooms` pada setiap tipe kamar (misal: Tipe Standard tersedia 3 kamar, Tipe Premium sisa 1 kamar), namun data kuantitas ini belum ditampilkan pada badge kartu tipe kamar.
- **Tujuan**:
  - Mengambil data `availableRoomCount` / `availableRooms` / `availableCount` secara akurat pada parser `parentRoomGroups` untuk Mitra Biasa (`!kost.isManaged`).
  - Menampilkan badge ketersediaan yang jelas dan informatif pada seluruh komponen tipe kamar:
    - Sidebar Room Type Card: Menampilkan `X Kamar Tersedia` (atau `Penuh` jika 0/false).
    - Main Body Room Facility Card: Menampilkan `X Kamar Tersedia` (atau `Penuh`).
    - Tab Switcher Tipe Kamar: Menyertakan indikator status ketersediaan yang rapi.
  - Mempertahankan alur booking: Mitra KostManager tetap dapat memilih nomor kamar individual (`PILIH NOMOR KAMAR`), sedangkan Mitra Biasa langsung memilih tipe kamar dengan informasi ketersediaan yang jelas.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx` (Parser `parentRoomGroups` regular kost & rendering badge ketersediaan tipe kamar)

---

## 3. Langkah-Langkah Eksekusi
1. **Parser Kuantitas Kamar Tersedia (`parentRoomGroups`)**:
   - Memperbarui pemetaan `parentRoomGroups` untuk `!kost.isManaged` agar membaca `rt.availableRoomCount ?? rt.availableRooms ?? rt.availableCount ?? (isAvail ? 1 : 0)` secara presisi.
2. **Pembaruan Tampilan Badge Ketersediaan**:
   - Pada kartu tipe kamar di sidebar: Mengganti teks statis `"Tersedia"` menjadi `${group.availableCount} Kamar Tersedia`.
   - Pada kartu fasilitas kamar di badan utama listing: Memperbarui badge agar menampilkan `${activeGroup.availableCount} Kamar Tersedia`.
   - Pada tab selector tipe kamar di badan utama: Menambahkan badge ketersediaan mini yang serasi.
3. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
4. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 300 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman detail kost mitra biasa (`/kost/:id`) di browser.
- Memeriksa kartu tipe kamar di sidebar: Memverifikasi badge menampilkan `X Kamar Tersedia` (misal *2 Kamar Tersedia* atau *Penuh* jika habis).
- Memeriksa seksian Fasilitas Kamar di badan utama listing: Memverifikasi badge pada header tipe kamar menampilkan jumlah kamar yang tersedia secara akurat.
