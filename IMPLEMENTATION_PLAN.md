# IMPLEMENTATION PLAN: Pemulihan & Penguatan Sistem Sensor Banner Otomatis AI pada Foto Properti

## 1. Analisis Masalah & Investigasi Mendalam

### A. Latar Belakang Masalah
Pengguna menanyakan: *"kenapa sensor banner otomatis dari sistem kita tidak bekerja lagi?"* sambil menyertakan bukti tangkapan layar foto bangunan tampak depan kost yang memuat spanduk kain bertuliskan *"MENERIMA KOST PUTRI ... HUB WA: 0813 5536 2..."*.
Pada tangkapan layar tersebut:
- Badge foto di kartu antarmuka bernilai **"BARU"** (berwarna hijau emerald), bukan badge **"ruangsinggah.id"** (dark pill).
- Area spanduk nomor WhatsApp **tidak tersensor / tidak tertutup watermark `ruangsinggah.id`**.
- Ini membuktikan secara mutlak bahwa status penyamaran `isBlurred` bernilai `false`.

### B. Temuan Investigasi Teknis
Kami telah melakukan serangkaian pengujian langsung dari backend Edge Function hingga simulasi browser Chrome headless:
1. **Edge Function `detect-contact-banner` di Supabase Cloud Berjalan 100% Normal**:
   - Model `gemini-2.5-flash` aktif dan merespon dalam 1–3 detik.
   - Ketika citra bangunan kost pada tangkapan layar diuji langsung ke Edge Function, AI berhasil mendeteksi secara presisi:
     - Teks: `"MENERIMA KOST PUTRI"`, `"INFO WA : 0813 5536 27"`, `"0823 4990 80"`
     - Bounding box: `{ ymin: 545, xmin: 275, ymax: 905, xmax: 485, label: "contact_banner" }`.
2. **Penyebab Mengapa Foto Tidak Tersensor di Sisi Pengguna (Root Causes)**:
   - **Penyebab 1: Silent Fail & Gangguan Koneksi Internet (Koneksi Terputus / Timeout)**:
     Pengguna baru saja mengalami koneksi terputus (*"stream reading error: read tcp ... connection was aborted by the software in your host machine / lookup daily-cloudcode-pa.googleapis.com: no such host"*). Pada fungsi `detectPhotoContactBanner` (`adminService.ts`), ketika terjadi error jaringan, timeout, atau kegagalan fetch, fungsi langsung mengembalikan `{ hasContact: false, detectedTexts: [], boxes: [] }` secara diam-diam (*silent failure*). Akibatnya, upload foto tetap berlanjut dan sistem menganggap foto tersebut bersih tanpa spanduk.
   - **Penyebab 2: Validasi Tipe File Terlalu Kaku di `createLowResBase64ForAi`**:
     Di `KostFormMitra.tsx`, terdapat guard `if (!file.type.startsWith('image/')) return resolve('')`. Pada beberapa browser Android/Windows atau file galeri tertentu, properti `file.type` bisa berupa string kosong `""` atau `application/octet-stream`. Jika ini terjadi, fungsi mengembalikan string kosong, sehingga pemindaian AI dilewati total (*skipped*).
   - **Penyebab 3: Konfigurasi `verify_jwt` di `supabase/config.toml`**:
     Fungsi `detect-contact-banner` belum didaftarkan dengan `verify_jwt = false` di `supabase/config.toml`. Jika token autentikasi mitra di browser mengalami masa kedaluwarsa (expired session) saat mengunggah foto, API Gateway Supabase dapat memblokir request dengan status HTTP 401 Unauthorized sebelum fungsi sempat dieksekusi.
   - **Penyebab 4: Tidak Adanya Mekanisme Pindai Ulang (*Retry / Re-Scan*) & Deteksi Real-Time**:
     Jika pemindaian otomatis pertama kali terganggu oleh koneksi jaringan, pengguna tidak memiliki tombol atau cara apa pun untuk memindai ulang foto tersebut, dan foto lama yang tersimpan di draf `localStorage` akan tetap berada dalam kondisi belum tersensor.

---

## 2. Dampak Perubahan (Files Affected)

1. `supabase/config.toml`:
   - Mendaftarkan konfigurasi `[functions.detect-contact-banner]` dengan `verify_jwt = false` agar pemanggilan fungsi deteksi banner dari browser selalu 100% diizinkan tanpa terhambat masa aktif JWT.
2. `functions/public/adminService.ts`:
   - Memperkuat pemanggilan `detectPhotoContactBanner`:
     - Menambahkan fallback header eksplisit (Anon Key + bypass JWT) agar pemanggilan tahan banting terhadap session browser.
     - Menambahkan status error diagnostik yang jelas (tidak menelan error secara bisu).
     - Menambahkan mekanisme *auto-retry* 1x dengan backoff singkat jika terjadi gangguan jaringan sesaat.
3. `functions/public/components/KostFormMitra.tsx`:
   - **Robust File Type Check**: Mendeteksi gambar berdasarkan MIME type maupun ekstensi file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, `.bmp`).
   - **Tombol / Opsi "Pindai Spanduk Kontak (AI)" pada Setiap Foto yang Belum Tersensor**:
     - Jika AI sempat terlewat karena gangguan sinyal, mitra atau admin dapat mengklik tombol *"Pindai Banner"* langsung di kartu foto untuk memicu pemindaian dan penyematan watermark `ruangsinggah.id` secara instan tanpa perlu mengunggah ulang foto.
   - **Notifikasi Transparan saat Jaringan AI Mengalami Masalah**: Memberikan toast / peringatan ramah jika koneksi internet sedang tidak stabil sehingga pengguna tahu dan dapat mencoba kembali.
4. `functions/PROGRESS.md`:
   - Mencatat dokumentasi pekerjaan Fitur #269 secara terperinci.
5. `WALKTHROUGH.md`:
   - Membuat laporan walkthrough dan petunjuk verifikasi bagi pengguna.

---

## 3. Langkah-Langkah Eksekusi (Rencana Bertahap)

### Langkah 1: Penguatan Konfigurasi Gateway Supabase (`supabase/config.toml`)
- Menambahkan entri `[functions.detect-contact-banner]` dengan `verify_jwt = false` pada `supabase/config.toml`.

### Langkah 2: Penyempurnaan Service Layer `detectPhotoContactBanner` (`adminService.ts`)
- Memastikan pemanggilan `supabase.functions.invoke('detect-contact-banner')` selalu membawa headers eksplisit (`apikey` dan fallback auth) sehingga tidak pernah ditolak oleh gateway meski token session lokal sedang kadaluarsa.
- Menambahkan auto-retry 1x dengan jeda 800ms jika pemanggilan pertama gagal akibat koneksi mikro-putus.
- Menambahkan log diagnostik detail ke console browser.

### Langkah 3: Penyempurnaan Deteksi & Fitur Pindai Ulang (*Re-Scan*) di `KostFormMitra.tsx`
- Memperluas validasi `createLowResBase64ForAi` agar mengenali gambar berdasarkan ekstensi nama file jika `file.type` kosong dari sistem operasi.
- Menambahkan fungsi `handleReScanBanner(photoId)`:
  - Memungkinkan foto yang sudah ada di daftar namun belum tersensor (misal akibat koneksi sempat drop) untuk dipindai ulang dengan AI dan disematkan watermark `ruangsinggah.id` langsung di canvas.
- Menambahkan tombol aksi kecil *"Pindai Kontak"* pada menu hover / opsi kartu foto kategori rawan spanduk (`Bangunan Depan`, `Area Parkir`, `Lingkungan`).

### Langkah 4: Uji Kompilasi & Build Frontend
- Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi TypeScript/Vite.

### Langkah 5: Pencatatan Progres & Walkthrough
- Mencatat rincian perbaikan ke `functions/PROGRESS.md`.
- Menyusun `WALKTHROUGH.md` lengkap dengan panduan pengujian bagi pengguna.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**:
   - Menjalankan perintah `npm run build` pada folder `functions/public/` dan memastikan output lulus 100% tanpa error (`✓ built in ...s`).
2. **Uji Simulasi Browser Headless**:
   - Memastikan aliran pemanggilan Edge Function, deteksi spanduk, penyematan watermark `ruangsinggah.id`, dan kompresi WebP berjalan sukses di lingkungan peramban.
3. **Verifikasi Antarmuka Pengguna**:
   - Memastikan foto spanduk kontak yang diunggah otomatis tersensor dan menampilkan badge `ruangsinggah.id`.
   - Memastikan tombol pemindaian ulang berfungsi jika pengguna ingin memindai kembali foto yang sebelumnya gagal tersensor.
