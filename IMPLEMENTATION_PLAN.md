# IMPLEMENTATION PLAN - Penghapusan Shortcut Redundan Pesanan & Pesan pada Tampilan Mobile (`MitraDashboard.tsx`)

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  Pada tampilan mobile (`lg:hidden`) di Beranda Dashboard Mitra, terdapat 2 tombol kartu pintasan (*Quick Links*):
  - **Pesanan** (`handleMenuChange('bookings')`) dengan info jumlah pesanan baru.
  - **Pesan** (`handleMenuChange('chat')`) dengan info status chat belum terbaca.
- **Masukan & Evaluasi Pengguna**:
  Kedua menu tersebut sudah tersedia secara permanen dan mudah diakses melalui **Bottom Navigation Bar** di bagian bawah layar smartphone. Keberadaan kartu pintasan ini di area konten utama menjadi redundan, memakan ruang vertikal (*screen real estate*), dan membuat antarmuka dashboard mobile terasa sesak.
- **Tujuan Perbaikan**:
  Menghapus blok kartu pintasan mobile *Quick Links* (Pesanan & Pesan) dari Beranda [`MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx) agar tampilan dashboard mobile lebih bersih, ringkas, dan fokus pada ringkasan metrik performa kost.

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/pages/MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx):
  - Menghapus blok elemen kartu *Quick Links — Mobile only* (baris 1358-1368).
- [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Mencatat riwayat implementasi Progres 324.
- `WALKTHROUGH.md`:
  - Menerbitkan dokumentasi hasil pengujian dan tampilan layout mobile yang lebih lega.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Approval)
1. **Modifikasi `MitraDashboard.tsx`**:
   - Menghapus kontainer `<div className="grid grid-cols-2 gap-3 lg:hidden">...</div>` yang memuat tombol Pesanan dan Pesan.
2. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
3. **Pencatatan & Git Repository**:
   - Mencatat ke `functions/PROGRESS.md` (Progres 324) dan memperbarui `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- [ ] Buka Dashboard Mitra pada resolusi smartphone / mobile viewport $\rightarrow$ Baris kartu pintasan Pesanan dan Pesan di bawah Stat Cards sudah bersih/terhapus, menyisakan tata letak yang lega dan fokus.
- [ ] Navigasi ke Pesanan dan Chat tetap dapat diakses dengan lancar via Bottom Navigation Bar.
- [ ] Jalankan uji build `npm run build` $\rightarrow$ 100% lulus tanpa error.
