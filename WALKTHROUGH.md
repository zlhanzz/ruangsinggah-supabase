# WALKTHROUGH: Redesain UI/UX Halaman Profil Mode Desktop Presisi Mockup Google Stitch

## 1. Ringkasan Pekerjaan
Telah berhasil diselesaikan perombakan antarmuka **Halaman Profil Mode Desktop** (**`Profile.tsx`**) sesuai dengan desain referensi Google Stitch:
- **Header & Breadcrumb Bersih**:
  - Breadcrumb rapi: `/ Pengaturan Akun / Profil Administrator` (atau *Profil Pemilik*, *Profil Agen*, *Profil Pengguna* sesuai role).
  - Judul tebal ber-badge role (*Super Admin*, *Mitra Pemilik*, *Pencari Kost*), deskripsi wewenang, dan tombol navigasi atas (*Kembali ke Beranda* & *Edit Profil*).
- **Sidebar Card Kiri Sticky (`lg:col-span-4`)**:
  - Header cover gradasi oranye `#ff7a00` dengan badge status `SISTEM UTAMA` / `AKUN AKTIF`.
  - Lingkaran avatar besar (`w-28 h-28`) dengan inisial/foto WebP dan badge centang verifikasi oranye.
  - Identitas pengguna, email, dan badge pill *Terverifikasi*.
  - Grid 4-box ringkasan meta (*Role Otoritas*, *Status Akun*, *Bergabung*, *Tingkat Akses*).
  - Tombol aksi: `Edit Profil Sekarang` (dark navy) dan `Ganti Kata Sandi` (outlined dengan modal interaktif).
- **Panel Rincian Data Kanan (`lg:col-span-8`)**:
  - **Kartu 1 - Informasi Kontak & Pekerjaan**: Grid 2x2 (*WhatsApp* dengan badge hijau Aktif, *Pekerjaan*, *Nama Kampus/Tempat Kerja*, *Jenis Kelamin*).
  - **Kartu 2 - Data Kelahiran & Domisili**: Grid 2x2 (*Agama*, *Status Hubungan*, *Tempat Lahir*, *Tanggal Lahir*) + *Alamat Asal / Domisili Lengkap* (full-width).
  - **Kartu Khusus Agen**: Panel upload dan verifikasi KTP (NIK + Foto KTP) untuk role `survey_agent`.
  - **Kartu 3 - Banner Status Administrator/Otoritas**: Banner informatif berikon shield tebal dengan badge `Resmi` tanpa teks tumpang tindih.
  - **Bottom Action Buttons**: Tombol *Kembali* dan *Edit Profil* / *Simpan Perubahan* & *Batal*.
- **Modal Ganti Kata Sandi**:
  - Fitur ubah kata sandi langsung atau kirim link reset ke email via Supabase Auth.

---

## 2. Rincian Perubahan Berkas

### A. [`Profile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx)
- Menata ulang layout menjadi grid 2-kolom responsif `grid grid-cols-1 lg:grid-cols-12 gap-8`.
- Memperbaiki seluruh issue overlapping teks dan badge.
- Menambahkan modal ganti kata sandi interaktif.
- Menggunakan ikon vector SVG murni dari package `lucide-react`.

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 1m 1s
Exit code: 0 (0 error)
```

---

## 4. Panduan Pengujian

1. **Buka Halaman Profil Desktop (`/profile`)**:
   - Tinjau layout 2 kolom: Sidebar Profil di sebelah kiri dan Panel Rincian Data di sebelah kanan.
   - Pastikan tidak ada teks yang bertumpuk pada judul, breadcrumb, maupun banner status.
   - Klik tombol **Edit Profil** untuk menguji perubahan data nama, nomor WhatsApp, pekerjaan, instansi, alamat, dll.
   - Klik tombol **Ganti Kata Sandi** untuk menguji modal pembaruan kata sandi akun.
