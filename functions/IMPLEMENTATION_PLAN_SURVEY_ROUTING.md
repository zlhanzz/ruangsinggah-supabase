# IMPLEMENTATION PLAN: URL-Based Routing untuk Payment Jasa Survey

Dokumen ini merinci rencana penambahan sistem routing pada halaman Survey Service untuk memastikan persistensi status pembayaran saat halaman di-refresh.

## 1. Analisis Masalah
- State `showPayment` saat ini bersifat lokal.
- Refresh halaman menyebabkan user kembali ke landing page Survey, kehilangan modal pembayaran yang sedang aktif.
- User harus mengisi ulang formulir dari awal jika terjadi gangguan koneksi atau refresh tidak sengaja.

## 2. Strategi Solusi
Menggunakan `URLSearchParams` untuk menyinkronkan state pembayaran dengan URL browser.

**Skema URL:**
- `ruangsinggah.com/survey-service?orderId=UUID_TRANSAKSI`

## 3. Langkah-Langkah Eksekusi

### Tahap 1: Modifikasi `SurveyService.tsx`
- Menambahkan `useEffect` untuk mendeteksi `orderId` di URL saat komponen di-mount.
- Memperbarui fungsi `handleSubmit` agar melakukan `window.history.pushState` saat transaksi dibuat.
- Memperbarui `handlePaymentSuccess` dan `onCancel` agar membersihkan URL (`?orderId=` dihapus).

### Tahap 2: Sinkronisasi State
- Memastikan metadata pembayaran dapat dipulihkan dari database jika user melakukan refresh (fungsi ini sudah didukung secara parsial oleh komponen `PaymentGateway`, namun `SurveyService` perlu menyiapkan UI-nya).

## 4. Rencana Verifikasi
- [ ] Mengisi form survey hingga tahap pembayaran.
- [ ] Melakukan refresh halaman saat modal pembayaran terbuka.
- [ ] Memastikan modal pembayaran terbuka kembali secara otomatis setelah refresh.
- [ ] Memastikan URL bersih kembali setelah pembayaran sukses atau dibatalkan.

---
**Agent: Antigravity**
**Status: Menunggu Persetujuan/Eksekusi**
