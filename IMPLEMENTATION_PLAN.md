# IMPLEMENTATION PLAN - Penyimpanan & Pembersihan Draf Database KostManager

Dokumen ini menjelaskan rencana perbaikan dan implementasi penyimpanan draf langsung ke database Supabase beserta sistem pembersihan draf otomatis (draft cleaner) berbasis backend cron job/schedule.

---

## 1. Analisis Masalah & Tujuan

### Masalah:
* Penyimpanan draf sebelumnya hanya berbasis `localStorage` lokal. Data rentan hilang jika surveyor berpindah peramban atau membersihkan cache.
* Dengan dialihkannya draf ke database Supabase, data draf yang mangkrak/tidak selesai berpotensi menjadi sampah (clutter) yang mengotori database jika dibiarkan selamanya.

### Tujuan:
* **Penyimpanan Draf**: Mengupsert draf survei secara instan ke tabel `properties` (status `'draft'`) dan tabel `mitra_kostmanager` secara online di Supabase.
* **Pembersihan Draf**: Membuat sistem pembersih otomatis (cron job) yang berjalan setiap 24 jam untuk menghapus draf properti KostManager yang tidak aktif melewati periode waktu tertentu (misal: 30 hari).
* **Keamanan Data**: Menjamin pembersihan **hanya** menghapus draf mangkrak yang belum pernah disetujui (unapproved/unverified) dan tidak menyentuh properti aktif, properti nonaktif (namun sudah pernah publish), maupun properti Mitra Biasa.

---

## 2. Dampak Perubahan
File yang disentuh:
1. [`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)
2. [`functions/src/index.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/src/index.ts)

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Implementasi Penyimpanan Draf di Frontend (`AgentDashboard.tsx`)
* Tambahkan `handleSaveDraftDirectly` dan `closeKostManagerListingWithSave`.
* Integrasikan auto-save otomatis pada transisi step, penutupan modal, dan saat kamar baru berhasil disimpan.
* Lakukan restorasi kamar otomatis dari database ke state lokal jika terdeteksi draf lokal kosong.

### Langkah 2: Buat Fungsi Pembersih Backend di Cloud Functions (`index.ts`)
* Impor modul scheduler dari Firebase Functions v2 (`onSchedule`).
* Implementasikan core cleaning logic `cleanExpiredDraftsCore` dengan filter ketat:
  1. `properties.status = 'draft'`
  2. `properties.is_managed = true`
  3. `properties.is_verified = false` (belum terverifikasi oleh admin)
  4. `properties.updated_at < threshold_date` (lebih tua dari 30 hari)
  5. Periksa relasi `kostmanager_requests` untuk memastikan tidak ada request dengan status `'APPROVED'` atau `'COMPLETED'`.
* Daftarkan fungsi terjadwal `scheduledCleanExpiredDrafts` (berjalan setiap 24 jam).
* Daftarkan HTTP trigger `triggerCleanExpiredDrafts` agar administrator dapat memicu pembersihan secara manual via URL / curl dengan parameter hari opsional (`?days=X`).

---

## 4. Rencana Verifikasi
1. **Verifikasi Kompilasi Backend & Frontend**:
   * Jalankan `npm run build` di folder `functions` untuk memverifikasi kesuksesan kompilasi Typescript backend.
   * Jalankan `npm run build` di folder `functions/public` untuk memverifikasi kesuksesan kompilasi Vite frontend.
2. **Uji Coba Fungsionalitas**:
   * Panggil endpoint HTTP trigger secara manual untuk menguji proses pemindaian draf usang.
