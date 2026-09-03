# IMPLEMENTATION PLAN: Penyesuaian UI/UX Halaman Profil Mode Mobile Presisi Mockup Google Stitch

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Tampilan desktop telah disempurnakan menjadi 2-kolom, namun pada viewport mobile (`< lg`) tampilan form dan kartu masih perlu dioptimalkan agar 100% presisi dengan mockup mobile Google Stitch yang diberikan pengguna.
- **Kebutuhan Desain Mobile (Mockup Referensi)**:
  - **1. Card Profil Utama (Mobile Top Card)**:
    - Cover header gradasi oranye `#ff7a00` tinggi proporsional (`h-28`).
    - Avatar lingkaran besar (`w-24 h-24`) dengan badge centang verifikasi oranye di sudut bawah.
    - Nama pengguna (`text-lg font-black`), icon verified checkmark, email pengguna, dan badge pill terverifikasi (`Administrator Terverifikasi` / `Pengguna Terverifikasi`).
  - **2. Banner Administrator / Otoritas Ringkas**:
    - Box oranye berikon shield di kiri (`w-10 h-10`), judul huruf kapital tebal `ADMINISTRATOR TERVERIFIKASI`, dan deskripsi ringkas tanpa teks terpotong.
  - **3. Card Informasi Kontak & Pekerjaan**:
    - Header ber-indikator dot oranye `● INFORMASI KONTAK & PEKERJAAN`.
    - Field vertikal berlatar belakang lembut `#F8FAFC` dengan border halus:
      - `NO. WHATSAPP *` (Ikon telepon/chat hijau + nomor telepon).
      - `PEKERJAAN *` (Nilai teks tebal).
      - `NAMA KAMPUS / TEMPAT KERJA *`.
      - `JENIS KELAMIN *`.
  - **4. Card Identitas & Domisili**:
    - Header ber-indikator dot slate `● IDENTITAS & DOMISILI`.
    - Baris 2-kolom untuk `AGAMA *` dan `STATUS *` (Status Hubungan).
    - Baris full-width untuk `TEMPAT LAHIR`, `TANGGAL LAHIR *`, dan `ALAMAT ASAL *`.
  - **5. Tombol Aksi Mobile Bawah**:
    - Tombol utama dark navy `Edit Profil` (dengan ikon pensil oranye).
    - Tombol sekunder putih dengan border & teks oranye `Kembali`.
    - Spacing bawah `pb-28` agar tidak tertutup oleh Mobile Bottom Navigation Bar.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**: `functions/public/pages/Profile.tsx`.
- **Proteksi Logika**:
  - Mempertahankan seluruh logika state (`formData`, `handleSave`, `handlePhotoUpload`, `handleKtpUpload`, `handleCancel`, `handleDeletePhoto`).
  - Menjaga keselarasan tampilan mode Desktop (2-kolom) dan mode Mobile (stacked card) menggunakan breakpoint Tailwind (`hidden lg:block`, `lg:grid-cols-12`, dll.).
  - Menggunakan ikon vector SVG murni dari `lucide-react` (bebas FOUT 100%).

---

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `Profile.tsx`**:
   - Selaraskan styling komponen pada breakpoint mobile (`< lg`) agar menampilkan:
     - Top Profile Card dengan avatar, nama, email, dan pill terverifikasi.
     - Banner status terverifikasi.
     - Card Informasi Kontak & Pekerjaan dengan dot badge oranye dan input rounded background `#F8FAFC`.
     - Card Identitas & Domisili dengan dot badge slate.
     - Tombol aksi mobile `Edit Profil` (dark navy) dan `Kembali` (white with orange border).
   - Pastikan mode desktop (`lg:`) tetap mempertahankan layout 2-kolom yang sudah rapi.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
2. **Uji Tampilan & Interaksi Mobile**:
   - Membuka halaman `/profile` pada resolusi smartphone (375px - 430px) untuk memastikan desain 100% presisi dengan screenshot mockup mobile.
   - Memastikan pengeditan data dan tombol aksi berfungsi normal.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md` (Nomor 287), memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
