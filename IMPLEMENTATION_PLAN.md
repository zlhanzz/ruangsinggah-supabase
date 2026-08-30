# Rencana Implementasi: Penyesuaian & Redesain Sistem Manajemen Listing Admin Menjadi Pusat Moderasi & Supervisi Properti Masuk (Fitur #225)

## 1. Analisis Masalah & Kebutuhan

### A. Latar Belakang Perubahan Paradigma
- **Sistem Lama**: Didesain dengan asumsi Admin adalah pihak yang membuat, mengisi formulir 6-step yang panjang, mengupload foto, dan menerbitkan listing kost secara manual.
- **Sistem Baru (Saat Ini)**: Listing kost kini dibuat dan diunggah langsung secara mandiri oleh para **Pemilik Kost / Mitra** melalui Dashboard Mitra (`MitraDashboard.tsx` / `KostFormMitra.tsx`).
- **Tujuan Perubahan**: Menyesuaikan sistem admin dari *"Form Input Kost Baru"* menjadi **"Pusat Moderasi & Supervisi Listing Masuk"** (*Listing Moderation & Property Supervision Center*).

### B. Kebutuhan Fitur Supervisi & Moderasi Admin
1. **Ringkasan Metrik Pengawasan (Statistik Cepat)**:
   - Total Listing Terdaftar di platform.
   - Listing Menunggu Moderasi / Draft.
   - Listing Aktif & Terbit (*Published*).
   - Listing Terkelola KostManager (*Auto-Pilot*) vs Mandiri (*Self-Managed*).
   - Listing Terverifikasi Centang Biru (*Verified Listing*).
2. **Filter Tab Status Moderasi**:
   - `Semua Properti`
   - `Menunggu Review / Draft`
   - `Aktif / Terbit (Published)`
   - `KostManager Auto-Pilot`
   - `Terverifikasi (Centang Biru)`
3. **Pencarian & Penyaringan Lengkap**:
   - Pencarian cerdas berdasarkan Nama Kost, Nama Pemilik/Mitra, Nomor WhatsApp, Kota, atau Alamat.
   - Filter Tipe Properti: Semua, Kost Putra, Kost Putri, Kost Campur.
   - Filter Berdasarkan Kota.
4. **Tabel Moderasi Listing Informatif**:
   - Menampilkan thumbnail WebP, nama kost, tipe, status terbit, status KostManager, dan badge verifikasi.
   - Info Pemilik/Mitra yang jelas beserta tautan langsung chat WhatsApp pemilik untuk koordinasi verifikasi lapangan.
   - Ringkasan tipe kamar, rentang harga, dan ketersediaan kamar kosong.
   - Aksi moderasi cepat:
     - **Toggle Publikasi**: Aktifkan (`published`) / Nonaktifkan (`draft`).
     - **Toggle Centang Biru**: Beri badge verifikasi terpercaya (`is_verified`).
     - **Tinjau Detail Listing**: Membuka modal inspeksi detail properti.
     - **Transfer Kepemilikan**: Pindahkan kost ke akun mitra lain.
     - **Kunjungi Halaman Publik**: Cek langsung tampilan publik di `/kost/:id`.
     - **Hapus Properti**: Hapus permanen dengan modal konfirmasi aman.
5. **Modal Detail Tinjauan & Moderasi Listing (Review & Moderation Modal)**:
   - Galeri foto/video kost beresolusi tinggi.
   - Rincian deskripsi, alamat, dan titik peta GPS.
   - Detail kamar, fasilitas kamar, kamar mandi, dan skema harga sewa.
   - Fasilitas umum, peraturan kost, dan kampus/fasilitas sekitar.
   - Profil dan kontak pemilik/mitra.
   - Tombol tindakan moderasi langsung di dalam modal (Approve/Publish, Unpublish/Draft, Verify, WhatsApp Mitra).

---

## 2. Dampak Perubahan File

1. **`functions/public/components/admin/PropertyManagement.tsx`** *(File Baru)*:
   - Komponen modular modern khusus admin untuk pengawasan, pencarian, filter, dan moderasi listing kost.
2. **`functions/public/adminService.ts`** *(Modifikasi)*:
   - Penambahan fungsi helper moderasi: `togglePropertyVerification(propertyId, isVerified)` dan pembaruan pengambilan data listing admin dengan info kontak/profil pemilik yang lengkap.
3. **`functions/public/pages/Dashboard.tsx`** *(Modifikasi & Pembersihan)*:
   - Menggantikan tabel lama dan menghapus form modal manual redundan (~1000 baris kode peninggalan era lama) dengan komponen terisolasi `<PropertyManagement />`.

---

## 3. Langkah-Langkah Eksekusi (Setelah Persetujuan / ACC)

1. **Langkah 1**: Tambahkan helper moderasi status verifikasi dan properti di `functions/public/adminService.ts`.
2. **Langkah 2**: Buat komponen `functions/public/components/admin/PropertyManagement.tsx` dengan desain UI/UX modern, pure bundled vector icons (`lucide-react`), sistem caching lokal, dan modal tinjauan moderasi komprehensif.
3. **Langkah 3**: Integrasikan `PropertyManagement.tsx` ke dalam `functions/public/pages/Dashboard.tsx` pada menu `activeMenu === 'properties'`.
4. **Langkah 4**: Uji kompilasi build frontend (`cmd /c npm run build`) untuk memastikan 0 error.
5. **Langkah 5**: Catat riwayat progres ke `functions/PROGRESS.md` (Fitur #225) dan buat dokumen `WALKTHROUGH.md`.
6. **Langkah 6**: Lakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Uji Kompilasi**: Menjalankan `npm run build` di `functions/public/` untuk memastikan tidak ada kesalahan tipe TypeScript atau bundling Vite.
- **Uji Fungsional Admin**:
  - Membuka menu "Kelola Kost" di Dashboard Admin.
  - Memverifikasi metrik ringkasan kartu statistik.
  - Memverifikasi filter tab (Semua, Menunggu Review, Published, KostManager, Terverifikasi).
  - Menguji pencarian berdasarkan nama kost dan nama pemilik.
  - Menguji aksi toggle publikasi (Publish/Draft) dan toggle Centang Biru.
  - Membuka Modal Tinjauan Properti untuk memeriksa seluruh data listing yang diunggah pemilik kost.
  - Memverifikasi tautan WhatsApp ke pemilik kost.
