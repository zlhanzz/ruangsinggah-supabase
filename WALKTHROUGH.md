# Walkthrough: Penayangan Banner Promosi KostManager pada Mitra Biasa

Dokumen ini mendokumentasikan implementasi penayangan Banner Promosi KostManager yang selalu aktif untuk akun mitra dengan status mitra reguler / biasa (*Self-Listing*) di Dashboard Mitra.

---

## 1. Ringkasan Perubahan

### A. Komponen Helper `renderKostManagerBanner` di `MitraDashboard.tsx`
- Membangun banner promosi KostManager dengan desain modern:
  - **Palet Visual**: Gradasi oranye-amber-rose (`bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600`) dengan efek dekorasi *soft glow blur orbs*.
  - **Badge Layanan**: `🏢 Solusi Auto-Pilot • KostManager RuangSinggah` dengan ikon `<Sparkles className="animate-pulse" />`.
  - **Heading & Copywriting**: *"Capek Kelola Kost Sendiri? Serahkan Operasional ke KostManager!"*
  - **Quick-Pills Manfaat**:
    - `<ShieldCheck />` Operasional Terima Beres
    - `<Zap />` Tagihan WA Otomatis
    - `<TrendingUp />` Pemasaran Prioritas
    - `<FileText />` Laporan Keuangan Bulanan
  - **Tombol CTA**: *"Pelajari & Ajukan Sekarang"* dengan ikon `<ArrowRight />` yang mengeksekusi `handlePromoNavigate(Page.KOSTMANAGER)`.

### B. Penayangan di Tab "Kost Saya" (`activeMenu === 'properties'`)
- Menempatkan `renderKostManagerBanner()` tepat di atas ringkasan jumlah properti tayang dan tombol tambah kost.
- Mitra biasa yang sedang mengelola atau melihat daftar kostnya akan selalu melihat ajakan upgrade ke KostManager.

### C. Penayangan di Tab "Beranda" / Dashboard (`activeMenu === 'overview'`)
- Menempatkan `renderKostManagerBanner()` di bagian atas halaman beranda dashboard saat pertama kali masuk ke Dashboard Mitra.

### D. Kompatibilitas Mitra yang Sudah KostManager
- Bagi mitra yang sudah memiliki properti terkelola KostManager atau berlangganan aktif (`isKostManager || hasKmActive`), sistem secara otomatis merender kartu status hijau/emerald *"KostManager Auto-Pilot Aktif"* dengan tombol *"Pantau Properti"*.

---

## 2. Hasil Pengujian & Verifikasi Build

1. **Uji Kompilasi Vite (`npm run build`)**:
   - Perintah `cmd /c npm run build` di direktori `functions/public` lulus 100% dengan **0 error**:
     ```bash
     vite v6.4.1 building for production...
     ✓ 2511 modules transformed.
     ✓ built in 28.27s
     ```
2. **Uji Bebas FOUT**:
   - Seluruh ikon menggunakan paket `lucide-react` SVG lokal (`<Sparkles />`, `<ShieldCheck />`, `<Zap />`, `<TrendingUp />`, `<FileText />`, `<ArrowRight />`), bebas dari kedipan teks ligatur.

---

## 3. Panduan Pengujian oleh Pengguna

1. **Buka Dashboard Mitra**:
   - Login dengan akun mitra reguler / biasa yang belum berlangganan KostManager.
   - Pada halaman **Beranda** (halaman utama saat pertama kali membuka dashboard), perhatikan banner promosi oranye KostManager di bagian atas.
2. **Buka Menu Kost Saya**:
   - Klik menu navigasi samping **Kost Saya** (`/mitra/properties`).
   - Perhatikan banner promosi oranye KostManager yang kini tampil di atas daftar properti kost Anda.
3. **Uji Tombol CTA**:
   - Klik tombol **"Pelajari & Ajukan Sekarang"** pada banner.
   - Sistem akan langsung membuka halaman presentasi dan pengajuan layanan KostManager (`/kostmanager`).
