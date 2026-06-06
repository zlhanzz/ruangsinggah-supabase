# WALKTHROUGH - Perbaikan Status Pesanan Survey yang Reset Kembali ke Diajukan

Dokumen ini mendokumentasikan perubahan yang telah dilakukan untuk menyelesaikan masalah di mana status pesanan survey yang sudah aktif/selesai ter-reset kembali ke status `'PENDING_ASSIGNMENT'` (kembali ke tab Diajukan) secara otomatis ketika pengguna memuat halaman "Kost Saya".

## 1. Daftar Perubahan
### Sinkronisasi Backend/Admin (`functions/public/adminService.ts`)
- **Perbaikan Logika `targetStatus` pada `syncSurveyRequest`**:
  - Mengubah logika penetapan status agar mempertahankan status yang sudah ada (`existing.status`) dari database jika record survey sudah terbentuk, alih-alih selalu memaksa status kembali ke `'PENDING_ASSIGNMENT'` setiap kali transaksi berstatus PAID disinkronisasi.
  - Sekarang, status `'PENDING_ASSIGNMENT'` hanya diberikan jika pesanan survey baru dibuat pertama kali atau jika status sebelumnya masih `'AWAITING_PAYMENT'`.

## 2. Hasil Pengujian
- **Keberhasilan Kompilasi**:
  - Proyek telah dibangun untuk lingkungan produksi menggunakan `npm run build` dan berhasil tanpa kesalahan kompilasi/type-checking.
- **Analisis Alur Eksekusi**:
  - Saat `autoSyncAllSurveys` dijalankan di background (ketika pengguna memuat "Kost Saya"), status pesanan survey yang sudah dikonfirmasi oleh agen surveyor (seperti `'AGENT_ASSIGNED'`, `'SURVEYING'`, `'REPORT_SUBMITTED'`, atau `'COMPLETED'`) tidak akan ditimpa kembali menjadi `'PENDING_ASSIGNMENT'`.
  - Hal ini menjamin pesanan survey tetap berada di tab yang semestinya (Aktif/Riwayat) dan tidak berulang kali kembali ke tab Diajukan.

## 3. Petunjuk Deploy / Menjalankan Aplikasi
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
