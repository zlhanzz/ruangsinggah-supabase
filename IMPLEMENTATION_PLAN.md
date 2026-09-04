# IMPLEMENTATION PLAN: Perbaikan Foreign Key Constraint `resident_status_kost_id_fkey` saat Hapus Properti Permanen

## 1. Analisis Masalah / Kebutuhan
- **Pesan Kesalahan**:
  ```text
  Gagal menghapus properti permanen: update or delete on table "properties" violates foreign key constraint "resident_status_kost_id_fkey" on table "resident_status"
  ```
- **Akar Masalah**:
  1. Pada database PostgreSQL Supabase, tabel `resident_status` memiliki *foreign key constraint* `resident_status_kost_id_fkey` yang menghubungkan kolom `kost_id` ke `properties.id`.
  2. Constraint tersebut dibuat tanpa opsi `ON DELETE CASCADE`.
  3. Ketika Administrator melakukan aksi **Hapus Permanen** di Portal KostManager atau Dashboard Admin, fungsi `deleteProperty(propertyId)` di [`adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) langsung mencoba mengeksekusi `DELETE FROM properties WHERE id = propertyId`.
  4. Karena properti tersebut memiliki data anak yang masih tersimpan di tabel `resident_status` (riwayat penghuni/kamar), PostgreSQL menolak penghapusan baris induk (*parent row*) untuk mencegah terjadinya *orphan records*.
  5. Selain `resident_status`, tabel relasional lain yang berpotensi memiliki data anak terikat pada properti adalah `rooms`, `room_bookings`, `complaints`, `chat_sessions`, `property_reports`, dan `mitra_kostmanager`.

---

## 2. Rencana Solusi Komprehensif

### A. Mekanisme Pembersihan Dependensi Berjenjang (*Defensive Cascade Cleanup*) di [`adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)
Sebelum baris induk properti dihapus dari tabel `properties`, fungsi `deleteProperty` akan membersihkan seluruh data relasional anak dengan urutan aman:
1. **Amankan Transaksi Terkait (`transactions`)**:
   - Cari data `resident_status` yang memiliki `kost_id = propertyId`.
   - Jika terdapat transaksi yang menyimpan pointer `resident_status_id`, lakukan `update { resident_status_id: null }` agar histori keuangan tetap tersimpan dan tidak memblokir penghapusan baris `resident_status`.
2. **Hapus Data Penghuni (`resident_status`)**:
   - Hapus seluruh baris di tabel `resident_status` yang memiliki `kost_id = propertyId`.
3. **Hapus Data Kamar & Pemesanan Kamar (`rooms` & `room_bookings`)**:
   - Ambil daftar ID kamar (`rooms`) yang memiliki `property_id = propertyId`.
   - Hapus pemesanan kamar di `room_bookings` untuk kamar-kamar tersebut.
   - Hapus baris kamar di tabel `rooms`.
4. **Hapus Komplain & Laporan (`complaints` & `property_reports`)**:
   - Hapus baris di `complaints` dengan `kost_id = propertyId`.
   - Hapus baris di `property_reports` dengan `property_id = propertyId`.
5. **Hapus Sesi Chat (`chat_sessions`)**:
   - Hapus baris di `chat_sessions` dengan `property_id = propertyId` (pesan di dalamnya otomatis terhapus karena foreign key `session_id` memiliki `ON DELETE CASCADE`).
6. **Hapus Metadata KostManager (`mitra_kostmanager`)**:
   - Hapus baris di `mitra_kostmanager` dengan `property_id = propertyId` atau `id = propertyId`.
7. **Hapus Media dari Supabase Storage**:
   - Hapus seluruh file gambar dan video dari bucket storage (sudah berjalan baik).
8. **Hapus Properti Utama (`properties`)**:
   - Mengeksekusi penghapusan baris di tabel `properties` setelah seluruh dependensi anak bersih 100%.

### B. Penyempurnaan UX pada Modal Hapus di [`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)
- Menampilkan pesan status loading yang informatif saat proses penghapusan berjenjang sedang berlangsung (*"Sedang membersihkan relasi data & media..."*).
- Menampilkan notifikasi sukses yang jelas dan menangani pesan error dengan transparan jika terjadi kendala jaringan.

### C. Penyediaan Skrip DDL Database (`CASCADE_RESIDENT_STATUS_FK.sql`)
- Menyediakan file skrip SQL di root project agar pengembang/admin dapat memperbarui constraint di Supabase SQL Editor:
  ```sql
  ALTER TABLE public.resident_status
  DROP CONSTRAINT IF EXISTS resident_status_kost_id_fkey;

  ALTER TABLE public.resident_status
  ADD CONSTRAINT resident_status_kost_id_fkey
  FOREIGN KEY (kost_id)
  REFERENCES public.properties(id)
  ON DELETE CASCADE;
  ```
  *(Catatan: Solusi kode di `adminService.ts` tetap menjamin penghapusan berhasil bahkan jika skrip SQL belum dijalankan di database).*

---

## 3. Dampak Perubahan (Files to Touch)

1. **[`functions/public/adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)**:
   - Memperbarui fungsi `deleteProperty` untuk mengeksekusi pembersihan dependensi relasional berjenjang sebelum menghapus baris properti.
2. **[`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)**:
   - Menyempurnakan penanganan modal konfirmasi hapus dan feedback error/sukses.
3. **`CASCADE_RESIDENT_STATUS_FK.sql`** (File baru di workspace root):
   - Skrip SQL migrasi untuk menambahkan `ON DELETE CASCADE` pada constraint `resident_status_kost_id_fkey`.

---

## 4. Langkah-Langkah Eksekusi (Hanya Setelah di-ACC)
1. Modifikasi `deleteProperty` di [`adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) dengan logika *cascade cleanup*.
2. Modifikasi `handleConfirmDelete` di [`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) untuk feedback yang lebih optimal.
3. Buat file `CASCADE_RESIDENT_STATUS_FK.sql`.
4. Jalankan pengujian kompilasi:
   - Frontend: `cmd /c npm run build` di `functions/public/`
   - Backend: `cmd /c npm run build` di `functions/`
5. Catat progres ke `functions/PROGRESS.md` (Entri 331).
6. Buat `WALKTHROUGH.md` dan push perubahan ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi
- **Kompilasi**: Memastikan `npm run build` di frontend dan `tsc` di backend sukses dengan 0 error.
- **Validasi Alur Penghapusan**: Mengonfirmasi bahwa setiap tahapan penghapusan data anak (`resident_status`, `rooms`, dll.) ditangani dengan blok try-catch yang aman sehingga tidak menghentikan proses pembersihan data lainnya.
   - Memastikan badge status auto-pilot berubah menjadi merah jika kost berstatus suspended/banned.
2. **Verifikasi Aksi Banned**:
   - Menguji alur pembekuan dengan memasukkan alasan pelanggaran.
   - Memverifikasi status berubah di tabel dan tombol berubah menjadi opsi "Pulihkan".
3. **Verifikasi Aksi Hapus Permanen**:
   - Menguji modal konfirmasi keamanan ganda dan memastikan penghapusan berjalan tuntas tanpa crash.
4. **Verifikasi Build**:
   - Memastikan `npm run build` berhasil tanpa error TypeScript.
