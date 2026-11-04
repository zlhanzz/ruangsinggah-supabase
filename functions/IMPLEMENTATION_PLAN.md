# IMPLEMENTATION PLAN: Perbaikan Sistem Kuota Inventori Kamar Kost Biasa (Reguler) vs Kost Kelolaan (`KostDetail.tsx`, `properties.room_types`, & Backend Sync)

Dokumen ini disusun sebagai **Fase 1: Perencanaan & Pengajuan** sesuai dengan Protokol Kerja Workspace RuangSinggah.

---

## 1. Analisis Masalah & Investigasi Akar Masalah

### A. Pertanyaan Pengguna
> *"Apa yang menyebabkan penyewaan yang dilakukan satu kali dengan satu akun ini langsung membuat listing yang sebelumnya tersedia 3 kamar kosong langsung berstatus penuh. Saya rasa ada masalah di sini."*

### B. Hasil Investigasi Database & Alur Kode
Setelah dilakukan inspeksi mendalam langsung pada database Supabase (`properties`, `resident_status`, dan `transactions`) serta source code terkait, ditemukan **3 akar penyebab utama**:

#### 1. Perbedaan Arsitektur KostManager vs Kost Biasa (Reguler)
- **KostManager (Kelolaan)**: Setiap entri pada array `room_types` merepresentasikan **1 unit kamar fisik spesifik** (contoh: "Kamar 101", "Kamar 102"). Ketika 1 penyewa masuk, kamar tersebut memang harus menjadi `status: "Terisi"` dan `isAvailable: false`.
- **Kost Biasa (Reguler / Non-Managed)**: Setiap entri pada `room_types` merepresentasikan **kategori / tipe kamar** (contoh: Tipe "Standard" yang memiliki total kuota `availableRoomCount: 3`). Dalam 1 tipe kamar terdapat beberapa stok kamar.

#### 2. Jejak Residu Logika Sinkronisasi Lama (Sebelum Milestone #488)
- Transaksi booking Kost Ryuta (`f0347475-4e49-4af2-978a-5eb5fabd7f16`) disetujui saat sistem masih menjalankan logika lama di mana sinkronisasi kamar memperlakukan Kost Biasa sama persis seperti KostManager.
- Akibatnya, alih-alih mengurangi kuota stok (`availableRoomCount: 3 - 1 = 2`), logika lama tersebut langsung menimpa seluruh objek tipe kamar "Standard" dengan:
  ```json
  {
    "name": "Standard",
    "status": "Terisi",
    "isAvailable": false,
    "residentName": "userbiasa1",
    "availableRoomCount": 3
  }
  ```
  Stok `availableRoomCount` masih tercatat 3, namun properti `isAvailable` sudah di-set ke `false` dan `status` di-set ke `"Terisi"`.

#### 3. Logika Evaluasi di Front-End (`KostDetail.tsx`) Teracuni (*Poisoned Flag*)
Pada `KostDetail.tsx` (baris 618–620 dan baris 759–761):
```typescript
const countVal = (rt.availableRoomCount !== undefined && rt.availableRoomCount !== null) 
  ? Number(rt.availableRoomCount) 
  : null;
const isAvail = countVal !== null 
  ? (rt.isAvailable !== false && countVal > 0)
  : (rt.isAvailable !== false && rt.status?.toLowerCase() !== 'terisi' && rt.status?.toLowerCase() !== 'penuh');
```
- Perhatikan bagian: `(rt.isAvailable !== false && countVal > 0)`.
- Karena objek database menyimpan `isAvailable: false`, maka `false !== false` bernilai `false`.
- Meskipun `countVal` bernilai 3 (atau > 0), `isAvail` dipaksa bernilai **`false`**.
- Akibatnya, `finalAvailCount` dipaksa menjadi **0** dan halaman detail merender badge merah: **`● Penuh`**.

---

## 2. Komparasi & Evaluasi Standar Industri Objektif (Anti-Bias Konfirmasi)

Mengacu pada **Pasal 8 Protokol Kerja Workspace**, berikut analisis evaluasi objektif:

| Dimensi Evaluasi | Kondisi Lama (Legacy) | Solusi yang Direncanakan (Proposed) | Klasifikasi Standar Industri | Alasan Teknis & Rekomendasi |
| :--- | :--- | :--- | :--- | :--- |
| **Model Inventori Multi-Unit** | Status ketersediaan tipe kamar mengandalkan boolean tunggal (`isAvailable: false`). 1 booking mematikan seluruh tipe kamar. | Model kuota bertingkat (*Inventory Pool*): Ketersediaan Kost Biasa ditentukan secara murni oleh sisa kuota numerik (`availableRoomCount > 0`). Status `Penuh` hanya tercapai saat kuota menyentuh angka 0. | 🌟 **Setara Standar Industri (*Industry Standard*)** | Sesuai pola industri perhotelan & proptech global (Airbnb, Traveloka, Booking.com room-tier inventory). |
| **Pemisahan SSOT Data Penghuni** | Nama penyewa ditempelkan langsung ke tipe kamar Kost Biasa (`residentName: "userbiasa1"` pada tipe "Standard"), padahal ada 3 kamar di tipe tersebut. | Data penyewa hanya disimpan di tabel relasional `resident_status`. Tipe kamar pada properti murni sebagai katalog kuota & spesifikasi kamar. | 🚀 **Lebih Maju dari Standar Industri (*Ahead of Industry Standard*)** | Mencegah kebocoran data (*data leakage*) dan mencegah konflik data ketika ada 2 atau 3 penyewa berbeda di tipe kamar yang sama. |
| **Resilience & Anti-Poisoning Frontend** | Frontend `KostDetail.tsx` langsung menyerah jika `rt.isAvailable === false` meski `availableRoomCount` masih ada stok. | Logika `KostDetail.tsx` dibuat resilien: Untuk Kost Biasa, jika `availableRoomCount` tersedia dan bernilai > 0, sistem memprioritaskan kuota riil dan mengabaikan residu flag boolean lama. | 🚀 **Lebih Maju dari Standar Industri (*Ahead of Industry Standard*)** | Sistem tetap menampilkan ketersediaan yang benar meskipun terdapat anomali data historis di database. |

---

## 3. Dampak Perubahan (Affected Files & Database)

1. **Database Supabase (`properties`)**:
   - Memperbaiki data residu pada properti Kost Ryuta (`f0347475-4e49-4af2-978a-5eb5fabd7f16`):
     - Tipe Standard: `availableRoomCount: 2`, `isAvailable: true`, `status: "Kosong"`, menghapus `residentName`.
     - Tipe Premium: Tetap `availableRoomCount: 3`, `isAvailable: true`, `status: "Kosong"`.
2. **`functions/public/pages/KostDetail.tsx`**:
   - Memperbaiki logika evaluasi ketersediaan kamar Kost Biasa agar murni berbasis kuota numerik `availableRoomCount > 0`, kebal dari flag residu `isAvailable: false`.
3. **`functions/src/index.ts` & `functions/lib/index.js`**:
   - Melakukan kompilasi ulang build Cloud Function (`tsc`) agar perubahan pengurangan kuota bertahap di backend sinkron 100%.
4. **`functions/PROGRESS.md`**: Pencatatan riwayat Milestone #494.
5. **`WALKTHROUGH.md`**: Bukti hasil pengujian dan panduan verifikasi.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

Setelah rencana ini disetujui (*ACC*) oleh pengguna:

1. **Sanitasi Data Kost Ryuta pada Database Supabase**:
   - Memperbarui array `room_types` Kost Ryuta di tabel `properties`:
     - Tipe Standard diset: `availableRoomCount: 2`, `isAvailable: true`, `status: 'Kosong'`, `residentName: ''`, `residentPhone: ''`.
2. **Refactoring Logika Resilien di `KostDetail.tsx`**:
   - Pada baris 618–620 dan baris 759–761, menyempurnakan kondisi ketersediaan untuk Kost Biasa:
     ```typescript
     // Untuk Kost Biasa, jika ada kuota numerik, ketersediaan murni ditentukan oleh countVal > 0
     const isAvail = countVal !== null 
       ? countVal > 0 
       : (rt.isAvailable !== false && rt.status?.toLowerCase() !== 'terisi' && rt.status?.toLowerCase() !== 'penuh');
     ```
3. **Kompilasi Backend Cloud Functions (`functions/src/index.ts` -> `functions/lib/index.js`)**:
   - Menjalankan `npm run build` di folder `functions/` untuk memastikan `functions/lib/index.js` sinkron dengan logika pengurangan kuota.
4. **Uji Kompilasi Front-End**:
   - Menjalankan `npm.cmd --prefix functions/public run build` (harus 0 error).
5. **Pencatatan Riwayat & Walkthrough**:
   - Memperbarui `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
6. **Git Commit & Push**:
   - Push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Verifikasi Halaman Detail Kost Ryuta**:
   - Buka halaman detail Kost Ryuta (`/detail?kostId=f0347475-4e49-4af2-978a-5eb5fabd7f16`).
   - Tipe **Standard**: Harus menampilkan badge hijau **`● 2 Kamar Tersedia`** (dari semula 3 kamar, berkurang 1 karena sedang disewa oleh userbiasa1).
   - Tipe **Premium**: Tetap menampilkan badge hijau **`● 3 Kamar Tersedia`**.
   - Tombol "Ajukan Sewa" pada tipe Standard harus aktif dan dapat dipilih kembali oleh penyewa lain selama kuota masih ada.
