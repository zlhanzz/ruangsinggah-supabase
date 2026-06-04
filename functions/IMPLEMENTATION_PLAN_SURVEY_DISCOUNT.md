# IMPLEMENTATION PLAN - Potongan 30% Jasa Survey untuk Pembeli Database Kost

Dokumen ini menjelaskan rencana implementasi fitur potongan harga sebesar 30% untuk Jasa Survey jika pengguna telah membeli produk database kost di Ruang Singgah dan memilih "Database Properti" sebagai sumber informasi pada form survey.

## 1. Analisis Masalah
* **Tujuan**: Memberikan insentif/diskon sebesar 30% untuk setiap unit kost yang diajukan dalam Jasa Survey jika:
  1. Pengguna memiliki riwayat transaksi berstatus `'PAID'` (Berhasil) untuk tipe produk `'database'`.
  2. Pengguna memilih `'database'` (Database Properti) sebagai Sumber Info pada kost terkait di form survey.
* **Solusi**:
  * Menggunakan fungsi `getUserTransactions` dari `userService.ts` untuk memeriksa riwayat pembelian database kost pengguna saat halaman `SurveyCheckout.tsx` dimuat.
  * Menghitung total harga secara dinamis dengan menerapkan diskon 30% (`unitPrice * 0.7`) khusus untuk unit kost yang bersumber dari `'database'` (jika pengguna memenuhi syarat riwayat pembelian).
  * Menampilkan informasi diskon secara visual di UI checkout (Rincian Harga & Ringkasan Pesanan) untuk transparansi penuh.
  * Menyimpan metadata diskon ke dalam objek transaksi untuk keperluan audit data pembayaran.

## 2. Dampak Perubahan
File yang akan diubah meliputi:
* `functions/public/pages/SurveyCheckout.tsx`:
  * Mengimpor `getUserTransactions` dari `../userService`.
  * Menambahkan state `hasBoughtDatabase` untuk menyimpan status kelayakan diskon pengguna.
  * Menyesuaikan perhitungan `totalPrice` dengan kalkulasi diskon per unit kost.
  * Memperbarui visual rincian harga di Langkah 2 (Pricing Info), Langkah 4 (Ringkasan Pesanan), dan halaman sukses pembayaran.
  * Memasukkan atribut metadata diskon (`has_database_discount` dan `discount_amount`) saat memanggil payment gateway.

## 3. Langkah-Langkah Eksekusi
1. **Import & Inisialisasi State Kelayakan**:
   - Di `SurveyCheckout.tsx`, impor `getUserTransactions`.
   - Tambahkan state `hasBoughtDatabase` (default `false`).
2. **Pengecekan Riwayat Transaksi**:
   - Tambahkan `useEffect` yang dipicu ketika objek `user` tersedia.
   - Panggil `getUserTransactions(uid)` dan periksa apakah ada transaksi dengan `product_type === 'database'` dan status `'PAID'` atau `'paid'`.
   - Update state `hasBoughtDatabase` sesuai hasil pemeriksaan.
3. **Kalkulasi Total Harga Dinamis**:
   - Ubah formula `totalPrice` dari perkalian sederhana menjadi fungsi reduce yang memeriksa tiap unit kost:
     ```typescript
     const totalPrice = kostList.reduce((sum, k) => {
       if (hasBoughtDatabase && k.source === 'database') {
         return sum + (unitPrice * 0.7);
       }
       return sum + unitPrice;
     }, 0);
     ```
4. **Pembaruan Visual Tampilan UI**:
   - Pada langkah 2, tampilkan status diskon per unit kost jika terpilih sumber "Database Properti".
   - Jika pengguna belum membeli database tapi memilih "Database Properti", tampilkan info edukatif (misal: *"Beli database kost kami untuk hemat 30% Jasa Survey"*).
   - Pada langkah 4 (Ringkasan) dan halaman Sukses, tampilkan rincian biaya kost normal vs kost diskon.
5. **Pembaruan Transaksi & Metadata**:
   - Di `handleSubmit`, tambahkan detail diskon ke `paymentMetadata` untuk disimpan di database.
6. **Kompilasi & Pengujian**:
   - Jalankan build verifikasi frontend untuk memastikan tipe data dan sintaks valid.

## 4. Rencana Verifikasi
* **Skenario A (Pengguna belum membeli database)**:
  * Masuk ke halaman checkout, pilih sumber "Database Properti". Harga total harus tetap normal (tidak ada potongan) dan sistem tidak mendeteksi status pembelian.
* **Skenario B (Pengguna sudah membeli database)**:
  * Mensimulasikan pengguna yang memiliki transaksi database berstatus `'PAID'`.
  * Buka checkout survey, tambahkan 2 kost (Kost 1: sumber "Database Properti", Kost 2: sumber "Sosial Media").
  * Harga Kost 1 harus terpotong 30% (misal: Rp 35.000 menjadi Rp 24.500 jika unitPrice 35rb), sedangkan Kost 2 tetap normal. Total bayar harus bernilai Rp 59.500.
* **Verifikasi Build**: Memastikan Vite build berjalan dengan sukses.
