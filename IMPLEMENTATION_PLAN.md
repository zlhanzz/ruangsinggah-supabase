# IMPLEMENTATION PLAN: Sistem Manajemen Laporan Kendala Kamar & AI Automation Forwarder ke Pemilik Kost

Dokumen rencana kerja ini disusun sebagai **Fase 1 (Perencanaan & Pengajuan)** untuk membangun alur terpusat pelaporan kendala kamar dari sisi penghuni (`MyKost.tsx`) hingga pengelolaan operasional dan otomasi penerusan ke pemilik kost di Portal KostManager (`KostManagerPortal.tsx`).

---

## 1. Analisis Masalah & Kebutuhan

### A. Masalah Saat Ini
1. **Laporan Keluhan Belum Terpusat & Terstruktur**:
   - Tombol *"Lapor Kendala Kamar"* di menu "Kost Saya" (`MyKost.tsx`) saat ini langsung membuka WhatsApp ke nomor hotline CS dengan teks template mentah.
   - Keluhan penghuni tidak terekam dalam database sistem, tidak memiliki nomor tiket/riwayat, dan tidak dapat dipantau perkembangannya oleh penyewa maupun tim pengelola.
2. **Ketiadaan Tab Manajemen Kendala di Portal KostManager**:
   - Tim KostManager belum memiliki dashboard khusus untuk memantau inventaris kerusakan fasilitas, mengelompokkan urgensi (misal: pipa air bocor / mati lampu mendesak vs fasilitas pelengkap), maupun memperbarui status perbaikan (*Menunggu Tindakan*, *Sedang Dikerjakan*, *Selesai*).
3. **Penyampaian ke Pemilik Kost Masih Manual & Rentan Terlewat**:
   - Pemilik kost (mitra owner) membutuhkan laporan yang terstandardisasi, jelas, dan transparan mengenai unit kamar mana yang mengalami kendala, identitas penyewa, foto bukti fisik, dan rekomendasi tindak lanjut.

### B. Solusi yang Diajukan
1. **Modal Form Lapor Kendala Kamar Interaktif di Sisi Penghuni (`MyKost.tsx`)**:
   - Penghuni menekan tombol *"Lapor Kendala Kamar"* -> Muncul modal elegan dengan info otomatis properti & nomor unit kamar (*Kost Madani - Unit Kamar 3*).
   - Input pilihan kategori kendala yang rapi:
     - ❄️ *AC & Ventilasi*
     - 💧 *Air, Keran & Sanitasi*
     - ⚡ *Kelistrikan & Lampu*
     - 🛏️ *Fasilitas Kamar (Kasur, Lemari, Pintu)*
     - 📶 *WiFi & Internet*
     - 🧹 *Kebersihan & Area Bersama*
     - ❓ *Kendala Lainnya*
   - Pilihan tingkat urgensi: `Normal` atau `Mendesak (Emergency)`.
   - Deskripsi rincian kendala secara terperinci.
   - Unggah foto bukti kerusakan dengan kompresi otomatis ke `.webp` di sisi client sebelum upload (Standard Baku Workspace Rule #5).
   - Laporan disimpan ke tabel database `public.complaints`.
2. **Menu Manajemen Laporan Kendala di Portal KostManager (`KostManagerPortal.tsx`)**:
   - Menambahkan menu baru pada sidebar operasional: **`🛠️ Kendala & Pemeliharaan`** (`activeTab: 'complaints'` / `km_complaints`) lengkap dengan badge counter laporan baru (`open`).
   - **Kartu Ringkasan KPI**:
     - Total Laporan Masuk
     - Menunggu Tindakan (badge oranye/merah)
     - Sedang Ditangani / Diproses (badge biru)
     - Selesai Diatasi (badge hijau)
   - **Pencarian Cepat & Filter Status**: Filter berdasarkan status penanganan, pencarian nama penghuni, nama kost, nomor kamar, atau jenis kendala.
   - **Daftar Laporan Terstruktur**:
     - Kartu/tabel laporan menampilkan nama pelapor, link cepat WhatsApp penghuni, unit kamar, waktu lapor, badge urgensi, deskripsi lengkap, dan thumbnail foto bukti yang dapat diperbesar.
     - Kontrol aksi: Mengubah status menjadi *Sedang Ditangani* atau *Selesai*, serta mencatat catatan admin (*admin notes*).
3. **AI Automation & WhatsApp Forwarder ke Pemilik Kost**:
   - Tombol cerdas **"🤖 Teruskan ke Pemilik (AI)"** pada setiap tiket kendala:
     - Otomatis mencocokkan data properti dengan kontak pemilik (`p.owner_uid` / data kontak pengelola properti).
     - Menghasilkan format pesan resmi terstruktur dari RuangSinggah KostManager kepada pemilik kost.
     - Menandai tiket dengan status `Diteruskan ke Pemilik` disertai timestamp `owner_notified_at`.
4. **Skema Database & DDL (`COMPLAINTS_DDL.sql`)**:
   - Menyiapkan skrip SQL pembuatan tabel `public.complaints`, indeks relasi ke properti & user, serta konfigurasi Row Level Security (RLS) yang aman.

---

## 2. Dampak Perubahan (Files to Touch)

1. **[`functions/public/COMPLAINTS_DDL.sql`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/COMPLAINTS_DDL.sql)** *(File Baru)*:
   - Skema DDL tabel `public.complaints` beserta index dan RLS policies.
2. **[`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx)**:
   - Mengubah handler tombol "Lapor Kendala Kamar" agar membuka Modal Lapor Kendala.
   - Meningkatkan tampilan modal komplain dengan auto-selected kamar, kategori kendala, badge urgensi, dan kompresi WebP.
   - Memastikan pengiriman data ke tabel `complaints` berjalan mulus dengan error handling yang informatif.
3. **[`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)**:
   - Menambahkan opsi tab `complaints` pada navigasi sidebar dan router internal.
   - State data `complaintsList`, loader, fungsi fetch data dari tabel `complaints`.
   - Komponen visual tab `complaints`: KPI cards, filter pills, search input, tabel/kartu tiket, preview foto, dan status switcher.
   - Fitur AI-Assisted Forwarder ke WhatsApp pemilik kost dengan template pesan terstruktur resmi.
4. **[`functions/public/pages/Dashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx)**:
   - Mendaftarkan `km_complaints` ke union type `DashboardMenu` agar sinkron dengan routing URL admin.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Langkah 1: Penyusunan Skrip DDL Database (`COMPLAINTS_DDL.sql`)**:
   - Menulis file DDL lengkap dengan kolom `id`, `kost_id`, `kost_name`, `room_number`, `user_id`, `user_name`, `user_phone`, `category`, `urgency`, `title`, `description`, `photo_url`, `status`, `admin_notes`, `reported_to_owner`, `owner_notified_at`, `ai_summary`, `created_at`, `updated_at`.
2. **Langkah 2: Pembaruan Form Lapor Kendala Kamar di `MyKost.tsx`**:
   - Menghubungkan tombol "Lapor Kendala Kamar" ke modal input modern.
   - Menambahkan pilihan tag kategori kendala, radio tingkat urgensi, deskripsi, dan upload foto dengan konversi WebP otomatis.
   - Menghubungkan fungsi submit ke Supabase dengan graceful fallback.
3. **Langkah 3: Pembuatan Menu & Tampilan Manajemen Kendala di `KostManagerPortal.tsx`**:
   - Menambahkan tab `complaints` pada sidebar navigasi dengan icon vector `lucide-react` (`<Wrench size={18} />`).
   - Menyusun KPI statistik kendala (*Total, Menunggu Verifikasi, Sedang Diproses, Selesai*).
   - Menyusun tabel / kartu komplain dengan rincian unit kamar, nama pelapor, waktu lapor, tag kategori, tombol chat WA penghuni, dan foto bukti.
   - Menambahkan fungsi pembaruan status tiket (*In Progress* / *Resolved*).
   - Menambahkan fitur *"Teruskan ke Pemilik (AI)"* yang secara cerdas merangkum kendala dan membuka WhatsApp ke nomor kontak pemilik kost.
4. **Langkah 4: Sinkronisasi Tipe Menu di `Dashboard.tsx`**:
   - Menambahkan `km_complaints` ke `DashboardMenu`.
5. **Langkah 5: Kompilasi & Pengujian Kode**:
   - Menjalankan uji build `cmd /c npm run build` di `functions/public/` (memastikan 0 error TypeScript).

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi TypeScript & Vite**:
   - Menjalankan `cmd /c npm run build` dan memastikan build lulus tanpa error atau peringatan type mismatch.
2. **Verifikasi Alur Penghuni (`MyKost.tsx`)**:
   - Buka `/my-bookings/aktif` (tab Aktif).
   - Klik tombol **"Lapor Kendala Kamar"**.
   - Periksa modal terbuka dengan data unit kamar yang otomatis terisi (*Unit Kamar 3 - Kost Madani*).
   - Coba pilih kategori, isi deskripsi, unggah foto bukti, dan klik submit.
3. **Verifikasi Alur Admin KostManager (`KostManagerPortal.tsx`)**:
   - Buka `/dashboard-admin/km_complaints` (atau klik menu **Kendala & Pemeliharaan** pada sidebar KostManager).
   - Periksa tiket keluhan yang dikirim penghuni muncul dengan rincian lengkap (nama, nomor WA, kamar, kategori, status *Menunggu Tindakan*).
   - Uji tombol **"Teruskan ke Pemilik (AI)"**: pastikan ringkasan pesan terstruktur terbuat dengan rapi dan mengarah ke kontak pemilik.
   - Uji tombol ubah status (*Sedang Ditangani* & *Tandai Selesai*).
