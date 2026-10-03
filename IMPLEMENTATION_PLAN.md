# Rencana Implementasi: Sistem Anti-Pencurian Konten Watermark RuangSinggah.id & Preservasi WebP Responsif

## 1. Analisis Masalah & Kebutuhan

### Konteks Saat Ini
1. **Dua Jalur Pendaftaran & Upload Listing Kost**:
   - **Jalur 1: Dashboard Pemilik Kost (Self Listing)** melalui [`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx): Pemilik kost mengunggah foto bangunan, fasilitas bersama, dan unit tipe kamar secara mandiri.
   - **Jalur 2: Dashboard Agen Survey (KostManager)** melalui [`KostManagerPropertyFormModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPropertyFormModal.tsx) & [`AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx): Agen survey mengambil dan mengunggah foto fisik di lapangan untuk listing kamar dan area umum properti terkelola.
2. **Kebutuhan Anti-Pencurian Konten (Watermarking)**:
   - Foto properti dan kamar kost yang berkualitas tinggi rentan diunduh (*scraped* / *right-click save*) dan dicuri oleh pihak ketiga atau platform kompetitor tanpa izin.
   - Diperlukan proteksi watermark resmi bermotif pola diagonal berulang (*staggered diagonal lattice pattern*) bertuliskan `RuangSinggah.id` lengkap dengan logo resmi RuangSinggah, persis seperti contoh referensi yang diberikan pengguna (baik versi lanskap 16:9 maupun persegi 1:1).
3. **Persyaratan Performa & Preservasi WebP**:
   - Watermark **tidak boleh membuat website atau load konten menjadi lambat atau berat**.
   - Sistem kompresi WebP client-side yang sudah berjalan stabil wajib dipertahankan: watermark harus dibakar langsung (*baked-in*) ke dalam kanvas gambar saat konversi ke format `.webp` berlangsung di browser klien **sebelum** dikirim ke Supabase Storage.
   - Tidak ada beban komputasi canvas atau DOM overlay berat saat pengunjung membuka katalog/detail kost di browser.
4. **Adaptasi Responsif Desktop & Mobile**:
   - Watermark harus proporsional dan tertata rapi di berbagai rasio foto (16:9 lanskap, 4:3 standar, 1:1 persegi, maupun foto portrait dari kamera HP vertikal).
   - Saat ditampilkan pada layar desktop monitor lebar maupun layar sempit ponsel pintar (mobile), watermark tetap rapi, proporsional, tidak pecah, dan tidak bertumpuk semrawut.

---

## 2. Dampak Perubahan (Files Touched)

Modifikasi akan dilakukan secara terukur pada file-file berikut:

1. [`functions/public/autoSensorService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/autoSensorService.ts)
   - Menambahkan helper rendering canvas `drawRuangSinggahWatermarkPattern(ctx, width, height)`:
     - Pola diagonal berulang (kemiringan -28°).
     - Logo RuangSinggah (`/logo.png`) + Teks `RuangSinggah` (oranye) + `.id` (charcoal/gelap).
     - Transparansi lembut (~0.24 - 0.28) dan bayangan tipis agar terbaca jelas baik pada latar foto terang maupun gelap.
     - Perhitungan grid dan skala dinamis proporsional terhadap resolusi gambar.
   - Menambahkan fungsi pembungkus kompresi: `compressKostPhotoWithWatermark(file, quality, maxWidth)` yang mengonversi foto ke WebP sekaligus menyematkan watermark anti pencurian.
   - Mengintegrasikan penyematan watermark ke dalam `processPhotoWithAutoSensor` agar foto area publik/eksterior yang melewati sensor spanduk kontak otomatis juga terlindungi watermark di seluruh permukaannya.

2. [`functions/public/components/KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx) (Jalur 1: Pemilik Kost)
   - Memperbarui fungsi `handleCategoryFilesUpload`: seluruh foto baru yang dipilih pemilik kost (baik foto area bangunan maupun foto kamar tidur/kamar mandi) diproses menggunakan `compressKostPhotoWithWatermark` sebelum disimpan ke draft storage.
   - Memperbarui fungsi `handleReScanBanner` agar foto hasil re-scan tetap memiliki watermark WebP utuh.

3. [`functions/public/components/admin/KostManagerPropertyFormModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPropertyFormModal.tsx) (Jalur 2: Agen Survey KostManager)
   - Memperbarui pengunggahan foto area umum (`handleUploadPublicPhoto`) dan foto unit kamar (`handleUploadRoomUnitPhoto`) serta pengunggahan ulang/edit foto di tab kamar & fasilitas agar melewati kompresi WebP ber-watermark.

4. [`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) (Jalur 2: Agen Survey Dashboard)
   - Memperbarui `handleUploadRoomPhoto` dan upload foto draft kamar agar memproses file dengan `compressKostPhotoWithWatermark` sebelum memanggil `uploadFileAndGetURL`.

5. [`functions/public/adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)
   - Memperbarui `addPropertyWithMedia` dan `updatePropertyWithMedia`: saat memproses sisa `imageFiles` (jika ada file mentah yang belum terkompresi saat submit), pastikan gambar di-watermark ke format WebP sebelum diunggah ke bucket `properties`.
   - Menjaga agar foto non-properti (KTP verifikasi mitra, banner promo, slip transfer) TIDAK terkena watermark diagonal.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Hanya Setelah di-ACC)

### Langkah 1: Pembuatan Engine Pola Watermark Diagonal di `autoSensorService.ts`
1. Siapkan helper pemuat gambar logo `getRuangSinggahLogoImage()` dengan in-memory cache agar pemanggilan berulang berkecepatan 0ms.
2. Buat fungsi `drawRuangSinggahWatermarkPattern(ctx: CanvasRenderingContext2D, width: number, height: number)`:
   - Hitung skala elemen berbasis dimensi canvas:
     `const baseDim = Math.min(width, height);`
     `const scale = Math.max(0.65, Math.min(1.4, baseDim / 900));`
   - Rotasi kanvas -28° (atau gambar pada sudut diagonal).
   - Render deretan baris selang-seling (staggered brick layout):
     - Ikon Logo (tinggi ~26px * scale, lebar proporsional).
     - Teks "RuangSinggah" (warna oranye `#EA580C`, font bold sans-serif ukuran ~16px * scale).
     - Teks ".id" (warna `#1E293B` atau `#0F172A`).
     - Atur `ctx.globalAlpha` pada rentang ~0.24 - 0.28 (estetis, protektif, dan tidak mengaburkan estetika kamar).
     - Berikan bayangan halus (`shadowBlur: 2`, `shadowColor: 'rgba(255,255,255,0.45)'` dan fallback gelap tipis) agar kontras optimal pada latar belakang gelap maupun terang.
3. Buat fungsi `compressKostPhotoWithWatermark(file: File, quality = 0.82, maxWidth = 1920): Promise<File>`:
   - Buka file gambar ke canvas dengan batasan `maxWidth` (standar 1920px).
   - Gambar foto asli.
   - Panggil `drawRuangSinggahWatermarkPattern(ctx, canvas.width, canvas.height)`.
   - Ekspor canvas langsung ke Blob `image/webp` dengan kualitas 0.82.
   - Kembalikan objek `File` berekstensi `.webp`.
4. Integrasikan juga pemanggilan `drawRuangSinggahWatermarkPattern` ke dalam `processPhotoWithAutoSensor` sebelum baris `canvas.toBlob(...)`.

### Langkah 2: Integrasi Jalur 1 - Dashboard Pemilik Kost (`KostFormMitra.tsx`)
1. Impor `compressKostPhotoWithWatermark` dari `../autoSensorService`.
2. Di `handleCategoryFilesUpload`:
   - Gantikan pemanggilan `compressImageToWebP(fileToProcess)` dengan `compressKostPhotoWithWatermark(fileToProcess)`.
   - File yang dihasilkan berformat WebP dengan watermark permanen, langsung diunggah ke draft storage Supabase dan pratinjau langsung menampilkan watermark.
3. Di `handleReScanBanner`:
   - Gunakan `compressKostPhotoWithWatermark(blurredFile)` agar hasil re-scan tetap ber-watermark.

### Langkah 3: Integrasi Jalur 2 - Dashboard Agen Survey (`KostManagerPropertyFormModal.tsx` & `AgentDashboard.tsx`)
1. Di `KostManagerPropertyFormModal.tsx`:
   - Gantikan fungsi lokal `compressImageToWebP` dengan pemanggilan `compressKostPhotoWithWatermark`.
   - Pastikan pengunggahan foto kamar tidur (`handleUploadRoomUnitPhoto` & multi-room upload baris ~3225) dan area umum (`handleUploadPublicPhoto` & baris ~2692) menghasilkan WebP ber-watermark.
2. Di `AgentDashboard.tsx`:
   - Perbarui `handleUploadRoomPhoto` (baris ~3833) dan upload foto draft kamar agar memproses file dengan `compressKostPhotoWithWatermark` sebelum memanggil `uploadFileAndGetURL`.

### Langkah 4: Penguatan Pipeline Simpan Properti di `adminService.ts`
1. Pastikan fungsi `addPropertyWithMedia` dan `updatePropertyWithMedia` yang mengunggah foto properti ke bucket `properties` menerapkan watermark pada file mentah yang belum terkompresi.
2. Pastikan file dokumen/bukti non-properti (KTP, banner, bukti pembayaran) tetap menggunakan `convertToWebP` standar tanpa watermark diagonal.

---

## 4. Rencana Verifikasi (Testing Plan)

1. **Uji Kompilasi TypeScript & Vite**:
   - Jalankan `cmd.exe /c npm run build` di root workspace untuk menjamin 0 error TypeScript dan bundel frontend sukses 100%.
2. **Uji Simulasi Watermark di Canvas**:
   - Uji pembuatan watermark pada foto beresolusi lanskap (16:9), standar (4:3), persegi (1:1), dan potret (9:16).
   - Pastikan pola berulang menutupi foto secara teratur tanpa distorsi atau tumpang tindih berlebih.
3. **Uji Ukuran File WebP & Kinerja**:
   - Pastikan output file tetap bertipe `image/webp` dengan ukuran file ringan (< 250 KB), menjaga kecepatan muat katalog dan detail kost tetap instan.
4. **Uji Tampilan Responsif**:
   - Buka pratinjau di layar desktop monitor dan simulasi layar mobile (ponsel pintar): pastikan watermark beradaptasi rapi mengikuti orientasi gambar tanpa merusak layout antarmuka.
5. **Pencatatan Riwayat & Git Push**:
   - Catat seluruh rangkuman pekerjaan ke dalam `functions/PROGRESS.md`.
   - Terbitkan dokumen laporan `WALKTHROUGH.md`.
   - Lakukan commit dan push ke branch `bukan-productions`.

---
> 🛑 **Sesuai Protokol Baku Siklus Kerja 2-Fase**: Modifikasi kode **HANYA** akan dieksekusi setelah rencana implementasi ini ditinjau dan disetujui (*Proceed / ACC*) oleh User.
