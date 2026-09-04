# Walkthrough: Peningkatan Sistem Rekening & Pengajuan Penarikan Dana Mitra Standar E-Commerce Profesional (Progres 325)

Dokumen ini merangkum penyempurnaan sistem rekening bank dan pengajuan penarikan dana (*Withdrawal System*) di Dashboard Mitra (`MitraDashboard.tsx`) agar setara dengan standar aplikasi e-commerce terkemuka seperti TikTok Shop dan Shopee Seller.

---

## 📋 Ringkasan Perubahan

### 1. Quick Select Bank / E-Wallet & Form Rekening Profesional (`POPULAR_BANKS`, `INDONESIAN_BANKS`)
- **Pilihan Cepat Populer**: Menambahkan daftar bank & e-wallet terpopuler (BCA, Mandiri, BRI, BNI, BSI, CIMB Niaga, Permata, Danamon, GoPay, OVO, DANA, ShopeePay) dalam bentuk kartu grid interaktif dengan lencana institusi.
- **Daftar Lengkap Bank**: Dropdown fallback yang memuat seluruh bank resmi di Indonesia.
- **Validasi Input**: Pembersihan otomatis karakter pada input nomor rekening (`numeric inputMode`) dan kapitalisasi otomatis nama pemilik rekening.
- **Pemberitahuan Keamanan**: Banner panduan penyesuaian nama pemilik rekening dengan identitas KTP untuk mencegah penolakan transfer otomatis.

### 2. Kartu Rekening Bank & Saldo Elegan di Tab Dompet
- **Kartu Bank Virtual**: Desain kartu rekening bergradien gelap modern yang menampilkan lencana *"Terverifikasi & Aktif"*, nama bank, nomor rekening tersamarkan (*masked* `•••• 5678`) lengkap dengan tombol toggle *"Lihat / Sembunyikan"* (`Eye` / `EyeOff`), serta tombol *"Ubah Rekening"*.
- **Kartu Saldo Tersedia**: Menampilkan saldo sewa yang siap ditarik dengan tombol aksi *"Tarik Saldo"*.

### 3. Modal Penarikan Dana FinTech Fleksibel (`showWithdrawConfirm`)
- **Penarikan Nominal Kustom & Tarik Semua**: Mitra dapat menarik sebagian saldo atau menekan tombol *"Tarik Semua"*.
- **Input Rupiah Otomatis**: Input angka otomatis terformat separator ribuan rupiah (*live currency format*).
- **Chip Nominal Cepat**: Pilihan nominal instan (Rp 50rb, Rp 100rb, Rp 500rb, Rp 1 Juta) dengan proteksi penonaktifan jika nominal melebihi saldo tersedia.
- **Rincian Ringkasan Transaksi**: Rincian jumlah penarikan, biaya admin (Rp 0 / Bebas Biaya), total diterima, serta estimasi waktu proses (Maksimal 1x24 Jam Kerja).

### 4. Modal Rincian Tanda Terima Penarikan Dana (`selectedWithdrawalDetail`)
- Riwayat penarikan dana (`OUT`) dapat diklik untuk membuka modal tanda terima penarikan (*Withdrawal Receipt Details*) yang memuat ID transaksi, status pengajuan (Diproses/Selesai/Ditolak), waktu pengajuan, detail bank tujuan, nomor rekening, nama penerima, dan biaya admin.
- Seluruh icon menggunakan Pure Bundled Vector SVG `lucide-react` (`Receipt`, `Building2`, `Landmark`, `ShieldCheck`, `ArrowDownRight`, `ArrowUpRight`, `Wallet`, `Check`, `Clock`, dll.) menjamin performa instan tanpa FOUT.

---

## 🔍 Detail File yang Disentuh

| File | Deskripsi Perubahan |
|---|---|
| `functions/public/pages/MitraDashboard.tsx` | Implementasi selector bank populer, kartu rekening virtual, form rekening terintegrasi, modal penarikan kustom, dan modal tanda terima rincian transaksi |
| `functions/PROGRESS.md` | Pencatatan riwayat progres 325 |
| `WALKTHROUGH.md` | Dokumentasi walkthrough pengujian dan implementasi fitur |

---

## 🧪 Hasil Verifikasi Kompilasi

Kompilasi build Vite frontend berhasil dilakukan dengan **0 error**:

```bash
> vite build && node -e "const fs=require('fs'); fs.cpSync('../../public', './dist', {recursive: true, force: true});"

vite v6.4.1 building for production...
transforming...
✓ 2509 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 50.13s
```

---

## 📱 Panduan Pengujian Mitra

1. Masuk ke **Dashboard Mitra** $\rightarrow$ buka tab **Dompet**.
2. **Atur Rekening**:
   - Jika belum ada rekening tersimpan, klik tombol **"Atur Rekening Penarikan"**.
   - Pilih salah satu bank populer (misal: BCA, Mandiri, BRI, atau GoPay) dengan 1 klik, lalu masukkan nomor rekening dan nama lengkap.
   - Klik **"Simpan Rekening"**. Kartu rekening akan tampil rapi dengan opsi toggle sensor nomor rekening.
3. **Uji Tarik Dana**:
   - Klik tombol **"Tarik Saldo"** pada kartu Saldo Tersedia.
   - Masukkan nominal kustom atau klik chip nominal (misal: 100rb atau "Tarik Semua").
   - Periksa ringkasan biaya admin (Rp 0) dan estimasi pencairan (1x24 jam kerja).
   - Klik **"Konfirmasi Tarik Dana"**.
4. **Lihat Rincian Tanda Terima**:
   - Pada tabel **Riwayat Transaksi**, klik salah satu baris penarikan dana (dengan lencana *Diproses* / *Selesai*).
   - Modal **Rincian Penarikan Dana** akan terbuka menampilkan tanda terima digital lengkap.
