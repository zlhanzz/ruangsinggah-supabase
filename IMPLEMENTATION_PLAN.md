# IMPLEMENTATION PLAN: Optimasi Transisi & Redesain UI/UX Tab Switcher Tipe Kamar

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini
Pada halaman Detail Kost ([KostDetail.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)), calon penyewa merasa transisi dan peralihan saat mengeklik tab tipe kamar (misal: *Tipe Standard*, *Tipe Premium*) terasa **kurang smooth dan berat secara UI/UX**:
1. **Jitter / Layout Shift**:
   - Tab aktif menggunakan `ring-2 ring-orange-500 ring-offset-1` yang merubah ketebalan dan bounding box elemen secara dinamis.
   - Badge ketersediaan di dalam tab memiliki border kondisional (`border border-emerald-200` saat tidak aktif, dan tanpa border saat aktif). Penambahan/penghapusan border ini memicu *micro layout shift* (pergeseran lebar tombol beberapa pixel).
   - Penggunaan `transition-all` memaksa browser melakukan kalkulasi ulang box-sizing, border, dan layout secara menyeluruh (heavy reflow/repaint), bukan sekadar akselerasi GPU.
2. **Estetika Visual Kaku (Clunky)**:
   - Tombol-tombol tab tampil terpisah-pisah dengan kontras tebal yang kaku, belum menerapkan pola *Modern Segmented Pill Navigation* yang lazim pada aplikasi modern (seperti Airbnb/Apple).
3. **Peralihan Konten Kasar**:
   - Card fasilitas kamar di bawah tab berganti secara mendadak tanpa transisi crossfade yang lembut.

### Kebutuhan & Target Solusi
1. **Zero Layout Shift (0px Pergeseran)**:
   - Seluruh tab dan badge internal memiliki dimensi dan border metrics yang tetap dan konsisten dalam semua state (aktif, hover, maupun non-aktif).
2. **Modern Segmented Pill Styling**:
   - Membungkus switcher tipe kamar dalam wadah terintegrasi (*segmented control container*) yang elegan:
     `bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 inline-flex flex-wrap gap-1.5`.
   - **Tab Aktif**: Background putih bersih dengan teks oranye pekat bergradasi halus atau oranye solid modern, bayangan lembut (*soft elevation shadow*), tanpa flicker border.
   - **Tab Non-Aktif**: Teks slate elegan, transisi hover lembut tanpa mengubah dimensi.
3. **Hardware-Accelerated Smooth Transition**:
   - Mengganti `transition-all` dengan `transition-colors transition-shadow duration-200 ease-out` untuk transisi super ringan (60fps).
   - Menambahkan efek *tactile feedback* instan `active:scale-[0.98]` saat ditekan.
4. **Smooth Content Fade Transition**:
   - Memberikan transisi crossfade halus pada card rincian fasilitas di bawahnya dengan `key={selectedParentTypeIdx}` dan CSS keyframe transition yang mengalir alami tanpa lag.

---

## 2. Dampak Perubahan

File yang akan disentuh:
- `functions/public/pages/KostDetail.tsx`:
  - Optimasi styling dan markup tab switcher tipe kamar pada bagian Fasilitas Kamar (baris 2033–2076).
  - Optimasi wrapper rincian fasilitas kamar (baris 2080–2086) agar transisi konten mengalir mulus (*buttery smooth*).

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Modifikasi Tab Switcher di `KostDetail.tsx`**:
   - Terapkan kontainer segmented control modern:
     ```tsx
     <div className="inline-flex flex-wrap p-1.5 bg-slate-150/70 rounded-2xl border border-slate-200/80 gap-1.5 shadow-inner">
     ```
   - Standardisasi styling tombol tab:
     - Gunakan fixed border profile (misal `border border-transparent` pada tab aktif dan `border border-transparent hover:border-slate-300/40` pada non-aktif) sehingga 0px perubahan ketebalan.
     - Hilangkan `ring-offset-1` yang merusak rendering.
     - Tambahkan `active:scale-[0.98] transition-all duration-200 ease-out`.
   - Rapikan badge ukuran dan badge ketersediaan di dalam tab dengan fixed line-height dan padding stabil.
2. **Optimasi Transisi Card Fasilitas**:
   - Tambahkan animasi fade-slide lembut berbasis key:
     ```tsx
     <div key={selectedParentTypeIdx} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm shadow-gray-100/50 space-y-6 animate-in fade-in-50 duration-200">
     ```
3. **Verifikasi Build**:
   - Uji build frontend: `cmd.exe /c "npm --prefix functions/public run build"`
   - Uji build backend: `cmd.exe /c "npm --prefix functions run build"`
4. **Dokumentasi & Git Synchronization**:
   - Catat riwayat progres **#462** di `functions/PROGRESS.md`.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kecepatan & Kehalusan Klik**:
   - Mengklik bolak-balik antara *Tipe Standard* dan *Tipe Premium* di desktop maupun mobile.
   - Memastikan tidak ada lonjakan layout (*zero layout shift*), animasi terasa ringan, instan, dan memuaskan (*delightful tactile feel*).
2. **Uji Keselarasan Data**:
   - Memastikan rincian fasilitas, ukuran kamar, dan ketersediaan tetap sinkron 100% dengan tipe kamar yang dipilih.
3. **Uji Kelulusan Build**:
   - 0 error kompilasi pada frontend Vite dan backend TypeScript.
