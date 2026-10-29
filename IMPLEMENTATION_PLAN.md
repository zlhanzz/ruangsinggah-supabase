# IMPLEMENTATION PLAN: Proteksi Transaksi Platform & Penghapusan Kontak Langsung (Anti-Bypass)

**ID Rencana**: PLAN-ANTI-BYPASS-003  
**Tanggal Pengajuan**: 29 Oktober 2026  
**Status**: Menunggu Persetujuan Pengguna (Waiting for User Approval)  

---

## 1. Analisis Masalah & Kebutuhan Bisnis (Platform Integrity)

### A. Masalah Kritis (*Platform Disintermediation Risk*)
- Pada rilis sebelumnya di modal profil calon penghuni, tercantum nomor WhatsApp pribadi dan alamat email calon penyewa secara gamblang beserta tombol `[ Chat WA ]`.
- **Dampak Fatal bagi Bisnis Platform**:
  - Pemilik kost (mitra) dapat langsung menghubungi calon penghuni via WhatsApp atau telepon seluler di luar aplikasi.
  - Terjadi *platform leakage / disintermediation*: Pemilik kost mengajak penyewa bertransaksi tunai/transfer langsung secara offline tanpa melalui sistem pembayaran resmi RuangSinggah.
  - RuangSinggah kehilangan komisi platform, kehilangan kontrol atas ketersediaan kamar, dan tidak dapat memberikan proteksi garansi sewa jika terjadi penipuan atau perselisihan offline.

### B. Standar Industri Proptech (Airbnb, Mamikos, Upwork)
- Di Airbnb, Booking.com, dan Mamikos:
  - **Dilarang keras menampilkan kontak langsung** (nomor telepon, WhatsApp, email) antara calon penyewa dan pemilik properti sebelum transaksi pemesanan disepakati dan dibayar lunas di platform.
  - Seluruh komunikasi pra-sewa (*inquiry / diskusi*) **WAJIB 100% melalui In-App Chat resmi platform**.
  - Kontak pribadi hanya boleh dirilis otomatis oleh sistem setelah penyewa menyelesaikan pembayaran resmi (*post-booking handover*).

---

## 2. Rencana Solusi yang Akan Diterapkan

1. **Penghapusan Total Bagian "Kontak & Komunikasi" pada Modal Profil Calon Penghuni**:
   - Menghapus blok WhatsApp (`+62815...`), tombol `[ Chat WA ]`, dan Alamat Email dari modal detail profil calon penghuni di `MitraDashboard.tsx`.
2. **Substitusi dengan Banner Keamanan & Saluran Resmi (*Secure In-App Communication Card*)**:
   - Mengganti bagian kontak dengan kartu edukasi keamanan resmi:
     - Ikon: `ShieldCheck` (Emerald / Blue).
     - Judul: **Komunikasi Resmi RuangSinggah**
     - Pesan Edukasi: *"Demi keamanan transaksi, perlindungan garansi sewa, dan pencegahan penipuan, seluruh obrolan dengan calon penyewa wajib dilakukan melalui sistem Chat RuangSinggah."*
     - Tombol Aksi: **`[ 💬 Mulai Chat dengan Calon Penghuni ]`** (Membuka in-app chat internal secara instan).
3. **Pembersihan Data Sensitif pada Query `getOwnerBookings` (`userService.ts`)**:
   - Menghapus `phone` dan `email` calon penyewa dari query `getOwnerBookings` pada status pra-pembayaran (`PENDING_APPROVAL`), sehingga data kontak mentah tidak bocor ke sisi klien front-end.

---

## 3. Dampak Perubahan File

1. **`functions/public/pages/MitraDashboard.tsx`**:
   - Menghapus rendering `phone`, `email`, dan tombol `wa.me` pada modal profil calon penghuni.
   - Menambahkan banner keamanan *Komunikasi Resmi RuangSinggah* dengan tombol langsung ke in-app chat.
2. **`functions/public/userService.ts`**:
   - Merapikan join user pada `getOwnerBookings` agar tidak mengekspos nomor kontak calon penyewa pra-pembayaran.
3. **`functions/PROGRESS.md` & `WALKTHROUGH.md`**:
   - Dokumentasi progres #474 dan verifikasi pengujian.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

- **Tahap 1**: Hapus blok kontak WhatsApp dan Email di modal profil calon penghuni pada `MitraDashboard.tsx`.
- **Tahap 2**: Pasang banner edukasi keamanan dan tombol internal chat `[ 💬 Chat Calon Penghuni ]`.
- **Tahap 3**: Bersihkan field kontak sensitif di `userService.ts` (`getOwnerBookings`).
- **Tahap 4**: Uji build front-end (`npm --prefix functions/public run build`) dan backend functions (`npm --prefix functions run build`).
- **Tahap 5**: Catat di `PROGRESS.md` (#474), perbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Verifikasi Visual Modal Profil Calon Penghuni**:
   - Buka `/dashboard-mitra/bookings` dan klik tombol **`[ 👤 Lihat Profil ]`**.
   - Pastikan **TIDAK ADA LAGI** nomor WhatsApp, alamat email, maupun tombol `Chat WA`.
   - Pastikan muncul banner resmi edukasi keamanan dan tombol **`[ 💬 Mulai Chat dengan Calon Penghuni ]`**.
2. **Uji Fungsionalitas Chat Internal**:
   - Klik tombol **`[ 💬 Mulai Chat dengan Calon Penghuni ]`** pada modal.
   - Pastikan sistem langsung mengarahkan pemilik ke tab obrolan in-app dengan calon penghuni tersebut.
3. **Uji Keamanan Payload Network**:
   - Pastikan tidak ada data kontak mentah calon penyewa yang bocor di state browser.

---

> [!IMPORTANT]
> **Menunggu Persetujuan Pengguna (ACC)**: Sesuai protokol siklus 2-fase ruang kerja, Agent **BERHENTI** pada tahap ini dan tidak memodifikasi file kode sebelum menerima persetujuan ("ACC" / "Proceed") dari Anda.