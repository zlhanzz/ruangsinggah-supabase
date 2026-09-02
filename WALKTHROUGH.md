# WALKTHROUGH - Modal Peninjauan Listing Kost Komprehensif 3-Tab Super Admin & Fitur Catatan Revisi Mitra

## Ringkasan Eksekutif
Pekerjaan perombakan modal peninjauan listing kost di Dashboard Super Admin ([`PropertyReviewModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyReviewModal.tsx)) beserta fitur moderasi **"Minta Revisi ke Mitra"** dan integrasi status **"Perlu Revisi"** pada Dashboard Mitra ([`MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)) telah **selesai 100%, lulus uji build Vite tanpa error (0 error), dan siap digunakan**.

---

## 1. Masalah yang Diselesaikan

1. **Modal Review Lama Terlalu Kaku & Terbatas**:
   - Sebelumnya data listing kost ditumpuk dalam single scroll panjang tanpa struktur tab tematik.
   - Tidak ada slider/carousel foto utama beresolusi tinggi, tidak ada counter foto, dan tidak ada fitur Lightbox Fullscreen Zoom.
   - Tidak ada peta interaktif Google Maps untuk memverifikasi akurasi titik GPS.
   - Tidak ada rincian ketersediaan unit kamar, fasilitas kamar mandi, dan skema tarif mendalam per tipe kamar.
2. **Ketiadaan Jalur Moderasi Terstruktur ("Minta Revisi")**:
   - Jika admin menemukan data kost yang kurang lengkap atau foto yang belum jelas, sebelumnya admin hanya bisa menolak atau membiarkannya menggantung tanpa bisa memberikan catatan evaluasi terstruktur ke mitra.
   - Mitra tidak tahu apa yang salah dengan listingnya karena tidak ada umpan balik catatan revisi.

---

## 2. Rincian Implementasi & Perubahan Kode

### A. Komponen Baru: `PropertyReviewModal.tsx`
- **Lokasi File**: [`functions/public/components/admin/PropertyReviewModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyReviewModal.tsx)
- **Desain & Arsitektur**:
  - **Header & Ringkasan Cepat**:
    - Menampilkan Nama Kost, Alamat lengkap, dan Badges (Model: *Self-Listing / KostManager*, Status: *Aktif / Menunggu Review / Dibekukan*, Tipe: *Putra / Putri / Campur*).
    - Tombol kontak cepat langsung ke mitra via **WhatsApp Direct (`wa.me`)**, Telepon, dan Email.
  - **Navigasi 3 Tab Terstruktur**:
    1. **🏢 Tab Data Properti & Lokasi**:
       - *Hero Photo Carousel*: Slider foto 16:9 dengan tombol navigasi Prev/Next, counter foto, tombol Zoom Fullscreen (Lightbox), dan thumbnail selector di bawahnya.
       - *Peta Google Maps Interaktif*: Embed iframe Google Maps dari koordinat lat/lng properti, info koordinat administratif, dan tombol direct link ke Google Maps.
       - *Kampus & Landmark Terdekat*: Daftar jarak kampus/landmark dengan estimasi waktu tempuh.
       - *Fasilitas Gedung & Peraturan*: Ikon vector SVG murni (`lucide-react`) dan chip peraturan kost.
       - *Deskripsi Lengkap*: Tampilan teks deskripsi properti.
    2. **🛏️ Tab Detail Kamar & Skema Tarif**:
       - Kartu tipe kamar lengkap: Nama varian, ukuran, kapasitas, foto kamar, ketersediaan unit (Total vs Sisa Kamar).
       - Fasilitas kamar & kamar mandi (Kamar Mandi Dalam/Luar).
       - Skema tarif lengkap: Harian, Mingguan, Bulanan, 3 Bulanan, 6 Bulanan, Tahunan, serta info biaya deposit & listrik.
    3. **👤 Tab Data Mitra & Kerjasama**:
       - Profil Pemilik: Nama, No WhatsApp, Email, Status Verifikasi KTP.
       - Kontak Pengelola / Darurat.
       - Rekening Bank Pencairan (Nama Bank, Nomor Rekening, Atas Nama).
       - ID unik properti, tanggal pembuatan, tanggal update, serta riwayat catatan revisi sebelumnya.
  - **Modal Lightbox Fullscreen**:
    - Klik foto untuk membuka pratinjau resolusi tinggi layar penuh dengan navigasi keyboard (`Esc`).
  - **Modal Popup "Minta Revisi ke Mitra"**:
    - Dialog interaktif dengan textarea untuk menuliskan instruksi evaluasi admin secara mendalam kepada mitra.

### B. Layanan Backend Moderasi Admin (`adminService.ts`)
- **Lokasi File**: [`functions/public/adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)
- Menambahkan fungsi `requestPropertyRevision(propertyId: string, revisionNotes: string): Promise<void>`:
  - Memverifikasi otorisasi akun Super Admin.
  - Mengubah status properti menjadi `'draft'`.
  - Menyimpan catatan evaluasi di `metadata.revision_notes` dan `metadata.revision_requested_at`.
- Memperbarui interface `BasicPropertyInfo` dan `getAdminProperties` agar membaca kolom/metadata `revisionNotes` dan `revisionRequestedAt`.

### C. Integrasi ke Manajemen Properti Super Admin (`PropertyManagement.tsx`)
- **Lokasi File**: [`functions/public/components/admin/PropertyManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/PropertyManagement.tsx)
- Menggantikan kode modal review lama dengan komponen `<PropertyReviewModal />`.
- Menghubungkan handler `handleRequestRevision` yang memanggil `requestPropertyRevision` dan menyegarkan data tabel properti secara otomatis.

### D. Umpan Balik Status "Perlu Revisi" di Dashboard Mitra (`MitraDashboard.tsx`)
- **Lokasi File**: [`functions/public/pages/MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
- Pada menu **Kost Saya** (`activeMenu === 'properties'`), kartu listing yang memiliki catatan revisi dari admin kini otomatis menampilkan:
  - **Badge Status "Perlu Revisi"** berwarna amber dengan ikon alert.
  - **Banner Peringatan Khusus "Perlu Revisi dari Admin"**: Menampilkan isi catatan evaluasi spesifik dari admin dan arahan: *"Silakan klik tombol Edit untuk memperbaiki data yang diminta, lalu ajukan kembali."*

---

## 3. Hasil Uji Kompilasi & Verifikasi

Pengujian kompilasi dijalankan menggunakan Vite bundler:
```bash
cmd /c npm run build
```

**Hasil Kompilasi**:
```text
vite v6.4.1 building for production...
transforming...
✓ 2509 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.36 kB │ gzip:   2.23 kB
../../public/assets/index-BGjbx1Hc.css                 263.78 kB │ gzip:  31.99 kB
../../public/assets/MitraDashboard-DoR1xHSD.js         395.41 kB │ gzip:  88.44 kB
../../public/assets/Dashboard-BcPpk4yx.js            1,279.97 kB │ gzip: 275.87 kB
✓ built in 27.29s
```
**Status: 0 Error, 100% Lulus Kompilasi.**

---

## 4. Panduan Pengujian untuk Pengguna (User Testing Guide)

### Skenario 1: Meninjau Listing Kost di Dashboard Super Admin
1. Masuk ke Dashboard Admin -> Menu **Manajemen Properti**.
2. Klik tombol **Tinjau (Ikon Mata)** pada salah satu listing kost.
3. Periksa tampilan modal baru:
   - Header menampilkan nama kost, badge status, dan tombol WhatsApp / Telepon / Email mitra.
   - **Tab 1 (Data Properti & Lokasi)**: Coba klik panah Next/Prev slider foto, coba klik tombol Zoom untuk membuka Lightbox layar penuh, dan lihat peta Google Maps interaktif.
   - **Tab 2 (Detail Kamar & Tarif)**: Cek kartu tipe kamar, ketersediaan unit, fasilitas, dan skema tarif.
   - **Tab 3 (Data Mitra & Kerjasama)**: Cek data pemilik kost, nomor rekening bank, dan tanggal listing.

### Skenario 2: Mengirim Catatan Revisi ke Mitra
1. Di dalam modal review, klik tombol oranye **"Minta Revisi"**.
2. Masukkan pesan perbaikan pada popup dialog (misal: *"Mohon tambahkan foto kamar mandi dan perjelas ukuran kamar"*).
3. Klik **"Kirim Catatan Revisi"**.
4. Listing properti akan berpindah status menjadi draft dan catatan revisi tersimpan dengan aman di database.

### Skenario 3: Memeriksa Tampilan di Dashboard Mitra
1. Masuk ke Dashboard Mitra -> Menu **Kost Saya**.
2. Temukan listing yang baru saja diminta revisi.
3. **Hasil**: Kartu listing menampilkan badge **"Perlu Revisi"** serta banner instruksi evaluasi admin berlatar amber lengkap dengan isi pesan admin.
