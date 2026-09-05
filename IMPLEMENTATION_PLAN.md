# Rencana Implementasi: Pemisahan Tahapan Pemilihan Metode Pendaftaran KostManager di Awal (Dedicated Selection Step)

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Saat modal pendaftaran KostManager dibuka, seluruh elemen form (pilihan metode, daftar kartu kost, preview foto, dan kolom input data) langsung tampil bertumpuk dalam satu layar panjang.
  - Hal ini membuat calon mitra tidak menyadari secara jelas bahwa mereka memiliki 2 pilihan alur yang berbeda (*Pilih Listing Kost yang Sudah Ada* vs *Daftar Kost Baru secara Eksklusif*).
- **Tujuan Pengembangan**:
  - Memisahkan alur pendaftaran menjadi **3 Tahapan Bertahap (Dedicated Multi-Step Flow)**:
    1. **Tahap 1: Pemilihan Metode Pendaftaran (Dedicated Initial Screen)**
       - Menampilkan 2 kartu pilihan metode yang eksklusif, jelas, dan berwibawa:
         - **Opsi A: Pilih dari Kost Saya (Listing Terdaftar)** $\rightarrow$ Daftarkan kost yang sudah aktif di akun mitra; data kamar, foto, dan titik lokasi disinkronkan otomatis.
         - **Opsi B: Daftarkan Kost Baru (Eksklusif)** $\rightarrow$ Daftarkan properti kost baru yang belum pernah diunggah dengan mengisi formulir dari awal.
    2. **Tahap 2: Input / Konfirmasi Data Properti (Sesuai Metode Terpilih)**
       - **Jika Opsi A**: Menampilkan pemilih kartu properti visual eksisting, showcase cover foto properti terpilih, konfirmasi sinkronisasi, dan tinjauan formulir.
       - **Jika Opsi B**: Menampilkan formulir input lengkap data properti baru (Nama, Jenis Kost, Jumlah Kamar, GPS, Pinpoint Peta Google Maps, dan Alamat).
       - Tersedia tombol *"← Ganti Metode"* untuk kembali ke Tahap 1 kapan saja.
    3. **Tahap 3: Syarat & Ketentuan (MoU) & Ringkasan Pembayaran**
       - Menampilkan ringkasan data properti & paket langganan yang dipilih, klausul Syarat & Ketentuan, checkbox persetujuan, dan tombol checkout pembayaran.

---

## 2. Dampak Perubahan
File yang akan disentuh:
- `functions/public/pages/KostManagerLanding.tsx`
  - Memperbarui state `modalStep` menjadi `'method' | 'form' | 'mou'`.
  - Merancang antarmuka **Tahap 1 (Dedicated Method Selection Screen)** dengan 2 kartu interaktif yang menonjol.
  - Memperbarui **Tahap 2 (Property Data Step)** agar menyesuaikan tampilannya secara bersih berdasarkan metode yang dipilih (`isManualInput`).
  - Menyelaraskan **Multi-Step Progress Indicator Bar** menjadi 3 tahap: `1. Metode` $\rightarrow$ `2. Data Properti` $\rightarrow$ `3. Syarat & MoU`.
  - Menambahkan navigasi kembali bertahap (*Back Navigation*) di setiap tahapan.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)
1. **Langkah 1: Perluasan State Multi-Step di `KostManagerLanding.tsx`**:
   - Menambahkan tipe `modalStep: 'method' | 'form' | 'mou'`.
   - Mengatur `handleOpenRegistration` agar menginisialisasi `modalStep = 'method'` jika mitra memiliki kost terdaftar (`userKosts.length > 0`), atau langsung `form` jika belum memiliki kost.
2. **Langkah 2: Pembuatan Antarmuka Tahap 1 (Layar Pemilihan Metode Dedicated)**:
   - Desain 2 kartu pilihan besar ber-hover effect dengan icon `<Building2 />` dan `<PlusCircle />`, judul tebal, deskripsi manfaat masing-masing opsi, badge jumlah listing tersedia, dan tombol aksi "Pilih & Lanjutkan".
3. **Langkah 3: Pemisahan & Penyesuaian Tahap 2 (Data Properti)**:
   - Tampilkan sub-flow khusus **Pilih dari Kost Saya** (Visual Cards Grid, Cover Photo Showcase Preview, Mini-Map, dan Data Confirmation).
   - Tampilkan sub-flow khusus **Daftar Kost Baru Manual** (Formulir input baru lengkap dengan GPS dan Google Maps picker).
   - Sediakan tombol *"Ganti Metode"* di header/footer untuk memudahkan mitra beralih metode.
4. **Langkah 4: Sinkronisasi Tahap 3 (Syarat & Ketentuan MoU)**:
   - Memastikan tombol *"Kembali"* di tahap MoU mengarahkan kembali ke Tahap 2 (`form`).
5. **Langkah 5: Penyesuaian Multi-Step Indicator Bar**:
   - Memperbarui bar indikator di header menjadi 3 langkah visual: `1. Metode` $\rightarrow$ `2. Data Properti` $\rightarrow$ `3. Syarat & MoU`.
6. **Langkah 6: Kompilasi, Verifikasi, dan Git Push**:
   - Jalankan `npm run build` di `functions/public` untuk memastikan 0 error kompilasi.
   - Catat progres ke `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Lakukan commit dan push ke GitHub branch `bukan-productions`.

---

## 4. Rencana Verifikasi
1. **Verifikasi Kompilasi**:
   - Menjalankan `npm run build` di `functions/public` hingga lulus tanpa error TypeScript.
2. **Verifikasi Layar Tahap 1 (Pemilihan Metode)**:
   - Membuka modal pendaftaran dan memastikan hanya muncul 2 kartu pilihan metode yang jelas (tanpa langsung menampilkan input formulir).
3. **Verifikasi Alur Opsi A (Pilih dari Kost Saya)**:
   - Memilih Opsi A $\rightarrow$ Memastikan sistem masuk ke Tahap 2 dengan menampilkan pemilih kartu visual properti eksisting dan preview foto cover.
4. **Verifikasi Alur Opsi B (Daftar Kost Baru Eksklusif)**:
   - Memilih Opsi B $\rightarrow$ Memastikan sistem masuk ke Tahap 2 dengan menampilkan formulir kosong untuk kost baru beserta fitur GPS & Google Maps.
5. **Verifikasi Tombol Ganti Metode & Back Navigation**:
   - Memastikan tombol kembali / ganti metode dapat mengembalikan mitra ke layar pemilihan metode dengan mulus.
