# WALKTHROUGH - Pop-Up Iklan Promo Mitra (KostManager) Dinamis & Pembersihan Banner Statis

## Ringkasan Eksekutif
Permintaan pengguna untuk **mengubah banner statis promo KostManager yang hardcode dan memenuhi tempat menjadi Pop-Up Iklan Grafis Dinamis yang dapat ditutup (closeable) serta dapat diunggah desain bannernya melalui Dashboard Super Admin** telah **selesai 100%, lulus uji kompilasi build Vite (0 error), dan siap digunakan**.

Sebelumnya:
- Terdapat 2 banner oranye statis berukuran besar (*"⚡ PREMIUM Gak Punya Waktu Kelola Kost? Upgrade ke KostManager!"*) yang dipasang mati di tab Beranda (overview) dan tab "Kost Saya" (properties). Banner ini memenuhi ruang vertikal dan tidak fleksibel.

Sekarang:
- **Layout Mitra Bersih & Lega**: Kedua banner statis oranye telah dihapus dari halaman Beranda dan Kost Saya.
- **Pop-Up Iklan Modern (Modal Overlay)**:
  - Muncul saat mitra membuka menu "Kelola Kost" (*Kost Saya*) atau saat login.
  - Menampilkan desain grafis iklan berkualitas tinggi dengan tombol tutup `[ ✕ ]` melayang di sudut atas (didukung shortcut tombol `Escape` dan klik di luar backdrop).
  - Mengklik banner langsung mengarahkan mitra ke halaman promosi KostManager (`/kost-manager`).
  - Dilengkapi fallback visual default KostManager jika admin belum mengunggah gambar custom.
- **Pusat Kontrol Desain di Dashboard Super Admin**:
  - Super Admin kini memiliki panel khusus di menu **Manajemen Banner & Promo** (`BannerManagement.tsx`).
  - Fitur kontrol: Pratinjau banner aktif real-time, tombol upload gambar desain baru (otomatis kompresi ke WebP), switch toggle On/Off untuk menayangkan atau mematikan pop-up, input judul/alt text, input tautan tujuan (target URL), dan tombol reset default.

---

## 1. Rincian Perubahan Kode

### A. Tipe Data Konfigurasi Pop-Up
- **Lokasi File**: [types.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts)
- Menambahkan interface `MitraPromoPopupSetting`:
  ```typescript
  export interface MitraPromoPopupSetting {
    is_active: boolean;
    title?: string;
    image_url?: string;
    link_url?: string;
    alt_text?: string;
  }
  ```

### B. Service Pengaturan Admin & Storage Supabase
- **Lokasi File**: [adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)
- Mengembangkan 2 fungsi terpusat berbasis tabel `app_settings` (`key = 'mitra_promo_popup'`):
  1. `getMitraPromoPopupSetting()`: Mengambil konfigurasi pop-up dari database Supabase dengan fallback `DEFAULT_MITRA_PROMO_POPUP`.
  2. `saveMitraPromoPopupSetting(setting, newImageFile?)`: Mengunggah gambar baru ke Supabase Storage bucket `banners/promo/` (otomatis kompresi client-side ke format WebP) dan menyimpan konfigurasinya secara permanen.

### C. Panel Kontrol Desain di Dashboard Super Admin
- **Lokasi File**: [BannerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/BannerManagement.tsx)
- Menambahkan panel kontrol:
  **"🖼️ Kontrol Desain Pop-Up Iklan Promo Mitra (KostManager)"**
  - **Live Preview Card**: Melihat tampilan visual aktif atau pratinjau gambar baru yang baru saja dipilih.
  - **Uploader File Desain Grafis**: Memilih gambar banner promosi dari perangkat.
  - **Switch Toggle Aktifkan Pop-Up**: Admin dapat mematikan iklan sewaktu-waktu tanpa menghapus gambar.
  - **Input Link Navigasi**: Default `/kost-manager`, dapat disesuaikan ke URL eksternal atau promo lainnya.
  - **Tombol Reset Default**: Mengembalikan visual ke kartu promosi standar KostManager.

### D. Integrasi Pop-Up & Pembersihan Layout di Dashboard Mitra
- **Lokasi File**: [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
- Menghapus 2 blok banner statis oranye yang memakan tempat:
  - Tab Beranda (`activeMenu === 'overview'`): digantikan `return null`.
  - Tab Kost Saya (`activeMenu === 'properties'`): digantikan `return null`.
- Memuat `getMitraPromoPopupSetting()` saat dashboard dibuka.
- Membuka modal iklan jika status `is_active === true` saat membuka menu `properties` (*Kost Saya*).
- Menambahkan modal pop-up iklan dengan efek backdrop blur (`backdrop-blur-md`), tombol close `[ ✕ ]` melayang di pojok kanan atas, interaksi klik gambar ke link promo, dan fallback kartu visual bawaan.

---

## 2. Hasil Verifikasi & Uji Kompilasi

Uji kompilasi dijalankan menggunakan TypeScript & Vite bundler:
```bash
cmd /c npm run build
```
**Hasil**:
```text
> vite-react-ts-tailwind-v10@0.0.0 build
> tsc -b && vite build

vite v6.4.1 building for production...
transforming...
✓ 1928 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   3.38 kB │ gzip:   1.14 kB
dist/assets/index-D7bA9v7N.css   92.68 kB │ gzip:  15.54 kB
dist/assets/index-DRm1sKq5.js   1,805.08 kB │ gzip: 494.61 kB
✓ built in 31.95s
```
**Status: 0 Error, 100% Lulus Kompilasi.**

---

## 3. Panduan Pengujian untuk Pengguna (User Testing)

### Skenario 1: Verifikasi Kebersihan Tampilan Dashboard Mitra
1. Masuk ke Dashboard Mitra (`/dashboard-mitra`).
2. Perhatikan tab **Beranda** dan tab **Kost Saya**.
3. **Hasil**: Banner statis oranye besar yang sebelumnya memenuhi tempat kini telah bersih 100%, sehingga daftar listing kost terlihat luas dan nyaman dikelola.

### Skenario 2: Munculnya Pop-Up Iklan Promo & Interaksi Close
1. Klik menu **"Kost Saya"** di sidebar mitra.
2. **Hasil**: Pop-up iklan promo KostManager akan muncul di tengah layar dengan latar belakang gelap blur.
3. Klik tombol close `[ ✕ ]` di sudut kanan atas banner atau tekan tombol `Escape` pada keyboard.
4. **Hasil**: Pop-up tertutup seketika dan mitra dapat langsung mengelola kost.

### Skenario 3: Upload Desain Grafis Baru di Dashboard Super Admin
1. Masuk ke Dashboard Super Admin (`/dashboard-admin` atau menu Manajemen Banner).
2. Temukan panel **"🖼️ Kontrol Desain Pop-Up Iklan Promo Mitra (KostManager)"**.
3. Klik tombol **"Pilih Gambar Desain"** dan pilih file banner promo baru dari komputer Anda.
4. Periksa pratinjau langsung di kartu kontrol.
5. Klik **"Simpan Pengaturan Pop-Up"**.
6. Buka kembali dashboard mitra -> Pop-up sekarang otomatis menampilkan desain grafis baru yang Anda unggah!
