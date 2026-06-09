# IMPLEMENTATION PLAN - Optimasi Menyeluruh Dashboard Mitra (Owner)

Rencana ini dibuat untuk mengoptimalkan fungsionalitas dan kinerja Dashboard Mitra (Overview, Manajemen Kost/Properties, Manajemen Pesanan/Bookings, dan Fitur Tarik Dana/Wallet).

## 1. Analisis Masalah
- **Fitur Tarik Dana (Wallet/WD)**:
  - Tombol "Tarik Dana Sekarang" pada menu Dompet saat ini masih berupa tombol statis dan tidak memicu fungsionalitas pengiriman permintaan penarikan dana (`withdrawal_requests`) ke database Supabase.
  - Perlu ditambahkan modal konfirmasi penarikan dana yang menampilkan detail rekening, nominal yang ditarik, dan validasi saldo (minimal Rp 10.000).
  - Riwayat penarikan dana belum dimuat dari tabel `withdrawal_requests`.
- **Manajemen Kost (Properties)**:
  - Tombol preview kost di halaman "Kost Saya" belum mengarah ke halaman detail kost.
  - Perlu penambahan fungsionalitas hapus kost (Delete) langsung dari dashboard.
- **Manajemen Pesanan (Bookings)**:
  - Desain tombol setuju/tolak dan layout kartu pesanan perlu diselaraskan agar responsif di perangkat mobile dan desktop.
- **Pembersihan UI & UX**:
  - Kurang adanya visual loader saat memproses penarikan atau aksi persetujuan pesanan.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/pages/MitraDashboard.tsx`:
   - Impor `getOrCreateChatSession` dan `notifyAdminWithdrawalRequest` untuk memperbaiki dependensi yang hilang.
   - Penambahan state `withdrawalHistory`, `isWithdrawing`, `showWithdrawConfirm`, dan nominal penarikan.
   - Implementasi fungsi `loadData` untuk mengambil riwayat penarikan dari tabel `withdrawal_requests` dan menghitung:
     - `allTimeRevenue` = jumlah semua bookings yang PAID/COMPLETED.
     - `totalWithdrawn` = jumlah withdrawal requests dengan status !== 'rejected'.
     - `availableBalance` = `allTimeRevenue - totalWithdrawn`.
   - Menyimpan `availableBalance` ke dalam state `stats`.
   - Implementasi fungsi `handleWithdraw` untuk mengirim pengajuan penarikan ke database Supabase.
   - Menambahkan modal konfirmasi penarikan dana di menu `wallet` lengkap dengan pengecekan saldo minimal Rp 10.000.
   - Hubungkan tombol "Tarik Dana Sekarang" ke modal tersebut.
   - Pengaktifan tombol preview kost agar mengarah ke halaman detail kost `/kost/:id`.
   - Penambahan aksi hapus kost (`handleDeleteKost`) dengan konfirmasi aman dan penghapusan data dari tabel `properties`.
   - Penggabungan riwayat transaksi ( bookings PAID dan withdrawals ) secara kronologis berdasarkan waktu.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `MitraDashboard.tsx`**:
   - Perbarui impor untuk menyertakan `getOrCreateChatSession` dari `../chatService` dan `notifyAdminWithdrawalRequest` dari `../emailService`.
   - Deklarasikan state hooks baru untuk nominal penarikan, status penarikan, dan modal konfirmasi penarikan.
   - Perbarui `loadData` untuk memuat riwayat penarikan dan hitung saldo yang tersedia.
   - Implementasikan fungsi `handleWithdraw` dan modal konfirmasi penarikan.
   - Implementasikan fungsi `handleDeleteKost` di panel kost saya.
   - Hubungkan tombol "Preview" kost agar mengarah ke rute `/kost/:id` menggunakan `navigate`.
   - Satukan riwayat transaksi ( bookings + withdrawals ) lalu urutkan secara descending berdasarkan waktu.
2. **Kompilasi & Verifikasi**:
   - Jalankan `cmd.exe /c npm run build` di folder `functions/public` untuk memastikan kompilasi typescript berhasil.

## 4. Rencana Verifikasi
- Menguji pengajuan penarikan saldo di dashboard Mitra dan memverifikasi data masuk ke tabel `withdrawal_requests`.
- Menguji tombol hapus kost dan mengonfirmasi penghapusan data dari tabel `properties`.
- Menguji tombol preview kost dan mengonfirmasi pengalihan rute ke detail kost yang tepat.
- Memastikan build production berjalan tanpa ada error typescript.
