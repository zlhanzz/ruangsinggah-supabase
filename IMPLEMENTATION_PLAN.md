# IMPLEMENTATION PLAN: Pembersihan Teks & Alert "Cover Utama" dari Kartu Header Dokumentasi Foto

## 1. Analisis Masalah & Kebutuhan

### A. Konteks Masalah
Pada kartu header **Dokumentasi Foto Properti & Kamar** di formulir kost mitra (`KostFormMitra.tsx`), masih tercantum:
1. **Teks Deskripsi**:
   > *"Foto kamar tidur utama akan otomatis dijadikan <strong>Foto Cover Utama</strong> pada preview pencarian. Anda juga dapat memberi keterangan (caption) pada masing-masing foto."*
2. **Alert Box Kuning (Perhatian)**:
   > *"Perhatian: Mohon unggah minimal 1 foto pada kategori Kamar Tidur untuk dijadikan Cover Utama preview kost Anda."*

### B. Masukan Pengguna
Pengguna menegaskan:
> *"menurut saya bagian ini juga termasuk kedalam background logic atau background prosess yang tidak perlu ada untuk dicantumkan pada tampilan"*

Masukan ini sangat tepat. Seluruh mekanisme bagaimana sistem memilih foto kamar tidur menjadi "Cover Utama" adalah **background logic (proses latar belakang)** murni. 
Mitra atau pengguna tidak perlu dijelaskan atau diperingatkan mengenai "Cover Utama", melainkan cukup diarahkan untuk mengunggah dokumentasi foto properti dan kamar mereka secara wajar.

### C. Solusi yang Diterapkan
1. **Menghapus Kotak Alert Kuning / Amber Sepenuhnya**:
   - Menghapus blok komponen alert `{!hasRoomCover && (...)}` yang memperingatkan unggah foto untuk "Cover Utama".
   - Menghapus variabel `hasRoomCover` yang tidak lagi diperlukan.
2. **Menyederhanakan Teks Deskripsi Header**:
   - Mengubah teks deskripsi menjadi instruksi yang ramah dan murni fokus pada pengunggahan foto:
     > *"Unggah foto properti dan kamar kost Anda. Anda juga dapat memberi keterangan (caption) pada masing-masing foto."*
3. **Mempertahankan Badge Counter Foto**:
   - Mempertahankan badge `📸 {totalAllPhotos} Foto Terpilih` di kanan atas kartu sebagai indikator jumlah foto yang telah dipilih mitra.
4. **Logika Latar Belakang Tetap Bekerja Normal**:
   - Algoritma penyusunan foto saat simpan (`getPhotoScore`) tetap otomatis menata foto kamar terbaik sebagai cover katalog di Supabase secara hening di latar belakang.

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
1. **`functions/public/components/KostFormMitra.tsx`**:
   - Menghapus `hasRoomCover` pada baris ~5810.
   - Memperbarui teks deskripsi pada baris ~5825.
   - Menghapus blok JSX alert `{!hasRoomCover && (...)}` pada baris ~5835-5841.
2. **`functions/PROGRESS.md`**:
   - Mencatat penyelesaian pada Entri #272.
3. **`WALKTHROUGH.md`**:
   - Dokumentasi perubahan dan panduan verifikasi UI.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 setelah di-ACC)

1. **Langkah 1: Modifikasi `KostFormMitra.tsx`**
   - Hapus variabel:
     ```tsx
     const hasRoomCover = existingWithCats.some(p => p.cat.startsWith('Kamar:')) || newPhotoItems.some(p => p.category.startsWith('Kamar:'));
     ```
   - Perbarui paragraf deskripsi:
     ```tsx
     <p className="text-xs text-gray-600 mt-1">
         Unggah foto properti dan kamar kost Anda. Anda juga dapat memberi keterangan (caption) pada masing-masing foto.
     </p>
     ```
   - Hapus seluruh render conditional alert:
     ```tsx
     {!hasRoomCover && (
         <div className="mt-3 flex items-center gap-2 bg-amber-100/70 border border-amber-300/80 text-amber-900 text-xs px-3 py-2 rounded-xl">
             <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
             <span><strong>Perhatian:</strong> Mohon unggah minimal 1 foto pada kategori <strong>Kamar Tidur</strong> untuk dijadikan Cover Utama preview kost Anda.</span>
         </div>
     )}
     ```

2. **Langkah 2: Uji Kompilasi & Build**
   - Jalankan `npm --prefix functions/public run build` untuk memastikan 0 error kompilasi TypeScript dan Vite.

3. **Langkah 3: Dokumentasi & Git Push**
   - Catat di `functions/PROGRESS.md` (Entri #272).
   - Buat `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Visual**:
  - Kartu header "Dokumentasi Foto Properti & Kamar" kini tampil bersih, ringkas, dan profesional.
  - Tidak ada lagi kotak alert kuning peringatan "Cover Utama".
  - Tidak ada lagi kalimat teknis mengenai proses pemilihan cover utama.
- **Verifikasi Build**:
  - Build Vite sukses tanpa error (`exit code 0`).
