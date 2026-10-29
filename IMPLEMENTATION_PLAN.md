# IMPLEMENTATION PLAN: Standarisasi Alur Peninjauan & Konfirmasi Pengajuan Sewa (Dashboard Mitra)

**ID Rencana**: PLAN-BOOKING-REVIEW-001  
**Tanggal Pengajuan**: 29 Oktober 2026  
**Status**: DISETUJUI OLEH USER (Approved with Profile Button Requirement)  

---

## 1. Analisis Masalah & Kebutuhan (Audit Standar Proptech)

Berdasarkan audit komparatif terhadap tampilan mobile pengajuan sewa pada tangkapan layar `media_1793233172345_19e14d9f.png` dibandingkan standar industri proptech (Airbnb Host, Mamikos Owner, Rukita Partner):

### A. Temuan Isu Kritis pada Kartu Peninjauan Saat Ini:
1. **Ketiadaan Tombol Chat Pra-Konfirmasi (*Pre-Approval Inquiry*)**:
   - Di kode `MitraDashboard.tsx:2318`: tombol chat sengaja di-hide jika `b.status === 'PENDING_APPROVAL'`.
   - **Dampak Buruk**: Pemilik kost dipaksa mengambil keputusan buta (*blind decision*) antara menolak atau menyetujui tanpa bisa bertanya/berdiskusi terlebih dahulu dengan calon penyewa.
2. **Identitas Calon Penyewa Sangat Minim & Belum Ada Tombol Khusus Lihat Profil**:
   - Kartu hanya menampilkan username mentah (misal: `userbiasa1`) dan inisial `u`.
   - Belum ada tombol eksplisit `[ 👤 Lihat Profil Calon Penghuni ]` agar pemilik kost dapat membuka seluruh informasi latar belakang (pekerjaan, instansi, jenis kelamin, status, kontak, alamat asal) dalam satu kali klik.
3. **SLA Statis Tanpa Countdown Waktu Riil (*No Real-time Expiry Countdown*)**:
   - Hanya menampilkan teks statis: `⏰ SLA KONFIRMASI 1X24 JAM`.
   - Pemilik tidak mengetahui sisa jam/menit sebelum pengajuan otomatis kedaluwarsa.
4. **Alasan Penolakan Menggunakan Alert Browser Jadul Tanpa Edukasi**:
   - Saat pemilik klik "TOLAK", sistem hanya menggunakan alert bawaan `window.confirm`.
5. **Hierarki Visual & Warna Tombol Aksi Kurang Tepat**:
   - Tombol **SETUJUI** berwarna hitam pekat (`bg-gray-900`) yang terasa seperti tombol netral/sekunder, padahal persetujuan adalah Primary Action positif yang seharusnya hijau emerald (*Emerald Green*).

---

### B. Matriks Solusi yang Diterapkan

| Komponen Peninjauan | Kondisi Saat Ini | Standar Industri Proptech (Mamikos / Airbnb) | Solusi yang Diterapkan |
|---|---|---|---|
| **1. Tombol Khusus Profil** *(User Req)* | ⚠️ Hanya avatar/nama yang bisa diklik secara implisit tanpa label. | ✅ Ada tombol eksplisit `Lihat Profil Lengkap` untuk melihat data calon penghuni. | **Dedicated Profile Button**: Tambahkan tombol `[ 👤 Detail Profil ]` yang membuka modal identitas komprehensif. |
| **2. Chat Pra-Konfirmasi** | ❌ Tombol Chat disembunyikan saat `PENDING_APPROVAL`. | ✅ Pemilik bisa chat/tanya calon penyewa langsung sebelum klik ACC/Tolak. | **Pre-Approval Chat**: Tambahkan tombol `[ 💬 Tanya Calon ]` di kartu pengajuan untuk membuka obrolan langsung. |
| **3. Profil & Kepercayaan** | ❌ Hanya username mentah `userbiasa1` & inisial huruf. | ✅ Menampilkan Nama Lengkap, Profesi/Instansi, Jenis Kelamin, dan status verifikasi. | **Mini Profile Header**: Tampilkan foto profil, nama lengkap, badge profesi (misal: *Karyawan Swasta*), instansi, jenis kelamin, dan badge *Terverifikasi*. |
| **4. Indikator Waktu SLA** | ⚠️ Banner teks statis `SLA 1X24 JAM`. | ✅ Countdown riil sisa waktu respon (jam & menit) dengan indikator warna urgensi. | **Dynamic SLA Countdown**: Menghitung mundur dari `created_at + 24 jam` (Hijau/Amber jika >6 jam, Merah jika <6 jam). |
| **5. Alur Penolakan** | ❌ Browser alert `window.confirm`. | ✅ Modal pilihan alasan penolakan ramah. | **Modal Alasan Penolakan**: Dialog pilihan alasan (*Kamar Penuh Offline*, *Kriteria Belum Sesuai*, dll). |
| **6. Tombol Aksi (CTA)** | ⚠️ SETUJUI hitam pekat, TOLAK outline merah muda. | ✅ SETUJUI warna hijau emerald terstandar, TOLAK tombol sekunder bersih. | **Restrukturisasi Tombol**: SETUJUI (Emerald solid prominent), TOLAK (Border slate halus), dan TANYA CALON (Blue/teal outline). |

---

## 2. Dampak Perubahan File

1. **`functions/public/pages/MitraDashboard.tsx`**:
   - Menambahkan tombol khusus `[ 👤 Detail Profil ]` di samping info calon penyewa dan di area aksi.
   - Membuka akses chat pra-konfirmasi `[ 💬 Tanya Calon ]` untuk pengajuan `PENDING_APPROVAL`.
   - Menampilkan countdown dinamis SLA 24 jam dengan kalkulasi sisa jam & menit.
   - Mengganti dialog `window.confirm` dengan Modal Alasan Penolakan (*Reject Reason Modal*) yang ramah pengguna.
   - Memperkaya tampilan mini profile header calon penyewa.
   - Memperbarui gaya tombol aksi (Emerald solid untuk Setujui, Clean secondary untuk Tolak).
2. **`functions/public/userService.ts`**:
   - Memperkaya query `getOwnerBookings` agar mengikutsertakan field kontak calon penyewa (`phone, email, emergency_phone`).
   - Memperbarui `updateBookingStatus` agar dapat menerima `rejection_reason` dan menyinkronkan status penolakan ke `resident_status`.
3. **`functions/PROGRESS.md` & `WALKTHROUGH.md`**:
   - Dokumentasi progres #472 dan panduan verifikasi.

---

## 3. Rencana Eksekusi (Fase 2)

- **Tahap 1**: Update `userService.ts` (`getOwnerBookings` & `updateBookingStatus`).
- **Tahap 2**: Update `MitraDashboard.tsx` (Tombol khusus lihat profil, Pre-Approval Chat, Dynamic SLA timer, Reject modal, dan Redesain CTA).
- **Tahap 3**: Jalankan build frontend & backend (`npm run build`).
- **Tahap 4**: Catat di `PROGRESS.md`, terbitkan `WALKTHROUGH.md`, dan push ke `bukan-productions`.
