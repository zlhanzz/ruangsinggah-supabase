# IMPLEMENTATION PLAN: Penerapan Fitur Tombol 'Bagikan' & 'Simpan' (Favorit) Serta Pembaruan Header Listing di KostDetail.tsx

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Header kartu utama listing pada `KostDetail.tsx` hanya menampilkan badge tipe kost polos (`[ PUTRA ]`), badge `Terverifikasi`, nama kost, dan alamat.
  - Belum tersedia tombol aksi cepat untuk membagikan tautan kost ke media sosial/teman (**Tombol Bagikan**) maupun menyimpan properti ke daftar favorit pengguna (**Tombol Simpan**).
- **Kebutuhan Pengguna**:
  - Menerapkan **Tombol Bagikan** (`Share2`) dan **Tombol Simpan** (`Heart`) di baris atas kartu informasi listing (sebelah kanan, sejajar dengan badge tipe & verifikasi).
  - **Fitur Tombol Bagikan**:
    - Mendukung `navigator.share` (Native Mobile/Desktop Share dialog).
    - Fallback otomatis berupa penyalinan tautan listing ke clipboard (*Copy to Clipboard*) disertai toast notifikasi sukses yang elegan.
  - **Fitur Tombol Simpan**:
    - Menyimpan ID kost ke daftar favorit (`localStorage` `ruangsinggah_saved_kosts` dan sinkron state).
    - Status visual dinamis: Ikon hati berubah merah terisi (`fill-rose-500 text-rose-500`) dan teks menjadi *"Tersimpan"* saat aktif.
    - Notifikasi toast visual saat kost berhasil ditambahkan/dihapus dari daftar simpanan.
  - **Penyempurnaan Tampilan Header**:
    - Badge tipe kost yang lebih representatif: `KOST PUTRA` / `KOST PUTRI` / `KOST CAMPUR` dengan ikon user.
    - Badge `Terverifikasi RuangSinggah` dengan centang hijau/emerald yang rapi.
    - Ikon `MapPin` oranye untuk alamat.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx` (Penambahan state & handler `handleShare`, `handleToggleSave`, rendering tombol Bagikan & Simpan, serta peremajaan header card).

---

## 3. Langkah-Langkah Eksekusi
1. **State & Helper Logic**:
   - Menambahkan import `Share2`, `Heart`, `Check` dari `lucide-react`.
   - Menambahkan state `isSaved` yang menginisialisasi dari `localStorage` (`ruangsinggah_saved_kosts`).
   - Menambahkan state `toastMessage` untuk menampilkan feedback mini saat share atau save dilakukan.
   - Membuat fungsi `handleShare()`:
     - Menggunakan `navigator.share({ title, url })` jika tersedia.
     - Fallback: `navigator.clipboard.writeText(window.location.href)` dan menampilkan toast *"Tautan berhasil disalin ke clipboard!"*.
   - Membuat fungsi `handleToggleSave()`:
     - Toggle ID kost pada `localStorage`.
     - Update state `isSaved` dan menampilkan toast *"Kost berhasil disimpan ke favorit!"* / *"Kost dihapus dari favorit"*.
2. **Pembaruan Layout Header Card di `KostDetail.tsx`**:
   - Mengubah baris atas header card menjadi flex container yang memuat:
     - Sisi Kiri: Badge `KOST PUTRA/PUTRI/CAMPUR` + Badge `Terverifikasi RuangSinggah`.
     - Sisi Kanan: Tombol `Bagikan` (icon `Share2`) + Tombol `Simpan` / `Tersimpan` (icon `Heart`).
   - Merapikan tipografi nama kost dan alamat dengan ikon `MapPin`.
3. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
4. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 299 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman detail kost (`/kost/:id`) di desktop dan mobile.
- Menguji klik **Tombol Bagikan**:
  - Memverifikasi dialog share muncul atau URL tersalin ke clipboard disertai toast notifikasi.
- Menguji klik **Tombol Simpan**:
  - Memverifikasi ikon hati berubah menjadi merah (`Tersimpan`), tersimpan di `localStorage`, dan jika di-refresh statusnya tetap tersimpan.
  - Memverifikasi klik kedua menghapus dari daftar simpanan.
- Memverifikasi badge tipe dan verifikasi tampil serasi dan rapi sesuai desain referensi.
