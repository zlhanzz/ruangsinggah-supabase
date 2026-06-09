# IMPLEMENTATION PLAN - Perbaikan Alur Reset Sandi (Password Recovery) v2

Rencana ini dibuat untuk memastikan alur reset kata sandi (password recovery) berjalan dengan benar. Sistem harus mendeteksi event `PASSWORD_RECOVERY` dari Supabase dan mengarahkan pengguna ke form penyetelan kata sandi baru (PASSWORD_UPDATE) alih-alih langsung masuk ke dashboard utama.

## 1. Analisis Masalah
- **Gejala**: Pengguna yang mengeklik tautan reset sandi di email langsung masuk ke akun mereka (logged in) dan diarahkan ke dashboard utama tanpa melihat halaman pengaturan kata sandi baru.
- **Penyebab**:
  1. Callback `onAuthStateChange` di `App.tsx` tidak menangani event `PASSWORD_RECOVERY`.
  2. Fungsi `fetchUserData` secara otomatis mengalihkan pengguna yang sudah memiliki sesi aktif di halaman `/login` ke dashboard masing-masing peran (`admin`, `owner`, `survey_agent`), sehingga formulir ubah sandi terlewati.
- **Solusi**:
  1. Intersepsi event `PASSWORD_RECOVERY` di `onAuthStateChange` pada `App.tsx` dan arahkan ke `/login?mode=recovery`.
  2. Modifikasi logika pengalihan di `fetchUserData` agar mengecualikan pengalihan ke dashboard jika query parameter `mode=recovery` sedang aktif.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/App.tsx`:
   - Tambahkan deteksi `PASSWORD_RECOVERY` di `onAuthStateChange`.
   - Modifikasi `fetchUserData` agar mengabaikan auto-redirect ke dashboard jika parameter `mode=recovery` ada di URL.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `App.tsx`**:
   - Sesuaikan bagian logika `onAuthStateChange` untuk menangkap `PASSWORD_RECOVERY`.
   - Sesuaikan pengkondisian redirect di `fetchUserData`.
2. **Kompilasi & Build Verifikasi**:
   - Jalankan `cmd.exe /c npm run build` di folder `functions/public` jika ingin memverifikasi frontend.
3. **Commit & Push**:
   - Push perubahan ke repositori git agar ter-deploy ke Cloudflare Pages.

## 4. Rencana Verifikasi
- Memastikan build lokal sukses.
- Memastikan ketika event `PASSWORD_RECOVERY` terpicu, pengguna dialihkan ke halaman reset password dengan status sesi aktif sehingga input password baru dapat dikirimkan dengan benar.
