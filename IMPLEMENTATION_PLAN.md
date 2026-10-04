# Rencana Implementasi: Akselerasi Ultra-Cepat Upload Foto Listing, Deteksi Sudut Banner Presisi (Perspective Quad), dan Single-Pass Watermark WebP

## 1. Analisis Masalah & Jawaban Pertanyaan Pengguna

### A. Mengapa Proses Upload Foto Pertama Sangat Lama dan Sensor Banner Tidak Berfungsi (Hanya Ada Watermark)?
Berdasarkan investigasi mendalam terhadap log dan kode sistem:
1. **Cold Start Deno Edge Function**:
   - Supabase Edge Function `detect-contact-banner` berjalan di atas container Deno serverless yang mengalami *cold start* saat idle. Pada pemanggilan pertama, container membutuhkan inisialisasi selama 4–8 detik.
2. **Model Loop yang Membuang Waktu di Edge Function**:
   - Di `supabase/functions/detect-contact-banner/index.ts`, urutan model kandidat dimulai dari `"gemini-2.0-flash"` dan `"gemini-1.5-flash"`. Berdasarkan pengujian langsung kami via script, kedua model tersebut gagal/404 pada endpoint saat ini, sehingga Edge Function membuang waktu mencoba seluruh API key untuk model-model yang gagal sebelum akhirnya beralih ke `"gemini-2.5-flash"` (yang sebenarnya aktif dan sukses).
3. **Frontend Timeout & Ketiadaan Fallback di Form Pemilik Kost (`KostFormMitra.tsx`)**:
   - Karena kombinasi cold start + model loop yang memakan waktu > 15-18 detik, request frontend mengalami *timeout* pada percobaan pertama.
   - Di `KostFormMitra.tsx`, blok penanganan error AI (`detection.error`) **tidak memicu fallback sensor**. Foto langsung diteruskan ke proses kompresi WebP reguler dan diberi watermark, tanpa disensor sama sekali, serta memicu munculnya tombol perisai oranye 🛡️ (*Re-Scan Manual*) pada kartu foto seperti yang terlihat di tangkapan layar pengguna.
4. **Proses Kanvas Berganda (Double Canvas Round-Trip)**:
   - Alur saat ini memproses gambar dua kali: citra mentah dimuat ke kanvas 1 untuk sensor blur -> diekspor ke File -> dimuat lagi ke kanvas 2 untuk crop 4:3 + watermark RuangSinggah.id -> diekspor lagi ke WebP. Hal ini memakan memori CPU/RAM dan memperlambat proses upload.

### B. Mengapa Upload Foto Kedua Terasa Sedikit Lebih Cepat dan Sensor Banner Bekerja?
- Pada upload kedua, container Deno Supabase **sudah berada dalam kondisi hangat (*warm*)** di memori. Walaupun masih membuang waktu pada model loop yang gagal, eksekusinya selesai dalam ~4.5 detik (di bawah batas timeout 18 detik). Karena respons AI berhasil diterima, fungsi sensor kotak banner berhasil dieksekusi.

---

## 2. Tujuan Pengembangan & Solusi yang Diusulkan

1. **Akselerasi Ultra-Cepat (Fast-Path Architecture)**:
   - **Background Pre-Warming Engine**: Saat pengguna membuka Formulir Kost pada langkah 5 (FOTO) atau saat modal dibuka, sistem secara otomatis mengirimkan ping ringan ke Edge Function di latar belakang (*non-blocking*). Ketika pengguna memilih foto dari galeri, Edge Function sudah dalam kondisi *warm* 100%.
   - **Fast-Path Kategori Non-Banner**: Foto untuk kategori internal (kamar tidur, kamar mandi, kasur, lemari, dapur, dll.) dipastikan **0ms delay AI** — langsung diproses melalui Single-Pass WebP + Watermark (< 150ms).
   - **Optimasi Payload AI**: Citra yang dikirim ke AI dikompresi optimal ke 800px-1024px JPEG kualitas 0.60 (~40-60 KB Base64), memangkas waktu transmisi jaringan seluler hingga 75%.
   - **Penyederhanaan Model Cascade Edge Function**: Menempatkan `"gemini-2.5-flash"` sebagai prioritas nomor 1 dengan mematikan reasoning budget (`thinkingBudget: 0`) agar latensi AI turun drastis ke kisaran 1–1.5 detik.

2. **Deteksi Sudut Banner Presisi & Penyesuaian Perspektif (Perspective Quad Polygon)**:
   - Memperbarui prompt dan schema output Gemini AI agar tidak hanya mengembalikan kotak tegak lurus (*axis-aligned bounding box*), melainkan **4 titik sudut terluar dari spanduk** (`polygon: [[x_tl, y_tl], [x_tr, y_tr], [x_br, y_br], [x_bl, y_bl]]`).
   - Menerapkan rendering kanvas dengan **Perspective Clipping Path**:
     - Efek sensor pixelate dan frosted glass gelap hanya diterapkan di dalam bidang poligon spanduk miring tersebut.
     - Struktur pagar besi/kayu vertikal, dinding, atau tiang di samping spanduk **tidak akan ikut tertutup kotak hitam**.
     - Badge watermark `ruangsinggah.id` diposisikan di titik centroid dan dirotasi mengikuti sudut kemiringan spanduk (`angle = Math.atan2(dy, dx)`).

3. **Single-Pass Rendering Pipeline**:
   - Menggabungkan proses deteksi, sensor miring/poligon, watermark diagonal RuangSinggah.id, dan konversi WebP ke dalam **satu kali putaran kanvas (Single-Pass)**.

4. **Multi-Layer Defensive Fallback**:
   - Jika koneksi internet pengguna sangat lambat dan request AI melebihi batas waktu (timeout dipersingkat menjadi 7 detik agar pengguna tidak menunggu lama), sistem secara otomatis mengaktifkan pemindaian lokal cerdas (*Smart Heuristic Client-Side Edge Detection*) sehingga spanduk tetap tersensor secara instan (< 50ms) dan foto **tidak akan pernah lolos tanpa sensor**.

---

## 3. Dampak Perubahan (Daftar File yang Disentuh)

1. `supabase/functions/detect-contact-banner/index.ts`:
   - Penataan ulang urutan model: meletakkan `gemini-2.5-flash` di urutan pertama.
   - Penambahan parameter `thinkingBudget: 0` untuk akselerasi respon.
   - Peningkatan schema instruksi untuk mendeteksi 4 titik sudut spanduk (`polygon` / `corners`) untuk koreksi kemiringan perspektif.
   - Penambahan dukungan `ping: true` untuk background pre-warming.
2. `functions/public/autoSensorService.ts`:
   - Implementasi `applyPerspectivePolygonSensorToCanvas`: rendering sensor quadrilateral miring presisi berbasis sudut banner + rotasi badge.
   - Implementasi `warmUpBannerDetectionEngine`: pemicu pre-warming Edge Function.
   - Refaktor `processPhotoWithAutoSensor` menjadi Single-Pass Canvas Pipeline (menggabungkan sensor + watermark + WebP dalam 1x draw).
3. `functions/public/components/KostFormMitra.tsx`:
   - Menghubungkan pre-warming saat masuk ke langkah FOTO.
   - Mengadopsi pipeline single-pass terpadu dari `autoSensorService.ts`, menghapus duplikasi fungsi lama `applyBlurToBoundingBoxes`.
4. `functions/public/components/admin/KostManagerPropertyFormModal.tsx` & `functions/public/pages/AgentDashboard.tsx`:
   - Memastikan pre-warming dan deteksi poligon perspektif aktif pada dashboard agen survei.
5. `functions/public/adminService.ts`:
   - Menyelaraskan interface `detectPhotoContactBanner` agar mendukung 4 titik koordinat poligon.

---

## 4. Langkah-Langkah Eksekusi Bertahap

- [ ] **Langkah 1: Optimasi Edge Function `detect-contact-banner`**
  - Mengubah urutan prioritas model ke `gemini-2.5-flash` di posisi pertama.
  - Memperbarui instruksi prompt untuk menghasilkan koordinat 4 sudut (`polygon`: top-left, top-right, bottom-right, bottom-left) berskala 0-1000.
  - Menambahkan endpoint handler untuk `{ ping: true }`.
  - Menguji waktu respon via script uji.

- [ ] **Langkah 2: Pembaruan Engine Rendering Kanvas di `autoSensorService.ts`**
  - Membuat fungsi `applyPerspectivePolygonSensorToCanvas` dengan `ctx.beginPath()`, `ctx.clip()`, dan rotasi badge `ruangsinggah.id`.
  - Menyediakan fallback ke bounding box jika poligon tidak terdeteksi.
  - Mengintegrasikan pre-warming function `warmUpBannerDetectionEngine`.
  - Mengimplementasikan Single-Pass Canvas Pipeline (skala -> AI/heuristik -> sensor poligon -> watermark -> WebP blob).

- [ ] **Langkah 3: Integrasi ke `KostFormMitra.tsx` & Dashboard Agen**
  - Menghapus double canvas round-trip di `KostFormMitra.tsx`.
  - Memasang pre-warming otomatis saat pengguna mencapai Step 5 (Foto).
  - Memastikan kategori non-banner langsung selesai dalam < 150ms tanpa request AI.
  - Memastikan kategori banner rawan kontak memproses poligon miring secara mulus.

- [ ] **Langkah 4: Kompilasi, Verifikasi Build & Pengujian**
  - Menjalankan `npm run build` di `functions/public` untuk memastikan 0 error TypeScript / linting.
  - Menjalankan script simulasi pemrosesan citra dengan spanduk miring.

- [ ] **Langkah 5: Dokumentasi Progres & Sinkronisasi Git**
  - Mencatat riwayat pembaruan ke `functions/PROGRESS.md`.
  - Menyusun panduan hasil pengujian di `WALKTHROUGH.md`.
  - Melakukan commit dan push ke remote branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Kecepatan (Benchmark Latensi)**:
   - Pemanggilan pre-warmed Edge Function harus selesai dalam < 1.8 detik (sebelumnya 8–18 detik).
   - Foto non-banner (kamar mandi, kamar tidur) selesai diproses dan diberi watermark dalam < 200ms.
2. **Uji Presisi Sudut & Kemiringan Banner (Perspective Quad)**:
   - Menguji foto dengan spanduk sewa kost yang posisinya miring/diambil dari sudut samping (seperti pada contoh pagar kayu dan jendela depan).
   - Memastikan sensor hanya menutupi kain spanduk mengikuti 4 sudut miringnya, tanpa memotong pagar atau dinding di luar batas spanduk.
   - Memastikan teks badge `ruangsinggah.id` berotasi sejajar dengan kemiringan spanduk.
3. **Uji Kelulusan Build**:
   - Menjalankan `npm run build` pada direktori frontend untuk memastikan tidak ada kesalahan tipe atau regresi.

---
*Mohon tinjau rencana implementasi ini. Jika disetujui, silakan berikan persetujuan ("ACC" / "Proceed") agar saya dapat melanjutkan ke Fase 2 (Eksekusi).*
