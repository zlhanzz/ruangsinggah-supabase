# WALKTHROUGH - Potongan 30% Jasa Survey untuk Pembeli Database Kost

Dokumen ini menjelaskan daftar perubahan, hasil pengujian, dan petunjuk deployment untuk fitur diskon khusus Jasa Survey bagi pengguna yang memiliki riwayat pembelian database kost.

## 1. Daftar Perubahan Secara Mendetail

### A. Integrasi Pengecekan Riwayat Transaksi (`functions/public/pages/SurveyCheckout.tsx`)
* Mengimpor `getUserTransactions` dari `../userService` dan `useMemo` dari `'react'`.
* Menambahkan state `hasBoughtDatabase` (boolean) untuk menyimpan apakah pengguna saat ini berhak mendapatkan potongan harga.
* Membuat `useEffect` yang terhubung ke objek `user`. Jika pengguna sudah login, riwayat transaksinya akan diambil menggunakan `getUserTransactions(uid)`.
* Sistem memindai riwayat transaksi tersebut untuk mencari baris pembelian berstatus `'PAID'` (atau `'paid'`) dengan tipe produk `'database'`. Jika ada, `hasBoughtDatabase` diset ke `true`.

### B. Perhitungan Harga Dinamis dengan Diskon 30% (`functions/public/pages/SurveyCheckout.tsx`)
* Memodifikasi `totalPrice` menggunakan hook `useMemo` dengan formula pencarian dinamis (reducer):
  * Jika pengguna terverifikasi telah membeli database (`hasBoughtDatabase === true`) dan unit kost yang diinput memiliki Sumber Info `'database'` (`source === 'database'`), maka unit tersebut diberi potongan 30% (dihitung sebesar `unitPrice * 0.7`).
  * Jika tidak memenuhi syarat di atas, harga dihitung normal (`unitPrice`).

### C. Pembaruan Visual Interface & Edukasi Pengguna (`functions/public/pages/SurveyCheckout.tsx`)
* **Langkah 2 (Daftar Kost & Rincian Harga)**:
  * Memperbarui kotak info harga agar menampilkan detail per unit kost secara transparan (Kost #1: Rp 35.000 vs Kost #2: Rp 24.500 (Diskon 30%)).
  * Menambahkan banner informasi berwarna hijau jika pengguna mendapatkan potongan harga.
  * Menambahkan banner edukatif berwarna kuning jika pengguna memilih sumber database tetapi belum membeli database, mengajak mereka membeli database terlebih dahulu untuk menghemat 30%.
* **Langkah 4 (Konfirmasi Pesanan)**:
  * Memperbarui rincian ringkasan total bayar agar mencantumkan label unit diskon.
* **Halaman Sukses Pembayaran**:
  * Menyelaraskan tampilan total biaya agar menampilkan rincian akhir pembayaran yang akurat.

### D. Penyelarasan Metadata Pembayaran (`functions/public/pages/SurveyCheckout.tsx`)
* Memperbarui objek `paymentMetadata` di fungsi `handleSubmit` agar menyertakan:
  * `has_database_discount`: status apakah transaksi ini menggunakan diskon database.
  * `discount_amount`: jumlah nominal potongan harga yang diberikan.
* Nilai ini akan disimpan otomatis di tabel database `transactions` ketika pembayaran diproses melalui `PaymentGateway.tsx`.

---

## 2. Hasil Pengujian & Kompilasi
* **Kompilasi TypeScript**:
  * Menjalankan program verifikasi compiler `tsc --noEmit`: Berhasil terverifikasi bersih dari error untuk file `SurveyCheckout.tsx`.
* **Bundler Vite**:
  * Menjalankan build bundler production: Berhasil mem-bundle seluruh aset frontend (termasuk `SurveyCheckout.tsx`) tanpa kendala.

---

## 3. Petunjuk Deploy

Perubahan ini sepenuhnya berada pada sisi frontend React SPA. Langkah deployment adalah sebagai berikut:

1. **Deploy ke Cloudflare Pages**:
   Cukup push perubahan ini ke branch utama repositori GitHub (`main` atau `master`) untuk memicu proses build dan rilis otomatis di Cloudflare Pages:
   ```bash
   git add .
   git commit -m "feat(survey): add 30% survey discount for database product buyers"
   git push origin main
   ```
