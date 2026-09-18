# Rencana Implementasi: Redesain Banner Promosi KostManager Menjadi Rasio Aspek 16:9 yang Ramping (`MitraDashboard.tsx`)

Dokumen ini merinci rencana penyesuaian tampilan banner promosi KostManager di halaman ringkasan (*overview*) dashboard mitra:
1. Mengubah struktur banner menjadi rasio **16:9** yang lebih kompak dan ramping (*space-efficient*), khususnya pada tampilan mobile, sehingga tidak menenggelamkan menu dan widget di bawahnya.
2. Menata ulang tipografi, padding, dan susunan elemen (badge, judul, ringkasan fitur, dan tombol CTA) agar seimbang dan proporsional di dalam kanvas lanskap 16:9.

---

## 1. Analisis Masalah & Kebutuhan Desain

### Kondisi Saat Ini:
- Komponen banner KostManager (`renderKostManagerBanner()`, Kasus 3) saat ini berorientasi vertikal tinggi (*portrait-heavy*) pada layar ponsel karena menampung:
  1. Padding besar (`p-5 lg:p-7`)
  2. Pill badge `SOLUSI AUTO-PILOT • KOSTMANAGER RUANGSINGGAH`
  3. Headline panjang (3 baris)
  4. Deskripsi panjang (4 baris)
  5. 4 feature pills yang bertumpuk vertikal/dua kolom
  6. Tombol CTA vertikal selebar layar (`py-3.5`)
- Akibatnya, pada perangkat mobile, banner ini memakan hampir seluruh tinggi layar pengguna (*screen-hogging*).

### Solusi Desain 16:9:
- Mengadopsi rasio lanskap **16:9** di mobile (`aspect-[16/9] sm:aspect-auto` atau `w-full aspect-[16/9] md:h-auto md:min-h-[170px]`).
- Struktur tata letak `flex flex-col justify-between` dengan padding proporsional (`p-3.5 sm:p-5 lg:p-6`).
- Mengoptimalkan teks:
  - **Badge**: `text-[9px] font-black uppercase tracking-wider` bernuansa ringkas.
  - **Headline**: `text-sm sm:text-base lg:text-xl font-black text-white leading-tight line-clamp-2`.
  - **Subteks**: `text-[10px] sm:text-xs text-orange-100/90 leading-snug line-clamp-2` (padat, jelas, menarik).
  - **Highlight Fitur**: Disajikan dalam bentuk baris ringkas atau mini tags yang proporsional.
  - **Tombol CTA**: Dibuat ramping (`py-2 px-4 rounded-xl text-[11px] font-black`) dengan ikon panah halus.

---

## 2. Mockup Tata Letak 16:9

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✨ KOSTMANAGER AUTO-PILOT                                      (16:9 Canvas)│
│                                                                             │
│ Capek Kelola Kost Sendiri? Serahkan Operasional ke KostManager!             │
│ Terima beres tanpa repot! Penanganan kamar, tagihan WA, dan rekap bulanan.  │
│                                                                             │
│ [🔒 Kamar Beres]  [⚡ Tagihan WA]  [📈 Okupansi Maksimal]                   │
│                                                    [PELAJARI & AJUKAN →]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dampak File yang Akan Dimodifikasi

1. **`functions/public/pages/MitraDashboard.tsx`**:
   - Memodifikasi blok JSX di dalam `renderKostManagerBanner()` (Kasus 3) untuk menerapkan rasio aspek `aspect-[16/9]`, penyesuaian padding, dan komposisi konten yang lebih kompak.
2. **`functions/PROGRESS.md`**:
   - Mencatat progres fitur nomor #431.
3. **`WALKTHROUGH.md`**:
   - Melampirkan dokumentasi hasil perubahan visual dan hasil pengujian build.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

1. Menerapkan class `aspect-[16/9] sm:aspect-auto` dan `flex flex-col justify-between` pada kontainer banner `renderKostManagerBanner()`.
2. Menata ulang hierarki teks dan tombol CTA agar pas dan presisi dalam rasio 16:9 tanpa ada teks yang terpotong canggung.
3. Menjalankan uji kompilasi build frontend `cmd.exe /c npm run build`.
4. Mencatat histori progres di `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
5. Melakukan commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- [ ] **Kompilasi Sukses**: `npm run build` selesai dengan status 0 error.
- [ ] **Rasio 16:9 Visual**: Banner di layar mobile tampil dengan rasio lanskap 16:9 yang rapi, ramping, dan hemat ruang.
- [ ] **Keterbacaan Konten**: Teks headline, ringkasan manfaat, dan tombol CTA tetap terbaca jelas dan mudah ditekan (*touch-friendly*).
