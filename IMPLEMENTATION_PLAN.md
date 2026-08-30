# Rencana Implementasi: Sistem Pelaporan Iklan Kost oleh Pengguna & Pusat Manajemen Laporan Properti di Dashboard Admin (Fitur #226)

## 1. Analisis Masalah & Kebutuhan

### A. Latar Belakang Masalah
- Dengan diterapkannya sistem *Self-Listing* (pemilik kost mengunggah kost secara mandiri), potensi terjadinya data tidak akurat, foto tidak sesuai realita, harga yang dinaikkan sepihak saat disurvei, titik peta palsu, atau indikasi penipuan transfer DP di luar platform menjadi terbuka lebar.
- Admin membutuhkan partisipasi pencari kost (*community watchdog*) untuk melaporkan listing bermasalah langsung dari halaman publik, serta membutuhkan antarmuka di Dashboard Admin untuk memproses, menindaklanjuti, dan **membekukan (*suspend/freeze*)** listing bermasalah tersebut secara terpadu.

### B. Kebutuhan Solusi
1. **Di Sisi Pengguna Publik (`KostDetail.tsx`)**:
   - Tombol elegan **"🚨 Laporkan Iklan Ini"** pada halaman detail kost publik.
   - **Modal Formulir Laporan Publik**:
     - Pilihan Kategori:
       1. 🚨 *Indikasi Penipuan / Minta Transfer di Luar Sistem* (`fraud`)
       2. 🏷️ *Harga atau Fasilitas Tidak Sesuai Realita* (`mismatch`)
       3. 📍 *Lokasi Titik Peta Palsu / Tidak Akurat* (`fake_location`)
       4. 🚫 *Kost Sudah Penuh / Tidak Beroperasi* (`closed_or_full`)
       5. 🔞 *Foto atau Konten Tidak Pantas* (`inappropriate`)
       6. 📝 *Lainnya* (`other`)
     - Deskripsi/kronologi kendala yang ditemukan.
     - Nama Pelapor & Nomor WhatsApp (otomatis terisi jika user sedang login).
     - Unggah Foto Bukti (opsional, dikompresi otomatis ke WebP di sisi klien).
     - Notifikasi email otomatis ke admin via FormSubmit (`emailService.ts`) agar admin segera tahu jika ada laporan mendesak.
2. **Penyimpanan Data di Supabase (`property_reports`)**:
   - Struktur data: `id`, `property_id`, `reporter_id`, `reporter_name`, `reporter_phone`, `category`, `description`, `evidence_urls`, `status` (`'pending' | 'reviewed' | 'resolved' | 'dismissed'`), `admin_notes`, `action_taken`, `created_at`, `updated_at`.
3. **Di Sisi Dashboard Admin (`PropertyManagement.tsx` & `adminService.ts`)**:
   - Menambahkan Tab **"🚨 Laporan Masuk"** di Pusat Moderasi Admin dengan indikator badge jumlah laporan belum ditinjau (*pending*).
   - Indikator badge merah pada tabel daftar properti jika properti terkait memiliki laporan aktif (*`🚨 1 Laporan`*).
   - **Tabel & Kartu Detail Laporan Pengguna**:
     - Menampilkan nama kost & pemilik kost yang dilaporkan.
     - Nama & nomor WhatsApp pelapor (+ tombol 1-klik chat WA pelapor).
     - Kategori pelanggaran, deskripsi aduan, dan thumbnail bukti foto.
   - **Aksi Cepat Moderasi dari Laporan**:
     - **1-Klik Bekukan Listing (Freeze)**: Membuka modal pembekuan dengan alasan otomatis terisi dari laporan user.
     - **1-Klik Chat Pemilik Kost (WhatsApp)**: Menanyakan klarifikasi ke mitra pemilik kost.
     - **1-Klik Chat Pelapor (WhatsApp)**: Mengonfirmasi temuan kepada pelapor.
     - **Tandai Ditindaklanjuti / Selesai** (`resolved`).
     - **Abaikan Laporan** (`dismissed`).

---

## 2. Dampak Perubahan File

1. **`functions/public/userService.ts`** *(Modifikasi)*:
   - Menambahkan fungsi `submitPropertyReport` untuk menyimpan aduan pengguna ke tabel Supabase.
2. **`functions/public/emailService.ts`** *(Modifikasi)*:
   - Menambahkan fungsi `notifyAdminPropertyReport` untuk mengirimkan notifikasi email ke seluruh admin saat ada laporan listing masuk.
3. **`functions/public/pages/KostDetail.tsx`** *(Modifikasi)*:
   - Menambahkan tombol *"Laporkan Iklan Ini"* dan modal interaktif formulir pelaporan dengan kompresi bukti WebP.
4. **`functions/public/adminService.ts`** *(Modifikasi)*:
   - Menambahkan helper `getPropertyReports`, `updatePropertyReportStatus`, dan pemetaan jumlah laporan aktif per properti.
5. **`functions/public/components/admin/PropertyManagement.tsx`** *(Modifikasi)*:
   - Menambahkan Tab Navigasi `Laporan Pengguna`, tabel manajemen laporan, badge counter laporan, dan tombol aksi 1-klik (Freeze, WA Pemilik, WA Pelapor, Resolve, Dismiss).

---

## 3. Langkah-Langkah Eksekusi (Setelah Persetujuan / ACC)

1. **Langkah 1**: Buat helper `submitPropertyReport` di `userService.ts` dan `notifyAdminPropertyReport` di `emailService.ts`.
2. **Langkah 2**: Tambahkan tombol dan modal laporan interaktif pada `KostDetail.tsx` dengan konversi foto bukti WebP.
3. **Langkah 3**: Buat helper data laporan admin di `adminService.ts` (`getPropertyReports`, `updatePropertyReportStatus`).
4. **Langkah 4**: Integrasikan tab dan tabel manajemen laporan pada `PropertyManagement.tsx` lengkap dengan aksi moderasi (Bekukan, WA Pemilik, WA Pelapor, Selesai, Abaikan).
5. **Langkah 5**: Uji build `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
6. **Langkah 6**: Catat riwayat progres di `functions/PROGRESS.md` (Fitur #226) dan buat `WALKTHROUGH.md`.
7. **Langkah 7**: Lakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Uji Kompilasi**: Menjalankan `npm run build` di `functions/public/` untuk memastikan kelulusan build TypeScript & Vite.
- **Uji Pengguna Publik (`KostDetail.tsx`)**:
  - Buka halaman detail kost `/kost/:id`.
  - Klik tombol "Laporkan Iklan Ini".
  - Pilih kategori laporan (misal: "Harga / Fasilitas Tidak Sesuai Realita").
  - Isi rincian laporan dan nomor WhatsApp.
  - Kirim laporan dan pastikan modal menampilkan konfirmasi sukses.
- **Uji Admin Dashboard (`PropertyManagement.tsx`)**:
  - Buka menu "Kelola Kost" di Dashboard Admin.
  - Cek tab "Laporan Pengguna" dan pastikan laporan yang baru dikirim tampil dengan benar.
  - Uji tombol "Chat WhatsApp Pelapor" dan "Chat WhatsApp Pemilik".
  - Uji tombol "Bekukan Listing" langsung dari baris laporan.
  - Uji perubahan status laporan ke "Selesai" atau "Abaikan".
