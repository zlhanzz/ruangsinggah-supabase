# IMPLEMENTATION PLAN - Peningkatan Kejelasan Status Listing dalam Tahap Peninjauan (Review) di Dashboard Mitra

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini:
Ketika mitra selesai mengisi seluruh formulir pendaftaran kost (6 langkah) dan menekan tombol **"Publikasikan Kost"**, mitra kembali ke halaman Dashboard Mitra tab **"Kost Saya"** dan menemukan tampilan yang sangat membingungkan:
1. **Subtitle Header Menyesatkan**:
   - Subtitle bertuliskan `1 PROPERTI AKTIF`, padahal properti tersebut baru saja disubmit dan belum tayang di publik (`status: 'draft'`).
2. **Badge Status Kartu yang Gelap & Membingungkan (`• DRAFT`)**:
   - Foto properti hanya memiliki badge abu-abu gelap bertuliskan `• DRAFT` (`p.status === 'published' ? '● Aktif' : '● Draft'`).
   - Mitra menjadi bingung dan bertanya-tanya: *"Loh, saya tadi sudah klik Publikasikan Kost, kenapa statusnya masih Draft? Apakah gagal tersimpan? Apakah belum di-publish?"*
3. **Ketiadaan Banner / Informasi Penjelasan di Kartu**:
   - Kartu properti sama sekali tidak menjelaskan bahwa data sudah aman tersimpan dan saat ini sedang dalam antrean verifikasi/peninjauan oleh tim admin RuangSinggah.
4. **Kendala Tombol "Preview" untuk Pemilik**:
   - Tombol `[👁️ Preview]` mengarahkan ke `/kost/${p.id}`, namun fungsi pembacaan data publik (`getPublishedPropertyDetails`) mengunci query dengan `.eq('status', 'published')`.
   - Akibatnya, saat mitra mengklik tombol Preview untuk mengecek tampilan kostnya, sistem gagal menemukan properti dan langsung me-redirect mitra ke halaman katalog umum tanpa penjelasan.

### Tujuan Pengembangan:
1. **Transparansi Status**: Mengubah badge status kartu kost menjadi dinamis, informatif, dan ramah:
   - Status Aktif/Published: Badge hijau cerah `● Tayang Publik` / `● Aktif`.
   - Status Peninjauan: Badge amber/kuning modern dengan animasi denyut halus `<Clock size={11} /> Sedang Ditinjau` atau `Menunggu Review Admin`.
   - Status Suspended: Badge merah `<AlertTriangle size={11} /> Dibekukan / Perlu Revisi`.
2. **Banner Edukasi Status di Dalam Kartu**:
   - Menampilkan box status peninjauan di dalam kartu kost yang menjelaskan secara transparan bahwa listing telah berhasil diajukan dan sedang diperiksa oleh tim admin (estimasi 1x24 jam), serta akan otomatis tayang setelah disetujui.
3. **Akurasi Ringkasan Header "Kost Saya"**:
   - Memisahkan penghitungan properti secara jujur: properti yang tayang aktif vs properti yang sedang dalam tahap peninjauan admin.
4. **Dukungan Pratinjau (Preview) untuk Pemilik**:
   - Mengizinkan pemilik kost dan admin untuk membuka dan mempratinjau halaman `/kost/${p.id}` meskipun statusnya masih dalam peninjauan, dilengkapi banner penanda pratinjau di bagian atas halaman.

---

## 2. Dampak Perubahan

File yang akan disentuh:
1. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\pages\MitraDashboard.tsx`:
   - Menyesuaikan kalkulasi counter ringkasan header (membedakan properti tayang aktif dan yang sedang ditinjau).
   - Memperbarui badge status pada foto kartu properti (mendukung status `published`, `in_review` / `draft`, dan `suspended`).
   - Menambahkan banner/kartu notifikasi status peninjauan yang informatif di dalam kartu properti mitra.
2. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\userService.ts`:
   - Memperbarui fungsi `getPublishedPropertyDetails(propertyId)` agar mengizinkan pemuatan detail properti jika pengguna yang meminta adalah pemilik properti (`owner_uid === user.id`) atau admin, meskipun statusnya belum `published`.
3. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\pages\KostDetail.tsx`:
   - Menampilkan banner pratinjau (*Preview Mode Banner*) jika kost yang sedang dibuka berstatus belum tayang (`status !== 'published'`), memberi tahu pemilik bahwa halaman ini adalah pratinjau sebelum listing disetujui.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Menunggu Persetujuan / ACC)

### Langkah 1: Peningkatan UI Kartu & Header di `MitraDashboard.tsx`
- Hitung metrik properti:
  ```typescript
  const publishedCount = properties.filter(p => p.status === 'published').length;
  const inReviewCount = properties.filter(p => p.status !== 'published' && p.status !== 'suspended').length;
  const suspendedCount = properties.filter(p => p.status === 'suspended').length;
  ```
- Tampilkan ringkasan yang jelas pada header:
  - Misal: `{publishedCount} Properti Tayang Publik {inReviewCount > 0 ? `• ${inReviewCount} Sedang Ditinjau` : ''}`
- Render badge status 3-tingkat pada foto properti:
  - `published`: `bg-emerald-500 text-white` (Tayang Publik)
  - `draft / pending_review`: `bg-amber-500 text-white animate-pulse` (Sedang Ditinjau)
  - `suspended`: `bg-rose-500 text-white` (Ditangguhkan)
- Tampilkan banner penjelasan status di dalam kartu jika `p.status !== 'published'`.

### Langkah 2: Dukungan Pratinjau Pemilik di `userService.ts` & `KostDetail.tsx`
- Di `userService.ts` (`getPublishedPropertyDetails`):
  - Jika properti ditemukan dengan `status === 'published'`, kembalikan langsung.
  - Jika tidak ditemukan, coba ambil properti berdasarkan ID dan periksa apakah user yang sedang login adalah pemilik atau admin. Jika ya, kembalikan detail properti tersebut untuk kebutuhan pratinjau.
- Di `KostDetail.tsx`:
  - Jika `kost.status !== 'published'`, tampilkan banner di bagian atas:
    *"🔍 Mode Pratinjau Pemilik: Listing ini sedang dalam tahap peninjauan admin dan belum dapat dilihat oleh publik."*

### Langkah 3: Verifikasi Kompilasi & Pengujian
- Jalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 0 error kompilasi Vite/TypeScript.

### Langkah 4: Pencatatan Riwayat & Git Push
- Catat ke `functions/PROGRESS.md` sebagai **Fitur #267**.
- Buat laporan `WALKTHROUGH.md`.
- Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Build**: `npm run build` sukses 100% tanpa error kompilasi.
- **Verifikasi UI Dashboard Mitra**:
  1. Header menampilkan jumlah properti aktif dan properti dalam peninjauan secara terpisah dan akurat.
  2. Kartu properti berstatus review menampilkan badge kuning cerah `⏳ Sedang Ditinjau` dengan ikon jam, bukan badge gelap `• DRAFT`.
  3. Kartu properti menampilkan kotak penjelasan edukatif bahwa listing sedang diverifikasi oleh admin (estimasi 1x24 jam) dan akan otomatis tayang.
  4. Tombol **Preview** dapat diklik oleh pemilik dan berhasil membuka tampilan pratinjau detail kost dengan banner khusus mode pratinjau.
