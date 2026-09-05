# Walkthrough: Redesain Profile Hub Dashboard Interaktif & Sub-view Edit Data Pribadi

## Ringkasan Pekerjaan
Pembaruan komprehensif pada halaman **Profil Pengguna (`/profile`)** untuk mentransformasikan antarmuka dari formulir data pribadi mentah menjadi **Profile Hub Dashboard** yang elegan, modern, dan intuitif (sesuai referensi UI pengguna). Seluruh fitur sebelumnya (validasi, upload KTP WebP, penyimpanan data diri Supabase) tetap terjaga 100% dan dapat diakses melalui sub-view edit data pribadi.

---

## 📸 Detail Struktur Antarmuka Baru

### 1. Header Profil Pengguna
- **Avatar Dinamis**: Menampilkan foto profil pengguna dengan opsi inisial cerdas jika foto belum diunggah.
- **Nama & Kontak**: Menampilkan nama lengkap dan nomor WhatsApp / email terdaftar.
- **Lencana Verifikasi Identitas**: Status verifikasi KTP instan (`Terverifikasi` berwarna hijau dengan ikon `ShieldCheck` atau `Belum Terverifikasi` berwarna abu-abu/oranye).

### 2. Menu Aktivitas Sewa & Transaksi
- **Kost Saya**: Menghubungkan langsung ke `/my-kost` dilengkapi *live counter badge* jumlah kost/kamar aktif penyewa.
- **Riwayat Transaksi**: Menghubungkan ke riwayat transaksi dan pembayaran tagihan sewa.
- **Pesan & Chat**: Menghubungkan ke `/chat` untuk berkirim pesan dengan pemilik kost/pengelola.

### 3. Pengaturan Akun & Keamanan
- **Edit Profil & Data Kontak Pribadi**: Membuka sub-view formulir edit data diri lengkap.
- **Ganti Kata Sandi**: Membuka modal popup interaktif untuk mereset/mengganti password akun Supabase Auth dengan konfirmasi keamanan.
- **Preferensi Notifikasi**: Membuka modal kontrol pengaturan notifikasi via WhatsApp, Email, dan Penawaran Promo.

### 4. Bantuan & Legalitas
- **Pusat Bantuan & Layanan CS 24/7**: Tautan langsung ke layanan pelanggan WhatsApp / form kontak bantuan.
- **Syarat & Ketentuan**: Membuka dokumen Syarat & Ketentuan Layanan.
- **Kebijakan Privasi**: Membuka dokumen Kebijakan Privasi data pengguna.

### 5. Tombol Keluar & Footer
- **Keluar / Logout**: Tombol keluar berwarna merah dengan konfirmasi pembersihan sesi.
- **Footer**: Identitas versi aplikasi RuangSinggah.

---

## 🔄 Alur Navigasi Sub-view Formulir Data Pribadi
1. Pengguna membuka `/profile` ➔ Tampilan default adalah **Profile Hub Dashboard**.
2. Pengguna menekan opsi *"Edit Profil & Data Kontak Pribadi"*.
3. Sistem beralih ke sub-view formulir edit data lengkap dengan tombol navigasi `← Kembali ke Menu Profil` di bagian atas.
4. Pengguna dapat mengubah nama, nomor HP, pekerjaan, jenis kelamin, status perkawinan, agama, tempat & tanggal lahir, alamat, foto profil, serta upload KTP.
5. Menekan tombol `Simpan Perubahan` akan memperbarui data ke Supabase dan secara otomatis mengembalikan tampilan ke Profile Hub dengan data ter-refresh.
6. Menekan tombol `← Kembali ke Menu Profil` atau `Batal` mengembalikan tampilan ke Profile Hub tanpa kehilangan konteks.

---

## 🧪 Hasil Pengujian & Verifikasi

### 1. Kompilasi Build Frontend (`npm run build`)
- **Status**: **LULUS (100% PASS)**
- **Hasil Rollup/Vite**:
  ```text
  ✓ 2510 modules transformed.
  rendering chunks...
  computing gzip size...
  ../../public/assets/Profile-SZYc3N9_.js    54.99 kB │ gzip: 11.06 kB
  ✓ built in 1m 38s
  ```
- **0 Error Kompilasi, 0 Warning Syntax**.

### 2. Standar Baku UI/UX & Ikon
- **100% Pure Bundled SVG (`lucide-react`)**: Bebas Flash of Unstyled Text (FOUT), 0 network request untuk rendering icon.

---

## 🚀 Panduan Pengujian oleh Pengguna (User Testing Guide)

1. Buka aplikasi di browser (mode mobile maupun desktop).
2. Login sebagai pengguna/pencari kost.
3. Klik ikon atau menu **Profil** di navigasi bawah (mobile) atau dropdown avatar di navbar (desktop):
   - Pastikan yang pertama kali muncul adalah **Profile Hub Dashboard** yang rapi.
4. Uji interaksi fitur:
   - Klik **Kost Saya** ➔ memastikan masuk ke halaman `/my-kost`.
   - Klik **Ganti Kata Sandi** ➔ pastikan modal ganti kata sandi muncul.
   - Klik **Preferensi Notifikasi** ➔ pastikan modal pengaturan notifikasi muncul dan toggle switch dapat digeser.
   - Klik **Edit Profil & Data Kontak Pribadi** ➔ pastikan formulir data pribadi terbuka lengkap dengan tombol `← Kembali ke Menu Profil` di atasnya.
   - Lakukan edit data atau tekan `← Kembali ke Menu Profil` untuk kembali ke hub dashboard.
