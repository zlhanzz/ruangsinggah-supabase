# WALKTHROUGH - Implementasi Dompet Agen Dinamis & Sistem Penarikan Database

Dokumen ini mendokumentasikan perubahan yang telah dilakukan untuk mengganti sistem saldo dompet dan penarikan dummy di dashboard agen dengan kalkulasi pendapatan riil (bagi hasil 70/30) serta pencatatan penarikan dana berbasis database (tabel `withdrawal_requests`).

## 1. Daftar Perubahan
### Dashboard Agen (`functions/public/pages/AgentDashboard.tsx`)
- **Kalkulasi Pendapatan Dinamis**:
  - Mengubah cara menghitung `earnings` di objek `stats` agar dihitung dinamis dari total pembayaran transaksi survei (`r.transaction?.amount`) yang berstatus `'COMPLETED'` dikali **70%** (porsi bagi hasil agen).
  - Mendistribusikan nominal transaksi secara rata jika terdapat lebih dari satu unit survei dalam satu `transaction_id` (mendukung survei multi-kost).
- **Integrasi Bank Account Agen**:
  - Membaca data rekening bank agen (`bank_name`, `bank_account`, `bank_account_name`) secara dinamis dari `user_metadata` saat halaman dimuat.
  - Memfungsikan tombol "Simpan Rekening Default" agar menyimpan konfigurasi rekening baru ke dalam metadata autentikasi pengguna (`supabase.auth.updateUser`).
- **Sistem Penarikan Dana Database**:
  - Mengganti dummy withdrawal data dengan pemanggilan ke database tabel `withdrawal_requests` yang memuat riwayat pengajuan penarikan dana riil agen.
  - Memfungsikan tombol "Tarik Sekarang" agar melakukan `.insert()` data pengajuan penarikan baru ke tabel `withdrawal_requests` dengan status awal `'pending'`, dilanjutkan dengan pengalihan otomatis ke WhatsApp Admin untuk konfirmasi pembayaran manual oleh pemilik platform.
  - Saldo tersedia (`availableBalance`) dihitung dinamis dengan rumus: `Total Pendapatan Riil - Total Penarikan Terproses (Status Approved & Pending)`.

## 2. Hasil Pengujian
- **Keberhasilan Kompilasi**:
  - Proyek telah dibangun untuk lingkungan produksi menggunakan `npm run build` dan berhasil tanpa kesalahan kompilasi/type-checking.
- **Hasil Alur Kerja**:
  - Saldo dihitung berdasarkan porsi 70% dari nilai asli transaksi survei yang berhasil diselesaikan agen tersebut.
  - Tombol simpan bank dan tarik saldo berfungsi penuh ke backend Supabase.

## 3. Petunjuk SQL Database
Sebelum menjalankan aplikasi, pastikan Anda telah mengeksekusi script SQL pembuatan tabel berikut di editor SQL Supabase:
```sql
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount >= 50000),
    bank_name TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejected_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can insert their own withdrawal requests" 
ON public.withdrawal_requests FOR INSERT TO authenticated 
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can view their own withdrawal requests" 
ON public.withdrawal_requests FOR SELECT TO authenticated 
USING (agent_id = auth.uid());

CREATE POLICY "Admins have full access to withdrawal requests" 
ON public.withdrawal_requests FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.is_admin = true)
  )
);
```

## 4. Petunjuk Deploy / Menjalankan Aplikasi
Untuk menjalankan proyek di lingkungan pengembangan lokal:
```bash
cd functions/public
npm run dev
```

Untuk membangun ulang bundel produksi:
```bash
cd functions/public
npm run build
```
