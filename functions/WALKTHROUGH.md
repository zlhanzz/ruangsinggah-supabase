# WALKTHROUGH - Batas Minimal Penarikan Saldo Agen Survey (10k)

Dokumen ini berisi rincian perubahan, hasil pengujian, dan instruksi deployment untuk penyesuaian batas minimal penarikan saldo (withdraw) agen survey dari Rp 50.000 menjadi Rp 10.000.

## 1. Daftar Perubahan
- **Berkas yang Diubah**:
  1. [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)
  2. [Dashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Dashboard.tsx)
- **Rincian Modifikasi**:
  - **`AgentDashboard.tsx`**:
    - Mengubah kondisi minimal penarikan dari `availableBalance < 50000` menjadi `availableBalance < 10000` di fungsi `handleWithdraw`.
    - Menyesuaikan pesan alert menjadi: `'Saldo minimal untuk penarikan adalah Rp 10.000'`.
  - **`Dashboard.tsx`**:
    - Mengubah pengecekan `netEarnings < 50000` menjadi `netEarnings < 10000` di fungsi `handleWithdraw`.
    - Mengubah pengecekan `netBalance < 50000` menjadi `netBalance < 10000` di tombol aksi Tarik Saldo.
    - Menyesuaikan pesan kesalahan alert di kedua tempat agar menampilkan Rp 10.000.

## 2. Hasil Pengujian
- **Kompilasi TypeScript**: Sukses. Kompilasi build frontend via `cmd.exe /c npm run build` diselesaikan tanpa adanya kesalahan tipe atau modul.
- **Fungsionalitas**: Agen kini dapat memicu pengajuan penarikan dana dengan saldo minimal Rp 10.000.

## 3. Petunjuk Deploy
Jalankan perintah berikut pada terminal di dalam direktori `functions` untuk membangun dan meluncurkan aplikasi lokal Anda:
```bash
# Bersihkan dan bangun bundel produksi lokal
npm run build

# Jalankan server pengembangan lokal
npm run dev
```
