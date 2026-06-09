# IMPLEMENTATION PLAN - Batas Minimal Penarikan Saldo Agen Survey (10k)

Rencana ini dibuat untuk menurunkan batas minimum penarikan saldo (withdraw) agen survey dari Rp 50.000 menjadi Rp 10.000.

## 1. Analisis Masalah
- **Persyaratan**: Batas minimal penarikan saldo diturunkan menjadi Rp 10.000 (10k rupiah).
- **Lokasi Kode Terkait**:
  1. `functions/public/pages/AgentDashboard.tsx` (Baris ke-263 & 264)
  2. `functions/public/pages/Dashboard.tsx` (Baris ke-511 dan 2488)

## 2. Dampak Perubahan
File yang akan disentuh:
1. [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)
2. [Dashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx)

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `AgentDashboard.tsx`**:
   - Ganti validasi `availableBalance < 50000` menjadi `availableBalance < 10000`.
   - Ubah pesan alert menjadi `'Saldo minimal untuk penarikan adalah Rp 10.000'`.
2. **Modifikasi `Dashboard.tsx`**:
   - Ganti validasi `netEarnings < 50000` menjadi `netEarnings < 10000`.
   - Ganti validasi `netBalance < 50000` menjadi `netBalance < 10000`.
   - Sesuaikan pesan alert terkait batas Rp 10.000.
3. **Verifikasi & Build**:
   - Jalankan `npm run build` untuk memvalidasi keberhasilan kompilasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil tanpa kesalahan kompilasi.
- Verifikasi batas saldo baru saat proses penarikan diuji/diinput.
