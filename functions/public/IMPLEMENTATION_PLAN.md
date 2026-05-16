# IMPLEMENTATION PLAN - Notifikasi Email Otomatis Survey

Dokumen ini menjelaskan rencana integrasi sistem notifikasi email otomatis untuk alur kerja layanan survey menggunakan Brevo dan Cloud Functions.

## 1. Analisis Masalah
Saat ini, Cloud Function `sendSurveyStatusEmail` telah diimplementasikan di sisi server, namun belum terintegrasi dengan logika frontend. Notifikasi in-app sudah berjalan, tetapi pengguna (User) dan agen (Surveyor) memerlukan pemberitahuan melalui email untuk memastikan informasi penting (seperti penugasan baru atau jadwal yang diperbarui) tidak terlewatkan.

## 2. Dampak Perubahan
File yang akan dimodifikasi:
1.  `functions/public/notificationService.ts`: Menambahkan logika untuk memicu Cloud Function via `fetch`.
2.  `functions/public/components/admin/SurveyManagement.tsx`: Memastikan pemicu dipanggil saat Admin menetapkan agen atau melakukan reschedule.
3.  `functions/public/pages/AgentDashboard.tsx`: Memastikan pemicu dipanggil saat Agen mengubah status (misal: Menuju lokasi, Selesai).

## 3. Langkah-Langkah Eksekusi

### Tahap 1: Update Notification Service
- Modifikasi `notifySurveyStatusUpdate` di `notificationService.ts`.
- Tambahkan panggilan `fetch` ke endpoint: `https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendSurveyStatusEmail`.
- Logika pengiriman:
    - Jika status `ASSIGNED_TO_AGENT`: Kirim email ke Agen.
    - Jika status `AGENT_ASSIGNED`, `HEADING_TO_LOCATION`, `RESCHEDULED`, `COMPLETED`: Kirim email ke User.

### Tahap 2: Integrasi di Admin Dashboard (`SurveyManagement.tsx`)
- Saat Admin menugaskan agen (update `assigned_agent_id`), panggil `notifySurveyStatusUpdate(id, 'ASSIGNED_TO_AGENT')`.
- Saat Admin mengubah jadwal (reschedule), panggil `notifySurveyStatusUpdate(id, 'RESCHEDULED')`.

### Tahap 3: Integrasi di Agent Dashboard (`AgentDashboard.tsx`)
- Saat Agen mengklik "Otw Lokasi", panggil `notifySurveyStatusUpdate(id, 'HEADING_TO_LOCATION')`.
- Saat Agen menyelesaikan survey, panggil `notifySurveyStatusUpdate(id, 'COMPLETED')`.
- Saat Agen menerima tugas, panggil `notifySurveyStatusUpdate(id, 'AGENT_ASSIGNED')` (ini akan memberitahu User bahwa surveyor sudah ditemukan).

## 4. Rencana Verifikasi
1.  **Uji Penugasan**: Admin menugaskan agen -> Cek log Cloud Function untuk pengiriman email ke agen.
2.  **Uji Reschedule**: Admin mengubah tanggal/waktu -> Cek email masuk ke User.
3.  **Uji Alur Agen**: Agen klik OTW dan Selesai -> Cek email masuk ke User.
4.  **Logging**: Memastikan `console.log` di Cloud Functions menunjukkan status pengiriman dari Brevo (success/fail).
