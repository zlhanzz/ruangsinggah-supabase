# Implementation Plan: Peninjauan Data Pribadi KTP & Properti Terkait pada Manajemen Mitra Aktif

Dokumen rencana kerja ini disusun untuk mengatasi kendala pada menu Manajemen Mitra Aktif di Admin Panel (`/dashboard-admin/mitra`), di mana tim admin saat ini tidak dapat melihat data pribadi/KTP lengkap dari mitra aktif serta tidak dapat melihat daftar properti kost yang terhubung dengan mitra tersebut.

---

## 1. Analisis Masalah & Kebutuhan

1. **Ketiadaan Akses Data Pribadi & Dokumen KTP Mitra Aktif**:
   - Di tab *Mitra Aktif*, kartu mitra hanya menampilkan nama, nomor WhatsApp, email, dan tanggal terdaftar.
   - Tombol utama **"Detail"** di sebelah tombol "Chat" saat ini tidak memiliki event handler (`onClick`) sehingga tidak merespon saat diklik.
   - Tombol kecil berikon mata "Detail" di baris bawah memicu modal umum yang hanya menampilkan teks NIK tanpa foto fisik KTP, tanpa alamat KTP lengkap, tanpa tanggal/tempat lahir, gender, agama, pekerjaan, dan tanpa data rekening bank penarikan saldo.
   - Akibatnya, admin kesulitan melakukan audit keaslian identitas atau investigasi jika terjadi masalah/sengketa sewa di kemudian hari.
2. **Ketiadaan Informasi Properti yang Terkait dengan Mitra**:
   - Admin tidak dapat melihat properti kost mana saja yang dimiliki/didaftarkan oleh mitra terkait.
   - Query `getUserFullDetails` di `adminService.ts` sebelumnya hanya mengambil `id, title, city, status` tanpa detail foto, alamat, harga sewa, jumlah kamar terisi/tersedia, dan status kelola.
3. **Duplikasi Tombol Aksi pada Kartu Mitra**:
   - Terdapat dua tombol "Detail" pada satu kartu mitra (satu di baris atas sejajar tombol "Chat", dan satu tombol kecil di baris bawah sejajar tombol "Blokir" dan "Hapus"), yang membingungkan dan tidak efisien.

---

## 2. Dampak Perubahan

File yang akan disentuh pada tahap eksekusi:
- [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts):
  - Memperluas query `getUserFullDetails(userId)` untuk mengambil seluruh kolom properti secara komprehensif (`id, title, city, area, address, status, price, image_urls, room_types, is_managed, is_verified, created_at`).
  - Memastikan data `user_verifications` (foto KTP, NIK, alamat KTP, status verifikasi) dan `user_bank_accounts` (nama bank, nomor rekening, nama pemilik) tergabung utuh.
- [MitraManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/MitraManagement.tsx):
  - Memperbaiki tombol utama **"Detail"** agar memicu pembukaan modal detail mitra komprehensif.
  - Menghapus tombol kecil duplikat "Detail" di baris bawah kartu sehingga baris bawah hanya memuat tombol aksi cepat administratif (**Blokir** dan **Hapus**).
  - Menambahkan ringkasan badge pada kartu mitra aktif: jumlah properti listing (`🏠 X Properti`) dan status verifikasi KTP (`✓ Terverifikasi`).
  - Mengintegrasikan modal inspeksi **Detail Mitra & Properti Terkait** dengan 2 tab interaktif:
    1. **Tab 1: Data Pribadi & Verifikasi KTP**:
       - Foto Fisik KTP Asli (pratinjau interaktif + modal zoom / klik buka tab baru).
       - Foto Profil & Status Akun (Aktif / Terverifikasi / Diblokir).
       - NIK (16 digit), Nama Lengkap Sesuai KTP.
       - Tempat & Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan.
       - Alamat KTP & Alamat Domisili.
       - Nomor WhatsApp Terverifikasi OTP & Email.
       - Data Rekening Bank Penarikan Saldo.
    2. **Tab 2: Properti Terkait (`properties.length`)**:
       - Kartu visual setiap listing kost milik mitra (foto utama, judul kost, harga bulanan, kota/area, status publish/draft, badge KostManager).
       - Rincian kamar (jumlah tipe kamar & ketersediaan).
       - Tombol cepat untuk membuka halaman listing kost di tab baru (`/kost/:id`).
- [Dashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx):
  - Memperbarui komponen `MODAL: DETAIL USER LENGKAP` agar menyajikan foto KTP dan daftar properti secara visual, elegan, dan kaya informasi.

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Optimalisasi Data Fetching di `adminService.ts`
1. Buka fungsi `getUserFullDetails(userId)`.
2. Perluas query `properties` agar mengambil data visual dan operasional lengkap:
   `id, title, city, area, address, status, price, image_urls, room_types, is_managed, is_verified, created_at`.
3. Pastikan `user_verifications` menyertakan `ktp_photo_url`, `ktp_address`, `ktp_number`, dan `verification_status`.

### Langkah 2: Restrukturisasi Kartu & Modal di `MitraManagement.tsx`
1. Hubungkan tombol utama "Detail" ke fungsi pemanggilan profil (`onViewProfile(mitra.id)` atau modal internal).
2. Hapus tombol duplikat "Detail" pada grid 3-kolom di bagian bawah kartu mitra.
3. Tambahkan indikator visual di kartu:
   - Badge jumlah properti listing: `🏠 X Properti`
   - Badge status identitas: `✓ Terverifikasi` atau `Belum Verifikasi`
4. Buat Modal Inspeksi Komprehensif dengan 2 tab interaktif (*Data Pribadi & KTP* dan *Properti Terkait*).

### Langkah 3: Penyempurnaan Tampilan Modal di `Dashboard.tsx`
1. Tampilkan kartu foto KTP dengan opsi klik perbesar gambar.
2. Tampilkan data identitas sipil lengkap (Tempat/Tanggal Lahir, Agama, Gender, Pekerjaan, Status Nikah, Alamat KTP).
3. Tampilkan kartu grid properti dengan thumbnail gambar, harga sewa, alamat, dan tombol tautan langsung ke halaman kost.

### Langkah 4: Pengujian Kompilasi & Verifikasi UI
1. Jalankan `cmd.exe /c npm run build` untuk menjamin 0 error TypeScript / bundling.
2. Uji alur klik tombol "Detail" di tab Mitra Aktif, pastikan data KTP dan daftar properti muncul dengan presisi.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**: `npm run build` sukses 100% tanpa error.
2. **Verifikasi Visual UI**:
   - Memastikan tidak ada lagi tombol "Detail" ganda di kartu mitra aktif.
   - Memastikan tombol "Detail" membuka modal inspeksi lengkap.
   - Memastikan foto fisik KTP dan data pribadi lengkap dapat ditinjau oleh admin.
   - Memastikan daftar properti kost milik mitra tampil lengkap dengan thumbnail foto, lokasi, harga, dan tautan.
