# Rencana Implementasi: Penambahan Tombol Batalkan Pengajuan pada Status 'Menunggu Pembayaran' & 'Menunggu Persetujuan' di Menu Kost Saya

Dokumen ini menganalisis penyebab hilangnya tombol pembatalan pengajuan sewa ketika status sudah disetujui (Menunggu Pembayaran) dan menyusun langkah perbaikan sistematis.

---

## 1. Analisis Masalah

### Kondisi Saat Ini:
1. Pada menu **"Kost Saya"** ([`MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx)), tombol **"Batalkan Pengajuan"** saat ini dipasang dengan kondisi kaku:
   ```tsx
   {kost.status === 'PENDING_APPROVAL' && (
       <button onClick={() => handleCancelBooking(kost)} ...>
           <XCircle /> Batalkan Pengajuan
       </button>
   )}
   ```
2. Ketika pengajuan sewa telah disetujui oleh admin/pengelola KostManager, status pengajuan otomatis berpindah dari `PENDING_APPROVAL` ke `AWAITING_PAYMENT` ("MENUNGGU PEMBAYARAN" dengan batas waktu pembayaran 1x24 jam).
3. Karena statusnya adalah `AWAITING_PAYMENT`, pengecekan `kost.status === 'PENDING_APPROVAL'` bernilai `false`. Akibatnya:
   - Kartu hanya menampilkan tombol: **"BAYAR SEKARANG"**, **"RUTE KE KOST"**, dan **"BANTUAN KOSTMANAGER"**.
   - Tombol **"Batalkan Pengajuan"** hilang dari kartu, sehingga calon penghuni tidak dapat membatalkan pengajuan jika berubah pikiran sebelum melakukan pembayaran.

---

## 2. Solusi yang Direncanakan

1. **Perluasan Kondisi Tombol "Batalkan Pengajuan" di [`MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx)**:
   - Menampilkan tombol **"Batalkan Pengajuan"** untuk semua transaksi sewa yang masih dalam tahap pengajuan aktif (`PENDING_APPROVAL`, `AWAITING_PAYMENT`, `PENDING`), selama pembayaran belum diselesaikan dan belum kedaluwarsa.
   - Memberikan styling yang konsisten, bersih, dan elegan dengan tombol konfirmasi peringatan sebelum membatalkan.

2. **Dukungan Pembatalan Berbasis Sesi di [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)**:
   - Memperbarui `cancelBookingRequest(transactionId, sessionId)` agar jika transaksi memiliki `booking_session_id`, seluruh transaksi tagihan pecahan/pendamping dalam sesi yang sama ikut ditandai berstatus `CANCELLED`.
   - Mengembalikan data kartu yang dibatalkan ke tab **"Riwayat"** (dengan label status *Dibatalkan*), menjaga tab *Diajukan* tetap bersih.

3. **Sinkronisasi Otomatis ke Portal KostManager**:
   - Status transaksi otomatis berubah menjadi `CANCELLED`.
   - Di Portal KostManager (`/dashboard-admin/km_bookings`), baris pengajuan sewa langsung berlabel **`Dibatalkan Calon Penghuni`** pada tab filter *Ditolak / Batal*.

---

## 3. Dampak Perubahan File

| No | File | Perubahan yang Akan Dilakukan |
|---|---|---|
| 1 | [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Mengaktifkan tombol *Batalkan Pengajuan* untuk status `PENDING_APPROVAL` & `AWAITING_PAYMENT`, serta meneruskan `booking_session_id` ke handler pembatalan. |
| 2 | [`functions/public/userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts) | Menambahkan parameter opsional `sessionId` pada `cancelBookingRequest` untuk membatalkan seluruh transaksi dalam 1 sesi booking secara tuntas. |
| 3 | `functions/PROGRESS.md` & `WALKTHROUGH.md` | Pencatatan riwayat progres & penerbitan walkthrough pengujian. |

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

1. **Langkah 1: Modifikasi `userService.ts`**
   - Update `cancelBookingRequest` untuk membatalkan transaksi utama dan transaksi dengan `booking_session_id` yang sama.
2. **Langkah 2: Modifikasi `MyKost.tsx`**
   - Perbarui kondisi tombol *Batalkan Pengajuan* di sidebar aksi kartu sewa.
   - Panggil `cancelBookingRequest(kost.id, kost.metadata?.booking_session_id)` dan segarkan data list `fetchMyKosts()`.
3. **Langkah 3: Uji Kompilasi & Build**
   - Menjalankan `npm run build` di `functions/public/` untuk memastikan 0 error kompilasi TypeScript.
4. **Langkah 4: Pencatatan Progres & Git Push**
   - Mencatat ke `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
   - Melakukan `git commit` dan `git push` ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- **Verifikasi UI**: Memastikan tombol "Batalkan Pengajuan" muncul di bawah tombol "Bantuan KostManager" pada tab "Diajukan" saat status "Menunggu Pembayaran".
- **Verifikasi Alur Pembatalan**: Saat tombol diklik dan dikonfirmasi, status booking di Supabase berubah menjadi `CANCELLED` dan kartu berpindah ke tab "Riwayat".
- **Verifikasi Portal KostManager**: Memastikan status booking di `/dashboard-admin/km_bookings` berubah menjadi *Dibatalkan Calon Penghuni*.
- **Verifikasi Build**: `npm run build` lulus 100% tanpa error.
