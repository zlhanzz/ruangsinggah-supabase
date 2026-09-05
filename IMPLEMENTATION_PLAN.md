# Rencana Implementasi: Penyesuaian Responsivitas Header Navbar (Tombol Masuk & Daftar Fit di Layar Mobile)

## 1. Analisis Masalah & Kebutuhan
- **Masalah**:
  - Pada tampilan perangkat mobile (khususnya lebar layar < 400px seperti iPhone, Samsung Galaxy, dll.), tombol **"Masuk"** dan tombol oranye **"Daftar"** di bagian header navigasi atas tampak terlalu mepet ke tepi kanan layar dan sebagian terpotong / *overflow*.
- **Penyebab Utama**:
  1. Ukuran teks logo `RuangSinggah.id` pada mobile berukuran tetap `text-2xl` (24px) dan tinggi gambar `h-10` sehingga memakan porsi lebar horizontal yang terlalu besar (sekitar ~236px).
  2. Jarak (*gap*) dan *padding* tombol autentikasi mobile berukuran lebar (`gap-3`, tombol "Masuk" `px-3 py-2`, tombol "Daftar" `px-5 py-2` font `text-sm`), memakan ruang horizontal ~166px.
  3. Total lebar yang dibutuhkan mencapai > 430px, melebihi lebar layar mobile rata-rata (360px - 390px), sehingga tombol "Daftar" terdorong keluar batas viewport.

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/components/Navbar.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/Navbar.tsx): Penyesuaian tata letak responsif pada header navbar, logo brand, dan tombol autentikasi (Masuk & Daftar).

---

## 3. Rencana Langkah-Langkah Eksekusi
1. **Optimasi Logo Responsif**:
   - Skala gambar logo: `h-8 sm:h-10 md:h-12 w-auto mr-1 sm:mr-1.5`.
   - Ukuran teks nama brand: `text-xl sm:text-2xl font-extrabold` untuk "RuangSinggah" dan `text-xl sm:text-2xl font-bold` untuk ".id" dengan properti `tracking-tight shrink-0`.
2. **Optimasi Tinggi & Padding Navbar**:
   - Container navbar utama: `h-16 sm:h-20` dengan padding `px-3 sm:px-6 lg:px-8` agar pas dan tidak terbuang sia-sia di layar sempit.
3. **Penyelarasan Tombol Masuk & Daftar**:
   - Container tombol auth: `gap-1.5 sm:gap-3`.
   - Tombol **Masuk**: `text-xs sm:text-sm font-bold text-gray-800 hover:text-orange-500 px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer`.
   - Tombol **Daftar**: `text-xs sm:text-sm font-bold bg-[#ff7a00] hover:bg-orange-600 text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer whitespace-nowrap`.
4. **Pemeriksaan Status Login / Mobile Avatar**:
   - Pastikan avatar dan bell notifikasi mobile tetap rapi dan proporsional.

---

## 4. Rencana Verifikasi
1. **Verifikasi Kompilasi**:
   - Menjalankan `npm run build` di direktori `functions/public` untuk memastikan 0 error TypeScript dan JSX.
2. **Verifikasi Responsivitas Layout**:
   - Memastikan tidak ada *horizontal overflow* pada resolusi layar mobile kecil (320px - 414px) maupun tablet dan desktop.
   - Tombol "Masuk" dan "Daftar" tampak fit, simetris, presisi, dan nyaman disentuh (*touch-friendly*).
