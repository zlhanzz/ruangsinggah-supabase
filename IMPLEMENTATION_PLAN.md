# IMPLEMENTATION PLAN: Pembersihan Kartu Promosi KostManager dari Sidebar Dashboard Mitra

## 1. Analisis Masalah & Kebutuhan
- **Masalah**:
  - Terdapat kartu promosi berwarna oranye *"KostManager Auto-Pilot"* yang disematkan di bagian bawah sidebar (di atas tombol *Keluar Akun*).
  - Tampilan ini membuat tata letak navigasi sidebar terasa sesak dan mengganggu fokus pemilik kost saat mengakses menu utama.
- **Tujuan Pengembangan**:
  - Menghapus sepenuhnya komponen kartu promosi KostManager dari sidebar desktop dan drawer mobile pada `MitraDashboard.tsx`.
  - Mengembalikan tampilan sidebar navigasi yang bersih, luas, rapi, dan profesional.

---

## 2. Dampak Perubahan
- **Berkas yang Dimodifikasi**:
  - `functions/public/pages/MitraDashboard.tsx`:
    - Menghapus blok kartu promosi KostManager pada Desktop Sidebar.
    - Menghapus blok kartu promosi KostManager pada Mobile Drawer Sidebar.

---

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `MitraDashboard.tsx`**:
   - Menghapus elemen JSX kartu promosi KostManager di Desktop Sidebar (sebelum tombol logout).
   - Menghapus elemen JSX kartu promosi KostManager di Mobile Drawer Sidebar.
2. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
3. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 307 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka Dashboard Mitra (`/dashboard-mitra`).
- Memastikan sidebar kiri desktop dan drawer mobile kembali bersih, hanya berisi menu navigasi dan tombol keluar akun di bagian bawah.
