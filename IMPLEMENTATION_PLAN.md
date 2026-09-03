# IMPLEMENTATION PLAN: Portal Pemilihan Akses Masuk (Pencari Kost vs Pemilik Kost) di Login.tsx

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Halaman login saat ini menggunakan sistem tombol *toggle chip* (`Segmented Tab Pemilih Peran`) di dalam form login yang membingungkan pengguna baru mengenai hak akses dan alur pendaftaran.
- **Kebutuhan Pengguna**:
  - Menggantikan sistem chip tersebut dengan **Layar Gerbang Pemilihan Peran (Role Selection Portal)** sebelum pengguna masuk ke formulir autentikasi.
  - Menampilkan 2 kartu gerbang interaktif yang jelas dan elegan sesuai screenshot referensi:
    1. **Kartu 1: Pencari Kost**
       - Badge: `[ PENCARI HUNIAN KOST ]` (Oranye).
       - Judul: `Pencari Kost`.
       - Deskripsi: Penjelasan kemudahan mencari, membandingkan, dan menyewa kost.
       - Checklist Fitur: Akses 1.200+ database, Layanan Jasa Survey, dan Booking aman.
       - Tombol Aksi: `Lanjutkan sebagai Pencari →` (Oranye).
    2. **Kartu 2: Pemilik Kost**
       - Badge: `[ MITRA & PENGELOLA ]` (Biru/Indigo).
       - Judul: `Pemilik Kost`.
       - Deskripsi: Pengelolaan kamar, inventaris, pantauan okupansi, dan pemasaran ke ribuan mahasiswa.
       - Checklist Fitur: Pasang listing gratis, Sistem KostManager, Rekap laporan sewa & dompet.
       - Tombol Aksi: `Lanjutkan sebagai Pemilik →` (Navy/Indigo).
  - Setelah memilih peran, pengguna diarahkan ke formulir Login / Daftar yang dikhususkan untuk peran tersebut, dilengkapi tombol navigasi `← Ganti Peran` untuk kembali ke portal pemilihan peran jika diperlukan.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/Login.tsx` (Penambahan state `isRoleSelected`, render layar portal pemilihan akses, pembaruan layout form login tanpa chip lama, dan penambahan tombol ganti peran)

---

## 3. Langkah-Langkah Eksekusi
1. **Penambahan State Navigasi Portal (`isRoleSelected`)**:
   - Menambahkan state `isRoleSelected` (default `false` jika belum ada pilihan atau tidak ada query params khusus, dan `true` jika ada parameter `role=owner`, `role=user`, `upgrade_to_owner`, atau `mode=recovery`).
2. **Penyusunan Antarmuka Layar Portal Pemilihan Peran**:
   - Membangun Header: Badge `PORTAL AKSES MASUK & DAFTAR`, Judul `Pilih Akses Masuk Anda di RuangSinggah`, Subtitle penjelas.
   - Membangun Grid 2 Kartu Peran (Pencari Kost & Pemilik Kost) dengan ikon vector `lucide-react`, checklist fitur, dan tombol `Lanjutkan sebagai...`.
3. **Penyusunan Formulir Login/Daftar Terpersonalisasi**:
   - Menghapus chip selector lama dari dalam form login.
   - Menambahkan badge peran aktif dan tombol `← Ganti Peran` di bagian atas kartu form login.
   - Mempertahankan 100% fungsionalitas email/password, Google OAuth, OTP WhatsApp, Forgot Password, dan Upgrade Role modal.
4. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
5. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 303 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman `/login` di browser tanpa parameter:
  - Memverifikasi munculnya layar portal pemilihan akses 2 kartu (Pencari Kost vs Pemilik Kost).
  - Mengklik `Lanjutkan sebagai Pencari` $\rightarrow$ formulir login/daftar Pencari Kost terbuka tanpa chip switcher lama.
  - Mengklik `← Ganti Peran` $\rightarrow$ kembali ke portal pemilihan akses.
  - Mengklik `Lanjutkan sebagai Pemilik` $\rightarrow$ formulir login/daftar Pemilik Kost terbuka dengan validasi OTP WhatsApp mitra.
