# IMPLEMENTATION PLAN - Perbaikan Peringatan Peninjauan Ulang Data KostManager, Pembersihan URL Parameter, & CSS Layout Shift Ikon

Dokumen ini menjelaskan rencana perbaikan agar:
1. Peringatan peninjauan ulang data (*warning overlay*) selalu muncul secara konsisten saat agen survey pertama kali membuka form pendataan KostManager hasil migrasi.
2. Parameter pencarian URL `onboarding_id` dibersihkan dengan benar saat form pendataan KostManager ditutup.
3. Menghilangkan visual FOUT (*Flash of Unstyled Text*) teks ligatur ikon Google Fonts yang merusak tata letak saat awal refresh halaman.

## 1. Analisis Masalah
- **Warning Overlay & Draf**: Peringatan tidak dipicu secara otomatis pada loader database utama (`mitra_kostmanager`) dan draf.
- **URL Parameter Tertinggal**: Parameter `onboarding_id` tetap berada di URL setelah form ditutup karena race condition state.
- **FOUT / Layout Shift Ikon**: Sebelum berkas web font Google Icons selesai diunduh di awal muatan halaman (refresh), browser menampilkan teks ligatur mentah seperti `"calendar_today"`, `"schedule"`, `"bolt"`, `"phone"` di dalam UI. Hal ini melebarkan kontainer ikon dan menggeser teks-teks pendukung di sebelahnya ke kanan, menciptakan kesan visual yang hancur.

## 2. Dampak Perubahan
File yang akan tersentuh:
- [`functions/scratch/fix_missing_states_and_uuid.js`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/scratch/fix_missing_states_and_uuid.js) (Skrip scratch pemicu modifikasi).
- [`functions/public/pages/AgentDashboard.tsx`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) (File komponen utama dashboard agen yang diregenerasi).
- [`functions/public/index.css`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/index.css) (CSS global).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `fix_missing_states_and_uuid.js`**:
   - Menambahkan **FIX 13**: URL parameter cleanup pada `closeKostManagerListing`.
   - Menambahkan **FIX 14**: URL parameter cleanup pada simpan sukses `handleSaveKostManagerListing`.
2. **Modifikasi `index.css`**:
   - Menambahkan CSS rule anti-layout shift untuk `.material-symbols-outlined`, `.material-icons`, `.material-icons-outlined` agar memotong teks ligatur yang belum dimuat dengan properti `width: 1em`, `height: 1em`, dan `overflow: hidden`.
3. **Eksekusi Pembangunan Ulang**:
   - Menjalankan `node functions/scratch/reapply_all_changes_chronologically.js`.
4. **Verifikasi Build**:
   - Melakukan kompilasi produksi `npm run build`.

## 4. Rencana Verifikasi
- Memastikan tidak ada layout shift pada ikon-ikon kartu saat refresh peramban dilakukan.
- Memastikan build berhasil dikompilasi tanpa error.
