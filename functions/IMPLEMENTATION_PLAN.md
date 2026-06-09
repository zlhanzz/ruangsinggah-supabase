# IMPLEMENTATION PLAN - Interseptor Redirect Verifikasi Email Registrasi (Auth)

Rencana ini dibuat untuk mengubah perilaku setelah user mengeklik link verifikasi email agar tidak langsung login otomatis, melainkan diarahkan ke halaman login untuk memasukkan email dan password secara manual.

## 1. Analisis Masalah
- **Gejala**: Ketika user mengeklik link verifikasi email, Supabase Auth (yang saat ini menggunakan alur PKCE) secara otomatis menukarkan kode verifikasi dengan sesi aktif (`?code=...`), memicu event `SIGNED_IN`, dan langsung meloginkan user ke dashboard.
- **Penyebab**: Kode interseptor saat ini di `App.tsx` hanya memeriksa status hash (`hash.includes('type=signup')`). Pada alur PKCE, parameter verifikasi dikirim melalui query parameters (`window.location.search` berupa `?code=...`), sehingga interseptor lama terlewati.
- **Solusi**: Memperbarui logika deteksi di `App.tsx` agar mendeteksi alur verifikasi email masuk dengan memeriksa apakah URL memiliki parameter `code` dan tidak sedang dalam mode pemulihan password (`mode=recovery`). Jika terdeteksi, pemicu akan melakukan `signOut()` secara otomatis dan mengalihkan pengguna ke `/login?verified=true` agar mereka harus memasukkan kredensial secara manual.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/App.tsx`:
   - Memperbarui kondisi pemeriksaan pada `supabase.auth.onAuthStateChange` agar mencakup query parameters (`window.location.search`) dan mengecualikan alur recovery.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi App.tsx**:
   - Ubah logika penanganan event `SIGNED_IN` di `onAuthStateChange` agar memeriksa:
     `hash.includes('type=signup') || search.includes('type=signup') || (search.includes('code=') && !search.includes('mode=recovery'))`
   - Pemicu ini akan menjalankan `signOut()` dan navigasi ke `/login?verified=true`.
2. **Kompilasi & Build Verifikasi**:
   - Jalankan `npm run build` di folder `functions/public` untuk memastikan kompilasi Vite sukses.

## 4. Rencana Verifikasi
- Menguji alur registrasi baru hingga menerima email, mengeklik link verifikasi, dan memastikan browser diarahkan ke halaman login dengan pesan sukses verifikasi, bukan langsung masuk ke dashboard.
