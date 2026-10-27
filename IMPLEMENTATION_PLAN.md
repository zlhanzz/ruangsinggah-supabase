# IMPLEMENTATION PLAN: Pembersihan Label Teknis Algoritma ("Cover Utama - Kamar Termahal") dari Antarmuka Mitra

## 1. Analisis Masalah & Kebutuhan

### A. Konteks Masalah
Pada formulir pengelolaan foto properti & kamar mitra (`KostFormMitra.tsx`), saat ini terdapat badge oranye yang bertuliskan:
`⭐ COVER UTAMA (KAMAR TERMAHAL)`
pada header kategori tipe kamar yang memiliki tarif tertinggi, disertai beberapa teks instruksi yang menyebutkan *"tipe kamar berharga termahal"* dan *"terutama tipe kamar termahal"*.

### B. Masukan Pengguna
Pengguna menegaskan:
> *"kenapa ada keterangan ginian. ini seharusnya kinerja latar belakang, bukan untuk ditampilkan ke user atau mitra"*

Pernyataan ini 100% tepat. Logika penentuan foto cover katalog dari kamar dengan tarif tertinggi merupakan **aturan bisnis/algoritma internal sistem di latar belakang (*background ranking logic*)**. 
Mitra atau pengguna tidak perlu dan tidak semestinya melihat label teknis seperti `(KAMAR TERMAHAL)` di layar mereka. Mitra hanya perlu mengunggah foto-foto kamar dan fasilitas mereka secara wajar tanpa dibebani istilah algoritma internal.

### C. Solusi yang Diterapkan
1. **Menghapus Badge Kategori**: Menghapus badge `⭐ Cover Utama (Kamar Termahal)` dari header kartu kategori kamar tidur.
2. **Menyeragamkan Tampilan Kartu Kategori**: Menghilangkan efek visual pembeda (seperti border oranye tebal dan latar belakang gradien khusus) pada kamar termahal, sehingga semua kartu kategori kamar tampil bersih, rapi, dan setara.
3. **Membersihkan Teks Panduan (Sanitasi)**:
   - Baris ~5845: Mengubah *"Foto kamar dari tipe kamar berharga termahal akan otomatis dijadikan Foto Cover Utama..."* menjadi teks yang lebih natural: *"Foto kamar tidur utama akan otomatis dijadikan <strong>Foto Cover Utama</strong> pada preview pencarian. Anda juga dapat memberi keterangan (caption) pada masing-masing foto."*
   - Baris ~5859: Mengubah *"Mohon unggah minimal 1 foto pada kategori Kamar Tidur (terutama tipe kamar termahal)..."* menjadi: *"Mohon unggah minimal 1 foto pada kategori <strong>Kamar Tidur</strong> untuk dijadikan Cover Utama preview kost Anda."*
4. **Menjaga Logika Latar Belakang Tetap Utuh**:
   - Fungsi pengurutan otomatis di latar belakang saat simpan data (`getPhotoScore` pada baris 4182-4232) tetap mempertahankan kinerja aslinya di background (memilih foto interior kamar tidur berharga tertinggi ke posisi index 0 untuk cover katalog di Supabase/cloud).

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
1. **`functions/public/components/KostFormMitra.tsx`**:
   - Menghapus badge `⭐ Cover Utama (Kamar Termahal)` pada header kategori kamar.
   - Menyeragamkan styling container dan ikon kategori kamar.
   - Menyesuaikan redaksi instruksi header dan alert menjadi bersih dan netral tanpa embel-embel "kamar termahal".
2. **`functions/PROGRESS.md`**:
   - Mencatat penyelesaian tugas pada Entri #450.
3. **`WALKTHROUGH.md`**:
   - Menyajikan dokumentasi detail perubahan dan panduan verifikasi UI.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 setelah ACC)

1. **Langkah 1: Hapus Badge Teknis di Header Kategori Kamar**
   - Pada `KostFormMitra.tsx` baris ~6142:
     Hapus blok render badge:
     ```tsx
     {isPrimaryCoverTarget && (
         <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-md tracking-wider shadow-xs">
             ⭐ Cover Utama (Kamar Termahal)
         </span>
     )}
     ```
     Menjadi tidak dirender sama sekali sehingga header kategori kamar bersih dari teks teknis.

2. **Langkah 2: Seragamkan Desain Kartu Kategori Kamar**
   - Menetralkan styling pembungkus kartu kategori (baris ~6122-6134) agar tidak menonjolkan satu kamar tertentu dengan warna berbeda, melainkan seragam dengan kategori kamar lainnya.

3. **Langkah 3: Bersihkan Redaksi Teks Panduan & Peringatan**
   - Baris ~5845: Hapus frasa *"dari tipe kamar berharga termahal"*.
   - Baris ~5859: Hapus frasa *"(terutama tipe kamar termahal)"*.

4. **Langkah 4: Kompilasi & Uji Build**
   - Menjalankan `npm --prefix functions/public run build` untuk memverifikasi 0 TypeScript error dan 0 syntax error.

5. **Langkah 5: Dokumentasi & Git Push**
   - Mencatat ke `functions/PROGRESS.md` (Entri #450).
   - Membuat `WALKTHROUGH.md`.
   - Melakukan git commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Build**: Memastikan `npm --prefix functions/public run build` selesai dengan status sukses (*exit code 0*).
- **Verifikasi UI**: Memastikan antarmuka galeri foto di formulir kost mitra tidak lagi menampilkan badge `⭐ COVER UTAMA (KAMAR TERMAHAL)` maupun teks "kamar termahal", sehingga tampilan terlihat bersih dan elegan.
- **Verifikasi Fungsionalitas**: Memastikan fitur unggah foto, penyamaran sensor spanduk kontak, modal penjelasan privasi, serta penyimpanan urutan foto cover tetap berjalan normal di background tanpa kendala.
