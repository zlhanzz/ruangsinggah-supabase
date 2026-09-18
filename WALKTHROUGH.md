# WALKTHROUGH - RuangSinggah Development

## Ringkasan Progres Terbaru

### Progres #427: Konsolidasi Menu Profil Mitra Menjadi Penarikan Saldo, Informasi Pribadi & Penambahan Menu Pengaturan (`MitraProfile.tsx`)

---

## 1. Daftar Perubahan yang Dilakukan

1. **Konsolidasi Menu Keuangan Menjadi `Penarikan Saldo`**:
   - Menghapus pemisahan tombol "Tarik Saldo Kost (Cek Dompet)" dan "Rekening Penarikan".
   - Menggabungkannya menjadi satu tombol terpadu **`Penarikan Saldo`** dengan:
     - Ikon oranye: `<Wallet className="w-5 h-5" />`
     - Label: `Penarikan Saldo`
     - Subjudul: *Pencairan pendapatan sewa, cek dompet & atur rekening bank*
     - Badge Saldo: Menampilkan saldo aktif real-time (contoh: `Rp 0`) dan `<ChevronRight />`
     - Aksi: Mengarahkan langsung ke tab/halaman dompet (`onNavigateMenu('wallet')`), tempat mitra dapat mengajukan penarikan saldo dan mengelola rekening bank penarikan dalam satu tampilan.

2. **Konsolidasi Menu Identitas Menjadi `Informasi Pribadi`**:
   - Menghapus pemisahan tombol "Data Profil & Domisili" dan "Verifikasi Identitas (KTP)".
   - Menggabungkannya menjadi satu tombol terpadu **`Informasi Pribadi`** dengan:
     - Ikon hijau: `<UserCheck className="w-5 h-5" />`
     - Label: `Informasi Pribadi`
     - Subjudul: *Data kontak pribadi, domisili & verifikasi dokumen KTP*
     - Badge Verifikasi: Menampilkan status validasi identitas secara holistik (`Terverifikasi ✓`, `Sedang Ditinjau`, `Perlu Revisi`, atau `Belum Verifikasi`)
     - Proteksi & Aksi Cerdas:
       - Jika status `pending`: Menampilkan notifikasi bahwa data sedang dalam peninjauan admin sehingga terkunci aman sementara.
       - Jika status `rejected`: Membuka formulir langsung ke langkah 2 perbaikan dokumen KTP.
       - Selain itu: Membuka formulir langkah 1 data diri.

3. **Penambahan Menu & Modal Dialog `Pengaturan`**:
   - Menambahkan menu **`Pengaturan`** dengan ikon biru `<Settings className="w-5 h-5" />` dan subjudul *Keamanan akun, ganti kata sandi & pengaturan login*.
   - Membuat modal pop-up modern ramah mobile (`rounded-[2rem]`, backdrop blur) yang memuat:
     - Informasi email akun mitra yang sedang aktif terhubung.
     - Formulir pembaruan kata sandi (*Kata Sandi Baru* dan *Konfirmasi Kata Sandi*) dengan validasi minimal 6 karakter dan toggle intip sandi (`<Eye />` / `<EyeOff />`).
     - Tombol eksekusi ganti kata sandi langsung terhubung ke Supabase Auth (`supabase.auth.updateUser`).
     - Tombol pengiriman tautan reset kata sandi ke email terdaftar mitra (`supabase.auth.resetPasswordForEmail`).
     - Indikator pesan alert sukses/gagal yang responsif.

4. **Kepatuhan UI/UX & Standar Bebas FOUT**:
   - 100% menggunakan pure bundled vector SVG dari `lucide-react`.

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
✓ built in 35.01s
```
- **Exit Code**: `0` (Sukses tanpa error TypeScript maupun JSX bundling).

---

## 3. Panduan Pengujian bagi Pengguna

1. Buka dashboard mitra dan arahkan ke menu/tab **Profil**.
2. Perhatikan kelompok menu utama di bawah kartu profil:
   - Kini hanya terdapat 3 menu terpadu dalam satu wadah card yang rapi dan elegan:
     1. **Penarikan Saldo** (menampilkan badge nominal saldo sewa Anda).
     2. **Informasi Pribadi** (menampilkan badge status verifikasi identitas Anda).
     3. **Pengaturan** (ikon settings biru).
3. Uji coba klik menu **Penarikan Saldo**:
   - Anda akan langsung diarahkan ke tampilan Dompet, di mana Anda bisa mencairkan saldo sekaligus mengatur rekening bank.
4. Uji coba klik menu **Informasi Pribadi**:
   - Jika akun Anda berstatus dalam peninjauan (`pending`), sistem akan memberi tahu bahwa data terkunci aman.
   - Jika belum terverifikasi atau perlu revisi, modal pengisian data profil/KTP akan terbuka.
5. Uji coba klik menu **Pengaturan**:
   - Modal pop-up pengaturan akun & keamanan akan muncul.
   - Anda dapat mengganti kata sandi baru atau mengirimkan tautan reset password ke alamat email Anda.
