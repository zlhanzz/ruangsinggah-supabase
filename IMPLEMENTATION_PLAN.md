# Implementation Plan - Laporan Keuangan Bulanan Per Properti di Menu Kost Saya & Penyembunyian Alur Pemasaran 100% Selesai

Dokumen ini merinci rencana integrasi sistem laporan keuangan properti di tab **Kost Saya** (`/dashboard-mitra/properties`) dan penyembunyian otomatis kartu panduan *"Alur Pemasaran Kost Mitra Baru"* ketika seluruh 4 tahapan telah diselesaikan (100%).

---

## 1. Analisis Masalah & Kebutuhan

### Kebutuhan 1: Laporan Keuangan Bulanan Per Properti di "Kost Saya"
- Mitra pemilik kost membutuhkan akses laporan keuangan yang **terkonteks per properti** untuk memantau arus kas masuk dan rincian transaksi per nomor kamar secara transparan.
- Layanan KostManager berfokus pada manajemen inventaris, pencatatan penghuni, penagihan sewa otomatis, pemasaran, dan pelaporan keuangan (tanpa potongan biaya operasional fisik).
- Pos penerimaan yang harus diakumulasikan secara rinci meliputi:
  1. **Sewa Pokok Penghuni Baru** (*New Booking*)
  2. **Perpanjangan Sewa** (*Rent Extension*)
  3. **Biaya Tambahan Penghuni** (*Extra Occupants / Orang Ke-2*)
  4. **Biaya Fasilitas Tambahan** (*Add-on Facilities / Parkir / Listrik / Alat Elektronik*)
  5. **Denda Keterlambatan / Kompensasi Pembatalan** (*Late Fees / Penalty*)
  6. **Catatan Deposit / Uang Jaminan Aktif** (*Security Deposit Reference*)

### Kebutuhan 2: Penyembunyian Alur Pemasaran 4/4 Langkah Selesai (100%)
- Jika mitra telah menyelesaikan seluruh 4 tahapan (Verifikasi KTP, Upload Properti, Listing Tayang, dan Kesiapan Penerimaan Sewa), kartu dan banner alur pemasaran pemula **otomatis tidak ditampilkan lagi** di Beranda Dashboard (`return null`).

---

## 2. Dampak Perubahan File

| File | Bagian yang Dimodifikasi |
|---|---|
| `functions/public/pages/MitraDashboard.tsx` | 1. **Penyembunyian Alur Pemasaran**: Evaluasi `allStepsDone = completedStepsCount === 4` $\rightarrow$ `return null`.<br>2. **State & Modal Laporan Keuangan**: Menambahkan state `selectedKostForFinance` dan `selectedFinanceMonth`/`Year`.<br>3. **Tombol di Kartu Properti**: Menambahkan tombol aksi `"📄 Laporan Keuangan"` pada setiap kartu properti di tab `properties` (*Kost Saya*).<br>4. **Modal Laporan Keuangan Bulanan**: Menyajikan header filter bulan/tahun, ringkasan okupansi, tabel rincian transaksi per kamar (sewa baru, perpanjangan, fasilitas, ekstra orang), akumulasi total omset bersih (100% diterima mitra), tombol *Cetak/Unduh PDF Laporan*, dan tombol *Bagikan Ringkasan ke WhatsApp*. |
| `functions/PROGRESS.md` | Pencatatan riwayat progres 327 (Fase 2). |
| `WALKTHROUGH.md` | Dokumentasi verifikasi dan panduan pengujian (Fase 2). |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

1. **Penyembunyian Alur Pemasaran 100% Selesai**:
   - Menghitung `const allStepsDone = completedStepsCount === 4;`.
   - Mengubah kondisi: jika `allStepsDone || tourCompleted`, kembalikan `null`.
   - Sinkronisasi otomatis `localStorage.setItem('mitra_tour_completed_${uid}', 'true')`.

2. **Penambahan State Laporan Keuangan Properti**:
   - `const [selectedKostForFinance, setSelectedKostForFinance] = useState<Kost | null>(null);`
   - `const [financeMonth, setFinanceMonth] = useState<number>(new Date().getMonth());`
   - `const [financeYear, setFinanceYear] = useState<number>(new Date().getFullYear());`

3. **Penempatan Tombol Aksi di Kartu Properti ("Kost Saya")**:
   - Menambahkan tombol `"📄 Laporan Keuangan"` pada bagian aksi kartu properti.

4. **Pembuatan Modal Laporan Keuangan Properti**:
   - **Header & Filter**: Filter periode bulan & tahun.
   - **Kartu Metrik Cepat**: Total Omset Bulan Terpilih, Okupansi Kamar, dan Total Transaksi.
   - **Tabel Rincian Transaksi**: Nomor Kamar, Nama Penghuni, Tipe Transaksi (Booking Baru / Perpanjangan / Fasilitas / Ekstra Orang), Tanggal Lunas, dan Nominal.
   - **Ringkasan Arus Kas Masuk**: Rincian sewa pokok, biaya ekstra, biaya admin Rp 0, dan total saldo bersih 100% diterima mitra.
   - **Aksi Cetak / PDF & WA**: Tombol `window.print()` / unduh dokumen formal berkop resmi dan tombol salin/buka ringkasan ke WhatsApp.

5. **Uji Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi.

6. **Pencatatan Riwayat & Git Push**:
   - Mencatat Progres 327 di `functions/PROGRESS.md` dan memperbarui `WALKTHROUGH.md`.
   - Melakukan git commit dan push ke remote branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**: Memastikan kompilasi Vite dan TypeScript 100% bersih tanpa error.
2. **Uji Alur Pemasaran**: Memastikan akun mitra yang sudah menyelesaikan 4 tahapan tidak lagi melihat kartu/banner alur pemasaran di dashboard.
3. **Uji Modal Laporan Keuangan di "Kost Saya"**:
   - Buka menu *Kost Saya* $\rightarrow$ klik tombol *"Laporan Keuangan"* pada salah satu kost.
   - Periksa pergantian filter bulan & tahun.
   - Periksa kalkulasi otomatis sewa baru, perpanjangan, biaya fasilitas, dan ekstra orang per kamar.
   - Uji tombol cetak/unduh laporan dan tombol ringkasan WhatsApp.
