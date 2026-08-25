# IMPLEMENTATION PLAN - Perbaikan Peringatan Peninjauan Ulang Data KostManager

Dokumen ini menjelaskan rencana perbaikan agar peringatan peninjauan ulang data (*warning overlay*) selalu muncul secara konsisten saat agen survey pertama kali membuka form pendataan KostManager hasil migrasi, baik saat dimuat dari tabel `mitra_kostmanager` maupun dari draf `localStorage`.

## 1. Analisis Masalah
Saat ini, peringatan peninjauan ulang data (*warning overlay*) hanya disetel aktif (`setIsExistingPropertyMigration(true)` dan `setWarningAccepted(false)`) pada skenario fallback kueri dari tabel `properties` (`existingProp` ditemukan). Namun, pada skenario loading utama:
- **Dedicated `mitra_kostmanager`**: Saat record kost manager ditemukan di tabel `mitra_kostmanager` (`kmProp`), status `isExistingPropertyMigration` tidak pernah disetel ke `true`. Akibatnya, peringatan tidak muncul saat pembukaan pertama draf database.
- **Draf `localStorage`**: State `isExistingPropertyMigration` dan `warningAccepted` tidak disimpan ke dalam `draftData`. Sehingga ketika agen membuka ulang draf yang tersimpan di browser, state tersebut ter-reset dan overlay-nya menghilang secara instan.

## 2. Dampak Perubahan
File yang akan tersentuh:
- [`functions/scratch/fix_missing_states_and_uuid.js`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/scratch/fix_missing_states_and_uuid.js) (Skrip scratch pemicu modifikasi state).
- [`functions/public/pages/AgentDashboard.tsx`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) (File komponen utama dashboard agen yang diregenerasi).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `fix_missing_states_and_uuid.js`**:
   - Menambahkan **FIX 8**: Memodifikasi blok `if (kmProp)` di fungsi `openKostManagerListing` agar menyetel `setIsExistingPropertyMigration(true)` dan `setWarningAccepted(false)` apabila terindikasi memuat data properti lama.
   - Menambahkan **FIX 9**: Memperbarui draf saver KostManager (`useEffect` auto-save) agar menyertakan status `isExistingPropertyMigration` dan `warningAccepted` di dalam objek `draftData`.
   - Menambahkan **FIX 10**: Memperbarui loader draf `localStorage` (`savedDraft` check) agar memuat kembali status `isExistingPropertyMigration` dan `warningAccepted` dari file parser.
2. **Eksekusi Pembangunan Ulang**:
   - Menjalankan `node functions/scratch/reapply_all_changes_chronologically.js` untuk menerapkan modifikasi secara urut ke file `AgentDashboard.tsx`.
3. **Verifikasi Build**:
   - Melakukan kompilasi produksi `npm run build` untuk memastikan tidak ada kesalahan sintaks JSX.

## 4. Rencana Verifikasi
- Memeriksa file `AgentDashboard.tsx` pasca regenerasi untuk memastikan `setIsExistingPropertyMigration` telah disetel pada pemuatan `kmProp` dan `savedDraft`.
- Memastikan build berhasil dikompilasi tanpa error esbuild.
