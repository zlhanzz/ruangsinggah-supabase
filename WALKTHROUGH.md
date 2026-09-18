# Walkthrough: Restrukturisasi 4 Kategori Menu Profil Mitra & Penambahan Modal Preferensi Notifikasi (`MitraProfile.tsx`)

Dokumen ini mendokumentasikan implementasi penataan ulang menu profil pemilik kost (mitra), pemisahan program layanan dengan pusat bantuan, serta penambahan modal preferensi notifikasi sesuai arahan desain terbaru.

---

## 1. Ringkasan Perubahan

### A. Restrukturisasi 4 Grup Kategori Menu Independen
Sebelumnya, menu profil mitra memiliki struktur yang padat di mana pengaturan langsung membuka formulir ubah kata sandi, dan program KostManager bercampur dengan pusat bantuan. Sekarang tampilan disusun menjadi 4 bagian yang teratur dan serasi dengan profil user (`Profile.tsx`):

1. **Grup 1: KEUANGAN & DATA DIRI**
   - **`Penarikan Saldo`**: Menampilkan badge saldo aktif (`Rp X`), ikon `<Wallet />`, dan navigasi langsung ke tab dompet untuk pencairan sewa dan rekening bank.
   - **`Informasi Pribadi`**: Menampilkan badge verifikasi KTP (`Terverifikasi ✓`, `Sedang Ditinjau`, `Perlu Revisi`), ikon `<UserCheck />`, dan navigasi ke formulir data diri.

2. **Grup 2: PENGATURAN AKUN & KEAMANAN** *(Standar Seragam dengan User)*
   - **`Keamanan & Kata Sandi`**: Ikon `<Lock />` biru $\rightarrow$ membuka modal ganti kata sandi berproteksi verifikasi Email OTP 6-digit.
   - **`Preferensi Notifikasi`**: Ikon `<Bell />` kuning $\rightarrow$ membuka modal preferensi notifikasi kanal WhatsApp, Email, & Promo.

3. **Grup 3: PROGRAM & SOLUSI KOST** *(Kategori Mandiri)*
   - **`Program KostManager Auto-Pilot`**: Ikon `<Sparkles />` ungu $\rightarrow$ solusi pengelolaan hunian terima beres dengan badge status (`Autopilot 👑` / `Diproses`).

4. **Grup 4: PUSAT BANTUAN & INFORMASI LEGAL** *(Kategori Mandiri)*
   - **`Pusat Bantuan 24/7`**: Ikon `<HelpCircle />` toska $\rightarrow$ menghubungkan langsung ke WhatsApp CS resmi.
   - **`Ketentuan Layanan Kemitraan`**: Ikon `<FileText />` $\rightarrow$ membuka syarat, ketentuan, dan panduan hukum pemilik kost (`/terms`).
   - **`Keluar dari Akun Mitra`**: Tombol logout akun mitra.

### B. Komponen Modal Preferensi Notifikasi
- Menyediakan 3 toggle interaktif:
  - **Notifikasi WhatsApp**: Pemberitahuan penyewaan dan pembayaran sewa masuk.
  - **Notifikasi Email**: Rekap saldo bulanan dan laporan akun kemitraan.
  - **Promo & Fitur Baru**: Informasi program operasional dan promo KostManager.
- Menggunakan state reaktif `notifSettings` dan tombol *Simpan Preferensi* dengan feedback visual langsung.

### C. Bebas FOUT (100% Lucide React SVG)
- Seluruh icon dimuat melalui vector SVG murni dari package `lucide-react` tanpa menggunakan font CDN ligature, menjamin performa cepat tanpa kedipan teks mentah.

---

## 2. Hasil Verifikasi Kompilasi (Build Test)

Perintah kompilasi frontend Vite dijalankan dan berhasil 100% tanpa error:
```bash
cmd.exe /c npm run build
```

**Output Log**:
```
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.92 kB │ gzip:   2.29 kB
../../public/assets/index-B5qcSKpE.css                 299.39 kB │ gzip:  35.93 kB
../../public/assets/MitraDashboard-Bd_Qbzih.js         427.40 kB │ gzip:  93.13 kB
✓ built in 32.91s
```

---

## 3. Panduan Pengujian bagi Pengguna (User Testing)

1. Buka dashboard mitra dan masuk ke menu **Profil** (`/dashboard-mitra/profile`).
2. Periksa struktur menu yang tampil di layar:
   - Pastikan terdapat 4 judul kategori dengan huruf kapital dan warna abu-abu elegan:
     - `KEUANGAN & DATA DIRI`
     - `PENGATURAN AKUN & KEAMANAN`
     - `PROGRAM & SOLUSI KOST`
     - `PUSAT BANTUAN & INFORMASI LEGAL`
3. Klik menu **`Preferensi Notifikasi`**:
   - Modal preferensi notifikasi akan muncul dengan 3 toggle (WhatsApp, Email, Promo & Fitur Baru).
   - Coba ubah toggle dan klik tombol *Simpan Preferensi*.
4. Klik menu **`Keamanan & Kata Sandi`**:
   - Modal keamanan akan terbuka dengan header "Keamanan & Kata Sandi" serta formulir verifikasi Email OTP 6-digit.
5. Periksa kategori **`PROGRAM & SOLUSI KOST`**:
   - Menampilkan satu menu fokus `Program KostManager Auto-Pilot` secara terpisah dari pusat bantuan.
6. Periksa kategori **`PUSAT BANTUAN & INFORMASI LEGAL`**:
   - Berisi `Pusat Bantuan 24/7`, `Ketentuan Layanan Kemitraan`, dan tombol `Keluar dari Akun Mitra`.
