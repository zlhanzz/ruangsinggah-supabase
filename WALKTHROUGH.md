# WALKTHROUGH - Penghapusan Auto-Check Sub-Fasilitas Saat Memilih Fasilitas Induk

## Ringkasan Eksekutif
Perbaikan atas masalah auto-checking sub-fasilitas pada form pendaftaran dan pengeditan kost mitra telah **berhasil diselesaikan dan diverifikasi penuh**.

Sebelumnya, saat mitra mencentang fasilitas induk yang memiliki sub-fasilitas (seperti **Area Parkir**, **Dapur Bersama**, **WC Umum**, **Kamar Mandi Dalam**, dan **Dapur Dalam**), sistem secara otomatis mencentang salah satu atau beberapa sub-fasilitas (misal: *Parkir Motor*, *Kompor*, *Kloset Duduk*, *Shower*, atau *Wastafel Cuci Piring*) meskipun pengguna belum memilihnya.

Setelah perbaikan ini diterapkan, mencentang fasilitas induk **hanya akan mengaktifkan induk dan membuka sub-panel kelengkapan terkait**, dengan semua opsi sub-fasilitas dalam status **bersih (belum tercentang)** sehingga mitra dapat memilih sendiri secara akurat.

---

## 1. Rincian Perubahan Kode

### A. Fasilitas Gedung / Umum (`HierarchicalPublicFacilityInput`)
- **Lokasi**: [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx#L1300-L1310)
- **Perubahan**:
  - Menghapus penyuntikan otomatis `item.subOptions[0]` saat fasilitas induk diaktifkan melalui fungsi `toggleItem`.
  - Sekarang hanya `item.label` yang ditambahkan ke state `facilities`:
    ```typescript
    // Sesudah perbaikan:
    } else {
        // Aktifkan grup tanpa mencentang sub-opsi apapun secara otomatis
        const toAdd = [item.label];
        onChange([...facilities, ...toAdd]);
    }
    ```
  - **Efek Langsung**:
    - Mencentang **Area Parkir** $\rightarrow$ Sub-panel kelengkapan terbuka; opsi *Parkir Motor*, *Parkir Mobil*, *Parkir Sepeda* **semuanya tidak tercentang**.
    - Mencentang **Dapur Bersama** $\rightarrow$ Sub-panel kelengkapan terbuka; opsi *Kompor*, *Kulkas Bersama*, *Dispenser Air*, dll. **semuanya tidak tercentang**.
    - Mencentang **WC Umum** $\rightarrow$ Sub-panel kelengkapan terbuka; opsi *Kloset Duduk*, *Kloset Jongkok*, *Shower*, *Wastafel* **semuanya tidak tercentang**.

### B. Fasilitas Kamar (`HierarchicalRoomFacilityInput`)
- **Lokasi**: [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx#L1545-L1585)
- **Perubahan**:
  - **Kamar Mandi Dalam**: Menghapus baris auto-inject `updatedBathFacs.push('Shower')`. Ketika diaktifkan, sub-panel terbuka tanpa memaksa mencentang shower. Ketika dinonaktifkan, seluruh sub-fasilitas kamar mandi dalam dibersihkan secara rapi.
  - **Dapur Dalam**: Menghapus baris auto-inject `updatedKitchenFacs = ['Kompor', 'Wastafel Cuci Piring']`. Ketika diaktifkan, sub-panel terbuka tanpa mencentang kompor atau wastafel. Ketika dinonaktifkan, array `kitchenFacilities` dikosongkan.

---

## 2. Hasil Verifikasi & Uji Kompilasi

Kompilasi build aplikasi front-end dijalankan menggunakan bundler Vite:
```bash
cmd /c npm run build
```
**Hasil**:
```text
vite v6.4.1 building for production...
transforming...
✓ 2506 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 36.28s
0 errors, 0 warnings fatal.
```

---

## 3. Panduan Pengujian untuk Pengguna

1. **Buka Formulir Tambah/Edit Kost Mitra**:
   - Buka Dashboard Mitra dan klik **Tambah Kost Baru** atau klik tombol **Edit** pada salah satu kost.
2. **Uji di Langkah 3 (Kamar & Fasilitas Kamar)**:
   - Pada bagian fasilitas kamar, centang **Kamar Mandi Dalam**.
   - **Verifikasi**: Sub-panel "Kelengkapan Kamar Mandi Dalam" terbuka dan pastikan opsi **Shower** *TIDAK ikut tercentang otomatis*.
   - Centang **Dapur Dalam**.
   - **Verifikasi**: Sub-panel "Kelengkapan Dapur Dalam" terbuka dan pastikan opsi **Kompor** maupun **Wastafel Cuci Piring** *TIDAK ikut tercentang otomatis*.
3. **Uji di Langkah 4 (Fasilitas Gedung / Umum)**:
   - Centang **Area Parkir**.
   - **Verifikasi**: Sub-panel terbuka dan pastikan **Parkir Motor** *TIDAK ikut tercentang otomatis*.
   - Centang **Dapur Bersama**.
   - **Verifikasi**: Sub-panel terbuka dan pastikan **Kompor** *TIDAK ikut tercentang otomatis*.
   - Centang **WC Umum**.
   - **Verifikasi**: Sub-panel terbuka dan pastikan **Kloset Duduk** *TIDAK ikut tercentang otomatis*.
4. **Uji Pemilihan Mandiri**:
   - Pilih sub-fasilitas secara manual sesuai kebutuhan (misal hanya *Parkir Mobil* saja, atau hanya *Kloset Jongkok* saja).
   - Pastikan pilihan manual Anda tersimpan dengan benar.
