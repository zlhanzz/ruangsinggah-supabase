# Implementation Plan: Restorasi & Penegasan Tampilan Kartu Peninjauan Pendataan KostManager Versi Modern Terbaik

## 1. Analisis Masalah & Investigasi

### Masalah yang Terjadi:
Pengguna mendapati tampilan pada menu **"KostManager Auto-Pilot"** di panel Admin muncul sebagai tabel sederhana (versi lama dengan kolom: `INFO KOST`, `PEMILIK (USER)`, `STATUS & AGEN`, `TRANSAKSI`, `AKSI`) seperti pada tangkapan layar yang dilampirkan, bukan dalam bentuk kartu modern interaktif (card-based) dan modal peninjauan komprehensif yang telah dikembangkan.

### Temuan Investigasi Kode:
1. **Status Kode Sumber Terkini (`KostManagerManagement.tsx`)**:
   - Komponen [`KostManagerManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx) saat ini berukuran **4.615 baris kode** dan **sudah memuat seluruh fitur terbaik dan termodern**, meliputi:
     - **Pipeline Tab Filter**: *Semua Permohonan*, *🔴 Butuh Agen*, *⚡ Proses Survey*, *📥 Butuh Verifikasi / Review*, *🟢 Aktif Autopilot*.
     - **Modern Card Grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`)**: Kartu permohonan dengan aksen warna gradasi status, avatar profil mitra, chip WhatsApp langsung, badge tipe properti, chip jumlah kamar (total vs kosong), indikator GPS link, dan alert box evaluasi revisi.
     - **Tombol Aksi Utama**: Tombol `🔍 Tinjau Hasil Pendataan Lengkap` (untuk permohonan berstatus `PENDING_ONBOARDING`, `SUBMITTED`, atau `REVISION_REQUIRED`) dan tombol `✏️ Kelola Agen & Drive`.
     - **Modal Peninjauan Komprehensif 3 Kategori (`ReviewKostManagerModal`)**:
       - 🏢 **Tab 1: Profil Gedung & Fasilitas**: Hero photo carousel, fasilitas umum terintegrasi, rules, dan live Google Maps routes/jarak kampus terdekat.
       - 🛏️ **Tab 2: Tipe Kamar & Penghuni**: Bar ringkasan statistik kamar, hierarki parent-child, kartu kamar terisi (data penyewa, WA, tanggal masuk, tagihan) vs kamar kosong (siap huni, skema tarif lengkap), carousel foto unit per-kamar, dan sinkronisasi fasilitas.
       - 🤝 **Tab 3: Mitra & Keputusan**: Data pemilik kost, MoU, tanda tangan digital, sistem evaluasi & minta revisi checklist ke surveyor, serta tombol aktivasi/approval final.
2. **Penyebab Tampilan Lama Terlihat**:
   - Tampilan tabel lama yang muncul pada tangkapan layar pengguna berasal dari **cache aset JavaScript di peramban (browser cache / HTTP bundle cache)** dari versi build terdahulu sebelum Vite me-refresh berkas `Dashboard-*.js` dan `KostManagerManagement-*.js`.
   - Atau adanya kemungkinan pemanggilan fallback menu admin jika `activeMenu` sempat terarah ke tabel pesanan biasa.

---

## 2. Dampak Perubahan

File yang akan ditinjau dan dipastikan integritasnya:
- [`functions/public/components/admin/KostManagerManagement.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx): Memastikan seluruh render pipeline cards, badges, dan modal peninjauan 3-kategori aktif secara default tanpa ada percabangan kode ke tabel jadul.
- [`functions/public/pages/Dashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx): Memastikan menu `kostmanager` merender secara eksklusif `<KostManagerManagement />` versi modern card-based.

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

1. **Audit & Sanitasi Komponen `KostManagerManagement.tsx`**:
   - Memastikan tidak ada sisa blok `<table>` usang di dalam `KostManagerManagement.tsx`.
   - Memastikan container grid kartu `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` ter-render mulus untuk semua status permohonan.
   - Memastikan tombol `🔍 Tinjau Hasil Pendataan Lengkap` dan modal review 3-kategori berfungsi interaktif 100%.
2. **Re-Build Bundle Frontend dengan Cache-Busting**:
   - Menjalankan `npm run build` di direktori `functions/public` untuk menghasilkan hash chunk baru pada `public/assets/`, sehingga browser pengguna secara otomatis mengabaikan cache lama dan memuat UI kartu modern terbaru.
3. **Pencatatan & Dokumentasi**:
   - Mencatat konfirmasi penegasan UI kartu modern di `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
4. **Git Commit & Push**:
   - Melakukan commit dan push pembaruan ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi & Build**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan 0 error kompilasi Typescript/Vite (`exit code: 0`).
2. **Verifikasi Browser & Instruksi Refresh untuk Pengguna**:
   - Memastikan setelah build baru diterapkan, pengguna cukup melakukan hard refresh (`Ctrl + F5` atau `Ctrl + Shift + R`) pada halaman Dashboard Admin menu `⚡ KostManager Auto-Pilot` untuk langsung melihat tampilan kartu modern dengan tombol peninjauan lengkap.
