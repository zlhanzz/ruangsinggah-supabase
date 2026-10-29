# IMPLEMENTATION PLAN: Audit Masif & Standarisasi Dashboard Mitra Sesuai Realita Operasional

**ID Rencana**: PLAN-MITRA-001  
**Tanggal Pengajuan**: 29 Oktober 2026 (Revisi Tajam Berdasarkan Model Operasional Mitra Biasa vs KostManager)  
**Status**: Menunggu Persetujuan Pengguna (Waiting for User Approval)  

---

## 1. Analisis Masalah & Validasi Model Bisnis

### A. Validasi Analisis Pengguna: Mengapa "Tingkat Okupansi" Tidak Berlaku untuk Mitra Biasa
Analisis pengguna 100% tepat dan mencerminkan realita operasional:
1. **Mitra Biasa (Marketplace Listing)**:
   - Berfungsi sebagai **saluran pemasaran kamar kosong (*lead generation*)**.
   - Pemilik mendaftarkan kost untuk mencari penghuni baru bagi kamar yang sedang kosong.
   - Pemilik **TIDAK mendata penghuni lama yang sudah menetap secara offline** (yang bayar cash/transfer langsung ke pemilik).
   - Menghitung "Tingkat Okupansi" dari data transaksi aplikasi akan menghasilkan angka semu/menyesatkan (misal: kos punya 20 kamar di mana 18 kamar sudah terisi offline, lalu sistem menampilkan okupansi "5%" hanya karena baru 1 orang yang booking via RuangSinggah).
   - **Metrik Relevan untuk Mitra Biasa**:
     - **Kamar Kosong Dipasarkan (*Active Vacancies*)**: Jumlah unit kamar kosong yang saat ini sedang aktif dicari penyewanya di RuangSinggah (`availableRoomCount`).
     - **Penghuni via RuangSinggah**: Jumlah penyewa aktif yang berhasil didatangkan melalui aplikasi.
     - **Pendapatan Bersih via Aplikasi**: Total sewa yang diterima melalui RuangSinggah.
     - **Permintaan Masuk**: Pengajuan sewa baru yang butuh persetujuan.

2. **Mitra KostManager (Full Management)**:
   - Dikelola penuh oleh tim RuangSinggah. Seluruh kamar (penghuni lama maupun baru) di-onboard dan ditagih otomatis oleh sistem.
   - Pada model ini, metrik **Tingkat Okupansi Properti (%)** baru memiliki basis data riil dan akurat.

---

### B. Temuan Fatal: Kebocoran Data Penghuni Aktif (*Active Tenant Leakage*)
Calon penyewa yang baru berada pada tahap pengajuan sewa (**`PENDING_APPROVAL`**, belum di-ACC dan belum membayar) sudah tercatat di **Database Penghuni** dengan badge **"AKTIF"**, badge sidebar **Penghuni Aktif (1)**, Total Tagihan **Rp 0**, dan tombol **"TAGIH"** serta **"SELESAI"**.

#### Titik Kebocoran di Kode:
1. **Pencatatan Preemptif di `userService.ts` (`createBooking`)**:
   - `createBooking` langsung melakukan insert ke `resident_status` dengan status `'PENDING'`.
2. **Ketiadaan Filter di `adminService.ts` (`getResidentStatus`)**:
   - `getResidentStatus` mengambil semua baris tanpa menyaring status `ACTIVE`, sehingga baris `PENDING` ikut terbawa ke frontend.
3. **Kalkulasi Counter di `MitraDashboard.tsx`**:
   - `activeCount` menghitung setiap baris yang memiliki `daysLeft >= 0` tanpa memverifikasi status `r.status === 'ACTIVE'` dan status transaksi `PAID`.
4. **Fallback Label "AKTIF" di `MitraTenantManagement.tsx`**:
   - Komponen merender badge `AKTIF` dan total Rp 0 secara default jika bukan masa tenggang.

---

### C. Ringkasan Solusi Modul Dashboard Mitra

| Modul Dashboard | Kondisi Saat Ini | Solusi Baru Berdasarkan Realita Operasional |
|---|---|---|
| **1. Database Penghuni (*Tenants*)** | Calon penyewa belum bayar bocor ke penghuni aktif. Nilai total Rp 0. | **Hanya Menampilkan Penyewa Lunas**: Calon penyewa `PENDING_APPROVAL` atau `AWAITING_PAYMENT` **dilarang masuk** ke Database Penghuni. Counter badge sidebar hanya menghitung penghuni yang kontraknya berjalan dan transaksinya `PAID`. |
| **2. Klasifikasi Kamar** | Rancu antara nomor kamar fisik vs kategori tipe kamar. | **Mitra Biasa**: Menggunakan **Tipe Kamar** (misal: *Kamar Standard • 1 Orang*). <br>**KostManager**: Menggunakan **Nomor Kamar Fisik** (misal: *Kamar A-02*). |
| **3. Kartu Metrik Beranda (*Overview KPI*)** | Menampilkan CTR (metrik digital marketing abstrak). | Mengganti CTR dengan **Kamar Siap Sewa (*Kamar Kosong Dipasarkan*)** yang dihitung dari total kuota `availableRoomCount` tipe kamar yang dipasarkan. |
| **4. Manajemen Pesanan (*Bookings*)** | Pesanan ditolak/kadaluarsa tidak terlacak. | Menambahkan **Countdown SLA Respon Pemilik (1x24 Jam)** dan filter riwayat **Dibatalkan / Kadaluarsa**. |
| **5. Tombol Aksi Penghuni** | Tombol Tagih dan Selesai muncul keliru pada sewa Rp 0. | Tombol disesuaikan hanya untuk penghuni aktif riil yang memiliki transaksi lunas. |

---

## 2. Dampak Perubahan File

1. **`functions/public/services/userService.ts` (atau `functions/public/userService.ts`)**:
   - Memastikan `createBooking` tidak mengizinkan calon penyewa dihitung sebagai penghuni aktif sebelum pembayaran lunas.
2. **`functions/public/adminService.ts`**:
   - Memperbaiki `getResidentStatus` agar memfilter `status = 'ACTIVE'` secara default untuk view database penghuni, dan mengecualikan baris `PENDING`.
3. **`functions/public/pages/MitraDashboard.tsx`**:
   - Memperbaiki kalkulasi `stats.activeTenants`: hanya menghitung `r.status === 'ACTIVE' && daysLeft >= 0`.
   - Mengganti kartu stat **CTR** dengan **Kamar Siap Sewa** (Total kamar kosong yang dipasarkan mitra).
   - Menambahkan tab atau filter **Dibatalkan / Kadaluarsa** di menu Pesanan.
4. **`functions/public/components/mitra/MitraTenantManagement.tsx`**:
   - Menghapus kebocoran calon penyewa: Data pengajuan sewa belum lunas tidak akan tampil di daftar ini.
   - Menampilkan label **Tipe Kamar** yang bersih untuk Mitra Biasa tanpa error nomor kamar.
5. **`functions/PROGRESS.md` & `WALKTHROUGH.md`**:
   - Dokumentasi progres #471 dan laporan hasil pengujian.

---

## 3. Langkah-Langkah Eksekusi (Secara Bertahap)

### Tahap 1: Eliminasi Total Kebocoran Calon Penyewa ke Database Penghuni
1. Perbaiki query `getResidentStatus` di `adminService.ts` agar menyaring baris `resident_status` yang berstatus `ACTIVE` atau `EXPIRING`, dan mengecualikan baris `PENDING`, `REJECTED`, `EXPIRED`, `CANCELLED`.
2. Perbaiki fungsi penghitungan `activeCount` di `MitraDashboard.tsx`:
   - Validasi: `r.status === 'ACTIVE' && daysLeft >= 0`.
   - Menjamin angka badge di sidebar **Penghuni Aktif** menjadi `0` jika belum ada transaksi sewa yang lunas.
3. Di `MitraTenantManagement.tsx`:
   - Tambahkan guard: jika data memiliki status `PENDING` atau belum ada transaksi sewa lunas, jangan masukkan ke daftar `processedResidents`.

### Tahap 2: Tampilan Tipe Kamar Proporsional untuk Mitra Biasa
1. Untuk Mitra Biasa: Kartu penghuni merender nama **Tipe Kamar** (misal: `Kamar Standard • 1 Orang`).
2. Untuk KostManager: Kartu penghuni merender nomor kamar spesifik (misal: `Kamar 02 (Standard) • 1 Orang`).

### Tahap 3: Pembaruan Kartu KPI Beranda (Kamar Siap Sewa)
1. Ganti kartu stat **CTR** di Beranda Mitra dengan **Kamar Siap Sewa**:
   - Nilai: Jumlah total kamar kosong yang sedang dipasarkan mitra (`totalAvailableRooms`).
   - Subtext: "Kamar kosong dipasarkan".
   - Ikon: `<Bed />` atau `<Home />` dari `lucide-react`.
2. Kartu KPI Beranda menjadi:
   - **Kunjungan**: Total views listing kost.
   - **Kamar Siap Sewa**: Total unit kamar kosong yang sedang dicari penyewanya.
   - **Pendapatan**: Total pendapatan lunas via RuangSinggah.
   - **Permintaan**: Jumlah pesanan pending yang butuh persetujuan.

### Tahap 4: Penyempurnaan Tab Pesanan (*Booking Management*)
1. Tambahkan badge peringatan SLA konfirmasi 1x24 jam pada kartu pesanan `PENDING_APPROVAL` agar pemilik segera merespon.
2. Tambahkan tab riwayat **Batal / Kadaluarsa** agar pemilik dapat melihat pengajuan sewa yang tidak jadi atau ditolak.

---

## 4. Rencana Verifikasi

1. **Uji Verifikasi Kebocoran Penghuni**:
   - Buka `localhost:5173/dashboard-mitra/tenants`.
   - Pastikan calon penyewa yang masih berstatus `PENDING_APPROVAL` **TIDAK MUNCUL** di Database Penghuni.
   - Pastikan badge di sidebar pada menu **Penghuni Aktif** berubah dari `1` menjadi `0`.
   - Pastikan pesanan tersebut tetap muncul di menu **Pesanan** pada tab **Permintaan**.
2. **Uji KPI Beranda**:
   - Pastikan kartu CTR digantikan dengan **Kamar Siap Sewa** yang menghitung kuota riil kamar kosong dari tipe kamar mitra.
3. **Uji Kompilasi & Build**:
   - Frontend: `cmd.exe /c "npm --prefix functions/public run build"` (Wajib 0 error).
   - Backend: `cmd.exe /c "npm --prefix functions run build"` (Wajib 0 error).
4. **Pencatatan & Git Push**:
   - Catat di `functions/PROGRESS.md` (#471).
   - Buat `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---
> [!IMPORTANT]
> **Menunggu Persetujuan Pengguna (ACC)**: Sesuai protokol siklus 2-fase, AI Agent tidak akan melakukan modifikasi file kode apapun sebelum pengguna meninjau dokumen rencana ini dan memberikan persetujuan ("ACC" / "Proceed").
