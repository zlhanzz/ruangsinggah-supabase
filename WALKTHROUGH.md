# Dokumen Walkthrough: Perbaikan Kartu Pengajuan Sewa Ulang & Sinkronisasi Status Check-Out KostManager

Dokumen ini menjelaskan secara rinci perbaikan yang telah dilakukan untuk mengatasi masalah kartu pengajuan sewa ulang yang tidak muncul di menu "Kost Saya", serta penyelarasan status check-out pada menu "Pengajuan Sewa" di Portal KostManager.

---

## 1. Ringkasan Masalah yang Diselesaikan

1. **Kartu Pengajuan Sewa Ulang Tidak Muncul di "Kost Saya" (`MyKost.tsx`)**:
   - Setelah akun dikeluarkan dari status penghuni (check-out), kartu hunian lama berhasil keluar dari tab **Aktif**.
   - Namun, saat pengguna mencoba mengajukan sewa baru untuk uji coba, kartu pengajuan tidak muncul di menu "Kost Saya".
   - **Penyebab**: Logika deduplikasi `uniqueKosts` di front-end mengelompokkan riwayat booking hanya berdasarkan kombinasi properti & tipe kamar (`${curr.kostId}_${curr.roomType}`). Transaksi lama berstatus `PAID` (skor prioritas 4) menimpa dan membuang (*discarded*) transaksi baru berstatus `PENDING_APPROVAL` (skor prioritas 2).
2. **Status Booking Lama Masih "Lunas & Aktif" di Portal KostManager (`KostManagerPortal.tsx`)**:
   - Pada menu **Pengajuan Sewa** (`km_bookings`), baris booking transaksi lama selalu menampilkan badge `Lunas & Aktif` secara statis tanpa memeriksa apakah penghuni tersebut sudah check-out (`resident_status: 'CHECKED_OUT'`).
   - Counter KPI **Disetujui & Lunas** masih menghitung seluruh transaksi `PAID` termasuk yang sudah move-out.
   - Admin tidak mendapatkan pembaruan data secara langsung ketika berpindah tab atau saat ada pengajuan sewa baru yang masuk di tengah sesi.

---

## 2. Rincian Modifikasi Kode

### A. Halaman Penyewa (`functions/public/pages/MyKost.tsx`)
1. **Deduplikasi Session-Aware**:
   - Pengambilan riwayat `resident_status` dimajukan sebelum pembentukan `uniqueKosts`.
   - Key deduplikasi kini menggunakan pembeda sesi atau penanda status:
     - Jika memiliki `booking_session_id`, key adalah `session_${booking_session_id}`.
     - Jika transaksi sedang berjalan (*in-flight* seperti `PENDING_APPROVAL` / `WAITING_PAYMENT`), key diisolasi per ID transaksi: `pending_${kostId}_${roomType}_${id}`.
     - Jika transaksi sudah selesai / lampau, key menjadi `history_${kostId}_${roomType}_${id}`.
   - Hal ini menjamin pengajuan sewa baru tidak akan pernah tertelan oleh transaksi lama.
2. **Penandaan `is_checked_out` & Tab Riwayat**:
   - Properti `is_checked_out` disematkan pada setiap item di `activeWithBills`.
   - Filter dan counter tab **Riwayat** diperbarui untuk menampilkan hunian yang telah selesai sewa (check-out).
3. **Penyempurnaan Modal Komplain**:
   - Modal komplain dilengkapi pilihan kategori masalah (AC, Sanitasi, Listrik, WiFi, dll.), selektor tingkat urgensi (*Normal* vs *Darurat*), kompresi gambar otomatis client-side ke format WebP (sesuai aturan Aturan Baku #5), dan tombol cepat WhatsApp ke pengelola kost.

### B. Portal KostManager (`functions/public/components/admin/KostManagerPortal.tsx`)
1. **Penetapan Status `is_checked_out` pada Riwayat Booking**:
   - Pada proses pengelompokan booking (`groupedBookingsMap`), setiap baris diperiksa silang dengan data `allResidents` dan metadata transaksi (`checkout_at`, `resident_status === 'CHECKED_OUT'`).
2. **Penyelarasan Badge Status & KPI**:
   - Jika transaksi berstatus `PAID` dan penghuni belum keluar ➔ Menampilkan badge hijau: `<CheckCircle2 /> Lunas & Aktif`.
   - Jika transaksi berstatus `PAID` dan penghuni sudah check-out ➔ Menampilkan badge abu-abu netral: `<CheckCircle2 /> Selesai (Check-Out)`.
   - Kartu KPI **Disetujui & Lunas** hanya menghitung penyewa yang masih aktif (`!b.is_checked_out`).
3. **Tab Filter Baru & Tombol Segarkan Data**:
   - Ditambahkan tombol filter cepat **Selesai (Check-Out)** di bilah filter pengajuan sewa.
   - Ditambahkan tombol **Segarkan Data** dengan icon putar pada header portal untuk memudahkan pembaruan data kapan saja.
   - Pemuatan data latar belakang (*background refresh*) aktif secara otomatis setiap kali admin berpindah tab.
4. **Penyempurnaan `handleCheckoutTenant`**:
   - Saat proses check-out dijalankan, selain mengosongkan unit kamar di `properties` dan `mitra_kostmanager` serta memperbarui `resident_status`, metadata transaksi terkait di tabel `transactions` juga ditandai dengan `resident_status: 'CHECKED_OUT'` dan timestamp `checkout_at`.

---

## 3. Hasil Pengujian & Verifikasi

- **Kompilasi TypeScript & Vite Build Frontend**:
  - Perintah: `npm run build` di `functions/public/`
  - Hasil: **Lulus 100% dengan exit code 0** (0 error TypeScript).
  - Ringkasan modul: `2531 modules transformed` dalam `49.56s`.

---

## 4. Panduan Verifikasi untuk Pengguna

1. **Uji Pengajuan Sewa Ulang (Sisi Penyewa)**:
   - Buka halaman **Kost Saya** (`/my-kost`).
   - Pada tab **Aktif / Pengajuan**: Kartu pengajuan sewa baru yang baru saja diajukan kini akan tampil dengan jelas lengkap dengan status *"Menunggu Persetujuan Admin"* atau tombol instruksi pembayaran.
   - Pada tab **Riwayat**: Sewa lama yang telah di-check-out akan muncul rapi sebagai riwayat hunian selesai.
2. **Uji Menu Pengajuan Sewa (Sisi KostManager)**:
   - Buka menu **Pengajuan Sewa** (`/dashboard-admin/km_bookings`) di portal admin.
   - Klik tombol **Segarkan Data** di pojok kanan atas jika diperlukan.
   - Transaksi sewa lama milik akun yang telah keluar kini memiliki badge **Selesai (Check-Out)**, sementara pengajuan sewa baru yang berstatus `PENDING_APPROVAL` akan muncul di tab **Menunggu Persetujuan**.
