# IMPLEMENTATION PLAN - Evaluasi & Modernisasi UI/UX Penambahan Tipe Kamar Dashboard Mitra

Dokumen ini adalah rencana kerja Fase 1 untuk mengevaluasi dan merombak tampilan UI/UX penambahan tipe kamar pada formulir tambah/edit properti di Dashboard Mitra ([KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)), agar lebih responsif di berbagai ukuran layar, berstandar industri modern, serta menerapkan flow entri baru di mana formulir input tidak langsung terbuka otomatis melainkan diawali oleh layar ikhtisar/tombol tambah.

---

## 1. Analisis Masalah & Kebutuhan Pengguna

### A. Masalah Alur Entri (*Immediate Form Open*)
- **Kondisi Saat Ini**:
  Pada kode [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx) baris 4505 terdapat logika:
  ```ts
  const isFormOpen = editingRoomIndex !== null || roomList.length === 0;
  ```
  Hal ini menyebabkan ketika mitra berpindah dari Langkah 2 (Lokasi) menuju Langkah 3 (Tipe Kamar), sistem **secara agresif langsung membuka formulir sub-wizard** pengisian dengan nilai default kamar ("Standard 3x4m") meskipun mitra belum pernah menekan tombol tambah kamar.
- **Kebutuhan Pengguna**:
  Ketika baru pertama kali masuk ke Langkah 3, sistem tidak boleh langsung memaksa membuka menu input kamar. Mitra harus melihat layar ikhtisar terlebih dahulu dan secara sadar menekan tombol **"+ Tambah Tipe Kamar"** baru kemudian formulir input muncul.

### B. Masalah Keterbatasan UI/UX & Responsivitas
1. **Mini-Stepper Sempit di Mobile**:
   Tab navigasi 3 tahap (`1. Profil & Ukuran`, `2. Kapasitas & Unit`, `3. Periode & Harga`) pada layar smartphone terlihat padat dan teksnya saling berhimpitan atau terpotong.
2. **Preset & Input Nama Kamar**:
   Pilihan preset dan opsi nama kustom perlu transisi visual yang lebih halus dan intuitif.
3. **Keterbacaan Dimensi Kamar**:
   Pemilihan ukuran kamar (`3x3 m`, `3x4 m`, dll.) belum memberikan kalkulasi luas ruangan (misal: "± 12 m²") yang menjadi standar industri (seperti di Airbnb, Mamikos, Booking.com).
4. **Kontrol Kapasitas & Ketersediaan Unit**:
   Tombol stepper counter (+/-) dan kapasitas penghuni perlu target sentuh (*touch target*) minimal 44x44px yang nyaman di perangkat seluler dengan visual ikon `lucide-react` yang elegan.
5. **Kerapian Kartu Ringkasan Kamar Tersimpan**:
   Kartu kamar yang sudah dibuat membutuhkan visual card modern dengan badge status ketersediaan yang tegas, label harga utama yang menonjol, dan tombol aksi (Edit & Hapus) yang ergonomis.

---

## 2. Dampak Perubahan

File yang disentuh:
- **[KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)**:
  1. Penyesuaian state kontrol form terbuka/tertutup (`editingRoomIndex !== null`).
  2. Implementasi **Layar Ikhtisar Awal / Empty State** yang memuat ilustrasi, ringkasan panduan, dan tombol aksi primer `+ Tambah Tipe Kamar Pertama`.
  3. Redesain **Mini-Stepper 3 Tahap** yang adaptif di layar smartphone maupun desktop.
  4. Peningkatan komponen input di setiap tahap:
     - **Tahap 1**: Radio chip preset nama + transisi input nama kustom, quick chip ukuran kamar + indikator kalkulasi luas (m²).
     - **Tahap 2**: Tombol pill kapasitas dengan ikon person, stepper ketersediaan kamar yang ramah sentuhan, dan switch pertanyaan biaya penghuni ekstra yang bersih.
     - **Tahap 3**: Pilihan multi-periode dengan indikator tarif Bulanan sebagai tarif utama, input format Rupiah otomatis (`Rp X.XXX.XXX`), dan field biaya penghuni ekstra terpadu.
  5. Redesain **Kartu Ringkasan Tipe Kamar** tersimpan agar setara standar aplikasi perhotelan & kost modern.
  6. Penyediaan tombol **"Batal"** yang selalu aman diklik untuk kembali ke layar ikhtisar/daftar kamar tanpa menghilangkan data lain.

> [!NOTE]
> Seluruh skema struktur data `RoomType`, alur validasi `validateCurrentStep(2)`, dan binding database Supabase tetap dipertahankan 100% tanpa perubahan struktur tabel.

---

## 3. Langkah-Langkah Eksekusi Rinci

### Langkah 1: Penyesuaian Logika Tampilan & State Buka/Tutup
- Ubah penentu `isFormOpen`:
  ```ts
  const isFormOpen = editingRoomIndex !== null;
  ```
- Buat fungsi `startAddNewRoomFirstTime()` atau optimalkan `startAddRoom()` yang mengatur `editingRoomIndex(-1)` dan menginisialisasi draft kamar bersih.
- Fungsi `cancelRoomDraft()` memastikan `editingRoomIndex` kembali ke `null`, menutup form dan kembali ke tampilan ikhtisar/daftar kamar.

### Langkah 2: Pembuatan Komponen Layar Ikhtisar Awal (Empty State)
- Jika `roomList.length === 0` dan `!isFormOpen`:
  - Tampilkan card sambutan modern dengan ikon `Bed` / `Layers`.
  - Judul: "Atur Tipe Kamar & Tarif Sewa".
  - Penjelasan singkat manfaat pendaftaran tipe kamar.
  - Poin keunggulan ringkas (misal: *Bisa buat beragam tipe*, *Fleksibilitas sewa bulanan/harian*, *Fasilitas detail diatur di langkah berikutnya*).
  - Tombol aksi primer: **"+ Tambah Tipe Kamar Pertama"** yang mencolok dengan efek hover modern.

### Langkah 3: Modernisasi Sub-Wizard Form (3 Tahap)
- **Header Sub-Wizard**:
  - Stepper adaptif dengan visual active bar / pill steps yang rapi di layar mobile (tidak membuat teks terpotong).
  - Tombol "Batal" / "Tutup" yang jelas di sudut kanan atas.
- **Tahap 1 (Profil & Ukuran)**:
  - Preset nama tipe kamar yang responsif + animasi pembuka input kustom.
  - Dimensi kamar: Chip preset + input teks dengan helper perhitungan luas otomatis (contoh: "3x4 m" $\rightarrow$ "± 12 m²").
- **Tahap 2 (Kapasitas & Ketersediaan)**:
  - Pilihan kapasitas penghuni (1, 2, 3 Orang) dengan ikon `User` / `Users`.
  - Stepper unit kamar yang nyaman untuk tap jari di smartphone.
  - Kartu opsi biaya sewa tambahan penghuni ekstra yang jelas.
- **Tahap 3 (Periode Sewa & Harga)**:
  - Chip toggle periode sewa (Bulanan sebagai tarif utama).
  - Input nominal sewa dengan currency formatting otomatis.
  - Input biaya tambahan penghuni (jika diaktifkan) dalam kartu aksen yang rapi.
  - Tombol navigasi "Kembali" dan "Simpan Tipe Kamar" yang kontras dan responsif.

### Langkah 4: Modernisasi Kartu Tipe Kamar Tersimpan (Summary View)
- Jika `roomList.length > 0` dan `!isFormOpen`:
  - Tampilkan kartu-kartu tipe kamar dengan desain berkelas:
    - Chip status ketersediaan kamar (`X Kamar Tersedia` atau `Kamar Penuh`).
    - Chip dimensi dan kapasitas penghuni.
    - Nominal tarif bulanan yang besar dan jelas.
    - Tombol aksi `Edit` dan `Hapus` dengan touch target yang ramah pengguna.
  - Tombol `+ Tambah Tipe Kamar Lainnya` dengan style modern dashed card yang interaktif.
  - Banner pemandu informatif bahwa fasilitas kasur/lemari/AC dan foto kamar akan diatur di Langkah 4 & 5.

---

## 4. Rencana Verifikasi

1. **Uji Validasi Form & Flow Baru**:
   - Memastikan saat masuk ke Langkah 3 pertama kali, form input TIDAK langsung terbuka; layar menampilkan ikhtisar dan tombol "+ Tambah Tipe Kamar Pertama".
   - Menekan "+ Tambah Tipe Kamar Pertama" membuka form input 3 tahap secara mulus.
   - Menekan tombol "Batal" menutup form dan kembali ke layar ikhtisar tanpa error.
   - Mengisi dan menyimpan tipe kamar membuat kartu tipe kamar muncul di daftar.
   - Menekan "+ Tambah Tipe Kamar Lainnya" membuka form untuk tipe kamar berikutnya.
   - Menekan "Edit" pada kartu kamar mengisi data lama ke form dengan benar.
   - Menghapus kamar berhasil dengan konfirmasi yang aman.
2. **Uji Validasi Ketat Langkah Wizard**:
   - Memastikan jika belum ada kamar terdaftar sama sekali, menekan tombol "Lanjut" utama di footer tetap dicegah oleh validator ("Wajib mendaftarkan minimal satu tipe kamar sebelum melanjutkan").
   - Memastikan jika form sedang terbuka dan belum disimpan, tombol "Lanjut" mengingatkan user untuk menyimpan atau membatalkan draft kamar.
3. **Uji Responsivitas Tampilan**:
   - Memastikan stepper dan form tidak overflow atau berantakan pada resolusi mobile (360px - 414px) maupun desktop.
4. **Uji Kompilasi Kode**:
   - Menjalankan `cmd /c npm run build` pada folder `functions/public` untuk memastikan 0 error kompilasi TypeScript / Vite.
   - Menjalankan `cmd /c npm run build` pada folder `functions` untuk memastikan build backend tetap lulus 100%.
