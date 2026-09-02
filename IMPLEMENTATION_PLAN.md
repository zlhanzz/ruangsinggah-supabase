# IMPLEMENTATION PLAN: Integrasi CSS Google Stitch pada Beranda (Home) & Bottom Navigation Mobile

## 1. Analisis Kebutuhan & Integrasi CSS Google Stitch

### A. Latar Belakang & Masukan Pengguna
- Pengguna telah menyediakan kode CSS murni hasil konversi dari **Google Stitch** yang memuat:
  1. **Color Tokens & Theme Variables**:
     - `--primary: #994700;` / `--primary-container: #ff7a00;` (Warna oranye khas RuangSinggah).
     - `--background: #f8f9ff;` / `--surface: #f8f9ff;` / `--on-background: #0b1c30;` (Warna background & teks bersih).
     - `--tertiary: #6d3bd7;` (Warna aksen ungu untuk badge kategori/menu).
  2. **Struktur Layout & Styling**:
     - **Navbar Desktop & Mobile**: `.navbar`, `.nav-brand`, `.nav-links`, `.nav-actions`, `.btn-register`.
     - **Search Box**: `.search-box`, `.search-field`, `.search-divider`, `.btn-search`.
     - **Hero Carousel**: `.hero-carousel`, `.carousel-slide`, `.slide-content`, `.carousel-dots`.
     - **Menu Utama & Fitur**: `.features-grid`, `.feature-card`, `.feature-icon`.
     - **Rekomendasi Kost**: `.recommendation-header`, `.btn-outline`, `.kost-grid`, `.kost-card`, `.badges`, `.badge`, `.facility-badge`, `.btn-detail`.
     - **Mobile Bottom Navigation Bar**: `.bottom-nav` dengan 4 menu (`Home`, `Search`, `Orders`, `Profile`).

---

## 2. Arsitektur & Prinsip Pengerjaan

1. **Integrasi CSS pada `index.css`**:
   - Memasukkan CSS tokens dan utility classes Google Stitch ke dalam `functions/public/index.css`.
2. **Kepatuhan Standar Anti-FOUT (Rule 4)**:
   - Mengganti pemanggilan icon ligature Google Material Icons dengan komponen vector SVG lokal dari **`lucide-react`** (`Search`, `Home`, `ClipboardList`, `User`, `MapPin`, `Star`, `Check`, `Share2`, `Camera`, dll.) untuk menjamin **0 network latency** dan **100% bebas kedipan teks**.
3. **Integritas Fungsionalitas & Data**:
   - Menjaga seluruh *state variables*, *logic handler*, hook `useEffect`, *filter drawer*, *routing* `onPageChange`, dan binding *Supabase* tetap utuh 100%.

---

## 3. Dampak Perubahan File

1. **`functions/public/index.css`**:
   - Menyematkan CSS variables, kelas layout, dan styling komponen Google Stitch.
2. **`functions/public/components/Navbar.tsx`**:
   - Menyesuaikan styling navbar desktop dan memperbarui Bottom Navigation Mobile menjadi 4 item (`Home`, `Search`, `Orders`, `Profile`).
3. **`functions/public/pages/Home.tsx`**:
   - Mengadopsi kelas `.search-box`, `.search-field`, `.btn-search`, `.recommendation-header`, dan `.kost-grid`.
4. **`functions/public/components/QuickActionMenu.tsx`**:
   - Mengadopsi struktur `.features-grid`, `.feature-card`, dan `.feature-icon`.
5. **`functions/public/components/PromoCarousel.tsx`**:
   - Mengadopsi styling `.hero-carousel`, `.carousel-slide`, dan `.carousel-dots`.
6. **`functions/public/components/KostCard.tsx`**:
   - Mengadopsi struktur `.kost-card`, `.kost-img-wrapper`, `.badges`, `.badge`, `.facility-badge`, dan `.btn-detail`.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

### Langkah 1: Update `index.css`
- Masukkan CSS Google Stitch ke `index.css`.

### Langkah 2: Update `Navbar.tsx`
- Terapkan 4 menu pada mobile bottom navigation (`Home`, `Search`, `Orders`, `Profile`).
- Terapkan styling `.navbar`, `.btn-register` pada desktop.

### Langkah 3: Update `QuickActionMenu.tsx` & `PromoCarousel.tsx`
- Terapkan `.features-grid`, `.feature-card`, `.hero-carousel`, `.carousel-dots`.

### Langkah 4: Update `Home.tsx` & `KostCard.tsx`
- Terapkan `.search-box`, `.recommendation-header`, `.kost-card`, `.badges`, `.btn-detail`.

### Langkah 5: Uji Kompilasi & Verifikasi
- Jalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi.
- Catat riwayat di `functions/PROGRESS.md`.
- Perbarui `WALKTHROUGH.md`.
- Git commit & push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

| Skenario Pengujian | Hasil yang Diharapkan |
|---|---|
| **Tampilan Desktop (PC)** | Desain beranda mengikuti token dan layout Google Stitch dengan presisi. |
| **Tampilan Mobile (HP)** | Bottom nav menampilkan 4 menu (Home, Search, Orders, Profile), search trigger compact, dan kartu listing rapi. |
| **Navigasi & Interaksi** | Filter pencarian, navigasi halaman, dan klik detail kost tetap berjalan lancar 100%. |
| **Kompilasi TypeScript** | `npm run build` lulus 100% dengan exit code 0. |

---

> **Status:** Menunggu persetujuan (*Proceed / ACC*) dari Pengguna sebelum eksekusi kode (Fase 2).
