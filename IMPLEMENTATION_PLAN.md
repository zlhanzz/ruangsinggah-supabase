# IMPLEMENTATION PLAN: Penyederhanaan UI Mini Map Rute & Fitur Auto-Scale Viewport (`KostDetail.tsx`)

## 1. Analisis Kebutuhan & Masalah

### A. Evaluasi Pengguna
- **Permintaan Pengguna**:
  1. **Hapus Header Banner Rute**: Banner oranye di atas preview peta ("Menampilkan Rute Menuju...") dihapus agar tampilan lebih bersih (*clean UI*).
  2. **Hapus Tombol Navigasi Bawah**: Tombol *"Buka Navigasi Penuh di Google Maps"* di bawah peta dihapus agar tidak memakan tempat dan menjaga fokus pengguna tetap berada di dalam aplikasi.
  3. **Terapkan Fitur Auto-Scale / Adaptive Viewport Peta**: Skala dan tinggi tampilan mini map perlu menyesuaikan diri secara otomatis (*auto-scale*) saat rute sedang aktif, terutama untuk jarak perjalanan yang lebih jauh (2 km - 5+ km), agar seluruh jalur perjalanan dari Kost ke destinasi tidak terpotong atau terlalu sempit.

---

## 2. Arsitektur & Desain Solusi

### A. Penghapusan Elemen UI yang Tidak Diperlukan
- Menghapus komponen banner `activeRoute` di atas iframe peta.
- Menghapus tombol `<a>` navigasi eksternal di bawah iframe peta.
- Tampilan section peta menjadi **Ultra Clean & Minimalis**, hanya menyajikan layar preview peta interaktif murni.

### B. Fitur Auto-Scale / Adaptive Viewport Peta
1. **Dynamic Aspect Ratio & Adaptive Height**:
   - **Mode Pin Kost Standar (Single Location)**:
     - Tinggi proporsional compact: `h-56 sm:h-64` (skala zoom `z=16` fokus pada titik kost dan gang sekitar).
   - **Mode Rute Aktif (Directions Mode)**:
     - Tinggi otomatis membesar (*auto-scale / expand*) menjadi `h-80 sm:h-96 md:h-[420px]` dengan transisi mulus (`transition-all duration-300`).
     - Menghitung jarak dinamis untuk memastikan viewport peta Google Maps memiliki ruang vertikal dan horizontal yang lega sehingga seluruh garis rute (origin $\rightarrow$ destination) masuk sempurna di layar mobile maupun desktop tanpa terpotong header/footer peta.

2. **Floating Pill Reset Ringkas di Sudut Peta**:
   - Menambahkan tombol floating mini semi-transparan di sudut kanan atas peta bertuliskan *"✕ Titik Kost"* hanya saat rute aktif, agar pengguna tetap memiliki opsi cepat untuk mengembalikan peta ke titik kost awal tanpa memenuhi layout.
   - Mengklik kembali tombol *"Aktif ✓"* pada list juga tetap berfungsi sebagai toggle untuk kembali ke titik kost awal.

---

## 3. Dampak Perubahan File

- **`functions/public/pages/KostDetail.tsx`**:
  - Menghapus banner oranye di atas iframe dan tombol navigasi di bawah iframe.
  - Memperbarui class container iframe dengan adaptive height (`h-56 sm:h-64` saat normal, `h-80 sm:h-96 md:h-[420px]` saat rute aktif).
  - Menyematkan floating pill mini reset di sudut peta.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

### Langkah 1: Modifikasi Markup di `KostDetail.tsx`
- Hapus blok banner atas dan tombol link bawah.
- Terapkan dynamic container height dengan CSS transitions.
- Pasang floating pill reset di sudut atas peta.

### Langkah 2: Uji Kompilasi & Build
- Jalankan `cmd /c npm run build` untuk memverifikasi 0 error.
- Catat riwayat di `functions/PROGRESS.md`.
- Perbarui `WALKTHROUGH.md`.
- Git commit & push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

| Skenario Pengujian | Hasil yang Diharapkan |
|---|---|
| **Kondisi Awal (Pin Kost)** | Peta tampil bersih dengan tinggi compact (56-64), tanpa banner oranye dan tanpa tombol bawah. |
| **Klik Tombol "Rute" pada Kampus/Fasilitas** | Tinggi peta otomatis membesar (auto-scale ke 80-96) dengan transisi mulus, seluruh rute jalan muat secara leluasa di layar. |
| **Kembali ke Titik Kost** | Klik tombol floating mini atau klik kembali item aktif, peta kembali mengecil ke mode pin awal. |
| **Kompilasi TypeScript** | `npm run build` lulus 100% dengan exit code 0. |

---

> **Status:** Menunggu persetujuan (*Proceed / ACC*) dari Pengguna sebelum eksekusi kode (Fase 2).
