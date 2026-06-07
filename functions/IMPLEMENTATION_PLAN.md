# IMPLEMENTATION PLAN - Implementasi Dompet Agen Dinamis & Sistem Penarikan Database

Rencana ini dibuat untuk mengimplementasikan fitur dompet agen yang dinamis berbasis bagi hasil 70% (agen) / 30% (platform) dari nilai transaksi survei riil, serta mengganti sistem dummy penarikan saldo dengan sistem penarikan database menggunakan tabel khusus `withdrawal_requests`.

## 1. Analisis Masalah
- **Masalah Utama**:
  1. Kalkulasi pendapatan di `AgentDashboard.tsx` masih kaku (`completed_surveys * Rp 70.000`).
  2. Saldo tersedia masih menggunakan angka dummy (`420.000`).
  3. Fitur "Tarik Saldo" dan "Riwayat WD" masih mock/dummy.
  4. Belum ada tabel database terpusat untuk menyimpan pengajuan penarikan saldo dari agen secara aman (standar industri).

- **Solusi**:
  1. **Tabel Database Baru**: Kita akan menyusun SQL untuk tabel `withdrawal_requests` di Supabase lengkap dengan kebijakan Row-Level Security (RLS) demi keamanan data.
  2. **Kalkulasi Bagi Hasil Dinamis**: Porsi bagi hasil dihitung 70% untuk agen dari total pembayaran transaksi survei (`transaction.amount`) yang dikerjakan agen tersebut dengan status survey `'COMPLETED'`.
  3. **Penghitungan Saldo Tersedia**: Saldo Tersedia = Total Pendapatan Riil (70% Bagi Hasil) - Total Penarikan Terproses (`approved` atau `pending`).
  4. **Pencatatan & Alur WD**: Ketika Agen melakukan tarik saldo, record baru masuk ke `withdrawal_requests` dengan status `'pending'`, kemudian mengarahkan ke chat WhatsApp Admin untuk notifikasi transfer manual.
  5. **Daftar Riwayat WD Riil**: Mengambil riwayat pengajuan penarikan secara real-time dari tabel `withdrawal_requests` di database untuk ditampilkan di tab "Riwayat WD" dashboard agen.

## 2. Dampak Perubahan
File yang akan disentuh:
1. **`functions/public/pages/AgentDashboard.tsx`**:
   - Modifikasi pemrosesan `stats` (earnings, availableBalance).
   - Implementasi pengambilan data rekening dan riwayat penarikan dari tabel `withdrawal_requests`.
   - Modifikasi fungsi `handleWithdraw` agar menyimpan pengajuan ke database dan mengirim pesan WhatsApp.
   - Pemuatan info bank agen secara dinamis dari database/metadata auth.
2. **`functions/public/supabase_schema.sql`** (opsional / dokumentasi):
   - Tambahkan skema tabel `withdrawal_requests` untuk referensi masa depan.

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Struktur Tabel Database (SQL)
Jalankan SQL berikut pada editor SQL Supabase:
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

### Langkah 2: Pembaruan Front-End (`AgentDashboard.tsx`)
1. Definisikan state penarikan riil: `const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);`
2. Tambahkan effect `useEffect` untuk memuat data penarikan dari tabel `withdrawal_requests` saat menu dompet aktif.
3. Di dalam load data:
   - Ambil bank account info dari user metadata.
   - Hitung total pendapatan berdasarkan porsi 70% dari nilai pembayaran transaksi survey (`surveyRequests.filter(r => r.status === 'COMPLETED')` mengambil `r.transaction?.amount` atau fallback ke nilai standard survey).
   - Jumlahkan semua penarikan berstatus `'approved'` dan `'pending'`.
   - Hitung `availableBalance = totalEarnings - totalWithdrawn`.
4. Ganti fungsi dummy `handleWithdraw` agar memasukkan data ke tabel `withdrawal_requests` menggunakan `supabase.from('withdrawal_requests').insert(...)`.
5. Perbarui render UI di tab Dompet, Riwayat WD, dan Rekening agar sinkron dengan state database.

### Langkah 3: Uji Coba & Build
- Lakukan kompilasi dengan `npm run build` untuk memverifikasi tidak ada kesalahan TypeScript.

## 4. Rencana Verifikasi
- Memastikan build Vite berjalan sukses tanpa error.
- Tombol Tarik Saldo menyimpan data ke database dan memicu tautan WhatsApp dengan nominal yang benar.
- Riwayat WD memuat daftar pengajuan status riil dari database.
