# Walkthrough: Session-Aware Deduplikasi Booking 'Kost Saya' & Sinkronisasi Status Check-Out Portal KostManager

Dokumen ini merangkum perbaikan pada alur **Pengajuan Sewa Ulang (Re-booking)** di menu **"Kost Saya"** serta penyelarasan status riwayat penyewaan dan filter di **Portal KostManager**.

---

## 1. Ringkasan Masalah yang Diselesaikan

1. **Kartu Pengajuan Sewa Ulang Tidak Muncul di "Kost Saya"**:
   - Setelah pengguna melakukan check-out dari suatu kost, transaksi lama berstatus `PAID` tetap tercatat di database dengan status hunian `CHECKED_OUT`.
   - Ketika pengguna mengajukan sewa baru untuk kost tersebut, sistem membuat transaksi baru dengan status `PENDING_APPROVAL`.
   - Di `MyKost.tsx`, fungsi deduplikasi `uniqueKosts` mengelompokkan data berdasarkan key `${kostId}_${roomType}` dan memprioritaskan transaksi lama yang bernilai status lebih tinggi (`PAID` bernilai 4 vs `PENDING_APPROVAL` bernilai 2). Akibatnya transaksi baru dibuang (*discarded*).
2. **Status Pengajuan Lama Tetap "Lunas & Aktif" di Portal KostManager**:
   - Di menu "Pengajuan Sewa" KostManager (`/dashboard-admin/km_bookings`), baris transaksi lama tetap berlabel badge `Lunas & Aktif` karena kode sebelumnya hanya mengecek `status === 'PAID'` tanpa memeriksa apakah penghuni tersebut telah check-out.
3. **Data Booking Tidak Ter-Refresh Otomatis**:
   - Tab "Pengajuan Sewa" hanya mengambil data saat mount pertama (`loadAllData()`), sehingga saat pengguna mengirim pengajuan sewa baru, data tidak langsung muncul tanpa reload halaman secara manual.

---

## 2. Rincian Perubahan yang Telah Diterapkan

### A. Sisi Penyewa: Session-Aware Booking Deduplication (`MyKost.tsx`)
- **Pengambilan Status Lebih Awal**:
  Riwayat `resident_status` kini dimuat sebelum pembentukan `uniqueKosts` untuk mengidentifikasi ID transaksi dan `booking_session_id` yang telah berstatus `CHECKED_OUT`.
- **Deduplikasi Session-Aware**:
  Key deduplikasi kini membedakan antara sesi booking yang berbeda:
  ```typescript
  const sessionKey = curr.metadata?.booking_session_id 
      ? `session_${curr.metadata.booking_session_id}` 
      : (isInFlight ? `pending_${curr.kostId}_${(curr.roomType || '').toLowerCase()}_${curr.id}` : `history_${curr.kostId}_${(curr.roomType || '').toLowerCase()}_${curr.id}`);
  ```
  Dengan ini, pengajuan baru `PENDING_APPROVAL` tidak akan pernah ditelan oleh transaksi lama yang sudah check-out.
- **Penanda `is_checked_out` & Tab Riwayat**:
  Kartu hunian lama yang telah check-out otomatis diberi tanda `is_checked_out: true` dan dialihkan ke tab **Riwayat**, sedangkan pengajuan baru tampil rapi di tab **Diajukan**.

### B. Sisi Admin: Penyelarasan Status Check-Out & Auto-Refresh (`KostManagerPortal.tsx`)
- **Deteksi Otomatis Status Check-Out**:
  Setiap booking pada tabel pengajuan sewa diperiksa terhadap data `allResidents` dan metadata transaksi. Jika penghuni terkait telah melakukan check-out (`resident_status === 'CHECKED_OUT'` atau memiliki timestamp `checkout_at`), booking ditandai dengan `is_checked_out: true`.
- **Badge Status yang Akurat**:
  - Sewa aktif yang lunas: `<CheckCircle2 /> Lunas & Aktif` (Hijau emerald).
  - Sewa masa lalu yang telah keluar: `<CheckCircle2 /> Selesai (Check-Out)` (Abu-abu slate netral).
- **Statistik & Filter Tab Pengajuan Sewa**:
  - Kartu KPI **Disetujui & Lunas**: kini hanya menghitung penyewa yang benar-benar masih aktif (`activePaidBookings`).
  - Menambahkan filter pill khusus: **Selesai (Check-Out)** di bilah filter pengajuan sewa.
- **Auto-Refresh Data Latar Belakang**:
  `loadAllData` diperbarui untuk mendukung `showSpinner: boolean`. Setiap kali admin berpindah ke tab Pengajuan Sewa (`km_bookings`), data otomatis diperbarui di latar belakang tanpa mengganggu tampilan UI.
- **Pembaruan Metadata Saat Check-Out**:
  Di `handleCheckoutTenant`, transaksi terkait di tabel `transactions` ikut diperbarui dengan metadata `resident_status: 'CHECKED_OUT'` dan `checkout_at`.

---

## 3. Hasil Pengujian & Kompilasi

- **Uji Kompilasi Vite & TypeScript**:
  ```bash
  cmd /c npm run build
  ✓ 2531 modules transformed.
  ✓ built in 35.53s
  Exit code: 0 (Zero Errors)
  ```

---

## 4. Panduan Verifikasi Pengguna

1. **Cek Menu "Kost Saya" (Sisi Penyewa)**:
   - Buka `/my-kost` (tab **Diajukan**).
   - Kartu pengajuan sewa baru yang baru saja diajukan (status *Menunggu Persetujuan*) kini langsung tampil.
   - Pindah ke tab **Riwayat**: riwayat hunian sebelumnya yang telah selesai / check-out tampil tersimpan dengan rapi.
2. **Cek Menu "Pengajuan Sewa" (Sisi Admin KostManager)**:
   - Buka `/dashboard-admin/km_bookings`.
   - Transaksi baru dari calon penghuni akan muncul dengan status `Menunggu Persetujuan` (dapat disetujui / di-ACC).
   - Transaksi lama untuk kamar yang sama kini berstatus `Selesai (Check-Out)` (tidak lagi menipu sebagai "Lunas & Aktif").
   - Filter `Lunas & Aktif` dan `Selesai (Check-Out)` dapat difilter secara terpisah dengan akurat.
