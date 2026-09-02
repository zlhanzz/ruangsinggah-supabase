# IMPLEMENTATION PLAN - Penghapusan Auto-Check Sub-Fasilitas Saat Memilih Fasilitas Induk

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini:
Pada formulir pendaftaran dan pengeditan kost mitra (`KostFormMitra.tsx`), terdapat beberapa fasilitas induk berjenjang (*hierarchical facilities*) yang memiliki sub-opsi kelengkapan. Ketika pengguna mencentang kotak fasilitas induk, sistem secara otomatis mencentang satu atau beberapa sub-fasilitas secara paksa (*auto-injected default*), meskipun pengguna belum memilihnya:

1. **Fasilitas Umum / Gedung (`HierarchicalPublicFacilityInput` - Langkah 4)**:
   - Baris 1307-1311: Logika `toggleItem` secara otomatis menambahkan sub-opsi indeks ke-0 (`item.subOptions[0]`) ke dalam array `facilities`:
     - Mencentang **Area Parkir** $\rightarrow$ Otomatis mencentang **Parkir Motor**.
     - Mencentang **Dapur Bersama** $\rightarrow$ Otomatis mencentang **Kompor**.
     - Mencentang **WC Umum** $\rightarrow$ Otomatis mencentang **Kloset Duduk**.
2. **Fasilitas Kamar (`HierarchicalRoomFacilityInput` - Langkah 3)**:
   - Baris 1564-1566: Saat mencentang **Kamar Mandi Dalam**, sistem secara otomatis memasukkan **Shower** ke dalam `bathroomFacilities`.
   - Baris 1586-1588: Saat mencentang **Dapur Dalam**, sistem secara otomatis memasukkan **Kompor** dan **Wastafel Cuci Piring** ke dalam `kitchenFacilities`.

### Dampak Masalah:
- Pengguna merasa bingung dan terganggu karena fasilitas yang tidak dimiliki kost (misalnya kost yang hanya menyediakan parkir mobil, atau kamar mandi dalam yang hanya memakai bak mandi/gayung tanpa shower, atau dapur dalam tanpa kompor) ikut tercentang tanpa disengaja.
- Pengguna harus mencari dan menghapus centang sub-fasilitas yang otomatis tercentang tersebut satu per satu.

### Tujuan Pengembangan:
- Memastikan bahwa saat fasilitas induk dicentang, **TIDAK ADA** sub-fasilitas yang dicentang secara otomatis.
- Sub-panel kelengkapan tetap terbuka rapi di bawah fasilitas induk dengan semua sub-opsi dalam keadaan kosong/belum tercentang, sehingga pengguna dapat dengan leluasa dan akurat memilih sub-fasilitas yang benar-benar tersedia.
- Ketika fasilitas induk dinonaktifkan (uncheck), seluruh sub-fasilitas di bawahnya dibersihkan secara rapi agar tidak ada data residu.

---

## 2. Dampak Perubahan

File yang akan disentuh:
- `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\components\KostFormMitra.tsx`:
  - Komponen `HierarchicalPublicFacilityInput` (fungsi `toggleItem`): Menghapus injeksi `item.subOptions[0]`.
  - Komponen `HierarchicalRoomFacilityInput` (fungsi `handleToggleFacility`):
    - Menghapus injeksi otomatis `Shower` saat mengaktifkan `Kamar Mandi Dalam`.
    - Menghapus injeksi otomatis `['Kompor', 'Wastafel Cuci Piring']` saat mengaktifkan `Dapur Dalam`.
    - Membersihkan sub-fasilitas terkait saat induk dinonaktifkan.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Menunggu Persetujuan/ACC)

1. **Pembersihan Logika `HierarchicalPublicFacilityInput`**:
   - Pada fungsi `toggleItem(item: PublicFacilityItemDef)`:
     ```typescript
     // Sebelum:
     const toAdd = [item.label];
     if (item.hasSub && item.subOptions && item.subOptions.length > 0) {
         if (!facilities.some(f => f.toLowerCase().trim() === item.subOptions![0].toLowerCase().trim())) {
             toAdd.push(item.subOptions[0]);
         }
     }
     onChange([...facilities, ...toAdd]);

     // Sesudah:
     const toAdd = [item.label];
     onChange([...facilities, ...toAdd]);
     ```
   - Hasil: Mencentang "Area Parkir", "Dapur Bersama", atau "WC Umum" hanya akan mengaktifkan induknya dan membuka sub-panel tanpa mencentang satu pun sub-opsi.

2. **Pembersihan Logika `HierarchicalRoomFacilityInput`**:
   - Pada `label === 'Kamar Mandi Dalam'`:
     - Hapus baris:
       ```typescript
       if (!updatedBathFacs.some(b => ['Kloset Duduk', 'Kloset Jongkok', 'Shower'].includes(b))) {
           updatedBathFacs.push('Shower');
       }
       ```
     - Saat dinonaktifkan (`isInsideBath === true`), bersihkan juga sub-fasilitas kamar mandi agar tidak meninggalkan status menggantung.
   - Pada `label === 'Dapur Dalam'`:
     - Hapus baris:
       ```typescript
       if (updatedKitchenFacs.length === 0) {
           updatedKitchenFacs = ['Kompor', 'Wastafel Cuci Piring'];
       }
       ```
     - Saat dinonaktifkan (`isInsideKitchen === true`), bersihkan `updatedKitchenFacs = []`.

3. **Pengujian & Validasi Build**:
   - Jalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 0 error kompilasi TypeScript dan bundler Vite.
4. **Pencatatan Riwayat & Git Push**:
   - Catat ke `functions/PROGRESS.md` sebagai **Fitur #266**.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Build**: Memastikan `npm run build` sukses 100% tanpa error kompilasi.
- **Verifikasi UI Skenario**:
  1. Centang **Area Parkir** $\rightarrow$ Pastikan sub-panel terbuka dan "Parkir Motor", "Parkir Mobil", "Parkir Sepeda" semuanya **tidak tercentang**.
  2. Centang **Dapur Bersama** $\rightarrow$ Pastikan sub-panel terbuka dan "Kompor", "Kulkas Bersama", dll. semuanya **tidak tercentang**.
  3. Centang **WC Umum** $\rightarrow$ Pastikan sub-panel terbuka dan "Kloset Duduk", "Shower", dll. semuanya **tidak tercentang**.
  4. Centang **Kamar Mandi Dalam** $\rightarrow$ Pastikan "Shower" **tidak ikut tercentang otomatis**.
  5. Centang **Dapur Dalam** $\rightarrow$ Pastikan "Kompor" dan "Wastafel Cuci Piring" **tidak ikut tercentang otomatis**.
  6. Uncheck fasilitas induk $\rightarrow$ Pastikan sub-panel tertutup dan data sub-fasilitas dibersihkan secara konsisten.
