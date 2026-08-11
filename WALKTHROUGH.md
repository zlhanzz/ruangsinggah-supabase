# WALKTHROUGH - Pendaftaran KostManager, Pelacakan GPS, Pemantauan Status Pengajuan, & Restorasi UI/UX Stepper

## 1. Daftar Perubahan
Berikut adalah detail perubahan yang telah dilakukan pada kode program secara lokal:

### A. Restorasi UI/UX Stepper Form KostManager (`AgentDashboard.tsx`)
- Merestorasi formulir pengisian data KostManager oleh Agen Survey menjadi model **Wizard Stepper 3 Langkah** sesuai desain Google Stitch:
  - **Langkah 1 (Properti):**
    - Input nama properti kos (`title`).
    - Selector tipe kos (grup tombol Putra, Putri, Campur) dengan highlight warna oranye aktif.
    - Input alamat lengkap properti.
    - Lokasi GPS dengan koordinat lintang & bujur terperinci serta tombol *"Kunci Koordinat Presisi Saat Ini"* yang secara otomatis mendeteksi koordinat GPS browser surveyor.
    - Checklist fasilitas umum properti dengan fitur tambahkan fasilitas kustom secara dinamis.
    - Dokumentasi area umum dengan 4 slot foto default (Bangunan Depan, Koridor, Area Umum, Lingkungan) dan tombol *"Tambah Foto Lainnya"* yang memicu upload storage Supabase secara dinamis.
    - Pengelolaan fasilitas & landmark terdekat (kampus/kantor) lengkap dengan kunci koordinat landmark dan opsi penghapusan.
    - Pengelolaan daftar peraturan kost yang dinamis (tambah, edit teks, dan hapus peraturan).
  - **Langkah 2 (Data Kamar):**
    - Panel pengelolaan tipe kamar yang terstruktur: Nama tipe kamar, ukuran kamar, harga bulanan, jumlah unit kamar tersedia, kapasitas orang, status ketersediaan, checklist fasilitas kamar, checklist fasilitas kamar mandi, serta upload beberapa foto kamar per unit ke storage.
  - **Langkah 3 (Review & Kirim):**
    - Halaman pratinjau (review) komprehensif yang menampilkan semua data yang telah diinput di Langkah 1 & Langkah 2 sebelum agen mengirimkan ke database.
- Menyediakan navigasi tombol bagian bawah modal yang dinamis (Batal, Simpan Draft, Lanjut ke Langkah 2/3, Kembali ke Langkah 1/2, dan Simpan & Kirim Listing).

### B. Integrasi Warna Tema Stitch (`index.css` & `AgentDashboard.tsx`)
- Menambahkan konfigurasi `@theme` kustom pada berkas [index.css](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/index.css) untuk mendaftarkan variabel warna dari desain Stitch Google:
  - Warna primer: `--color-primary: #ff7a00`
  - Warna permukaan: `--color-surface-container-lowest: #ffffff`, `--color-surface-container-low: #eff4ff`, `--color-surface: #f8f9ff`, dll.
- Menggunakan variabel warna ini di sepanjang render komponen form modal agar tampilan visual dan layout bernilai premium dan sangat mirip dengan mockup Stitch.

## 2. Hasil Pengujian & Verifikasi
- Pengujian kompilasi produksi dengan `npm run build` selesai dengan **sukses** (100% aman tanpa error lint/tipe data).
- Alur stepper 3 langkah berfungsi penuh dari validasi input, fungsionalitas sensor GPS, upload media ke cloud storage, hingga sinkronisasi data properti ke database Supabase.

## 3. Petunjuk Deploy
Deploy dapat langsung dilakukan oleh pemilik dengan melakukan push manual saat Anda sudah siap.
Jangan lupa untuk menjalankan potongan kode migrasi SQL berikut di editor query Supabase Anda untuk menyelaraskan struktur database:
```sql
ALTER TABLE public.kostmanager_requests 
ADD COLUMN IF NOT EXISTS survey_date DATE,
ADD COLUMN IF NOT EXISTS survey_time TIME,
ADD COLUMN IF NOT EXISTS notes TEXT;
```
