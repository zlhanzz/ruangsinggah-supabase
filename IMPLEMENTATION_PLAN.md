# IMPLEMENTATION PLAN - Pengaktifan & Penyempurnaan Alur Step-by-Step Pemasaran Kost bagi Mitra Baru di Dashboard Mitra

## 1. Analisis Masalah & Kebutuhan
- **Keluhan Pengguna**:
  Alur *step-by-step* untuk mitra baru belum / jarang ditampilkan di Dashboard Mitra, padahal panduan alur ini sangat penting agar pemilik kost baru memahami urutan proses pemasaran properti mereka di RuangSinggah.
- **Akar Masalah Teknis**:
  1. **Bug Penyimpanan Global `localStorage` (`mitraTourCompleted`)**:
     - State `tourCompleted` sebelumnya menggunakan key tunggal non-user `localStorage.getItem('mitraTourCompleted')`.
     - Jika pernah diklik *dismiss/close* satu kali pada browser tersebut di masa lalu, nilai `'mitraTourCompleted'` menjadi `'true'` permanen. Akibatnya, setiap akun mitra baru yang login berikutnya secara otomatis kehilangan alur panduan tersebut (`tourCompleted = true`).
  2. **Ketiadaan Fitur Buka Ulang / Toggle Panduan**:
     - Ketika alur panduan ditutup, tidak ada tombol atau banner elegan untuk memanggil/menampilkan kembali panduan alur step-by-step tersebut.
  3. **Kejelasan Edukasi Alur Pemasaran**:
     - Mitra baru memerlukan kejelasan alur 4 tahap:
       1. **Tahap 1: Verifikasi Identitas (KTP)** $\rightarrow$ Membuka izin publikasi dan menjamin keamanan properti.
       2. **Tahap 2: Upload & Kelola Kost (Listing)** $\rightarrow$ Input informasi kamar, harga, fasilitas, & foto terbaik.
       3. **Tahap 3: Tampil di Marketplace & Promosi** $\rightarrow$ Kost tayang di katalog pencarian, siap dipantau dengan statistik Kunjungan & CTR.
       4. **Tahap 4: Terima Booking, Chat Calon Penyewa, & Penarikan Dana** $\rightarrow$ Menerima pengajuan sewa, tanya jawab via chat, dan pencairan penghasilan sewa ke rekening bank.

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/pages/MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx):
  - Memperbaiki inisialisasi state `tourCompleted` agar berbasis `uid` (`mitra_tour_completed_${uid}`).
  - Menambahkan state *toggle expand/collapse* (`isGuideExpanded`) sehingga panduan dapat dibuka dan ditutup dengan fleksibel kapan saja.
  - Mempercantik card & timeline panduan alur step-by-step dengan kartu interaktif, progress bar, indikator status dinamis, dan tombol aksi (*Call to Action*) yang relevan untuk setiap tahapan.
  - Menambahkan banner/tombol akses cepat buka panduan pada halaman Beranda (Overview) dan Sidebar navigasi.
- [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Mencatat riwayat implementasi Progres 320.
- `WALKTHROUGH.md`:
  - Menerbitkan panduan pengujian dan detail perubahan bagi User.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Approval)
1. **Perbaikan Persistensi State Storage Berbasis Akun Mitra**:
   - Mengubah pembacaan dan penyimpanan status penyelesaian panduan ke key `mitra_tour_completed_${uid}`.
   - Menyediakan fungsi `toggleGuide()` untuk membuka/menutup panduan tanpa menghapus riwayat progres.
2. **Penyempurnaan Komponen UI Alur Step-by-Step**:
   - Menyajikan 4 langkah pemasaran kost dengan visual yang atraktif, ringkas, responsif (mobile & desktop), dan dilengkapi ikon SVG `lucide-react`.
   - Mengintegrasikan deteksi progres riil:
     - **Step 1**: Status verifikasi KTP mitra (`isVerified`).
     - **Step 2**: Jumlah properti terdaftar (`properties.length > 0`).
     - **Step 3**: Tampilan listing / views aktif (`hasViewedListing || stats.totalViews > 0`).
     - **Step 4**: Kesiapan transaksi & rekening bank (`properties.length > 0`).
3. **Banner Widget Buka Panduan**:
   - Jika panduan diminimalkan/ditutup oleh mitra yang sudah mahir, tampilkan banner ringkas di Beranda: *"📘 Panduan Alur Pemasaran Kost [Buka Panduan]"*.
4. **Verifikasi & Kompilasi**:
   - Menjalankan `npm run build` untuk memastikan 0 error kompilasi.
   - Mencatat ke `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
   - Melakukan git commit dan push ke branch `bukan-productions` dan `main`.

---

## 4. Rencana Verifikasi
- [ ] Buka Dashboard Mitra dengan akun mitra baru (belum verified / 0 properti) $\rightarrow$ Alur panduan 4 langkah langsung tampil jelas dan interaktif.
- [ ] Klik setiap langkah kartu panduan $\rightarrow$ Mengarahkan langsung ke halaman aksi terkait (Verifikasi KTP, Upload Kost, Preview POV Marketplace, Pesanan/Dompet).
- [ ] Tutup/minimalkan panduan $\rightarrow$ Banner ringkas tetap tersedia untuk membuka kembali panduan kapan saja.
- [ ] Build project dengan `npm run build` $\rightarrow$ Pastikan kelulusan 100% tanpa error.
