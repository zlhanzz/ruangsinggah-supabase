# IMPLEMENTATION PLAN - Interseptor Redirect Verifikasi Email Registrasi (Auth) v2

Rencana ini dibuat untuk memperbaiki deteksi alur verifikasi email agar berjalan sempurna pada Supabase PKCE flow dengan menangkap parameter URL di awal waktu muat (load time).

## 1. Analisis Masalah
- **Gejala**: Ketika user mengeklik link verifikasi email, mereka masih langsung masuk ke dashboard secara otomatis (interseptor gagal mendeteksi parameter verifikasi).
- **Penyebab**: Library `supabase-js` secara otomatis menghapus parameter query `code` dari URL (`window.location.search`) saat inisialisasi sesi sebelum event listener `onAuthStateChange` dipanggil. Oleh karena itu, saat event `SIGNED_IN` dipicu, parameter `code` sudah kosong.
- **Solusi**: Menyimpan parameter `window.location.search` dan `window.location.hash` pada tingkat modul/file (saat aplikasi pertama kali dimuat di browser), kemudian menggunakan nilai yang disimpan tersebut di dalam callback `onAuthStateChange`.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/App.tsx`:
   - Menyimpan `window.location.search` dan `window.location.hash` ke variabel konstan di luar siklus React.
   - Menggunakan konstanta tersebut untuk memeriksa kondisi interseptor.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi App.tsx**:
   - Deklarasikan konstanta deteksi di bagian atas file (di luar komponen `App`):
     ```typescript
     const initialSearch = window.location.search;
     const initialHash = window.location.hash;
     const isSignupConfirmation = initialHash.includes('type=signup') || 
       initialSearch.includes('type=signup') || 
       (initialSearch.includes('code=') && !initialSearch.includes('mode=recovery'));
     ```
   - Di dalam `onAuthStateChange`, ganti kondisi pengecekan lama menjadi:
     ```typescript
     if (event === 'SIGNED_IN' && isSignupConfirmation) {
       await supabase.auth.signOut();
       navigate('/login?verified=true', { replace: true });
       return;
     }
     ```
2. **Kompilasi & Build Verifikasi**:
   - Jalankan `cmd.exe /c npm run build` di folder `functions/public`.

## 4. Rencana Verifikasi
- Melakukan verifikasi build lokal sukses.
- Push kode ke GitHub, tunggu deploy Cloudflare Pages, lalu uji verifikasi email.
