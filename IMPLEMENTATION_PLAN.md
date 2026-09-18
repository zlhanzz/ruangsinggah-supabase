# Rencana Implementasi: Redesain UI/UX Komunikatif Verifikasi WhatsApp & Formulir Profil Mitra (Langkah 1)

## 1. Analisis Masalah & Kebutuhan Pengguna

### Konteks & Gejala Masalah
Saat calon mitra baru membuat akun dan masuk ke tahap pengisian profil & verifikasi identitas di Dashboard Mitra (`/dashboard-mitra/profile?edit=true&step=1`):
1. **Ilusi Nomor WhatsApp Sudah Selesai**:
   - Nomor WhatsApp otomatis terisi dari akun pendaftaran (misal: `+6281527080656`). Karena tampilan kolom input sama persis dengan input teks biasa lainnya, calon mitra merasa kolom tersebut sudah lengkap dan tidak perlu tindakan apapun.
2. **Indikator Verifikasi Sangat Minim & Tidak Komunikatif**:
   - Satu-satunya penanda verifikasi adalah tombol kecil 9px bertuliskan `KIRIM OTP` di pojok kanan label input. Tidak ada badge peringatan, tidak ada warna pembeda, dan tidak ada teks instruksi bahwa nomor ini **wajib diverifikasi dengan kode OTP** sebelum bisa lanjut.
3. **Kolom Input OTP Tersembunyi (Hidden State)**:
   - Kotak 6-digit OTP baru muncul setelah tombol kecil tersebut diklik. Sebelum diklik, calon mitra sama sekali tidak tahu bahwa ada kode OTP yang harus dimasukkan.
4. **Tombol "LANJUTKAN" Mati Bisu (Silent Disabled)**:
   - Di bagian bawah form, tombol "LANJUTKAN" di-disable secara kaku (`disabled={!isStep1Complete}`) dengan warna abu-abu `bg-gray-200 text-gray-400 cursor-not-allowed`.
   - Ketika calon mitra telah mengisi Nama Lengkap dan Alamat Domisili, lalu melihat Nomor WhatsApp sudah terisi, mereka mencoba menekan tombol "LANJUTKAN". Namun tombol tersebut **tidak merespon sama sekali tanpa ada pesan penjelasan/umpan balik**, sehingga membuat calon mitra bingung dan mengira sistem bermasalah.
5. **Kurangnya Kejelasan Panduan Alur & Tombol Batal**:
   - Tidak ada petunjuk alur jelas di bagian atas form yang menerangkan bahwa proses terdiri dari 2 tahap (Tahap 1: Data Profil & Verifikasi WhatsApp, Tahap 2: KTP). Calon mitra juga membutuhkan kejelasan saat ingin membatalkan atau kembali ke menu sebelumnya.

---

## 2. Dampak Perubahan (Files Touched)

- `functions/public/pages/MitraProfile.tsx`:
  - Perombakan tata letak dan UI/UX pada Formulir Langkah 1 (Data Profil & Verifikasi WhatsApp).
  - Pembuatan **Dedicated WhatsApp Verification Card** (Kartu Verifikasi WhatsApp Interaktif & Terbuka Langsung).
  - Penambahan badge status tegas (`⚠️ WAJIB VERIFIKASI OTP` vs `✓ TERVERIFIKASI RESMI`).
  - Penyajian area input OTP yang komunikatif dengan tombol kirim OTP yang mencolok dan instruksi jelas.
  - Perbaikan tombol "LANJUTKAN" dengan *interactive feedback* (checklist persyaratan kelengkapan, pesan arahan jika belum diverifikasi, dan *auto smooth-scroll* berfokus ke kartu WhatsApp).
  - Penyempurnaan tombol "BATAL" agar dapat keluar dari form edit secara responsif dan bersih.

---

## 3. Langkah-Langkah Eksekusi Bertahap

### Langkah 1: Banner & Stepper Edukatif di Puncak Formulir
- Menambahkan banner informatif yang ramah dan jelas di bagian atas Formulir Langkah 1:
  > *"ℹ️ **Langkah 1 dari 2**: Lengkapi data diri Anda dan lakukan verifikasi nomor WhatsApp menggunakan kode OTP resmi. Nomor WhatsApp yang terverifikasi diperlukan untuk menerima notifikasi operasional kost."*

### Langkah 2: Pembuatan Dedicated WhatsApp Verification Card (Terbuka Langsung)
- Merombak total bagian Nomor WhatsApp dari sekadar input biasa menjadi sebuah kartu khusus berbingkai kontras:
  - **Status Header**:
    - Jika belum terverifikasi: Tampilkan badge mencolok berwarna oranye/merah `⚠️ BUTUH VERIFIKASI OTP (WAJIB)`.
    - Jika kode OTP sudah dikirim: Tampilkan badge `⏳ KODE OTP TERKIRIM KE WA`.
    - Jika sudah terverifikasi: Tampilkan badge hijau `✓ NOMOR TERVERIFIKASI`.
  - **Input Nomor Telepon**:
    - Input nomor WhatsApp dengan panduan teks jelas di bawahnya: *"Pastikan nomor WhatsApp ini aktif di smartphone Anda untuk menerima pesan kode verifikasi."*
  - **Area Verifikasi OTP yang Terbuka & Komunikatif**:
    - Jika belum terverifikasi dan belum meminta OTP: Tampilkan tombol utama berukuran besar yang menarik perhatian: **"📲 KIRIM KODE OTP KE WHATSAPP"** disertai instruksi langkah demi langkah.
    - Jika OTP telah dikirim: Tampilkan 6 kotak digit OTP (font mono tebal, autofocus otomatis) + tombol **"VERIFIKASI WHATSAPP SEKARANG"** + hitung mundur kirim ulang.
  - **Keadaan Terverifikasi**:
    - Menampilkan kartu hijau sukses dengan nomor terkunci aman dan opsi tombol *"Ganti Nomor WhatsApp"* jika mitra perlu mengubahnya di kemudian hari.

### Langkah 3: Umpan Balik Cerdas pada Tombol "LANJUTKAN" (No Silent Disabled)
- Menghilangkan sifat mati bisu pada tombol "LANJUTKAN":
  - Tampilkan mini checklist di atas tombol:
    - `[✓] Nama Lengkap`
    - `[⚠️] Nomor WhatsApp Terverifikasi (Belum)`
    - `[✓] Alamat Domisili`
  - Jika mitra menekan tombol "LANJUTKAN" sebelum WhatsApp diverifikasi:
    - Sistem tidak hanya diam, melainkan menampilkan alert/toast ramah: *"Silakan lakukan verifikasi nomor WhatsApp Anda dengan kode OTP terlebih dahulu sebelum melanjutkan ke Langkah 2."*
    - Halaman melakukan *smooth scroll* otomatis ke Kartu WhatsApp dan memberikan efek kedip/highlight oranye lembut agar perhatian mitra langsung tertuju ke sana.

### Langkah 4: Kejelasan dan Keandalan Tombol "BATAL"
- Memastikan tombol "BATAL" mereset form dan mengarahkan kembali ke tampilan ringkasan profil mitra tanpa kendala.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi & Build**:
   - Menjalankan `cmd.exe /c npm run build` di direktori `functions/public` untuk memastikan 100% bebas dari error TypeScript dan build lolos (exit code 0).
2. **Uji Tampilan & Interaktivitas**:
   - Buka `/dashboard-mitra/profile?edit=true&step=1` dalam mode mobile dan desktop.
   - Verifikasi bahwa kartu WhatsApp langsung menonjolkan status belum terverifikasi dan tombol Kirim OTP sangat jelas.
   - Verifikasi bahwa kotak OTP mudah diisi dan komunikatif.
   - Verifikasi saat tombol "LANJUTKAN" diklik sebelum OTP diverifikasi, sistem memberikan umpan balik dan mengarahkan fokus ke kartu WhatsApp.
   - Verifikasi bahwa setelah WhatsApp diverifikasi, tombol "LANJUTKAN" berubah aktif dan mengantar ke Langkah 2 (Unggah KTP).
