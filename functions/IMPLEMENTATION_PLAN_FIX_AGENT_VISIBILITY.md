# IMPLEMENTATION PLAN - Perbaikan Visibilitas Riwayat Survey Agen

## Analisis Masalah
1. **Status Missing**: Status `SUBMITTED` (Laporan Terkirim) tidak termasuk dalam filter tab `Aktif` maupun `Riwayat` di `AgentDashboard.tsx`. Akibatnya, kartu survey menghilang dari pandangan agen setelah laporan dikirim.
2. **Label Missing**: Status `SUBMITTED` dan `HEADING_TO_LOCATION` belum memiliki label bahasa Indonesia dan skema warna yang sesuai di komponen UI.
3. **Badge Logic**: Indikator titik merah (badge) pada tab juga tidak sinkron dengan status-status baru.

## Dampak Perubahan
- `functions/public/pages/AgentDashboard.tsx`: 
    - Perubahan logika filter pada fungsi `renderTasks`.
    - Penambahan status `SUBMITTED` ke tab `Riwayat`.
    - Pembaruan skema warna dan label status pada komponen kartu survey.
    - Sinkronisasi logika badge pada tab navigasi tugas.

## Langkah-Langkah Eksekusi
1. **Update Filter Tab**: Menambahkan `SUBMITTED` ke dalam filter `agentTab === 'history'`.
2. **Update Badge Logic**: Menyelaraskan status `HEADING_TO_LOCATION` dan `SUBMITTED` ke dalam logika badge agar indikator muncul dengan benar.
3. **UI Enhancement**: 
    - Menambahkan kondisi untuk status `SUBMITTED` (Menunggu Konfirmasi) dengan warna biru/indigo.
    - Menambahkan kondisi untuk status `HEADING_TO_LOCATION` (Menuju Lokasi) agar label muncul dengan benar.

## Rencana Verifikasi
1. Login sebagai Agen.
2. Kirim laporan survey.
3. Pastikan kartu survey berpindah ke tab **Riwayat** dengan label "Menunggu Konfirmasi".
4. Pastikan indikator titik merah muncul pada tab Riwayat jika ada tugas berstatus `SUBMITTED`.
