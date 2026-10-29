# IMPLEMENTATION PLAN: Perombakan UI/UX Modal Profil Calon Penghuni & Tab Navigasi Pesanan (Dashboard Mitra)

**ID Rencana**: PLAN-MITRA-UI-REDESIGN-002  
**Tanggal Pengajuan**: 29 Oktober 2026  
**Status**: Menunggu Persetujuan Pengguna (Waiting for User Approval)  

---

## 1. Analisis Masalah & Kebutuhan UI/UX

Berdasarkan tinjauan terhadap dua tangkapan layar yang Anda lampirkan:

### A. Temuan Masalah pada Modal Profil Calon Penghuni (`media_1793234740668_0883304f.png`)
1. **Proporsi Header & Avatar Terlalu Raksasa & Kaku**:
   - Header hitam `h-40 bg-gray-900` dengan avatar kotak `w-32 h-32 rounded-[2.5rem]` menggantung canggung dan memakan hampir 50% tinggi layar di perangkat mobile.
   - Corner radius dialog `rounded-[3.5rem]` (56px) dan padding `px-10 pt-20` sangat berlebihan (*childish / exaggerated AI-slop aesthetic*).
2. **Layout Kartu Informasi Memotong Teks Penting (Ellipsis Glitch)**:
   - Tata letak 2 kolom pada layar sempit mobile membatasi lebar tiap kartu hanya ~120px–140px.
   - Akibatnya, data penting seperti Nomor WhatsApp (`+6281527...`) dan Email (`userbiasa1...`) **terpotong elipsis**, sehingga pemilik kost tidak bisa membaca kontak secara utuh.
   - Judul field menggunakan huruf kapital mikro dengan spasi huruf berlebihan (`tracking-widest text-[9px]`) yang sulit dibaca.
3. **Tombol Tutup Seperti Balok Abu-Abu Raksasa**:
   - Tombol `TUTUP DETAIL PROFIL` dibuat dengan tinggi raksasa (`py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em]`), membuang ruang layar tanpa fungsi yang proporsional.

---

### B. Temuan Masalah pada Tab Navigasi Pesanan (`media_1793234757012_c032ee0e.png`)
1. **Teks Label Patah Menjadi 2 Baris (*Ugly Text Wrapping*)**:
   - Label tab menggunakan `flex-1` tanpa `whitespace-nowrap` di dalam kontainer yang sempit, menyebabkan kata patah secara tidak teratur:
     - `TUNGGU` di baris 1 dan `BAYAR` di baris 2.
     - `BATAL /` di baris 1 dan `KADALUARSA 2` di baris 2.
2. **Tipografi All-Caps dengan Tracking Berlebihan**:
   - Penggunaan huruf kapital semua (`UPPERCASE TRACKING-WIDEST`) memakan lebar horizontal secara boros dan membuat teks terdesak.
3. **Visual Active State Canggung**:
   - Tab aktif berupa kotak putih tebal dengan bayangan kaku yang menonjol sendirian di antara tab lain yang terhimpit.

---

## 2. Solusi Desain Standar Industri Proptech (Airbnb / Mamikos)

| Komponen | Kondisi Saat Ini | Standar Proptech Premium (Solusi yang Diterapkan) |
|---|---|---|
| **1. Modal Frame Calon Penghuni** | Kaku, `rounded-[3.5rem]`, padding 40px memboroskan ruang layar. | **Bottom-Sheet / Clean Dialog**: Sudut rounded proporsional (`rounded-3xl`), padding seimbang (`p-5 sm:p-6`), dilengkapi header bersih & tombol `X` elegan. |
| **2. Avatar & Header Profil** | Avatar raksasa `w-32` menggantung di latar hitam pekat. | **Proptech Tenant Card**: Avatar seimbang `w-16 h-16 rounded-2xl`, nama lengkap jelas, badge `Calon Penghuni` & badge verifikasi `✓ Identitas Terverifikasi`. |
| **3. Tampilan Kontak (WA & Email)** | Terjepit di kartu kecil 2 kolom sehingga terpotong elipsis (`+6281527...`). | **Full-Width Contact Row**: Baris kontak horizontal lebar penuh dengan nomor WhatsApp dan email utuh 100%, dilengkapi tombol aksi instan **[ Hubungi WhatsApp ]** dan tombol **[ Salin ]**. |
| **4. Grid Informasi Latar Belakang** | Kartu abu-abu kaku dengan label mikro 9px. | **Clean Info Cards**: Tata letak rapi untuk Pekerjaan, Kampus/Instansi, Jenis Kelamin, dan Status dengan ikon yang bersih dan kontras yang jelas. |
| **5. Tombol Aksi Modal** | Balok abu-abu raksasa `py-6`. | **Dua Tombol Fungsional**: Tombol primer **[ 💬 Tanya Calon via Chat ]** dan tombol sekunder **[ Tutup ]** yang ramping (tinggi 44px standar Apple/Material). |
| **6. Tab Navigasi Pesanan** | Teks patah 2 baris (`TUNGGU \n BAYAR`), kaku, terhimpit. | **Smooth Scrollable Pill Tabs**: Dilengkapi `whitespace-nowrap`, teks Title Case (`Permintaan`, `Tunggu Bayar`, `Selesai`, `Batal / Kadaluarsa`), badge jumlah yang rapi, dan scroll horizontal halus tanpa scrollbar jelek di mobile. |

---

## 3. Dampak Perubahan File

1. **`functions/public/pages/MitraDashboard.tsx`**:
   - **Perombakan Tab Pesanan** (sekitar baris 2270–2292): Menerapkan *smooth scrollable segmented pill bar* dengan `whitespace-nowrap`, Title Case, padding proporsional, dan penataan badge jumlah pesanan.
   - **Perombakan Modal Profil Calon Penghuni** (sekitar baris 3300–3390): Mengganti layout modal lama dengan desain proptech modern:
     - Header dialog yang bersih dengan avatar proporsional (`w-16 h-16`).
     - Baris kontak WhatsApp & Email lebar penuh (anti-elipsis / anti-potong) dengan fitur klik kontak langsung.
     - Grid informasi identitas yang ringkas dan nyaman dibaca.
     - Tombol aksi terintegrasi (Tanya Calon & Tutup).

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

### Tahap 1: Redesain Segmented Pill Tab Navigasi Pesanan
- Mengubah kontainer tab menjadi `flex items-center gap-2 overflow-x-auto no-scrollbar py-1`.
- Menghapus aturan `flex-1` yang memicu pemotongan kata dan menambahkan `whitespace-nowrap shrink-0`.
- Mengganti teks menjadi Title Case:
  - `Permintaan` (badge oranye jika > 0)
  - `Tunggu Bayar` (badge netral)
  - `Selesai` (badge hijau)
  - `Batal / Kadaluarsa` (badge abu-abu)
- Memastikan transisi active/inactive mulus dan bebas glitch di semua ukuran layar (mobile 360px hingga desktop 1920px).

### Tahap 2: Redesain Total Modal Profil Calon Penghuni
- Merestrukturisasi container modal dengan proporsi elegan (`max-w-md w-full rounded-3xl p-6 bg-white shadow-2xl`).
- Membangun Header Profil yang ramping:
  - Avatar `w-16 h-16 rounded-2xl` dengan inisial atau foto riil.
  - Nama calon penghuni, tag `Calon Penghuni`, dan badge `✓ Terverifikasi`.
- Membangun Baris Kontak Anti-Potong:
  - Card WhatsApp: Menampilkan nomor lengkap, tombol quick action hubungi WhatsApp.
  - Card Email: Menampilkan email lengkap tanpa elipsis.
- Membangun Ringkasan Informasi Pribadi (Pekerjaan, Instansi, Gender, Status, Alamat Asal).
- Footer Aksi: Tombol `[ 💬 Kirim Pesan / Tanya Calon ]` dan tombol `[ Tutup ]`.

### Tahap 3: Uji Kompilasi & Build
- Menjalankan `cmd.exe /c "npm --prefix functions/public run build"` (Wajib 0 error).
- Menjalankan `cmd.exe /c "npm --prefix functions run build"` (Wajib 0 error).

### Tahap 4: Pencatatan Anti-Amnesia & Git Push
- Mencatat riwayat ke `functions/PROGRESS.md` (#473).
- Memperbarui `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Tampilan Tab Pesanan**:
   - Buka `/dashboard-mitra/bookings` pada mode responsive mobile (lebar 360px–390px).
   - Pastikan teks tab **TIDAK PERNAH PATAH** menjadi 2 baris.
   - Pastikan tab dapat digeser (*scroll*) dengan mulus tanpa scrollbar kasar.
2. **Uji Modal Profil Calon Penghuni**:
   - Klik tombol `[ 👤 Lihat Profil ]` pada salah satu pengajuan sewa.
   - Pastikan nomor WhatsApp dan email **terbaca utuh tanpa terpotong `...`**.
   - Pastikan ukuran avatar, kartu, dan tombol penutup proporsional, rapi, dan nyaman di mata.
3. **Uji Fungsionalitas**:
   - Pastikan klik tab berpindah filter pesanan dengan benar.
   - Pastikan tombol aksi di dalam modal profil dapat menutup modal dan membuka chat dengan lancar.

---

> [!IMPORTANT]
> **Menunggu Persetujuan Pengguna (ACC)**: Sesuai protokol siklus 2-fase ruang kerja, Agent **BERHENTI** pada tahap ini dan tidak memodifikasi file kode sebelum menerima persetujuan ("ACC" / "Proceed") dari Anda.