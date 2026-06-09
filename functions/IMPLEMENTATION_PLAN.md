# IMPLEMENTATION PLAN - Perbaikan Grafik Aktivitas Mingguan Surveyor

Rencana ini dibuat untuk memperbaiki akurasi penanggalan pada grafik "Aktivitas Survey 7 Hari Terakhir" di Dashboard Agen.

## 1. Analisis Masalah
- **Penyebab Penanggalan Salah**:
  - Grafik saat ini menentukan tanggal aktivitas berdasarkan `updated_at` (atau `created_at` sebagai fallback).
  - Namun, `updated_at` milik survey berstatus `COMPLETED` akan ditimpa dengan waktu saat pengguna/customer memberikan ulasan rating di halaman "Kost Saya".
  - Jika pengguna mengonfirmasi dan memberi rating pada beberapa survey sekaligus (misal pada hari Senin), maka semua survey tersebut akan tercatat memiliki `updated_at` di hari Senin. Hal ini membuat semua bar aktivitas di grafik menumpuk pada satu hari saja (Senin).
- **Solusi**:
  - Tentukan tanggal pengerjaan/pengiriman laporan survei yang sesungguhnya dengan skema penentuan dinamis:
    1. Jika terdapat `submitted_at` di dalam objek `evaluation_summary` (untuk pengajuan baru), gunakan nilai tersebut.
    2. Cari nama file foto yang diunggah di dalam `evaluation_summary` (misal: `1780719322976_abc.webp`). Angka epoch timestamp (`1780719322976`) diekstrak untuk mendapatkan tanggal pengunggahan foto laporan.
    3. Jika tidak ada foto/timestamp, fallback ke `created_at`.
  - Pada pengisian laporan baru oleh surveyor di `AgentDashboard.tsx` (`handleUpdateSurvey`), tambahkan kolom `submitted_at` ke dalam `evaluation_summary` secara otomatis.

## 2. Dampak Perubahan
File yang akan disentuh:
1. `functions/public/pages/AgentDashboard.tsx` (Update `getWeeklyData` helper and `handleUpdateSurvey` method).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `AgentDashboard.tsx`**:
   - Definisikan fungsi helper `getSurveyWorkDate` untuk mengekstrak tanggal laporan dari `submitted_at`, timestamp foto, atau `created_at`.
   - Update `getWeeklyData` agar memanggil `getSurveyWorkDate` saat memfilter jumlah tugas harian.
   - Di dalam fungsi `handleUpdateSurvey`, sisipkan properti `submitted_at: new Date().toISOString()` di dalam `evaluation_summary` sebelum menyimpan ke database.
2. **Verifikasi & Build**:
   - Jalankan `npm run build` untuk memvalidasi keberhasilan kompilasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil tanpa kesalahan kompilasi.
- Buka dashboard agen dan pastikan grafik 7 hari terakhir menampilkan sebaran data penyelesaian survey yang akurat (seperti terbagi ke hari Sabtu dan Senin) sesuai hari kerja riil surveyor.
