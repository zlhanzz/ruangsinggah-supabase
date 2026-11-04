# WALKTHROUGH: Perbaikan Sistem Kuota Inventori Kamar Kost Biasa vs Kost Kelolaan (Milestone #494)

Dokumen ini merangkum penyelesaian investigasi, sanitasi database, dan penyempurnaan logika ketersediaan kamar pada halaman detail kost (`functions/public/pages/KostDetail.tsx`), sanitasi data `properties.room_types` Kost Ryuta, serta kompilasi ulang backend Cloud Functions (`functions/src/index.ts` -> `functions/lib/index.js`).

---

## 1. Ringkasan Perubahan & Temuan

### A. Jawaban atas Pertanyaan Pengguna
Mengapa penyewaan 1 kali membuat tipe kamar yang sebelumnya memiliki 3 kamar kosong langsung berstatus "Penuh"?
1. **Perbedaan Model Data**:
   - KostManager mencatat kamar fisik per unit (Kamar 101, Kamar 102). 1 penyewa = 1 unit kamar ditandai `isAvailable: false`.
   - Kost Biasa (Reguler) mencatat tipe kamar berbasis inventori kuota (`availableRoomCount: 3`). 1 penyewa seharusnya hanya mengurangi kuota menjadi `availableRoomCount: 2`.
2. **Residu Sinkronisasi Lama**:
   - Transaksi sewa Kost Ryuta dibuat saat sistem masih menjalankan kode lama yang menimpa seluruh tipe kamar "Standard" dengan `isAvailable: false` dan `status: "Terisi"`, tanpa memotong kuota `availableRoomCount`.
3. **Poisoned Flag pada Frontend**:
   - Frontend `KostDetail.tsx` sebelumnya memiliki kondisi `(rt.isAvailable !== false && countVal > 0)`. Karena `isAvailable === false` tertinggal di database, halaman detail langsung mematikan ketersediaan kamar dan merender badge merah: **`● Penuh`** meskipun kuota masih tersisa.

---

### B. Solusi Kelas Industri yang Telah Diterapkan

1. **Resilient Inventory-Pool Availability Engine (`KostDetail.tsx`)**:
   - Pada baris 618–620 dan 759–761, ketersediaan tipe kamar untuk Kost Biasa kini murni dievaluasi berdasarkan sisa kuota numerik (`countVal > 0`).
   - Kebal dari residu flag boolean lama, sehingga jika kuota masih ada (misal tersisa 2 kamar), sistem secara presisi menampilkan:
     **`● 2 Kamar Tersedia`** (badge hijau) dan tombol pemesanan tetap aktif untuk calon penyewa lain.
2. **Sanitasi Data Database Supabase (`properties.room_types`)**:
   - Data tipe "Standard" pada Kost Ryuta (`f0347475-4e49-4af2-978a-5eb5fabd7f16`) telah diselaraskan:
     - `availableRoomCount`: **`2`** (dari total 3 awal - 1 sewa aktif).
     - `isAvailable`: **`true`**.
     - `status`: **`"Kosong"`**.
     - Residu nama penyewa dibersihkan dari katalog properti (SSOT kontrak penyewa tetap tersimpan rapi pada tabel relasional `resident_status`).
3. **Sinkronisasi Build Backend Functions (`functions/lib/index.js`)**:
   - Memperbaiki deklarasi variabel `isExtension` di `functions/src/index.ts`.
   - Menjalankan kompilasi TypeScript (`tsc`) sehingga backend Cloud Functions di `functions/lib/index.js` sinkron dengan logika pengurangan kuota `newAvail = Math.max(0, currentAvail - 1)`.

---

## 2. File yang Dimodifikasi

| File / Tabel | Komponen / Bagian | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `functions/public/pages/KostDetail.tsx` | Baris 615–620, 756–768 | Evaluasi ketersediaan kamar Kost Biasa murni berbasis kuota numerik `countVal > 0` |
| `functions/src/index.ts` | Baris 2123 | Memperbaiki deklarasi variabel `isExtension` sebelum penggunaan |
| `functions/lib/index.js` | Hasil kompilasi `tsc` | Sinkronisasi logika pengurangan kuota bertahap di backend |
| Supabase `properties` | Kost Ryuta (`room_types`) | Menyelaraskan kuota Tipe Standard menjadi 2 kamar kosong |
| `functions/PROGRESS.md` | Milestone #494 | Pencatatan riwayat perkembangan fitur anti-amnesia |

---

## 3. Hasil Pengujian & Verifikasi

### A. Kompilasi TypeScript Backend Functions
Perintah:
```powershell
npm.cmd --prefix functions run build
```
Hasil:
- ✓ **Kompilasi `tsc` berhasil 100% tanpa error (Exit code: 0)**.
- File `functions/lib/index.js` berhasil ter-generate dengan logika pemotongan kuota kamar Kost Biasa.

### B. Kompilasi Front-End Vite
Perintah:
```powershell
npm.cmd --prefix functions/public run build
```
Hasil:
- ✓ **2512 modul ter-compile sempurna tanpa error (0 error)** dalam 58.88 detik.

### C. Verifikasi Data Database Supabase (Kost Ryuta)
```json
[
  {
    "name": "Standard",
    "status": "Kosong",
    "isAvailable": true,
    "availableRoomCount": 2,
    "price": 1
  },
  {
    "name": "Premium",
    "status": "Kosong",
    "isAvailable": true,
    "availableRoomCount": 3,
    "price": 1500000
  }
]
```

---

## 4. Panduan Pengujian bagi Pengguna

1. Buka halaman detail **Kost Ryuta** (`/detail?kostId=f0347475-4e49-4af2-978a-5eb5fabd7f16`).
2. Perhatikan bagian **PILIH TIPE KAMAR**:
   - **Tipe STANDARD**: Sekarang menampilkan badge hijau **`● 2 Kamar Tersedia`** (bukan lagi *Penuh*).
   - **Tipe PREMIUM**: Tetap menampilkan badge hijau **`● 3 Kamar Tersedia`**.
3. Klik tipe kamar **STANDARD**:
   - Tombol **"Ajukan Sewa"** di bawah sekarang aktif dan siap menerima booking dari penyewa lain.
4. Ketika penyewa kedua menyewa kamar Standard:
   - Kuota akan berkurang dari 2 menjadi 1 kamar tersedia.
   - Status baru akan berubah menjadi *Penuh* hanya jika kuota telah benar-benar mencapai 0.
