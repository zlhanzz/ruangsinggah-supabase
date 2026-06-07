# IMPLEMENTATION PLAN - Perbaikan Impor Supabase di AgentDashboard

Rencana ini dibuat untuk menambahkan impor `supabase` yang hilang di `AgentDashboard.tsx` agar fungsi penarikan saldo dan pemuatan riwayat penarikan dari database berjalan lancar tanpa error `ReferenceError: supabase is not defined`.

## 1. Analisis Masalah
- **Masalah Utama**:
  - Pada perubahan sebelumnya, kita memfungsikan tabel database `withdrawal_requests` untuk mencatat transaksi penarikan saldo agen.
  - Kita menggunakan objek `supabase` untuk query data: `supabase.from('withdrawal_requests')`.
  - Namun, objek `supabase` belum diimpor di bagian atas berkas [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx), sehingga memicu error runtime: `ReferenceError: supabase is not defined`.

- **Solusi**:
  - Tambahkan baris impor `import { supabase } from '../supabase';` pada bagian awal impor di berkas `AgentDashboard.tsx`.

## 2. Dampak Perubahan
File yang akan disentuh:
1. **`functions/public/pages/AgentDashboard.tsx`**:
   - Menambahkan deklarasi impor `supabase`.

## 3. Langkah-Langkah Eksekusi
1. Buka [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx).
2. Tambahkan `import { supabase } from '../supabase';` di baris atas.
3. Jalankan `npm run build` menggunakan CMD untuk verifikasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil.
