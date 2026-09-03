# WALKTHROUGH: Kendali Cepat Update Jumlah Kamar Tersedia di Menu "Kost Saya"

## 1. Ringkasan Pekerjaan
Fitur **Kendali Cepat Update Jumlah Kamar Tersedia** telah berhasil diimplementasikan pada kartu listing di tab **"Kost Saya"** (`/dashboard-mitra/properties`). Pemilik kost kini dapat memperbarui status kamar kosong/tersedia dalam hitungan detik secara instan tanpa perlu masuk ke wizard formulir pengeditan penuh 6-langkah.

---

## 2. Detail Perubahan & Fitur yang Dikembangkan

### A. Widget Kendali Cepat di Kartu Listing Kost (`MitraDashboard.tsx`)
1. **Badge Status & Counter Ketersediaan**:
   - Di bawah informasi Harga/Bulan dan Rating, terdapat kotak kendali ketersediaan kamar yang intuitif.
   - Status dinamis:
     - **🟢 X Kamar Kosong**: Jika terdapat kamar yang siap disewa.
     - **🔴 Kamar Penuh**: Jika kamar bernilai 0.
2. **Stepper Interaktif `[-]` dan `[+]` (Untuk Kost 1 Tipe Kamar)**:
   - Tombol minus `[-]`: Mengurangi 1 kamar kosong (otomatis disabled jika sudah 0).
   - Indikator tengah: Menampilkan angka unit kamar dan status simpan instan (*"Siap Disewa"* / *"Menyimpan..."*).
   - Tombol plus `[+]`: Menambah 1 kamar kosong.
   - **0ms Delay / Optimistic Update**: Perubahan langsung tampil di layar dan disimpan ke tabel `properties` Supabase di background.

### B. Modal Cepat Multi Tipe Kamar (*Quick Room Manager Modal*)
- Untuk kost yang memiliki lebih dari 1 tipe kamar (misal: Standard, Deluxe, VIP):
  - Kartu properti menampilkan tombol `[ Atur per Tipe Kamar ⚡ ]`.
  - Membuka dialog modal ringkas yang memuat daftar seluruh tipe kamar beserta harga dan stepper `[-]`/`[+]` masing-masing tipe.
  - Perubahan per tipe kamar langsung tersimpan secara *real-time*.

### C. Standar Visual & Bebas FOUT
- Menggunakan 100% SVG bundled lokal dari `lucide-react` (`<Bed />`, `<Zap />`, `<X />`) sehingga tidak ada kedipan font ligature atau delay pemuatan ikon.

---

## 3. Hasil Pengujian & Kompilasi
- **Uji Kompilasi Vite**:
  ```bash
  cmd /c npm run build
  ```
  - **Hasil**: `✓ built in 1m 23s`, **0 error**.

---

## 4. Panduan Pengujian bagi Pengguna
1. Buka aplikasi dan pastikan login sebagai **Pemilik Kost** / Mitra.
2. Buka tab **"Kost Saya"** pada Dashboard Mitra (`/dashboard-mitra/properties`).
3. Lihat salah satu kartu kost:
   - Perhatikan kotak **"Kamar Tersedia"** di bawah info harga & rating.
   - Klik tombol **`+`** untuk menambah kamar kosong.
   - Klik tombol **`-`** untuk mengurangi kamar kosong.
   - Jika memiliki lebih dari 1 tipe kamar, klik tombol **"Atur per Tipe Kamar ⚡"** dan sesuaikan jumlah kamar pada modal yang muncul.
4. Perubahan akan langsung tercermin secara instan baik di kartu dashboard maupun di halaman detail kost pencari (`KostDetail`).
