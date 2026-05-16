# WALKTHROUGH: URL-Based Routing untuk Payment Jasa Survey

Dokumen ini mendokumentasikan perubahan yang dilakukan untuk mendukung persistensi status pembayaran pada layanan survey.

## Daftar Perubahan

### 1. `SurveyService.tsx`
- **Full Flow Routing**: Menggunakan query parameters untuk mengelola seluruh alur:
    - `?step=1..4`: Mengontrol langkah pengisian formulir.
    - `?step=payment`: Tahap transisi saat menunggu pembuatan transaksi backend.
    - `?orderId=...`: Tahap pembayaran aktif dengan data terverifikasi.
- **Native Back Support**: User dapat menggunakan tombol Back browser untuk kembali ke langkah pengisian sebelumnya tanpa kehilangan data.
- **Seamless Transition**: Menghilangkan jeda "blank" saat berpindah dari formulir ke payment gateway dengan menjadikan URL sebagai *source of truth*.

### 2. `PaymentGateway.tsx`
- **Consistent Routing**: Mengadopsi `useSearchParams` untuk menyinkronkan `orderId` segera setelah transaksi berhasil dibuat oleh backend.
- **Automatic Resume**: Memanfaatkan hook router untuk mendeteksi transaksi aktif saat komponen di-mount ulang, menjamin pengalaman "resume" yang mulus bagi user.

## Hasil Pengujian (Simulasi)
1.  User mengisi form survey -> Klik Bayar.
2.  URL berubah menjadi: `.../survey-service?orderId=SRV-XXXXX`.
3.  User menekan F5 (Refresh).
4.  Halaman dimuat ulang -> Modal Pembayaran otomatis terbuka kembali pada tahap terakhir.
5.  User klik Batal -> URL kembali bersih: `.../survey-service`.

## Petunjuk Deploy
Perubahan ini hanya terjadi di sisi Frontend (React). Cukup jalankan perintah build dan deploy seperti biasa:
```bash
npm run build
firebase deploy --only hosting
```

---
**Agent: Antigravity**
**Status: COMPLETED**
