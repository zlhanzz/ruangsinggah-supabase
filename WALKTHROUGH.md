# WALKTHROUGH: Proteksi Transaksi Platform & Eliminasi Kontak Pribadi Calon Penghuni (Anti-Bypass)

**ID Progres**: #474  
**Tanggal**: 29 Oktober 2026  
**Status**: Selesai & Lulus Uji Kompilasi 100%  

---

## 1. Ringkasan Perubahan

Untuk menjaga integritas bisnis platform RuangSinggah dan mencegah risiko kebocoran transaksi di luar sistem (*platform disintermediation / leakage*):

### 🛡️ Proteksi yang Diterapkan:
1. **Penghapusan Total Nomor WhatsApp & Email Calon Penghuni**:
   - Menghapus 100% blok kontak (Nomor WhatsApp, tombol `Chat WA`, dan Alamat Email) dari Modal Detail Profil Calon Penghuni di `MitraDashboard.tsx`.
   - Tidak ada kontak langsung yang ditampilkan kepada mitra pemilik kost saat pengajuan sewa berlangsung.
2. **Tanpa Banner Tambahan (Clean UI Sesuai Instruksi User)**:
   - Sesuai arahan spesifik pengguna, tidak ada teks klarifikasi/banner substitusi yang mengganggu. Modal langsung menampilkan data profil esensial:
     - Avatar & Inisial
     - Nama Lengkap & Badge *Terverifikasi*
     - Pekerjaan & Instansi / Kampus
     - Jenis Kelamin & Status Hubungan
     - Alamat Asal
     - Tombol Aksi: **[ Tutup ]** dan **[ 💬 Tanya Calon ]** (In-App Chat RuangSinggah).
3. **Pembersihan Data Sensitif di Query Backend Service**:
   - Menghapus field `phone` dan `email` pada join query `getOwnerBookings` di `userService.ts`, menjamin tidak ada data kontak mentah calon penyewa yang bocor ke browser pemilik kost sebelum transaksi sah.

---

## 2. File yang Dimodifikasi

1. **`functions/public/pages/MitraDashboard.tsx`**:
   - Menghapus blok kontak WhatsApp dan Email serta variabel pendukungnya pada modal profil calon penghuni.
2. **`functions/public/userService.ts`**:
   - Menghapus `phone` dan `email` calon penyewa dari query `getOwnerBookings`.
3. **`functions/PROGRESS.md`**:
   - Pencatatan progres #474.

---

## 3. Hasil Pengujian & Kompilasi

| Pengujian | Perintah | Status | Keterangan |
|---|---|---|---|
| **Frontend Build** | `npm --prefix functions/public run build` | **LULUS (Code 0)** | 2.512 modul tertransformasi, minified bundle bersih. |
| **Backend Functions Build** | `npm --prefix functions run build` | **LULUS (Code 0)** | Kompilasi TypeScript (`tsc`) backend lulus 100%. |

---

## 4. Panduan Verifikasi Pengguna (User Testing Guide)

1. **Buka Halaman Pesanan Mitra**:
   - Akses: `http://localhost:5173/dashboard-mitra/bookings`.
2. **Buka Modal Profil Calon Penghuni**:
   - Klik tombol **[ 👤 Lihat Profil ]** pada salah satu pengajuan sewa calon penghuni.
   - **Hasil yang Diharapkan**:
     - ✅ **Sama sekali TIDAK ADA** nomor WhatsApp, tombol `Chat WA`, maupun alamat email.
     - ✅ Tampilan modal tetap rapi, bersih, dan langsung menyajikan informasi esensial (Nama, Pekerjaan, Kampus/Instansi, Gender, Status, Alamat).
     - ✅ Komunikasi tetap dapat dilakukan secara aman dan terkontrol melalui tombol **[ 💬 Tanya Calon ]** via In-App Chat RuangSinggah.
