# IMPLEMENTATION PLAN - Modal Pratinjau Interaktif Listing di Lingkup Dashboard Mitra (Opsi A)

## 1. Analisis Kebutuhan & Masalah

### Kebutuhan Pengguna:
Pengguna ingin memisahkan secara tegas lingkungan **Dashboard Mitra** dari **Lingkungan User Pencari Properti**:
> *"kedepannya saya akan benar benar memisahkan antara dashboard mitra dengan tampilan user ke lingkungan yang benar benar berbeda, bisa nggak sih preview kost yang sedang diajukan itu masih dalam lingkup dashboard mitra tanpa harus tembus ke lingkungan user pencari properti?"*

### Analisis Akar Kebutuhan:
1. **Pemisahan Lingkungan (*Portal Isolation*)**:
   - Saat ini tombol "Preview" di Dashboard Mitra melakukan navigasi langsung ke rute publik `/kost/{slug}`.
   - Hal ini membuat mitra "terlempar" keluar dari lingkungan kerjanya ke lingkungan publik pencari properti yang memiliki navbar pencari, search bar publik, dan footer publik.
   - Menuju pemisahan arsitektur masa depan (misal `mitra.ruangsinggah.id` vs `ruangsinggah.id`), fitur pratinjau kost harus dapat berdiri sendiri di dalam portal mitra.
2. **Kenyamanan & Produktivitas Mitra**:
   - Dengan modal pratinjau interaktif, mitra dapat memeriksa foto, harga, fasilitas kamar, dan aturan kostnya secara instan tanpa perlu reload halaman atau berpindah URL.
   - Jika ada data atau foto yang salah, mitra dapat langsung mengklik tombol `[ ✏️ Edit Data ]` dari modal pratinjau, yang secara otomatis membuka form edit `KostFormMitra`.

---

## 2. Solusi yang Diajukan (Opsi A: In-Dashboard Interactive Preview Modal)

Akan dibuat komponen modal khusus `MitraKostPreviewModal.tsx` yang dirender langsung di atas `MitraDashboard.tsx`:
1. **Header Bilah Kendali Mitra**:
   - Judul: **Pratinjau Listing Kost**
   - Status Badge:
     - `⏳ Sedang Ditinjau Admin (Estimasi 1×24 Jam)` (amber berdenyut)
     - `● Tayang Publik` (hijau emerald)
     - `● Ditangguhkan` (merah rose)
   - Tombol Aksi Langsung:
     - `[ ✏️ Edit Kost ]`: Menutup pratinjau dan langsung membuka form edit.
     - `[ ✕ Tutup ]`: Menutup modal dan kembali ke daftar kost.
2. **Body Pratinjau Representatif**:
   - Galeri foto interaktif (foto utama dan thumbnail).
   - Info dasar properti (Nama, Gender Tipe Kost, Alamat lengkap, Rating).
   - Tipe Kamar & Fasilitas Kamar (Spesifikasi kasur, kamar mandi, AC/Non-AC, harga sewa bulanan/harian).
   - Fasilitas Bersama & Peraturan Kost.
   - Box Edukasi Mitra: *"Ini adalah simulasi tampilan bagaimana calon penyewa akan melihat kost Anda setelah disetujui oleh admin."*
   - Tombol sewa yang dinonaktifkan dengan penanda *"Tombol sewa dinonaktifkan dalam mode pratinjau mitra"*.
3. **Desain & Estetika Premium**:
   - Backdrop modern bergradasi dengan efek *backdrop blur* (`bg-black/70 backdrop-blur-md`).
   - Pure Lucide React SVG Icons (tanpa Google Fonts CDN/ligature untuk mencegah FOUT).
   - Kontrol keyboard: Mendukung penutupan instan dengan tombol `Escape`.

---

## 3. Dampak Perubahan

File yang akan disentuh:
1. **File Baru** `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\components\mitra\MitraKostPreviewModal.tsx`:
   - Komponen modal visual pratinjau kost yang elegan dan kaya informasi.
2. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\pages\MitraDashboard.tsx`:
   - Menambahkan state `previewingKost: Kost | null`.
   - Mengubah aksi tombol `[ 👁️ Preview ]` pada kartu kost dan tombol "Lihat Listing" agar memanggil `setPreviewingKost(p)` (bukan lagi `navigate('/kost/...')`).
   - Merender `<MitraKostPreviewModal ... />` ketika `previewingKost` tidak null.
   - Menyediakan handler edit langsung: saat tombol edit di modal ditekan, modal pratinjau ditutup dan form edit dibuka.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Menunggu Persetujuan / ACC)

1. **Langkah 1: Pembuatan Komponen `MitraKostPreviewModal.tsx`**:
   - Membangun struktur layout modal responsif (desktop & tablet/mobile).
   - Mengintegrasikan tabs/section: Galeri Foto, Informasi Kost, Pilihan Tipe Kamar & Harga, Fasilitas & Aturan.
   - Menambahkan tombol aksi navigasi cepat `Tutup` dan `Edit`.
2. **Langkah 2: Integrasi ke `MitraDashboard.tsx`**:
   - Import `MitraKostPreviewModal`.
   - Pasang state `const [previewingKost, setPreviewingKost] = useState<Kost | null>(null);`.
   - Hubungkan tombol Preview pada kartu kost untuk mengaktifkan modal.
   - Hubungkan aksi `onEdit` dari modal ke pembukaan `KostFormMitra`.
3. **Langkah 3: Kompilasi & Pengujian**:
   - Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error TypeScript/Vite.
4. **Langkah 4: Anti-Amnesia & Pelaporan**:
   - Catat riwayat perubahan ke `functions/PROGRESS.md` sebagai **Fitur #269**.
   - Terbitkan dokumen laporan `WALKTHROUGH.md`.
   - Lakukan commit dan git push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- **Verifikasi Kompilasi**: `npm run build` lulus 100% tanpa error.
- **Verifikasi Lingkungan Terisolasi**:
  - Buka halaman **Kost Saya** di Dashboard Mitra (`/dashboard-mitra`).
  - Klik tombol **`[ 👁️ Preview ]`** pada kost Anda.
  - Pastikan URL browser **tetap berada di `/dashboard-mitra`** dan **TIDAK PERNAH berpindah ke `/kost/...`**.
- **Verifikasi Fungsi Modal Pratinjau**:
  - Modal overlay terbuka dengan mulus menampilkan seluruh foto, detail harga kamar, fasilitas, dan peraturan kost.
  - Periksa apakah status badge peninjauan terlihat jelas di bagian atas modal.
  - Klik tombol **`[ ✕ Tutup ]`** atau tekan tombol `Escape` di keyboard -> modal tertutup instan dan kembali ke daftar kost.
  - Klik tombol **`[ ✏️ Edit Kost ]`** di header modal -> modal pratinjau tertutup dan form edit kost langsung terbuka untuk pengeditan.
