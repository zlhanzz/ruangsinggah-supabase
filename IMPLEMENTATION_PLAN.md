# IMPLEMENTATION PLAN - Perbaikan Fitur Auto Blur & Sensor Banner Foto Pendataan KostManager

## Analisis Masalah & Kebutuhan
Pada proses pengunggahan foto properti dan area umum di pendataan KostManager ([AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) dan [KostManagerPropertyFormModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPropertyFormModal.tsx)), fitur auto blur dan sensor banner belum bekerja dengan optimal:

1. **Kelemahan Heuristik Offline `autoSensorService.ts`**:
   - [autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts) saat ini hanya mengandalkan sampling kecerahan kasar (`maxLum - minLum > 130` dengan `consecutive >= 4`).
   - Algoritma ini gagal mendeteksi spanduk dunia nyata seperti spanduk berwarna hijau-putih pada pagar/gerbang (seperti pada foto yang dilampirkan user), spanduk dengan kontras sedang, atau teks nomor HP yang terpotong oleh jeruji pagar.
2. **Belum Terintegrasi dengan Edge Function AI Vision**:
   - Sistem sudah memiliki Supabase Edge Function `detect-contact-banner` (berbasis Gemini Vision) dengan akurasi sangat tinggi untuk mendeteksi spanduk "TERIMA KOST", nomor WhatsApp/HP, dan papan kontak langsung, namun [autoSensorService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts) belum memanfaatkannya secara terpadu.
3. **Kesalahan Fallback Blind Blur pada "Sensor Ulang"**:
   - Saat tombol "Sensor Ulang" ditekan dan algoritma heuristik lama gagal menemukan spanduk, sistem secara keliru memburamkan area langit di sepertiga atas foto (`y = height * 0.05`), bukan spanduk di pagar/gerbang/dinding.
4. **Ketiadaan Alat Sensor Manual Interaktif**:
   - Jika ada spanduk kecil, miring, atau tidak terdeteksi otomatis, agen surveyor tidak memiliki cara untuk menandai atau menggambar kotak sensor secara manual (*drag/touch to blur*) langsung pada foto sebelum disimpan.

---

## Dampak Perubahan
File yang akan disentuh / dibuat:

1. **`functions/public/autoSensorService.ts`**:
   - Mengintegrasikan deteksi cerdas **Dual-Engine** (AI Gemini Edge Function `detect-contact-banner` sebagai prioritas utama + Multi-Pass Adaptive Edge & Energy Heuristic sebagai offline fallback).
   - Memperbaiki rendering efek sensor: Mosaik pixelasi mikro rapat + Dark Frosted Glassmorphic Overlay + Branded Capsule Watermark `ruangsinggah.id`.
   - Menjamin 100% kompresi gambar ke format **WebP murni** di sisi front-end (mematuhi Aturan Baku #5).
   - Memperluas daftar kata kunci kategori foto rawan banner (`eksterior`, `pagar`, `gerbang`, `lingkungan`, `fasad`, `depan`, `akses`, `jalan`, dll.).

2. **`functions/public/components/common/PhotoSensorModal.tsx` (Komponen Baru)**:
   - Modal interaktif editor sensor foto dengan kanvas interaktif.
   - Fitur:
     - **Tarik / Gambar Kotak Manual**: Pengguna/agen dapat menarik kotak sensor secara bebas menggunakan mouse/touch langsung di atas spanduk/nomor kontak.
     - **Pindai Ulang AI Otomatis**: Tombol pemicu pemindaian AI instan yang langsung menampilkan kotak-kotak rekomendasi sensor.
     - **Hapus & Sesuaikan Kotak**: Menghapus atau mengatur ulang kotak sensor yang tidak diinginkan.
     - **Terapkan & Simpan**: Membakar efek sensor langsung ke gambar, mengonversi ke `.webp`, mengunggah ke Supabase Storage, dan memperbarui foto secara instan.
   - Menggunakan ikon SVG murni dari **`lucide-react`** (100% bebas FOUT).

3. **`functions/public/pages/AgentDashboard.tsx`**:
   - Menghubungkan tombol "Sensor Ulang" pada kartu foto ke modal editor sensor foto interaktif (`PhotoSensorModal`).
   - Menyempurnakan alur upload foto area umum dan kamar dengan auto-sensor AI + WebP.

4. **`functions/public/components/admin/KostManagerPropertyFormModal.tsx`**:
   - Menghubungkan tombol "Sensor Ulang" ke modal sensor interaktif dan memastikan pemrosesan foto menggunakan auto-sensor terbaru.

---

## Langkah-Langkah Eksekusi

### Langkah 1: Refactor & Upgrade `autoSensorService.ts`
- Tambahkan pemanggilan `detectPhotoContactBanner` dari `adminService.ts` untuk pemindaian berbasis AI Gemini Edge Function.
- Perbarui algoritma fallback client-side dengan multi-scale edge gradient & color variance analysis agar mendeteksi spanduk non-kontras tinggi.
- Terapkan fungsi pembakar sensor visual (`applySensorBoxesToCanvas`) yang rapi, elegan, dan menghasilkan file WebP terkompresi.

### Langkah 2: Pembuatan Komponen `PhotoSensorModal.tsx`
- Buat komponen modal di `functions/public/components/common/PhotoSensorModal.tsx`.
- Sediakan kanvas interaktif dengan preview proporsional, event drag box selection, tombol quick AI scan, hapus box, dan tombol simpan WebP.

### Langkah 3: Integrasi pada Dashboard Agen (`AgentDashboard.tsx`)
- Import dan sediakan state modal sensor foto di `AgentDashboard.tsx`.
- Saat tombol "Sensor Ulang" ditekan pada foto manapun di daftar foto area umum atau kamar, buka `PhotoSensorModal` dengan foto tersebut.
- Update state foto pada form pendataan setelah sensor berhasil diterapkan.

### Langkah 4: Integrasi pada Admin KostManager Modal (`KostManagerPropertyFormModal.tsx`)
- Terapkan pemanggilan `PhotoSensorModal` pada modal admin KostManager agar admin dan surveyor memiliki pengalaman sensor yang seragam.

### Langkah 5: Kompilasi & Verifikasi Build
- Jalankan perintah `npm run build` untuk memvalidasi 0 error TypeScript / Vite bundling.

---

## Rencana Verifikasi
1. **Verifikasi Build**: Menjalankan `npm run build` (harus sukses dengan exit code 0).
2. **Uji Auto-Sensor Saat Upload**:
   - Unggah foto bangunan depan / gerbang yang memuat spanduk nomor kontak.
   - Pastikan auto-sensor AI / heuristic mendeteksi spanduk dan memburamkannya secara otomatis dengan watermark `ruangsinggah.id` dalam format `.webp`.
3. **Uji Fitur "Sensor Ulang" & Editor Sensor Manual**:
   - Klik tombol "Sensor Ulang" pada foto bertanda banner.
   - Pastikan modal `PhotoSensorModal` terbuka menampilkan foto beresolusi penuh.
   - Tarik kotak manual pada area spanduk di pagar/gerbang.
   - Klik "Simpan & Terapkan Sensor".
   - Pastikan foto langsung ter-update di antarmuka pendataan dengan area spanduk yang tersensor rapi.
