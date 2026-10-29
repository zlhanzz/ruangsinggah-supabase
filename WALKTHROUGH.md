# Walkthrough: Audit Masif & Standarisasi Dashboard Mitra Sesuai Realita Operasional

**ID Progres**: #471  
**Status**: Selesai & Lulus Uji Kompilasi 100% (Frontend & Backend)  
**Tanggal**: 29 Oktober 2026  

---

## 📌 Ringkasan Pekerjaan

Pembaruan ini menuntaskan penyelidikan dan perbaikan menyeluruh terhadap sistem **Dashboard Mitra**, menyelesaikan masalah kebocoran data calon penyewa (*active tenant leakage*), serta menyelaraskan metrik KPI bisnis dengan model operasional Mitra Biasa:

1. **Eliminasi Total Kebocoran Calon Penyewa ke Database Penghuni**:
   - Memperbaiki query dan filter di `adminService.ts`, `MitraDashboard.tsx`, dan `MitraTenantManagement.tsx` sehingga calon penyewa yang baru mengajukan sewa (`PENDING_APPROVAL` / belum bayar) **TIDAK AKAN PERNAH** masuk ke Database Penghuni.
   - Badge counter di sidebar **Penghuni Aktif** kini akurat dan menampilkan angka `0` (atau jumlah riil penyewa yang kontraknya telah lunas & berjalan).
2. **Koreksi Metrik KPI Beranda (Kamar Siap Sewa)**:
   - Menggantikan metrik digital marketing CTR yang abstrak dan membingungkan dengan **Kamar Siap Sewa** (`availableRooms`), yang mencerminkan total kuota kamar kosong yang sedang dipasarkan oleh pemilik di RuangSinggah.
   - Menghindari penggunaan okupansi semu untuk Mitra Biasa karena Mitra Biasa hanya mendaftarkan kamar kosong dan tidak mendata penghuni lama yang sudah menetap secara offline.
3. **Penyempurnaan Alur Pesanan (Booking Management)**:
   - Menambahkan tab **Batal / Kadaluarsa** pada menu Pesanan untuk melacak riwayat pengajuan sewa yang ditolak atau dibatalkan.
   - Menambahkan badge pengingat **SLA Konfirmasi 1x24 Jam** pada kartu pengajuan baru agar pemilik segera merespon calon penyewa.
4. **Penyelarasan Tipe Kamar vs Nomor Kamar**:
   - Memastikan tampilan kartu sewa Mitra Biasa berbasis **Tipe Kamar** (misal: `Kamar Standard • 1 Orang`) secara rapi dan stabil.

---

## 🛠️ Daftar Perubahan File

### 1. [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)
- Menambahkan filter pada `getResidentStatus`:
  ```typescript
  if (ownerUid || !userId) {
      query = query.neq('status', 'PENDING').neq('status', 'CANCELLED').neq('status', 'REJECTED');
  }
  ```
- Mengetatkan ekstraksi penghuni offline: hanya mengekstrak jika benar-benar ada nama penghuni tercatat (`rt.residentName || rt.tenantName || rt.occupant_name`), bukan semata-mata karena kuota kamar bernilai 0.

### 2. [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
- **Kalkulasi Penghuni Aktif**: Memvalidasi `isStatusActive = (r.status || '').toUpperCase() === 'ACTIVE'` dan sisa hari `daysLeft >= 0`. Badge sidebar kini menampilkan angka riil (tidak bocor).
- **Metrik Kamar Siap Sewa**: Menghitung akumulasi kuota `availableRoomCount` seluruh tipe kamar properti yang dipasarkan.
- **Pembaruan Kartu KPI Beranda**: Mengganti kartu CTR dengan kartu **Kamar Siap Sewa** berikon `<Bed />`.
- **Tab Pesanan Baru**: Menambahkan tab `cancelled` (*Batal / Kadaluarsa*) dan banner *SLA Konfirmasi 1x24 Jam* pada pesanan pending.

### 3. [MitraTenantManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/mitra/MitraTenantManagement.tsx)
- Menambahkan filter pengaman pada `processedResidents` untuk mengeluarkan baris berstatus `PENDING`, `CANCELLED`, atau `REJECTED`.
- Menjamin calon penyewa yang belum lunas tidak akan pernah terdaftar dengan tag hijau `AKTIF` atau total tagihan Rp 0.

### 4. [PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md)
- Mencatat riwayat entri progres #471.

---

## 🧪 Hasil Verifikasi Kompilasi

1. **Frontend Production Build (`functions/public`)**:
   ```
   ✓ 2512 modules transformed.
   ✓ built in 53.40s
   Exit Code: 0 (Sukses tanpa error)
   ```
2. **Backend Cloud Functions Build (`functions`)**:
   ```
   > tsc
   Exit Code: 0 (Sukses tanpa error)
   ```

---

## 📋 Panduan Verifikasi Pengguna di UI

1. **Verifikasi Database Penghuni (`/dashboard-mitra/tenants`)**:
   - Refresh halaman `localhost:5173/dashboard-mitra/tenants`.
   - Perhatikan bahwa calon penyewa (**"PENYEWA"**) yang berstatus `PENDING_APPROVAL` **sudah tidak lagi muncul** di Database Penghuni.
   - Layar akan menampilkan empty state yang bersih: *"Belum ada penghuni aktif. Data akan muncul setelah pesanan diselesaikan (PAID)"*.
2. **Verifikasi Badge Sidebar**:
   - Periksa menu **Penghuni Aktif** di sidebar kiri: Badge counter sekarang menunjukkan **0** (tidak ada lagi angka 1 palsu).
   - Menu **Pesanan** tetap menampilkan badge **1** (karena ada 1 pengajuan sewa masuk).
3. **Verifikasi Tab Beranda (`/dashboard-mitra`)**:
   - Buka tab Beranda.
   - Periksa 4 kartu KPI utama:
     - **Kunjungan**: Total views.
     - **Kamar Siap Sewa**: Total unit kamar kosong yang diiklankan.
     - **Pendapatan**: Total sewa lunas via aplikasi.
     - **Permintaan**: 1 pesanan butuh persetujuan.
4. **Verifikasi Tab Pesanan (`/dashboard-mitra/bookings`)**:
   - Buka menu Pesanan.
   - Calon penyewa berada di tab **Permintaan** lengkap dengan peringatan *SLA Konfirmasi 1x24 Jam*.
   - Tersedia tab baru: **Batal / Kadaluarsa** untuk mengarsipkan riwayat pengajuan yang tidak jadi.
