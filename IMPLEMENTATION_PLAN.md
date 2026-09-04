# IMPLEMENTATION PLAN: Tombol Banned (Bekukan) & Hapus Permanen Properti KostManager

## 1. Analisis Kebutuhan & Konteks Alur
- **Kebutuhan**:
  1. **Tombol Action Banned / Bekukan**:
     - Digunakan oleh Admin untuk membekukan properti kelolaan KostManager yang melakukan pelanggaran kesepakatan kerjasama (misal: menaikkan tarif sepihak, menghubungi penyewa di luar sistem, komplain fasilitas berulang, dll.).
     - Menghilangkan listing dari publik (status properti menjadi `suspended` / `banned`), memperbarui status auto-pilot menjadi `🔴 Dibekukan (Pelanggaran)`, mencatat alasan pembekuan, serta mengirimkan notifikasi resmi kepada mitra pemilik kost.
     - Menyediakan opsi **Pulihkan / Unban** jika permasalahan pelanggaran telah diselesaikan dengan mitra.
  2. **Tombol Action Hapus Permanen**:
     - Digunakan oleh Admin untuk menghapus data properti secara permanen dari server database dan storage jika properti sudah tidak beroperasi atau ditarik permanen.
     - Dilengkapi dialog konfirmasi keamanan ganda (*Double Safety Confirmation*) agar mencegah penghapusan yang tidak disengaja.
     - Menghapus record properti di database Supabase (`properties`), tabel relasi (`mitra_kostmanager`), serta membersihkan seluruh file foto/video dari Supabase Storage.
- **Tujuan**:
  Memberikan kendali penuh dan penegakan tata tertib operasional (*compliance enforcement*) bagi pengelola platform KostManager RuangSinggah.id.

---

## 2. Dampak Perubahan File
Daftar file yang akan disentuh pada Fase 2:
1. **`functions/public/components/admin/KostManagerPortal.tsx`**:
   - Menambahkan ikon vector murni dari `lucide-react` (`ShieldAlert`, `ShieldCheck`, `Trash2`, `Ban`, `AlertTriangle`).
   - Memperbarui kolom **Status Auto-Pilot** pada tabel properti terkelola agar menampilkan status dinamis: `🟢 Aktif Terkelola` vs `🔴 Dibekukan (Pelanggaran)`.
   - Menambahkan 2 tombol aksi baru pada kolom **Aksi Operasional**:
     - Tombol **Banned / Pulihkan** (`ShieldAlert` / `ShieldCheck`).
     - Tombol **Hapus Permanen** (`Trash2`).
   - Menyediakan 2 modal interaktif berstandar UI modern:
     - **Modal Banned Kost**: Pilihan alasan pelanggaran (preset + textarea kustom), peringatan dampak, dan tombol eksekusi pembekuan/pemulihan.
     - **Modal Hapus Permanen**: Peringatan bahaya ganda, input ketik nama kost untuk verifikasi keamanan, dan tombol hapus permanen.
   - Mengintegrasikan fungsi handler pembekuan (`freezeProperty` / `unfreezeProperty`), sinkronisasi status ke `mitra_kostmanager`, pengiriman notifikasi ke pemilik, dan eksekusi `deleteProperty`.
2. **`functions/PROGRESS.md`**:
   - Pencatatan riwayat progres fitur selesai (nomor 330).
3. **`WALKTHROUGH.md`**:
   - Dokumentasi rincian perubahan dan panduan verifikasi pengujian.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)
1. **Langkah 1: Modifikasi `KostManagerPortal.tsx`**:
   - Import fungsi `freezeProperty`, `unfreezeProperty`, `deleteProperty`, dan `updatePropertyStatus` dari `adminService.ts`.
   - Definisikan state modal: `banningProp`, `unbanningProp`, `deletingProp`, `banReason`, `banCategory`, `confirmDeleteText`.
   - Buat fungsi handler:
     - `handleConfirmBanProperty`: mengubah status properti menjadi `suspended`, menyimpan alasan ke `metadata.suspend_reason`, menyinkronkan status ke tabel `mitra_kostmanager`, dan mengirim notifikasi ke mitra.
     - `handleConfirmUnbanProperty`: memulihkan status properti kembali menjadi `published` dan mengirim notifikasi ke mitra.
     - `handleConfirmDeleteProperty`: memanggil `deleteProperty`, membersihkan record `mitra_kostmanager`, dan memperbarui daftar properti secara instan.
   - Tambahkan tombol aksi di baris tabel properti terkelola.
   - Render Modal Banned dan Modal Hapus Permanen dengan desain premium Tailwind CSS dan ikon pure SVG.
2. **Langkah 2: Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public` untuk memastikan 0 error kompilasi.
   - Menjalankan `cmd /c npm run build` di `functions` (tsc backend).
3. **Langkah 3: Pencatatan Riwayat & Walkthrough**:
   - Mencatat progres fitur nomor 330 di `functions/PROGRESS.md`.
   - Membuat dokumen `WALKTHROUGH.md`.
4. **Langkah 4: Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
1. **Verifikasi Tampilan UI**:
   - Memastikan tombol Banned dan Hapus Permanen muncul rapi pada tabel Properti Terkelola dengan tooltip yang jelas.
   - Memastikan badge status auto-pilot berubah menjadi merah jika kost berstatus suspended/banned.
2. **Verifikasi Aksi Banned**:
   - Menguji alur pembekuan dengan memasukkan alasan pelanggaran.
   - Memverifikasi status berubah di tabel dan tombol berubah menjadi opsi "Pulihkan".
3. **Verifikasi Aksi Hapus Permanen**:
   - Menguji modal konfirmasi keamanan ganda dan memastikan penghapusan berjalan tuntas tanpa crash.
4. **Verifikasi Build**:
   - Memastikan `npm run build` berhasil tanpa error TypeScript.
