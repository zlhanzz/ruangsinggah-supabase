# IMPLEMENTATION PLAN - Perbaikan Layout Dompet/Wallet (Responsive Overflow)

Rencana ini dibuat untuk memperbaiki masalah di mana menu Dompet/Saldo tidak pas (fit) dengan lebar layar dan melimpah (overflow) ke kanan pada perangkat mobile/layar kecil.

## 1. Analisis Masalah
- **Penyebab Layout Melar (Horizontal Overflow)**:
  - Pada daftar transaksi (`allTransactions`), properti `tx.title` sering kali memuat string URL peta yang sangat panjang tanpa spasi (misalnya: `https://maps.app.goo.gl/...`).
  - Karena flexbox secara default tidak memotong kata panjang (`word-break`), string URL ini melebarkan container secara horizontal dan mendorong kolom nominal transaksi keluar dari layar.
  - Selain itu, tombol tab navigasi Dompet ("DOMPET", "RIWAYAT WD", "REKENING") menggunakan ukuran font `text-xs` dengan `tracking-widest` (letter-spacing lebar) yang melebihi kapasitas lebar layar ponsel kecil, sehingga teks "REKENING" terpotong.
- **Solusi**:
  - Terapkan `min-w-0` pada container judul transaksi dan tambahkan kelas `truncate` atau `break-all` pada elemen teks `tx.title` agar URL panjang terpotong rapi dengan elipsis (`...`).
  - Ubah spesifikasi teks tab tombol agar menggunakan `text-[10px] sm:text-xs` dan `tracking-wider` agar muat di semua layar ponsel pintar.

## 2. Dampak Perubahan
File yang akan disentuh:
1. `functions/public/pages/AgentDashboard.tsx` (Update rendering tab header dan layout row transaksi pada `renderWallet`).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `AgentDashboard.tsx`**:
   - Di tab navigasi dompet, ubah `text-xs tracking-widest` menjadi `text-[10px] sm:text-xs tracking-wider`.
   - Di loop rendering `allTransactions`, bungkus teks info dengan wrapper `min-w-0` dan tambahkan `truncate` ke tag judul agar tidak melebar.
2. **Verifikasi & Build**:
   - Jalankan `npm run build` untuk memvalidasi keberhasilan kompilasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil tanpa kesalahan kompilasi.
- Buka menu Dompet pada mode responsif (ponsel pintar) dan pastikan seluruh elemen (tab navigasi, banner kuning, dan daftar transaksi) muat pas dalam lebar layar dengan rapi tanpa scroll horizontal.
