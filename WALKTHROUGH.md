# WALKTHROUGH - Progres 320: Pengaktifan & Penyempurnaan Roadmap Alur Step-by-Step Pemasaran Kost Mitra Baru

## 📋 Ringkasan Perubahan
Memperbaiki bug persistensi state panduan `tourCompleted` dan menyempurnakan roadmap alur 4 langkah pemasaran kost untuk mitra baru di Dashboard Mitra (`MitraDashboard.tsx`). Kini setiap akun mitra baru dipastikan melihat alur panduan langkah demi langkah saat login, serta dapat membuka atau menutup panduan kapan saja melalui banner ringkas *"Alur Pemasaran Kost RuangSinggah [Buka Panduan Alur]"*.

---

## 🛠️ Detail Perubahan Kode

### 1. `functions/public/pages/MitraDashboard.tsx`
- **State Storage Berbasis Akun (`uid`)**:
  - Mengubah key penyimpanan dari key global tunggal menjadi key terisolasi per akun:
    - `mitra_tour_completed_${uid || 'guest'}`
    - `mitra_tour_dismissed_${uid || 'guest'}`
    - `mitra_viewed_listing_${uid || 'guest'}`
- **Fungsi Toggle Buka/Tutup**:
  - `handleDismissGuide`: Menyimpan status dismiss sementara dan meminimalkan card panduan.
  - `handleOpenGuide`: Menghapus status dismiss dan membuka kembali tampilan penuh panduan alur.
  - `handleCompleteTour`: Menandai penyelesaian seluruh tur alur dan meminimalkan card ke bentuk banner ringkas.
- **Tampilan Roadmap 4 Langkah Interaktif**:
  - **Langkah 1: 1. Verifikasi Identitas**: Status verifikasi KTP mitra (`isVerified`).
  - **Langkah 2: 2. Upload & Kelola Kost**: Menampilkan jumlah kost terdaftar (`properties.length`).
  - **Langkah 3: 3. Tayang di Marketplace**: Menampilkan kesiapan iklan dan tombol preview tampilan katalog (POV User).
  - **Langkah 4: 4. Terima Sewa & Dana**: Menghubungkan ke pemantauan pesanan booking dan rekening penarikan dana sewa.
- **Banner Buka Panduan saat Diminimalkan**:
  - Ketika panduan ditutup/selesai, dashboard menampilkan banner ringkas dengan icon `Compass` dan tombol `[Buka Panduan Alur]`.

---

## 🧪 Hasil Pengujian & Kompilasi
Kompilasi TypeScript dan Vite build:
```bash
cmd /c npm run build
```
**Hasil**:
- `vite v6.4.1 building for production...`
- `✓ 2509 modules transformed.`
- `✓ built in 53.83s`
- Output tersinkronisasi ke `public/` dan `functions/public/dist/`.
- **Status: 0 Error, 100% Lulus**.

---

## 🧭 Panduan Verifikasi Pengguna
1. **Skenario 1 (Mitra Baru / Belum Lengkap Langkahnya)**:
   - Login ke Dashboard Mitra.
   - Pada halaman **Beranda (Overview)**, card **"Alur Pemasaran Kost Mitra Baru"** akan langsung tampil di atas pintas menu mobile / ringkasan statistik.
   - Klik kartu **Langkah 1: Verifikasi Identitas** $\rightarrow$ Langsung diarahkan ke tab Profil untuk upload KTP.
2. **Skenario 2 (Minimalkan Panduan & Buka Kembali)**:
   - Klik tombol `[X]` di sudut kanan card panduan.
   - Card akan beralih menjadi banner ringkas elegan: *"Alur Pemasaran Kost RuangSinggah [Buka Panduan Alur]"*.
   - Klik tombol **[Buka Panduan Alur]** $\rightarrow$ Card penuh 4 langkah akan langsung terbuka kembali.
3. **Skenario 3 (Penyelesaian Panduan)**:
   - Ketika seluruh 4 langkah selesai, klik tombol **[Selesaikan Panduan & Minimalkan]** $\rightarrow$ Panduan tersimpan selesai dan tetap dapat dibuka kapan saja melalui banner ringkas.
