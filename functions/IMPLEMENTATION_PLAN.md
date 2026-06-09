# IMPLEMENTATION PLAN - Perbaikan Relasi Database Kelola WD Admin

Rencana ini dibuat untuk memperbaiki masalah di mana pengajuan penarikan dana (withdraw) dari agen tidak muncul di dashboard admin akibat tidak adanya foreign key eksplisit di database antara tabel `withdrawal_requests` dan `users`.

## 1. Analisis Masalah
- **Penyebab Data Tidak Muncul**:
  - Komponen `WithdrawalManagement.tsx` memanggil Supabase dengan join query: `.select('*, agent:users(...)')`.
  - Karena tidak ada constraint foreign key resmi di database Supabase antara `withdrawal_requests.agent_id` dan `users.id`, engine PostgREST mengembalikan error `PGRST200` ("Could not find a relationship between...").
  - Hal ini menyebabkan pemanggilan API gagal (`error` tidak null) dan `withdrawals` state diset/dibiarkan sebagai array kosong `[]`. Akibatnya dashboard admin menampilkan "Tidak ada pengajuan penarikan" (0 data).
- **Solusi**:
  - Ubah query di `WithdrawalManagement.tsx` agar melakukan penarikan data secara manual bertahap:
    1. Ambil data mentah dari `withdrawal_requests`.
    2. Ekstrak kumpulan `agent_id` unik dari data tersebut.
    3. Lakukan query ke tabel `users` menggunakan filter `.in('id', agentIds)` untuk mendapatkan informasi nama, email, dan telepon.
    4. Petakan (mapping) informasi user tersebut ke objek `withdrawal_requests` di frontend sebelum menyimpan ke state `withdrawals`.

## 2. Dampak Perubahan
File yang akan disentuh:
1. `functions/public/components/admin/WithdrawalManagement.tsx` (Mengubah fungsi `loadWithdrawals` agar melakukan manual mapping/join).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `WithdrawalManagement.tsx`**:
   - Ganti implementasi query dalam `loadWithdrawals` agar tidak menggunakan join resources `.select('*, agent:users(...)')`.
   - Implementasikan parallel/sequential query ke tabel `users` menggunakan set of IDs dan lakukan map matching.
2. **Verifikasi & Build**:
   - Jalankan `npm run build` untuk memvalidasi keberhasilan kompilasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil tanpa kesalahan kompilasi.
- Buka dashboard admin dan pastikan daftar pengajuan WD dari agen muncul secara lengkap beserta nama, nominal, dan detail bank agen.
