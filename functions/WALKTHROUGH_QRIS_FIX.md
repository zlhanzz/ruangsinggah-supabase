# WALKTHROUGH: QRIS Functional Fix & Simulator Support

## Daftar Perubahan

### 1. Frontend (`public/components/PaymentGateway.tsx`)
*   **Data Integrity Fix**: Memperbaiki logika perenderan QRIS agar memprioritaskan `qr_string` (Data Tagihan Asli) daripada link gambar. Hal ini memastikan QR yang tampil mengandung data tagihan yang bisa dideteksi oleh aplikasi M-Banking.
*   **Hybrid QR Loader**: Jika data mentah tidak tersedia, sistem akan otomatis beralih menggunakan gambar QR resmi langsung dari server Midtrans sebagai cadangan (fallback).
*   **Sandbox Simulation Helper**: Menambahkan panel khusus di bawah QR Code saat berada di lingkungan **Sandbox**. Panel ini menampilkan "Kode Simulasi" mentah yang bisa Anda salin untuk digunakan pada [Midtrans Simulator](https://docs.midtrans.com/en/technical-reference/sandbox-simulator).
*   **M-Banking Ready**: Dengan perbaikan encoding, QR Code sekarang dapat di-scan oleh aplikasi perbankan (meskipun di Sandbox akan tetap terdeteksi sebagai merchant simulasi).

## Hasil Perbaikan
*   **Sebelum**: QR Code berisi "Link Gambar", sehingga M-Banking tidak mengenali tagihan.
*   **Sesudah**: QR Code berisi "Data Tagihan", M-Banking akan mengenali nominal dan merchant (RuangSinggah).

## Cara Melakukan Simulasi (Sandbox)
1. Pilih metode pembayaran **QRIS**.
2. Klik tombol **"Salin Kode Simulasi"** yang muncul di bawah QR Code.
3. Buka [Midtrans QRIS Simulator](https://docs.midtrans.com/en/technical-reference/sandbox-simulator).
4. Tempel (Paste) kode tersebut dan klik bayar.
5. UI RuangSinggah akan otomatis berubah menjadi "Lunas" dalam hitungan detik.

## Petunjuk Deploy
Jalankan perintah berikut untuk mengaktifkan perbaikan QRIS:
```bash
npm run build
firebase deploy --only functions
```
