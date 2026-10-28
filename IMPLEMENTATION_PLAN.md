# IMPLEMENTATION PLAN: Penghapusan Badge Overlay Floating "RUANGSINGGAH.ID" pada Preview Foto

## 1. Analisis Masalah & Kebutuhan

### A. Konteks & Pertanyaan Pengguna
Pengguna mempertanyakan fungsi dari badge / banner teks mengambang bertuliskan `[ 🟠 RUANGSINGGAH.ID ℹ️ ]` yang muncul di pojok kiri atas thumbnail foto yang telah diunggah:
- Pengguna menilai elemen ini kurang berguna, tidak memiliki fungsi teknis penting, dan bukan merupakan bagian dari watermark asli maupun fungsi pemrosesan sensor foto.
- Pengguna meminta agar elemen ini dihapus jika memang tidak berguna.

### B. Temuan & Evaluasi Teknis
1. **Bukan Bagian dari File Foto (Hanya Elemen DOM Front-End)**:
   - Badge gelap lonjong `[ 🟠 RUANGSINGGAH.ID ℹ️ ]` tersebut adalah elemen HTML `<span className="absolute top-1.5 left-1.5 bg-slate-900/90 ...">` yang dirender di atas thumbnail React ketika flag `item.isBlurred` bernilai `true`.
   - File foto sebenarnya yang dikompresi dan dikirim ke Supabase Storage **sudah memiliki stempel sensor kanvas fisik dan watermark diagonal resmi secara permanen di dalam gambar WebP**.
2. **Kelemahan & Dampak Negatif Badge Overlay**:
   - **Menutupi Visual Foto**: Pada thumbnail berukuran kecil/sedang di layar HP maupun laptop, badge ini memakan porsi 40–50% lebar foto di bagian atas.
   - **Tumpang Tindih UI**: Badge ini menabrak tombol hapus foto merah `(X)` di kanan atas thumbnail.
   - **Beban Kognitif & Ambiguitas**: Teks badge `ruangsinggah.id` identik dengan teks watermark, membuat mitra bingung apakah itu watermark yang salah tempat atau ada error pada foto.
3. **Kesimpulan**:
   - Badge overlay floating ini **100% aman dan sangat direkomendasikan untuk dihapus**.
   - Menghapus badge overlay ini membuat thumbnail preview foto menjadi bersih, jernih, dan profesional, tanpa mengurangi fungsi keamanan auto-sensor kanvas yang sudah tertanam di file aslinya.

---

## 2. Dampak Perubahan

File yang akan disentuh:
- [functions/public/components/KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx):
  - Menghapus blok `{/* Status Badges */}` pada Section A (Foto Fasilitas Umum).
  - Menghapus blok `{/* Status Badges */}` pada Section B (Foto Tipe Kamar).
  - Merapikan posisi action button pojok kanan atas agar tetap presisi dan bersih.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Pembersihan Section A (Foto Fasilitas Umum)**:
   - Menghapus elemen kondisional `item.isBlurred ? (...) : (...)` di bawah baris pemrosesan overlay.
2. **Pembersihan Section B (Foto Khusus Tipe Kamar)**:
   - Menghapus elemen kondisional `item.isBlurred ? (...) : (...)` yang sama pada daftar foto tipe kamar.
3. **Kompilasi & Build Frontend**:
   - Menjalankan `npm --prefix functions/public run build` untuk memverifikasi 0 error TypeScript dan bundler Vite.
4. **Kompilasi & Build Backend**:
   - Menjalankan `npm --prefix functions run build` untuk memverifikasi `tsc` backend.
5. **Pencatatan Progres Anti-Amnesia**:
   - Mencatat ke [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) (entri **#456**).
6. **Penerbitan Dokumen Walkthrough**:
   - Memperbarui [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md).
7. **Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Visual**:
  - Foto yang terdeteksi spanduk tetap memiliki sensor fisik kanvas dan watermark asli di dalam gambarnya.
  - Di atas thumbnail tidak ada lagi pil hitam `[ 🟠 RUANGSINGGAH.ID ]` maupun badge `Baru`.
  - Tombol hapus foto `(X)` dan tombol pemindaian ulang AI tetap berfungsi normal dan tidak lagi terhalang.
- **Verifikasi Build**:
  - `npm --prefix functions/public run build` harus exit code 0 tanpa error kompilasi.
