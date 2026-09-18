# Rencana Implementasi: Sederhanakan Menjadi 2 Menu Inti (Penarikan Saldo & Informasi Pribadi) + Penambahan Menu Pengaturan (`MitraProfile.tsx`)

Dokumen ini merinci rencana revisi menu profil mitra sesuai arahan terbaru pengguna:
1. Menyederhanakan 4 menu sebelumnya menjadi **2 menu inti**: **Penarikan Saldo** dan **Informasi Pribadi**.
2. Menambahkan menu baru: **Pengaturan** (Keamanan Akun & Ganti Kata Sandi).

---

## 1. Analisis Kebutuhan Pengguna

### Latar Belakang & Masukan Pengguna
- Pengguna menginstruksikan:
  > *"cukup 2 menu aja, yaitu penarikan saldo dan juga informasi pribadi. dua itu aja. sama tambah menu pengaturan juga"*
- Dari 4 menu yang sebelumnya terpencar di dua kategori ("Tarik Saldo Kost", "Rekening Penarikan", "Data Profil & Domisili", "Verifikasi Identitas KTP"), dipadatkan menjadi 2 menu inti karena fungsi-fungsinya sudah terintegrasi dalam tampilan yang sama:
  - **Penarikan Saldo**: Menggabungkan akses dompet, penarikan dana sewa, dan pengaturan rekening bank ke dalam 1 tampilan terintegrasi.
  - **Informasi Pribadi**: Menggabungkan data kontak, domisili, dan dokumen verifikasi KTP.
- Ditambahkan menu baru:
  - **Pengaturan**: Menu pengaturan akun & keamanan (ganti kata sandi, link reset kata sandi ke email), mengadopsi arsitektur profil user yang elegan.

---

## 2. Struktur Menu Baru

### Rincian 3 Menu Utama:

#### 1. Menu: **Penarikan Saldo**
- **Ikon**: `<Wallet className="w-5 h-5" />` (aksen oranye `bg-orange-50 text-orange-600`)
- **Judul**: `Penarikan Saldo`
- **Subjudul**: `Pencairan pendapatan sewa, cek dompet & atur rekening bank`
- **Badge Kanan**: Saldo aktif mitra (`availableBalance !== undefined ? FORMAT_CURRENCY(availableBalance) : 'Buka Dompet'`) + ikon `<ChevronRight />`
- **Aksi Klik**: Membuka tab Dompet (`onNavigateMenu('wallet')`), tempat mitra mencairkan saldo sekaligus mengelola rekening bank penarikan.

#### 2. Menu: **Informasi Pribadi**
- **Ikon**: `<UserCheck className="w-5 h-5" />` (aksen emerald `bg-emerald-50 text-emerald-600`)
- **Judul**: `Informasi Pribadi`
- **Subjudul**: `Data kontak pribadi, alamat domisili & verifikasi dokumen KTP`
- **Badge Kanan**: Badge status verifikasi akun secara holistik (`Terverifikasi ✓`, `Sedang Ditinjau`, `Perlu Revisi`, atau `Belum Verifikasi`) + ikon `<ChevronRight />`
- **Aksi Klik**:
  - Jika status `pending`: Alert proteksi bahwa data sedang dalam proses peninjauan tim admin (maks 1x24 jam).
  - Jika status `rejected`: Langsung membuka form langkah perbaikan KTP (`step: '2'`).
  - Selain itu: Membuka form langkah 1 data diri (`step: '1'`).

#### 3. Menu: **Pengaturan** *(Menu Baru)*
- **Ikon**: `<Settings className="w-5 h-5" />` (aksen biru `bg-blue-50 text-blue-600`)
- **Judul**: `Pengaturan`
- **Subjudul**: `Keamanan akun, ganti kata sandi & pengaturan login`
- **Badge Kanan**: Ikon `<ChevronRight />`
- **Aksi Klik**: Membuka modal pop-up **Pengaturan Akun & Keamanan**.

---

## 3. Fitur Modal Pengaturan (Keamanan & Kata Sandi)
Di dalam modal pop-up Pengaturan:
1. **Ganti Kata Sandi**:
   - Form input *Kata Sandi Baru* dan *Konfirmasi Kata Sandi Baru* (dengan toggle lihat/sembunyikan sandi `<Eye />` / `<EyeOff />`).
   - Validasi minimal 6 karakter.
   - Panggilan Supabase Auth `supabase.auth.updateUser({ password: newPassword })`.
2. **Kirim Link Reset Sandi ke Email**:
   - Panggilan `supabase.auth.resetPasswordForEmail(user.email)`.
   - Feedback notifikasi sukses/gagal langsung di dalam modal.
3. Desain modal bergaya rounded modern (`rounded-[2rem]`), responsif, dan ramah mobile dengan tombol tutup `X`.

---

## 4. Dampak File yang Tersentuh

1. **`functions/public/pages/MitraProfile.tsx`**:
   - Menambahkan state modal pengaturan (`isSettingsModalOpen`, `newPassword`, `confirmPassword`, `passwordLoading`, `passwordMessage`, dsb.).
   - Menyederhanakan blok menu keuangan & identitas menjadi 2 menu inti (`Penarikan Saldo` dan `Informasi Pribadi`) + 1 menu `Pengaturan`.
   - Menambahkan render komponen modal dialog Pengaturan Akun & Kata Sandi.
2. **`functions/PROGRESS.md`**:
   - Pencatatan penyelesaian progres nomor #427 setelah user menyetujui.
3. **`WALKTHROUGH.md`**:
   - Laporan pengujian dan dokumentasi visual fitur.

---

## 5. Rencana Verifikasi

- [ ] **Kompilasi Sukses**: `npm run build` di `functions/public` lulus tanpa error (0 error).
- [ ] **Tampilan Menu Baru**: Tampil 3 menu yang rapi: *Penarikan Saldo*, *Informasi Pribadi*, dan *Pengaturan*.
- [ ] **Fungsionalitas Penarikan Saldo**: Mengarahkan ke menu dompet dan menampilkan saldo riil.
- [ ] **Fungsionalitas Informasi Pribadi**: Menampilkan status verifikasi dan membuka pengisian formulir data diri / KTP.
- [ ] **Fungsionalitas Pengaturan**: Mengklik menu Pengaturan berhasil memunculkan modal ganti kata sandi / reset sandi akun mitra.
