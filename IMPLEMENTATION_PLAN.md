# IMPLEMENTATION PLAN: Redesain UI/UX Halaman Profil Mode Desktop Presisi Mockup

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Halaman profil (`Profile.tsx`) saat ini menggunakan layout kartu tunggal vertikal lama yang kurang optimal di layar desktop lebar.
  - Terdapat beberapa elemen teks/ikon yang tumpang tindih (*overlapping*), seperti breadcrumb header, badge status administrator, dan tombol aksi bawah.
- **Kebutuhan Desain Baru (Mockup Referensi)**:
  - **Header & Breadcrumbs**:
    - Breadcrumb yang bersih: `/ Pengaturan Akun / Profil {RoleTitle}`.
    - Judul halaman tebal dengan badge role (*Super Admin*, *Pemilik Kost*, *Pencari Kost*, *Agen Survey*).
    - Subjudul deskriptif dan tombol aksi kanan atas (*Kembali ke Beranda* & *Edit Profil*).
  - **Kolom Kiri (Kartu Profil Sticky, `lg:col-span-4`)**:
    - Header cover bergradasi oranye dengan badge `SISTEM UTAMA` / `AKUN AKTIF`.
    - Lingkaran avatar besar (`w-28 h-28`) dengan inisial/foto WebP jernih + badge centang verifikasi.
    - Nama pengguna, icon terverifikasi, email, dan badge pill *Terverifikasi*.
    - Grid 4-box ringkasan meta (*Role Otoritas*, *Status Akun*, *Bergabung*, *Tingkat Akses*).
    - Tombol aksi: `Edit Profil Sekarang` (dark navy) dan `Ganti Kata Sandi` (outlined dengan modal interaktif).
  - **Kolom Kanan (Panel Rincian Data, `lg:col-span-8 space-y-6`)**:
    - **Kartu 1 - Informasi Kontak & Pekerjaan**: Grid 2x2 field (*No. WhatsApp* + badge hijau Aktif, *Pekerjaan*, *Nama Kampus/Tempat Kerja*, *Jenis Kelamin*).
    - **Kartu 2 - Data Kelahiran & Domisili**: Grid 2x2 (*Agama*, *Status Hubungan*, *Tempat Lahir*, *Tanggal Lahir*) + *Alamat Asal / Domisili Lengkap* (full-width).
    - **Kartu 3 (Khusus Agen)**: Panel verifikasi KTP (NIK & Foto KTP) untuk role `survey_agent`.
    - **Kartu 4 - Banner Wewenang & Status Terverifikasi**: Banner informasi elegan dengan badge `Resmi` tanpa teks bertumpuk.
    - **Bottom Action Buttons**: Tombol *Kembali* dan *Edit Profil* / *Simpan Perubahan* & *Batal*.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**: `functions/public/pages/Profile.tsx`.
- **Proteksi Logika**:
  - Mempertahankan seluruh logika state (`formData`, `handleSave`, `handlePhotoUpload`, `handleKtpUpload`, `handleCancel`, `handleDeletePhoto`).
  - Menjaga keutuhan binding database Supabase (`users`, `user_verifications`, Supabase Auth metadata).
  - Seluruh ikon menggunakan komponen SVG murni dari package `lucide-react` (bebas FOUT 100%).

---

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Markup & Styling `Profile.tsx`**:
   - Struktur grid responsif `grid grid-cols-1 lg:grid-cols-12 gap-8`.
   - Implementasi Sidebar Card Kiri lengkap dengan avatar, role badge, meta grid, dan tombol aksi.
   - Implementasi Panel Kanan dengan Card Informasi Kontak & Pekerjaan, Card Data Kelahiran & Domisili, dan Banner Otoritas Sistem.
   - Implementasi Modal Ganti Kata Sandi interaktif (`supabase.auth.updateUser` / `resetPasswordForEmail`).
   - Penyesuaian mode *View* dan *Edit* agar transisi antar mode berjalan mulus.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
2. **Uji Tampilan & Fungsionalitas**:
   - Membuka halaman `/profile` pada resolusi desktop (1280px - 1920px) dan memastikan tata letak 2 kolom rapi, proporsional, dan identik dengan mockup.
   - Menguji mode edit dan penyimpanan data ke Supabase.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md` (Nomor 286), memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
