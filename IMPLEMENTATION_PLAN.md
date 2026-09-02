# Rencana Implementasi: Perombakan Modal Peninjauan Listing Kost Komprehensif & Interaktif di Dashboard Super Admin

Dokumen ini disusun berdasarkan masukan pengguna untuk merevolusi modal peninjauan listing kost (*property review modal*) yang saat ini dinilai kurang lengkap, kaku (*flat*), dan tidak komprehensif. Perancangan mengadopsi standar visual, struktur 3-tab, dan interaktivitas dari modal peninjauan hasil pendataan KostManager ([`KostManagerManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx)).

---

## 1. Analisis Masalah & Kebutuhan

### A. Kondisi Saat Ini (Kekurangan Modal Peninjauan Listing Kost Lama)
1. **Penyajian Data Kaku & Menumpuk (Flat Single Scroll)**:
   - Seluruh data (galeri, profil mitra, deskripsi, kamar, fasilitas, aturan) ditumpuk vertikal dalam satu scroll panjang tanpa navigasi tab tematik.
2. **Galeri Foto Terbatas & Tidak Interaktif**:
   - Hanya menampilkan grid foto kecil biasa tanpa slider/carousel hero, tanpa counter foto, tanpa caption kategori foto, dan tanpa fitur *Lightbox Fullscreen Zoom* untuk menginspeksi detail keaslian foto properti.
3. **Ketiadaan Verifikasi Peta & Koordinat GPS**:
   - Alamat hanya berupa teks biasa. Admin tidak bisa memverifikasi apakah titik koordinat latitude/longitude sudah akurat karena tidak ada *embedded* peta Google Maps langsung di dalam modal.
4. **Ketiadaan Data Kampus & Landmark Terdekat**:
   - Admin tidak bisa melihat jarak kampus, estimasi waktu tempuh, atau rute Google Maps yang dimasukkan.
5. **Rincian Tipe Kamar Minim**:
   - Hanya menampilkan ringkasan teks sederhana; tidak memuat foto khusus per tipe kamar, ketersediaan unit (total vs sisa kamar), fasilitas kamar mandi (dalam/luar), spesifikasi listrik, dan deposit.
6. **Alat Moderasi Terbatas (Tidak Ada Opsi "Minta Revisi ke Mitra")**:
   - Tombol aksi saat ini hanya "Setujui & Publikasikan" atau "Bekukan Kost". Jika ada data yang kurang lengkap (misal: foto kamar mandi belum ada atau lokasi kurang presisi), admin tidak memiliki fitur untuk mengembalikan listing ke mitra dengan catatan perbaikan (*revision notes*) terstruktur.

### B. Solusi yang Ditawarkan (Mengadopsi Standar KostManager)
Membangun komponen baru **`PropertyReviewModal.tsx`** yang modern, responsif, dan interaktif dengan fitur:
- **Header & Quick Actions**:
  - Badge model listing (`Self Listing (Mandiri)` vs `Terkelola KostManager`).
  - Badge status publikasi (`● Aktif / Terbit`, `⏳ Menunggu Review / Draft`, `❄️ Dibekukan`).
  - Badge tipe kost (`Putra`, `Putri`, `Campur`).
  - Tombol aksi cepat: Chat WhatsApp Mitra langsung, Telepon, dan Email.
- **Sistem Navigasi 3-Tab Terstruktur**:
  1. **Tab 1: 🏢 DATA PROPERTI & LOKASI**:
     - *Hero Carousel Slider & Lightbox*: Slider foto utama rasio 16:9 dengan gradient overlay, counter foto, navigasi prev/next, tombol zoom fullscreen (Lightbox), serta thumbnail strip dengan label kategori.
     - *Peta Google Maps Interaktif (Embed Iframe)*: Peta Maps langsung dari koordinat lat/lng properti + info administratif (Provinsi, Kota, Kecamatan, Lat/Lng) + tombol "Buka Google Maps ↗".
     - *Kampus & Landmark Terdekat*: Daftar kampus terdekat dengan indikator jarak dan estimasi rute.
     - *Fasilitas Gedung & Peraturan*: Grid fasilitas umum dengan ikon pure vector SVG (`lucide-react`) dan chip peraturan kost.
     - *Deskripsi Lengkap*: Tampilan format teks deskripsi yang rapi.
  2. **Tab 2: 🛏️ DETAIL KAMAR & SKEMA TARIF**:
     - Kartu tipe kamar lengkap per tipe (Nama tipe, ukuran 3x4 m, kapasitas).
     - Ketersediaan unit kamar (Total Kamar & Kamar Kosong).
     - Galeri foto khusus per tipe kamar dengan thumbnail & zoom.
     - Fasilitas kamar mandi (Dalam/Luar) dan fasilitas kamar (AC, Kasur, Lemari, dll).
     - Skema tarif lengkap (Harian, Mingguan, Bulanan, 3 Bulanan, 6 Bulanan, Tahunan) serta info biaya tambahan / listrik / deposit.
  3. **Tab 3: 👤 DATA MITRA & KERJASAMA**:
     - Profil Pemilik/Mitra: Nama, No WhatsApp, Email, Status Verifikasi KTP.
     - Kontak Pengelola / Darurat (Nama & No HP Pengelola).
     - Rekening Bank Pencairan (Nama Bank, Nomor Rekening, Atas Nama).
     - Tanggal Pembuatan Listing, Tanggal Pembaruan Terakhir, ID Properti unik.
     - Riwayat Pembekuan / Catatan Revisi sebelumnya.
- **Modal Lightbox Fullscreen**:
  - Membuka foto beresolusi penuh saat diklik dengan kontrol keyboard (`Esc`, panah kiri/kanan).
- **Alat Moderasi Komprehensif (Action Bar)**:
  - **Setujui & Publikasikan**: Menyetujui listing agar aktif di katalog publik.
  - **Minta Revisi ke Mitra**: Modal popup untuk memasukkan alasan revisi spesifik (tersimpan di `properties.metadata.revision_notes`).
  - **Bekukan / Buka Pembekuan (Suspend/Unfreeze)**: Membekukan listing jika terjadi pelanggaran.
  - **Beri / Cabut Centang Biru (Verified Badge)**: Memverifikasi properti.
  - **Halaman Publik**: Membuka pratinjau halaman publik asli.

---

## 2. Dampak Perubahan File

| File | Status | Deskripsi Perubahan |
|---|---|---|
| [`functions/public/components/admin/PropertyReviewModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyReviewModal.tsx) | **File Baru** | Komponen modal peninjauan listing komprehensif 3-tab, hero carousel foto, embedded Google Maps, rincian tipe kamar, profil mitra, modal lightbox foto, dan modal input catatan revisi. |
| [`functions/public/components/admin/PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx) | **Modifikasi** | Menggantikan modal review lama dengan `<PropertyReviewModal />`, menambahkan handler `handleRequestRevision`, serta menghubungkan tombol aksi moderasi terpadu. |
| [`functions/public/adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) | **Modifikasi** | Menambahkan fungsi `requestPropertyRevision(propertyId, revisionNotes)` untuk menyimpan status `'draft'` dengan catatan revisi dan timestamp ke Supabase. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

1. **Membuat Fungsi Service di [`adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)**:
   - Membuat fungsi `requestPropertyRevision(propertyId: string, revisionNotes: string): Promise<void>` yang meng-update status properti menjadi `'draft'` dan menyimpan catatan perbaikan di `metadata.revision_notes` serta `metadata.revision_requested_at`.
2. **Membangun Komponen [`PropertyReviewModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyReviewModal.tsx)**:
   - Menerapkan arsitektur 3-tab interaktif:
     - Tab 1: Properti Umum & Lokasi (Hero carousel, Lightbox, Embedded Google Maps iframe, Kampus terdekat, Fasilitas SVG, Peraturan, Deskripsi).
     - Tab 2: Detail Kamar & Harga (Card per tipe kamar, galeri foto kamar, ketersediaan unit, skema tarif harian/bulanan/tahunan, fasilitas kamar & kamar mandi).
     - Tab 3: Data Mitra & Legalitas (Profil pemilik, kontak WhatsApp, verifikasi KTP, rekening bank, ID & timestamp listing, riwayat catatan).
   - Menambahkan Modal Lightbox untuk pembesar foto layar penuh.
   - Menambahkan Modal Popup "Minta Revisi ke Mitra" dengan input textarea catatan revisi.
   - Menggunakan 100% vector SVG dari `lucide-react` (bebas FOUT).
3. **Mengintegrasikan ke [`PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx)**:
   - Mengganti kode modal lama (baris 1010-1244) dengan memanggil `<PropertyReviewModal />`.
   - Menghubungkan fungsi aksi: `onPublish`, `onUnpublish`, `onRequestRevision`, `onToggleVerification`, `onFreeze`, `onUnfreeze`, `onClose`.
4. **Kompilasi & Validasi**:
   - Menjalankan `npm run build` menggunakan bundler Vite untuk memastikan 0 error kompilasi.
5. **Dokumentasi & Git**:
   - Mencatat progres ke `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Uji Visual & Interaktivitas**:
  - Membuka Dashboard Super Admin -> Manajemen Properti -> Klik tombol mata / tinjau pada salah satu properti.
  - Memastikan tampilan modal terbuka dengan mulus, menampilkan 3 tab terstruktur (Data Properti & Lokasi, Detail Kamar & Skema Tarif, Data Mitra & Kerjasama).
- [ ] **Uji Hero Carousel & Lightbox**:
  - Menguji tombol Next/Prev dan klik thumbnail pada hero slider foto.
  - Menguji tombol zoom untuk membuka Lightbox foto layar penuh.
- [ ] **Uji Peta Lokasi Google Maps**:
  - Memastikan iframe Google Maps memuat titik lokasi yang akurat berdasarkan koordinat properti.
- [ ] **Uji Aksi Moderasi**:
  - Menguji tombol "Setujui & Publikasikan" -> Status berubah menjadi `published`.
  - Menguji tombol "Minta Revisi" -> Mengetik catatan revisi -> Status berubah menjadi `draft` dengan catatan revisi tersimpan.
  - Menguji tombol "Beri/Cabut Centang Biru" -> Status verifikasi berubah secara instan.
- [ ] **Uji Kelulusan Build**:
  - `npm run build` sukses 100% tanpa error TypeScript.

---

> [!IMPORTANT]
> Sesuai protokol siklus kerja 2-fase di `AGENTS.md`, AI Agent berhenti di sini untuk menunggu persetujuan (*Proceed / ACC*) dari pengguna sebelum melakukan modifikasi kode.
