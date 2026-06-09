# IMPLEMENTATION PLAN - Peningkatan Desain, Styling, dan Visual Dashboard Mitra (Owner)

Rencana ini dibuat untuk meningkatkan estetika visual, tipografi, dan pengalaman pengguna (UX) pada Dashboard Mitra (Owner) tanpa mengubah fungsionalitas inti.

## 1. Analisis Masalah & Kebutuhan Desain
- **Tipografi & Hirarki Teks**: Penggunaan `font-black` (font weight 900) yang terlalu dominan di berbagai tempat membuat interface terkesan terlalu "berat" dan kurang profesional. Hirarki teks perlu diperbaiki menggunakan kombinasi `font-bold` (700), `font-semibold` (600), dan `font-medium` (500) dengan font modern.
- **Skema Warna & Gradasi**: Palet warna orange saat ini dapat dibuat lebih premium dengan gradasi halus (gradient gradients) dan warna pendukung HSL yang harmonis (misalnya warna slate/gray untuk border dan latar belakang, amber/orange premium untuk aksen).
- **Cards & Layout**: Card properti dan pesanan akan didesain ulang agar memiliki sudut melengkung yang modern (`rounded-3xl`), bayangan yang sangat halus (`shadow-[0_8px_30px_rgba(0,0,0,0.02)]` atau `shadow-md`), serta micro-interactions berupa hover efek (efek angkat, perubahan warna border).
- **Desain Mobile**: Bottom nav mobile akan dioptimalkan dengan sentuhan visual berupa indikator aktif yang membulat lebih elegan, efek transisi halus ketika tab ditekan, serta jarak aman (safe area) yang lebih konsisten.
- **Modals**: Modal edit rekening, penarikan dana, dan detail profil akan dipercantik dengan efek glassmorphism pada backdrop (`backdrop-blur-md`), gradien premium pada header, serta tata letak input form yang lebih rapi.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/pages/MitraDashboard.tsx`:
   - Penyesuaian class CSS pada navigasi desktop sidebar & mobile bottom nav.
   - Peningkatan visual stat cards (menggunakan warna latar belakang bergradasi lembut, ikon yang kontras, dan teks yang lebih seimbang).
   - Pembaruan tampilan card pada daftar kost (Kost Saya) dengan hover zoom halus pada gambar dan card lift-up.
   - Perbaikan hirarki teks pada daftar pesanan (Bookings) agar data pemesan lebih terstruktur dan tombol persetujuan tampak lebih modern.
   - Desain ulang komponen visual di tab Dompet (Wallet) untuk memberikan kesan dompet digital yang mewah.
   - Memastikan tidak ada logika fungsional, state, handler, maupun alur data yang terganggu atau dihapus.

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Desain MitraDashboard.tsx**:
   - Ganti class `font-black` pada label-label umum dengan `font-bold` atau `font-semibold` untuk meningkatkan estetika tipografi.
   - Terapkan bayangan halus dan hover transform pada card properti dan card pesanan.
   - Buat warna background dan border lebih menyatu dengan nuansa modern.
   - Tingkatkan estetika modal (bank edit, withdrawal confirm, dan profile) dengan layout modern, tombol premium dengan gradasi, dan form input yang rapi.
2. **Kompilasi & Build Verifikasi**:
   - Jalankan `npm run build` di folder `functions/public` untuk memastikan kompilasi Vite dan Typescript berjalan sukses tanpa error syntax.

## 4. Rencana Verifikasi
- Melakukan verifikasi visual di perangkat desktop dan mobile (melalui simulasi responsive).
- Memastikan semua navigasi tab berfungsi dengan baik.
- Menguji interaksi tombol (WD, Approve/Reject, Edit, Detail) dan memastikan modal pop-up tampil dengan benar tanpa error JS.
- Memastikan build production sukses.
