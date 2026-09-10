# IMPLEMENTATION PLAN: Perbaikan Performa Vite Dev Server & Eliminasi Loading Terus-Menerus di Localhost:5173

Dokumen ini disusun untuk menganalisis dan menyelesaikan masalah mengapa akses ke `localhost:5173` terasa sangat berat, mengalami loading terus-menerus (*white screen* tanpa henti), dan startup Vite memakan waktu hingga **10.887 ms (hampir 11 detik)**.

---

## 1. Analisis Masalah & Akar Penyebab

Berdasarkan investigasi mendalam terhadap proses runtime Node.js, file watcher, dan arsitektur repositori:

### 🔴 Akar Masalah 1: Penumpukan 7.126 File Build Usang (352 MB) di `functions/public/dist`
- Pada `functions/public/package.json`, skrip build saat ini adalah:
  ```json
  "build": "vite build && node -e \"const fs=require('fs'); fs.cpSync('../../public', './dist', {recursive: true, force: true});\""
  ```
- `fs.cpSync` hanya menimpa atau menambahkan file baru tanpa menghapus isi direktori `./dist` terlebih dahulu.
- Karena Vite memberi hash unik acak pada setiap chunk hasil kompilasi (misal: `About-1ThFlUfd.js`, `Dashboard-0escf-li.js`, dll.), setiap kali build dijalankan selama 400+ pembaruan fitur sebelumnya, file-file chunk baru terus bertambah dan **tidak pernah dihapus**.
- **Dampaknya**: Terdapat **7.126 file** dengan ukuran total **352 MB** di dalam folder `functions/public/dist/assets`.

### 🔴 Akar Masalah 2: Pemindaian Rekursif Tailwind CSS v4 & Vite Dependency Scanner Membakar CPU 100%
- Proyek menggunakan `@tailwindcss/vite` v4.3.0 (`@import "tailwindcss";` di `index.css`).
- Mesin deteksi Tailwind v4 dan dependency scanner esbuild Vite secara default memindai seluruh direktori proyek untuk menemukan class CSS dan impor dependency.
- Karena folder `dist` berada di dalam root proyek frontend (`functions/public`), setiap kali server dev menyala atau menerima request pertama browser ke `http://localhost:5173`:
  - Tailwind v4 dan Vite memindai seluruh **7.126 file JavaScript minified (352 MB)**.
  - Event loop Node.js mengalami saturasi total (*freeze*) dan menggunakan **100% satu core CPU** (tercatat CPU time proses telah melampaui **868 detik** nonstop).
  - Akibat event loop terkunci, Vite tidak sempat mengirim respons HTTP ke browser. Uji coba koneksi `curl.exe -I http://localhost:5173/` mengalami *timeout/hang* total.
  - Browser Chrome menampilkan layar putih polos dengan spinner loading tab berputar tanpa henti.

### 🔴 Akar Masalah 3: Ketiadaan Watcher Ignore & Scoping Source
- `vite.config.ts` belum mengabaikan folder `dist`, `scratch`, dan folder sementara dari sistem watch Vite (`server.watch.ignored`).
- `index.css` belum menetapkan direktori `@source` spesifik untuk Tailwind v4, sehingga Tailwind memindai seluruh folder kerja tanpa batasan.

### 🔴 Akar Masalah 4: Potensi Reload Loop di `index.tsx`
- Di `index.tsx` terdapat listener `error` dan `unhandledrejection` yang langsung memanggil `window.location.reload()` tanpa batas/cooldown jika chunk lambat termuat saat dev server sedang macet, memperparah sensasi loading berulang-ulang di browser.

---

## 2. Dampak Perubahan (Files to be Modified)

1. **Pembersihan Bersih (Clean-up)**:
   - Menghapus 7.126 file build usang di `functions/public/dist` sehingga hanya file aktif yang tersisa / bersih.
2. **`functions/public/vite.config.ts`**:
   - Menambahkan konfigurasi `server.watch.ignored` untuk mengabaikan `dist`, `scratch`, `.firebase`, dan file sementara lainnya dari pengawasan Vite.
3. **`functions/public/index.css`**:
   - Menambahkan direktori `@source` yang eksplisit (`./index.html`, `./index.tsx`, `./App.tsx`, `./pages`, `./components`, dll.) dan mengecualikan `dist` (`!./dist`), sehingga Tailwind v4 hanya memindai source code murni, bukan ribuan file build.
4. **`functions/public/package.json`**:
   - Memperbaiki skrip `build` agar membersihkan `./dist` sebelum melakukan penyalinan (`fs.rmSync('./dist', ...)`), mencegah penumpukan file usang di masa mendatang.
5. **`functions/public/index.tsx`**:
   - Menambahkan *throttle / cooldown guard* pada interceptor error chunk load (10 detik) agar tidak memicu reload tanpa henti saat dev server sedang inisialisasi.

---

## 3. Langkah-Langkah Eksekusi (Setelah Approval)

1. **Langkah 1: Matikan Proses Node.js Hang & Bersihkan Folder `dist`**:
   - Menghentikan proses Vite yang sedang membakar CPU 100% (PID 37116).
   - Mengosongkan folder `functions/public/dist` dari 7.126 file usang.
2. **Langkah 2: Optimasi `vite.config.ts`**:
   - Tambahkan `server.watch.ignored: ['**/dist/**', '**/scratch/**', '**/.firebase/**']`.
   - Tambahkan opsi `optimizeDeps` yang rapi.
3. **Langkah 3: Optimasi `index.css` dengan Tailwind v4 `@source` Scoping**:
   - Batasi pemindaian class Tailwind hanya pada folder source (`./pages`, `./components`, `./index.tsx`, `./App.tsx`), mengabaikan `dist`.
4. **Langkah 4: Perbaiki Skrip Build di `package.json`**:
   - Pastikan auto-clean `./dist` aktif setiap kali build dijalankan.
5. **Langkah 5: Beri Proteksi Reload Guard di `index.tsx`**:
   - Cegah infinite reload loop dengan `sessionStorage` cooldown timer.
6. **Langkah 6: Validasi & Pengujian**:
   - Uji coba jalankan Vite dev server baru: waktu start harus turun dari 10.887 ms menjadi < 500 ms.
   - Uji respon HTTP `http://localhost:5173/` via `curl.exe`: harus merespon dalam milidetik (Status 200 OK).
   - Jalankan `npm run build` untuk memastikan kompilasi tetap 100% lulus tanpa kendala.

---

## 4. Rencana Verifikasi

1. **Kecepatan Startup Vite**:
   - Menjalankan `npm run dev` dan memverifikasi terminal menampilkan waktu siap (*ready*) di bawah 1 detik (jauh lebih cepat dibanding 10.887 ms sebelumnya).
2. **Koneksi Localhost 5173**:
   - Menguji permintaan HTTP ke `http://localhost:5173/` dan memastikan halaman langsung merespons dengan status 200 OK secara instan tanpa loading berputar tanpa henti.
3. **Kompilasi Build**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan seluruh fitur aplikasi tetap berfungsi normal dan 0 error kompilasi.
