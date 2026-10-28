# WALKTHROUGH - Optimalisasi Menu Peraturan Kost dengan Katalog Preset Aturan Populer & Input Manual

## 📌 Ringkasan Pekerjaan
Pekerjaan ini memperkaya dan mengoptimalkan antarmuka **Langkah 6 dari 6 (Peraturan Kost)** pada formulir pendaftaran/edit kost mitra di [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx).

Sebelumnya, pemilik kost disajikan kolom input teks kosong tunggal sehingga harus mengetik setiap aturan satu per satu dari nol. Kini, sistem menyediakan katalog aturan standar yang populer di kost-kostan Indonesia lengkap dengan fitur aktivasi satu-klik (*one-click toggle*), manajemen aturan aktif yang transparan, serta opsi input kustom manual yang tetap fleksibel.

---

## 🛠️ Detail Perubahan

### 1. Katalog Preset Standar Kost Indonesia (`KOST_RULE_CATEGORIES`)
Dikelompokkan ke dalam 5 kategori esensial dengan ikon representatif:
1. **🕒 Akses & Kunjungan Tamu**:
   - *Akses gerbang 24 jam*
   - *Jam malam tamu berkunjung maks. pukul 22.00*
   - *Tamu lawan jenis dilarang masuk ke dalam kamar*
   - *Tamu menginap wajib melapor ke pengelola kost*
   - *Dilarang membawa tamu menginap*
   - *Gerbang wajib selalu dikunci kembali setelah keluar/masuk*
2. **👥 Kapasitas & Tipe Penghuni**:
   - *Maksimal 1 orang per kamar*
   - *Boleh sekamar berdua (dengan biaya tambahan)*
   - *Khusus penghuni resmi (tidak boleh dipindahtangankan)*
   - *Penghuni pasutri wajib melampirkan surat/buku nikah resmi*
3. **🚭 Ketertiban & Kebersihan**:
   - *Dilarang merokok di dalam kamar tidur*
   - *Dilarang membawa atau mengonsumsi miras dan narkoba*
   - *Dilarang membuat kegaduhan / jam tenang setelah pukul 22.00*
   - *Wajib menjaga kebersihan dan kerapian area bersama*
   - *Dilarang membuang sampah atau pembalut ke dalam kloset*
4. **⚡ Listrik, Fasilitas & Keamanan**:
   - *Wajib mematikan lampu, AC, dan keran air saat meninggalkan kamar*
   - *Membawa alat elektronik tambahan dikenakan biaya tambahan*
   - *Dilarang memasak di dalam kamar tidur*
   - *Dilarang memaku atau merusak dinding kamar tanpa izin pengelola*
5. **🐾 Hewan Peliharaan**:
   - *Dilarang membawa hewan peliharaan*
   - *Boleh membawa hewan peliharaan tertentu (kucing/hewan kecil)*

### 2. Fitur Interaktif pada Antarmuka (UI/UX)
- **One-Click Toggle**: Mengetuk tombol chip akan langsung menambahkan atau menghapus aturan dari daftar `form.rules`.
- **Indikator Visual Tegas**: Chip aturan yang aktif disorot dengan warna oranye cerah (`bg-orange-500 text-white font-bold`) beserta ikon centang `Check`.
- **Daftar Aturan yang Diterapkan**:
  - Menyajikan counter total aturan (`📋 X Aturan Diterapkan`).
  - Menampilkan daftar nomor urut aturan aktif dengan tombol hapus cepat `(X)` per item dan opsi `Hapus Semua`.
- **Input Kustom Manual**:
  - Kolom teks dengan tombol `+ Tambah` dan shortcut tombol `Enter` untuk mengetik aturan khusus yang tidak ada di daftar preset.

---

## 🧪 Hasil Verifikasi & Uji Build

1. **Uji Kompilasi Frontend (`functions/public`)**:
   ```powershell
   cmd.exe /c "npm --prefix functions/public run build"
   ```
   - **Hasil**: **Exit Code 0 (Sukses 100%)**.
   - `✓ 2512 modules transformed.`
   - `✓ built in 1m 17s`
   - 0 error TypeScript (`tsc`) dan bundler Vite.
2. **Uji Kompilasi Backend (`functions`)**:
   ```powershell
   cmd.exe /c "npm --prefix functions run build"
   ```
   - **Hasil**: **Exit Code 0 (Sukses 100%)**.
   - `tsc` kompilasi backend tanpa error.

---

## 📋 Panduan Pengujian Pengguna (User Testing Guide)

1. **Buka Formulir Pendaftaran / Edit Kost Mitra**:
   - Masuk ke **Langkah 6 (Peraturan Kost)**.
2. **Uji Pemilihan Preset**:
   - Klik chip *"Akses gerbang 24 jam"* dan *"Dilarang merokok di dalam kamar tidur"*.
   - Perhatikan chip berubah warna menjadi oranye dengan ikon centang `✓`.
   - Perhatikan kedua aturan tersebut langsung masuk ke kartu **"Peraturan yang Diterapkan (2)"** di bagian bawah.
3. **Uji Hapus / Toggle**:
   - Klik kembali salah satu chip preset atau klik tombol `(X)` pada daftar di bawah. Aturan akan terhapus dengan mulus.
4. **Uji Input Kustom**:
   - Ketik aturan manual pada kolom *"Tambah Peraturan Khusus Lainnya"*, misalnya: *"Iuran sampah Rp 25.000 per bulan"*, lalu tekan **Enter** atau tombol **+ Tambah**.
   - Aturan kustom berhasil masuk ke daftar aturan aktif.
