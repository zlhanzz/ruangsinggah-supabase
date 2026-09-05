# Walkthrough: Pemulihan Desain Klasik Halaman Kontak & Penyelarasan Akses Menu Pusat Bantuan

## Ringkasan Pekerjaan
Mengembalikan desain halaman **Kontak/Bantuan (`/contact`)** 100% ke tampilan klasiknya yang bersih, minimalis, dan elegan (Single Card: Left Dark Panel + Right White Form) sesuai preferensi pengguna, sekaligus memastikan keselarasan akses dari menu **Pusat Bantuan** di footer maupun tombol **Pusat Bantuan 24/7** di Profile Hub.

---

## 📸 Detail Tampilan & Akses Terpadu

### 1. Tampilan Klasik Bersih `Contact.tsx`
- **Header**: Judul ringkas *"Hubungi Kami"* dan subjudul *"Ada pertanyaan atau mau konsultasi kost? Kami siap membantu kamu!"*.
- **Tombol Navigasi `← Kembali`**: Terpasang di sudut atas untuk navigasi cepat kembali ke halaman sebelumnya.
- **Card Split 2 Kolom**:
  - **Panel Kiri Gelap (`bg-[#0f172a]`)**:
    - WhatsApp CS: `+62 813-5632-6260` (klik langsung membuka chat WhatsApp).
    - Email: `bantuan@ruangsinggah.id`.
    - Headquarters: `Makassar, Sulawesi Selatan`.
    - Ikon Media Sosial: Instagram, TikTok, Facebook.
  - **Panel Kanan Putih (`bg-white`)**:
    - Formulir *"Kirim Pesan Cepat"* (Nama Lengkap, Nomor WhatsApp, Pilihan Keperluan, Pesan, dan Tombol Oranye `Kirim Pesan`).
- **100% Vector SVG `lucide-react`**: Menggunakan `Phone`, `Mail`, `MapPin`, `ArrowLeft` (0 delay & bebas FOUT).

### 2. Akses Terpadu
- **Footer**: Menu *"Pusat Bantuan"* di bawah kolom *Perusahaan* mengarahkan ke halaman `/contact`.
- **Profile Hub**: Tombol *"Pusat Bantuan 24/7"* di menu Profil mengarahkan ke halaman `/contact` yang sama persis.

---

## 🧪 Hasil Pengujian & Verifikasi

### 1. Kompilasi Build Frontend (`npm run build`)
- **Status**: **LULUS (100% PASS)**
- **Hasil Rollup/Vite**:
  ```text
  ✓ 2510 modules transformed.
  ../../public/assets/Contact-C-Hyg8sF.js     9.38 kB │ gzip: 2.98 kB
  ✓ built in 34.29s
  ```
- **0 Error Kompilasi, 0 Warning Syntax**.

---

## 🚀 Panduan Pengujian oleh Pengguna

1. Buka web aplikasi di browser.
2. Klik menu **"Pusat Bantuan"** di Footer atau tombol **"Pusat Bantuan 24/7"** di halaman **Profil** (`/profile`).
3. Pastikan halaman yang terbuka adalah desain klasik yang bersih (Card split panel kiri hitam + panel kanan formulir putih) persis seperti tampilan awal.
4. Klik tombol **`← Kembali`** di kiri atas untuk kembali ke halaman profil/beranda.
