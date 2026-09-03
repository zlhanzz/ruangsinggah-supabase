# IMPLEMENTATION PLAN: Perbaikan Dinamis UI/UX Kartu Fasilitas Umum di KostDetail.tsx

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Pada bagian **FASILITAS UMUM**, kartu fasilitas utama (misal `Area Parkir` dan `Dapur Bersama`) menggunakan layout `flex flex-col justify-between`.
  - Ketika sebuah kartu memiliki banyak sub-item (misal `Dapur Bersama` dengan 5 kelengkapan), tinggi kartunya memanjang. Grid memaksa kartu di sebelahnya (`Area Parkir`) ikut memanjang.
  - Akibat `justify-between`, chip sub-item pada kartu dengan sedikit kelengkapan (misal hanya `Parkir Motor`) terdorong jauh ke dasar kartu, menciptakan ruang kosong putih (gap) yang canggung di tengah-tengah kartu.
- **Tujuan**:
  - Mengubah alignment kartu menjadi `flex flex-col justify-start gap-3` sehingga chip kelengkapan selalu tersusun proporsional tepat di bawah header kartu.
  - Memastikan tampilan kartu tetap dinamis, padat, dan elegan terlepas dari apakah sub-item kelengkapan berjumlah 1, banyak, ataupun tidak memiliki sub-kelengkapan.
  - Menambahkan fallback state yang rapi jika sebuah fasilitas umum dicentang tanpa sub-item spesifik (misal menampilkan keterangan *"Tersedia untuk seluruh penghuni kost"*).

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx` (Layout kartu grup fasilitas umum di dalam `structuredPublicFacilities.groups`)

---

## 3. Langkah-Langkah Eksekusi
1. **Perbaikan Layout & Alignment Kartu Fasilitas Utama**:
   - Menghapus class `justify-between` dan menggantinya dengan `justify-start gap-3` pada container kartu `structuredPublicFacilities.groups`.
   - Menata ulang container chips sub-kelengkapan (`flex flex-wrap gap-1.5 pt-2.5 border-t border-gray-100/80`) agar memiliki jarak yang harmonis dengan header fasilitas.
2. **Penanganan Fallback Dinamis**:
   - Jika `group.subItems.length === 0`, menampilkan pesan deskriptif mini yang halus agar kartu tidak terlihat kosong atau rusak.
3. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
4. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 302 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman detail kost (`/kost/:id`) di browser.
- Memeriksa seksian **FASILITAS UMUM**:
  - Memverifikasi kartu `Area Parkir` yang hanya memiliki 1 kelengkapan (`Parkir Motor`) tampil rapat, proporsional, dan menyatu secara visual tanpa gap kosong canggung di tengah.
  - Memverifikasi kartu `Dapur Bersama` tetap tampil rapi dengan seluruh chips kelengkapannya.
