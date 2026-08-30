# Rencana Implementasi: Sistem Manajemen Laporan Kendala Penghuni di Portal KostManager & Form Lapor In-App (`MyKost.tsx` & `KostManagerPortal.tsx`)

Dokumen ini menganalisis kebutuhan dan merancang arsitektur sistem pengelolaan komplain/kendala fasilitas kamar terpusat di Portal KostManager, menggantikan alur WhatsApp langsung dengan alur pelaporan in-app dan fitur penerusan (*forwarding*) ke pemilik kost.

---

## 1. Analisis Masalah & Kebutuhan Fitur

### Kondisi Saat Ini:
- Tombol **"Lapor Kendala Kamar"** pada kartu hunian aktif di [`MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) saat ini langsung membuka WhatsApp chat umum (`handleReportIssueWhatsApp`), sehingga komplain tidak terdata secara rapi di database operasional.
- Di **Portal KostManager** ([`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)), belum tersedia menu/tab khusus untuk menampung, memantau, dan mengelola tiket laporan kendala penghuni untuk seluruh kost terkelola.

### Kebutuhan Pengembangan:
1. **Formulir Pelaporan In-App di Sisi Penghuni (`MyKost.tsx`)**:
   - Tombol *"Lapor Kendala Kamar"* diubah agar memicu formulir modal in-app (`handleOpenComplaint`).
   - Penghuni dapat memilih kategori kendala (AC, Listrik, Air/Pipa, Kebersihan, Furnitur/Kunci, dll.), tingkat urgensi (Normal vs 🚨 Darurat), menulis judul & rincian masalah, serta melampirkan foto bukti (otomatis dikompresi ke WebP).
   - Data tersimpan terstruktur di tabel `complaints` Supabase.
2. **Menu Baru di Portal KostManager: "Laporan Kendala" (`KostManagerPortal.tsx`)**:
   - **Tab Sidebar**: Menambahkan tab `{ key: 'complaints', icon: '🛠️', label: 'Laporan Kendala' }` dengan badge jumlah kendala aktif (*open / in_progress*).
   - **Filter & Search**: Filter status (`Semua`, `Baru Masuk`, `Sedang Diproses`, `Selesai`), filter urgensi (`Semua`, `Darurat`, `Normal`), serta pencarian berdasarkan nama penghuni, nomor kamar, kost, atau deskripsi.
   - **Visualisasi Tiket Kendala Modern**: Menampilkan kartu/tabel interaktif berisi informasi lengkap: Properti, Unit Kamar, Penghuni & WhatsApp, Kategori, Urgensi, Lampiran Foto (dengan preview modal), dan Waktu Lapor.
   - **Fitur "📲 Teruskan ke Pemilik Kost (WhatsApp)"**: Generator pesan WhatsApp otomatis 1-klik yang ditujukan ke pemilik properti (`owner_phone`) berisi template profesional rangkuman kendala penghuni.
   - **Pengubahan Status Penanganan**: Aksi update status ke `Sedang Diproses (in_progress)` atau `Selesai (resolved)` disertai notifikasi ke penghuni.

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Mengarahkan tombol *"Lapor Kendala Kamar"* ke modal form in-app `handleOpenComplaint` dan memastikan penyimpanan ke tabel `complaints`. |
| 2 | [`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) | Menambahkan tab navigasi `complaints`, state & query `complaints` untuk properti terkelola, antarmuka manajemen tiket kendala, tombol update status, serta generator pesan WhatsApp ke pemilik kost. |
| 3 | `functions/PROGRESS.md` | Pencatatan riwayat progres fitur #216 (Anti-Amnesia). |
| 4 | `WALKTHROUGH.md` | Dokumentasi walkthrough hasil pengujian. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Langkah 1: Penyelarasan Tombol Pelaporan di `MyKost.tsx`**
   - Hubungkan tombol *"Lapor Kendala Kamar"* ke `handleOpenComplaint(kost)`.
   - Pastikan data komplain memuat `kost_id`, `kost_name`, `room_number`, `user_id`, `user_name`, `user_phone`, `category`, `urgency`, `title`, `description`, dan `photo_url`.
2. **Langkah 2: Integrasi Query Data Complaints di `KostManagerPortal.tsx`**
   - Tambahkan interface `ComplaintRecord` dan state `complaints`.
   - Di `loadAllData`, query tabel `complaints` yang berkaitan dengan `allManagedIds` (diurutkan tanggal terbaru).
3. **Langkah 3: Pendaftaran Tab Sidebar & Header di `KostManagerPortal.tsx`**
   - Tambahkan tab `{ key: 'complaints', icon: '🛠️', label: 'Laporan Kendala' }` di sidebar navigasi beserta badge counter laporan `open` / `in_progress`.
4. **Langkah 4: Pembuatan Tampilan Tab Laporan Kendala di `KostManagerPortal.tsx`**
   - Header ringkasan (Total Laporan, Menunggu Tindakan, Darurat, Selesai).
   - Filter Status, Urgensi, dan Pencarian teks.
   - Tabel/Kartu daftar kendala lengkap dengan badge urgensi, preview thumbnail foto, tombol WhatsApp penghuni, tombol status penanganan, dan tombol **"📲 Teruskan ke Pemilik Kost (WhatsApp)"**.
5. **Langkah 5: Pengujian Kompilasi & Build**
   - Jalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 0 error kompilasi.
6. **Langkah 6: Dokumentasi & Git Push**
   - Catat di `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Lakukan `git commit` dan `git push origin bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Alur Pelapor (Penyewa)**:
  - Buka halaman `Kost Saya` (`/my-bookings/aktif`) -> Klik tombol **"Lapor Kendala Kamar"** -> Isi detail kendala dan upload foto bukti -> Submit.
- **Verifikasi Alur Portal KostManager (Admin/Pengelola)**:
  - Buka **Portal KostManager** (`/dashboard-admin/km_complaints` atau klik tab *Laporan Kendala*).
  - Verifikasi tiket kendala muncul dengan data kamar, nama penghuni, kategori, foto, dan urgensi.
  - Klik tombol **"📲 Teruskan ke Pemilik Kost"** dan pastikan jendela WhatsApp terbuka dengan draft pesan rapi ke nomor pemilik kost terkait.
  - Klik tombol **"Tandai Diproses"** dan **"Tandai Selesai"** untuk memverifikasi perubahan status di database.
- **Verifikasi Build**:
  - `cmd /c npm run build` lulus 100% dengan 0 error.
