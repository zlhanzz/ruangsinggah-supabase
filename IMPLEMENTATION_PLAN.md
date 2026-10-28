# IMPLEMENTATION PLAN: Redesain Kartu Minimalis Kampus & Fasilitas Terdekat (Nama Lengkap, Jarak & Rute Utuh)

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini
Pada bagian **Kampus Terdekat** dan **Fasilitas Publik** di halaman Detail Kost ([KostDetail.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)), tata letak kartu menggunakan layout 1-baris horisontal yang memaksakan seluruh elemen (Icon, Nama, Durasi Jalan/Motor/Mobil, Badge Jarak km, dan Tombol Rute) berada dalam satu baris sejajar:
1. **Nama Terpotong**:
   Nama kampus seperti *Universitas Islam Negeri Alauddin* terpotong menjadi *"Universitas Isla..."* akibat class `truncate` karena ruang horizontal terhimpit.
2. **Tabrakan Visual (Overlay Collision)**:
   Badge jarak (misal `1.9 km`) menimpa dan menutupi teks durasi transportasi (`🚶 16 mins • 🏍️ 6 mnt • 🚗...`) serta menghimpit tombol Rute.
3. **Keterbacaan Rendah**:
   Format waktu bawaan Google API (seperti `"1 hour 15 mins"`) terlalu panjang dalam bahasa Inggris dan terpotong.

### Kebutuhan Pengguna
1. **Nama & Judul Tampil Lengkap**:
   Seluruh nama universitas, politeknik, sekolah, rumah sakit, maupun fasilitas publik tampil utuh tanpa terpotong `"..."`.
2. **Estimasi Jarak & Waktu Tempuh Lengkap**:
   Jarak (`... km`) serta estimasi waktu (Jalan Kaki, Motor, Mobil) tampil jelas tanpa saling tumpang tindih.
3. **Tombol Fungsi Rute Tetap Lengkap & Fungsional**:
   Tombol *Rute* tetap ada, mudah diklik, dan terintegrasi rapi dengan peta mini.
4. **Kartu Minimalis & Tidak Memenuhi Ruangan (Compact & Elegant)**:
   Menerapkan tata letak 2-tier cerdas yang sangat ramping dan padat:
   - **Tingkat 1 (Header Kartu)**: Icon kecil + Nama Lengkap Kampus/Fasilitas (break-words, tanpa truncate) + Tombol Rute di pojok kanan atas.
   - **Tingkat 2 (Metrik & Durasi)**: Badge Jarak km + Estimasi waktu ringkas bahasa Indonesia (`🚶 16 mnt • 🏍️ 6 mnt • 🚗 6 mnt`).

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
- `functions/public/pages/KostDetail.tsx`:
  - Menambahkan helper pemformat durasi ringkas bahasa Indonesia (`formatTravelDuration`).
  - Merestrukturisasi tata letak kartu pada bagian **Kampus Terdekat** (baris 2304–2361).
  - Merestrukturisasi tata letak kartu pada bagian **Fasilitas Publik** (baris 2390–2447).

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Pembuatan Helper Durasi**:
   ```typescript
   const formatTravelDuration = (raw: string): string => {
     if (!raw) return '';
     return raw
       .replace(/hours?/gi, 'j')
       .replace(/mins?/gi, 'mnt')
       .replace(/sec(onds?)?/gi, 'dtk')
       .replace(/(\d+)\s*j\s*(\d+)\s*mnt/gi, '$1j $2m')
       .trim();
   };
   ```
2. **Pembaruan Kartu Kampus Terdekat**:
   - Ganti layout horizontal sesak menjadi layout 2-tier berstruktur rapi:
     - Header: Icon + Nama Lengkap (tanpa `truncate`, `leading-snug`) + Tombol Rute.
     - Footer metrik: Badge jarak + Estimasi waktu (jalan kaki, motor, mobil) yang lega dan tidak saling bertumpukan.
3. **Pembaruan Kartu Fasilitas Publik**:
   - Terapkan struktur 2-tier yang sama dengan tema warna biru fasilitas publik.
4. **Verifikasi Build**:
   - Jalankan build frontend: `cmd.exe /c "npm --prefix functions/public run build"`
   - Jalankan build backend: `cmd.exe /c "npm --prefix functions run build"`
5. **Dokumentasi & Git Synchronization**:
   - Catat riwayat progres **#463** di `functions/PROGRESS.md`.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan Nama Lengkap**:
   - Pastikan nama kampus panjang (misal: *Universitas Islam Negeri Alauddin Makassar*, *Politeknik Negeri Ujung Pandang*) terbaca utuh 100% tanpa elipsis `"..."`.
2. **Uji Tabrakan Visual (Collision Test)**:
   - Pastikan badge jarak km dan teks durasi tidak lagi tumpang tindih di layar desktop maupun mobile.
3. **Uji Fungsionalitas Tombol Rute**:
   - Tombol *Rute* tetap memicu perubahan polyline peta rute interaktif di atasnya.
4. **Uji Kelulusan Build**:
   - 0 error kompilasi pada Vite dan TypeScript.
