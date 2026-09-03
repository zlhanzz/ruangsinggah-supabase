# WALKTHROUGH: Penerapan Portal Pemilihan Akses Masuk (Pencari Kost vs Pemilik Kost)

## 1. Ringkasan Pekerjaan
Telah berhasil diimplementasikan **Portal Pemilihan Akses Masuk & Daftar** pada [`Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx) menggantikan sistem toggle chip lama:

1. **Layar Gerbang Pemilihan Peran (Role Selection Portal)**:
   - **Badge**: `[ 🟠 PORTAL AKSES MASUK & DAFTAR ]` dengan animasi pulse.
   - **Judul**: `Pilih Akses Masuk Anda di RuangSinggah` dan subtitle informatif.
   - **Kartu Pencari Kost (Oranye)**:
     - Ikon `Compass` berbingkai squircle oranye.
     - Tag: `[ PENCARI HUNIAN KOST ]`.
     - Deskripsi pencarian, perbandingan fasilitas, dan sewa kamar nyaman.
     - Checklist: *Akses 1.200+ database kost terverifikasi*, *Layanan Jasa Survey Lapangan langsung*, *Booking aman & transparansi biaya sewa*.
     - Tombol Aksi: `Lanjutkan sebagai Pencari →`.
   - **Kartu Pemilik Kost (Biru/Indigo)**:
     - Ikon `Building2` berbingkai squircle indigo.
     - Tag: `[ MITRA & PENGELOLA ]`.
     - Deskripsi kelola kamar, inventaris properti, pantau okupansi, dan pemasaran kamar.
     - Checklist: *Pasang listing & promosi properti gratis*, *Sistem KostManager & verifikasi survey*, *Rekap laporan sewa & dompet penghasilan*.
     - Tombol Aksi: `Lanjutkan sebagai Pemilik →`.

2. **Pembaruan Formulir Masuk / Daftar**:
   - Menghapus sistem *segmented toggle chip* lama dari form login.
   - Menambahkan header informasi peran aktif (`Pencari Kost` / `Pemilik / Mitra Kost`) dengan tombol **`← Ganti Peran`** (`RotateCcw`) untuk kembali ke portal pemilihan peran.
   - Mempertahankan 100% fungsionalitas email/password, Google OAuth, OTP WhatsApp untuk pemilik kost, recovery/reset password, dan modal upgrade akun.

---

## 2. Rincian Perubahan Berkas

### [`Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx)
- Menambahkan state `isRoleSelected` untuk mengontrol transisi antara portal pilihan peran dan formulir login/daftar.
- Menggantikan ikon lama di `PasswordInput` dengan komponen pure vector SVG dari `lucide-react` (`Eye` & `EyeOff`).
- Menyajikan layar portal 2 kartu interaktif ketika `!isRoleSelected`.
- Menyajikan header status peran aktif dan tombol `Ganti Peran` di dalam form login ketika `isRoleSelected`.

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 29.42s
Exit code: 0 (0 error)
```

---

## 4. Panduan Verifikasi Pengguna
1. Buka menu **Login / Masuk** (`/login`) di browser tanpa query params:
   - Muncul layar portal pemilihan peran dengan 2 kartu: **Pencari Kost** dan **Pemilik Kost**.
2. Klik **Lanjutkan sebagai Pencari**:
   - Anda masuk ke form login/daftar Pencari Kost.
   - Perhatikan bahwa chip switcher yang membingungkan sudah tidak ada.
   - Terdapat tombol `Ganti Peran` di bagian atas formulir.
3. Klik **Ganti Peran**:
   - Layar kembali ke portal pemilihan peran.
4. Klik **Lanjutkan sebagai Pemilik**:
   - Anda masuk ke form login/daftar Pemilik Kost lengkap dengan alur verifikasi nomor WhatsApp dan kode referral agen jika mendaftar baru.
