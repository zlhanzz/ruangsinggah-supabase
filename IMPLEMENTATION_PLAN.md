# IMPLEMENTATION PLAN: Fasilitas Kamar Terintegrasi Dropdown (Maximize/Minimize) pada Setiap Kartu Tipe Kamar

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Fasilitas kamar ditampilkan terpisah pada kotak tersendiri di bawah *Pilih Durasi Sewa*.
  - Ketika calon penyewa melihat kartu tipe kamar (*Standard*, *Premium*, dll.), mereka hanya melihat cuplikan 2 fasilitas awal dan harus melihat ke kotak terpisah di bawah untuk mengetahui fasilitas lengkapnya.
- **Kebutuhan Pengguna**:
  - Mengubah informasi fasilitas kamar menjadi **sistem dropdown interaktif (Maximize / Minimize)** yang terpasang langsung pada setiap kartu tipe kamar.
  - Setiap kartu tipe kamar memiliki tombol/bagian yang dapat di-klik untuk membuka (*maximize*) atau menutup (*minimize*) seluruh rincian fasilitas kamar (Perabot & Ruangan, Kamar Mandi, Dapur Pribadi, Ukuran Kamar) secara dropdown.
  - Menghilangkan kotak fasilitas redundan yang sebelumnya berada terpisah di bawah *Pilih Durasi Sewa* agar tata letak sidebar booking lebih rapi, ringkas, dan mudah dipahami.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx`

---

## 3. Langkah-Langkah Eksekusi
1. **State & Helper Parser Fasilitas di `KostDetail.tsx`**:
   - Menambahkan state `expandedFacilityTypeIdxs: number[]` untuk mengontrol kartu tipe kamar mana saja yang sedang dalam status terbuka (*maximized/expanded*).
   - Membuat fungsi pembantu `getGroupFacilities(group)` untuk mengekstrak dan membagi kategori fasilitas kamar (Perabot Ruangan, Kamar Mandi, Dapur Pribadi, Status Kosongan, Ukuran Kamar) secara dinamis untuk setiap tipe kamar.
2. **Integrasi Dropdown ke Kartu Tipe Kamar**:
   - Menambahkan tombol aksi interaktif *"Rincian Fasilitas Kamar"* dengan ikon dropdown `<ChevronDown />` (berotasi 180° saat terbuka) pada setiap kartu tipe kamar.
   - Merender tampilan dropdown fasilitas berdesain premium (grid kartu fasilitas berikon SVG `lucide-react`) di dalam kartu saat di-*maximize*.
3. **Pembersihan Seksian Terpisah Redundan**:
   - Menghapus blok duplikat fasilitas terpisah di bawah durasi sewa agar alur card booking mengalir mulus langsung ke pilihan durasi dan tombol *"Ajukan Sewa"*.
4. **Kompilasi & Pengujian**:
   - Menjalankan `cmd /c npm run build` untuk memverifikasi 0 error.
5. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 296 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman detail kost (`/kost/:id`) pada layar desktop dan mobile.
- Klik tombol maximize/minimize dropdown fasilitas pada kartu tipe kamar *Standard* dan *Premium*.
- Memastikan seluruh fasilitas kamar (kasur, lemari, AC, kamar mandi, dll.) terbuka dengan rapi dan mulus saat di-*maximize*, dan dapat ditutup kembali saat di-*minimize*.
