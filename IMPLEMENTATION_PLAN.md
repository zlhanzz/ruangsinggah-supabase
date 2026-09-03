# IMPLEMENTATION PLAN: Seksian Dinamis Fasilitas Kamar pada Kolom Utama Listing di KostDetail.tsx

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Kolom utama listing pada halaman detail kost menampilkan informasi properti: Galeri Foto, Deskripsi Lengkap, dan **Fasilitas Umum** (Dapur Bersama, Area Parkir, Fasilitas Gedung & Keamanan), lalu langsung beralih ke Peraturan Kost dan Lokasi & Lingkungan.
  - Fasilitas spesifik kamar sebelumnya hanya berada di sidebar samping kanan.
- **Kebutuhan Pengguna**:
  - Menampilkan seksian **"Fasilitas Kamar"** secara dinamis di kolom utama listing tepat di bawah seksian **"Fasilitas Umum"**.
  - Seksian ini harus menyajikan seluruh informasi fasilitas kamar secara lengkap dan dinamis untuk **setiap tipe kamar** yang terdaftar di properti (seperti *Standard*, *Premium*, *VIP*, dll.).
  - Mendukung navigasi tab tipe kamar yang interaktif atau tampilan card per tipe kamar yang memuat kategori:
    - Ukuran Kamar & Status Ketersediaan
    - **Perabot & Ruangan** (Kasur, Lemari, Meja, Kursi, AC, TV, Ventilasi, dll.)
    - **Kamar Mandi** (Kamar Mandi Dalam, Kloset Duduk/Jongkok, Shower, Wastafel, dll.)
    - **Dapur Pribadi** (Kompor dalam, sink cuci piring, dll.)
    - Status Kosongan (jika kosongan).

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx` (Penambahan `InfoSection title="Fasilitas Kamar"` di kolom utama di bawah Fasilitas Umum)

---

## 3. Langkah-Langkah Eksekusi
1. **Seksian Dinamis `Fasilitas Kamar` di Kolom Utama**:
   - Menambahkan komponen `InfoSection title="Fasilitas Kamar"` tepat di bawah blok `InfoSection title="Fasilitas Umum"` di `KostDetail.tsx`.
   - Menggunakan data `parentRoomGroups` dan helper `getGroupStructuredFacilities(group)` untuk mengekstrak fasilitas setiap tipe kamar secara otomatis.
   - Jika terdapat lebih dari 1 tipe kamar, menyediakan selector tab / kartu tipe kamar yang responsif agar calon penyewa dapat membandingkan fasilitas antar-tipe kamar dengan sangat mudah.
   - Menampilkan fasilitas kamar menggunakan grid kartu berikon SVG murni dari `lucide-react` (0 FOUT).
2. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan kompilasi 0 error.
3. **Pencatatan Progres & Push**:
   - Mencatat progres nomor 297 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman detail kost (`/kost/:id`) pada layar desktop dan mobile.
- Scroll ke bawah seksian *Fasilitas Umum* pada badan utama listing:
  - Memverifikasi seksian *Fasilitas Kamar* muncul dengan rapi.
  - Memverifikasi setiap tipe kamar (misal *Standard* dan *Premium*) menampilkan seluruh fasilitasnya (Perabot & Ruangan, Kamar Mandi, Dapur Pribadi, dan Ukuran Kamar) secara akurat sesuai data di database.
