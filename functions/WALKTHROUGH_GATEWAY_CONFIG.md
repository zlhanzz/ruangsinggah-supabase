# WALKTHROUGH: Sistem Konfigurasi Tunggal Gateway

## Daftar Perubahan
Sistem telah disederhanakan agar hanya menggunakan satu gateway pembayaran aktif yang ditentukan sepenuhnya oleh admin/developer.

### 1. Penyederhanaan Konfigurasi Backend (`functions/src/index.ts`)
*   **Opsi 'BOTH' Dihapus**: Parameter `ACTIVE_GATEWAY` sekarang hanya menerima pilihan tunggal: `"MIDTRANS"` atau `"PAKASIR"`.
*   **Default**: Default diset ke `"MIDTRANS"`.

### 2. Penghapusan Pilihan di Sisi User (`public/components/PaymentGateway.tsx`)
*   **UI Bersih**: Tab pemilihan gateway telah dihapus dari antarmuka pengguna.
*   **Logika Otomatis**: Aplikasi akan secara otomatis mendeteksi gateway mana yang aktif dari server dan menjalankan logika pembayaran yang sesuai (Midtrans Snap atau Pakasir Redirect/Direct) tanpa meminta input dari pengguna akhir.

## Cara Mengubah Gateway Aktif
Sebagai developer, Anda dapat beralih gateway dengan mengubah parameter di `functions/src/index.ts`:
```typescript
const activeGatewayParam = defineString('ACTIVE_GATEWAY', { default: 'MIDTRANS' }); // Ganti ke 'PAKASIR' jika diperlukan
```
Atau melalui Firebase CLI:
```bash
firebase functions:config:set payment.active_gateway="PAKASIR"
```

## Hasil Pengujian
1.  **Jika MIDTRANS aktif**: User langsung melihat interface Midtrans.
2.  **Jika PAKASIR aktif**: User langsung dialihkan atau melihat instruksi Pakasir.
3.  **Transparansi**: Tidak ada lagi gangguan visual berupa tombol pilihan bagi user.

## Petunjuk Deploy
```bash
npm run deploy
```
