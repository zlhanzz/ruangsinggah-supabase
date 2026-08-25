# WALKTHROUGH - Penyimpanan & Pembersihan Draf Database KostManager

Dokumen ini menjelaskan daftar perubahan, hasil pengujian, dan instruksi deploy untuk memindahkan arsitektur draf dari local storage peramban langsung ke database Supabase, serta menambahkan sistem pembersihan draf otomatis (draft cleaner) berbasis backend cron job/schedule.

---

## 1. Daftar Perubahan (List of Changes)

### A. Helper Fungsi Penyimpanan Draf Database
* **File**: [`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)
* **Perubahan**:
  * Menambahkan fungsi `handleSaveDraftDirectly` yang bertugas untuk melakukan upsert secara instan ke tabel `properties` (dengan status `'draft'`) dan tabel `mitra_kostmanager` berdasarkan form state yang dikirimkan.
  * Menambahkan fungsi `closeKostManagerListingWithSave` yang secara otomatis memanggil `handleSaveDraftDirectly` untuk mengamankan data survei terbaru ke database sebelum state lokal di-reset dan dibersihkan.
  * **Perbaikan Constraint**: Menyertakan `mitra_id` (sama dengan `owner_uid`) pada seluruh payload penyimpanan `properties` untuk menghindari kegagalan *constraint not-null* (`code: '23502'`) ketika membuat listing properti baru dari draf.

### B. Integrasi Auto-Save pada Siklus Transisi
* **File**: [`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)
* **Perubahan**:
  * **Tombol Close/Keluar**: Semua event penutupan modal (backdrop overlay click, tombol "Keluar" di warning modal, tombol silang `X` di header, dan tombol "Keluar" di footer Step 1) kini memanggil `closeKostManagerListingWithSave` untuk auto-save sebelum keluar.
  * **Perpindahan Step**: Navigasi transisi langkah (tombol "Lanjut ke Step 2", "Kembali ke Step 1", "Lanjut ke Step 3", "Kembali ke Step 2", dan tombol back arrow di header) kini memicu penyimpanan draf secara asinkron ke database sebelum melangkah ke step berikutnya.
  * **Penambahan Kamar**: Tombol "Simpan Kamar Baru" kini memicu penyimpanan draf database instan dengan form data yang baru ditambahkan untuk mencegah data hilang akibat close tiba-tiba setelah input kamar.

### C. Restorasi Otomatis (Auto-Heal) Kamar dari Database
* **File**: [`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)
* **Perubahan**:
  * Ketika onboarding dibuka kembali, sistem memeriksa draf lokal. Jika draf lokal memiliki array kamar kosong (`roomTypes.length === 0`), sistem secara cerdas akan menarik kembali data kamar asli dari database (`dbKmProp.room_types`) dan menggabungkannya ke draf lokal agar data kamar tidak terbuang.

### E. Sistem Pembersih Draf Otomatis (Backend Scheduler & HTTP Trigger)
* **File**: [`functions/src/index.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/src/index.ts)
* **Perubahan**:
  * Menambahkan fungsi inti `cleanExpiredDraftsCore(daysThreshold)` untuk menyaring draf usang:
    1. Memilih properti di mana `status = 'draft'` dan `is_managed = true` dan `is_verified = false`.
    2. Menyaring properti yang tidak aktif berdasarkan batas hari non-aktif (`updated_at < thresholdDate`).
    3. Melakukan pemeriksaan ke tabel `kostmanager_requests` untuk memastikan properti tersebut **tidak pernah memiliki request** dengan status `'APPROVED'` atau `'COMPLETED'`. Hal ini menjamin properti aktif, properti publish, atau properti yang pernah publish TIDAK akan pernah terhapus.
    4. Menghapus properti yang lolos filter (karena hubungan constraint `ON DELETE CASCADE`, baris terkait di tabel `mitra_kostmanager` dan `rooms` otomatis terhapus bersih).
  * Menambahkan `scheduledCleanExpiredDrafts` menggunakan Firebase scheduler v2 (`onSchedule`) untuk menjalankan pembersihan otomatis setiap 24 jam.
  * Menambahkan `triggerCleanExpiredDrafts` menggunakan HTTP onRequest handler agar administrator dapat memicu pembersihan draf usang secara manual melalui pemanggilan URL (contoh: `triggerCleanExpiredDrafts?days=30`).

---

## 2. Hasil Pengujian (Test Results)

1. **Pengujian Persistensi Kamar**:
   * Surveyor membuka form onboarding, menambahkan 1 kamar baru, lalu langsung menutup form (mengklik area hitam di luar modal).
   * Saat form dibuka kembali, data kamar tersebut **langsung terisi kembali dengan sempurna** karena draf berhasil ditarik langsung dari database.
2. **Uji Coba Kompilasi Backend & Frontend**:
   * Proses kompilasi Typescript backend (`tsc`) berhasil 100% tanpa error.
   * Proses kompilasi Vite frontend (`npm run build`) berhasil 100% tanpa error.

---

## 3. Petunjuk Deploy (Deployment Instructions)

Silakan jalankan perintah manual berikut di terminal Anda untuk mendorong perubahan ke GitHub:

```bash
git add .
git commit -m "feat: implementasi draf database kostmanager dan sistem cleanExpiredDrafts backend scheduler"
git push origin bukan-productions
```
