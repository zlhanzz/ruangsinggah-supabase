# Rencana Implementasi: Eliminasi Duplikasi Landmark & Perampingan Total Menjadi 1 Baris Murni (Single-Line Row)

## 1. Analisis Masalah & Kebutuhan

Berdasarkan tinjauan dan evaluasi visual dari pengguna:
1. **Duplikasi Data (Double & Berulang)**:
   - Di daftar **"Kampus Terdekat"**, data memuat 10 lokasi yang mencakup kampus sejati (Unhas, UIM, PNUP) sekaligus fasilitas umum (Makassar Town Square, RSUP Wahidin, KIMA, Terminal Daya, Zap Laundry, Masjid, Gereja).
   - Di daftar **"Fasilitas Publik"**, 7 lokasi yang sama diulang kembali.
   - *Penyebab*: Pada saat pemindaian/pengisian form di `KostFormMitra.tsx`, `campuses` diisi dengan array gabungan `[...finalCampuses, ...cleanFinalFacilities]`. Akibatnya, listing kost yang tersimpan di database memiliki fasilitas publik di dalam array `campuses` sekaligus array `public_facilities`.
2. **Layout Masih Tebal (Belum 1 Baris Murni)**:
   - Setiap kartu saat ini memiliki **2 baris bertingkat** (baris 1: Nama + Jarak + Rute; baris 2: Moda jalan kaki, motor, mobil).
   - Hal ini membuat kartu tetap memakan tinggi vertikal yang signifikan dan terasa tidak efisien.
   - *Keinginan Pengguna*: **"cukup satu baris aja cukup"** — Semua elemen (Icon, Nama Tempat, Estimasi Waktu/Jarak, dan Tombol Rute) berada dalam **1 baris lurus murni** tanpa ada baris kedua di bawahnya.

---

## 2. Dampak Perubahan (File yang Terpengaruh)

1. `functions/public/pages/KostDetail.tsx`:
   - Menambahkan filter pemisah pintar (`campusList` vs `publicFacilitiesList`) untuk membersihkan duplikasi data warisan di database.
   - Merombak total rendering kartu landmark menjadi **1 baris horizontal murni (Single Line Row)** setinggi ~36px:
     - `[Icon] [Nama Tempat]` di sisi kiri (`truncate`).
     - `[🚶 22m · 🏍️ 5m]` dan/atau badge jarak `[1.5 km]` di tengah/kanan dalam 1 garis lurus.
     - `[Rute ↗]` tombol navigasi kompak di ujung kanan.
2. `functions/public/components/KostFormMitra.tsx`:
   - Memperbaiki pengisian state saat auto-scan: `campuses` hanya diisi murni kampus/universitas (`finalCampuses`), sedangkan `publicFacilities` diisi fasilitas publik (`cleanFinalFacilities`).
3. `functions/PROGRESS.md` & `WALKTHROUGH.md`:
   - Pencatatan dokumentasi dan riwayat pengerjaan fitur #275.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

### Langkah 1: Deduplikasi & Pemisahan Kategori di `KostDetail.tsx`
- Membuat computed list dengan `useMemo`:
  ```typescript
  // 1. Fasilitas Publik murni
  const publicFacilitiesList = useMemo(() => {
    return kost.publicFacilities || [];
  }, [kost.publicFacilities]);

  // 2. Kampus terdekat murni (filter item yang sudah ada di fasilitas publik atau non-kampus)
  const campusList = useMemo(() => {
    const raw = kost.campuses || [];
    if (publicFacilitiesList.length === 0) return raw;
    const publicNames = new Set(publicFacilitiesList.map(p => p.name.toLowerCase().trim()));
    return raw.filter(c => !publicNames.has(c.name.toLowerCase().trim()));
  }, [kost.campuses, publicFacilitiesList]);
  ```

### Langkah 2: Redesain UI Menjadi 1 Baris Horizontal Murni (Single Line Row)
- Mengubah struktur layout item:
  - Container: `flex items-center justify-between py-2 px-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors gap-2 text-xs`
  - Kiri: Icon vector murni (14px) + Nama tempat tebal (`truncate max-w-[130px] sm:max-w-[180px]`)
  - Tengah/Kanan (tetap 1 baris sejajar):
    - Chips waktu tempuh motor/jalan kaki ringkas: `<span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">🏍️ 5m</span>`
    - Badge jarak: `<span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">1.5 km</span>`
    - Tombol Rute: Link minimalis Google Maps berikon `Navigation`
  - **Hasil**: 1 item = Tepat 1 baris ramping dan bersih!

### Langkah 3: Perbaikan Sumber Data di `KostFormMitra.tsx`
- Memastikan `setForm` saat scan dan submit form hanya memasukkan kampus ke `campuses` dan non-kampus ke `publicFacilities`.

### Langkah 4: Verifikasi & Kompilasi
- Menjalankan `cmd /c "npm run build"` di direktori `functions` untuk memastikan kelulusan build TypeScript (0 error).

### Langkah 5: Git Commit & Push ke `bukan-productions`
- Commit perubahan dan push langsung ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Verifikasi Visual**:
   - Memastikan tidak ada lagi nama tempat fasilitas publik yang muncul ganda di bawah "Kampus Terdekat".
   - Memastikan setiap item landmark tampil presisi dalam 1 baris lurus tanpa ada baris kedua yang memicu pemborosan ruang.
2. **Verifikasi Fungsional**:
   - Tombol "Rute" tetap membuka rute navigasi Google Maps secara akurat.
3. **Verifikasi Build**:
   - `npm run build` sukses tanpa error TypeScript.
