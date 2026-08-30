# Rencana Implementasi: Peningkatan Komprehensif Modal Perpanjangan Sewa pada Menu 'Kost Saya' (`MyKost.tsx`)

Dokumen ini merancang peningkatan informasi dan fitur pada modal **Perpanjang Sewa** agar menyajikan rincian masa sewa saat ini, kalkulasi presisi timeline perpanjangan baru (tanggal mulai bersambung, tanggal selesai baru, dan total skala hari), serta tab riwayat perpanjangan sewa sebelumnya beserta akses kwitansi digital.

---

## 1. Analisis Masalah & Kebutuhan Pengguna

### Kebutuhan Pengguna:
1. **Informasi Masa Sewa Sekarang Kurang Rinci**:
   - Modal saat ini langsung menyajikan pemilih durasi tanpa menampilkan informasi status masa sewa aktif penyewa (unit kamar, tanggal mulai masuk, tanggal berakhir saat ini, dan sisa hari masa tinggal).
2. **Ketiadaan Simulasi Tanggal & Skala Hari Perpanjangan**:
   - Penyewa tidak mengetahui secara pasti: jika memperpanjang $N$ bulan, perpanjangan tersebut **mulai tanggal berapa**, **berakhir tanggal berapa**, dan **berapa total jangka hari sewanya**.
3. **Ketiadaan Akses Riwayat Perpanjangan Sewa Sebelumnya**:
   - Penyewa ingin dapat melihat riwayat transaksi perpanjangan sewa yang pernah dilakukan untuk hunian tersebut beserta status pelunasan dan bukti kwitansi digitalnya.

---

## 2. Solusi yang Direncanakan

Melakukan pembaruan komprehensif pada komponen modal **Perpanjang Sewa** di [`MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx):

### A. Navigasi Tab Internal Modal:
- Menambahkan switcher 2 tab responsif:
  - `[ ➕ FORM PERPANJANGAN ]`: Formulir pengajuan perpanjangan sewa dengan rincian timeline dan biaya.
  - `[ 📜 RIWAYAT PERPANJANGAN (N) ]`: Daftar riwayat perpanjangan dan pembayaran sewa masa lalu.

### B. Kartu Informasi Masa Sewa Saat Ini (Current Lease Card):
- Menampilkan kartu status hunian aktif:
  - **Identitas Unit**: Nama Kost, Tipe Kamar, dan Nomor Unit (`Unit Kamar X`).
  - **Rentang Masa Sewa Berjalan**: Tanggal Mulai Masuk s/d Tanggal Berakhir Saat Ini (format bahasa Indonesia lengkap).
  - **Sisa Hari Masa Tinggal**: Badge sisa hari aktif (`X Hari Tersisa`).

### C. Live Timeline & Skala Hari Perpanjangan Baru:
- Berdasarkan durasi yang dipilih (`extensionPeriod` 1 bulan, 2 bulan, 3 bulan, 6 bulan, 12 bulan):
  - **Tanggal Mulai Perpanjangan**: Tanggal bersambung dari masa sewa saat ini (`selectedKost.endDate`).
  - **Tanggal Selesai Baru**: Tanggal jatuh tempo akhir yang baru setelah ditambah $N$ bulan.
  - **Total Skala Hari**: Jumlah total hari tambahan yang dihitung secara presisi dari selisih tanggal (misal: `31 Hari (1 Bulan)` / `92 Hari (3 Bulan)` / `365 Hari (1 Tahun)`).
  - **Visual Timeline Bar**: Indikator alur perpanjangan bersambung (*Seamless Continuity*).

### D. Tab Riwayat Perpanjangan Sewa Sebelumnya:
- Menampilkan daftar seluruh transaksi pembayaran sewa / perpanjangan hunian yang telah lunas (`PAID` / `SETTLED`).
- Setiap riwayat memuat:
  - Nama periode tagihan / invoice (misal: `Sewa Kost Oktober 2026 (1 Bulan)`).
  - Tanggal pembayaran lunas & metode bayar.
  - Total nominal pembayaran.
  - Badge status hijau `Lunas & Terverifikasi`.
  - Tombol **"🧾 Lihat Kwitansi"** yang terhubung langsung ke `DigitalReceiptModal` resmi berstempel PT RUANG SINGGAH NUSANTARA.
- Jika belum pernah melakukan perpanjangan (masih periode awal sewa), disajikan empty state yang informatif.

---

## 3. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Mengupgrade modal Perpanjangan Sewa dengan kartu status masa sewa aktif, kalkulator live timeline tanggal & jangka hari baru, switcher tab riwayat, dan integrasi kwitansi perpanjangan lampau. |
| 2 | `functions/PROGRESS.md` | Pencatatan riwayat penambahan fitur (Anti-Amnesia). |
| 3 | `WALKTHROUGH.md` | Penerbitan dokumentasi walkthrough hasil pengujian. |

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Langkah 1: Tambahkan State Navigasi Tab pada Modal Perpanjangan di `MyKost.tsx`**
   - Menambahkan state `extensionActiveTab: 'form' | 'history'` (default `'form'`).
2. **Langkah 2: Susun Kartu Status Masa Sewa Saat Ini & Kalkulator Timeline Realtime**
   - Membuat helper perhitungan tanggal bersambung: `calculateExtensionTimeline(endDate, extensionPeriod)`.
   - Mengembalikan `startDateFormatted`, `endDateFormatted`, dan `totalDays`.
   - Menyajikan tampilan timeline yang elegan dengan icon vector SVG `lucide-react` (`Calendar`, `Clock`, `ArrowRight`, `ShieldCheck`).
3. **Langkah 3: Bangun Tab Riwayat Perpanjangan Sewa & Integrasi Kwitansi Digital**
   - Memfilter transaksi sewa lunas dari `selectedKost.pendingBills` / riwayat transaksi kost terkait.
   - Menghubungkan tombol "Lihat Kwitansi" ke `setSelectedReceipt` dan `setShowDigitalReceiptModal(true)`.
4. **Langkah 4: Uji Kompilasi & Build**
   - Menjalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 0 error kompilasi.
5. **Langkah 5: Dokumentasi & Git Push**
   - Mencatat progres ke `functions/PROGRESS.md` dan membuat `WALKTHROUGH.md`.
   - Melakukan `git commit` dan `git push` ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- **Verifikasi Status Masa Sewa Saat Ini**:
  - Memastikan tanggal mulai masuk, tanggal berakhir saat ini, dan sisa hari tampil jelas pada modal perpanjangan.
- **Verifikasi Kalkulasi Timeline Perpanjangan Baru**:
  - Saat mengubah durasi (misal 1 bulan -> 3 bulan), tanggal mulai, tanggal selesai baru, dan total jumlah hari (+92 Hari) ter-update secara instan dan akurat.
- **Verifikasi Tab Riwayat Perpanjangan**:
  - Saat tab "Riwayat Perpanjangan" diklik, riwayat transaksi sewa masa lalu muncul lengkap dengan rincian biaya, tanggal lunas, dan tombol kwitansi digital yang dapat dibuka.
- **Verifikasi Build**: `npm run build` lulus 100% dengan 0 error.
