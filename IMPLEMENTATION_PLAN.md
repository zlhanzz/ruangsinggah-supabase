# Rencana Implementasi: Sinkronisasi Build Output Directory Cloudflare Pages (`functions/public/dist`)

## 1. Analisis Masalah & Log Cloudflare Pages
- **Temuan dari Log Terbaru**:
  - Proses `git clone` sudah **100% SUKSES** setelah submodule `gitleaks` dibersihkan di commit sebelumnya.
  - Proses instalasi dependensi (`npm install`) dan kompilasi Vite (`vite build`) juga **100% SUKSES (✓ 2509 modules transformed)**.
  - **Titik Kegagalan**:
    ```
    Validating asset output directory
    Error: Output directory "functions/public/dist" not found.
    Failed: build output directory not found
    ```
- **Akar Penyebab**:
  - Cloudflare Pages pada proyek ini dikonfigurasi mencari output di **`functions/public/dist`** (standar bawaan preset Vite).
  - Sementara itu, konfigurasi `vite.config.ts` diatur untuk mengeluarkan output ke `../../public` (root `public/`).
  - Akibatnya, Cloudflare Pages menganggap folder output tidak ada karena folder `functions/public/dist` kosong/belum dibuat.

- **Tujuan Solusi**:
  1. Memperbarui script `"build"` di `functions/public/package.json` agar setelah `vite build` selesai, otomatis menyinkronkan seluruh file hasil build ke folder **`dist`** (`functions/public/dist`) menggunakan native Node `fs.cpSync`.
  2. Memperbarui script `"build"` di root `package.json` agar juga membuat output di `dist/` dan `functions/public/dist`.
  3. Memastikan semua direktori output (`public/`, `dist/`, dan `functions/public/dist/`) terisi lengkap dan siap disajikan oleh Cloudflare Pages.
  4. Commit dan push ke `bukan-productions` dan `main` agar Cloudflare Pages langsung sukses melakukan deployment.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/package.json` | Perbarui script `"build": "vite build && node -e \"const fs=require('fs'); fs.cpSync('../../public', './dist', {recursive: true, force: true});\""`. |
| `package.json` (Root) | Sinkronkan script delegasi build agar menyertakan penyalinan folder output. |
| `.gitignore` | Pastikan `functions/public/dist/` atau `dist/` diatur dengan tepat. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Perbarui Script Build
- Modifikasi `functions/public/package.json` dan root `package.json`.

### Langkah 2: Uji Kompilasi Lokal & Validasi Folder `dist`
- Jalankan `cmd /c npm run build` di root repository.
- Verifikasi keberadaan file `index.html` dan folder `assets/` di dalam `functions/public/dist/`.

### Langkah 3: Merge ke `main` & Push ke GitHub
- Commit ke `bukan-productions`.
- Merge ke branch `main` dan push ke `origin main`.

---

## 4. Rencana Verifikasi

1. **Uji Validasi Folder Lokal**:
   - Memastikan `functions/public/dist/index.html` dan `functions/public/dist/assets/` ada dan terisi lengkap.
2. **Verifikasi Deployment Cloudflare Pages**:
   - Cloudflare Pages akan memvalidasi direktori `functions/public/dist` $\rightarrow$ Validasi asset sukses $\rightarrow$ Status berubah menjadi **Success / Active (Hijau)**.
3. **Verifikasi Live Website `https://ruangsinggah.id`**:
   - Website live akan langsung menyajikan versi terbaru dari commit `1d545634` / commit perbaikan ini.
