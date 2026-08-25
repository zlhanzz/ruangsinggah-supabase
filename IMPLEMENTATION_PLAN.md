# IMPLEMENTATION PLAN - Perbaikan Peringatan Peninjauan Ulang Data KostManager & Pembersihan URL Parameter

Dokumen ini menjelaskan rencana perbaikan agar:
1. Peringatan peninjauan ulang data (*warning overlay*) selalu muncul secara konsisten saat agen survey pertama kali membuka form pendataan KostManager hasil migrasi, baik saat dimuat dari tabel `mitra_kostmanager` maupun dari draf `localStorage`.
2. Parameter pencarian URL `onboarding_id` dibersihkan dengan benar saat form pendataan KostManager ditutup agar route URL kembali bersih.

## 1. Analisis Masalah
- **Warning Overlay & Draf**: Peringatan tidak dipicu secara otomatis pada loader database utama (`mitra_kostmanager`) dan state-nya hilang ketika memulihkan draf dari `localStorage`. Selain itu, query properties rentan terhadap error sintaks database `22P02` karena ketidakcocokan tipe UUID.
- **URL Parameter Tertinggal**: Saat memanggil `setSearchParams({ status: agentTab })` untuk menutup modal, terjadi balapan state (*race condition*) atau ketidakefektifan pembuangan parameter tambahan di browser. Cara paling aman dan dijamin 100% adalah memodifikasi objek `URLSearchParams` secara terprogram dengan memanggil `params.delete('onboarding_id')` kemudian memperbarui state.

## 2. Dampak Perubahan
File yang akan tersentuh:
- [`functions/scratch/fix_missing_states_and_uuid.js`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/scratch/fix_missing_states_and_uuid.js) (Skrip scratch pemicu modifikasi).
- [`functions/public/pages/AgentDashboard.tsx`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) (File komponen utama dashboard agen yang diregenerasi).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `fix_missing_states_and_uuid.js`**:
   - Menambahkan **FIX 13**: Memperbarui fungsi `closeKostManagerListing` agar memanggil `.delete('onboarding_id')` pada instansi `URLSearchParams` secara eksplisit sebelum memanggil `setSearchParams(params)`.
   - Menambahkan **FIX 14**: Memperbarui callback pembersihan status pencarian setelah `handleSaveKostManagerListing` berhasil disimpan/draft.
2. **Eksekusi Pembangunan Ulang**:
   - Menjalankan `node functions/scratch/reapply_all_changes_chronologically.js` untuk menerapkan seluruh modifikasi ke file `AgentDashboard.tsx`.
3. **Verifikasi Build**:
   - Melakukan kompilasi produksi `npm run build` untuk memastikan tidak ada kesalahan sintaks JSX.

## 4. Rencana Verifikasi
- Memeriksa file `AgentDashboard.tsx` pasca regenerasi untuk memastikan `params.delete('onboarding_id')` disuntikkan dengan benar.
- Memastikan build berhasil dikompilasi tanpa error.
