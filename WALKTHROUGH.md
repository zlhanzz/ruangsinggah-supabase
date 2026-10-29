# WALKTHROUGH: Standarisasi Alur Peninjauan & Konfirmasi Pengajuan Sewa (Dashboard Mitra)

**ID Progres**: #472  
**Tanggal**: 29 Oktober 2026  
**Status**: Selesai & Lulus Uji Kompilasi 100%  

---

## 1. Ringkasan Perubahan

Sesuai arahan dan persetujuan pengguna, alur peninjauan dan konfirmasi pengajuan sewa oleh pemilik kost pada Dashboard Mitra (`/dashboard-mitra/bookings`) telah diaudit dan distandarisasi mengikuti praktik terbaik industri proptech (Airbnb Host, Mamikos Owner, dan Rukita Partner).

### 🎯 Fitur & Peningkatan Baru:
1. **Tombol Khusus "Lihat Profil" Calon Penghuni**:
   - Di samping nama calon penyewa, kini tersedia tombol eksplisit `[ 👤 Lihat Profil ]`.
   - Mengklik tombol ini langsung membuka modal komprehensif yang memuat seluruh informasi calon penghuni:
     - Foto profil/avatar & inisial
     - Nama lengkap & badge status *Calon Penghuni*
     - Profesi / Pekerjaan & Instansi / Kampus
     - Jenis Kelamin & Status Hubungan
     - Kontak: Nomor WhatsApp / HP & Alamat Email
     - Alamat Asal
2. **Pre-Approval Inquiry / Obrolan Pra-Konfirmasi (`[ 💬 Tanya Calon ]`)**:
   - Pemilik kost kini dapat langsung mengklik tombol `[ 💬 Tanya Calon ]` pada kartu pengajuan sewa yang masih berstatus `PENDING_APPROVAL`.
   - Tombol ini langsung membuka sesi chat internal RuangSinggah dengan calon penyewa, memungkinkan pemilik berdiskusi (menanyakan kendaraan yang dibawa, jam tiba, dll.) sebelum mengambil keputusan.
3. **Dynamic Real-Time SLA Countdown (Batas Waktu Respon 24 Jam)**:
   - Menggantikan teks statis `⏰ SLA KONFIRMASI 1X24 JAM` dengan timer dinamis yang menghitung mundur sisa waktu secara riil:
     - **Kondisi Normal (> 6 Jam)**: Tampilan badge amber bersahabat bertuliskan *"Sisa Respon: X Jam Y Menit"*.
     - **Kondisi Mendesak ($\le$ 6 Jam)**: Tampilan badge merah dengan animasi pulse berkedip lembut bertuliskan *"Sisa Respon: Y Menit (Mendesak)"*.
     - **Kedaluwarsa**: Bertuliskan *"Waktu Respon Berakhir (24 Jam)"*.
4. **Modal Alasan Penolakan Sopan (*Polite Rejection Modal*)**:
   - Menggantikan dialog native browser `window.confirm` yang kaku dengan modal interaktif yang menyediakan opsi alasan penolakan ramah:
     1. *Kamar sudah terisi oleh penyewa offline*
     2. *Jadwal tanggal masuk bentrok atau belum sesuai*
     3. *Kriteria calon penghuni belum sesuai ketentuan kost*
     4. *Lainnya (masukkan alasan khusus via textarea)*
   - Alasan penolakan otomatis tersimpan ke metadata transaksi dan disinkronkan ke tabel `resident_status`.
5. **Hierarki Tombol Aksi Proptech (CTA)**:
   - **Primary Action (Setujui)**: Warna Emerald Green solid yang tegas (`bg-emerald-600 hover:bg-emerald-700`) dengan icon `CheckCircle2`.
   - **Secondary Action (Tolak)**: Tombol outline netral (`border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50`).
   - **Mini Profile Header**: Dilengkapi badge verifikasi hijau (`ShieldCheck`), subtitle profesi (`Briefcase`), instansi (`GraduationCap`), dan jenis kelamin.

---

## 2. File yang Dimodifikasi

1. **`functions/public/pages/MitraDashboard.tsx`**:
   - Menambahkan helper `getBookingSlaInfo` untuk kalkulasi hitung mundur sisa jam dan menit SLA 24 jam.
   - Menambahkan state dan modal dialog `rejectingBooking` (*Polite Rejection Modal*).
   - Menambahkan tombol khusus `[ 👤 Lihat Profil ]` dan `[ 💬 Tanya Calon ]` di header kartu pemesanan.
   - Mengintegrasikan rincian kontak (Nomor WhatsApp & Email) pada modal profil penghuni.
   - Memperbarui gaya tombol aksi (Emerald Green untuk Setujui, Clean secondary untuk Tolak).
2. **`functions/public/userService.ts`**:
   - Memperluas query `getOwnerBookings` agar menyertakan data kontak lengkap penyewa (`phone, email`).
   - Memperbarui fungsi `updateBookingStatus` agar menerima parameter `extraMetadata` (alasan penolakan) dan menyinkronkan status penolakan ke `resident_status`.
3. **`functions/PROGRESS.md`**:
   - Mencatat riwayat progres fitur #472.

---

## 3. Hasil Pengujian & Kompilasi (Build Verification)

| Pengujian | Perintah | Status | Keterangan |
|---|---|---|---|
| **Frontend Build** | `npm --prefix functions/public run build` | **LULUS (Code 0)** | 2.512 modul tertransformasi tanpa error Vite/TypeScript. |
| **Backend Functions Build** | `npm --prefix functions run build` | **LULUS (Code 0)** | Kompilasi TypeScript (`tsc`) backend sukses dengan 0 error. |

---

## 4. Panduan Verifikasi Pengguna (User Testing Guide)

Untuk menguji fitur ini langsung di layar:

1. **Buka Halaman Pesanan Mitra**:
   - Masuk ke dashboard mitra di browser: `http://localhost:5173/dashboard-mitra/bookings` (atau via menu navigasi **Pesanan**).
2. **Uji Tombol Khusus "Lihat Profil"**:
   - Temukan kartu pengajuan sewa (misal: dari `userbiasa1`).
   - Klik tombol **[ 👤 Lihat Profil ]** di bagian kanan atas kartu.
   - Pastikan modal profil terbuka menampilkan data lengkap: Nama, Profesi, Instansi, Jenis Kelamin, No. HP/WhatsApp, Email, dan Alamat Asal.
3. **Uji Tombol "Tanya Calon" (Pre-Approval Chat)**:
   - Klik tombol **[ 💬 Tanya Calon ]**.
   - Pastikan Anda langsung diarahkan ke tab **Pesan & Diskusi** untuk mulai mengobrol langsung dengan calon penyewa.
4. **Uji Dynamic SLA Countdown**:
   - Perhatikan badge waktu di atas tombol aksi kartu pesanan. Badge menampilkan sisa waktu riil (misal: *Sisa Respon: 20 Jam 15 Menit*).
5. **Uji Alur Penolakan (Reject Flow)**:
   - Klik tombol **[ ✖️ Tolak ]**.
   - Pastikan modal pilihan alasan penolakan muncul (bukan alert browser).
   - Pilih salah satu alasan atau ketik alasan kustom, lalu konfirmasi penolakan.
6. **Uji Alur Persetujuan (Approve Flow)**:
   - Klik tombol **[ ✔️ Setujui ]** (berwarna hijau emerald).
   - Pastikan konfirmasi muncul dan status pesanan berpindah ke tab *Menunggu Pembayaran*.
