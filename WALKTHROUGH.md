# Walkthrough: Normalisasi Total Status & Banner Kemitraan Mitra Biasa (Self-Listing) Pasca Deaktivasi KostManager

Dokumen ini merangkum penyelesaian perbaikan di mana properti kost yang telah dideaktivasi dan dikembalikan menjadi mitra biasa (*self-listing*) kini diperlakukan secara konsisten di seluruh antarmuka dashboard dan profil mitra, termasuk pemulihan **Banner Penawaran Otomatis KostManager** dan kartu profil **Mitra Reguler**.

---

## 1. Ringkasan Perubahan & Hasil Perbaikan

| Lokasi Tampilan | Kondisi Sebelum Perbaikan | Kondisi Setelah Perbaikan |
| :--- | :--- | :--- |
| **Menu "Kost Saya" (`/dashboard-mitra/properties`)** | Muncul banner hijau autopilot: *"KostManager Auto-Pilot Aktif • Properti Anda Dikelola Penuh oleh RuangSinggah"* seolah-olah properti masih terkelola. | Banner hijau autopilot **hilang**. Digantikan oleh **Banner Penawaran Otomatis KostManager** berwarna oranye-amber-rose: *"Capek Kelola Kost Sendiri? Serahkan Operasional ke KostManager!"* dengan tombol CTA *"Pelajari & Ajukan Sekarang"*. |
| **Menu "Beranda" (`/dashboard-mitra`)** | Menganggap status mitra sebagai KostManager (`isKostManager: true`). | Status dihitung akurat sebagai mitra biasa (`isKostManager: false`), dan banner penawaran otomatis KostManager tampil secara elegan. |
| **Menu "Profil" (`/dashboard-mitra/profile`)** | Kartu Program & Layanan menampilkan: *"Upgrade KostManager (Sedang Diproses) • Menunggu survey lokasi"* akibat membaca tiket lama berstatus `INACTIVE`. | Kartu Program & Layanan kini menampilkan identitas **"Mitra Reguler"** (*"Kelola properti kost Anda secara manual"*) dengan tombol aktif **"Upgrade ke KostManager"**. |

---

## 2. File yang Dimodifikasi

1. **[`functions/public/pages/MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)**:
   - Menambahkan konstanta kanonikal `CLOSED_KM_STATUSES = ['COMPLETED', 'ACTIVE', 'INACTIVE', 'CANCELLED', 'REJECTED', 'CLOSED', 'TERMINATED']`.
   - Menghitung `isKostManager` secara murni berdasarkan langganan aktif atau kepemilikan properti yang saat ini berstatus `is_managed: true`.
   - Menambahkan state `hasPendingKmRequest` dan `activeKmRequest` yang hanya mendeteksi tiket permohonan yang berstatus in-progress aktif.
   - Memperbarui `renderKostManagerBanner()`:
     - **Kasus 1 (Aktif KostManager)**: Merender banner hijau *"KostManager Auto-Pilot Aktif"*.
     - **Kasus 2 (Sedang Mengajukan)**: Merender banner amber *"Upgrade KostManager Sedang Diproses"*.
     - **Kasus 3 (Mitra Biasa)**: Merender banner penawaran otomatis oranye-amber-rose dengan 4 quick-pills keunggulan dan tombol CTA ke `/kostmanager`.
2. **[`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)**:
   - Memperbaiki perhitungan `hasActiveKmRequest` dan `activeKmReq` agar mengabaikan status permohonan tertutup/inaktif (`INACTIVE`, `COMPLETED`, `CANCELLED`, `REJECTED`, dll.).
   - Bagi mitra biasa yang tidak memiliki permohonan aktif, kartu menampilkan identitas **"Mitra Reguler"** lengkap dengan tombol aksi **"Upgrade ke KostManager"**.

---

## 3. Hasil Pengujian & Verifikasi Build

1. **Uji Kompilasi Front-End**:
   - Menjalankan `npm.cmd run build` di direktori `functions/public`:
     ```
     vite v6.4.1 building for production...
     ✓ 2512 modules transformed.
     rendering chunks...
     computing gzip size...
     ✓ built in 52.86s
     ```
   - **Hasil**: 100% Lulus (0 error, 0 warning).
2. **Uji Standar Ikon & FOUT**:
   - Seluruh ikon SVG menggunakan paket vektor lokal `lucide-react` (`<Sparkles />`, `<ShieldCheck />`, `<Zap />`, `<TrendingUp />`, `<FileText />`, `<ArrowRight />`, `<Clock />`, `<Eye />`), bebas dari kedipan teks ligatur.

---

## 4. Panduan Verifikasi Pengguna (UI Testing Guide)

1. **Buka Halaman Menu "Kost Saya" (`/dashboard-mitra/properties`)**:
   - Masuk menggunakan akun mitra Sulhan (pemilik Kost Apalah Daya).
   - Perhatikan bagian atas daftar properti:
     - Banner hijau *"KostManager Auto-Pilot Aktif"* sudah **tidak ada lagi**.
     - Muncul banner penawaran otomatis berwarna oranye: **"Capek Kelola Kost Sendiri? Serahkan Operasional ke KostManager!"**.
     - Di bawah banner, Kost Apalah Daya tampil sebagai kost mandiri biasa (badge hijau *"Tayang Publik"*).
2. **Uji Tombol Penawaran**:
   - Klik tombol **"Pelajari & Ajukan Sekarang"** pada banner promosi.
   - Sistem akan mengarahkan ke halaman `/kostmanager` untuk penawaran layanan.
3. **Buka Halaman "Profil" (`/dashboard-mitra/profile`)**:
   - Klik menu navigasi samping **Profil**.
   - Gulir ke bawah pada bagian **"Status Program & Layanan"**:
     - Kartu kini berstatus **"Mitra Reguler"** dengan deskripsi *"Kelola properti kost Anda secara manual"*.
     - Tulisan *"Upgrade KostManager (Sedang Diproses)"* dan *"Menunggu survey lokasi"* sudah **tidak muncul lagi**.
     - Terdapat tombol **"Upgrade ke KostManager"** jika mitra sewaktu-waktu ingin mengajukan propertinya kembali.
