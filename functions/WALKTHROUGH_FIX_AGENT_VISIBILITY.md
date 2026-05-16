# WALKTHROUGH - Perbaikan Visibilitas Riwayat Survey Agen

## Daftar Perubahan

### 1. Frontend: AgentDashboard.tsx
- **Filter Tab Riwayat**: Menambahkan status `SUBMITTED` ke dalam daftar filter tab Riwayat. Sekarang, tugas yang sudah dikirim laporannya oleh agen namun belum dikonfirmasi oleh user akan muncul di tab **Riwayat**.
- **Logika Badge Tab**: 
    - Menambahkan `HEADING_TO_LOCATION` ke logika badge tab **Aktif**.
    - Menambahkan `SUBMITTED` ke logika badge tab **Riwayat**.
- **Label & Skema Warna Status**:
    - Menambahkan label **"Menunggu Konfirmasi"** dan warna biru (`blue-600`) untuk status `SUBMITTED`.
    - Menambahkan label **"Menuju Lokasi"** dan warna indigo (`indigo-600`) untuk status `HEADING_TO_LOCATION`.

## Hasil Pengujian
- **Visibilitas**: Setelah agen menekan "Kirim Laporan", kartu survey tidak lagi menghilang melainkan berpindah ke tab **Riwayat**.
- **UI Status**: Status pada kartu survey di tab Riwayat kini tertulis "MENUNGGU KONFIRMASI" dengan latar belakang biru yang jelas.
- **Indikator**: Titik merah pada tab Riwayat muncul jika terdapat tugas yang baru saja dipindahkan ke riwayat dengan status `SUBMITTED`.

## Petunjuk Deploy
1. Jalankan build frontend: `npm run build`.
2. Deploy perubahan: `firebase deploy --only hosting`.
