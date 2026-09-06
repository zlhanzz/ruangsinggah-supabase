# IMPLEMENTATION PLAN - Alur Penugasan Surveyor KostManager (Tab Permintaan vs Aktif)

## Analisis Masalah
Saat Admin menugaskan agen surveyor untuk orderan pendataan KostManager:
1. **Penyebab Langsung Masuk ke Tab "Aktif"**:
   - Di `adminService.ts` (`updateKostManagerRequest`), saat admin menetapkan surveyor, status di tabel `kostmanager_surveys` disetel/di-insert langsung sebagai `'SURVEYING'` (karena batasan check constraint database terdahulu).
   - Pada fungsi `getAdminSurveyRequests()` di `adminService.ts`, pengecekan status mengevaluasi `ks.status === 'SURVEYING'` terlebih dahulu sebelum mengevaluasi status request `ks.request?.status === 'AGENT_ASSIGNED'`. Akibatnya, `computedStatus` selalu menjadi `'SURVEYING'`.
   - Di `AgentDashboard.tsx`, item dengan status `'SURVEYING'` secara otomatis disaring masuk ke tab **"Aktif"** (dengan label button *"SEDANG SURVEY"*), melewati tab **"Permintaan"** (*"Permintaan / AGENT_ASSIGNED"*).
2. **Kebutuhan Alur Bisnis yang Sebenarnya**:
   - Ketika Admin menugaskan agen (baik via tabel inline maupun modal edit kelola), status pesanan harus menjadi **`AGENT_ASSIGNED`** (Tugas Baru / Menunggu Konfirmasi Agen).
   - Di Dashboard Agen, tugas harus muncul pertama kali di tab **"Permintaan"** dengan 2 opsi tombol aksi:
     - **Tombol "⚡ Terima & Konfirmasi Pendataan"**: Mengubah status menjadi `SURVEYING` dan memindahkan tugas ke tab **"Aktif"** untuk mulai melakukan survei lokasi.
     - **Tombol "Tolak Tugas"**: Menghapus penugasan agen (`assigned_agent_id: null`), mengembalikan status pesanan di Admin menjadi `PENDING_ASSIGNMENT` (Menunggu Agen), dan menghapus item dari dashboard agen agar Admin dapat menugaskan surveyor lain.

---

## Dampak Perubahan
File yang akan dimodifikasi:
1. **`functions/public/adminService.ts`**:
   - `getAdminSurveyRequests()`: Memprioritaskan status `AGENT_ASSIGNED` dari `ks.request?.status` di atas `SURVEYING` sehingga penugasan baru selalu terbaca sebagai `AGENT_ASSIGNED` (masuk ke tab Permintaan).
   - `updateKostManagerRequest()`: Memastikan penugasan agen menetapkan status `AGENT_ASSIGNED` pada `kostmanager_requests`.
   - `updateSurveyRequest()`: Menambah failsafe lookup pada `kostmanager_surveys` (bisa dicari via `id` maupun `kostmanager_request_id`) dan memastikan alur konfirmasi (menjadi `SURVEYING`) serta penolakan tugas (hapus baris survei & reset request ke `PENDING_ASSIGNMENT`).
2. **`functions/public/components/admin/KostManagerManagement.tsx`**:
   - Memastikan saat Admin memilih agen pada modal edit (`handleUpdateStatusAndAgent`), status request diubah menjadi `AGENT_ASSIGNED` (bukan tetap `PENDING_ASSIGNMENT`).
3. **`functions/public/pages/AgentDashboard.tsx`**:
   - Memastikan sinkronisasi pemanggilan `updateSurveyRequest` saat tombol konfirmasi dan tolak tugas ditekan berjalan mulus dan me-refresh data secara instan.

---

## Langkah-Langkah Eksekusi
1. **Modifikasi `adminService.ts`**:
   - Pada `getAdminSurveyRequests()`, ubah urutan pengecekan status: letakkan pengecekan `AGENT_ASSIGNED` (pada `ks.request?.status` atau `ks.status`) sebelum `SURVEYING`.
   - Perbaiki `updateSurveyRequest()` agar mendukung lookup id fleksibel (`id` atau `kostmanager_request_id`).
2. **Modifikasi `KostManagerManagement.tsx`**:
   - Pastikan logic update modal penetapan agen mengarahkan status ke `AGENT_ASSIGNED`.
3. **Verifikasi & Uji Kompilasi**:
   - Jalankan `npm run build` untuk memastikan tidak ada error tipe data atau sintaks.
4. **Pencatatan Riwayat & Walkthrough**:
   - Catat progres di `functions/PROGRESS.md` dan susun panduan pengujian di `WALKTHROUGH.md`.

---

## Rencana Verifikasi
1. **Kompilasi TypeScript & Build Frontend**: Menjalankan `npm run build` (harus exit code 0).
2. **Skenario Penugasan Baru**:
   - Admin menetapkan agen pada pesanan KostManager di Dashboard Admin.
   - Login / buka Dashboard Agen dengan akun surveyor tersebut.
   - **Verifikasi**: Tugas muncul di tab **"Permintaan"** dengan badge *"TUGAS BARU (PERLU KONFIRMASI)"* dan tombol *"⚡ Terima & Konfirmasi Pendataan"* serta *"Tolak Tugas"*.
3. **Skenario Konfirmasi Agen**:
   - Agen mengklik *"⚡ Terima & Konfirmasi Pendataan"*.
   - **Verifikasi**: Tugas berpindah ke tab **"Aktif"** dengan status *"SEDANG SURVEY"*.
4. **Skenario Tolak Tugas**:
   - Agen mengklik *"Tolak Tugas"*.
   - **Verifikasi**: Tugas hilang dari Dashboard Agen dan status di Dashboard Admin kembali menjadi *"Menunggu Agen"* (`PENDING_ASSIGNMENT`).
