# WALKTHROUGH: Redesain Total UI/UX Modal Profil Calon Penghuni & Tab Navigasi Pesanan

**ID Progres**: #473  
**Tanggal**: 29 Oktober 2026  
**Status**: Selesai & Lulus Uji Kompilasi 100%  

---

## 1. Ringkasan Perubahan UI/UX

Menindaklanjuti masukan visual pengguna mengenai dua komponen antarmuka yang kurang proporsional dan terpotong:

### A. Redesain Total Modal Detail Profil Calon Penghuni
1. **Proporsi Dialog Elegan & Nyaman di Mobile**:
   - Mengganti modal lama yang kaku (`rounded-[3.5rem]` dengan padding 40px) menjadi dialog proptech modern berukuran proporsional (`max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl`).
   - Header dialog yang bersih dilengkapi judul *Detail Profil Calon*, deskripsi ringkas, dan tombol close `X` bulat yang intuitif.
2. **Hero Card Profil Seimbang**:
   - Avatar proporsional `w-16 h-16 rounded-2xl` dengan inisial atau foto asli.
   - Nama lengkap calon penyewa dengan badge `✓ Terverifikasi` dan ringkasan pekerjaan & kampus.
3. **Baris Kontak Lebar Penuh (100% Bebas Elipsis)**:
   - **Nomor WhatsApp**: Ditampilkan utuh tanpa terpotong (`+62 815-27xx-xxxx`), lengkap dengan tombol aksi cepat **[ Chat WA ]** yang membuka tautan WhatsApp langsung (`wa.me`).
   - **Alamat Email**: Ditampilkan pada baris horizontal lebar penuh dengan kemampuan *text-selection* mudah untuk disalin.
4. **Grid Informasi Latar Belakang Rapi**:
   - Kartu bersih untuk *Pekerjaan*, *Instansi/Kampus*, *Jenis Kelamin*, *Status Hubungan*, dan *Alamat Asal*.
5. **Footer Aksi Proptech**:
   - Tombol sekunder **[ Tutup ]** setinggi 44px standar mobile.
   - Tombol primer **[ 💬 Tanya Calon ]** untuk langsung membuka sesi chat internal RuangSinggah dengan calon penyewa.

---

### B. Segmented Pill Tab Navigasi Pesanan (Anti-Patah / Anti-Wrap)
1. **Anti-Text Wrapping Glitch**:
   - Menerapkan `whitespace-nowrap shrink-0` sehingga label tab tidak akan pernah patah menjadi 2 baris canggung (`TUNGGU \n BAYAR` atau `BATAL / \n KADALUARSA 2`).
2. **Tipografi Title Case Nyaman Dibaca**:
   - Mengganti font all-caps kaku menjadi Title Case yang elegan: `Permintaan`, `Tunggu Bayar`, `Selesai`, `Batal / Kadaluarsa`.
3. **Smooth Scrollable Pill Tabs**:
   - Kontainer tab dapat digeser horizontal dengan mulus pada layar handphone kecil tanpa scrollbar kasar (`no-scrollbar`).
   - Active state tab berupa pill putih dengan border halus dan bayangan lembut, kontras sempurna dengan background abu-abu slate.
   - Badge jumlah pesanan oranye solid pada tab aktif dan abu-abu slate pada tab non-aktif.

---

## 2. File yang Dimodifikasi

1. **`functions/public/pages/MitraDashboard.tsx`**:
   - Redesain segmented pill tab navigasi pesanan (`bookingTab`).
   - Redesain total modal dialog profil calon penghuni (`APPLICANT PROFILE MODAL`).
2. **`functions/PROGRESS.md`**:
   - Pencatatan progres #473.

---

## 3. Hasil Pengujian & Kompilasi

| Pengujian | Perintah | Status | Keterangan |
|---|---|---|---|
| **Frontend Build** | `npm --prefix functions/public run build` | **LULUS (Code 0)** | 2.512 modul tertransformasi, aset minified bersih tanpa error Vite. |
| **Backend Functions Build** | `npm --prefix functions run build` | **LULUS (Code 0)** | Kompilasi TypeScript (`tsc`) backend lulus 100%. |

---

## 4. Panduan Verifikasi Pengguna (User Testing Guide)

1. **Buka Halaman Pesanan Mitra**:
   - Akses: `http://localhost:5173/dashboard-mitra/bookings` pada browser handphone atau mode responsive mobile di desktop browser (lebar 360px–390px).
2. **Periksa Tab Navigasi Pesanan**:
   - Perhatikan baris tab: `Permintaan`, `Tunggu Bayar`, `Selesai`, `Batal / Kadaluarsa`.
   - Pastikan seluruh tulisan berada rapi dalam satu baris (tidak ada teks patah 2 baris).
   - Geser tab ke kiri dan kanan untuk memastikan scroll horizontal berjalan mulus.
3. **Buka Modal Profil Calon Penghuni**:
   - Klik tombol **[ 👤 Lihat Profil ]** pada kartu pengajuan sewa.
   - Pastikan modal tampil proporsional, rapi, dan modern.
   - Periksa bagian nomor WhatsApp dan email: pastikan teks terbaca utuh 100% tanpa elipsis `...`.
   - Coba tombol **[ Chat WA ]** atau **[ Tanya Calon ]**.
