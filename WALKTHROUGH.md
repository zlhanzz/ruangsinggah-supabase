# Walkthrough: Perbaikan Fitur Kosongkan Unit Kamar (Check-Out) & Sinkronisasi Hunian

Dokumen ini merangkum perbaikan pada fitur **"Kosongkan Unit Kamar" (Move-Out / Check-Out)** di Portal KostManager, sinkronisasi status kamar pada database, serta pembaruan tampilan di menu **"Kost Saya"** dari sisi penyewa.

---

## 1. Masalah yang Diselesaikan

1. **Tombol "Kosongkan Unit Kamar" Tidak Berfungsi**:
   - Di modal check-out KostManager, saat tombol *"Kosongkan Unit Kamar"* ditekan, kamar tidak berubah menjadi kosong dan status penyewaan penghuni tidak terputus.
   - **Akar Masalah**:
     - Logika matching kamar di `handleCheckoutTenant` hanya mengecek `rName === tenant.room_type` (`"Standard" !== "Kamar 3"`).
     - Nama penghuni `tenant.user?.name` tidak terisi lengkap pada record online sehingga loop gagal menemukan kamar yang harus dikosongkan.
     - Fungsi tidak melakukan mutasi status pada tabel `resident_status`.
     - Tabel `mitra_kostmanager` tidak ikut disinkronkan.
2. **Hunian Masih Muncul di Menu "Kost Saya" Sisi Penghuni**:
   - Halaman `MyKost.tsx` memetakan seluruh record `resident_status` ke tab *Aktif* tanpa memeriksa apakah record tersebut masih aktif (`status === 'ACTIVE'`).

---

## 2. Perubahan yang Dilakukan

### A. Perbaikan Logika Check-Out di Portal KostManager (`KostManagerPortal.tsx`)
- **Pencocokan Kamar Multi-Kriteria yang Presisi**:
  Pencocokan kamar target kini memeriksa:
  - Kecocokan nomor/nama kamar: `tenant.room_number`, `tenant.metadata?.roomNumber`, `tenant.metadata?.variantName`.
  - Normalisasi nama kamar (misal `"Kamar 3"` vs `"3"`).
  - Kecocokan nama penyewa: `tenant.user?.name`, `tenant.metadata?.userName`, `tenant.metadata?.tenantName`.
- **Pengosongan Unit Kamar Secara Menyeluruh**:
  Unit kamar yang cocok di-reset menjadi:
  - `status: 'Kosong'`
  - `isAvailable: true`
  - `residentName: ''`, `residentPhone: ''`, `startDate: ''`, `endDate: ''`
- **Sinkronisasi Ganda (`properties` & `mitra_kostmanager`)**:
  Array `room_types` yang sudah diperbarui langsung disimpan ke tabel `properties` dan disinkronkan ke tabel `mitra_kostmanager`.
- **Pembaruan Status Sewa di `resident_status`**:
  Jika record sewa berasal dari tabel `resident_status`, status diubah menjadi `'CHECKED_OUT'` disertai catatan serah terima (`checkout_notes`) dan waktu pengosongan (`checkout_at`).
- **Filter Penghuni Aktif**:
  Daftar penghuni di Portal KostManager (`managedResidents`) disaring agar hanya menampilkan status `'ACTIVE'`.

### B. Sinkronisasi Tampilan di Sisi Penghuni (`MyKost.tsx`)
- Tab **Aktif** (`processedActive`) kini hanya menyertakan hunian yang berstatus `'ACTIVE'`.
- Penyewa yang telah di-checkout (`CHECKED_OUT` / `COMPLETED`) tidak lagi muncul di tab hunian aktif, melainkan otomatis masuk ke tab **Riwayat**.

---

## 3. Hasil Pengujian & Kompilasi

- **Uji Kompilasi Vite**:
  ```bash
  cmd /c npm run build
  ✓ 2531 modules transformed.
  ✓ built in 1m 1s (exit code 0)
  ```
  Tidak ada error tipe (*zero TypeScript errors*).

---

## 4. Panduan Verifikasi bagi Pengguna

1. **Buka Portal KostManager**:
   - Masuk ke tab **Daftar Penghuni** pada properti yang dikelola.
   - Pilih penghuni pada unit kamar tertentu (misalnya *Kamar 3*).
   - Klik tombol titik tiga (opsi) lalu pilih **Proses Check-Out**.
   - Masukkan catatan serah terima (opsional) lalu klik **Kosongkan Unit Kamar**.
2. **Verifikasi di Portal KostManager**:
   - Penghuni tersebut akan otomatis keluar dari daftar penghuni aktif.
   - Pada tab **Daftar Kamar / Tingkat Hunian**, unit kamar (misal *Kamar 3*) kini berstatus **Kosong** (hijau/tersedia).
3. **Verifikasi di Halaman "Kost Saya" (Sisi Penghuni)**:
   - Login dengan akun penghuni yang telah di-checkout.
   - Buka menu **Kost Saya** -> Tab **Aktif**.
   - Kartu hunian kost tersebut sudah tidak muncul di tab *Aktif*.
   - Buka Tab **Riwayat**: Catatan sewa masa lalu kini tampil di tab riwayat penyewaan.
