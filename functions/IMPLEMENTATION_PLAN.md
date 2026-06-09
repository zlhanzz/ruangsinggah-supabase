# IMPLEMENTATION PLAN - Perbaikan Loop Render Kelola WD Admin

Rencana ini dibuat untuk memperbaiki masalah "loading terus dan glitch/flickering" pada menu Kelola Pengajuan WD di Dashboard Admin.

## 1. Analisis Masalah
- **Penyebab Glitch/Loop**:
  - Komponen `WithdrawalManagement` memanggil `setLoading(true)` dan `setLoading(false)` yang berasal dari prop parent (`Dashboard.tsx`).
  - Ketika `loading` di parent bernilai `true`, `Dashboard.tsx` secara otomatis unmount `WithdrawalManagement` untuk merender loader global di area konten.
  - Setelah `WithdrawalManagement` di-unmount, fungsi fetch selesai dan memicu `setLoading(false)`.
  - Ketika `loading` kembali `false`, `Dashboard` merender ulang `WithdrawalManagement`, yang kemudian memicu `useEffect` untuk memuat data lagi, mengatur `setLoading(true)`, dan menyebabkan unmount kembali.
  - Proses ini berulang tanpa henti sehingga terjadi efek flickering (glitch) dan loading selamanya.
- **Solusi**:
  - Ubah `WithdrawalManagement` agar mengelola status loading miliknya sendiri secara lokal (`localLoading` dan `setLocalLoading`), terpisah dari loading global milik parent `Dashboard`.
  - Hapus prop `loading` dan `setLoading` dari `WithdrawalManagementProps` dan penggunaannya di `Dashboard.tsx`.

## 2. Dampak Perubahan
File yang akan disentuh:
1. `functions/public/components/admin/WithdrawalManagement.tsx` (Ubah props menjadi tanpa loading prop parent, tambahkan localLoading state).
2. `functions/public/pages/Dashboard.tsx` (Hapus pengiriman prop loading & setLoading ke komponen WithdrawalManagement).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `WithdrawalManagement.tsx`**:
   - Ganti deklarasi Props interface agar tidak memerlukan `loading` & `setLoading`.
   - Tambahkan state lokal `const [localLoading, setLocalLoading] = useState(false);`.
   - Ganti semua referensi `loading` dan `setLoading` dengan `localLoading` dan `setLocalLoading`.
2. **Modifikasi `Dashboard.tsx`**:
   - Hapus prop `loading={loading}` dan `setLoading={setLoading}` pada pemanggilan `<WithdrawalManagement />`.
3. **Verifikasi & Build**:
   - Jalankan `npm run build` untuk memvalidasi keberhasilan kompilasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil tanpa kesalahan kompilasi.
- Buka dashboard admin dan navigasikan ke menu "Kelola WD" (atau `/dashboard-admin/withdrawals`). Verifikasi bahwa data dimuat dengan sukses sekali saja, tidak terjadi glitch, dan halaman merender data secara stabil.
