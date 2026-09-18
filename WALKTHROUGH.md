# WALKTHROUGH - RuangSinggah Development

## Ringkasan Progres Terbaru

### Progres #428: Penguatan Keamanan Ganti Kata Sandi Berbasis Verifikasi Email OTP (`emailService.ts`, `MitraProfile.tsx`, & `Profile.tsx`)

---

## 1. Daftar Perubahan yang Dilakukan

1. **Pembuatan Helper Service Pengiriman OTP Email (`emailService.ts`)**:
   - Menambahkan fungsi `sendPasswordChangeOtp(email: string, otp: string, name?: string)`.
   - Mengirimkan email verifikasi resmi dengan subjek `[RuangSinggah.id] Kode Keamanan Verifikasi Ganti Kata Sandi`.
   - Memuat 6 digit kode OTP, masa berlaku 10 menit, dan catatan peringatan keamanan akun.

2. **Peningkatan Keamanan pada Modal Pengaturan Mitra (`MitraProfile.tsx`)**:
   - Menambahkan card verifikasi email pemilik di dalam modal Pengaturan Akun:
     - Tombol **"Kirim Kode Verifikasi ke Email"** dengan state loading dan cooldown countdown 60 detik (*rate limiting*).
     - Menampilkan indikator status *Terkirim* ketika kode OTP telah berhasil dikirim.
     - Input khusus **KODE VERIFIKASI EMAIL (6 DIGIT)** di posisi tengah dengan format monospace tebal.
   - Mengunci eksekusi tombol **"Verifikasi & Simpan Kata Sandi"** hingga 6 digit kode OTP dimasukkan.
   - Validasi ketat di sisi logika:
     - Jika OTP salah: memunculkan pesan peringatan bahwa kode tidak cocok.
     - Jika OTP kedaluwarsa (> 10 menit): memunculkan peringatan kedaluwarsa.
     - Hanya jika OTP valid barulah `supabase.auth.updateUser` dipanggil.

3. **Penyelarasan Keamanan pada Modal Profil User (`Profile.tsx`)**:
   - Menggantikan form ganti kata sandi lama di modal user agar menggunakan alur Two-Factor Email OTP yang sama persis.
   - Melindungi akun pencari kost dari celah pengambilalihan akun (*account takeover*).

4. **Kepatuhan UI/UX & Standar Bebas FOUT**:
   - 100% menggunakan pure bundled vector SVG dari `lucide-react` (`ShieldCheck`, `Lock`, `Mail`, `RefreshCw`, `Clock`, `Check`, `CheckCircle2`, `AlertCircle`, `Eye`, `EyeOff`, `X`).

---

## 2. Hasil Pengujian & Kompilasi

Perintah build frontend Vite dijalankan pada direktori `functions/public`:
```bash
cmd.exe /c npm run build
```

**Hasil Terminal**:
```text
> ruangsinggah.id@0.0.0 build
> vite build && node -e "const fs=require('fs'); if (fs.existsSync('./dist')) fs.rmSync('./dist', {recursive: true, force: true}); fs.cpSync('../../public', './dist', {recursive: true, force: true});"

vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 34.95s
```
- **Exit Code**: `0` (Sukses tanpa error TypeScript maupun JSX bundling).

---

## 3. Panduan Pengujian bagi Pengguna

### A. Pengujian pada Profil Mitra:
1. Buka dashboard mitra $\rightarrow$ pilih menu/tab **Profil**.
2. Klik menu **Pengaturan** (ikon settings biru).
3. Di dalam modal dialog:
   - Perhatikan kotak peringatan verifikasi email pemilik.
   - Klik tombol **Kirim Kode Verifikasi ke Email**.
   - Cek kotak masuk email Anda untuk melihat 6 digit kode OTP.
   - Masukkan 6 digit kode OTP, Kata Sandi Baru, dan Konfirmasi Kata Sandi Baru.
   - Klik **Verifikasi & Simpan Kata Sandi**.
   - Sistem akan memvalidasi OTP dan memperbarui kata sandi secara aman.

### B. Pengujian pada Profil User (Pencari Kost):
1. Buka menu **Profil** user biasa.
2. Di bagian Pengaturan Akun & Keamanan, klik **Keamanan & Kata Sandi**.
3. Lakukan langkah yang sama: minta kode OTP email, masukkan OTP, dan perbarui kata sandi dengan aman.
