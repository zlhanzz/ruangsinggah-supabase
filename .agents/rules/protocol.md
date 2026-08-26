# Protokol Kerja Workspace & Siklus Pengembangan Fitur (Aturan Baku)

Dokumen ini adalah aturan wajib bagi AI Agent dalam mengelola repositori ini.

---

## 1. Siklus Kerja 2-Fase (Wajib Terpisah & Tidak Boleh Sekaligus)

AI Agent **DILARANG KERAS** membuat `IMPLEMENTATION_PLAN.md` dan langsung mengeksekusi modifikasi kode serta menerbitkan `WALKTHROUGH.md` dalam satu proses/giliran (turn) yang bersamaan. Proses pengembangan WAJIB dipisah menjadi 2 fase yang tegas:

### 📌 FASE 1: Perencanaan & Pengajuan (Implementation Plan)
Ketika User memberikan instruksi baru untuk mengembangkan fitur, memperbaiki bug, atau mengubah logika sistem:
1. Agent **HANYA** bertugas menganalisis masalah dan menyusun dokumen `IMPLEMENTATION_PLAN.md` dalam Bahasa Indonesia yang memuat:
   - **Analisis Masalah / Kebutuhan**: Apa yang rusak, apa tujuan pengembangan, dan konteks alurnya.
   - **Dampak Perubahan**: Daftar spesifik file yang akan disentuh.
   - **Langkah-Langkah Eksekusi**: Rencana urutan modifikasi kode yang akan dilakukan secara bertahap.
   - **Rencana Verifikasi**: Bagaimana cara memastikan fitur tersebut berhasil (misal: uji kompilasi `npm run build` dan verifikasi manual).
2. Agent menyajikan `IMPLEMENTATION_PLAN.md` sebagai artifact dengan `RequestFeedback: true` sehingga User dapat meninjau dan menekan tombol persetujuan (*Proceed / ACC*).
3. **STOP & WAIT FOR APPROVAL**: Setelah menyajikan dokumen perencanaan, Agent **WAJIB BERHENTI** dan menunggu respon / persetujuan ("ACC", "Proceed", atau masukan revisi) dari User. **DILARANG KERAS** melakukan modifikasi file kode pada fase ini.

---

### 🚀 FASE 2: Eksekusi, Verifikasi, dan Pelaporan (Hanya Setelah di-ACC)
Hanya setelah User secara eksplisit memberikan persetujuan / ACC pada `IMPLEMENTATION_PLAN.md`:
1. **Modifikasi Kode Bertahap (Incremental)**: Lakukan perubahan kode secara bertahap dan presisi, tanpa merombak logika yang sudah berjalan stabil.
2. **Kompilasi & Pengujian**: Jalankan uji kelulusan build (misal: `npm run build` / `tsc`) untuk memastikan 0 error kompilasi.
3. **Pencatatan Riwayat (Anti-Amnesia)**: Wajib mencatat ringkasan pekerjaan yang telah selesai ke dalam `functions/PROGRESS.md`.
4. **Penerbitan Dokumen Walkthrough**: Buat dan sajikan dokumen `WALKTHROUGH.md` dalam Bahasa Indonesia yang memuat:
   - **Daftar Perubahan**: Detail file dan perubahan logika yang telah dilakukan.
   - **Hasil Pengujian**: Bukti kelulusan build atau simulasi log.
   - **Panduan Pengujian User**: Langkah-langkah bagi user untuk memverifikasi fitur di UI.

---

## 2. Keberlanjutan Progres (Anti-Amnesia)
- Semua riwayat fitur yang sudah selesai harus selalu dicatat dalam `functions/PROGRESS.md`.
- Jika ada sesi atau agent baru, agent tersebut wajib membaca `functions/PROGRESS.md` dan `IMPLEMENTATION_PLAN.md` terakhir sebelum memulai tugas baru.

---

## 3. Stabilitas Sistem & Komunikasi
- Agent harus memprioritaskan stabilitas sistem di atas penambahan fitur baru yang berisiko.
- Hindari perombakan masal (refactor besar-besaran) yang tidak diminta oleh User.

---

## 4. Standar Baku UI/UX, Ikon, dan Pencegahan FOUT (Flash of Unstyled Text)

Untuk memastikan pengalaman visual selalu premium, instan, dan bebas glitch:
1. **Larangan Ikon Berbasis Font Ligature Eksternal (Google Fonts CDN)**:
   - **DILARANG KERAS** menggunakan icon font HTML ligature seperti `<span className="material-symbols-outlined">nama_icon</span>` atau Google Material Icons CDN.
   - *Alasan*: Menimbulkan FOUT (Flash of Unstyled Text) di mana nama teks mentah (seperti `calendar_today`, `schedule`, `bolt`, `phone`, `location_on`) muncul di layar pengguna saat koneksi jaringan sedang memuat file font `.woff2`.
2. **Wajib Menggunakan Pure Bundled Vector SVG (`lucide-react`)**:
   - Semua ikon wajib diimpor dan dirender sebagai komponen React SVG dari package **`lucide-react`** (misal: `<Calendar />`, `<Clock />`, `<Zap />`, `<Phone />`, `<MapPin />`, `<Navigation />`, dll.).
   - *Keuntungan*: Ikon vector ter-bundle 100% di dalam JavaScript lokal, menjamin **0 network request**, **0ms delay**, dan **100% bebas dari FOUT/kedipan teks**.
3. **Integritas Fungsionalitas saat Perubahan UI/UX Masif**:
   - Jika di masa depan dilakukan perombakan tampilan/redesain UI/UX secara masif, Agent **WAJIB menjaga keutuhan fungsionalitas**:
     - Dilarang menghapus atau mengubah state variables, logic handler, hook `useEffect`, fungsi submit, validasi form, atau binding Supabase/Firebase yang sudah berjalan stabil.
     - Setiap perubahan markup dan styling wajib mempertahankan alur data dan kompatibilitas skema database.
4. **Optimasi Transisi Loading & Asset**:
   - Transisi antara skeleton loader dan konten data riil harus mulus tanpa layout shift.
   - Font teks web (Inter, Plus Jakarta Sans) wajib menggunakan `font-display: swap` dan preconnect.

---

## 5. Standar Baku Manajemen Gambar & Konversi Wajib WebP (Client-Side Compression)

Untuk menjamin performa website super cepat (*High Performance*), efisiensi penyimpanan (*storage cost*), dan waktu muat minimal bagi pengguna:
1. **Konversi Otomatis Client-Side ke WebP Sebelum Upload**:
   - **WAJIB** mengonversi dan mengompresi setiap file gambar (foto properti, kamar, area publik, bukti pembayaran, avatar/profil, dokumen survey, dll.) menjadi format **`.webp`** di sisi front-end (menggunakan HTML5 Canvas / background processing) **SEBELUM** file dikirim ke Supabase Storage / CDN / Database.
   - Kualitas kompresi disesuaikan (misal: 0.80 - 0.85 untuk foto listing/kamar, resolusi maksimal dibatasi agar tidak mengunggah file mentah berukuran belasan MB dari kamera HP modern).
2. **Seluruh Aset Gambar Statis Wajib WebP / SVG**:
   - Seluruh aset grafis statis pada sistem (seperti logo web, banner hero, thumbnail fitur, ilustrasi, dan icon pendukung) **HARUS** menggunakan format modern **`.webp`** (atau SVG murni untuk logo vektor). Dilarang menyertakan file JPEG/PNG mentah berukuran besar tanpa kompresi WebP.
3. **Penyimpanan Storage yang Bersih & Efisien**:
   - File yang masuk ke Supabase Storage wajib berekstensi `.webp` dengan MIME type `image/webp`.

---

## 6. Standar Baku Caching & Optimasi Query Database (SWR / Cache-First Strategy)

Untuk menjaga performa front-end super responsif, menghemat kuota pembacaan (*read quota*) Supabase/Firebase, dan mencegah *over-fetching*:
1. **Penerapan Caching pada Data Fetching**:
   - Setiap halaman atau komponen yang mengambil data dari database (seperti katalog properti, detail kost, fasilitas, artikel, konfigurasi tarif, profil mitra/agen, dsb.) **WAJIB** menerapkan mekanisme caching (misal: in-memory cache, `sessionStorage` / `localStorage`, atau pola *Stale-While-Revalidate* / Cache-First dengan TTL terukur).
   - Dilarang melakukan request ulang ke database secara mentah jika data valid sudah tersedia di cache lokal.
2. **Pencegahan Redundant Queries**:
   - Hindari query duplikat pada hook `useEffect` yang dipicu oleh re-render atau perpindahan tab/navigasi yang cepat. Gunakan flag/ref penahan atau state caching global.
3. **Invalidasi Cache Otomatis saat Mutasi (Create / Update / Delete)**:
   - Ketika pengguna atau agen melakukan perubahan data (submit formulir, edit kamar, ubah status, hapus foto, update profil, dsb.), cache terkait **WAJIB dibersihkan atau diperbarui secara instan** agar data yang tampil selalu akurat dan sinkron dengan database.

---

## 7. Larangan Deploy & Git Push Mandiri
- **JANGAN PERNAH** melakukan deploy ke production atau push ke GitHub/Git repository secara mandiri. Biarkan User yang melakukannya sendiri secara manual.
