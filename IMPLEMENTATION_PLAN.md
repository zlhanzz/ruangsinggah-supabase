# Rencana Implementasi: Proteksi Otomatis Penolakan Booking Berdasarkan Kesesuaian Gender & Modal Edukasi Penjelasan

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Sistem pemesanan sewa (*booking flow*) saat ini **belum memiliki validasi otomatis kesesuaian jenis kelamin (gender check)** antara profil pengguna (`user.gender`) dengan tipe peruntukan kost (`kost.type` / `kost.gender` — *Putra, Putri, Campur*).
  - Pengguna laki-laki (Pria) masih dapat membuka formulir pengajuan sewa dan mengirim booking untuk kost yang secara tegas berkategori **Khusus Putri**, begitu pula sebaliknya.
- **Tujuan Pengembangan**:
  1. Mencegah secara otomatis pengguna laki-laki mengajukan sewa pada kost khusus putri (serta pengguna perempuan pada kost khusus putra).
  2. Menyajikan **Modal Pop-up Edukasi & Penjelasan Interaktif** yang elegan, humanis, dan informatif (bukan `alert()` browser biasa) saat kondisi penolakan terdeteksi.
  3. Menyediakan tombol navigasi langsung ke katalog kost yang sesuai (*Putra / Campur*) serta opsi perbaikan data jika pengguna salah mengisi gender di profil.

---

## 2. Dampak Perubahan
File yang akan disentuh:
1. [`functions/public/pages/KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx): 
   - Penambahan validasi gender check pada trigger booking (`handleBookingClick`) dan proses submit (`handleConfirmBooking`).
   - Penyematan komponen pop-up modal penolakan gender mismatch yang informatif dan elegan.
2. [`functions/public/App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx): 
   - Penyelarasan validasi profil pada wrapper route `/kost/:slug` agar mencakup pemeriksaan kesesuaian gender sebelum booking.
3. [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md): 
   - Pencatatan riwayat progres fitur #351.
4. [`WALKTHROUGH.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md): 
   - Panduan verifikasi dan walkthrough fitur bagi pengguna.

---

## 3. Rencana Langkah-Langkah Eksekusi

### Langkah 1: Logika Deteksi Mismatch Gender
- Normalisasi tipe kost:
  - `kostType = (kost.type || (kost as any).gender || '').toLowerCase()`
  - Nilai: `'putri'`, `'putra'`, atau `'campur'`
- Normalisasi gender pengguna:
  - `userGender = (user.gender || '').toLowerCase()`
  - Nilai: `'pria'` / `'laki-laki'` vs `'wanita'` / `'perempuan'`
- Aturan Validasi:
  - **Ditolak**: Jika `kostType === 'putri'` dan `userGender` adalah Pria/Laki-laki.
  - **Ditolak**: Jika `kostType === 'putra'` dan `userGender` adalah Wanita/Perempuan.
  - **Diterima**: Jika `kostType === 'campur'` (dapat disewa oleh semua gender).
  - **Diterima**: Jika `kostType === 'putri'` dan `userGender` adalah Wanita.
  - **Diterima**: Jika `kostType === 'putra'` dan `userGender` adalah Pria.

### Langkah 2: Pembuatan Modal Pop-up Penjelasan yang Elegan
- Modal interaktif dengan visual premium:
  - **Header & Ikon**: Badge peringatan merah/rose dengan ikon `ShieldAlert` / `Users` (`lucide-react`).
  - **Judul**: *"Pengajuan Sewa Tidak Dapat Dilanjutkan"*.
  - **Subjudul & Badge**: *"Batasan Kebijakan Gender Hunian"*.
  - **Komparasi Data**: Box perbandingan visual antara **Tipe Kost (Khusus Putri)** vs **Data Profil Anda (Laki-Laki / Pria)**.
  - **Penjelasan**: *"Demi kenyamanan, privasi, dan kepatuhan terhadap tata tertib pemilik kost, properti ini hanya menerima penyewa perempuan/putri."*
  - **Aksi Navigasi Cepat**:
    - Tombol Oranye: *"Cari Kost Putra / Campur"* (mengarahkan langsung ke katalog filter gender yang tepat).
    - Tombol Sekunder: *"Periksa / Ubah Profil"* (jika ada kekeliruan data gender di `/profile`).
    - Tombol Tutup.

### Langkah 3: Pengamanan Submit Layer (Anti-Bypass)
- Memastikan pemanggilan `createBookingRequest` menolak transaksi jika terjadi manipulasi data request tanpa gender yang sesuai.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi**: Menjalankan `npm run build` di direktori `functions/public` untuk memastikan 0 error TypeScript & JSX.
2. **Skenario Pengujian Fungsional**:
   - **Kasus 1**: User Pria mencoba klik *"Ajukan Sewa"* pada Kost Putri $\rightarrow$ Sistem langsung memunculkan Pop-up Penolakan Gender Mismatch dan tidak membuka formulir booking.
   - **Kasus 2**: User Wanita mencoba klik *"Ajukan Sewa"* pada Kost Putra $\rightarrow$ Sistem langsung memunculkan Pop-up Penolakan Gender Mismatch.
   - **Kasus 3**: User Pria/Wanita menyewa Kost Campur $\rightarrow$ Pengecekan lolos dan modal booking terbuka dengan lancar.
   - **Kasus 4**: User Pria menyewa Kost Putra, User Wanita menyewa Kost Putri $\rightarrow$ Pengecekan lolos dan modal booking terbuka dengan lancar.
