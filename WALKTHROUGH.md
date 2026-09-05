# Walkthrough: Penyelarasan Menu Pusat Bantuan Terpadu pada Footer & Profile Hub

## Ringkasan Pekerjaan
Penyelarasan navigasi menu **Pusat Bantuan** pada Footer dan Profile Hub Dashboard (`/profile`), serta penyempurnaan antarmuka halaman **Pusat Bantuan (`/contact`)** agar konsisten, modern, responsif, dan 100% menggunakan pure bundled SVG icon (`lucide-react`).

---

## 📸 Detail Perubahan Navigasi & Tampilan

### 1. Perubahan Menu Footer (`Footer.tsx`)
- Teks menu di bawah kolom **PERUSAHAAN** yang sebelumnya bernama **"Kontak"** kini telah diubah menjadi **"Pusat Bantuan"**.
- Mengklik menu ini akan membuka halaman Pusat Bantuan (`/contact`).

### 2. Penyelarasan Menu Profile Hub (`Profile.tsx`)
- Tombol **"Pusat Bantuan 24/7"** di dalam Profile Hub yang sebelumnya langsung melakukan `window.open` ke WhatsApp eksternal, kini diarahkan menggunakan `navigate(Page.CONTACT)`.
- Dengan ini, pengguna yang mengklik "Pusat Bantuan 24/7" di profil akan melihat tampilan Pusat Bantuan yang sama persis seperti yang dibuka dari footer web.

### 3. Redesain Modern Halaman Pusat Bantuan (`Contact.tsx`)
- **Header Pusat Bantuan**: Dilengkapi badge layanan pelanggan, judul terpadu, dan tombol `← Kembali` responsif.
- **3 Kanal Layanan Terpadu**:
  1. **WhatsApp CS 24/7**: Live chat langsung ke nomor WhatsApp resmi (+62 815-2708-0656).
  2. **Email Resmi**: Dukungan formal di `bantuan@ruangsinggah.id`.
  3. **Kantor Operasional**: Lokasi kantor Makassar & jam operasional.
- **Formulir Kirim Pesan & Pertanyaan**:
  - Pilihan kategori keperluan (Info Kost, Beli Database, Jasa Survey, Daftar Mitra, Kendala Transaksi, dll.).
  - Pesan yang diisi akan otomatis diteruskan secara rapi ke WhatsApp CS resmi.
- **100% Pure Bundled SVG (`lucide-react`)**: Bebas kedipan teks (FOUT), 0 network overhead.

---

## 🧪 Hasil Pengujian & Verifikasi

### 1. Kompilasi Build Frontend (`npm run build`)
- **Status**: **LULUS (100% PASS)**
- **Hasil Rollup/Vite**:
  ```text
  ✓ 2510 modules transformed.
  ../../public/assets/Contact-B-J4z-4v.js    16.93 kB │ gzip: 4.71 kB
  ✓ built in 43.42s
  ```
- **0 Error Kompilasi, 0 Warning Syntax**.

---

## 🚀 Panduan Pengujian oleh Pengguna (User Testing Guide)

1. Buka aplikasi web (mobile atau desktop).
2. **Uji dari Footer**:
   - Gulir ke bagian footer web.
   - Lihat kolom **PERUSAHAAN** ➔ pastikan menu tertulis **"Pusat Bantuan"**.
   - Klik menu tersebut ➔ pastikan halaman Pusat Bantuan (`/contact`) terbuka.
3. **Uji dari Profile Hub**:
   - Buka halaman **Profil** (`/profile`).
   - Pada section *Bantuan & Informasi Legal*, klik **"Pusat Bantuan 24/7"**.
   - Pastikan diarahkan ke halaman Pusat Bantuan (`/contact`) yang sama persis.
4. **Uji Fitur Pusat Bantuan**:
   - Coba klik tombol *Chat WhatsApp Sekarang* atau isi form pesan cepat untuk memastikan pesan terformat dengan rapi.
   - Klik tombol `← Kembali` di sudut atas untuk kembali ke halaman sebelumnya secara mulus.
